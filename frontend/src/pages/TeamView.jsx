import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';
import { Users, UserPlus, Merge } from 'lucide-react';

const TeamView = () => {
  const { activeWorkspace } = useAppStore();
  const { simulatedRole } = useOutletContext();
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  
  // Merge state
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');

  const fetchTeams = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await api.get(`/teams/${activeWorkspace._id}`);
      setTeams(res.data);
    } catch {
      toast.error('Failed to load teams');
    }
  };

  useEffect(() => { fetchTeams(); }, [activeWorkspace]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (simulatedRole === 'Member') return toast.error('Only Admins/Managers can create teams.');
    if (!newTeamName.trim() || !activeWorkspace) return;
    try {
      const res = await api.post('/teams', { workspaceId: activeWorkspace._id, name: newTeamName });
      setTeams([...teams, res.data]);
      setNewTeamName('');
      toast.success('Team created');
    } catch {
      toast.error('Creation failed');
    }
  };

  const handleMerge = async () => {
    if (simulatedRole !== 'Admin') return toast.error('Only Admins can merge teams.');
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return toast.error('Select two distinct teams');
    
    try {
      await api.post('/teams/merge', { sourceTeamId: mergeSource, targetTeamId: mergeTarget });
      toast.success('Teams merged successfully!');
      setMergeSource('');
      setMergeTarget('');
      fetchTeams();
    } catch {
      toast.error('Merge failed');
    }
  };

  if (!activeWorkspace) return <div className="p-8 text-white">Select a workspace</div>;

  return (
    <div className="flex-1 bg-[#0d1117] flex flex-col font-sans relative overflow-y-auto">
      <div className="h-14 border-b border-gray-800 flex items-center px-6 shrink-0 bg-[#161b22]/90 backdrop-blur-sm z-10 w-full shadow-sm sticky top-0">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Users size={20} className="text-indigo-400" /> Team Management
        </h2>
      </div>

      <div className="p-8 max-w-4xl w-full mx-auto flex flex-col gap-8 pb-24">
        
        {/* Create Node */}
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><UserPlus size={18}/> Create New Team</h3>
          <form onSubmit={handleCreateTeam} className="flex gap-4">
            <input 
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              placeholder="e.g. Engineering, Marketing"
              className="flex-1 bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <button type="submit" disabled={!newTeamName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">Create</button>
          </form>
        </div>

        {/* Merge Node */}
        {teams.length > 1 && (
          <div className="bg-[#161b22] border border-red-900/30 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Merge size={18} className="text-red-400"/> Merge Teams (Danger Zone)</h3>
            <div className="flex items-center gap-4">
              <select value={mergeSource} onChange={e => setMergeSource(e.target.value)} className="flex-1 bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-white outline-none">
                <option value="">Select Target A (Will be deleted)</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <span className="text-gray-500 font-bold">INTO</span>
              <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} className="flex-1 bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-white outline-none">
                <option value="">Select Target B (Will receive members)</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <button onClick={handleMerge} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-red-500">Merge Nodes</button>
            </div>
          </div>
        )}

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team._id} className="bg-[#161b22] border border-gray-800 rounded-xl p-5 shadow-sm hover:border-gray-700 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-white text-lg">{team.name}</h4>
                <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-1 rounded-full font-medium">{team.members.length} Members</span>
              </div>
              <div className="text-sm text-gray-500">
                {team.members.length === 0 ? 'No members added yet. Invite via dashboard (Coming Soon).' : 'Members listed here.'}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TeamView;
