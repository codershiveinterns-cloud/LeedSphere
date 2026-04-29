import { useState } from 'react';
import MarketingPage, { Section, Card } from '../../components/marketing/MarketingPage';
import { Mail, MessageSquare, LifeBuoy, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_ROOT } from '../../config/api';

// Single source of truth for the support inbox. Any UI surface that needs to
// surface a contact email reads from this constant so renaming is a one-line
// change. Mirrors backend SUPPORT_EMAIL (services/email.js).
export const SUPPORT_EMAIL = 'admin@leedsphere.com';

const CHANNELS = [
  {
    icon: Mail,
    title: 'Email',
    body: 'For sales, partnerships, or anything else that doesn’t fit elsewhere.',
    cta: { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
  },
  {
    icon: LifeBuoy,
    title: 'Support',
    body: 'Already using Leedsphere and run into something? We typically reply within 24 hours.',
    cta: { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}?subject=Support%20request` },
  },
  {
    icon: MessageSquare,
    title: 'Press',
    body: 'Working on a story? Reach out and we’ll connect you with the right person.',
    cta: { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}?subject=Press%20enquiry` },
  },
];

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    const formEl = e.currentTarget;
    const data = Object.fromEntries(new FormData(formEl));

    // Client-side validation — backend re-validates regardless.
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    const message = String(data.message || '').trim();
    if (!name)    { setError('Please enter your name'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address'); return;
    }
    if (message.length < 5) { setError('Please write a short message'); return; }

    setSubmitting(true);
    try {
      // Public endpoint — no auth header. Use raw axios so we don't pull in
      // the auth-bearing `api` instance for an anonymous form submission.
      await axios.post(`${API_ROOT}/contact`, {
        name, email,
        company: String(data.company || '').trim(),
        message,
      });
      toast.success('Message sent successfully');
      setSubmitted(true);
      formEl.reset();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to send message';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketingPage
      eyebrow="Contact"
      title="We'd love to hear from you"
      tagline="Sales, support, partnerships, press, or just a hello — pick the channel that fits, or send us a message below."
    >
      <Section heading="Pick a channel">
        <div className="grid sm:grid-cols-3 gap-4 not-prose">
          {/* eslint-disable-next-line no-unused-vars -- Icon rendered as JSX below */}
          {CHANNELS.map(({ icon: Icon, title, body, cta }) => (
            <Card key={title}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Icon size={18} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{body}</p>
              <a href={cta.href} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                {cta.label}
              </a>
            </Card>
          ))}
        </div>
      </Section>

      <Section heading="Or send us a message">
        <Card className="not-prose">
          {submitted ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Message sent successfully.</p>
                <p className="text-sm text-slate-600 mt-1">
                  Thanks — we've sent a confirmation to your inbox and our team will reply within
                  one business day. You can also email us at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 font-medium">{SUPPORT_EMAIL}</a>.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field name="name" label="Your name" required disabled={submitting} />
                <Field name="email" type="email" label="Email" required disabled={submitting} />
              </div>
              <Field name="company" label="Company (optional)" disabled={submitting} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  disabled={submitting}
                  placeholder="Tell us what you're working on…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors resize-y disabled:opacity-60"
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  Goes to <span className="font-medium text-slate-700">{SUPPORT_EMAIL}</span>
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <>Send message <Send size={14} /></>}
                </button>
              </div>
            </form>
          )}
        </Card>
      </Section>
    </MarketingPage>
  );
};

const Field = ({ name, type = 'text', label, required, disabled }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <input
      name={name}
      type={type}
      required={required}
      disabled={disabled}
      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors disabled:opacity-60"
    />
  </div>
);

export default Contact;
