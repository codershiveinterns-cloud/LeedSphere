import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Mail, Lock, User as UserIcon, ArrowRight, Loader2, CheckCircle2,
  AlertCircle, LogIn, Eye, EyeOff,
} from 'lucide-react';
import api from '../../services/api';

/**
 * Magic-link invite landing page.
 *   1. On mount, validate the token via GET /api/invite/:token.
 *   2. If invalid (expired / used / not-found) → show error card.
 *   3. If valid + userExists → show "Sign in to accept" CTA.
 *   4. If valid + new user → render signup form (name + password + confirm).
 *      Submit → POST /api/invite/accept → success card with sign-in CTA.
 */
const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading');  // loading | invalid | valid | done
  const [info, setInfo] = useState(null);            // { email, team, userExists, reason }
  const [error, setError] = useState(null);

  // Signup form
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Validate the token on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/invite/${token}`);
        if (cancelled) return;
        if (res.data?.valid) {
          setInfo(res.data);
          setStatus('valid');
        } else {
          setInfo(res.data);
          setStatus('invalid');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || err.message);
        setStatus('invalid');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const validForm = (
    name.trim().length >= 2 &&
    password.length >= 8 &&
    password === confirm
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validForm) return;
    setSubmitting(true);
    try {
      const res = await api.post('/invite/accept', { token, name: name.trim(), password });
      setInfo({ ...info, ...res.data });
      setStatus('done');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- render branches ---------- */

  return (
    <Shell>
      {status === 'loading' && (
        <div className="text-center py-8">
          <Loader2 size={28} className="animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
          <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">Checking your invite…</p>
        </div>
      )}

      {status === 'invalid' && <InvalidCard info={info} error={error} />}

      {status === 'valid' && info?.userExists && <ExistingUserCard info={info} navigate={navigate} />}

      {status === 'valid' && !info?.userExists && (
        <SignupCard
          info={info}
          name={name} setName={setName}
          password={password} setPassword={setPassword}
          confirm={confirm} setConfirm={setConfirm}
          showPw={showPw} setShowPw={setShowPw}
          showConfirm={showConfirm} setShowConfirm={setShowConfirm}
          submitting={submitting}
          error={error}
          validForm={validForm}
          onSubmit={handleSubmit}
        />
      )}

      {status === 'done' && <DoneCard info={info} navigate={navigate} />}
    </Shell>
  );
};

/* ---------- card variants ---------- */

const InvalidCard = ({ info, error }) => {
  const reason = info?.reason;
  const accepted = info?.accepted;
  const title =
    accepted              ? 'Invite already used' :
    reason === 'expired'  ? 'This invite has expired' :
    reason === 'declined' ? 'This invite was declined' :
                            'Invite link not valid';
  const body =
    accepted              ? 'This invite link has already been accepted. Sign in to access your team.' :
    reason === 'expired'  ? 'Invites expire after 24 hours. Ask the team admin to send a fresh one.' :
    error                  ? error :
                            'The link may be incomplete or revoked. Check your email for the latest invite.';

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 mb-4">
        <AlertCircle size={24} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">{body}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/login" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors active:scale-95">
          <LogIn size={14} /> Go to sign in
        </Link>
      </div>
    </div>
  );
};

const ExistingUserCard = ({ info, navigate }) => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4">
      <LogIn size={24} />
    </div>
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h1>
    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
      You already have a Leedsphere account at <span className="font-medium text-slate-700 dark:text-gray-200">{info.email}</span>.
      Sign in and we'll add you to <span className="font-medium text-slate-700 dark:text-gray-200">{info.team?.name || 'the team'}</span>.
    </p>
    <button
      onClick={() => navigate(`/login?redirect=/accept-invite/${encodeURIComponent(window.location.pathname.split('/').pop())}`)}
      className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors active:scale-95"
    >
      Sign in to accept <ArrowRight size={14} />
    </button>
    <p className="mt-3 text-xs text-slate-400 dark:text-gray-500">
      Or click "I'm new" below if you don't actually have an account at this email.
    </p>
  </div>
);

const SignupCard = ({
  info, name, setName, password, setPassword, confirm, setConfirm,
  showPw, setShowPw, showConfirm, setShowConfirm,
  submitting, error, validForm, onSubmit,
}) => (
  <div>
    <div className="text-center mb-7">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4">
        <Mail size={24} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">You're invited</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
        Join <span className="font-medium text-slate-700 dark:text-gray-200">{info.team?.name || 'the team'}</span>
        {info.role ? <> as <span className="font-medium text-slate-700 dark:text-gray-200">{info.role}</span></> : null}.
        We'll create your account at <span className="font-medium text-slate-700 dark:text-gray-200">{info.email}</span>.
      </p>
    </div>

    {error && (
      <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-300 text-sm flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
      </div>
    )}

    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FieldRow Icon={UserIcon} label="Your name" type="text" value={name} onChange={setName} placeholder="Jane Doe" autoComplete="name" />

      <PasswordField label="Password" value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(v => !v)} autoComplete="new-password" />
      {password.length > 0 && password.length < 8 && (
        <p className="-mt-2 text-xs text-amber-600 dark:text-amber-400">At least 8 characters</p>
      )}

      <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} autoComplete="new-password" />
      {confirm.length > 0 && password !== confirm && (
        <p className="-mt-2 text-xs text-red-600 dark:text-red-400">Passwords don't match</p>
      )}

      <button
        type="submit"
        disabled={!validForm || submitting}
        className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : <>Accept &amp; create account <ArrowRight size={16} /></>}
      </button>
    </form>

    <p className="mt-6 text-center text-sm text-slate-500 dark:text-gray-400">
      Already have an account?{' '}
      <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">Sign in</Link>
    </p>
  </div>
);

const DoneCard = ({ info, navigate }) => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
      <CheckCircle2 size={24} />
    </div>
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">You're in</h1>
    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
      {info?.message || 'Your account is ready. Sign in to continue.'}
    </p>
    <button
      onClick={() => navigate('/login')}
      className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors active:scale-95"
    >
      Go to sign in <ArrowRight size={14} />
    </button>
  </div>
);

/* ---------- form primitives ---------- */

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

// eslint-disable-next-line no-unused-vars -- Icon is rendered as JSX below; rule misses JSX use.
const FieldRow = ({ Icon, label, type, value, onChange, placeholder, autoComplete }) => (
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
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all outline-none"
      />
    </div>
  </div>
);

const PasswordField = ({ label, value, onChange, show, onToggle, autoComplete }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-gray-500">
        <Lock size={18} />
      </div>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        placeholder="••••••••"
        className="w-full pl-10 pr-10 py-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all outline-none"
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  </div>
);

export default AcceptInvite;
