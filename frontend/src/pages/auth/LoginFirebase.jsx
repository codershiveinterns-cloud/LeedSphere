import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowRight, Loader2, MailWarning } from 'lucide-react';
import { logIn } from '../../services/authService';

/**
 * Email/password sign-in.
 *
 * If the user is unverified the form keeps them in a "verify your email"
 * state with a Resend button — Firebase requires the user to be currently
 * authenticated to resend, so we deliberately do NOT sign them out until
 * they explicitly hit Cancel.
 */
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Intentionally NO auto-redirect on already-authenticated users. Firebase's
  // browserLocalPersistence restores `auth.currentUser` after every refresh;
  // an effect that bounced verified users to /dashboard would look like
  // "auto-login" because the form was never even submitted. The user must
  // explicitly enter credentials and hit submit; only the success branch in
  // handleSubmit navigates.

  const handleSubmit = async (e) => {
    // CRITICAL: stop the form's default browser submit, otherwise the page
    // reloads, every state above is lost, and from the user's perspective
    // "nothing happens" — that's the most common silent-fail symptom.
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    console.info('[login] submit', { email });
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      console.warn('[login] aborted: missing fields');
      return;
    }

    setLoading(true);
    try {
      const { user, emailVerified } = await logIn(email, password);
      try {
        const token = await user.getIdToken();
        console.debug('[login] Firebase ID token acquired', {
          tokenPreview: `${token.slice(0, 12)}...`,
          uid: user.uid,
        });
      } catch (tokenErr) {
        console.warn('[login] could not read Firebase ID token:', tokenErr?.message || tokenErr);
      }
      console.info('[login] success', { uid: user.uid, emailVerified });

      // Firebase considers the user signed in even when unverified, so
      // route explicitly — never silently drop the user on a blank page.
      if (!emailVerified) {
        navigate('/verify-email', { replace: true });
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('[login] failure', { code: err?.code, message: err?.message });
      // err.message is already friendly thanks to authService's mapping.
      setError(err.message || 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-200/40 dark:bg-indigo-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4">
            <LogIn size={24} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-sm flex items-start gap-2">
            <MailWarning size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Field Icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="name@company.com" autoComplete="email" required />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">Forgot password?</Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-gray-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-gray-400">
          New here?{' '}
          <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars -- Icon is rendered as JSX below; this rule misses JSX use.
const Field = ({ Icon, label, type, value, onChange, placeholder, autoComplete, required }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-gray-500">
        <Icon size={18} />
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all outline-none"
        placeholder={placeholder}
      />
    </div>
  </div>
);

export default Login;
