/**
 * Mesh WebRTC call store.
 *
 * Architecture:
 *   - One RTCPeerConnection per remote participant (mesh).
 *   - RTCPeerConnection and MediaStream objects live in a module-level map (`peers`)
 *     so mutating them does not trigger re-renders. React reads UI-facing state
 *     (tiles, mic/cam flags, active speaker) from the Zustand store.
 *   - Signaling goes over the app's existing Socket.IO connection.
 *
 * Signaling (matches backend/src/sockets/callHandler.js):
 *   Server → Client:
 *     call:participants   existing members list when we join; we do NOT proactively
 *                         create offers — existing peers will offer to us.
 *     call:user-joined    a new peer joined → we (existing member) create an offer.
 *     call:user-left      cleanup peer connection.
 *     call:offer / answer / ice-candidate   standard WebRTC relays.
 *     call:room-state     count broadcast to the channel so non-participants see
 *                         "call active" and can join.
 */

import { create } from 'zustand';
import { socket } from '../hooks/useSocket';

// ---- WebRTC configuration ----
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ---- Module-level, non-reactive peer state ----
// peerConns: Map<remoteSocketId, RTCPeerConnection>
const peerConns = new Map();
// Local MediaStream (camera + mic) — mirrored into Zustand for tiles.
let localMediaStream = null;
// Active-speaker polling timer
let speakerTimer = null;
// Signaling listener references so we can cleanly remove them on leave
let signalingListeners = null;

/* ---------------- helpers ---------------- */

const safeGetUserMedia = async () => {
  try {
    return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (err) {
    // If camera is unavailable try audio only, then rethrow if that fails too.
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      return s;
    } catch {
      throw err;
    }
  }
};

// Safely update a single peer's entry in the UI peers map.
const patchPeer = (set, get, socketId, patch) => {
  const curr = get().peers[socketId] || {};
  set({ peers: { ...get().peers, [socketId]: { ...curr, ...patch } } });
};

const removePeer = (set, get, socketId) => {
  const { [socketId]: _, ...rest } = get().peers;
  set({ peers: rest });
};

/* ---------------- Zustand store ---------------- */

