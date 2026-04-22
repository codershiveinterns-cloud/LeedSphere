import { useState } from 'react';
import { AlignLeft, CheckSquare, Image as ImageIcon, Link2, MoreHorizontal, Table, LayoutList } from 'lucide-react';
import { useParams } from 'react-router-dom';

const NotesEditor = () => {
  const { id } = useParams();
  const [title, setTitle] = useState('Untitled Note');
  const [content, setContent] = useState('');

  return (
    <div className="flex-1 bg-[#0d1117] flex flex-col h-full overflow-hidden text-gray-200">
      {/* Editor Header Toolbar */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-gray-800 bg-[#161b22]/90 backdrop-blur-sm shrink-0 shadow-sm sticky top-0 z-10 w-full relative">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md ring-1 ring-indigo-500/20">NOTE</span>
          <span className="text-sm font-medium text-gray-400">/{id ? id.substring(0,6) : 'new'}</span>
        </div>
        <div className="flex gap-2">
           <button className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-md transition-colors"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto px-10 py-12 lg:px-48 relative max-w-5xl mx-auto w-full">
        {/* Cover Image Placeholder Optional */}
        
        <input 
          autoFocus
          className="w-full bg-transparent text-4xl lg:text-5xl font-bold text-white placeholder-gray-600 outline-none mb-8 resize-none overflow-hidden" 
          placeholder="Untitled"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        {/* Mock Rich Text Block */}
        <div className="group relative flex gap-2 w-full items-start">
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 mt-1 shrink-0 transition-opacity absolute -left-8">
            <button className="text-gray-500 hover:text-gray-300"><LayoutList size={16}/></button>
          </div>
          
          <textarea
             className="w-full bg-transparent text-lg text-gray-300 placeholder-gray-600 outline-none resize-none min-h-[500px]"
             placeholder="Press '/' for commands..."
             value={content}
             onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>

      {/* Formatting Sticky Bottom Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#161b22] border border-gray-700 shadow-xl rounded-xl flex items-center p-1.5 gap-1.5 backdrop-blur-md">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"><AlignLeft size={18}/></button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"><CheckSquare size={18}/></button>
        <div className="w-px h-5 bg-gray-700 mx-1"></div>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"><ImageIcon size={18}/></button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"><Link2 size={18}/></button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"><Table size={18}/></button>
      </div>

    </div>
  );
};

export default NotesEditor;
