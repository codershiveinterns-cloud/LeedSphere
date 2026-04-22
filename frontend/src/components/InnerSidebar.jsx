import { NavLink } from 'react-router-dom';
import { Hash, Users, FolderKanban, Calendar, Lock, Plus, FileText } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const InnerSidebar = () => {
  const { activeWorkspace, channels, setActiveChannel } = useAppStore();

  if (!activeWorkspace) {
    return (
      <div className="w-64 bg-[#161b22] border-r border-gray-800 flex flex-col items-center justify-center p-6 text-center shrink-0">
        <Hash size={48} className="text-gray-700 mb-4" />
        <h3 className="text-gray-300 font-medium mb-1">No Workspace</h3>
        <p className="text-gray-600 text-sm">Select or create a workspace to view contents.</p>
      </div>
    );
  }

  // Mock data for new features
  const mockDms = [
    { id: 'dm1', name: 'Alice Adams', online: true },
    { id: 'dm2', name: 'Bob Brown', online: false }
  ];

  const mockNotes = [
    { id: 'note1', title: 'Q3 Roadmap' },
    { id: 'note2', title: 'API Architecture' }
  ];

  const sections = [
    { name: 'Core Views', items: [
      { id: 'teams', icon: Users, label: 'Teams & Merges', to: '/dashboard/teams' },
      { id: 'projects', icon: FolderKanban, label: 'Project Kanban', to: '/dashboard/projects' },
      { id: 'calendar', icon: Calendar, label: 'Meetings Calendar', to: '/dashboard/calendar' },
    ]}
  ];

  return (
    <div className="w-64 flex-shrink-0 bg-[#161b22] border-r border-gray-800 flex flex-col h-full overflow-y-auto">
      <div className="h-14 flex items-center px-4 border-b border-gray-800 font-semibold text-white shadow-sm shrink-0">
        <h2 className="truncate">{activeWorkspace.name}</h2>
      </div>

      <div className="py-4 flex flex-col gap-6">
        
        {/* Feature Navigation */}
        {sections.map(section => (
          <div key={section.name}>
            <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.name}
            </div>
            <div className="space-y-0.5 px-2">
              {section.items.map(item => (
                <NavLink 
                  key={item.id} 
                  to={item.to}
                  className={({ isActive }) => `flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                  }`}
                >
                  <item.icon size={16} className="opacity-70" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* Channels List */}
        <div>
          <div className="px-4 flex items-center justify-between group mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Channels</h3>
            <button className="text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-0.5 px-2">
            {channels.map(channel => (
              <NavLink
                key={channel._id}
                to={`/dashboard/channel/${channel._id}`}
                onClick={() => setActiveChannel(channel)}
                className={({ isActive }) => `w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                }`}
              >
                {channel.isPrivate ? <Lock size={14} className="opacity-70" /> : <Hash size={14} className="opacity-70" />}
                <span className="truncate">{channel.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Direct Messages List */}
        <div>
          <div className="px-4 flex items-center justify-between group mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</h3>
            <button className="text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-0.5 px-2">
            {mockDms.map(dm => (
              <NavLink
                key={dm.id}
                to={`/dashboard/dm/${dm.id}`}
                className={({ isActive }) => `w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                }`}
              >
                <div className="relative flex items-center justify-center w-4 h-4">
                   <div className="w-full h-full bg-indigo-500/20 text-indigo-400 rounded-sm flex items-center justify-center text-[9px] font-bold">
                     {dm.name.charAt(0)}
                   </div>
                   <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#161b22] ${dm.online ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
                </div>
                <span className="truncate">{dm.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Notes / Docs List */}
        <div>
          <div className="px-4 flex items-center justify-between group mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes & Docs</h3>
            <button className="text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-0.5 px-2">
            {mockNotes.map(note => (
              <NavLink
                key={note.id}
                to={`/dashboard/notes/${note.id}`}
                className={({ isActive }) => `w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                }`}
              >
                <FileText size={14} className="opacity-70 text-indigo-400" />
                <span className="truncate">{note.title}</span>
              </NavLink>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InnerSidebar;
