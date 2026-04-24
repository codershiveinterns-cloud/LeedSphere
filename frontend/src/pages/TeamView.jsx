import { useState } from 'react';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Users, UserPlus, Merge, Star, Trash2, ExternalLink, Hash } from 'lucide-react';

const TeamView = () => {
  const {
    activeWorkspace, starredTeams, toggleStarredTeam,
    teams, createTeam, setActiveTeam, activeTeam, deleteTeam, mergeTeams,
    getTeamMembers, getTeamChannels,
  } = useAppStore();
  const { simulatedRole } = useOutletContext();
  const navigate = useNavigate();
  const [newTeamName, setNewTeamName] = useState('');
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (simulatedRole === 'Member') return toast.error('Only Admins/Managers can create teams.');
    if (!newTeamName.trim() || !activeWorkspace) return;
    setCreating(true);
    try {
      const team = await createTeam(activeWorkspace._id, newTeamName);
      setActiveTeam(team);
      setNewTeamName('');
      toast.success('Team created');
      navigate(`/dashboard/team/${team._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTeam = async (e, teamId, teamName) => {
    e.stopPropagation();
    if (simulatedRole !== 'Admin') return toast.error('Only Admins can delete teams.');
    try {
      await deleteTeam(teamId);
      toast.success(`"${teamName}" deleted`);
      if (activeTeam?._id === teamId) navigate('/dashboard/teams');
    } catch {
      toast.error('Failed to delete team');
    }
  };

  const handleMerge = async () => {
    if (simulatedRole !== 'Admin') return toast.error('Only Admins can merge teams.');
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return toast.error('Select two distinct teams');
    try {
      await mergeTeams(mergeTarget, mergeSource);
      toast.success('Teams merged successfully!');
      setMergeSource('');
      setMergeTarget('');
    } catch {
      toast.error('Failed to merge teams');
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] p-8 text-slate-500 dark:text-gray-400 transition-colors duration-200">
        Select a workspace
      </div>
    );
  }

  const inputCls = 'bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors placeholder-slate-400 dark:placeholder-gray-600';

  return (
    <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex flex-col font-sans relative overflow-y-auto transition-colors duration-200">
      <div className="h-14 border-b border-slate-200 dark:border-gray-800 flex items-center px-6 shrink-0 bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-sm z-10 w-full shadow-sm sticky top-0 transition-colors duration-200">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Users size={20} className="text-indigo-600 dark:text-indigo-400" /> Team Management
        </h2>
        <span className="ml-3 text-sm text-slate-500 dark:text-gray-500">{teams.length} team{teams.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="p-8 max-w-4xl w-full mx-auto flex flex-col gap-8 pb-24">

        {/* Create */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors duration-200">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><UserPlus size={18} /> Create New Team</h3>
          <form onSubmit={handleCreateTeam} className="flex gap-4">
            <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Engineering, Marketing"
              className={`flex-1 ${inputCls}`} />
            <button type="submit" disabled={!newTeamName.trim() || creating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm active:scale-95">
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        {/* Merge */}
        {teams.length > 1 && (
          <div className="bg-white dark:bg-[#161b22] border border-red-200 dark:border-red-900/30 rounded-xl p-6 shadow-sm transition-colors duration-200">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Merge size={18} className="text-red-500 dark:text-red-400" /> Merge Teams
            </h3>
            <div className="flex items-center gap-4">
              <select value={mergeSource} onChange={e => setMergeSource(e.target.value)} className={`flex-1 ${inputCls}`}>
                <option value="">Source (will be deleted)</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <span className="text-slate-400 dark:text-gray-500 font-bold">INTO</span>
              <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} className={`flex-1 ${inputCls}`}>
                <option value="">Target (will receive members)</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <button onClick={handleMerge} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-red-500 shadow-sm active:scale-95">Merge</button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {teams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <Users size={56} className="text-slate-300 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No teams yet</h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6 max-w-md">Create your first team to start organizing members, channels, and projects.</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map(team => {
            const isStarred = starredTeams.includes(team._id);
            const members = getTeamMembers(team._id);
            const channels = getTeamChannels(team._id);

            return (
              <div key={team._id} className="group relative bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                onClick={() => { setActiveTeam(team); navigate(`/dashboard/team/${team._id}`); }}>

                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/95 dark:bg-[#161b22]/90 backdrop-blur rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 p-1">
                  <button onClick={(e) => { e.stopPropagation(); setActiveTeam(team); navigate(`/dashboard/team/${team._id}`); }} className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-md transition-colors active:scale-90" title="Open"><ExternalLink size={16} /></button>
                  {simulatedRole === 'Admin' && (
                    <>
                      <div className="w-px h-4 bg-slate-200 dark:bg-gray-700 my-auto mx-1"></div>
                      <button onClick={(e) => handleDeleteTeam(e, team._id, team.name)} className="p-1.5 text-red-500/80 dark:text-red-500/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors active:scale-90" title="Delete"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <button onClick={(e) => { e.stopPropagation(); toggleStarredTeam(team._id); }}
                    className={`p-1.5 rounded-md transition-colors -ml-1.5 active:scale-90 ${isStarred ? 'text-yellow-500 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-400/10' : 'text-slate-300 dark:text-gray-600 hover:text-slate-500 dark:hover:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800'}`}>
                    <Star size={20} fill={isStarred ? "currentColor" : "none"} />
                  </button>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{team.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{team.description || 'Team workspace'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex -space-x-2">
                    {members.slice(0, 3).map(m => (
                      <img key={m.id} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#161b22] object-cover ring-1 ring-slate-200 dark:ring-gray-800" src={m.avatar} alt={m.name} />
                    ))}
                    {members.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#161b22] bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 text-xs font-bold flex items-center justify-center ring-1 ring-slate-200 dark:ring-gray-700">+{members.length - 3}</div>
                    )}
                    {members.length === 0 && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500 text-xs flex items-center justify-center ring-1 ring-slate-200 dark:ring-gray-700"><Users size={14} /></div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-gray-400 pt-3 border-t border-slate-100 dark:border-gray-800/50">
                    <span className="flex items-center gap-1"><Users size={14} className="text-slate-400 dark:text-gray-500" /> {members.length} Members</span>
                    <span className="flex items-center gap-1"><Hash size={14} className="text-slate-400 dark:text-gray-500" /> {channels.length} Channels</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeamView;
