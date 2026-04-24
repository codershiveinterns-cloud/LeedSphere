import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Hash, Lock, LogOut, Trash2, Crown, Loader2 } from 'lucide-react';
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

const ChannelInfoModal = ({ open, onClose, channelId }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchChannelMembers, leaveChannel, deleteChannel, activeTeam, getTeamMembers } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null); // 'leave' | 'delete'

  useEffect(() => {
    if (!open || !channelId) return;
    setLoading(true);
    setData(null);
    fetchChannelMembers(channelId)
      .then(setData)
      .catch(() => toast.error('Failed to load channel'))
      .finally(() => setLoading(false));
  }, [open, channelId, fetchChannelMembers]);

  if (!open) return null;

  const creatorId = data?.createdBy?._id || data?.createdBy;
  const isCreator = data && user?._id && String(creatorId) === String(user._id);

  // A team admin can always delete (matches backend rule).
  const teamMemberships = activeTeam ? getTeamMembers(activeTeam._id) : [];
  const myTeamMembership = teamMemberships.find((m) => m.id === user?._id);
  const isTeamAdmin = myTeamMembership?.role === 'admin';
  const canDelete = isCreator || isTeamAdmin;

  // Private members stored on channel; public can only show leave (no-op server-side) for non-creators.
  const isPrivate = data?.isPrivate || data?.type === 'private';
  const canLeave = data && !isCreator && isPrivate; // leaving public is a no-op; hide.

  const handleLeave = async () => {
    if (!data) return;
    setBusy('leave');
    try {
      await leaveChannel(data._id, data.teamId?._id || data.teamId);
      toast.success(`Left #${data.name}`);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to leave');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    if (!confirm(`Delete #${data.name}? This cannot be undone.`)) return;
    setBusy('delete');
    try {
      await deleteChannel(data._id, data.teamId?._id || data.teamId);
      toast.success(`Deleted #${data.name}`);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isPrivate
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'
                : 'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {isPrivate ? <Lock size={15} /> : <Hash size={15} />}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                {data?.name ? `#${data.name}` : 'Channel'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-gray-500 capitalize">
                {isPrivate ? 'Private channel' : 'Public channel'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors active:scale-90">
            <X size={18} />
          </button>
        </div>

        {/* Members */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-500 border-b border-slate-100 dark:border-gray-800">
            <Users size={12} />
            {loading ? 'Loading members' : `${data?.members?.length || 0} Members`}
          </div>
          <div className="flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-400 dark:text-gray-500">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : !data?.members?.length ? (
              <p className="text-center text-sm text-slate-500 dark:text-gray-500 py-10">No members</p>
            ) : (
              data.members.map((m) => (
                <div key={m._id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-[#0d1117]/50 transition-colors">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full ${avatarBg(m.name || '')} text-white text-xs font-semibold flex items-center justify-center`}>
                      {initials(m.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-slate-900 dark:text-gray-100 truncate">{m.name || 'Unknown'}</p>
                      {String(m._id) === String(creatorId) && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30 px-1.5 py-0.5 rounded">
                          <Crown size={9} /> Creator
                        </span>
                      )}
                    </div>
                    {m.email && <p className="text-xs text-slate-500 dark:text-gray-500 truncate">{m.email}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer actions */}
        {(canLeave || canDelete) && (
          <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-[#0d1117]/40">
            {canLeave && (
              <button
                onClick={handleLeave}
                disabled={busy === 'leave'}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
              >
                {busy === 'leave' ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                Leave channel
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={busy === 'delete'}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
              >
                {busy === 'delete' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete channel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelInfoModal;
