import { useMemo } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, X } from 'lucide-react';
import useCallStore from '../../store/useCallStore';
import useFirebaseAuthStore from '../../store/useFirebaseAuthStore';
import useAppStore from '../../store/useAppStore';
import VideoTile from './VideoTile';
import toast from 'react-hot-toast';

/**
 * CallRoom — the active call overlay. Mounted globally (Dashboard) so it
 * survives navigation while the user is in a call.
 *
 * Layout: floating bottom-right card by default; can expand to full-screen.
 * Controls: mic, camera, screen share, leave.
 */

const gridColsFor = (n) => {
  if (n <= 1) return 'grid-cols-1';
  if (n <= 2) return 'grid-cols-2';
  if (n <= 4) return 'grid-cols-2';
  if (n <= 6) return 'grid-cols-3';
  return 'grid-cols-4';
};

const CallRoom = () => {
  const {
    isInCall, channelId, peers, localStreamTick, micOn, camOn, screenOn,
    activeSpeakerSocketId,
    toggleMic, toggleCam, toggleScreen, leaveCall, getLocalStream,
  } = useCallStore();
  // Mongo profile (post-Firebase migration). Same source the chat tile reads
  // from, so the local video tile always shows the right name/avatar.
  const profile = useFirebaseAuthStore((s) => s.profile);
  const firebaseUser = useFirebaseAuthStore((s) => s.currentUser);
  const user = profile || (firebaseUser ? { name: firebaseUser.displayName, avatar: firebaseUser.photoURL } : null);
  const { findChannelById } = useAppStore();

  // Re-read local stream whenever the tick bumps (mute/screen-share swap tracks).
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tick is a re-render trigger, not a closed-over value.
  const localStream = useMemo(() => getLocalStream(), [localStreamTick, getLocalStream]);
  const channel = channelId ? findChannelById(channelId) : null;
  const peerEntries = Object.entries(peers);
  const totalTiles = peerEntries.length + 1; // +1 for self
  const cols = gridColsFor(totalTiles);

  if (!isInCall) return null;

  const onLeave = async () => {
    await leaveCall();
    toast.success('Left call');
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(820px,calc(100vw-2rem))] bg-slate-950/95 dark:bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 text-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-sm font-semibold truncate">
            {channel?.name ? `#${channel.name}` : 'Call'}
          </p>
          <span className="text-[11px] text-slate-400">{totalTiles} in call</span>
        </div>
        <button
          onClick={onLeave}
          title="Leave"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Video grid */}
      <div className="p-3 bg-slate-950">
        <div className={`grid ${cols} gap-2`}>
          <VideoTile
            stream={localStream}
            name={user?.name || 'You'}
            avatar={user?.avatar}
            isLocal
            camOn={camOn}
            micOn={micOn}
            screenSharing={screenOn}
          />
          {peerEntries.map(([sid, p]) => (
            <VideoTile
              key={sid}
              stream={p.stream}
              name={p.name || 'Guest'}
              avatar={p.avatar}
              isLocal={false}
              camOn={!!p.stream && p.stream.getVideoTracks?.().some((t) => t.enabled)}
              micOn={!p.stream ? true : p.stream.getAudioTracks?.().some((t) => t.enabled)}
              highlighted={activeSpeakerSocketId === sid}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/80 border-t border-slate-800">
        <ControlBtn
          active={micOn}
          onClick={toggleMic}
          title={micOn ? 'Mute' : 'Unmute'}
          OnIcon={Mic}
          OffIcon={MicOff}
        />
        <ControlBtn
          active={camOn}
          onClick={toggleCam}
          title={camOn ? 'Stop video' : 'Start video'}
          OnIcon={Video}
          OffIcon={VideoOff}
        />
        <ControlBtn
          active={!screenOn}
          onClick={toggleScreen}
          title={screenOn ? 'Stop sharing' : 'Share screen'}
          OnIcon={Monitor}
          OffIcon={MonitorOff}
          mutedLook
        />
        <button
          onClick={onLeave}
          title="Leave call"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition-colors active:scale-95"
        >
          <PhoneOff size={16} /> Leave
        </button>
      </div>
    </div>
  );
};

const ControlBtn = ({ active, onClick, title, OnIcon, OffIcon, mutedLook = false }) => {
  const Icon = active ? OnIcon : OffIcon;
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
        active
          ? 'bg-slate-700 hover:bg-slate-600 text-white'
          : mutedLook
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-red-600 hover:bg-red-500 text-white'
      }`}
    >
      <Icon size={16} />
    </button>
  );
};

export default CallRoom;
