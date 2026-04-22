import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Hash, Info } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import { useSocket, socket } from '../../hooks/useSocket';

const ChatWindow = () => {
  const { activeChannel, messages } = useAppStore();
  const { user } = useAuthStore();
  const outletContext = useOutletContext();
  const toggleRightPanel = outletContext?.toggleRightPanel || (() => {});
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  // Initialize generic socket hooks (listen to receive_message pipeline)
  useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!activeChannel) return;
    
    socket.emit('join_channel', activeChannel._id);

    const handleTyping = ({ senderName }) => {
      if (senderName === user?.name) return;
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.add(senderName);
        return next;
      });
    };
    
    const handleStopTyping = ({ senderName }) => {
      if (senderName === user?.name) return;
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(senderName);
        return next;
      });
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
      setTypingUsers(new Set());
    };
  }, [activeChannel, user?.name]);

  const handleEmitMessage = (content) => {
    const senderName = user?.name || 'Anonymous';
    socket.emit('send_message', { channelId: activeChannel._id, senderName, content });
  };

  const handleTypingState = (isTyping) => {
    if (!activeChannel) return;
    const senderName = user?.name || 'Anonymous';
    socket.emit(isTyping ? 'user_typing' : 'user_stop_typing', { channelId: activeChannel._id, senderName });
  };

  if (!activeChannel) {
    return (
      <div className="flex-1 bg-[#0d1117] flex items-center justify-center flex-col gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center text-gray-600 mb-2">
          <Hash size={32} />
        </div>
        <h2 className="text-xl font-medium text-gray-300">No channel selected</h2>
        <p className="text-gray-500">Create or select a channel from the sidebar to start a conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0d1117] flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-gray-800 bg-[#161b22]/90 backdrop-blur-sm absolute top-0 w-full z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 text-white font-medium">
          <Hash size={18} className="text-gray-500" />
          {activeChannel.name}
        </div>
        <button className="text-gray-500 hover:text-gray-300 transition-colors">
          <Info size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-[70px] pb-[90px] scroll-smooth flex flex-col min-h-0 relative">
        
        {/* Intro */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-end px-6 pb-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
              <Hash size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to #{activeChannel.name}!</h1>
            <p className="text-gray-400">This is the start of the #{activeChannel.name} channel. Start the conversation!</p>
          </div>
        ) : (
          <div className="mt-auto flex flex-col justify-end min-h-min">
            <div className="px-6 pb-8 shrink-0">
              <h1 className="text-3xl font-bold text-white mb-2">#{activeChannel.name}</h1>
              <p className="text-gray-400">This is the beginning of your chat history.</p>
            </div>
            
            {/* List */}
            {messages.map((msg, idx) => {
              const isMe = msg.senderName === user?.name;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              // Group if same sender AND within 5 minutes
              const isSequential = prevMsg 
                && prevMsg.senderName === msg.senderName 
                && (new Date(msg.createdAt || Date.now()) - new Date(prevMsg.createdAt || Date.now())) < 5 * 60 * 1000;

              return (
                <MessageItem 
                  key={msg._id || idx} 
                  message={msg} 
                  isMe={isMe} 
                  isSequential={isSequential}
                  onOpenThread={() => toggleRightPanel()}
                />
              );
            })}
          </div>
        )}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="px-6 py-2 flex items-center gap-2 text-gray-500 text-sm mt-2 shrink-0">
            <span className="flex gap-1 h-3 items-end">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
            </span>
            <span className="font-medium text-gray-400">{Array.from(typingUsers).join(', ')}</span> {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <div ref={messagesEndRef} className="h-4 shrink-0" />
      </div>

      <MessageInput 
        channelName={activeChannel.name} 
        onSendMessage={handleEmitMessage} 
        onTyping={handleTypingState}
      />
    </div>
  );
};

export default ChatWindow;
