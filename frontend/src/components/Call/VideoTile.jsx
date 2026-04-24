import { useEffect, useRef } from 'react';
import { MicOff, Monitor } from 'lucide-react';

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '?';

const avatarBg = (seed = '') => {
  const palette = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

/**
 * VideoTile — renders one participant's video tile.
 *
 * Props:
 *   stream       MediaStream | null
 *   name         string
 *   avatar       string
 *   isLocal      boolean — local self-view should be muted and mirrored
 *   camOn        boolean — when false, show avatar placeholder
 *   micOn        boolean — when false, show mic-off indicator
 *   screenSharing boolean — show screen icon
 *   highlighted  boolean — active-speaker ring
 */
const VideoTile = ({ stream, name, avatar, isLocal, camOn = true, micOn = true, screenSharing = false, highlighted = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream || null;
  }, [stream]);

  const showPlaceholder = !stream || !camOn;

  return (
    <div
      className={`relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 transition-all duration-200 ${
        highlighted ? 'ring-2 ring-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]' : 'ring-1 ring-slate-800'
      }`}
    >
      {/* Video element — always present so its srcObject can be updated */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${showPlaceholder ? 'opacity-0' : 'opacity-100'} ${isLocal && !screenSharing ? 'scale-x-[-1]' : ''}`}
      />

      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center">
          {avatar && avatar.startsWith('http') ? (
            <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10" />
          ) : (
            <div className={`w-16 h-16 rounded-full ${avatarBg(name || '')} text-white text-lg font-semibold flex items-center justify-center`}>
              {initials(name)}
            </div>
          )}
        </div>
      )}

      {/* Footer bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center gap-1.5 text-white text-xs font-medium truncate">
          {!micOn && <MicOff size={12} className="text-red-400 shrink-0" />}
          {screenSharing && <Monitor size={12} className="text-emerald-400 shrink-0" />}
          <span className="truncate">{isLocal ? `${name} (you)` : name}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoTile;
