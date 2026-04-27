import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { MailCheck, Loader2, RefreshCw, LogOut } from 'lucide-react';
import { resendVerification, logOut } from '../../services/authService';
import useFirebaseAuthStore from '../../store/useFirebaseAuthStore';

/**
 * Holding page between sign-in and the dashboard for users whose email
 * isn't verified yet. The user clicks the link in their inbox (which
 * happens in another tab); we won't notice until we explicitly call
 * `auth.currentUser.reload()` — that's what the "I've verified" button
 * does. We also poll every 5s as a quality-of-life fallback.
 */
const VerifyEmail = () => {
  const navigate = useNavigate();
  // Select fields individually so we don't re-render on every store mutation
  // (a destructured `useFirebaseAuthStore()` returns a new object reference
  // each render and triggers update-depth loops).
  const currentUser = useFirebaseAuthStore((s) => s.currentUser);
  const ready = useFirebaseAuthStore((s) => s.ready);
  const refresh = useFirebaseAuthStore((s) => s.refresh);

  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  // Polling: every 5 seconds, ask Firebase whether the email got verified.
  // Cheap, idempotent, and makes the UX feel automatic.
  useEffect(() => {
    if (!currentUser || currentUser.emailVerified) return;
    const id = setInterval(() => { refresh().catch(() => {}); }, 5000);
    return () => clearInterval(id);
  }, [currentUser, refresh]);

  if (!ready) {
    return <FullScreenSpinner label="Checking session…" />;
  }
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.emailVerified) return <Navigate to="/dashboard" replace />;

  const handleResend = async () => {
    setError(null); setInfo(null); setResending(true);
    try {
      await resendVerification();
      setInfo('Verification email sent. Check your inbox (and spam).');
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    setError(null); setInfo(null); setChecking(true);
    try {
      const user = await refresh();
      if (user?.emailVerified) {
        navigate('/dashboard', { replace: true });
      } else {
        setInfo("We don't see a verification yet — try the link in your inbox first.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try { await logOut(); navigate('/login', { replace: true }); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-200/40 dark:bg-indigo-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4">
            <MailCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Please verify your email</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
            We sent a verification link to{' '}
            <span className="font-medium text-slate-700 dark:text-gray-200">{currentUser.email}</span>.
            Click it, then come back here.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm">
            {info}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {checking ? <><Loader2 size={16} className="animate-spin" /> Checking…</> : <><RefreshCw size={16} /> I've verified</>}
          </button>
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full py-3 text-sm font-medium text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend verification email'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-1.5 mt-2 py-2 text-xs text-slate-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

const FullScreenSpinner = ({ label }) => (
  <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center transition-colors duration-200">
    <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-gray-400">
      <Loader2 size={22} className="animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  </div>
);

export default VerifyEmail;
