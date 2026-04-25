import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAppStore from '../store/useAppStore';

/**
 * Read the JWT from localStorage. Called every time the socket initiates a
 * handshake (see the `auth` function below) so a fresh login is picked up
 * on the next (re)connect — without this, the token is captured once at
 * module load and the server marks subsequent messages/calls as
 * "Anonymous" because socket.user is never populated for the new user.
 */
const getToken = () => {
  try {
    const stored = localStorage.getItem('user');
    if (stored) return JSON.parse(stored)?.token || '';
  } catch { /* ignore bad stored data */ }
  return '';
};

/**
 * `auth` accepts either an object (captured once) or a callback function
 * (invoked on every handshake). We use the function form so the latest
 * token in localStorage flows in on every reconnect.
 */
export const socket = io('http://localhost:5005', {
  auth: (cb) => cb({ token: getToken() }),
  autoConnect: true,
});

/**
 * Force a fresh handshake. Call this after login / token rotation so the
 * server can re-authenticate the socket and attach `socket.user`. Without
 * this, messages keep getting attributed to "Anonymous" and call signaling
 * rejects with "Not authenticated".
 */
export const reconnectSocket = () => {
  if (socket.connected) socket.disconnect();
  socket.connect();
};

/**
 * Disconnect the socket — used on logout so the server tears down room
 * memberships (active calls, channel rooms) for the previous user.
 */
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
