import { useEffect, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Hash, Info } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import { useSocket, socket } from '../../hooks/useSocket';

const ChatWindow = () => {
  const { id } = useParams();
  const { activeChannel, messages, setActiveChannel, findChannelById, openThread } = useAppStore();
  const { user } = useAuthStore();
  const outletContext = useOutletContext();
  const toggleRightPanel = outletContext?.toggleRightPanel || (() => {});
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState(new Set());

  useSocket();

  useEffect(() => {
    if (id && (!activeChannel || activeChannel._id !== id)) {
      const found = findChannelById(id);
      if (found) {
        setActiveChannel(found);
      } else {
        setActiveChannel({ _id: id, name: 'channel' });
      }
    }
  }, [id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, typingUsers]);

  useEffect(() => {
    if (!activeChannel?._id) return;
    socket.emit('join_channel', activeChannel._id);

    const handleTyping = ({ senderName }) => {
      if (senderName === user?.name) return;
      setTypingUsers(prev => { const n = new Set(prev); n.add(senderName); return n; });
    };
    const handleStopTyping = ({ senderName }) => {
      if (senderName === user?.name) return;
      setTypingUsers(prev => { const n = new Set(prev); n.delete(senderName); return n; });
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
      setTypingUsers(new Set());
    };
  }, [activeChannel?._id, user?.name]);

  const handleSendMessage = (content) => {
    if (!activeChannel?._id) return;
    socket.emit('send_message', {
      channelId: activeChannel._id,
      content,
    });
  };

  const handleTypingState = (isTyping) => {
    if (!activeChannel?._id) return;
    socket.emit(isTyping ? 'user_typing' : 'user_stop_typing', { channelId: activeChannel._id });
  };

  const handleOpenThread = (message) => {
    openThread(message);
    toggleRightPanel(true);
  };

  if (!activeChannel) {
    return (
      <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center flex-col gap-4 text-center p-8 transition-colors duration-200">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800/50 border border-slate-200 dark:border-transparent flex items-center justify-center text-slate-400 dark:text-gray-600 mb-2">
          <Hash size={32} />
        </div>
        <h2 className="text-xl font-medium text-slate-700 dark:text-gray-300">No channel selected</h2>
        <p className="text-slate-500 dark:text-gray-500">Create or select a channel from the sidebar to start a conversation.</p>
      </div>
    );
  }

  const channelName = activeChannel?.name || 'channel';
  const isPrivate = activeChannel?.type === 'private' || activeChannel?.isPrivate;

  return (
    <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex flex-col h-full relative overflow-hidden transition-colors duration-200">
      <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-gray-800 bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-sm absolute top-0 w-full z-10 shrink-0 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
          <Hash size={18} className="text-slate-400 dark:text-gray-500" />
          {channelName}
          {isPrivate && <span className="text-xs text-slate-500 dark:text-gray-500 bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded ml-1">Private</span>}
        </div>
        <button onClick={() => toggleRightPanel()} className="text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 transition-colors active:scale-90">
          <Info size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pt-[70px] pb-[90px] scroll-smooth flex flex-col min-h-0 relative">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-end px-6 pb-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4"><Hash size={32} /></div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to #{channelName}!</h1>
            <p className="text-slate-500 dark:text-gray-400">This is the start of the #{channelName} channel. Start the conversation!</p>
          </div>
        ) : (
          <div className="mt-auto flex flex-col justify-end min-h-min">
            <div className="px-6 pb-8 shrink-0">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">#{channelName}</h1>
              <p className="text-slate-500 dark:text-gray-400">This is the beginning of your chat history.</p>
            </div>
            {messages.map((msg, idx) => {
              const isMe = msg.senderName === user?.name;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const aTs = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
              const bTs = prevMsg?.createdAt ? new Date(prevMsg.createdAt).getTime() : 0;
              const isSequential = prevMsg && prevMsg.senderName === msg.senderName && (aTs && bTs ? (aTs - bTs) < 5 * 60 * 1000 : true);
              return <MessageItem key={msg._id || idx} message={msg} isMe={isMe} isSequential={isSequential} onOpenThread={handleOpenThread} />;
            })}
          </div>
        )}

        {typingUsers.size > 0 && (
          <div className="px-6 py-2 flex items-center gap-2 text-slate-500 dark:text-gray-500 text-sm mt-2 shrink-0">
            <span className="flex gap-1 h-3 items-end">
              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
            </span>
            <span className="font-medium text-slate-600 dark:text-gray-400">{Array.from(typingUsers).join(', ')}</span> {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} className="h-4 shrink-0" />
      </div>

      <MessageInput channelName={channelName} onSendMessage={handleSendMessage} onTyping={handleTypingState} />
    </div>
  );
};

export default ChatWindow;