const useCallStore = create((set, get) => ({
  // UI-facing state
  isInCall: false,
  channelId: null,
  // peers: { [remoteSocketId]: { userId, name, avatar, stream, connectionState, audioLevel } }
  peers: {},
  // local stream version counter — bumped when the local track changes (e.g. mute, screen share)
  // so video tiles re-render.
  localStreamTick: 0,
  micOn: true,
  camOn: true,
  screenOn: false,
  // socketId of the loudest speaker in the last poll, or null
  activeSpeakerSocketId: null,
  // Map of channelId → active participant count; populated from call:room-state broadcasts.
  roomStates: {},

  getLocalStream: () => localMediaStream,

  /* ---------------- subscribe to room-state broadcasts (always on) ---------------- */
  initRoomStateListener: () => {
    // idempotent — guard against double wiring
    if (get()._roomStateWired) return;
    set({ _roomStateWired: true });
    socket.on('call:room-state', ({ channelId, count }) => {
      set({ roomStates: { ...get().roomStates, [channelId]: count } });
    });
  },

  queryRoomState: (channelId) => {
    if (!channelId) return;
    socket.emit('call:query', { channelId });
  },

  /* ---------------- join / start call ---------------- */
  startCall: async (channelId) => {
    if (get().isInCall) {
      // already in a call — switching channels while in call is not supported here
      if (get().channelId === channelId) return;
      await get().leaveCall();
    }

    // Acquire media first; fail fast if user denies permission.
    let stream;
    try {
      stream = await safeGetUserMedia();
    } catch (err) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Camera/microphone permission denied'
        : 'Could not access camera/microphone';
      throw new Error(msg);
    }
    localMediaStream = stream;

    const hasVideo = stream.getVideoTracks().length > 0;
    const hasAudio = stream.getAudioTracks().length > 0;

    set({
      isInCall: true,
      channelId,
      peers: {},
      micOn: hasAudio,
      camOn: hasVideo,
      screenOn: false,
      activeSpeakerSocketId: null,
      localStreamTick: get().localStreamTick + 1,
    });

    // Wire signaling events, then emit join.
    _attachSignalingListeners(set, get);
    socket.emit('call:join', { channelId });

    // Start active-speaker polling (2 Hz)
    _startSpeakerPolling(set, get);
  },

  /* ---------------- leave ---------------- */
  leaveCall: async () => {
    const { channelId } = get();
    if (!get().isInCall) return;

    socket.emit('call:leave', { channelId });

    _stopSpeakerPolling();
    _detachSignalingListeners();

    // Close every peer connection & clear state.
    for (const [sid, pc] of peerConns.entries()) {
      try { pc.close(); } catch { /* noop */ }
      peerConns.delete(sid);
    }

    if (localMediaStream) {
      localMediaStream.getTracks().forEach((t) => { try { t.stop(); } catch { /* noop */ } });
      localMediaStream = null;
    }

    set({
      isInCall: false,
      channelId: null,
      peers: {},
      micOn: true,
      camOn: true,
      screenOn: false,
      activeSpeakerSocketId: null,
      localStreamTick: get().localStreamTick + 1,
    });
  },

  /* ---------------- controls ---------------- */
  toggleMic: () => {
    if (!localMediaStream) return;
    const next = !get().micOn;
    localMediaStream.getAudioTracks().forEach((t) => { t.enabled = next; });
    set({ micOn: next });
  },

  toggleCam: () => {
    if (!localMediaStream) return;
    const next = !get().camOn;
    localMediaStream.getVideoTracks().forEach((t) => { t.enabled = next; });
    set({ camOn: next, localStreamTick: get().localStreamTick + 1 });
  },

  toggleScreen: async () => {
    if (get().screenOn) {
      // Stop screen share — restore camera track on all peers.
      const cameraTrack = localMediaStream?.getVideoTracks?.()[0] || null;
      for (const pc of peerConns.values()) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
      }
      set({ screenOn: false, localStreamTick: get().localStreamTick + 1 });
      return;
    }

    // Start screen share.
    let display;
    try {
      display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    } catch {
      return; // user cancelled
    }
    const screenTrack = display.getVideoTracks()[0];
    if (!screenTrack) return;

    for (const pc of peerConns.values()) {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(screenTrack);
    }

    // Temporarily swap the local video track so the self-tile shows the shared screen.
    const originalCameraTrack = localMediaStream?.getVideoTracks?.()[0];
    if (localMediaStream && originalCameraTrack) {
      localMediaStream.removeTrack(originalCameraTrack);
      localMediaStream.addTrack(screenTrack);
    }

    // When the user stops from the browser's native UI, restore.
    screenTrack.onended = () => {
      if (originalCameraTrack && localMediaStream) {
        localMediaStream.removeTrack(screenTrack);
        localMediaStream.addTrack(originalCameraTrack);
      }
      for (const pc of peerConns.values()) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && originalCameraTrack) sender.replaceTrack(originalCameraTrack);
      }
      set({ screenOn: false, localStreamTick: get().localStreamTick + 1 });
    };

    set({ screenOn: true, localStreamTick: get().localStreamTick + 1 });
  },
}));

/* ---------------- internals (live in module scope) ---------------- */

function _createPeerConnection(remoteSocketId, remoteMeta, set, get) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  peerConns.set(remoteSocketId, pc);

  // Add our local tracks so the remote can receive us.
  if (localMediaStream) {
    localMediaStream.getTracks().forEach((track) => {
      pc.addTrack(track, localMediaStream);
    });
  }

  // Remote track(s) arriving — bind to the UI tile.
  pc.ontrack = (ev) => {
    const stream = ev.streams[0];
    patchPeer(set, get, remoteSocketId, { stream });
  };

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      socket.emit('call:ice-candidate', {
        toSocketId: remoteSocketId,
        candidate: ev.candidate,
      });
    }
  };

  pc.onconnectionstatechange = () => {
    patchPeer(set, get, remoteSocketId, { connectionState: pc.connectionState });
    if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
      // Remote will emit call:user-left on graceful disconnects; fail-safe cleanup:
      setTimeout(() => {
        if (peerConns.get(remoteSocketId) === pc && ['failed', 'closed'].includes(pc.connectionState)) {
          try { pc.close(); } catch { /* noop */ }
          peerConns.delete(remoteSocketId);
          removePeer(set, get, remoteSocketId);
        }
      }, 3000);
    }
  };

  // Seed UI with the meta so the tile name/avatar render immediately (before media).
  patchPeer(set, get, remoteSocketId, {
    userId: remoteMeta.userId,
    name: remoteMeta.name,
    avatar: remoteMeta.avatar,
    stream: null,
    connectionState: pc.connectionState,
  });

  return pc;
}

