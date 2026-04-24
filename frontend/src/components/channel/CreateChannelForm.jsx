import { useEffect, useMemo, useState } from 'react';
import { Hash, Lock, Check, Loader2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '?';

const avatarBg = (seed = '') => {
  const palette = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

/**
 * Shared create-channel form. Used inside any Modal host.
 * Props:
 *   teams            — array of {_id, name}
 *   defaultTeamId    — preselected team
 *   lockTeam         — when true, team is fixed (used from TeamDetails)
 *   onCreated(channel) — called after a successful create
 *   onCancel()       — called when user hits Cancel
 */
const CreateChannelForm = ({ teams, defaultTeamId = '', lockTeam = false, onCreated, onCancel }) => {
  const { user } = useAuthStore();
  const { activeWorkspace, createTeamChannel, getTeamMembers, fetchTeamChannels, fetchTeams } = useAppStore();

  const [teamId, setTeamId] = useState(defaultTeamId);
  const [name, setName] = useState('');
  const [type, setType] = useState('public');
  const [selected, setSelected] = useState(() => new Set()); // userIds
  const [filter, setFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // When teamId changes, make sure we have team members. getTeamMembers is synchronous but the
  // underlying team list may not yet be loaded — opportunistically fetch.
  useEffect(() => {
    if (teamId && typeof fetchTeams === 'function' && activeWorkspace?._id) {
      // no-op if already loaded; fetchTeams guarded by store
      fetchTeams(activeWorkspace._id);
    }
  }, [teamId, fetchTeams, activeWorkspace?._id]);

  const members = useMemo(() => (teamId ? getTeamMembers(teamId) : []), [teamId, getTeamMembers]);

  const filteredMembers = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const list = members.filter((m) => m.id !== user?._id); // creator auto-included, don't show
    if (!f) return list;
    return list.filter((m) => m.name?.toLowerCase().includes(f) || m.email?.toLowerCase().includes(f));
  }, [members, filter, user?._id]);

  const toggleMember = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !teamId || !activeWorkspace?._id) return;
    setSubmitting(true);
    try {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const channel = await createTeamChannel(
        teamId,
        activeWorkspace._id,
        slug || name,
        type,
        type === 'private' ? Array.from(selected) : [],
      );
      toast.success(`#${channel.name} created`);
      // Make sure sidebar refresh shows it
      fetchTeamChannels(teamId);
      onCreated?.(channel);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create channel');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors placeholder-slate-400 dark:placeholder-gray-600';
  const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1.5';

  const canSubmit = !!name.trim() && !!teamId && !submitting;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!lockTeam && (
        <div>
          <label className={labelCls}>Team</label>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={inputCls}>
            <option value="">Select a team...</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelCls}>Channel name</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 text-sm">#</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. marketing"
            className={inputCls + ' pl-7'}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Type</label>
        <div className="grid grid-cols-2 gap-2">
          <TypeCard
            active={type === 'public'}
            icon={<Hash size={15} />}
            title="Public"
            desc="All team members"
            onClick={() => setType('public')}
          />
          <TypeCard
            active={type === 'private'}
            icon={<Lock size={15} />}
            title="Private"
            desc="Invite only"
            onClick={() => setType('private')}
          />
        </div>
      </div>

      {type === 'private' && (
        <div>
          <label className={labelCls}>Members <span className="font-normal text-slate-400 dark:text-gray-600">(you are added automatically)</span></label>
          {!teamId ? (
            <p className="text-xs text-slate-500 dark:text-gray-500">Select a team first</p>
          ) : filteredMembers.length === 0 && !filter ? (
            <p className="text-xs text-slate-500 dark:text-gray-500">No other members in this team yet</p>
          ) : (
            <>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search members..."
                className={inputCls + ' mb-2'}
              />
              <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-gray-700 rounded-lg divide-y divide-slate-100 dark:divide-gray-800">
                {filteredMembers.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-gray-500 px-3 py-4 text-center">No matches</p>
                ) : filteredMembers.map((m) => {
                  const isSelected = selected.has(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-500/10'
                          : 'hover:bg-slate-50 dark:hover:bg-[#0d1117]/60'
                      }`}
                    >
                      {m.avatar && m.avatar.startsWith('http') ? (
                        <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className={`w-7 h-7 rounded-full ${avatarBg(m.name)} text-white text-[10px] font-semibold flex items-center justify-center`}>
                          {initials(m.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 dark:text-gray-100 truncate">{m.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-gray-500 truncate">{m.designation || m.email}</p>
                      </div>
                      <span className={`w-5 h-5 rounded flex items-center justify-center border ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 dark:border-gray-600 text-transparent'
                      }`}>
                        <Check size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-gray-500">
                {selected.size} selected
              </p>
            </>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 shadow-sm transition-colors active:scale-95 inline-flex items-center gap-1.5"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Create channel
        </button>
      </div>
    </form>
  );
};

const TypeCard = ({ active, icon, title, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
      active
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
        : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
    }`}
  >
    <span className={`mt-0.5 ${active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-gray-400'}`}>
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${active ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-800 dark:text-gray-200'}`}>{title}</p>
      <p className="text-[11px] text-slate-500 dark:text-gray-500">{desc}</p>
    </div>
  </button>
);

export default CreateChannelForm;
