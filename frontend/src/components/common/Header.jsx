import { LogOut, Download, Search, Bell } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useAppStore from '../../store/useAppStore';

const Header = ({ simulatedRole, setSimulatedRole }) => {
  const { user, logout } = useAuthStore();
  const { activeWorkspace } = useAppStore();

  const handleExport = (format) => {
    if (!activeWorkspace) return;
    window.open(`http://localhost:5005/api/workspaces/${activeWorkspace._id}/export?format=${format}`, '_blank');
  };

  return (
    <header className="h-14 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
          L
        </div>
        <span className="font-bold text-xl text-white tracking-tight hidden sm:block">Leedsphere</span>
        
        <span className="mx-4 text-gray-700 hidden sm:block">|</span>
        <span className="text-sm font-medium text-gray-400">Role:</span>
        <select 
          value={simulatedRole} 
          onChange={e => setSimulatedRole(e.target.value)}
          className="ml-1 bg-[#0d1117] border border-gray-700 rounded-md text-sm text-indigo-400 px-2 py-1 outline-none font-semibold cursor-pointer max-w-[100px] truncate"
        >
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="Member">Member</option>
        </select>
      </div>

      {/* Global Search Bar (Slack/Notion style) */}
      <div className="flex-1 max-w-lg mx-8 hidden md:block">
         <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
               <Search size={16} />
            </div>
            <input 
               type="text" 
               placeholder={`Search in ${activeWorkspace?.name || 'Workspace'}... (Ctrl+K)`} 
               className="w-full bg-[#0d1117]/80 hover:bg-[#0d1117] border border-gray-700 focus:border-indigo-500/50 rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
         </div>
      </div>
      
      <div className="flex items-center gap-4">
        {activeWorkspace && (
          <button 
            onClick={() => handleExport('pdf')}
            className="hidden lg:flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors bg-gray-800/50 px-3 py-1.5 rounded-md hover:bg-gray-800 border border-gray-700"
            title="Export as PDF"
          >
            <Download size={14} /> PDF
          </button>
        )}

        <button className="text-gray-400 hover:text-gray-200 transition-colors relative">
           <Bell size={18} />
           <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#161b22]"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-[#0d1117]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-200 hidden md:block">{user?.name}</span>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-red-400 transition-colors ml-2"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
