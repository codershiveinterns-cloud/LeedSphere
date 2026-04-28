import { useState } from 'react';
import MarketingPage, { Section, Card } from '../../components/marketing/MarketingPage';
import { Mail, MessageSquare, LifeBuoy, Send, CheckCircle2 } from 'lucide-react';

const CHANNELS = [
  {
    icon: Mail,
    title: 'Email',
    body: 'For sales, partnerships, or anything else that doesn’t fit elsewhere.',
    cta: { label: 'hello@leedsphere.app', href: 'mailto:hello@leedsphere.app' },
  },
  {
    icon: LifeBuoy,
    title: 'Support',
    body: 'Already using Leedsphere and run into something? We typically reply within 24 hours.',
    cta: { label: 'support@leedsphere.app', href: 'mailto:support@leedsphere.app' },
  },
  {
    icon: MessageSquare,
    title: 'Press',
    body: 'Working on a story? Reach out and we’ll connect you with the right person.',
    cta: { label: 'press@leedsphere.app', href: 'mailto:press@leedsphere.app' },
  },
];

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    // No backend yet — log and pretend we sent. Wire to /api/contact when ready.
    console.info('[contact] form submit →', data);
    setSubmitted(true);
    e.currentTarget.reset();
  };

  return (
    <MarketingPage
      eyebrow="Contact"
      title="We'd love to hear from you"
      tagline="Sales, support, partnerships, press, or just a hello — pick the channel that fits, or send us a message below."
    >
      <Section heading="Pick a channel">
        <div className="grid sm:grid-cols-3 gap-4 not-prose">
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
                <p className="font-semibold text-slate-900">Thanks — your message is on its way.</p>
                <p className="text-sm text-slate-600 mt-1">
                  We aim to reply within one business day. In the meantime, you can browse our docs
                  or follow us on social.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field name="name" label="Your name" required />
                <Field name="email" type="email" label="Email" required />
              </div>
              <Field name="company" label="Company (optional)" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us what you're working on…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors resize-y"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
                >
                  Send message <Send size={14} />
                </button>
              </div>
            </form>
          )}
        </Card>
      </Section>
    </MarketingPage>
  );
};

const Field = ({ name, type = 'text', label, required }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <input
      name={name}
      type={type}
      required={required}
      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
    />
  </div>
);

export default Contact;
