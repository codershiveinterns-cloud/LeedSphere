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
