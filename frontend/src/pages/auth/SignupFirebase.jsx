import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2,
  Loader2, Eye, EyeOff, AlertCircle,
} from 'lucide-react';
import { signUp, logOut } from '../../services/authService';

/**
 * Signup with strong client-side validation + email verification.
 *
 * Client-side rules (the backend enforces its own checks):
 *   Name      : letters + spaces only, ≥3 chars
 *   Email     : RFC-ish regex (matches what every real user types)
 *   Password  : ≥8, ≥1 upper, ≥1 lower, ≥1 number, ≥1 special
 *   Confirm   : must equal password
 *
 * Validation runs on every change (after the user has interacted with the
 * field once — we don't want to scream errors before they've typed
 * anything). The submit button stays disabled until every rule passes.
 *
 * Flow:
 *   1. createUserWithEmailAndPassword
 *   2. set displayName
 *   3. send verification email
 *   4. sign the user OUT immediately so they can't reach the dashboard
 *      until they verify; show a success card instead of redirecting.
 */

const NAME_RE     = /^[A-Za-z][A-Za-z\s]*$/;        // letters + spaces, must start with a letter
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_UPPER   = /[A-Z]/;
const HAS_LOWER   = /[a-z]/;
const HAS_NUMBER  = /\d/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

/** Returns array of failing-rule messages; empty array == valid. */
const validateName = (name) => {
  const v = name.trim();
  if (!v) return ['Name is required'];
  if (!NAME_RE.test(v)) return ['Letters and spaces only — no numbers or symbols'];
  if (v.length < 3) return ['Must be at least 3 characters'];
  return [];
};
const validateEmail = (email) => {
  const v = email.trim();
  if (!v) return ['Email is required'];
  if (!EMAIL_RE.test(v)) return ['Enter a valid email address'];
  return [];
};
const passwordRules = (pw) => [
  { label: 'At least 8 characters',         pass: pw.length >= 8 },
  { label: 'One uppercase letter',           pass: HAS_UPPER.test(pw) },
  { label: 'One lowercase letter',           pass: HAS_LOWER.test(pw) },
  { label: 'One number',                     pass: HAS_NUMBER.test(pw) },
  { label: 'One special character (!@#$…)',  pass: HAS_SPECIAL.test(pw) },
];
const validatePassword = (pw) => passwordRules(pw).filter((r) => !r.pass).map((r) => r.label);
const validateConfirm = (pw, confirm) => {
  if (!confirm) return ['Confirm your password'];
  if (pw !== confirm) return ['Passwords don\'t match'];
  return [];
};

