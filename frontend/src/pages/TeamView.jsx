import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Users, UserPlus, Merge, Star, MoreVertical, Edit2, Trash2, ExternalLink, Hash } from 'lucide-react';

const TeamView = () => {
  const { activeWorkspace, starredTeams, toggleStarredTeam, teams, addTeam, setActiveTeam, activeTeam, removeTeam, getTeamMembers, getTeamChannels } = useAppStore();
  const { simulatedRole } = useOutletContext();
  const navigate = useNavigate();
  const [newTeamName, setNewTeamName] = useState('');

  // Merge state
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');

  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (simulatedRole === 'Member') return toast.error('Only Admins/Managers can create teams.');
    if (!newTeamName.trim() || !activeWorkspace) return;

    const generatedId = `team_${Date.now()}`;
    const newTeam = {
      _id: generatedId,
      name: newTeamName,
      members: [],
      createdAt: new Date().toISOString()
    };

    addTeam(newTeam);
    setActiveTeam(newTeam);
    setNewTeamName('');
    toast.success('Team created');
    navigate(`/dashboard/team/${generatedId}`);
  };

  const handleDeleteTeam = (e, teamId, teamName) => {
    e.stopPropagation();
    if (simulatedRole !== 'Admin') return toast.error('Only Admins can delete teams.');
    removeTeam(teamId);
    toast.success(`"${teamName}" deleted`);
    if (activeTeam?._id === teamId) {
      navigate('/dashboard/teams');
    }
  };

  const handleMerge = async () => {
    if (simulatedRole !== 'Admin') return toast.error('Only Admins can merge teams.');
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return toast.error('Select two distinct teams');
    const sourceName = teams.find(t => t._id === mergeSource)?.name;
    removeTeam(mergeSource);
    toast.success(`"${sourceName}" merged successfully!`);
    setMergeSource('');
    setMergeTarget('');
  };

  if (!activeWorkspace) return <div className="p-8 text-white">Select a workspace</div>;

  return (
    <div className="flex-1 bg-[#0d1117] flex flex-col font-sans relative overflow-y-auto">
      <div className="h-14 border-b border-gray-800 flex items-center px-6 shrink-0 bg-[#161b22]/90 backdrop-blur-sm z-10 w-full shadow-sm sticky top-0">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Users size={20} className="text-indigo-400" /> Team Management
        </h2>
        <span className="ml-3 text-sm text-gray-500">{teams.length} team{teams.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="p-8 max-w-4xl w-full mx-auto flex flex-col gap-8 pb-24">

        {/* Create Node */}
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><UserPlus size={18} /> Create New Team</h3>
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
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Merge size={18} className="text-red-400" /> Merge Teams (Danger Zone)</h3>
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

        {/* Empty State */}
        {teams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={56} className="text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No teams yet</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-md">Create your first team to start organizing members, channels, and projects.</p>
          </div>
        )}

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Array.isArray(teams) ? teams : []).map(team => {
            const isStarred = (Array.isArray(starredTeams) ? starredTeams : []).includes(team._id);
            const members = getTeamMembers(team._id);
            const teamChannels = getTeamChannels(team._id);
            const onlineCount = members.filter(m => m.status === 'online').length;
            const mockTags = ['Frontend', 'Q3'];

            return (
              <div key={team._id} className="group relative bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm hover:border-indigo-500/50 hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all w-full cursor-pointer overflow-hidden" onClick={() => { setActiveTeam(team); navigate(`/dashboard/team/${team._id}`); }}>

                {/* Overlay Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[#161b22]/90 backdrop-blur rounded-lg shadow-lg border border-gray-700 p-1">
                  <button onClick={(e) => { e.stopPropagation(); setActiveTeam(team); navigate(`/dashboard/team/${team._id}`); }} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors" title="Open"><ExternalLink size={16} /></button>
                  {simulatedRole !== 'Member' && (
                    <button onClick={(e) => e.stopPropagation()} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors" title="Rename"><Edit2 size={16} /></button>
                  )}
                  {simulatedRole === 'Admin' && (
                    <>
                      <div className="w-px h-4 bg-gray-700 my-auto mx-1"></div>
                      <button onClick={(e) => handleDeleteTeam(e, team._id, team.name)} className="p-1.5 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStarredTeam(team._id); }}
                      className={`p-1.5 rounded-md transition-colors -ml-1.5 ${isStarred ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800'}`}
                    >
                      <Star size={20} fill={isStarred ? "currentColor" : "none"} />
                    </button>
                    <div>
                      <h4 className="font-bold text-white text-lg tracking-tight group-hover:text-indigo-300 transition-colors">{team.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Core cross-functional squad</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex gap-2 mb-5">
                  {mockTags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-800/50 text-gray-400 border border-gray-700">{tag}</span>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  {/* Avatar Group */}
                  <div className="flex -space-x-2">
                    {members.slice(0, 3).map((m, i) => (
                      <img key={m.id} className="w-8 h-8 rounded-full border-2 border-[#161b22] object-cover ring-1 ring-gray-800" src={m.avatar} alt={m.name} />
                    ))}
                    {members.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#161b22] bg-gray-800 text-gray-400 text-xs font-bold flex items-center justify-center ring-1 ring-gray-700">+{members.length - 3}</div>
                    )}
                    {members.length === 0 && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#161b22] bg-gray-800 text-gray-500 text-xs flex items-center justify-center ring-1 ring-gray-700">
                        <Users size={14} />
                      </div>
                    )}
                  </div>

                  {/* Analytics Stats Row */}
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-400 pt-3 border-t border-gray-800/50">
                    <span className="flex items-center gap-1"><Users size={14} className="text-gray-500" /> {members.length} Members</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> {onlineCount} Online</span>
                    <span className="flex items-center gap-1"><Hash size={14} className="text-gray-500" /> {teamChannels.length} Channels</span>
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
