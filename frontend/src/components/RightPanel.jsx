import { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import useAuthStore from '../store/useAuthStore';
import { socket } from '../hooks/useSocket';

const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const RightPanel = ({ isOpen, onClose }) => {
  const { activeThread, threadReplies, closeThread } = useAppStore();
  const { user } = useAuthStore();
  const [replyText, setReplyText] = useState('');
  const repliesEndRef = useRef(null);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadReplies]);

  if (!isOpen) return null;

  const handleClose = () => {
    closeThread();
    onClose();
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    socket.emit('send_message', {
      channelId: activeThread.channelId?._id || activeThread.channelId,
      content: replyText,
      threadId: activeThread._id,
    });
    setReplyText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply(e);
    }
  };

  if (!activeThread) {
    return (
      <div className="w-80 flex-shrink-0 bg-white dark:bg-[#0e1116] border-l border-slate-200 dark:border-gray-800 flex flex-col h-full shadow-2xl z-10 transition-colors duration-200">
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-[#161b22] shrink-0 transition-colors duration-200">
          <h3 className="font-semibold text-slate-800 dark:text-gray-200 flex items-center gap-2"><MessageSquare size={16} /> Thread</h3>
          <button onClick={handleClose} className="p-1.5 text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-md transition-colors active:scale-90"><X size={18} /></button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <MessageSquare size={32} className="text-slate-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-gray-500 text-sm">Click a message's reply button to open a thread</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 flex-shrink-0 bg-white dark:bg-[#0e1116] border-l border-slate-200 dark:border-gray-800 flex flex-col h-full shadow-2xl z-10 transition-colors duration-200">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-[#161b22] shrink-0 transition-colors duration-200">
        <h3 className="font-semibold text-slate-800 dark:text-gray-200 flex items-center gap-2">
          <MessageSquare size={16} /> Thread
        </h3>
        <button onClick={handleClose} className="p-1.5 text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-md transition-colors active:scale-90">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* Parent message */}
        <div className="bg-slate-50 dark:bg-[#161b22] p-3 rounded-lg border border-slate-200 dark:border-gray-800 transition-colors duration-200">
          <div className="flex items-center gap-2 mb-2 text-sm">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200 dark:border-indigo-500/10 flex items-center justify-center text-[11px] text-indigo-700 dark:text-indigo-300 font-bold">
              {activeThread.senderName?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className="font-medium text-slate-800 dark:text-gray-200">{activeThread.senderName}</span>
            <span className="text-slate-500 dark:text-gray-500 text-xs">{formatTime(activeThread.createdAt)}</span>
          </div>
          <p className="text-slate-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{activeThread.content}</p>
        </div>

        {/* Replies divider */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider my-1 px-1">
          <span>{threadReplies.length} {threadReplies.length === 1 ? 'Reply' : 'Replies'}</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-gray-800"></div>
        </div>

        {/* Replies */}
        {threadReplies.length === 0 ? (
          <p className="text-slate-400 dark:text-gray-600 text-sm text-center py-4">No replies yet. Be the first!</p>
        ) : (
          threadReplies.map(reply => (
            <div key={reply._id} className="flex gap-2 animate-fade-in">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200 dark:border-indigo-500/10 flex items-center justify-center text-[9px] text-indigo-700 dark:text-indigo-300 font-bold shrink-0 mt-0.5">
                {reply.senderName?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`font-medium text-sm ${reply.senderName === user?.name ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-gray-200'}`}>{reply.senderName}</span>
                  <span className="text-slate-500 dark:text-gray-500 text-[10px]">{formatTime(reply.createdAt)}</span>
                  {reply.edited && <span className="text-[10px] text-slate-400 dark:text-gray-600">(edited)</span>}
                </div>
                <p className="text-slate-700 dark:text-gray-300 text-sm mt-0.5 whitespace-pre-wrap">{reply.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={repliesEndRef} />
      </div>

      {/* Reply input */}
      <div className="p-3 bg-slate-50 dark:bg-[#161b22] border-t border-slate-200 dark:border-gray-800 shrink-0 transition-colors duration-200">
        <form onSubmit={handleSendReply}>
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply..."
              className="w-full bg-transparent resize-none outline-none text-sm text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-600 p-3 min-h-[50px] max-h-32"
              rows={2}
            />
            <div className="flex justify-end px-2 pb-2">
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm active:scale-95"
              >
                <Send size={12} /> Reply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RightPanel;
