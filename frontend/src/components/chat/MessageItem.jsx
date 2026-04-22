// Using native JS Intl format for dates
import { MessageSquare, Edit2, Check, CheckCheck } from 'lucide-react';

const MessageItem = ({ message, isSequential, isMe, onOpenThread }) => {
  const time = new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`relative flex gap-4 group px-6 py-1 hover:bg-[#1c212b]/50 transition-colors ${!isSequential ? 'mt-4' : ''}`}>
      {/* Avatar column */}
      <div className="w-10 flex-shrink-0 flex justify-center mt-0.5">
        {!isSequential ? (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-300 font-bold shadow-sm">
            {message.senderName ? message.senderName.charAt(0).toUpperCase() : '?'}
          </div>
        ) : (
          <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 mt-1 font-medium select-none text-center">
            {time}
          </span>
        )}
      </div>

      {/* Content column */}
      <div className="flex flex-col flex-1 min-w-0 justify-center">
        {!isSequential && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={`font-semibold ${isMe ? 'text-indigo-400' : 'text-gray-200'}`}>
              {message.senderName}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {time}
            </span>
          </div>
        )}
        <div className="text-gray-300 leading-relaxed font-normal whitespace-pre-wrap">
          {message.content}
        </div>
        
        {/* Seen / Delivered state */}
        {isMe && !isSequential && (
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
               <CheckCheck size={14} className="text-indigo-400" />
            </div>
        )}
      </div>

      {/* Floating Action Menu */}
      <div className="opacity-0 group-hover:opacity-100 absolute right-4 top-2 bg-[#161b22] border border-gray-700 rounded-md flex items-center shadow-lg transition-opacity flex-shrink-0">
          <button 
             onClick={onOpenThread}
             className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-l-md transition-colors"
             title="Reply in thread"
          >
             <MessageSquare size={16} />
          </button>
          <div className="w-px h-4 bg-gray-700"></div>
          {isMe && (
             <button 
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-r-md transition-colors"
                title="Edit message"
             >
                <Edit2 size={16} />
             </button>
          )}
      </div>
    </div>
  );
};

export default MessageItem;
