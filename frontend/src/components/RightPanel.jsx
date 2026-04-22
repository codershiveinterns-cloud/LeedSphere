import { X, MessageSquare, Clock } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const RightPanel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 flex-shrink-0 bg-[#0e1116] border-l border-gray-800 flex flex-col h-full shadow-2xl relative z-10 transition-all duration-300 transform">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800 bg-[#161b22] shrink-0">
        <h3 className="font-semibold text-gray-200 flex items-center gap-2">
          <MessageSquare size={16} /> Thread
        </h3>
        <button 
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Mock Original Message */}
        <div className="bg-[#161b22] p-3 rounded-lg border border-gray-800">
           <div className="flex items-center gap-2 mb-2 text-sm">
             <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px]">
               J
             </div>
             <span className="font-medium text-gray-200">John Doe</span>
             <span className="text-gray-500 text-xs">10:42 AM</span>
           </div>
           <p className="text-gray-300 text-sm">Can we review the current API architecture for notes?</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider my-2 px-2">
           <span>Replies</span>
           <div className="flex-1 h-px bg-gray-800"></div>
        </div>

        {/* Mock Replies */}
        <div className="flex flex-col gap-3">
           <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                 A
              </div>
              <div>
                 <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-200 text-sm">Alice</span>
                    <span className="text-gray-500 text-[10px]">10:45 AM</span>
                 </div>
                 <p className="text-gray-300 text-sm mt-0.5">Sure, I put it in the new doc.</p>
              </div>
           </div>
        </div>

      </div>

      {/* Input */}
      <div className="p-4 bg-[#161b22] border-t border-gray-800 shrink-0">
         <div className="bg-[#0d1117] border border-gray-700 rounded-lg p-2 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
            <textarea 
               placeholder="Reply..."
               className="w-full bg-transparent resize-none outline-none text-sm text-gray-200 min-h-[60px]"
            ></textarea>
            <div className="flex justify-between items-center mt-2">
               <button className="text-gray-500 hover:text-gray-300"><Clock size={14}/></button>
               <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors">Send</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default RightPanel;
