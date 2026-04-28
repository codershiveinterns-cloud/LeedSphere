import { Link } from 'react-router-dom';
import {
  ArrowRight, MessageSquare, Users, Hash, Shield, Zap, Lock,
  CheckCircle2, ChevronRight, Sparkles,
  LayoutDashboard, UserPlus, Send, Crown, UserCog, User as UserIcon,
  FolderKanban, Calendar, Bell, Search,
} from 'lucide-react';
import MarketingNavbar from '../components/marketing/MarketingNavbar';
import MarketingFooter from '../components/marketing/MarketingFooter';

/**
 * Marketing landing page for Leedsphere.
 *
 * Single-file by design — landing pages tend to drift if their bits get
 * scattered across the components tree. Section components live below the
 * default export so the read-order matches the page order.
 */
/**
 * Theme tokens — referenced from every section so the page reads like a
 * single design system instead of a quilt of one-off Tailwind strings.
 *
 *   Light:                          Dark:
 *     bg-app:    #f9fafb              bg-app:    #0f172a
 *     bg-section: #ffffff             bg-section: #111827
 *     bg-card:   #ffffff              bg-card:   #1e293b
 *     text-1:    #111827              text-1:    #e5e7eb
 *     text-2:    #6b7280              text-2:    #9ca3af
 *     border:    #e5e7eb              border:    #334155
 *
 * We alternate `bg-section` and `bg-app` as we go down the page. Borders use
 * the same neutral. No `slate-50/60` random gray anywhere.
 */
const APP_BG     = 'bg-[#f9fafb] dark:bg-[#0f172a]';
const SECTION_BG = 'bg-white dark:bg-[#111827]';
const CARD_BG    = 'bg-white dark:bg-[#1e293b]';
const BORDER     = 'border-[#e5e7eb] dark:border-[#334155]';
const TEXT_1     = 'text-[#111827] dark:text-[#e5e7eb]';
const TEXT_2     = 'text-[#6b7280] dark:text-[#9ca3af]';
const SECTION_PY = 'py-20 lg:py-24';

const Home = () => {
  return (
    <div className={`min-h-screen ${APP_BG} ${TEXT_1} antialiased selection:bg-indigo-200/60 selection:text-indigo-900 transition-colors duration-300`}>
      <MarketingNavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <ProductPreview />
      <Roles />
      <CTA />
      <MarketingFooter />
    </div>
  );
};

export default Home;

/* ======================================================================== */
/* Reusable bits — used by Hero / sections below.                            */
/*  (Navbar / Logo extracted to components/marketing/MarketingNavbar.jsx     */
/*   so every page on the site uses the same consistent navigation.)         */
/* ======================================================================== */

const PrimaryButton = ({ to, children, className = '', size = 'md' }) => {
  const sizes = {
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 ${sizes[size]} font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] ${className}`}
    >
      {children}
    </Link>
  );
};

const SecondaryButton = ({ to, children, className = '', size = 'md' }) => {
  const sizes = {
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 ${sizes[size]} font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]
                  text-[#111827] bg-white border border-[#e5e7eb] hover:border-slate-300 hover:bg-[#f9fafb]
                  dark:text-slate-100 dark:bg-[#1e293b] dark:border-[#334155] dark:hover:bg-slate-700/60 dark:hover:border-slate-500
                  ${className}`}
    >
      {children}
    </Link>
  );
};

/* ======================================================================== */
/* 2. Hero                                                                  */
/* ======================================================================== */

