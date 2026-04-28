import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Hash } from 'lucide-react';
import useCallStore from '../../store/useCallStore';
import { socket } from '../../hooks/useSocket';

/**
 * Floating modal that pops over everything when an `incoming-call` socket
 * event lands. Accept routes to the channel and joins the call (the call
 * store auto-joins when the URL pattern resolves; we also navigate so the
 * user lands in the chat). Reject emits `call:reject` to the caller.
 *
 * Mounted globally in Dashboard so the modal survives navigation while
 * ringing.
 */
const IncomingCallModal = () => {
  const navigate = useNavigate();
  const incoming = useCallStore((s) => s.incomingCall);
  const clear    = useCallStore((s) => s.clearIncomingCall);
  const joinCall = useCallStore((s) => s.joinCall);

  if (!incoming) return null;

  const onAccept = async () => {
    const channelId = incoming.channelId;
    clear();
    // Navigate to the channel first so the chat panel loads — joinCall is
    // mounted as soon as we reach the channel route.
    navigate(`/dashboard/channel/${channelId}`);
    try { await joinCall?.(channelId); }
    catch (err) { console.warn('[call] joinCall after accept failed:', err?.message); }
  };

  const onReject = () => {
    socket.emit('call:reject', { channelId: incoming.channelId });
    clear();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/30">
            {incoming.callerAvatar
              ? <img src={incoming.callerAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              : (incoming.callerName?.charAt(0).toUpperCase() || 'C')}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 animate-pulse">
            Incoming call
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white truncate">
            {incoming.callerName || 'Someone'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400 inline-flex items-center gap-1 justify-center">
            <Hash size={13} /> {incoming.channelName || 'channel'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 px-6 pb-6 pt-2">
          <button
            onClick={onReject}
            title="Decline"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-md transition-colors active:scale-95"
          >
            <PhoneOff size={16} /> Decline
          </button>
          <button
            onClick={onAccept}
            title="Accept"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition-colors active:scale-95"
          >
            <Phone size={16} /> Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
