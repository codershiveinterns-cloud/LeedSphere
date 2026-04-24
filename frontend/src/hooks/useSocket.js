import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAppStore from '../store/useAppStore';

const getToken = () => {
  try {
    const stored = localStorage.getItem('user');
    if (stored) return JSON.parse(stored)?.token || '';
  } catch { /* ignore bad stored data */ }
  return '';
};

export const socket = io('http://localhost:5005', {
  auth: { token: getToken() },
  autoConnect: true,
});

export const useSocket = () => {
  const { addMessage, updateMessage, removeMessage, addThreadReply, addDmMessage } = useAppStore();

  useEffect(() => {
    socket.auth = { token: getToken() };
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
