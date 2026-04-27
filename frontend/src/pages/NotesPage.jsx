import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Plus, Search, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import NotesEditor from './NotesEditor';

const NoteTreeItem = ({ note, notes, level, activeNoteId, onSelect, onDelete, onCreateChild }) => {
  const [expanded, setExpanded] = useState(true);
  const children = notes.filter(n => n.parentId === note._id);
  const isActive = activeNoteId === note._id;

  return (
    <div>
      <div
        className={`flex items-center group rounded-md transition-colors ${
          isActive
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-600/20 dark:text-white'
            : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#1c212b] hover:text-slate-900 dark:hover:text-gray-200'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {children.length > 0 ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5 shrink-0 text-slate-400 dark:text-gray-600 hover:text-slate-700 dark:hover:text-gray-400">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-4 shrink-0"></span>
        )}
        <button onClick={() => onSelect(note)} className="flex-1 flex items-center gap-2 py-1.5 px-1 text-left truncate min-w-0">
          <FileText size={14} className={`shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-gray-600'}`} />
          <span className="truncate text-sm">{note.title || 'Untitled'}</span>
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 pr-1 shrink-0">
          <button onClick={() => onCreateChild(note._id)} className="p-1 text-slate-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors active:scale-90" title="Add sub-page"><Plus size={12} /></button>
          <button onClick={() => onDelete(note._id)} className="p-1 text-slate-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors active:scale-90" title="Delete"><Trash2 size={12} /></button>
        </div>
      </div>
      {expanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <NoteTreeItem key={child._id} note={child} notes={notes} level={level + 1}
              activeNoteId={activeNoteId} onSelect={onSelect} onDelete={onDelete} onCreateChild={onCreateChild} />
          ))}
        </div>
      )}
    </div>
  );
};

const NotesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, fetchNotes, createNote, deleteNote, activeTeam, teams } = useAppStore();
  const [search, setSearch] = useState('');

  const teamId = activeTeam?._id || teams[0]?._id;

  // Re-fetch whenever the team changes. Clear stale notes synchronously
  // first so the user never sees the previous team's list while the new
  // request is in flight — that flash + delayed update was why notes
  // appeared "only after refresh" in some flows.
  useEffect(() => {
    if (!teamId) return;
    useAppStore.setState({ notes: [] });
    fetchNotes(teamId);
  }, [teamId, fetchNotes]);

  const rootNotes = notes.filter(n => !n.parentId);
  const filtered = search.trim()
    ? notes.filter(n => n.title?.toLowerCase().includes(search.toLowerCase()))
    : rootNotes;

  const handleCreate = async () => {
    if (!teamId) return toast.error('Select a team first');
    try {
      const note = await createNote(teamId, 'Untitled');
      navigate(`/dashboard/notes/${note._id}`);
    } catch { toast.error('Failed to create note'); }
  };

  const handleCreateChild = async (parentId) => {
    if (!teamId) return;
    try {
      const note = await createNote(teamId, 'Untitled', parentId);
      navigate(`/dashboard/notes/${note._id}`);
    } catch { toast.error('Failed'); }
  };

  const handleSelect = (note) => {
    navigate(`/dashboard/notes/${note._id}`);
  };

  const handleDelete = async (noteId) => {
    try {
      await deleteNote(noteId);
      toast.success('Deleted');
      if (id === noteId) navigate('/dashboard/notes');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex overflow-hidden font-sans transition-colors duration-200">
      {/* Notes Sidebar */}
      <div className="w-64 bg-white dark:bg-[#0e1116] border-r border-slate-200 dark:border-gray-800 flex flex-col shrink-0 h-full transition-colors duration-200">
        <div className="p-3 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-gray-200 text-sm">Notes & Docs</h3>
          <button onClick={handleCreate} className="p-1 text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-md transition-colors active:scale-90" title="New note">
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
              className="w-full bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-gray-300 placeholder-slate-400 dark:placeholder-gray-600 outline-none focus:border-slate-300 dark:focus:border-gray-700" />
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto px-1 py-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <FileText size={28} className="text-slate-300 dark:text-gray-700 mb-2" />
              <p className="text-slate-500 dark:text-gray-500 text-xs mb-3">{search ? 'No matching notes' : 'No notes yet'}</p>
              {!search && (
                <button onClick={handleCreate} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">Create your first note</button>
              )}
            </div>
          ) : (
            (search.trim() ? filtered : rootNotes).map(note => (
              <NoteTreeItem key={note._id} note={note} notes={notes} level={0}
                activeNoteId={id} onSelect={handleSelect} onDelete={handleDelete} onCreateChild={handleCreateChild} />
            ))
          )}
        </div>
      </div>

      {/* Editor or Empty State */}
      {id ? (
        <NotesEditor />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <FileText size={48} className="text-slate-300 dark:text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select or Create a Note</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">Choose a note from the sidebar or create a new one.</p>
            <button onClick={handleCreate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 mx-auto shadow-sm active:scale-95">
              <Plus size={16} /> New Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