const Hero = () => (
  <section className={`relative overflow-hidden ${APP_BG}`}>
    {/* Soft gradient blobs — purple/indigo on both themes, but tuned down on dark */}
    <div aria-hidden className="absolute inset-0 -z-10">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/50 dark:bg-indigo-700/15 blur-[120px]" />
      <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/50 dark:bg-purple-700/15 blur-[120px]" />
    </div>

    <div className={`max-w-7xl mx-auto px-6 ${SECTION_PY} grid lg:grid-cols-2 gap-12 items-center`}>
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-6">
          <Sparkles size={12} /> The collaboration OS for modern teams
        </div>
        <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] ${TEXT_1}`}>
          Manage <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Teams, Workspaces</span> &amp; Conversations in One Place
        </h1>
        <p className={`mt-6 text-lg ${TEXT_2} max-w-xl leading-relaxed`}>
          Collaborate with your team using channels, real-time messaging, and role-based access — all from a single, beautifully simple workspace.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryButton to="/signup" size="lg">
            Get Started <ArrowRight size={16} />
          </PrimaryButton>
          <SecondaryButton to="/login" size="lg">
            Join Workspace
          </SecondaryButton>
        </div>

        <div className={`mt-8 flex items-center gap-6 text-sm ${TEXT_2}`}>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Free for small teams</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> No credit card required</div>
        </div>
      </div>

      <DashboardPreview />
    </div>
  </section>
);

/**
 * Inline mock of the actual app dashboard. Not pixel-perfect — just enough
 * to read as "this is what you'll get". Built with the same color tokens as
 * the real Dashboard so it doesn't feel like marketing fiction.
 */
const DashboardPreview = () => (
  <div className="relative">
    <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl rounded-3xl" aria-hidden />
    <div className={`relative ${CARD_BG} rounded-2xl shadow-2xl shadow-indigo-500/10 dark:shadow-black/40 border ${BORDER} overflow-hidden`}>
      {/* Window chrome */}
      <div className={`h-9 bg-[#f9fafb] dark:bg-[#0f172a] border-b ${BORDER} flex items-center gap-1.5 px-4`}>
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <span className="w-3 h-3 rounded-full bg-emerald-400" />
        <div className={`ml-4 h-5 px-3 rounded-md ${CARD_BG} border ${BORDER} text-[10px] ${TEXT_2} flex items-center`}>leedsphere.app/dashboard</div>
      </div>

      <div className="flex h-[420px]">
        {/* Sidebar */}
        <aside className={`w-44 bg-[#f9fafb] dark:bg-[#0f172a] border-r ${BORDER} p-3 flex flex-col gap-1`}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Hash size={12} /> design-team
          </div>
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${TEXT_2} text-xs`}><Hash size={12} /> general</div>
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${TEXT_2} text-xs`}><Hash size={12} /> launch</div>
          <div className="mt-3 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">Teams</div>
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${TEXT_2} text-xs`}><Users size={12} /> Engineering</div>
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${TEXT_2} text-xs`}><Users size={12} /> Marketing</div>
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col">
          <div className={`h-12 border-b ${BORDER} px-4 flex items-center justify-between`}>
            <div className={`flex items-center gap-2 text-sm font-semibold ${TEXT_1}`}><Hash size={14} /> design-team</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">12 members</div>
          </div>
          <div className={`flex-1 p-4 space-y-3 overflow-hidden ${CARD_BG}`}>
            <Msg name="Priya"  color="from-pink-500 to-rose-500"     text="The new logo file is in /branding 🎨" />
            <Msg name="Marcus" color="from-emerald-500 to-teal-500"  text="LGTM — shipping the v2 dashboard tonight." />
            <Msg name="You"    color="from-indigo-500 to-purple-500" text="Adding role-based access tomorrow morning." me />
            <Msg name="Lin"    color="from-amber-500 to-orange-500"  text="🎉 just hit 1k workspaces!" />
          </div>
          <div className={`h-12 border-t ${BORDER} px-4 flex items-center`}>
            <div className={`flex-1 h-8 rounded-lg bg-[#f9fafb] dark:bg-[#0f172a] border ${BORDER} px-3 text-xs text-slate-400 dark:text-slate-500 flex items-center`}>Message #design-team</div>
            <button className="ml-2 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center"><Send size={14} /></button>
          </div>
        </main>
      </div>
    </div>
  </div>
);

