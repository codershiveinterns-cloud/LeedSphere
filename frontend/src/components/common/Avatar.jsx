import { resolveAvatar, DEFAULT_AVATAR } from '../../lib/avatar';

/**
 * Single source of truth for rendering a user avatar.
 *
 * Props:
 *   user      — any object with { profileImage?, avatar?, name? }
 *   size      — "xs" | "sm" | "md" | "lg" | "xl"  (default: "md")
 *   className — extra classes appended to the wrapper
 *   square    — bool, render with rounded-xl instead of rounded-full
 *               (matches the chat-message style)
 *
 * Resolution order (handled by resolveAvatar):
 *   profileImage → legacy https `avatar` → DEFAULT_AVATAR
 *
 * On <img> error, the src is swapped to the default once. No initial
 * letters, no auto gradients — strictly image or default-image.
 */

const SIZE_CLASSES = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

const Avatar = ({ user, size = 'md', className = '', square = false, alt }) => {
  const src   = resolveAvatar(user);
  const dim   = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const shape = square ? 'rounded-xl' : 'rounded-full';
  const label = alt ?? (user?.name ? `${user.name}'s avatar` : 'Profile');

  return (
    <img
      src={src}
      alt={label}
      onError={(e) => {
        if (e.currentTarget.src !== DEFAULT_AVATAR && !e.currentTarget.src.endsWith(DEFAULT_AVATAR)) {
          e.currentTarget.src = DEFAULT_AVATAR;
        }
      }}
      className={`${dim} ${shape} object-cover bg-slate-200 dark:bg-gray-700 ${className}`.trim()}
      draggable={false}
    />
  );
};

export default Avatar;
