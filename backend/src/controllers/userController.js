/**
 * Profile-image management.
 *
 * Upload flow lives on the frontend (direct-to-Cloudinary, unsigned preset)
 * so binary data never touches our Node process. The endpoints here only
 * accept the resulting URL string and persist it to MongoDB.
 *
 *   PATCH  /api/user/profile-image  { url }   → save URL
 *   DELETE /api/user/profile-image            → clear URL (revert to default)
 */
import User from '../models/User.js';

// Allow https URLs from common image hosts. Cloudinary is the recommended
// path; the others cover existing google-photo URLs and self-hosted assets.
// Keeps the door open without becoming an open redirect.
const ALLOWED_HOSTS = [
  'res.cloudinary.com',
  'cloudinary.com',
  'lh3.googleusercontent.com',
  'storage.googleapis.com',
  's3.amazonaws.com',
];

// Cap base64 data URLs at ~2.7 MB string length, which corresponds to a 2 MB
// binary image (the same limit the frontend enforces). Mongo doc limit is
// 16 MB, so we stay well under it.
const MAX_DATA_URL_BYTES = 2_800_000;
const DATA_URL_RE = /^data:image\/(jpeg|jpg|png);base64,[A-Za-z0-9+/=]+$/;

const isAllowedImageUrl = (raw) => {
  const value = String(raw);
  // Inline data URLs — used when Cloudinary isn't configured. The frontend
  // base64-encodes the file and sends it straight through.
  if (value.startsWith('data:')) {
    if (value.length > MAX_DATA_URL_BYTES) return false;
    return DATA_URL_RE.test(value);
  }
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.some((host) => u.hostname === host || u.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
};

// PATCH /api/user/profile-image
export const updateProfileImage = async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'url is required' });
    }
    if (!isAllowedImageUrl(url)) {
      return res.status(400).json({ message: 'Image URL is not from an allowed host' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profileImage: url } },
      { new: true, runValidators: true },
    ).select('-password -role');

    if (!user) return res.status(404).json({ message: 'User not found' });
    console.log('Profile image updated:', user.email);
    res.json({ ok: true, profileImage: user.profileImage, user });
  } catch (err) {
    console.error('updateProfileImage:', err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/user/profile-image
export const removeProfileImage = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profileImage: null } },
      { new: true },
    ).select('-password -role');

    if (!user) return res.status(404).json({ message: 'User not found' });
    console.log('Profile image removed:', user.email);
    res.json({ ok: true, profileImage: null, user });
  } catch (err) {
    console.error('removeProfileImage:', err);
    res.status(500).json({ message: err.message });
  }
};
