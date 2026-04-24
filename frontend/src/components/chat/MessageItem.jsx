import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Edit2, Trash2, Smile, Check, X } from 'lucide-react';
import { socket } from '../../hooks/useSocket';
import useAuthStore from '../../store/useAuthStore';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀'];

const MessageItem = ({ message, isSequential, isMe, onOpenThread }) => {
  const { user } = useAuthStore();
  const createdAt = message.createdAt ? new Date(message.createdAt) : null;
  const time = createdAt
    ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const editRef = useRef(null);
  const emojiRef = useRef(null);

  useEffect(() => {
    if (editing && editRef.current) editRef.current.focus();
  }, [editing]);

  useEffect(() => {
    const handleClick = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleEdit = () => {
    setEditText(message.content);
    setEditing(true);
  };

  const submitEdit = () => {
    if (!editText.trim() || editText === message.content) {
      setEditing(false);
      return;
    }
    socket.emit('edit_message', { messageId: message._id, content: editText });
    setEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(); }
    if (e.key === 'Escape') setEditing(false);
  };

  const handleDelete = () => {
    socket.emit('delete_message', { messageId: message._id });
  };

  const handleReaction = (emoji) => {
    socket.emit('toggle_reaction', { messageId: message._id, emoji });
    setShowEmojiPicker(false);
  };

  const groupedReactions = {};
  (message.reactions || []).forEach(r => {
    if (!groupedReactions[r.emoji]) groupedReactions[r.emoji] = [];
    groupedReactions[r.emoji].push(r.userId?.name || r.userId);
  });

  const myUserId = user?._id;

  return (
    <div className={`relative flex gap-4 group px-6 py-1 hover:bg-slate-100/60 dark:hover:bg-[#1c212b]/50 transition-colors ${!isSequential ? 'mt-4' : ''}`}>
      {/* Avatar */}
      <div className="w-10 flex-shrink-0 flex justify-center mt-0.5">
        {!isSequential ? (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200 dark:border-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm">
            {message.senderId?.avatar ? (
              <img src={message.senderId.avatar} className="w-full h-full rounded-xl object-cover" alt="" />
            ) : (
              message.senderName?.charAt(0).toUpperCase() || '?'
            )}
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 mt-1 font-medium select-none text-center">{time}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0 justify-center">
        {!isSequential && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={`font-semibold ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-gray-200'}`}>{message.senderName}</span>
            <span className="text-xs text-slate-500 dark:text-gray-500 font-medium">{time}</span>
            {message.edited && <span className="text-[10px] text-slate-400 dark:text-gray-600">(edited)</span>}
          </div>
        )}

        {editing ? (
          <div className="flex flex-col gap-1">
            <textarea
              ref={editRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="w-full bg-white dark:bg-[#0d1117] border border-indigo-300 dark:border-indigo-500/50 rounded-lg px-3 py-2 text-slate-800 dark:text-gray-200 text-sm outline-none resize-none min-h-[40px] focus:ring-2 focus:ring-indigo-500/30"
              rows={2}
            />
            <div className="flex items-center gap-2 text-xs">
              <button onClick={submitEdit} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"><Check size={12} /> Save</button>
              <button onClick={() => setEditing(false)} className="text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 flex items-center gap-1"><X size={12} /> Cancel</button>
              <span className="text-slate-400 dark:text-gray-600 ml-2">Enter to save, Esc to cancel</span>
            </div>
          </div>
        ) : (
          <>
            <div className="text-slate-700 dark:text-gray-300 leading-relaxed font-normal whitespace-pre-wrap">{message.content}</div>
            {isSequential && message.edited && <span className="text-[10px] text-slate-400 dark:text-gray-600">(edited)</span>}
          </>
        )}

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Object.entries(groupedReactions).map(([emoji, users]) => {
              const isMine = users.some(u => typeof u === 'string' ? u === myUserId : u?._id === myUserId);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                    isMine
                      ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/40 dark:text-indigo-300'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                  }`}
                  title={users.map(u => typeof u === 'string' ? u : u?.name || u).join(', ')}
                >
                  <span>{emoji}</span>
                  <span className="font-medium">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Reply count indicator */}
        {message.replyCount > 0 && (
          <button onClick={() => onOpenThread(message)} className="flex items-center gap-1.5 mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            <MessageSquare size={12} />
            <span className="font-medium">{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
          </button>
        )}
      </div>

      {/* Floating Action Bar */}
      {!editing && (
        <div className="opacity-0 group-hover:opacity-100 absolute right-4 -top-3 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 rounded-lg flex items-center shadow-xl transition-opacity z-10">
          {/* Quick react */}
          <div className="relative" ref={emojiRef}>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-yellow-400 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-l-lg transition-colors"
              title="React"
            >
              <Smile size={15} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-1 bg-white dark:bg-[#1c212b] border border-slate-200 dark:border-gray-700 rounded-lg shadow-2xl p-2 flex gap-1 z-50">
                {QUICK_EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => handleReaction(emoji)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-gray-700 text-lg transition-colors">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-slate-200 dark:bg-gray-700"></div>

          <button
            onClick={() => onOpenThread(message)}
            className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            title="Reply in thread"
          >
            <MessageSquare size={15} />
          </button>

          {isMe && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-gray-700"></div>
              <button onClick={handleEdit} className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors" title="Edit">
                <Edit2 size={15} />
              </button>
              <button onClick={handleDelete} className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-r-lg transition-colors" title="Delete">
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
