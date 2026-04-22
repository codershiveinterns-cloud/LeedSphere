import { useState } from 'react';
import { Plus } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import Modal from './common/Modal';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');

  const submitWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    try {
      await createWorkspace(workspaceName);
      setWorkspaceName('');
      setIsModalOpen(false);
      toast.success('Workspace created!');
    } catch {
      toast.error('Failed to create workspace.');
    }
  };

  return (
    <>
      <div className="w-16 md:w-20 bg-[#0e1116] border-r border-gray-800 flex flex-col items-center py-4 gap-4 flex-shrink-0 h-full">
        {(Array.isArray(workspaces) ? workspaces : []).map((workspace) => (
          <button
            key={workspace._id}
            onClick={() => setActiveWorkspace(workspace)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all shadow-lg ${
              activeWorkspace?._id === workspace._id
                ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                : 'bg-[#1c212b] text-gray-400 hover:bg-[#252b36] hover:text-white'
            }`}
            title={workspace.name}
          >
            {workspace?.name ? workspace.name.substring(0, 2).toUpperCase() : 'W'}
          </button>
        ))}

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-800/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all border border-dashed border-gray-700 hover:border-emerald-500/50"
          title="Add Workspace"
        >
          <Plus size={24} />
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a Workspace">
        <form onSubmit={submitWorkspace} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Workspace Name</label>
            <input 
              type="text" 
              autoFocus
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-600"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={!workspaceName.trim()} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors">Create</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Sidebar;
