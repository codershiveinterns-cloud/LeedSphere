import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { sendReset } from '../../services/authService';

/**
 * Password reset entry point. Firebase silently succeeds even when no
 * account exists for the email (a privacy feature) — we surface a
 * generic "if an account exists, you'll get an email" success regardless.
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      await sendReset(email);
      setDone(true);
    } catch (err) {
      setError(err.message);
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
        {done ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Check your inbox</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
              If an account exists for <span className="font-medium text-slate-700 dark:text-gray-200">{email}</span>,
              we've sent a password reset link.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors active:scale-95"
            >
              Back to sign in <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4">
                <KeyRound size={24} />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Forgot password?</h1>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">We'll email you a link to reset it.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-gray-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all outline-none"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <>Send reset link <ArrowRight size={16} /></>}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-gray-400">
              Remembered it?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
