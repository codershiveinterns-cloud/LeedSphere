import { useState } from 'react';
import { Plus, Hash, Lock } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import Modal from './common/Modal';
import toast from 'react-hot-toast';

const ChannelList = () => {
  const { activeWorkspace, channels, activeChannel, setActiveChannel, createChannel } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const submitChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim() || !activeWorkspace) return;
    try {
      await createChannel(activeWorkspace._id, channelName.toLowerCase().replace(/\s+/g, '-'), isPrivate);
      setChannelName('');
      setIsPrivate(false);
      setIsModalOpen(false);
      toast.success('Channel created!');
    } catch {
      toast.error('Failed to create channel.');
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="w-64 bg-[#161b22] border-r border-gray-800 flex flex-col items-center justify-center p-6 text-center shrink-0">
        <Hash size={48} className="text-gray-700 mb-4" />
        <h3 className="text-gray-300 font-medium mb-1">No Workspace</h3>
        <p className="text-gray-600 text-sm">Select or create a workspace to view channels.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 flex-shrink-0 bg-[#161b22] border-r border-gray-800 flex flex-col h-full">
        <div className="h-14 flex items-center px-4 border-b border-gray-800 font-semibold text-white shadow-sm">
          <h2 className="truncate">{activeWorkspace.name}</h2>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 flex items-center justify-between group mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Channels</h3>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="text-gray-500 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
              title="Create Channel"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="space-y-0.5 px-2">
            {channels.map(channel => (
              <button
                key={channel._id}
                onClick={() => setActiveChannel(channel)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  activeChannel?._id === channel._id
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                }`}
              >
                {channel.isPrivate ? <Lock size={14} className="opacity-70" /> : <Hash size={14} className="opacity-70" />}
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
            {channels.length === 0 && (
              <div className="px-4 py-3 text-xs text-center border border-dashed border-gray-700 rounded-lg text-gray-500 mx-2 mt-2">
                No channels yet.<br/><button onClick={() => setIsModalOpen(true)} className="text-indigo-400 hover:underline mt-1 font-medium">Create one</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a Channel">
        <form onSubmit={submitChannel} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Channel Name</label>
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                autoFocus
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-600"
                placeholder="e.g. engineering"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Names must be lowercase, without spaces.</p>
          </div>
          
          <label className="flex items-center gap-3 mt-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={isPrivate} 
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-[#0d1117] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[#161b22]"
            />
            <div>
              <span className="block text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Make Private</span>
              <span className="block text-xs text-gray-500">Only invited members can view this channel.</span>
            </div>
          </label>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={!channelName.trim()} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors">Create Channel</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ChannelList;
