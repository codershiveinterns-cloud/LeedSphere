import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { FileText, Plus, Trash2, ChevronRight, Bold, Italic, Strikethrough, Code, List, ListOrdered, CheckSquare, Quote, Heading1, Heading2, Heading3, Minus } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';

const TEMPLATES = [
  {
    name: 'Meeting Notes',
    icon: '📋',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Meeting Notes' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Attendees' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name 1' }] }] }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Agenda' }] },
        { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic 1' }] }] }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Action Items' }] },
        { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action item 1' }] }] }] },
      ],
    },
  },
  {
    name: 'Project Plan',
    icon: '🗂️',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Project Plan' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe the project goals and scope...' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Timeline' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 1: Research (Week 1-2)' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 2: Development (Week 3-6)' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 3: Testing (Week 7-8)' }] }] },
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Team' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Assign roles' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Set up communication channels' }] }] },
        ]},
      ],
    },
  },
  {
    name: 'Daily Tasks',
    icon: '✅',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Daily Tasks' }] },
        { type: 'paragraph', content: [{ type: 'text', text: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Priority' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'High priority task' }] }] },
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Other' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Regular task' }] }] },
        ]},
      ],
    },
  },
];

const ToolbarButton = ({ onClick, active, children, title }) => (
  <button onClick={onClick} title={title}
    className={`p-1.5 rounded-md transition-colors active:scale-90 ${
      active
        ? 'bg-indigo-600 text-white'
        : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800'
    }`}>
    {children}
  </button>
);

const NotesEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    activeNote, fetchNoteById, updateNote, createNote, deleteNote, notes,
    activeTeam,
  } = useAppStore();

  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const saveTimerRef = useRef(null);
  const isNewRef = useRef(id === 'new');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start writing, or press '/' for commands...",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] text-slate-700 dark:text-gray-300',
      },
    },
    onUpdate: ({ editor }) => {
      if (isNewRef.current) return;
      // Auto-save with debounce
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        handleAutoSave(editor.getJSON());
      }, 800);
    },
  });

  // Load note on mount or id change
  useEffect(() => {
    if (id && id !== 'new') {
      isNewRef.current = false;
      fetchNoteById(id);
    } else {
      isNewRef.current = true;
      setTitle('');
      if (editor) editor.commands.setContent('');
    }
  }, [id]);

  // Set editor content when activeNote loads
  useEffect(() => {
    if (activeNote && activeNote._id === id && editor) {
      setTitle(activeNote.title || '');
      if (activeNote.content) {
        editor.commands.setContent(activeNote.content);
      } else {
        editor.commands.setContent('');
      }
    }
  }, [activeNote?._id, editor]);

  // Fetch sub-pages
  const subPages = notes.filter(n => n.parentId === id);

  const handleAutoSave = useCallback(async (content) => {
    if (!id || id === 'new') return;
    setSaving(true);
    try {
      await updateNote(id, { content });
    } catch { /* silent */ }
    finally { setSaving(false); }
  }, [id, updateNote]);

  const handleTitleBlur = async () => {
    if (!id || id === 'new' || !title.trim()) return;
    if (title !== activeNote?.title) {
      await updateNote(id, { title });
    }
  };

  const handleCreateSubPage = async () => {
    if (!id || id === 'new') return;
    const teamId = activeNote?.teamId || activeTeam?._id;
    if (!teamId) return;
    try {
      const note = await createNote(teamId, 'Untitled', id);
      navigate(`/dashboard/notes/${note._id}`);
      toast.success('Sub-page created');
    } catch { toast.error('Failed to create sub-page'); }
  };

  const handleDelete = async () => {
    if (!id || id === 'new') return;
    try {
      await deleteNote(id);
      toast.success('Note deleted');
      navigate('/dashboard');
    } catch { toast.error('Failed to delete'); }
  };

  const handleTemplate = (template) => {
    if (editor) {
      editor.commands.setContent(template.content);
      setShowTemplates(false);
      if (id && id !== 'new') {
        updateNote(id, { content: template.content });
      }
    }
  };

  if (!editor) return null;

  return (
    <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex flex-col h-full overflow-hidden text-slate-800 dark:text-gray-200 transition-colors duration-200">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-gray-800 bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-sm shrink-0 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-md ring-1 ring-indigo-200 dark:ring-indigo-500/20">
            <FileText size={12} className="inline mr-1" />NOTE
          </span>
          {saving && <span className="text-xs text-slate-500 dark:text-gray-500">Saving...</span>}
          {!saving && id !== 'new' && <span className="text-xs text-slate-400 dark:text-gray-600">Auto-saved</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCreateSubPage} className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-md transition-colors active:scale-95" title="Add sub-page">
            <Plus size={14} /> Sub-page
          </button>
          <div className="relative">
            <button onClick={() => setShowTemplates(!showTemplates)} className="text-xs text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-md transition-colors active:scale-95">
              Templates
            </button>
            {showTemplates && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[#1c212b] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 p-1 animate-fade-in">
                {TEMPLATES.map(t => (
                  <button key={t.name} onClick={() => handleTemplate(t)}
                    className="flex items-center gap-2 w-full p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 text-slate-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-sm transition-colors">
                    <span>{t.icon}</span> {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleDelete} className="p-1.5 text-slate-500 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors active:scale-90" title="Delete note">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Title */}
          <input
            className="w-full bg-transparent text-4xl font-bold text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-gray-700 outline-none mb-2"
            placeholder="Untitled"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
          />

          {/* Breadcrumb for sub-pages */}
          {activeNote?.parentId && (
            <button onClick={() => navigate(`/dashboard/notes/${activeNote.parentId}`)}
              className="flex items-center gap-1 text-xs text-indigo-500/80 dark:text-indigo-400/70 hover:text-indigo-700 dark:hover:text-indigo-400 mb-4 transition-colors">
              <ChevronRight size={12} className="rotate-180" /> Back to parent page
            </button>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-0.5 mb-6 pb-4 border-b border-slate-200 dark:border-gray-800/50 flex-wrap">
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={16} /></ToolbarButton>
            <div className="w-px h-5 bg-slate-200 dark:bg-gray-800 mx-1"></div>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code"><Code size={16} /></ToolbarButton>
            <div className="w-px h-5 bg-slate-200 dark:bg-gray-800 mx-1"></div>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Checklist"><CheckSquare size={16} /></ToolbarButton>
            <div className="w-px h-5 bg-slate-200 dark:bg-gray-800 mx-1"></div>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote"><Quote size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><Code size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={16} /></ToolbarButton>
          </div>

          {/* TipTap Editor */}
          <EditorContent editor={editor} />

          {/* Sub-pages section */}
          {subPages.length > 0 && (
            <div className="mt-12 pt-6 border-t border-slate-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-3">Sub-pages</h3>
              <div className="flex flex-col gap-1">
                {subPages.map(sp => (
                  <button key={sp._id} onClick={() => navigate(`/dashboard/notes/${sp._id}`)}
                    className="flex items-center gap-2 p-2.5 hover:bg-slate-100 dark:hover:bg-[#1c212b] rounded-lg text-left transition-colors group">
                    <FileText size={16} className="text-slate-400 dark:text-gray-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    <span className="text-sm text-slate-700 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white">{sp.title || 'Untitled'}</span>
                    <ChevronRight size={14} className="ml-auto text-slate-300 dark:text-gray-700 group-hover:text-slate-500 dark:group-hover:text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesEditor;