const Msg = ({ name, color, text, me }) => (
  <div className="flex items-start gap-2.5">
    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
      {name.charAt(0)}
    </div>
    <div className="min-w-0">
      <div className="flex items-baseline gap-2">
        <span className={`text-xs font-semibold ${me ? 'text-indigo-600 dark:text-indigo-400' : 'text-[#111827] dark:text-slate-100'}`}>{name}</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">just now</span>
      </div>
      <p className="text-xs text-[#6b7280] dark:text-[#9ca3af]">{text}</p>
    </div>
  </div>
);

/* ======================================================================== */
/* 3. Features                                                              */
/* ======================================================================== */

const FEATURES = [
  { icon: LayoutDashboard, title: 'Workspace Management',  body: 'Spin up isolated workspaces for clients, side projects, or business units. Keep contexts clean.' },
  { icon: Users,           title: 'Team Collaboration',    body: 'Group people into teams with their own channels, projects, and shared docs.' },
  { icon: MessageSquare,   title: 'Channels & Messaging',  body: 'Threaded conversations, reactions, mentions, and DMs — built for fast, focused work.' },
  { icon: Shield,          title: 'Role-Based Access',     body: 'Admin, Manager, and Member roles enforce the right permissions across every feature.' },
  { icon: Zap,             title: 'Real-time Updates',     body: 'Messages, presence, typing indicators, and live edits delivered over WebSockets.' },
  { icon: Lock,            title: 'Secure & Scalable',     body: 'Firebase Auth, encrypted transport, and a stateless API designed to grow with your team.' },
];

const Features = () => (
  <section id="features" className={`${SECTION_BG} ${SECTION_PY} border-y ${BORDER}`}>
    <div className="max-w-7xl mx-auto px-6">
      <div className="max-w-2xl mb-14">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Features</p>
        <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${TEXT_1}`}>Everything your team needs, nothing it doesn&apos;t.</h2>
        <p className={`mt-4 text-lg ${TEXT_2}`}>A focused toolkit built around the way modern teams actually work.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className={`group relative ${CARD_BG} border ${BORDER} rounded-xl p-6
                        shadow-md hover:shadow-lg hover:scale-[1.015] hover:border-indigo-200 dark:hover:border-indigo-500/40
                        transition-all duration-300`}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white mb-5 shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Icon size={20} />
            </div>
            <h3 className={`text-lg font-semibold mb-1.5 ${TEXT_1}`}>{title}</h3>
            <p className={`text-sm leading-relaxed ${TEXT_2}`}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ======================================================================== */
/* 4. How it works                                                          */
/* ======================================================================== */

const STEPS = [
  { icon: LayoutDashboard, title: 'Create Workspace',     body: 'Sign up, name your workspace, and invite your first team. Takes under a minute.' },
  { icon: UserPlus,        title: 'Invite Members',       body: 'Send invite links by email. Assign roles up front so the right people get the right access.' },
  { icon: MessageSquare,   title: 'Start Collaborating',  body: 'Open channels, kick off projects, and start shipping. Everything stays in sync, in real time.' },
];

const HowItWorks = () => (
  // Fix: the previous `bg-slate-50/60` had no dark variant and turned this
  // section into a stranded light-gray strip in dark mode. Now uses the
  // page bg directly so it reads as part of the same surface as Hero / CTA.
  <section id="how-it-works" className={`${APP_BG} ${SECTION_PY}`}>
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">How it works</p>
        <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${TEXT_1}`}>From zero to collaborating in three steps</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative">
        {/* Connector line (desktop only) */}
        <div aria-hidden className="hidden md:block absolute top-[44px] left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-indigo-300/60 dark:via-indigo-500/40 to-transparent" />

        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className="relative text-center">
            <div className={`relative z-10 mx-auto w-[88px] h-[88px] rounded-2xl ${CARD_BG} border ${BORDER} shadow-lg shadow-indigo-500/5 dark:shadow-black/30 flex items-center justify-center mb-5`}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Icon size={22} />
              </div>
              <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${CARD_BG} border ${BORDER} text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm`}>
                {i + 1}
              </span>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${TEXT_1}`}>{title}</h3>
            <p className={`text-sm max-w-xs mx-auto leading-relaxed ${TEXT_2}`}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ======================================================================== */
