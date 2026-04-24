import { useEffect } from 'react';
import { Phone, PhoneCall, Loader2 } from 'lucide-react';
import useCallStore from '../../store/useCallStore';
import toast from 'react-hot-toast';

/**
 * CallBar — header-level call CTA for a channel.
 *   - If no active call in the channel → "Start Call"
 *   - If a call is active (participant count > 0) and user is NOT in it → "Join Call"
 *   - If user IS in this channel's call → "In call" indicator (disabled)
 *
 * Room-state is driven by the server's `call:room-state` broadcast to the
 * channel room (the chat room the user is already in).
 */

const CallBar = ({ channelId }) => {
  const { isInCall, channelId: activeChannelId, roomStates, queryRoomState, initRoomStateListener, startCall } = useCallStore();

  // Ensure listener is attached exactly once and ask for current count.
  useEffect(() => {
    initRoomStateListener();
  }, [initRoomStateListener]);

  useEffect(() => {
    if (channelId) queryRoomState(channelId);
  }, [channelId, queryRoomState]);

  if (!channelId) return null;

  const count = roomStates[channelId] || 0;
  const meInThisCall = isInCall && activeChannelId === channelId;
  const callActive = count > 0;
  // Count is already inclusive of me when I'm in this call, so subtract for label clarity.
  const othersCount = meInThisCall ? Math.max(0, count - 1) : count;

  const handleClick = async () => {
    if (meInThisCall) return;
    if (isInCall && activeChannelId !== channelId) {
      toast.error('Leave your current call first');
      return;
    }
    try {
      await startCall(channelId);
    } catch (err) {
      toast.error(err?.message || 'Could not start call');
    }
  };

  // Visual state
  if (meInThisCall) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold">
        <Loader2 size={12} className="animate-spin" /> In call
      </span>
    );
  }

  if (callActive) {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors active:scale-95"
        title="Join active call"
      >
        <PhoneCall size={14} /> Join call
        <span className="text-[10px] bg-white/20 rounded px-1 py-px">{othersCount}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors active:scale-95"
      title="Start a call in this channel"
    >
      <Phone size={14} /> Start call
    </button>
  );
};

export default CallBar;
