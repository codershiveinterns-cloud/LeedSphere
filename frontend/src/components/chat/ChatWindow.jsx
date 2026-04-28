import { useEffect, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Hash, Info, Lock, Users } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import useFirebaseAuthStore from '../../store/useFirebaseAuthStore';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import ChannelInfoModal from '../channel/ChannelInfoModal';
import CallBar from '../Call/CallBar';
import { useSocket, socket } from '../../hooks/useSocket';

const ChatWindow = () => {
  const { id } = useParams();
  const { activeChannel, messages, setActiveChannel, findChannelById, openThread } = useAppStore();
  // Mongo profile is the source of truth for "is this my message" — Firebase
  // uid and Mongo _id are different namespaces.
  const profile = useFirebaseAuthStore((s) => s.profile);
  const outletContext = useOutletContext();
  const toggleRightPanel = outletContext?.toggleRightPanel || (() => {});
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showChannelInfo, setShowChannelInfo] = useState(false);

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

    // Suppress typing indicators for our own keystrokes — match against the
    // Mongo profile name we cached after Firebase auth landed.
    const myName = profile?.name;

    const handleTyping = ({ senderName }) => {
      if (senderName === myName) return;
      setTypingUsers(prev => { const n = new Set(prev); n.add(senderName); return n; });
    };
    const handleStopTyping = ({ senderName }) => {
      if (senderName === myName) return;
      setTypingUsers(prev => { const n = new Set(prev); n.delete(senderName); return n; });
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
      setTypingUsers(new Set());
    };
  }, [activeChannel?._id, profile?.name]);

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
    <div className="flex-1 min-w-0 bg-[#f5f6f8] dark:bg-[#0d1117] flex flex-col h-full relative overflow-hidden transition-colors duration-200">
      <div className="h-14 flex items-center justify-between px-3 sm:px-4 md:px-6 border-b border-slate-200 dark:border-gray-800 bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-sm absolute top-0 w-full z-10 shrink-0 shadow-sm transition-colors duration-200">
        <button
          onClick={() => setShowChannelInfo(true)}
          className="flex items-center gap-2 text-slate-900 dark:text-white font-medium hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          title="Channel details"
        >
          {isPrivate
            ? <Lock size={16} className="text-amber-600 dark:text-amber-400" />
            : <Hash size={18} className="text-slate-400 dark:text-gray-500" />}
          {channelName}
          {isPrivate && <span className="text-xs text-slate-500 dark:text-gray-500 bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded ml-1">Private</span>}
        </button>
        <div className="flex items-center gap-1">
          <CallBar channelId={activeChannel?._id} />
          <button
            onClick={() => setShowChannelInfo(true)}
            className="p-1.5 rounded-md text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors active:scale-90"
            title="Members & settings"
          >
            <Users size={16} />
          </button>
          <button
            onClick={() => toggleRightPanel()}
            className="p-1.5 rounded-md text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors active:scale-90"
            title="Thread panel"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-[70px] pb-[90px] scroll-smooth flex flex-col min-h-0 relative">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-end px-3 sm:px-4 md:px-6 pb-8">
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
              // Compare by Mongo _id (always reliable). Fall back to senderName
              // only if the populated senderId is missing for some reason.
              const senderMongoId = msg.senderId?._id || msg.senderId;
              const isMe = profile?._id
                ? String(senderMongoId) === String(profile._id)
                : false;
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

      <ChannelInfoModal
        open={showChannelInfo}
        onClose={() => setShowChannelInfo(false)}
        channelId={activeChannel?._id}
      />
    </div>
  );
};

export default ChatWindow;