/** Strength score 0–4 from password rules (length + 4 character classes). */
const strengthOf = (pw) => {
  if (!pw) return { score: 0, label: '', bar: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (HAS_UPPER.test(pw) && HAS_LOWER.test(pw)) score++;
  if (HAS_NUMBER.test(pw)) score++;
  if (HAS_SPECIAL.test(pw)) score++;
  if (pw.length >= 12) score++;
  // Cap at 4 so the bar fits a 4-segment indicator.
  score = Math.min(score, 4);
  if (score <= 1) return { score, label: 'Weak',   bar: 1, color: 'bg-red-500',    text: 'text-red-600 dark:text-red-400' };
  if (score === 2) return { score, label: 'Fair',  bar: 2, color: 'bg-amber-500',  text: 'text-amber-600 dark:text-amber-400' };
  if (score === 3) return { score, label: 'Good',  bar: 3, color: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' };
  return                 { score, label: 'Strong', bar: 4, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
};

const Signup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Track whether the user has touched (blurred / typed in) each field.
  // Prevents "required" errors flashing before the user has had a chance
  // to enter anything.
  const [touched, setTouched] = useState({});
  const markTouched = (k) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [done, setDone] = useState(false);

  // Memoized validation — recomputes every render; cheap.
  const errors = useMemo(() => ({
    name:     validateName(name),
    email:    validateEmail(email),
    password: validatePassword(password),
    confirm:  validateConfirm(password, confirm),
  }), [name, email, password, confirm]);

  const isValid =
    errors.name.length === 0 &&
    errors.email.length === 0 &&
    errors.password.length === 0 &&
    errors.confirm.length === 0;

  const strength = useMemo(() => strengthOf(password), [password]);
  const pwRules  = useMemo(() => passwordRules(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    // Force-touch everything so leftover unfilled fields show their errors.
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!isValid) return;

    setSubmitting(true);
    try {
      await signUp(email, password, name);
      // Sign them out so they can't slip into the app unverified.
      await logOut();
      setDone(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
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

      {serverError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-300 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field
          Icon={UserIcon}
          label="Name"
          type="text"
          value={name}
          onChange={(v) => { setName(v); markTouched('name'); }}
          onBlur={() => markTouched('name')}
          placeholder="Jane Doe"
          autoComplete="name"
          errors={touched.name ? errors.name : []}
          isValid={touched.name && errors.name.length === 0 && name.length > 0}
        />

        <Field
          Icon={Mail}
          label="Email"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); markTouched('email'); }}
          onBlur={() => markTouched('email')}
          placeholder="name@company.com"
          autoComplete="email"
          errors={touched.email ? errors.email : []}
          isValid={touched.email && errors.email.length === 0 && email.length > 0}
          required
        />

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-gray-500">
              <Lock size={18} />
            </div>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); markTouched('password'); }}
              onBlur={() => markTouched('password')}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-3 bg-white dark:bg-[#0d1117] border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all outline-none
                ${touched.password && errors.password.length > 0
                  ? 'border-red-300 dark:border-red-500/40'
                  : 'border-slate-200 dark:border-gray-800'}`}
            />
            <PasswordEye show={showPw} onToggle={() => setShowPw((v) => !v)} />
          </div>

          {/* Strength meter — visible as soon as the user types something. */}
          {password.length > 0 && (
            <div className="mt-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      seg <= strength.bar ? strength.color : 'bg-slate-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <p className={`mt-1.5 text-xs font-medium ${strength.text || 'text-slate-500'}`}>
                Password strength: {strength.label}
              </p>
            </div>
          )}

          {/* Per-rule checklist — green check when satisfied, slate when not. */}
          {(touched.password || password.length > 0) && (
            <ul className="mt-3 space-y-1">
              {pwRules.map((r) => (
                <li
                  key={r.label}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    r.pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-500'
                  }`}
                >
                  {r.pass ? <CheckCircle2 size={13} /> : <span className="w-3 h-3 rounded-full border border-current inline-block" />}
                  {r.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Confirm password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-gray-500">
              <Lock size={18} />
            </div>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); markTouched('confirm'); }}
              onBlur={() => markTouched('confirm')}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-3 bg-white dark:bg-[#0d1117] border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all outline-none
                ${touched.confirm && errors.confirm.length > 0
                  ? 'border-red-300 dark:border-red-500/40'
                  : touched.confirm && confirm && password === confirm
                    ? 'border-emerald-300 dark:border-emerald-500/40'
                    : 'border-slate-200 dark:border-gray-800'}`}
            />
            <PasswordEye show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
          </div>
          <FieldErrors errors={touched.confirm ? errors.confirm : []} />
          {touched.confirm && confirm.length > 0 && password === confirm && errors.confirm.length === 0 && (
            <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? <><Loader2 size={16} className="animate-spin" /> Creating…</>
            : <>Create account <ArrowRight size={16} /></>}
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

// eslint-disable-next-line no-unused-vars -- Icon is rendered as JSX; rule misses JSX use.
const Field = ({ Icon, label, type, value, onChange, onBlur, placeholder, autoComplete, errors = [], isValid = false, required }) => {
  const hasError = errors.length > 0;
  return (
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
          onBlur={onBlur}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 bg-white dark:bg-[#0d1117] border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all outline-none
            ${hasError
              ? 'border-red-300 dark:border-red-500/40'
              : isValid
                ? 'border-emerald-300 dark:border-emerald-500/40'
                : 'border-slate-200 dark:border-gray-800'}`}
        />
        {(hasError || isValid) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError
              ? <AlertCircle size={16} className="text-red-500 dark:text-red-400" />
              : <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" />}
          </div>
        )}
      </div>
      <FieldErrors errors={errors} />
    </div>
  );
};

const FieldErrors = ({ errors }) => {
  if (!errors?.length) return null;
  return (
    <ul className="mt-1.5 space-y-0.5">
      {errors.map((e) => (
        <li key={e} className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={12} className="shrink-0" /> {e}
        </li>
      ))}
    </ul>
  );
};

/** Eye toggle inside a password input (right-aligned, focus-safe). */
const PasswordEye = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={show ? 'Hide password' : 'Show password'}
    tabIndex={-1}
    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
  >
    {show ? <EyeOff size={17} /> : <Eye size={17} />}
  </button>
);

export default Signup;
