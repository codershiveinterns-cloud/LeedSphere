import { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import useThemeStore from '../../store/useThemeStore';

const MessageInput = ({ channelName, onSendMessage, onTyping }) => {
  const { theme } = useThemeStore();
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setContent(e.target.value);
    
    // Typing indicator logic
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSendMessage(content);
    setContent('');
    setShowEmoji(false);
    onTyping(false); // Immediate stop indicator on exact send
  };

  const onEmojiClick = (emojiObject) => {
    setContent(prev => prev + emojiObject.emoji);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="px-6 py-4 bg-transparent absolute bottom-0 w-full z-10 shrink-0">
      <form onSubmit={handleSend} className="relative flex flex-col shadow-xl rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-[#1c212b] focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">

        <textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}`}
          className="w-full bg-transparent px-4 pt-3.5 pb-12 text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 outline-none resize-none min-h-[50px] max-h-48 scrollbar-thin overflow-y-auto"
          rows={1}
        />

        <div className="absolute bottom-2 left-3 flex items-center">
          <div ref={pickerRef} className="relative z-50">
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className="text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors active:scale-90"
            >
              <Smile size={20} />
            </button>
            {showEmoji && (
              <div className="absolute bottom-full left-0 mb-2 shadow-2xl z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} theme={theme === 'dark' ? 'dark' : 'light'} />
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!content.trim()}
          className="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors active:scale-95"
        >
          <Send size={16} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
