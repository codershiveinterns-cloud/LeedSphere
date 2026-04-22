import { Plus, Users, Hash, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';

const DashboardEmptyState = () => {
  const { setUiState, teams } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (Array.isArray(teams) && teams.length > 0 && teams[0]?._id) {
       navigate(`/dashboard/team/${teams[0]._id}`);
    }
  }, [teams, navigate]);

  return (
    <div className="flex-1 bg-[#0d1117] flex items-center justify-center relative overflow-hidden">
      
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="z-10 flex flex-col items-center max-w-lg text-center p-8 bg-[#161b22]/50 backdrop-blur-xl border border-gray-800/80 rounded-3xl shadow-2xl">
         
         <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-inner">
            <Hash size={40} className="text-indigo-400" />
         </div>

         <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Your Workspace is Ready</h2>
         <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Select a team or channel from the sidebar to start collaborating. Or, create something new to kick off your next big idea.
         </p>

         <div className="grid grid-cols-2 gap-4 w-full">
            <button 
              onClick={() => navigate('/dashboard/teams')}
              className="flex flex-col items-center justify-center gap-3 p-4 bg-[#0d1117]/80 hover:bg-indigo-500/10 border border-gray-700 hover:border-indigo-500/50 rounded-2xl transition-all group"
            >
               <Users size={24} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
               <span className="text-sm font-medium text-gray-300 group-hover:text-white">New Team</span>
            </button>
            <button 
               onClick={() => { console.log('Placeholder: DM'); setUiState('isGlobalPlusOpen', false); }}
               className="flex flex-col items-center justify-center gap-3 p-4 bg-[#0d1117]/80 hover:bg-indigo-500/10 border border-gray-700 hover:border-indigo-500/50 rounded-2xl transition-all group"
            >
               <MessageSquare size={24} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
               <span className="text-sm font-medium text-gray-300 group-hover:text-white">Direct Message</span>
            </button>
         </div>

      </div>
    </div>
  );
};

export default DashboardEmptyState;
