import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import useAppStore from '../store/useAppStore';

const waitForFirebaseUser = async (timeoutMs = 3000) => {
  if (auth.currentUser) return auth.currentUser;

  if (typeof auth.authStateReady === 'function') {
    try {
      await Promise.race([
        auth.authStateReady(),
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    } catch {
      // Fall through.
    }
    if (auth.currentUser) return auth.currentUser;
  }

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = null;

    const finish = (user) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
      resolve(user || null);
    };

    const timer = setTimeout(() => finish(auth.currentUser || null), timeoutMs);
    unsubscribe = onAuthStateChanged(
      auth,
      (user) => finish(user),
      () => finish(null),
    );
  });
};

const getSocketToken = async () => {
  const user = auth.currentUser || await waitForFirebaseUser();
  if (!user) return '';

  try {
    const token = await user.getIdToken();
    console.debug('[socket] Firebase token ready', { tokenPreview: `${token.slice(0, 12)}...` });
    return token;
  } catch (err) {
    console.warn('[socket] getIdToken failed:', err?.message || err);
    return '';
  }
};

export const socket = io('http://localhost:5005', {
  auth: async (cb) => cb({ token: await getSocketToken() }),
  autoConnect: true,
});

export const reconnectSocket = () => {
  if (socket.connected) socket.disconnect();
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

/**
 * Re-handshake the socket every time Firebase auth lands a different user.
 *
 * Without this, the socket connects ONCE at module-load time and the
 * handshake ships whatever token was available then — usually an empty
 * string because Firebase hasn't rehydrated yet. The backend's lazy
 * re-auth in `callerInfo()` only triggers when a token IS present, so an
 * empty handshake leaves the socket permanently unauthenticated and every
 * `send_message` is silently rejected.
 *
 * On every uid change (login, account switch, logout) we force-reconnect
 * so the handshake function re-runs with a fresh getIdToken().
 */
let lastUid = null;
onAuthStateChanged(auth, (user) => {
  const nextUid = user?.uid || null;
  if (nextUid === lastUid) return;
  lastUid = nextUid;
  console.info('[socket] auth changed → reconnecting with fresh token', { uid: nextUid });
  reconnectSocket();
});

// Surface auth rejections so a stuck "messages not sending" state is one
// console line away from a diagnosis instead of total silence.
let lastAuthErrorReconnectAt = 0;
socket.on('auth_error', (info) => {
  console.warn('[socket] auth_error from server:', info);
  // Auto-recover: the most common cause is a stale token. Force-reconnect
  // so the handshake reruns with a freshly minted ID token. Debounce hard:
  // if reconnects keep failing we'd otherwise loop forever.
  const now = Date.now();
  if (now - lastAuthErrorReconnectAt < 5000) return;
  lastAuthErrorReconnectAt = now;
  reconnectSocket();
});

socket.on('connect_error', (err) => {
  console.warn('[socket] connect_error:', err?.message || err);
});

export const useSocket = () => {
  const { addMessage, updateMessage, removeMessage, addThreadReply, addDmMessage } = useAppStore();

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleReceive = (message) => addMessage(message);
    const handleUpdated = (message) => updateMessage(message);
    const handleDeleted = ({ messageId }) => removeMessage(messageId);
    const handleThreadReply = ({ message }) => addThreadReply(message);
    const handleDm = (message) => addDmMessage(message);

    socket.on('receive_message', handleReceive);
    socket.on('message_updated', handleUpdated);
    socket.on('message_deleted', handleDeleted);
    socket.on('thread_reply', handleThreadReply);
    socket.on('receive_dm', handleDm);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('message_updated', handleUpdated);
      socket.off('message_deleted', handleDeleted);
      socket.off('thread_reply', handleThreadReply);
      socket.off('receive_dm', handleDm);
    };
  }, [addMessage, updateMessage, removeMessage, addThreadReply, addDmMessage]);

  return socket;
};
