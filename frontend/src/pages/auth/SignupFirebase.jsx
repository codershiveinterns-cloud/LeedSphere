import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { signUp, logOut } from '../../services/authService';

/**
 * Signup with email verification.
 *
 * Flow:
 *   1. createUserWithEmailAndPassword
 *   2. set displayName
 *   3. send verification email
 *   4. sign the user OUT immediately so they can't reach the dashboard
 *      until they verify; show a success card instead of redirecting.
 */
const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const validate = () => {
    if (!email.trim() || !password) return 'Email and password are required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    try {
      await signUp(email, password, name);
      // Sign them out so they can't slip into the app unverified.
      await logOut();
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Verification email sent</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
            We sent a verification link to <span className="font-medium text-slate-700 dark:text-gray-200">{email}</span>.
            Click it to activate your account, then sign in.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors active:scale-95"
          >
            Go to sign in <ArrowRight size={14} />
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4">
          <UserPlus size={24} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Create your account</h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">Sign up with your email to get started</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field Icon={UserIcon} label="Name" type="text" value={name} onChange={setName} placeholder="Jane Doe" />
        <Field Icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="name@company.com" required />
        <Field Icon={Lock} label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <>Create account <ArrowRight size={16} /></>}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">Sign in</Link>
      </p>
    </Shell>
  );
};

/* ---------- shared layout primitives ---------- */

const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center p-4 transition-colors duration-200">
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-200/40 dark:bg-indigo-900/20 blur-[120px]" />
    </div>
    <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl p-8">
      {children}
    </div>
  </div>
);

// eslint-disable-next-line no-unused-vars -- Icon is rendered as JSX below; this rule misses JSX use.
const Field = ({ Icon, label, type, value, onChange, placeholder, required }) => (
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
        required={required}
        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all outline-none"
        placeholder={placeholder}
      />
    </div>
  </div>
);

export default Signup;