/* 5. Product preview                                                       */
/* ======================================================================== */

const PREVIEWS = [
  {
    key: 'teams',
    label: 'Teams panel',
    icon: Users,
    title: 'Organize people the way your company actually works',
    body: 'Group teammates into focused teams with their own channels, projects, and shared visibility. Switch teams in a click.',
  },
  {
    key: 'chat',
    label: 'Channel chat',
    icon: MessageSquare,
    title: 'Conversations that keep up with your team',
    body: 'Threaded replies, reactions, file attachments, and live typing indicators — all backed by a real-time socket layer.',
  },
  {
    key: 'dashboard',
    label: 'Dashboard view',
    icon: LayoutDashboard,
    title: 'A single home for everything you own',
    body: 'Notifications, projects, calendar, and analytics in one place. Glance once, know what matters.',
  },
];

const ProductPreview = () => (
  <section id="preview" className={`${SECTION_BG} ${SECTION_PY} border-y ${BORDER}`}>
    <div className="max-w-7xl mx-auto px-6">
      <div className="max-w-2xl mb-14">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Product</p>
        <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${TEXT_1}`}>A peek inside the workspace</h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {PREVIEWS.map((p) => (
          <article
            key={p.key}
            className={`group ${CARD_BG} border ${BORDER} rounded-xl overflow-hidden
                        shadow-md hover:shadow-lg hover:scale-[1.015] hover:border-indigo-200 dark:hover:border-indigo-500/40
                        transition-all duration-300`}
          >
            <PreviewArt kind={p.key} />
            <div className="p-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                <p.icon size={14} /> {p.label}
              </div>
              <h3 className={`text-lg font-semibold mb-1.5 leading-snug ${TEXT_1}`}>{p.title}</h3>
              <p className={`text-sm leading-relaxed ${TEXT_2}`}>{p.body}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

/**
 * Per-card illustrative artwork. Same visual language as the hero preview
 * but cropped to the feature being shown.
 */
const PreviewArt = ({ kind }) => {
  // Shared bg for the preview band — soft purple tint that reads on both
  // themes (light gradient on light, deeper indigo on dark).
  const bandBg = 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10';
  const tileCls = `${CARD_BG} rounded-xl border ${BORDER}`;

  if (kind === 'teams') {
    return (
      <div className={`h-48 ${bandBg} p-5 flex flex-col gap-2`}>
        {[
          { name: 'Engineering', count: 18, color: 'from-indigo-500 to-purple-500' },
          { name: 'Marketing',   count: 9,  color: 'from-pink-500 to-rose-500' },
          { name: 'Design',      count: 6,  color: 'from-emerald-500 to-teal-500' },
        ].map((t) => (
          <div key={t.name} className={`${tileCls} px-3 py-2.5 flex items-center gap-3`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} text-white text-xs font-bold flex items-center justify-center`}>
              {t.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold truncate ${TEXT_1}`}>{t.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.count} members</div>
            </div>
            <ChevronRight size={14} className="text-slate-400 dark:text-slate-500" />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'chat') {
    return (
      <div className={`h-48 ${bandBg} p-5 flex flex-col gap-2`}>
        <Msg name="Sasha"  color="from-pink-500 to-rose-500"        text="Pushed the auth fix 🚀" />
        <Msg name="Devon"  color="from-emerald-500 to-teal-500"     text="Reviewing now, looks clean" />
        <Msg name="You"    color="from-indigo-500 to-purple-500"    text="Merging at 4pm." me />
      </div>
    );
  }
  // dashboard
  return (
    <div className={`h-48 ${bandBg} p-5 grid grid-cols-2 gap-2`}>
      {[
        { icon: Bell,         label: 'Alerts',     v: '12' },
        { icon: FolderKanban, label: 'Projects',   v: '8'  },
        { icon: Calendar,     label: 'Events',     v: '3'  },
        { icon: Search,       label: 'Mentions',   v: '24' },
      ].map(({ icon: Icon, label, v }) => (
        <div key={label} className={`${tileCls} p-3 flex flex-col justify-between`}>
          <Icon size={16} className="text-indigo-600 dark:text-indigo-400" />
          <div>
            <div className={`text-lg font-bold leading-none ${TEXT_1}`}>{v}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ======================================================================== */
/* 6. Roles                                                                 */
/* ======================================================================== */

const ROLES = [
  {
    icon: Crown,
    name: 'Admin',
    tagline: 'Full control',
    perks: ['Create / delete workspaces', 'Manage all teams & members', 'Configure roles & permissions', 'Access billing & analytics'],
    accent: 'from-amber-500 to-orange-500',
    ring: 'ring-amber-100',
  },
  {
    icon: UserCog,
    name: 'Manager',
    tagline: 'Manage teams & channels',
    perks: ['Create projects & channels', 'Invite members to teams', 'Edit project settings', 'Moderate conversations'],
    accent: 'from-indigo-500 to-purple-500',
    ring: 'ring-indigo-100',
  },
  {
    icon: UserIcon,
    name: 'Member',
    tagline: 'Participate & collaborate',
    perks: ['Join channels & threads', 'Send and edit own messages', 'Update assigned tasks', 'Read team docs'],
    accent: 'from-slate-500 to-slate-700',
    ring: 'ring-slate-100',
  },
];

const Roles = () => (
  // Same fix as HowItWorks — was `bg-slate-50/60`, now uses the page bg so
  // it stays consistent with the surrounding sections in both themes.
  <section id="roles" className={`${APP_BG} ${SECTION_PY}`}>
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Role-based access</p>
        <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${TEXT_1}`}>Right access for every role</h2>
        <p className={`mt-4 text-lg ${TEXT_2}`}>Three opinionated tiers that match how teams actually delegate.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {ROLES.map(({ icon: Icon, name, tagline, perks, accent }) => (
          <div
            key={name}
            className={`${CARD_BG} rounded-xl border ${BORDER} p-7
                        shadow-md hover:shadow-lg hover:scale-[1.015] hover:-translate-y-1
                        transition-all duration-300`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center mb-5 shadow-lg`}>
              <Icon size={22} />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className={`text-xl font-bold ${TEXT_1}`}>{name}</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">— {tagline}</span>
            </div>
            <ul className="mt-5 space-y-2.5">
              {perks.map((p) => (
                <li key={p} className={`flex items-start gap-2 text-sm ${TEXT_2}`}>
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ======================================================================== */
/* 7. CTA                                                                   */
/* ======================================================================== */

const CTA = () => (
  <section className={`${APP_BG} ${SECTION_PY}`}>
    <div className="max-w-5xl mx-auto px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-10 sm:p-14 text-center shadow-2xl shadow-indigo-500/30">
        <div aria-hidden className="absolute inset-0 opacity-30">
          <div className="absolute -top-1/2 -right-1/4 w-[60%] h-[120%] rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">Start your workspace today</h2>
          <p className="mt-4 text-lg text-indigo-100 max-w-xl mx-auto">
            Bring your team together and boost productivity — your first workspace is free, and setup takes a minute.
          </p>
          <div className="mt-8">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-indigo-700 bg-white rounded-xl hover:bg-indigo-50 shadow-xl shadow-indigo-900/20 transition-all active:scale-[0.98]"
            >
              Create Workspace <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ======================================================================== */
/* 8. Footer — extracted to components/marketing/MarketingFooter.jsx so       */
/*    the legal/marketing pages share the same component and link routing.   */
/* ======================================================================== */

