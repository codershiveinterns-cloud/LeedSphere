import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAppStore from '../store/useAppStore';

// Singleton socket instance exported directly for emits
export const socket = io('http://localhost:5005');

export const useSocket = () => {
  const { addMessage } = useAppStore();

  useEffect(() => {
    const handleReceive = (message) => {
      addMessage(message);
    };
    
    socket.on('receive_message', handleReceive);
    
    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [addMessage]);

  return socket;
};
