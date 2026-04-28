import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { socket } from './useSocket';
import useAppStore from '../store/useAppStore';
import useCallStore from '../store/useCallStore';

/**
 * Subscribes the app to the real-time notification stream.
 *
 * Three socket events drive the UX:
 *   receive-notification  — generic notification (message / mention /
 *                           call / missed-call). Adds to the bell list and
 *                           may toast. Suppressed when the user is already
 *                           viewing the originating channel.
 *   incoming-call         — transient ring; opens the Accept/Reject modal
 *                           in CallStore. Auto-dismisses if the user is
 *                           already in the call.
 *   call:ring-stopped     — the ring was answered or timed out — close the
 *                           modal if it's still up.
 *
 * Mount once near the dashboard root. The hook is a no-op when the user
 * isn't authenticated (socket has no user_<id> room joined).
 */
const NOTIFICATION_SOUND = '/sounds/notify.mp3';
const RING_SOUND = '/sounds/ring.mp3';

const tryPlay = (src, volume = 0.5) => {
  try {
    const a = new Audio(src);
    a.volume = volume;
    // play() returns a promise; ignore rejection (autoplay policy).
    a.play().catch(() => { /* user hasn't interacted yet */ });
    return a;
  } catch { return null; }
};

const useNotifications = () => {
  const location = useLocation();
  const pushNotification = useAppStore((s) => s.pushNotification);
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);
  const clearIncomingCall = useCallStore((s) => s.clearIncomingCall);

  // Latest pathname kept in a ref so the socket listener (registered once)
  // always sees the current route without reattaching.
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    const onNotification = (notif) => {
      if (!notif) return;
      const channelId = notif.meta?.channelId;
      const isViewingChannel =
        channelId && pathRef.current.includes(`/channel/${channelId}`);

      // Suppress plain message notifications while the user is in the
      // channel — they already saw the message land. Mentions and calls
      // always notify, even in-channel.
      if (notif.type === 'message' && isViewingChannel) {
        // Still update the bell list so the user has history.
        if (!notif.transient) pushNotification(notif);
        return;
      }

      // Add to bell list (skip transient by design — it's a fire-and-forget).
      if (!notif.transient) pushNotification(notif);

      // Toast — keep style minimal, lean on react-hot-toast defaults.
      const title = notif.content || 'New notification';
      const opts  = { duration: 4000, position: 'top-right' };
      if (notif.type === 'mention') {
        toast(`💬 ${title}`, { ...opts, duration: 6000 });
        tryPlay(NOTIFICATION_SOUND, 0.6);
      } else if (notif.type === 'missed-call') {
        toast(`📞 ${title}`, opts);
      } else if (notif.type === 'call') {
        // Real-time ring is handled by `incoming-call` below — this is the
        // persisted bell entry, no toast needed (avoid double-alert).
      } else {
        toast(title, opts);
        tryPlay(NOTIFICATION_SOUND, 0.4);
      }
    };

    const onIncomingCall = (payload) => {
      // If the user is already in the call (we joined fast), skip the modal.
      const callStore = useCallStore.getState();
      if (callStore.isInCall && callStore.channelId === payload.channelId) return;
      setIncomingCall(payload);
      // Looping ring sound while modal is up. Stops on accept/reject/timeout.
      const audio = tryPlay(RING_SOUND, 0.7);
      if (audio) {
        audio.loop = true;
        callStore._ringAudio = audio; // stash on store for stopping later
      }
    };

    const onRingStopped = ({ channelId }) => {
      const cs = useCallStore.getState();
      if (cs.incomingCall?.channelId === channelId) {
        clearIncomingCall();
      }
    };

    socket.on('receive-notification', onNotification);
    socket.on('incoming-call', onIncomingCall);
    socket.on('call:ring-stopped', onRingStopped);
    socket.on('call:rejected', onRingStopped);

    return () => {
      socket.off('receive-notification', onNotification);
      socket.off('incoming-call', onIncomingCall);
      socket.off('call:ring-stopped', onRingStopped);
      socket.off('call:rejected', onRingStopped);
    };
  }, [pushNotification, setIncomingCall, clearIncomingCall]);
};

export default useNotifications;
