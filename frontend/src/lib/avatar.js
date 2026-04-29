/**
 * Avatar resolution + Cloudinary unsigned uploader.
 *
 * Single source of truth for "what image do we show for this user." Auto-
 * generated avatars (pravatar/initial gradients) have been removed — every
 * caller now resolves to either the user's uploaded `profileImage` or the
 * static SVG default in /public/images/default-avatar.svg.
 *
 * Upload happens directly browser → Cloudinary so binary data never passes
 * through our Node API. The frontend then PATCHes only the resulting secure
 * URL to /api/user/profile-image.
 *
 * Required env vars (frontend .env):
 *   VITE_CLOUDINARY_CLOUD_NAME    e.g. "leedsphere"
 *   VITE_CLOUDINARY_UPLOAD_PRESET an unsigned preset configured in Cloudinary
 */

export const DEFAULT_AVATAR = '/images/default-avatar.svg';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Pick the right URL to render for a user-like object. Prefers the
 * explicitly-uploaded profileImage; falls back to the legacy `avatar` field
 * (Firebase google photo) ONLY if it's a real https URL — never a generated
 * pravatar/dicebear/etc. — and finally to the static default.
 */
export const resolveAvatar = (userLike) => {
  if (!userLike) return DEFAULT_AVATAR;
  if (userLike.profileImage) return userLike.profileImage;
  const legacy = userLike.avatar;
  if (typeof legacy === 'string' && /^https:\/\//i.test(legacy)) {
    // Reject auto-generated avatar hosts even if some old DB rows still have them.
    if (/i\.pravatar\.cc|ui-avatars\.com|api\.dicebear\.com/i.test(legacy)) return DEFAULT_AVATAR;
    return legacy;
  }
  return DEFAULT_AVATAR;
};

/** Client-side validation BEFORE we burn a Cloudinary upload. */
export const validateImageFile = (file) => {
  if (!file) return 'Please choose a file';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only JPG and PNG images are allowed';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 2 MB or smaller';
  return null;
};

/** Read a File into a base64 data URL (data:image/png;base64,...). */
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload  = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
  reader.readAsDataURL(file);
});

/**
 * Upload a File and return a URL the backend can persist.
 *
 *   - If VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET are set,
 *     the file is uploaded directly to Cloudinary (unsigned preset) and the
 *     resulting `secure_url` is returned.
 *   - Otherwise, the file is encoded as a base64 data URL in the browser
 *     and that string is returned. The backend stores it in `profileImage`
 *     just like any other URL — no third-party config needed to use the
 *     feature, and small avatars (<2MB) fit comfortably in MongoDB.
 */
export const uploadToCloudinary = async (file) => {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (cloudName && uploadPreset) {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
    }
    const json = await res.json();
    if (!json?.secure_url) throw new Error('Cloudinary did not return a secure_url');
    return json.secure_url;
  }

  // Fallback path — embed the image as a data URL. Validation already
  // capped the file at 2 MB, so the resulting string fits in a Mongo doc.
  return fileToDataUrl(file);
};