function _attachSignalingListeners(set, get) {
  if (signalingListeners) return; // already attached

  // 1) Existing participants snapshot (we just joined) — do nothing; they will offer to us.
  const onParticipants = () => {
    /* UI already re-rendered from call:user-joined for each pre-existing member's offer */
  };

  // 2) New peer joined (we're existing; we initiate the offer).
  const onUserJoined = async ({ socketId, userId, name, avatar }) => {
    try {
      const pc = _createPeerConnection(socketId, { userId, name, avatar }, set, get);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call:offer', { toSocketId: socketId, offer });
    } catch (err) {
      console.error('Failed to create offer for joiner:', err);
    }
  };

  // 3) Peer sent us an offer — we're the joiner (or late joiner). Create answer.
  const onOffer = async ({ fromSocketId, fromUserId, fromName, fromAvatar, offer }) => {
    try {
      let pc = peerConns.get(fromSocketId);
      if (!pc) {
        pc = _createPeerConnection(fromSocketId, { userId: fromUserId, name: fromName, avatar: fromAvatar }, set, get);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('call:answer', { toSocketId: fromSocketId, answer });
    } catch (err) {
      console.error('Failed to handle offer:', err);
    }
  };

  const onAnswer = async ({ fromSocketId, answer }) => {
    try {
      const pc = peerConns.get(fromSocketId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('Failed to handle answer:', err);
    }
  };

  const onIce = async ({ fromSocketId, candidate }) => {
    try {
      const pc = peerConns.get(fromSocketId);
      if (!pc || !candidate) return;
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  };

  const onUserLeft = ({ socketId }) => {
    const pc = peerConns.get(socketId);
    if (pc) {
      try { pc.close(); } catch { /* noop */ }
      peerConns.delete(socketId);
    }
    removePeer(set, get, socketId);
  };

  const onError = ({ message }) => {
    console.error('Call error:', message);
  };

  socket.on('call:participants', onParticipants);
  socket.on('call:user-joined', onUserJoined);
  socket.on('call:user-left', onUserLeft);
  socket.on('call:offer', onOffer);
  socket.on('call:answer', onAnswer);
  socket.on('call:ice-candidate', onIce);
  socket.on('call:error', onError);

  signalingListeners = { onParticipants, onUserJoined, onUserLeft, onOffer, onAnswer, onIce, onError };
}

function _detachSignalingListeners() {
  if (!signalingListeners) return;
  const { onParticipants, onUserJoined, onUserLeft, onOffer, onAnswer, onIce, onError } = signalingListeners;
  socket.off('call:participants', onParticipants);
  socket.off('call:user-joined', onUserJoined);
  socket.off('call:user-left', onUserLeft);
  socket.off('call:offer', onOffer);
  socket.off('call:answer', onAnswer);
  socket.off('call:ice-candidate', onIce);
  socket.off('call:error', onError);
  signalingListeners = null;
}

/* ---------------- Active-speaker detection ----------------
 * Uses RTCRtpReceiver.getSynchronizationSources() to read per-packet audio
 * levels. Pick the remote peer with the highest recent audio level;
 * if none above a threshold, null out. Polls at 500 ms.
 */
function _startSpeakerPolling(set, get) {
  _stopSpeakerPolling();
  speakerTimer = setInterval(() => {
    let winner = null;
    let bestLevel = 0;
    for (const [sid, pc] of peerConns.entries()) {
      try {
        const receivers = pc.getReceivers().filter((r) => r.track?.kind === 'audio');
        for (const r of receivers) {
          const sources = typeof r.getSynchronizationSources === 'function'
            ? r.getSynchronizationSources()
            : [];
          for (const s of sources) {
            // audioLevel is in [0, 1]. Treat anything under 0.15 as silence.
            const level = typeof s.audioLevel === 'number' ? s.audioLevel : 0;
            if (level > bestLevel) { bestLevel = level; winner = sid; }
          }
        }
      } catch { /* ignore per-peer errors */ }
    }
    const current = get().activeSpeakerSocketId;
    const next = bestLevel >= 0.15 ? winner : null;
    if (current !== next) set({ activeSpeakerSocketId: next });
  }, 500);
}

function _stopSpeakerPolling() {
  if (speakerTimer) {
    clearInterval(speakerTimer);
    speakerTimer = null;
  }
}

export default useCallStore;
