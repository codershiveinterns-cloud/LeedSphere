import MarketingPage, { Section, Card } from '../../components/marketing/MarketingPage';
import { Users, Target, Sparkles, Globe2 } from 'lucide-react';

const VALUES = [
  { icon: Target,    title: 'Build for focus',     body: 'Software that respects attention. Fewer interruptions, fewer notifications, more deep work.' },
  { icon: Users,     title: 'Trust the team',      body: 'Roles and permissions that make sense; teams that can self-organize without asking permission.' },
  { icon: Sparkles,  title: 'Make it delightful',  body: 'Polish the small details — speed, motion, copy. The product should feel like a craft object.' },
  { icon: Globe2,    title: 'Work everywhere',     body: 'Distributed by default. Async-first. Works as well from a kitchen table as a SF office.' },
];

const About = () => (
  <MarketingPage
    eyebrow="About"
    title="A workspace built for the way modern teams actually work"
    tagline="Leedsphere is a small team building collaboration software for distributed companies. We believe great work happens when communication and context live in the same place."
  >
    <Section heading="Why we're building Leedsphere">
      <p>
        Most collaboration tools were designed for a different era — when teams sat in the same
        building and "work" meant being online from 9 to 5. Today, the teams we admire are remote,
        async, and global. Their conversations, files, and decisions need a home that travels with
        them.
      </p>
      <p>
        We started Leedsphere to give those teams a single workspace where channels, projects, and
        documents live side-by-side — fast enough to disappear, structured enough to scale.
      </p>
    </Section>

    <Section heading="What we believe">
      <div className="grid sm:grid-cols-2 gap-4 not-prose">
        {VALUES.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <Icon size={18} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
          </Card>
        ))}
      </div>
    </Section>

    <Section heading="The team">
      <p>
        Leedsphere is built by a small, distributed team across four time zones. We're engineers,
        designers, and writers who&apos;ve previously shipped products at companies like GitHub,
        Notion, and Linear. We obsess over the parts of software most people overlook — keyboard
        shortcuts, latency, microcopy, dark mode — because we believe those details add up to
        something that feels meaningfully better.
      </p>
      <p>
        We&apos;re hiring deliberately and slowly. If that sounds interesting, our open roles live on
        our careers page (coming soon).
      </p>
    </Section>

    <Section heading="Get in touch">
      <p>
        Press inquiries, partnership ideas, or just want to say hi? We&apos;d love to hear from
        you — drop us a note via our <a href="/contact">contact page</a>.
      </p>
    </Section>
  </MarketingPage>
);

export default About;
