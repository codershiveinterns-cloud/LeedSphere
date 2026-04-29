import { useEffect, useMemo, useState } from 'react';
import {
  Settings as SettingsIcon, Users, Mail, Shield, Bell, AlertTriangle,
  Loader2, Save, Trash2, Copy, Check, RotateCw, UserMinus, LogOut, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Avatar from './Avatar';
import useAppStore from '../../store/useAppStore';
import useFirebaseAuthStore from '../../store/useFirebaseAuthStore';

/**
 * Team settings panel — opened from the ⚙️ icon on TeamDetails.
 *
 * Tabs:
 *   General     — rename + description (PUT /api/teams/:id)
 *   Members     — change role / remove (PUT|DELETE /api/teams/:id/members/:userId)
 *   Invites     — list pending, resend, revoke, copy link
 *   Permissions — local toggles (server enforcement is membership-based today;
 *                 these are kept as visual settings until a permissions model
 *                 ships server-side, persisted to localStorage so they survive)
 *   Notifications — local per-team mute toggles (localStorage)
 *   Danger Zone — leave team (any member) / delete team (admin)
 *
 * The "real" tabs (General/Members/Invites/Danger) hit existing endpoints.
 * Permissions/Notifications are intentionally local — flagged in the UI so
 * the user knows the difference.
 */

const TABS = [
  { key: 'general',       label: 'General',       icon: SettingsIcon },
  { key: 'members',       label: 'Members',       icon: Users },
  { key: 'invites',       label: 'Invites',       icon: Mail },
  { key: 'permissions',   label: 'Permissions',   icon: Shield },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'danger',        label: 'Danger zone',   icon: AlertTriangle },
];

const ROLE_RANK = { member: 1, manager: 2, admin: 3 };

const useTeamPrefs = (teamId, defaults) => {
  const key = `teamPrefs:${teamId}`;
  const [value, setValue] = useState(() => {
    if (!teamId) return defaults;
    try { return { ...defaults, ...(JSON.parse(localStorage.getItem(key) || '{}')) }; }
    catch { return defaults; }
  });
  useEffect(() => {
    if (!teamId) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value, teamId]);
  return [value, setValue];
};

