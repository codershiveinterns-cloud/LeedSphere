import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Trash2, Upload, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from './Modal';
import useFirebaseAuthStore from '../../store/useFirebaseAuthStore';
import useAppStore from '../../store/useAppStore';
import {
  DEFAULT_AVATAR,
  resolveAvatar,
  validateImageFile,
  uploadToCloudinary,
} from '../../lib/avatar';

/**
 * Profile-image management modal.
 *
 *   1. User picks a JPG/PNG (≤2MB) → instant local preview via FileReader.
 *   2. "Save" → uploads to Cloudinary (unsigned preset) → PATCHes the
 *      resulting secure URL to /api/user/profile-image.
 *   3. "Remove" → DELETE /api/user/profile-image, falls back to default.
 *
 * The cached profile in useFirebaseAuthStore is patched in-place so every
 * avatar across the app updates without a full /auth/me refetch.
 */
const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const profile = useFirebaseAuthStore((s) => s.profile);
  const patchProfile = useFirebaseAuthStore((s) => s.patchProfile);
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null); // 'upload' | 'remove' | null

  // Reset transient state every time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setBusy(null);
  }, [isOpen]);

  const currentImage = previewUrl || resolveAvatar(profile);

  const onPick = (e) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    const validationError = validateImageFile(f);
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result || null);
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    if (!file) return;
    setBusy('upload');
    setError(null);
    try {
      const url = await uploadToCloudinary(file);
      const res = await api.patch('/user/profile-image', { url });
      const next = res.data?.profileImage || url;
      patchProfile({ profileImage: next });
      // Refresh teams so the new image shows in members lists / activity panels.
      const ws = useAppStore.getState().activeWorkspace;
      if (ws?._id) useAppStore.getState().fetchTeams(ws._id);
      toast.success('Profile picture updated');
      setFile(null);
      setPreviewUrl(null);
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Upload failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async () => {
    setBusy('remove');
    setError(null);
    try {
      await api.delete('/user/profile-image');
      patchProfile({ profileImage: null });
      const ws = useAppStore.getState().activeWorkspace;
      if (ws?._id) useAppStore.getState().fetchTeams(ws._id);
      toast.success('Profile picture removed');
      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Remove failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  const handleCancelPreview = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasUploaded = Boolean(profile?.profileImage);
  const isBusy = busy !== null;

  return (
    <Modal isOpen={isOpen} onClose={() => !isBusy && onClose?.()} title="Profile picture">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={currentImage}
              onError={(e) => { if (e.currentTarget.src !== DEFAULT_AVATAR) e.currentTarget.src = DEFAULT_AVATAR; }}
              alt="Profile preview"
              className="w-28 h-28 rounded-full object-cover border-2 border-slate-200 dark:border-gray-700 shadow-sm"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md disabled:opacity-50 transition-colors active:scale-95"
              title="Choose image"
            >
              <Camera size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            {file ? `Preview: ${file.name}` : (hasUploaded ? 'Current profile picture' : 'No picture uploaded — using default')}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={onPick}
          className="hidden"
        />

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-300 text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
          </div>
        )}

        <div className="text-[11px] text-slate-500 dark:text-gray-500 leading-relaxed">
          JPG or PNG, up to 2 MB. If Cloudinary env vars are set the file is uploaded there; otherwise the image is stored inline as a data URL.
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          {previewUrl && (
            <button
              type="button"
              onClick={handleCancelPreview}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors active:scale-95"
            >
              <X size={14} /> Cancel
            </button>
          )}

          {!previewUrl && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 disabled:opacity-50 transition-colors active:scale-95"
            >
              <Upload size={14} /> {hasUploaded ? 'Change image' : 'Choose image'}
            </button>
          )}

          {hasUploaded && !previewUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors active:scale-95"
            >
              {busy === 'remove' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Remove
            </button>
          )}

          {previewUrl && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 shadow-sm transition-colors active:scale-95"
            >
              {busy === 'upload' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Save
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProfileSettingsModal;