const TeamSettingsModal = ({ isOpen, onClose, team, members = [], invites = [], onTeamDeleted }) => {
  // Keying the parent <Modal> to `isOpen` resets `tab` automatically; storing
  // it as plain state without an effect avoids the set-state-in-effect lint.
  const [tab, setTab] = useState('general');
  const profile = useFirebaseAuthStore((s) => s.profile);
  const {
    updateTeam, deleteTeam, leaveTeam,
    updateTeamMember, removeTeamMember,
    revokeInvite, resendInvite,
  } = useAppStore();

  const teamId = team?._id;

  const myMembership = useMemo(() => members.find(m => String(m.id) === String(profile?._id)), [members, profile?._id]);
  const myRole = myMembership?.role;
  const isAdmin = myRole === 'admin';

  if (!team) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Team settings — ${team.name}`} size="lg">
      <div className="flex flex-col md:flex-row gap-4 -mx-1">
        {/* Tab rail */}
        <nav className="md:w-44 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {/* eslint-disable-next-line no-unused-vars -- TabIcon is rendered as JSX below */}
          {TABS.map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                tab === key
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800'
              }`}
            >
              <TabIcon size={14} /> {label}
            </button>
          ))}
        </nav>

        {/* Tab body */}
        <div className="flex-1 min-h-[320px] max-h-[60vh] overflow-y-auto px-1">
          {tab === 'general' && (
            <GeneralTab
              team={team}
              isAdmin={isAdmin}
              onSave={async (patch) => updateTeam(teamId, patch)}
            />
          )}
          {tab === 'members' && (
            <MembersTab
              members={members}
              isAdmin={isAdmin}
              onChangeRole={async (userId, role) => updateTeamMember(teamId, userId, { role })}
              onRemove={async (userId) => removeTeamMember(teamId, userId)}
            />
          )}
          {tab === 'invites' && (
            <InvitesTab
              invites={invites}
              isAdmin={isAdmin}
              onResend={async (id) => resendInvite(teamId, id)}
              onRevoke={async (id) => revokeInvite(teamId, id)}
            />
          )}
          {tab === 'permissions' && (
            <PermissionsTab teamId={teamId} isAdmin={isAdmin} />
          )}
          {tab === 'notifications' && (
            <NotificationsTab teamId={teamId} />
          )}
          {tab === 'danger' && (
            <DangerTab
              team={team}
              isAdmin={isAdmin}
              myUserId={profile?._id}
              onLeave={async () => { await leaveTeam(teamId, profile?._id); onClose?.(); onTeamDeleted?.(); }}
              onDelete={async () => { await deleteTeam(teamId); onClose?.(); onTeamDeleted?.(); }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

/* ---------- General ---------- */
const GeneralTab = ({ team, isAdmin, onSave }) => {
  const [name, setName] = useState(team.name || '');
  const [description, setDescription] = useState(team.description || '');
  const [saving, setSaving] = useState(false);

  // Reseed only when switching teams. team.name/description are read inside
  // the effect so swapping teams resets the form without warnings.
  useEffect(() => {
    setName(team.name || '');
    setDescription(team.description || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team._id]);

  const dirty = name.trim() !== (team.name || '') || description !== (team.description || '');

  const submit = async (e) => {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description });
      toast.success('Team updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update team');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FieldLabel label="Team name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isAdmin}
          className={inputCls}
          placeholder="Engineering"
          required
        />
      </FieldLabel>
      <FieldLabel label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isAdmin}
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="What does this team work on?"
        />
      </FieldLabel>
      {!isAdmin && (
        <p className="text-xs text-slate-500 dark:text-gray-500">Only team admins can edit these fields.</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!dirty || saving || !isAdmin}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 shadow-sm transition-colors active:scale-95"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes
        </button>
      </div>
    </form>
  );
};

/* ---------- Members ---------- */
const MembersTab = ({ members, isAdmin, onChangeRole, onRemove }) => {
  const [busy, setBusy] = useState({});

  const handleRoleChange = async (userId, role) => {
    setBusy((b) => ({ ...b, [userId]: 'role' }));
    try { await onChangeRole(userId, role); toast.success('Role updated'); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to update role'); }
    finally { setBusy((b) => { const n = { ...b }; delete n[userId]; return n; }); }
  };
  const handleRemove = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from this team?`)) return;
    setBusy((b) => ({ ...b, [userId]: 'remove' }));
    try { await onRemove(userId); toast.success(`${name} removed`); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to remove'); }
    finally { setBusy((b) => { const n = { ...b }; delete n[userId]; return n; }); }
  };

  if (!members.length) return <Empty icon={Users} title="No members yet" />;

  const sorted = [...members].sort((a, b) => (ROLE_RANK[b.role] || 0) - (ROLE_RANK[a.role] || 0));

  return (
    <div className="flex flex-col gap-1">
      {sorted.map((m) => (
        <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
          <Avatar user={m} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-800 dark:text-gray-200 truncate">{m.name}</div>
            <div className="text-xs text-slate-500 dark:text-gray-500 truncate">{m.email}</div>
          </div>
          {isAdmin ? (
            <>
              <select
                value={m.role}
                onChange={(e) => handleRoleChange(m.id, e.target.value)}
                disabled={Boolean(busy[m.id])}
                className="text-xs bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-md px-2 py-1.5 text-slate-700 dark:text-gray-300 outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
              </select>
              <button
                onClick={() => handleRemove(m.id, m.name)}
                disabled={Boolean(busy[m.id])}
                className="p-1.5 text-red-500/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                title="Remove from team"
              >
                {busy[m.id] === 'remove' ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-500 dark:text-gray-500 capitalize">{m.role}</span>
          )}
        </div>
      ))}
    </div>
  );
};

/* ---------- Invites ---------- */
const InvitesTab = ({ invites, isAdmin, onResend, onRevoke }) => {
  const [busy, setBusy] = useState({});
  const [copied, setCopied] = useState(null);

  const copyLink = async (inv) => {
    if (!inv.token) {
      toast.error('No live link — resend the invite first');
      return;
    }
    const url = `${window.location.origin}/accept-invite/${inv.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(inv._id);
      setTimeout(() => setCopied(null), 1500);
      toast.success('Invite link copied');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleResend = async (id) => {
    setBusy((b) => ({ ...b, [id]: 'resend' }));
    try { await onResend(id); toast.success('Invite resent'); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to resend'); }
    finally { setBusy((b) => { const n = { ...b }; delete n[id]; return n; }); }
  };
  const handleRevoke = async (id, email) => {
    if (!window.confirm(`Cancel invite to ${email}?`)) return;
    setBusy((b) => ({ ...b, [id]: 'revoke' }));
    try { await onRevoke(id); toast.success('Invite cancelled'); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to cancel'); }
    finally { setBusy((b) => { const n = { ...b }; delete n[id]; return n; }); }
  };

  if (!isAdmin) {
    return <Empty icon={Mail} title="Admin only" body="Only admins and managers can manage invites." />;
  }
  if (!invites.length) return <Empty icon={Mail} title="No pending invites" />;

  return (
    <div className="flex flex-col gap-2">
      {invites.map((inv) => {
        const expMs = inv.expiresAt ? new Date(inv.expiresAt).getTime() : 0;
        const expired = expMs > 0 && expMs < Date.now();
        const action = busy[inv._id];
        return (
          <div key={inv._id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-gray-800">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 dark:text-gray-200 truncate">{inv.email}</div>
              <div className="text-[11px] text-slate-500 dark:text-gray-500">
                {expired ? 'Expired' : 'Pending'} · {inv.role || 'member'}
              </div>
            </div>
            <button
              onClick={() => copyLink(inv)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 transition-colors"
              title="Copy invite link"
            >
              {copied === inv._id ? <Check size={12} /> : <Copy size={12} />} Link
            </button>
            <button
              onClick={() => handleResend(inv._id)}
              disabled={Boolean(action)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition-colors"
            >
              {action === 'resend' ? <Loader2 size={12} className="animate-spin" /> : <RotateCw size={12} />} Resend
            </button>
            <button
              onClick={() => handleRevoke(inv._id, inv.email)}
              disabled={Boolean(action)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors"
            >
              {action === 'revoke' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Cancel
            </button>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- Permissions (local) ---------- */
const PermissionField = ({ label, hint, value, onChange, disabled }) => (
  <div className="flex flex-col gap-1.5">
    <div>
      <div className="text-sm font-medium text-slate-800 dark:text-gray-200">{label}</div>
      <div className="text-xs text-slate-500 dark:text-gray-500">{hint}</div>
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-md text-sm px-3 py-1.5 text-slate-700 dark:text-gray-300 outline-none cursor-pointer disabled:opacity-50 self-start min-w-[180px]"
    >
      <option value="admin">Admins only</option>
      <option value="admin_manager">Admins &amp; managers</option>
      <option value="all">All members</option>
    </select>
  </div>
);

const PermissionsTab = ({ teamId, isAdmin }) => {
  const [prefs, setPrefs] = useTeamPrefs(teamId, {
    invitePolicy:  'admin_manager',
    channelPolicy: 'admin_manager',
    deletePolicy:  'admin',
  });
  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs text-slate-500 dark:text-gray-500 p-2 rounded bg-slate-50 dark:bg-gray-800/40">
        Note: enforcement still uses team-membership roles server-side. These switches are stored locally per-team.
      </div>
      <PermissionField
        label="Who can invite users"
        hint="Members allowed to send team invitations."
        value={prefs.invitePolicy}
        onChange={(v) => setPrefs({ ...prefs, invitePolicy: v })}
        disabled={!isAdmin}
      />
      <PermissionField
        label="Who can create channels"
        hint="Members allowed to create new channels in this team."
        value={prefs.channelPolicy}
        onChange={(v) => setPrefs({ ...prefs, channelPolicy: v })}
        disabled={!isAdmin}
      />
      <PermissionField
        label="Who can delete messages"
        hint="Members allowed to delete other people's messages."
        value={prefs.deletePolicy}
        onChange={(v) => setPrefs({ ...prefs, deletePolicy: v })}
        disabled={!isAdmin}
      />
    </div>
  );
};

/* ---------- Notifications (local) ---------- */
const NotifToggle = ({ on, onClick, label, hint }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <div>
      <div className="text-sm font-medium text-slate-800 dark:text-gray-200">{label}</div>
      <div className="text-xs text-slate-500 dark:text-gray-500">{hint}</div>
    </div>
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-6 rounded-full relative transition-colors ${on ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-gray-700'}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
    </button>
  </div>
);

const NotificationsTab = ({ teamId }) => {
  const [prefs, setPrefs] = useTeamPrefs(teamId, { messages: true, mentions: true, calls: true });
  const flip = (k) => () => setPrefs({ ...prefs, [k]: !prefs[k] });
  return (
    <div className="flex flex-col divide-y divide-slate-200 dark:divide-gray-800">
      <NotifToggle on={prefs.messages} onClick={flip('messages')} label="Messages" hint="Show alerts for new messages in team channels." />
      <NotifToggle on={prefs.mentions} onClick={flip('mentions')} label="Mentions" hint="Always notify when someone @mentions you here." />
      <NotifToggle on={prefs.calls}    onClick={flip('calls')}    label="Calls"    hint="Ring on incoming calls in this team." />
      <p className="text-[11px] text-slate-500 dark:text-gray-500 pt-3">Saved on this device.</p>
    </div>
  );
};

/* ---------- Danger Zone ---------- */
const DangerTab = ({ team, isAdmin, myUserId, onLeave, onDelete }) => {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(null);

  const handleLeave = async () => {
    if (!window.confirm(`Leave "${team.name}"?`)) return;
    setBusy('leave');
    try { await onLeave(); toast.success('Left team'); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to leave'); }
    finally { setBusy(null); }
  };
  const handleDelete = async () => {
    setBusy('delete');
    try { await onDelete(); toast.success('Team deleted'); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to delete'); }
    finally { setBusy(null); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <LogOut size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-800 dark:text-gray-200">Leave this team</div>
            <div className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">You'll lose access to channels and messages until re-invited.</div>
          </div>
          <button
            onClick={handleLeave}
            disabled={!myUserId || busy === 'leave'}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 transition-colors"
          >
            {busy === 'leave' ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />} Leave team
          </button>
        </div>
      </div>

      <div className={`rounded-lg border p-4 ${isAdmin ? 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10' : 'border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 opacity-60'}`}>
        <div className="flex items-start gap-3">
          <Trash2 size={18} className={isAdmin ? 'text-red-600 dark:text-red-400 mt-0.5 shrink-0' : 'text-slate-500 mt-0.5 shrink-0'} />
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-800 dark:text-gray-200">Delete team</div>
            <div className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
              {isAdmin ? <>Permanently deletes <strong>{team.name}</strong> and all its channels. This cannot be undone.</> : 'Only admins can delete this team.'}
            </div>
            {isAdmin && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`Type "${team.name}" to confirm`}
                  className={inputCls + ' flex-1'}
                />
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== team.name || busy === 'delete'}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors"
                >
                  {busy === 'delete' ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete forever
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- shared bits ---------- */
const inputCls = 'bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors placeholder-slate-400 dark:placeholder-gray-600 disabled:opacity-60';

const FieldLabel = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-medium text-slate-700 dark:text-gray-300">{label}</span>
    {children}
  </label>
);

// eslint-disable-next-line no-unused-vars
const Empty = ({ icon: Icon, title, body }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon size={32} className="text-slate-300 dark:text-gray-700 mb-3" />
    <p className="text-sm font-medium text-slate-700 dark:text-gray-300">{title}</p>
    {body && <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{body}</p>}
  </div>
);

export default TeamSettingsModal;
