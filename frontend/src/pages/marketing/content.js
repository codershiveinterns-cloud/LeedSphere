/**
 * Content registry for the static marketing pages.
 *
 * Every entry is consumed by ContentPage.jsx, which renders it through
 * MarketingPage.jsx. Keeping the copy here (instead of hand-coding 26
 * page components) lets a non-developer edit the site by touching one
 * file.
 *
 * Section types supported by ContentPage:
 *   - 'text'      heading + array of paragraphs (markdown-lite, just text)
 *   - 'features'  heading + array of {icon, title, body} cards
 *   - 'list'      heading + array of bullet strings
 *   - 'cta'       heading + body + {label, to} button
 *   - 'steps'     heading + array of {title, body} steps (numbered)
 *   - 'faq'       heading + array of {q, a} entries
 */
import {
  MessageSquare, Hash, Search, Shield, Zap, Lock, Users, Send, Crown,
  UserCog, User as UserIcon, FolderKanban, Calendar, Bell, Sparkles,
  LayoutDashboard, UserPlus, Globe2, Briefcase, Code2, Palette, Megaphone,
  LifeBuoy, Rocket, Building2, BookOpen, GraduationCap, FileText, Compass,
  Newspaper, Award, Handshake, ShieldCheck, GitBranch, Map, History, Heart,
} from 'lucide-react';

export const PAGES = {
  /* ============================ PRODUCT ============================ */
  overview: {
    eyebrow: 'Product',
    title: 'A workspace that connects your conversations, files, and decisions',
    tagline:
      'Leedsphere brings the tools your team uses every day — chat, projects, docs, and search — into a single home that stays fast as you grow.',
    sections: [
      {
        type: 'text',
        heading: 'One place for the work that matters',
        paragraphs: [
          'Modern teams juggle a dozen tools to ship a single feature. Leedsphere replaces the scattered links and lost context with a focused workspace where every conversation is searchable, every file lives next to its discussion, and every decision has a permanent home.',
          'Whether you\'re a five-person startup or a thousand-person company, the same primitives — workspaces, teams, channels, and roles — scale with you. There are no per-feature paywalls on the parts that matter: search, threads, RBAC, and unlimited integrations are part of every plan.',
        ],
      },
      {
        type: 'stats',
        heading: 'By the numbers',
        items: [
          { value: '<100ms', label: 'Median message latency', body: 'Cross-region websocket delivery, measured at p50.' },
          { value: '99.9%', label: 'Uptime SLA',              body: 'Backed by credits on Enterprise plans.' },
          { value: '40+',   label: 'Countries served',         body: 'Distributed teams from São Paulo to Singapore.' },
          { value: '1,000+', label: 'Customer teams',          body: 'From two-person startups to public companies.' },
        ],
      },
      {
        type: 'features',
        heading: 'What you get',
        cards: [
          { icon: Hash, title: 'Channels & DMs', body: 'Topic-based channels and direct messages with threads, reactions, mentions, and rich attachments.' },
          { icon: FolderKanban, title: 'Projects', body: 'Kanban boards and task lists tied to the team that owns them, with assignees, due dates, and document attachments.' },
          { icon: FileText, title: 'Notes', body: 'Collaborative documents that live alongside your channels, with mentions, slash commands, and version history.' },
          { icon: Search, title: 'Workspace search', body: 'Find any message, file, or doc across every channel and project — instantly, with filters.' },
          { icon: Shield, title: 'Role-based access', body: 'Three opinionated roles — Admin, Manager, Member — enforced consistently across every feature.' },
          { icon: Zap, title: 'Real-time everything', body: 'Messages, presence, typing indicators, and live edits delivered over websockets.' },
        ],
      },
      {
        type: 'text',
        heading: 'Built on a real-time core',
        paragraphs: [
          'Every message, edit, reaction, and presence change flows through a single websocket connection per client. Messages reach every connected client in well under 100 milliseconds — fast enough that the network disappears.',
          'Behind the scenes, Leedsphere uses a stateless API and Redis-backed pub/sub. The same architecture that keeps two people in sync handles 10,000 concurrent users in a single workspace without breaking a sweat.',
        ],
      },
      {
        type: 'list',
        heading: 'Why teams pick Leedsphere over the alternatives',
        items: [
          'A single workspace replaces 6+ tools — chat, docs, projects, search, file storage, even basic calendar.',
          'Sub-100ms real-time updates make collaboration feel like sitting next to each other.',
          'Role-based access works consistently — Admin, Manager, Member — across every feature.',
          'Free for small teams, generous limits, no surprise paywalls on power features.',
          'Enterprise-ready when you grow: SSO, SCIM, audit logs, data residency.',
          'Keyboard-first design that respects the time of people who actually use it all day.',
        ],
      },
      {
        type: 'quote',
        quote: 'We replaced Slack, Asana, and three other tools with Leedsphere. The week we cut over, our async culture clicked into place — for the first time, the conversation and the artifact lived in the same place.',
        attribution: 'Priya Mehta',
        role: 'Head of Engineering, Northwind Labs',
        avatar: 'from-pink-500 to-rose-500',
      },
      {
        type: 'cta',
        heading: 'See it in your hands in two minutes',
        body: 'No demo call required — sign up, create a workspace, and invite your first teammate.',
        button: { label: 'Get started free', to: '/signup' },
      },
    ],
  },

  channels: {
    eyebrow: 'Product',
    title: 'Team channels that keep conversations focused',
    tagline:
      'Public, private, and team-scoped channels with threads, reactions, mentions, and pinned messages — built for fast, focused communication.',
    sections: [
      {
        type: 'text',
        heading: 'Topic-based, not chronological',
        paragraphs: [
          'Channels group conversations by topic so the right people see the right discussion. Public channels are open to everyone in your workspace; private ones are invite-only; team channels stay scoped to a single team.',
          'Long discussions don\'t derail the main feed because every message can spawn a thread. Reactions and mentions cut down on noise without losing context.',
        ],
      },
      {
        type: 'features',
        heading: 'Three channel types, one mental model',
        cards: [
          { icon: Hash, title: 'Public channels', body: 'Open to everyone in the workspace. Use for cross-team announcements, social, and shared knowledge.' },
          { icon: Lock, title: 'Private channels', body: 'Invite-only. Use for sensitive projects, leadership discussions, and confidential workstreams.' },
          { icon: Users, title: 'Team channels', body: 'Auto-scoped to a single team. Membership follows team membership — no manual maintenance.' },
        ],
      },
      {
        type: 'list',
        heading: 'What\'s in every channel',
        items: [
          'Threaded replies — keep side conversations out of the main flow',
          'Reactions and mentions — acknowledge or summon someone in one click',
          'Pinned messages — make important context discoverable',
          'File attachments — drag-drop with previews for images, video, PDFs',
          'Code blocks with syntax highlighting',
          'Slash commands and message scheduling',
          'Read receipts (optional, per-channel)',
          'Channel-level notification rules (all, mentions only, mute)',
          'Automatic archival of inactive channels (configurable)',
        ],
      },
      {
        type: 'faq',
        heading: 'Common questions',
        items: [
          { q: 'How many channels can I have?',
            a: 'No hard limit on any plan. Most workspaces settle at 30–80 channels per team; we surface inactive ones in the channel browser so they\'re easy to archive.' },
          { q: 'Can I move a message to a different channel?',
            a: 'Admins and managers can move single messages or whole threads. The original location keeps a small "moved to #..." breadcrumb so context is preserved.' },
          { q: 'Are private channels truly private?',
            a: 'Yes — only members see the messages, files, and even the channel\'s existence. Workspace admins can\'t read content without joining the channel (the action is logged).' },
          { q: 'Can I make a channel read-only?',
            a: 'Yes — managers can set a channel to "announce only" so only admins/managers can post. Useful for #announcements and #releases.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Try channels in your own workspace',
        body: 'Free for small teams. No credit card required.',
        button: { label: 'Create a workspace', to: '/signup' },
      },
    ],
  },

  messaging: {
    eyebrow: 'Product',
    title: 'Real-time messaging that disappears into the work',
    tagline:
      'Sub-100ms message delivery, presence, typing indicators, and live edits — built on a websocket layer designed for the way teams actually chat.',
    sections: [
      {
        type: 'text',
        heading: 'Built on a real-time core',
        paragraphs: [
          'Every message, edit, reaction, and presence change flows through a single websocket connection per client. That means messages appear in under 100ms, edits propagate instantly, and "who\'s online" never lies.',
          'Behind the scenes, Leedsphere uses a stateless API and Redis-backed pub/sub — so the same architecture that keeps two people in sync also handles 10,000 concurrent users in a single workspace.',
        ],
      },
      {
        type: 'stats',
        heading: 'Performance, by the numbers',
        items: [
          { value: '<100ms', label: 'p50 message latency', body: 'Median round-trip cross-region.' },
          { value: '<300ms', label: 'p99 message latency', body: 'Even the worst 1% beats most competitors\' median.' },
          { value: '10k+',   label: 'Concurrent users', body: 'Per workspace, sustained, no degradation.' },
        ],
      },
      {
        type: 'features',
        heading: 'The details we cared about',
        cards: [
          { icon: Send, title: 'Instant delivery', body: 'Messages reach every connected client in well under 100ms, even across continents.' },
          { icon: MessageSquare, title: 'Threaded conversations', body: 'Reply in-thread to keep the main channel readable.' },
          { icon: Sparkles, title: 'Edit & delete', body: 'Edit your own messages with an "(edited)" indicator; delete cleanly across all clients.' },
          { icon: Bell, title: 'Smart notifications', body: 'Mention-only mode, channel mute, snooze hours, and per-team defaults.' },
          { icon: Users, title: 'DMs and group DMs', body: 'Private 1:1 and small-group conversations outside team channels.' },
          { icon: Zap, title: 'Typing & presence', body: 'See who\'s typing right now and who\'s online — without polling.' },
        ],
      },
      {
        type: 'list',
        heading: 'Power-user features',
        items: [
          'Slash commands — `/remind`, `/poll`, `/giphy`, custom commands via webhook',
          'Message scheduling — write at midnight, deliver at 9am',
          'Quote-and-reply with one click; preserves the original context',
          'Markdown formatting with a visual toolbar; raw Markdown power-mode for keyboard users',
          'Drag-drop file uploads with inline previews and progress indicators',
          'Code blocks with syntax highlighting for 50+ languages',
          'Custom emoji per workspace; reactions show who reacted on hover',
          'Read receipts opt-in per channel — useful for status updates, off for casual rooms',
        ],
      },
      {
        type: 'quote',
        quote: 'The latency is genuinely indistinguishable from being in the same room. We didn\'t realize how much our previous tool was slowing us down until we switched.',
        attribution: 'Marcus Lee',
        role: 'Staff Engineer, Cobalt Robotics',
        avatar: 'from-emerald-500 to-teal-500',
      },
      {
        type: 'cta',
        heading: 'Feel the difference yourself',
        body: 'A free workspace takes under a minute to set up. Bring a teammate and watch the latency.',
        button: { label: 'Try Leedsphere free', to: '/signup' },
      },
    ],
  },

  'file-sharing': {
    eyebrow: 'Product',
    title: 'Drop a file, share a thought, link them forever',
    tagline:
      'Upload files directly into the conversation, project, or doc that needs them. Previews are inline, attribution is automatic, and search covers file contents.',
    sections: [
      {
        type: 'text',
        heading: 'Files stay with their context',
        paragraphs: [
          'Most teams lose files because they live in a different app than the discussion that produced them. Leedsphere attaches files directly to messages, projects, and docs — so the spec, the review thread, and the final asset are one click apart forever.',
          'Every file gets an automatic owner, a timestamp, and a permanent link. The link survives even if the file is moved between channels or projects — so old references in old threads still work.',
        ],
      },
      {
        type: 'features',
        heading: 'A first-class file experience',
        cards: [
          { icon: FileText, title: 'Inline previews', body: 'Images, video, PDFs, code, CSV, JSON — preview without download.' },
          { icon: Search, title: 'Search file contents', body: 'Full-text search across PDFs, docs, code, and CSV — not just filenames.' },
          { icon: Lock, title: 'Inherited permissions', body: 'Files inherit access from their parent channel or project. Move a file, permissions follow.' },
          { icon: History, title: 'Version history', body: 'Every reupload preserves the previous version with a one-click restore.' },
          { icon: Users, title: 'Per-file ownership', body: 'Every file shows who uploaded it and when, surfaced everywhere.' },
          { icon: Globe2, title: 'External storage adapters', body: 'Google Drive, Dropbox, S3, Box — link or sync (Enterprise).' },
        ],
      },
      {
        type: 'list',
        heading: 'Supported out of the box',
        items: [
          'Drag-drop and paste from clipboard',
          'Inline previews for images, video, PDFs, code, and CSV',
          'Per-file permissions inherit from the channel or project',
          'Full-text search inside text-based attachments',
          'Versioning — every reupload keeps history',
          'External-storage adapters for Google Drive, Dropbox, S3 (Enterprise)',
          'Per-workspace upload-size limit (5 GB on Free, 100 GB on Team, custom on Enterprise)',
          'Automatic virus scanning on every upload',
        ],
      },
      {
        type: 'faq',
        heading: 'About storage and limits',
        items: [
          { q: 'How much storage do I get?',
            a: 'Free workspaces get 10 GB total. Team plans include 1 TB pooled across the workspace. Enterprise customers can negotiate dedicated allocations or bring their own S3 bucket.' },
          { q: 'What happens when I hit the limit?',
            a: 'Existing files keep working. New uploads pause until you free space or upgrade. Admins get a 10-day warning before the cap.' },
          { q: 'Are files encrypted?',
            a: 'Yes — TLS in transit, AES-256 at rest. On Enterprise, we support customer-managed keys via AWS KMS.' },
          { q: 'Can I export everything?',
            a: 'Anytime. Workspace admins can export the entire workspace (messages + files + metadata) as a single zip from settings.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Stop hunting for files',
        body: 'Try a Leedsphere workspace and feel the difference within an afternoon.',
        button: { label: 'Get started free', to: '/signup' },
      },
    ],
  },

  search: {
    eyebrow: 'Product',
    title: 'Find any message, file, or doc — instantly',
    tagline:
      'Workspace-wide search with filters, smart ranking, and keyboard-first navigation. Cmd/Ctrl+K from anywhere.',
    sections: [
      {
        type: 'text',
        heading: 'Search that respects your time',
        paragraphs: [
          'Hit Cmd/Ctrl+K anywhere in Leedsphere and start typing. Results stream in as you type, ranked by recency, channel relevance, and how often you\'ve interacted with the result before.',
          'Filters narrow by sender, channel, project, file type, and date range. Boolean operators (AND, OR, "exact phrase") work the way you\'d expect — and so do regex queries for power users.',
        ],
      },
      {
        type: 'features',
        heading: 'What you can search',
        cards: [
          { icon: MessageSquare, title: 'Messages', body: 'Across every channel and DM you have access to.' },
          { icon: FileText, title: 'Files', body: 'Filenames AND text content (PDFs, docs, code, CSVs).' },
          { icon: FolderKanban, title: 'Projects & tasks', body: 'Titles, descriptions, comments, and assignees.' },
          { icon: Users, title: 'People', body: 'Find teammates by name, email, or role.' },
          { icon: Hash, title: 'Channels', body: 'Including topic and description metadata.' },
          { icon: Calendar, title: 'Events & meetings', body: 'Calendar items connected to the team.' },
        ],
      },
      {
        type: 'list',
        heading: 'Operators that work the way you\'d expect',
        items: [
          '`from:@priya` — limit to messages from a person',
          '`in:#design` — limit to a channel',
          '`has:link` / `has:file` / `has:image` — only messages containing those',
          '`before:2026-04-01` and `after:` — date filtering',
          '`"exact phrase"` — match the phrase, not the words',
          '`-keyword` — exclude results containing it',
          '`type:doc` / `type:task` / `type:message` — narrow result kind',
          '`/regex/` — for the truly committed (Team plan and above)',
        ],
      },
      {
        type: 'stats',
        heading: 'Built for instant feedback',
        items: [
          { value: '<50ms', label: 'Median query time', body: 'Across a workspace of 1M+ messages.' },
          { value: 'Cmd+K',  label: 'Always one shortcut away', body: 'From any page, any modal.' },
          { value: '100%',   label: 'Of content searchable', body: 'Including file contents, not just metadata.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Stop scrolling, start searching',
        body: 'Search is built into every plan, free included. Try it in your own workspace.',
        button: { label: 'Get started free', to: '/signup' },
      },
    ],
  },

  security: {
    eyebrow: 'Product',
    title: 'Security that lets you sleep at night',
    tagline:
      'Firebase Authentication, role-based access, encrypted transport, and audit logging — designed for teams that take their data seriously.',
    sections: [
      {
        type: 'text',
        heading: 'Defense in depth',
        paragraphs: [
          'Every Leedsphere request is authenticated via short-lived Firebase ID tokens, verified on the server using the Admin SDK. Per-team and per-workspace roles are checked at the route layer — so even a compromised client can\'t exceed the user\'s authorized scope.',
          'Data in transit is TLS-encrypted; sensitive fields are encrypted at rest. Sessions are revocable, password-reset is rate-limited, and abnormal sign-ins trigger alerts.',
          'We treat the security model as a first-class feature, not an afterthought. Our threat-model docs and incident response playbook are reviewed quarterly and shared with Enterprise customers under NDA.',
        ],
      },
      {
        type: 'features',
        heading: 'Controls at every layer',
        cards: [
          { icon: ShieldCheck, title: 'Identity', body: 'Firebase Auth with mandatory email verification, optional 2FA, and revocable sessions.' },
          { icon: Lock, title: 'Authorization', body: 'RBAC enforced server-side at the route layer. Admin / Manager / Member, no escape hatches.' },
          { icon: Globe2, title: 'Network', body: 'TLS 1.3 everywhere. HSTS preload. WAF in front of the API. Rate limits on every write endpoint.' },
          { icon: FileText, title: 'Data', body: 'AES-256 at rest. Encrypted backups. Customer-managed keys (CMK) on Enterprise.' },
          { icon: History, title: 'Audit', body: 'Signed, immutable audit log of admin and security-sensitive actions. Exportable to SIEM.' },
          { icon: Shield, title: 'Compliance', body: 'SOC 2 Type II. GDPR-aligned. HIPAA-ready architecture (BAA on Enterprise).' },
        ],
      },
      {
        type: 'list',
        heading: 'Controls included for every workspace',
        items: [
          'Role-based access control (Admin, Manager, Member) across every feature',
          'Email verification required before workspace access',
          'Token revocation on password change',
          'Session listing and remote sign-out',
          'Rate limiting on auth and write endpoints',
          'Audit log of admin and security actions (Enterprise)',
          'SSO / SAML / SCIM (Enterprise)',
          'Data residency options — US / EU / APAC (Enterprise)',
          'Customer-managed encryption keys via AWS KMS (Enterprise)',
          'Vulnerability disclosure program with bug-bounty payouts',
        ],
      },
      {
        type: 'faq',
        heading: 'Frequently asked',
        items: [
          { q: 'Where is my data stored?',
            a: 'Default region is US-East. Enterprise customers can pin data to EU (Frankfurt) or APAC (Singapore) at provisioning time. Cross-region replication is opt-in.' },
          { q: 'Do you support SSO?',
            a: 'Yes — SAML 2.0 and OIDC, with tested integrations for Okta, Azure AD, Google Workspace, OneLogin, and JumpCloud. Available on Enterprise.' },
          { q: 'Do you have a SOC 2 report?',
            a: 'SOC 2 Type II, audited annually. We\'ll share a copy under NDA — email security@leedsphere.app.' },
          { q: 'How do you handle vulnerabilities?',
            a: 'Reports go to security@leedsphere.app (PGP key on request). Acknowledgement within 24 hours, fix windows of 7 / 30 / 90 days depending on severity.' },
          { q: 'What about subprocessors?',
            a: 'Our list is public and updated whenever we add or remove a vendor. Available at leedsphere.app/subprocessors.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Need a security review?',
        body: 'We share our SOC 2 report, sub-processors list, and architecture diagrams under NDA.',
        button: { label: 'Talk to us', to: '/contact' },
      },
    ],
  },

  roadmap: {
    eyebrow: 'Product',
    title: 'What we\'re building next',
    tagline:
      'A peek at what\'s in flight, what\'s shipping soon, and what\'s on the horizon. Updated continuously.',
    sections: [
      {
        type: 'text',
        heading: 'How our roadmap works',
        paragraphs: [
          'We commit publicly to what we\'re actively working on, signal what\'s coming next, and share what we\'re researching. Items can move between buckets as we learn — but we don\'t promise dates.',
        ],
      },
      {
        type: 'features',
        heading: 'In progress',
        cards: [
          { icon: Sparkles, title: 'AI message summary', body: 'One-click "catch me up" for channels you\'ve missed. Beta in April.' },
          { icon: Calendar, title: 'Calendar integration', body: 'Two-way sync with Google Calendar and Outlook. Beta opening soon.' },
          { icon: GitBranch, title: 'Public API', body: 'Read/write REST + webhooks for messages, channels, and projects.' },
        ],
      },
      {
        type: 'features',
        heading: 'Up next',
        cards: [
          { icon: Map, title: 'Mobile apps', body: 'Native iOS and Android apps with offline cache.' },
          { icon: ShieldCheck, title: 'SSO / SAML', body: 'For Enterprise customers with central identity providers.' },
          { icon: LayoutDashboard, title: 'Customizable dashboard', body: 'Pin the channels, projects, and metrics that matter to you.' },
        ],
      },
      {
        type: 'features',
        heading: 'Researching',
        cards: [
          { icon: Sparkles, title: 'AI-assisted writing', body: 'Tone-aware autocomplete and message rewrite suggestions.' },
          { icon: Bell,     title: 'Cross-workspace notifications', body: 'For consultants and contractors who live in multiple workspaces.' },
          { icon: FolderKanban, title: 'Resource-level Gantt views', body: 'Project planning that scales beyond a Kanban.' },
        ],
      },
      {
        type: 'list',
        heading: 'Our promises (and one we don\'t make)',
        items: [
          'We won\'t ship features that violate the security model.',
          'We won\'t add per-feature paywalls on parts that matter (search, threads, RBAC).',
          'We won\'t use your messages to train AI models.',
          'We will ship something every week.',
          'We won\'t commit to dates publicly — but we will commit to direction.',
        ],
      },
      {
        type: 'cta',
        heading: 'Have a request?',
        body: 'Suggestions go straight to the product team. The most-requested ones move up the queue.',
        button: { label: 'Submit feedback', to: '/contact' },
      },
    ],
  },

  changelog: {
    eyebrow: 'Product',
    title: 'Changelog',
    tagline:
      'Every notable change in Leedsphere, newest first. We ship something every week.',
    sections: [
      {
        type: 'steps',
        heading: 'Recent releases',
        items: [
          {
            title: 'v2.4 — April 2026',
            body: 'Real-time message editing with (edited) indicators. Force-refresh on socket auth errors. Smart provisioning routes invitees to Member role automatically.',
          },
          {
            title: 'v2.3 — March 2026',
            body: 'Role-based access control across projects, tasks, channels, and invites. Backend hardened with Firebase Admin token verification.',
          },
          {
            title: 'v2.2 — February 2026',
            body: 'Workspace search with filters and sub-100ms ranking. New keyboard-first command palette (Cmd/Ctrl+K).',
          },
          {
            title: 'v2.1 — January 2026',
            body: 'Threaded replies and per-team default notification settings. Reactions get a quick-emoji bar.',
          },
          {
            title: 'v2.0 — December 2025',
            body: 'Major rewrite: workspaces and teams as first-class concepts, dark mode, and a dashboard redesign.',
          },
          {
            title: 'v1.9 — October 2025',
            body: 'Public beta of projects (Kanban + tasks). Mobile web preview. Slack import tooling.',
          },
          {
            title: 'v1.8 — August 2025',
            body: 'Reactions, mentions, and pinned messages reach general availability. Dramatic improvements to typing-indicator throughput.',
          },
          {
            title: 'v1.7 — June 2025',
            body: 'Direct messages and group DMs. Per-user time-zone profiles. Notification snooze.',
          },
        ],
      },
      {
        type: 'list',
        heading: 'Release cadence',
        items: [
          'Weekly small updates — bug fixes and minor improvements ship every Tuesday',
          'Monthly minor versions — combined feature sets with proper release notes',
          'Quarterly major versions — the big ones, with migration guides where needed',
          'Hotfixes — out-of-band when severity demands it, no fixed cadence',
        ],
      },
      {
        type: 'cta',
        heading: 'Want to know first?',
        body: 'Subscribe to the changelog by email — one short summary per release.',
        button: { label: 'Sign up', to: '/signup' },
      },
    ],
  },

  /* ============================ TEAMS ============================ */
  'use-cases-product': {
    eyebrow: 'Use case',
    title: 'For product teams',
    tagline:
      'Bring research, specs, customer feedback, and shipping decisions into one place — so the loop from idea to launch stays tight.',
    sections: [
      {
        type: 'text',
        heading: 'Why product teams pick Leedsphere',
        paragraphs: [
          'Product teams live across surfaces: research notes, design files, engineering threads, customer interviews. Every handoff loses context. Leedsphere keeps the conversation, the doc, and the deliverable in one workspace so reviewers don\'t need a tour to give feedback.',
          'PMs, designers, and engineers see the same surface — channels for discussion, projects for tracking, docs for decisions. The handoffs disappear because the work never leaves the workspace.',
        ],
      },
      {
        type: 'features',
        heading: 'How teams use it',
        cards: [
          { icon: Compass, title: 'Discovery', body: 'A research channel with interview notes, transcripts, and themes. Mention designers when patterns emerge.' },
          { icon: FileText, title: 'Specs', body: 'Living docs that link back to the channel where the decision was made.' },
          { icon: FolderKanban, title: 'Roadmap', body: 'Kanban boards tied to teams; quarterly initiatives nested as projects.' },
          { icon: MessageSquare, title: 'Launch threads', body: 'Per-feature channels for cross-functional launch coordination.' },
        ],
      },
      {
        type: 'list',
        heading: 'A typical week in a Leedsphere product team',
        items: [
          'Monday — review the roadmap board, scan #customer-feedback for themes',
          'Tuesday — kick off discovery in a new channel, drop transcripts as docs',
          'Wednesday — write the spec; reviewers comment in-thread; resolution lives next to the artifact',
          'Thursday — cross-functional launch sync via threads (no meeting required)',
          'Friday — ship; post the changelog entry to #releases',
        ],
      },
      {
        type: 'quote',
        quote: 'The discovery-to-launch loop went from three weeks to eight days. We didn\'t change our process — we just stopped losing context between tools.',
        attribution: 'Devon Park',
        role: 'Director of Product, Aurora',
        avatar: 'from-amber-500 to-orange-500',
      },
      {
        type: 'cta',
        heading: 'Try Leedsphere with your product team',
        body: 'Free for small teams. Bring three people, set up a workspace in five minutes.',
        button: { label: 'Get started free', to: '/signup' },
      },
    ],
  },

  'use-cases-engineering': {
    eyebrow: 'Use case',
    title: 'For engineering teams',
    tagline:
      'Code reviews, incident response, on-call rotations, and architecture discussions — in one workspace your engineers actually want to use.',
    sections: [
      {
        type: 'text',
        heading: 'Built for the way engineers work',
        paragraphs: [
          'Engineers don\'t want another tool. Leedsphere borrows the keyboard-first, dense-information aesthetic of the IDE — code blocks with syntax highlighting, Markdown rendering, slash commands, and a command palette behind Cmd/Ctrl+K.',
          'GitHub and GitLab integrations bring PRs, deploys, and CI status into the right channel automatically. We even respect dark mode by default.',
        ],
      },
      {
        type: 'features',
        heading: 'Workflows engineers love',
        cards: [
          { icon: Code2, title: 'Code reviews', body: 'PR threads with inline diffs and CI checks alongside the discussion.' },
          { icon: ShieldCheck, title: 'Incident response', body: 'Spin up a private channel per incident; archive it with a postmortem doc when resolved.' },
          { icon: GitBranch, title: 'Deploys', body: 'Deploy bots post status updates to a #deploys channel; rollbacks one click away.' },
          { icon: BookOpen, title: 'RFCs', body: 'Architecture proposals as collaborative docs, with comments threaded in the channel.' },
        ],
      },
      {
        type: 'list',
        heading: 'Integrations engineers actually use',
        items: [
          'GitHub / GitLab — PRs, comments, CI checks, deploys',
          'Sentry / Datadog — alert routing into per-team channels',
          'PagerDuty — on-call schedule visible alongside the team',
          'Linear / Jira — issue mentions resolve to rich previews',
          'Webhooks — stream any event into a channel with one URL',
          'Slash commands — `/incident`, `/postmortem`, `/oncall`, custom commands per workspace',
        ],
      },
      {
        type: 'quote',
        quote: 'Our incident response went from "did everyone see the page?" to a single channel where the timeline writes itself. We don\'t want to imagine going back.',
        attribution: 'Sasha Wong',
        role: 'Staff SRE, Helix Health',
        avatar: 'from-pink-500 to-rose-500',
      },
      {
        type: 'cta',
        heading: 'Spin up an engineering workspace',
        body: 'Free for teams under 10. Wire up your GitHub bot in five minutes.',
        button: { label: 'Get started free', to: '/signup' },
      },
    ],
  },

  'use-cases-design': {
    eyebrow: 'Use case',
    title: 'For design teams',
    tagline:
      'A workspace that feels as good as the work you ship. Critique, share files, and collaborate with engineers without leaving context.',
    sections: [
      {
        type: 'text',
        heading: 'Made by people who care about pixels',
        paragraphs: [
          'Design happens in a hundred shared files, a thousand Loom videos, and a million Slack DMs. Leedsphere consolidates them into one workspace where the right people see the right work — and feedback never gets lost in the void.',
          'We borrowed cues from the tools designers already love. Hover states have intent. Spacing is consistent. Type ramps mean something. The product is, itself, an argument that craft pays off.',
        ],
      },
      {
        type: 'features',
        heading: 'For the design workflow',
        cards: [
          { icon: Palette, title: 'Critique threads', body: 'Drop a Figma frame, get threaded feedback. Resolution lives next to the artifact.' },
          { icon: FileText, title: 'Design docs', body: 'Living rationales for the patterns and tokens that shape your product.' },
          { icon: MessageSquare, title: 'Async-first', body: 'Loom-style video and image previews for time-zone-spanning teams.' },
          { icon: FolderKanban, title: 'Project tracking', body: 'Visual Kanban with file attachments, due dates, and per-feature checklists.' },
        ],
      },
      {
        type: 'list',
        heading: 'Integrations for the design stack',
        items: [
          'Figma — paste a link, get an inline frame preview',
          'Loom — videos render in-thread with timecodes',
          'Notion / Coda — embed pages as live previews',
          'Pinterest / Are.na — drop boards into channels',
          'Dropbox / Drive — file links resolve with thumbnails',
        ],
      },
      {
        type: 'quote',
        quote: 'The team\'s critique culture changed in a week. People left more thoughtful comments because the tool finally felt worthy of careful work.',
        attribution: 'Lin Wang',
        role: 'Design Lead, Quanta',
        avatar: 'from-emerald-500 to-teal-500',
      },
      {
        type: 'cta',
        heading: 'Bring your design team in',
        body: 'Free for small teams. Set up a workspace, invite your designers, watch the threads start.',
        button: { label: 'Try it free', to: '/signup' },
      },
    ],
  },

  'use-cases-marketing': {
    eyebrow: 'Use case',
    title: 'For marketing teams',
    tagline:
      'Campaign planning, content reviews, launch coordination, and analytics — in one shared workspace.',
    sections: [
      {
        type: 'text',
        heading: 'Marketing moves fast',
        paragraphs: [
          'Campaigns span half a dozen tools and twice as many calendars. Leedsphere brings the brief, the assets, the review cycle, and the launch checklist into the same place — so when the deadline is Friday, no one is hunting for the latest copy on Thursday night.',
          'And when something goes live, the post-launch retro lives in the same channel — so next quarter\'s campaign starts with last quarter\'s lessons one search away.',
        ],
      },
      {
        type: 'features',
        heading: 'Where the work happens',
        cards: [
          { icon: Megaphone, title: 'Campaign channels', body: 'Per-campaign channels with the brief pinned, assets attached, and stakeholders mentioned.' },
          { icon: FileText, title: 'Content reviews', body: 'Drafts as docs, comments inline, decisions in-thread.' },
          { icon: Calendar, title: 'Editorial calendar', body: 'A shared Kanban for posts, releases, and webinars.' },
          { icon: FolderKanban, title: 'Launch playbooks', body: 'Reusable templates for product, content, and event launches.' },
        ],
      },
      {
        type: 'steps',
        heading: 'A campaign, end to end',
        items: [
          { title: 'Brief',  body: 'Spin up a #campaign-q2 channel. Pin the brief doc. @mention the team.' },
          { title: 'Build',  body: 'Designers drop assets, copywriters draft in docs, reviews happen in threads.' },
          { title: 'Review', body: 'Stakeholders sign off in-channel. Decisions and changes preserved forever.' },
          { title: 'Launch', body: 'Schedule the announcement. Cross-post to #releases.' },
          { title: 'Retro',  body: 'Pin the metrics, capture the lessons. Next quarter starts here.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Make your next launch the easy one',
        body: 'Set up a campaign workspace in five minutes — no agency, no IT ticket.',
        button: { label: 'Get started free', to: '/signup' },
      },
    ],
  },

  'use-cases-support': {
    eyebrow: 'Use case',
    title: 'For customer support teams',
    tagline:
      'Triage, escalate, and resolve customer issues with the right context — and a clear thread back to the product team.',
    sections: [
      {
        type: 'text',
        heading: 'Closer to the product than help-desk software',
        paragraphs: [
          'When a tricky support ticket needs an engineer\'s eye, traditional help-desk tools force a context switch. Leedsphere keeps support, engineering, and product on the same workspace — escalations are a mention away.',
          'Customer signal — the recurring questions, the missing features, the surprising delights — flows back into product channels automatically. The shortest path from a customer\'s pain to a product fix runs through Leedsphere.',
        ],
      },
      {
        type: 'features',
        heading: 'How support teams operate',
        cards: [
          { icon: LifeBuoy, title: 'Triage channels', body: 'A shared queue with rotating on-call and clear status indicators.' },
          { icon: MessageSquare, title: 'Escalations', body: 'Mention engineering or product directly in the thread, with the original context attached.' },
          { icon: BookOpen, title: 'Knowledge base', body: 'Internal docs that double as canned answers; updated by the people closest to customers.' },
          { icon: Newspaper, title: 'Customer signal', body: 'A weekly digest of issues, surfaced to the product team automatically.' },
        ],
      },
      {
        type: 'list',
        heading: 'Support-team integrations',
        items: [
          'Zendesk / Intercom — tickets surface in the right channel',
          'Help Scout — escalations route to engineering threads',
          'Linear / Jira — bugs filed from a thread carry the conversation as context',
          'Statuspage — incident updates auto-post to a #status channel',
          'Custom webhooks — wire your in-house tools in minutes',
        ],
      },
      {
        type: 'cta',
        heading: 'Cut your average time-to-resolution',
        body: 'Support teams report 30% faster resolutions when the engineering team is one mention away.',
        button: { label: 'Get started free', to: '/signup' },
      },
    ],
  },

  'use-cases-remote': {
    eyebrow: 'Use case',
    title: 'For remote teams',
    tagline:
      'Async-first communication, time-zone-friendly defaults, and presence that respects boundaries — built for distributed teams.',
    sections: [
      {
        type: 'text',
        heading: 'Designed for distance',
        paragraphs: [
          'Remote teams need different rituals than colocated ones — written context, async approvals, working-hours awareness. Leedsphere\'s defaults reflect that: per-user time zones, snooze hours, scheduled messages, and a culture that treats threads as primary.',
          'It\'s not just about features. The defaults make async behavior the path of least resistance — so a team using Leedsphere for the first time naturally falls into healthier remote habits.',
        ],
      },
      {
        type: 'features',
        heading: 'Async-friendly out of the box',
        cards: [
          { icon: Globe2, title: 'Time-zone profiles', body: 'See teammates\' local time and working hours next to their name.' },
          { icon: Bell, title: 'Snooze hours', body: 'Notifications quiet themselves outside your declared working window.' },
          { icon: Send, title: 'Scheduled messages', body: 'Write at midnight, deliver at 9am.' },
          { icon: MessageSquare, title: 'Thread-first culture', body: 'Default channel reads quiet down to threaded discussions.' },
        ],
      },
      {
        type: 'list',
        heading: 'Remote-team rituals we make easy',
        items: [
          'Daily async standups via /standup command into a thread',
          'Decision docs that survive the meeting — every decision gets a permanent home',
          'Weekly digests of channel activity for people coming off PTO',
          'Loom-style video previews for things that are easier said than written',
          'Working-hours overlap visibility on every channel',
        ],
      },
      {
        type: 'quote',
        quote: 'I run a team across five time zones. Leedsphere is the first tool that doesn\'t make that feel like a handicap.',
        attribution: 'Maria Schmidt',
        role: 'Head of Engineering, Lighthouse',
        avatar: 'from-indigo-500 to-purple-500',
      },
      {
        type: 'cta',
        heading: 'Build a remote team that feels close',
        body: 'Free for small teams. Set up across time zones in five minutes.',
        button: { label: 'Try it free', to: '/signup' },
      },
    ],
  },

  'use-cases-startups': {
    eyebrow: 'Use case',
    title: 'For startups',
    tagline:
      'Move fast without losing institutional memory. Leedsphere is free for small teams and grows with you — same primitives, scale-ready architecture.',
    sections: [
      {
        type: 'text',
        heading: 'Built to grow with you',
        paragraphs: [
          'Startups outgrow their tools every 12 months. Leedsphere is designed to be your last collaboration migration: the same workspaces and channels that work for a 5-person team handle a 500-person company without re-platforming.',
          'When the day comes that your security team asks for SSO, audit logs, or data residency — those features turn on without a re-onboarding. The data and habits you built at 5 people just keep working at 500.',
        ],
      },
      {
        type: 'list',
        heading: 'Why early-stage teams pick us',
        items: [
          'Free for teams under 10 — no credit card required',
          'Generous limits on storage, history, and integrations',
          'No per-feature paywalls on the things that matter (search, threads, RBAC)',
          'Roles and audit logs ready for when you hit your first compliance review',
          'Founder-friendly support — real humans, real fast',
        ],
      },
      {
        type: 'features',
        heading: 'Startup-specific perks',
        cards: [
          { icon: Rocket, title: 'YC / Techstars credits', body: '$2k of credits for accepted accelerator companies. Apply at /contact.' },
          { icon: Heart, title: 'Founder discount', body: '50% off Team plan for the first year for venture-backed startups under 25 people.' },
          { icon: GraduationCap, title: 'Free for non-profits', body: '501(c)(3) and registered charities get the Team plan free, forever.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Start free, stay free until it doesn\'t fit',
        body: 'Sign up and you\'re running in two minutes.',
        button: { label: 'Get started', to: '/signup' },
      },
    ],
  },

  'use-cases-enterprises': {
    eyebrow: 'Use case',
    title: 'For enterprises',
    tagline:
      'SSO, audit logs, data residency, and dedicated support — for organizations that need scale, governance, and accountability.',
    sections: [
      {
        type: 'text',
        heading: 'Built for the enterprise checklist',
        paragraphs: [
          'Large organizations need more than a great product — they need predictable security posture, identity integration, and contractual guarantees. The Leedsphere Enterprise plan adds the controls and commitments your security and compliance teams expect.',
        ],
      },
      {
        type: 'features',
        heading: 'Enterprise-only capabilities',
        cards: [
          { icon: ShieldCheck, title: 'SSO / SAML', body: 'Centralize identity through Okta, Azure AD, Google Workspace, and others.' },
          { icon: Building2, title: 'Data residency', body: 'Pin your workspace data to a specific region — US, EU, or APAC.' },
          { icon: History, title: 'Audit logs', body: 'A signed, immutable record of every admin and security-sensitive action.' },
          { icon: Award, title: 'SLA & uptime', body: '99.9% contractual uptime with credits, plus dedicated TAMs.' },
          { icon: Users, title: 'SCIM provisioning', body: 'Auto-provision and de-provision users from your IdP.' },
          { icon: LifeBuoy, title: 'Dedicated support', body: 'Named CSM, 24/7 priority support, quarterly business reviews.' },
        ],
      },
      {
        type: 'list',
        heading: 'What you get with the Enterprise contract',
        items: [
          'Mutual NDA, MSA, DPA, and BAA on file before kickoff',
          'Named Customer Success Manager and Solutions Engineer',
          'Quarterly business reviews with roadmap input',
          '24/7 priority support with 15-minute response on Sev 1',
          'Custom data-retention and export policies',
          'Sandbox workspace for testing changes',
          'Annual security questionnaire support — we\'ve seen yours before',
        ],
      },
      {
        type: 'quote',
        quote: 'Their security team answered every question in our 200-line questionnaire in under a week. The implementation took less time than the procurement.',
        attribution: 'Sarah Patel',
        role: 'CISO, Ventra Financial',
        avatar: 'from-amber-500 to-orange-500',
      },
      {
        type: 'cta',
        heading: 'Talk to our enterprise team',
        body: 'We\'ll walk you through the architecture, share our SOC 2 report, and tailor a deployment to your needs.',
        button: { label: 'Contact sales', to: '/contact' },
      },
    ],
  },

  /* ============================ RESOURCES ============================ */
  help: {
    eyebrow: 'Resources',
    title: 'Help Center',
    tagline:
      'Answers to common questions, troubleshooting steps, and a path to a real human when you need one.',
    sections: [
      {
        type: 'features',
        heading: 'Browse by topic',
        cards: [
          { icon: Rocket, title: 'Getting started', body: 'Sign-up, your first workspace, and inviting teammates.' },
          { icon: Hash, title: 'Channels & messaging', body: 'How channels, threads, and reactions work.' },
          { icon: FolderKanban, title: 'Projects & tasks', body: 'Kanban boards, assignees, and due dates.' },
          { icon: Shield, title: 'Roles & permissions', body: 'Admin, Manager, Member — and what each can do.' },
          { icon: Lock, title: 'Account & security', body: 'Password resets, 2FA, and managing sessions.' },
          { icon: LifeBuoy, title: 'Billing', body: 'Plans, invoices, and changes to your subscription.' },
        ],
      },
      {
        type: 'faq',
        heading: 'Frequently asked',
        items: [
          { q: 'How do I invite people to my workspace?', a: 'Open the workspace switcher, click "Invite people", and paste in email addresses. Each invite carries a role you choose at send time.' },
          { q: 'Can I move messages between channels?', a: 'Yes — admins and managers can move single messages or entire threads. Move history is recorded in the channel\'s audit log.' },
          { q: 'What happens to my data if I cancel?', a: 'You can export everything (messages, files, projects) anytime. After cancellation, data is retained for 30 days, then permanently deleted.' },
          { q: 'Is there a desktop app?', a: 'Native macOS, Windows, and Linux apps are in beta. Sign in with the same account for parity.' },
          { q: 'How do I change my email or password?', a: 'Settings → Account. Email changes require verification of the new address; password changes invalidate all existing sessions.' },
          { q: 'Why am I not getting notifications?', a: 'Most often it\'s OS-level: macOS Focus or Windows Quiet Hours. Check Settings → Notifications inside Leedsphere first; if it\'s set correctly there, the OS is the culprit.' },
          { q: 'Can I use Leedsphere offline?', a: 'The desktop app caches recent messages and lets you read/draft offline; sends queue and deliver when you reconnect.' },
          { q: 'How do I delete my account?', a: 'Settings → Account → Delete. Workspace owners need to transfer ownership or delete the workspace first. The action is reversible for 14 days.' },
        ],
      },
      {
        type: 'list',
        heading: 'Quick troubleshooting',
        items: [
          'Can\'t sign in? Reset your password from /forgot-password.',
          'Verification email missing? Check spam, then click "Resend" on the verify-email screen.',
          'Messages not sending? Check your network indicator (top-right of the sidebar). Hard refresh if it\'s red.',
          'Search returning nothing? New content indexes within 60 seconds; wait and retry.',
          'Notifications doubled? You\'re probably signed in to both web and desktop — adjust delivery in Settings → Notifications.',
        ],
      },
      {
        type: 'cta',
        heading: 'Still stuck?',
        body: 'Our support team typically replies within a few hours.',
        button: { label: 'Contact support', to: '/contact' },
      },
    ],
  },

  'getting-started': {
    eyebrow: 'Resources',
    title: 'Getting started with Leedsphere',
    tagline:
      'From sign-up to your first conversation in five minutes. Here\'s the shortest path.',
    sections: [
      {
        type: 'steps',
        heading: 'Five steps to a working workspace',
        items: [
          { title: 'Sign up', body: 'Create an account at /signup. Verify your email when the link arrives.' },
          { title: 'Create a workspace', body: 'Name it after your company or team. You\'ll be the workspace admin by default.' },
          { title: 'Set up your first team', body: 'Teams group people who collaborate frequently. You can have multiple teams in one workspace.' },
          { title: 'Invite members', body: 'Send invite links by email. Pick a role for each invitee — Admin, Manager, or Member.' },
          { title: 'Start a conversation', body: 'Open the default #general channel and say hi. Or create a new channel for the work you\'re kicking off.' },
        ],
      },
      {
        type: 'features',
        heading: 'Power moves to learn next',
        cards: [
          { icon: Search, title: 'Master Cmd/Ctrl+K', body: 'The fastest way to navigate Leedsphere — every channel, person, and command.' },
          { icon: Hash, title: 'Channel topics & pinned messages', body: 'Make your channels self-documenting.' },
          { icon: Bell, title: 'Tune your notifications', body: 'Per-channel and per-team rules so you only hear what matters.' },
          { icon: FolderKanban, title: 'Try projects', body: 'Lightweight Kanban for the work that needs structure beyond chat.' },
        ],
      },
      {
        type: 'list',
        heading: 'First-week setup checklist',
        items: [
          'Set your timezone and working hours in Profile → Preferences',
          'Pick light or dark mode (and bind to system preference)',
          'Install the desktop app — same account, native notifications',
          'Create #general, #random, and one channel per current initiative',
          'Pin team norms / decision-doc template to #general',
          'Wire up at least one integration — GitHub, Calendar, or your bug tracker',
          'Schedule a 15-minute team intro: everyone introduces themselves in #general',
        ],
      },
      {
        type: 'faq',
        heading: 'Common new-team questions',
        items: [
          { q: 'How big should my workspace be?',
            a: 'One workspace per company is the right answer for almost everyone. Use teams to subdivide. Multiple workspaces only make sense if the orgs are truly independent (e.g. an agency with separate clients).' },
          { q: 'How do I invite a lot of people at once?',
            a: 'Paste a comma-separated list of emails into the invite modal. Or upload a CSV. Or use SCIM (Enterprise) and let your IdP push them.' },
          { q: 'Can I import from Slack?',
            a: 'Yes — workspace admins can run a one-click Slack import that brings over channels, history, members, and most reactions. The import is idempotent; run it twice if needed.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Ready when you are',
        body: 'Most teams are productive within an hour of signup.',
        button: { label: 'Create your workspace', to: '/signup' },
      },
    ],
  },

  docs: {
    eyebrow: 'Resources',
    title: 'Documentation',
    tagline:
      'In-depth reference material for every Leedsphere feature, plus integration guides for developers.',
    sections: [
      {
        type: 'features',
        heading: 'Browse by area',
        cards: [
          { icon: BookOpen, title: 'Concepts', body: 'Workspaces, teams, channels, roles — the model that holds it all together.' },
          { icon: Hash, title: 'Messaging', body: 'Channel types, threads, reactions, mentions, and message lifecycle.' },
          { icon: FolderKanban, title: 'Projects', body: 'Boards, tasks, statuses, and document attachments.' },
          { icon: Shield, title: 'Permissions', body: 'How RBAC is enforced across every endpoint and feature.' },
          { icon: Code2, title: 'API reference', body: 'REST endpoints, websocket events, and rate limits.' },
          { icon: GitBranch, title: 'Webhooks & integrations', body: 'Send and receive events from external systems.' },
        ],
      },
      {
        type: 'list',
        heading: 'For developers',
        items: [
          'REST API — every action available in the UI is also exposed via JSON',
          'Websocket events — subscribe to messages, presence, and channel changes in real time',
          'Webhooks — outbound POSTs for the events that matter to your stack',
          'OAuth 2.0 for third-party apps acting on behalf of users',
          'Personal access tokens for scripting and CI use',
          'Generous rate limits — 600 req/min on REST, no limit on socket events',
          'Sandbox environments for safe development',
        ],
      },
      {
        type: 'faq',
        heading: 'Developer FAQ',
        items: [
          { q: 'Where do I get an API key?',
            a: 'Workspace settings → Developer → "Generate token". Tokens are scoped to the role of the user that created them.' },
          { q: 'Are there SDKs?',
            a: 'Official SDKs in TypeScript, Python, and Go. Community SDKs for Ruby, Rust, and Elixir.' },
          { q: 'How do I test without affecting production?',
            a: 'Every workspace can spin up a free sandbox workspace via Settings → Developer → Sandbox. It mirrors production behavior with isolated data.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Building an integration?',
        body: 'Get an API key from your workspace settings and start hacking.',
        button: { label: 'Sign up', to: '/signup' },
      },
    ],
  },

  guides: {
    eyebrow: 'Resources',
    title: 'Guides',
    tagline:
      'Opinionated playbooks for getting the most out of Leedsphere — written by the team that built it.',
    sections: [
      {
        type: 'text',
        heading: 'Why we publish guides instead of feature docs',
        paragraphs: [
          'Feature docs tell you what a button does. Guides tell you what to do with it. Our guides are opinionated playbooks based on what we\'ve seen actually work — at our customers, and at our own company.',
          'They\'re written by the people who built the product and battle-tested by the people who use it every day. No fluff, no SEO bait.',
        ],
      },
      {
        type: 'features',
        heading: 'Recent guides',
        cards: [
          { icon: Compass, title: 'Setting up a new team', body: 'Channel naming conventions, role assignment, and the first-week checklist.' },
          { icon: ShieldCheck, title: 'Locking down a workspace', body: 'A 15-minute security audit you can run yourself.' },
          { icon: Heart, title: 'Building a healthy async culture', body: 'Norms, defaults, and rituals for distributed teams.' },
          { icon: Megaphone, title: 'Running a launch in Leedsphere', body: 'A reusable template for product, content, and event launches.' },
          { icon: GraduationCap, title: 'Onboarding new hires', body: 'Make day one feel like a warm welcome, not a fire-hose.' },
          { icon: Newspaper, title: 'Migrating from Slack', body: 'A step-by-step playbook with import tooling and team-comms templates.' },
        ],
      },
      {
        type: 'list',
        heading: 'Coming soon',
        items: [
          'Running quarterly planning entirely async',
          'Designing your channel naming scheme so it scales past 100 channels',
          'A practical guide to mention etiquette',
          'How to write decision docs your future self will thank you for',
          'Setting up a customer-feedback pipeline that actually closes the loop',
        ],
      },
      {
        type: 'cta',
        heading: 'Got a guide you want to see?',
        body: 'We write what our customers ask for. Tell us what you\'re wrestling with.',
        button: { label: 'Suggest a guide', to: '/contact' },
      },
    ],
  },

  tutorials: {
    eyebrow: 'Resources',
    title: 'Tutorials',
    tagline:
      'Short, focused walkthroughs that teach one thing at a time. Most take under five minutes.',
    sections: [
      {
        type: 'features',
        heading: 'Pick a tutorial',
        cards: [
          { icon: Hash, title: 'Create your first channel', body: 'From "+ New" to inviting your first member, in 90 seconds.' },
          { icon: MessageSquare, title: 'Use threads effectively', body: 'When to spawn one, how to summarize, when to close it.' },
          { icon: FolderKanban, title: 'Build a project board', body: 'Stages, swimlanes, and the difference between a project and a task.' },
          { icon: Search, title: 'Power-search like a pro', body: 'Filters, operators, and the keyboard shortcuts that turn search into a superpower.' },
          { icon: Bell, title: 'Tune notifications without missing things', body: 'A 4-step recipe for per-channel rules.' },
          { icon: Code2, title: 'Wire up a webhook', body: 'Send a deploy notification from your CI to a Leedsphere channel.' },
        ],
      },
      {
        type: 'features',
        heading: 'Tutorials for admins',
        cards: [
          { icon: Shield, title: 'Set up roles correctly', body: 'When to use Manager instead of Admin, and how to delegate without losing control.' },
          { icon: UserPlus, title: 'Run a 50-person invite', body: 'CSV uploads, role pre-assignment, and welcome messages that scale.' },
          { icon: ShieldCheck, title: 'Workspace audit checklist', body: 'A monthly 15-minute review to keep permissions clean.' },
          { icon: History, title: 'Recover a deleted channel', body: 'Yes, you can. Here\'s how and what gets restored.' },
        ],
      },
      {
        type: 'list',
        heading: 'Tutorial format',
        items: [
          'One concept per tutorial — no scope creep',
          '3-5 minute reads with screenshots and short clips',
          'A working example you can paste into your own workspace',
          'Links to related guides and the underlying docs',
          'Updated whenever the underlying feature ships a change',
        ],
      },
      {
        type: 'cta',
        heading: 'Want to suggest one?',
        body: 'We add new tutorials based on what real users are getting stuck on.',
        button: { label: 'Tell us', to: '/contact' },
      },
    ],
  },

  blog: {
    eyebrow: 'Resources',
    title: 'The Leedsphere Blog',
    tagline:
      'Product updates, engineering deep-dives, and notes from a small team building collaboration software.',
    sections: [
      {
        type: 'steps',
        heading: 'Recent posts',
        items: [
          { title: 'Why we rebuilt our real-time layer (and what we learned)', body: 'A long look at the websocket architecture behind v2.4 — and the off-by-one bug that ate a week. April 2026.' },
          { title: 'Async by default: how we run product across four time zones', body: 'The rituals, doc templates, and meeting rules we use to keep a distributed team aligned. March 2026.' },
          { title: 'Designing for keyboard power users', body: 'Why we made Cmd/Ctrl+K the front door — and the research that shaped the command palette. March 2026.' },
          { title: 'Role-based access, explained simply', body: 'Three roles, one matrix, and the philosophy behind keeping it that way. February 2026.' },
          { title: 'A peek at the new dashboard', body: 'A walkthrough of the v2.0 redesign — what changed, what didn\'t, and why. December 2025.' },
        ],
      },
      {
        type: 'features',
        heading: 'Browse by category',
        cards: [
          { icon: Sparkles, title: 'Product', body: 'New features, behind-the-scenes design notes, and what\'s coming next.' },
          { icon: Code2, title: 'Engineering', body: 'Architecture, performance, security, and the occasional war story.' },
          { icon: Heart, title: 'Culture', body: 'How we work — async rituals, hiring, remote-first practices.' },
          { icon: Users, title: 'Customer stories', body: 'Real teams using Leedsphere in unexpected and creative ways.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Subscribe to the blog',
        body: 'One short email per week with the latest post and a few links worth your time.',
        button: { label: 'Subscribe', to: '/contact' },
      },
    ],
  },

  community: {
    eyebrow: 'Resources',
    title: 'Community',
    tagline:
      'Talk to other Leedsphere customers, swap tips, request features, and meet the team.',
    sections: [
      {
        type: 'text',
        heading: 'Why we invest in community',
        paragraphs: [
          'The best ideas in our roadmap come from customers, not internal brainstorms. Our community spaces exist so we can listen — and so customers can learn from each other faster than we could possibly document.',
          'Everyone is welcome, regardless of plan. The community is one of our favorite parts of running this company.',
        ],
      },
      {
        type: 'features',
        heading: 'Where the community lives',
        cards: [
          { icon: MessageSquare, title: 'Public Slack-style forum', body: 'A Leedsphere workspace where customers and our team mingle. Open invitation.' },
          { icon: Users, title: 'Local meetups', body: 'Self-organized gatherings in 12 cities and growing. Find one near you.' },
          { icon: Sparkles, title: 'Office hours', body: 'Weekly Zoom drop-ins with our product and engineering teams.' },
          { icon: BookOpen, title: 'Customer stories', body: 'Case studies and short videos from teams of every size.' },
        ],
      },
      {
        type: 'list',
        heading: 'Community programs',
        items: [
          'Champions — power users who help others; perks include early-access betas',
          'Beta program — try features 2–4 weeks before public release',
          'Annual user conference — Leedsphere Connect, three days every September',
          'Open-source SDKs — community contributions welcome',
          'Bug bounties — for security researchers',
        ],
      },
      {
        type: 'cta',
        heading: 'Come hang out',
        body: 'Bring questions, ideas, or just curiosity. Everyone\'s welcome.',
        button: { label: 'Get an invite', to: '/contact' },
      },
    ],
  },

  /* ============================ COMPANY (extras) ============================ */
  careers: {
    eyebrow: 'Company',
    title: 'Work at Leedsphere',
    tagline:
      'A small, distributed team building tools we\'d want to use ourselves. We hire deliberately and treat each other well.',
    sections: [
      {
        type: 'text',
        heading: 'How we work',
        paragraphs: [
          'Leedsphere is fully remote across four time zones. We default to async written communication, run a four-day deep-work week with one collaboration day, and ship something every week.',
          'We compensate at the top of the market for our location bands and offer equity, real health benefits, and a four-week sabbatical every four years.',
        ],
      },
      {
        type: 'features',
        heading: 'Open roles',
        cards: [
          { icon: Code2, title: 'Senior Backend Engineer', body: 'Node / TypeScript / MongoDB. Help us scale the real-time layer.' },
          { icon: Palette, title: 'Product Designer', body: 'Shape the next generation of the dashboard and chat experience.' },
          { icon: LifeBuoy, title: 'Customer Engineer', body: 'A hybrid role between support and DevRel — the front line of customer love.' },
          { icon: Briefcase, title: 'Operations Lead', body: 'Build the systems that scale a 30-person company to 100.' },
        ],
      },
      {
        type: 'list',
        heading: 'Benefits',
        items: [
          'Top-of-band salary with transparent banding',
          'Meaningful equity in a profitable, growing company',
          'Comprehensive health insurance — medical, dental, vision',
          'Four-week sabbatical every four years',
          '$2,500 annual learning & equipment budget',
          'Travel-anywhere policy for in-person team weeks',
          'Mental-health and family-care reimbursement',
          'Truly unlimited PTO with a four-week minimum',
        ],
      },
      {
        type: 'quote',
        quote: 'In ten years of engineering, this is the first company where I\'ve felt like the work, the pace, and the people are all aligned. We ship a lot, but no one\'s burning out.',
        attribution: 'Akiko Tanaka',
        role: 'Engineer, Leedsphere (joined 2025)',
        avatar: 'from-indigo-500 to-purple-500',
      },
      {
        type: 'cta',
        heading: 'Don\'t see your role?',
        body: 'We hire based on slope, not exact-fit job titles. Tell us what you\'d build here and we\'ll listen.',
        button: { label: 'Drop us a note', to: '/contact' },
      },
    ],
  },

  press: {
    eyebrow: 'Company',
    title: 'Press & media',
    tagline:
      'Working on a story? You\'ll find logos, screenshots, fact-sheets, and a media contact below.',
    sections: [
      {
        type: 'text',
        heading: 'About Leedsphere',
        paragraphs: [
          'Leedsphere is a workspace collaboration platform that combines team chat, projects, and documents into a single tool — designed for the way modern, distributed teams work. Founded in 2024 and headquartered in Wilmington, Delaware, we serve teams in over 40 countries.',
        ],
      },
      {
        type: 'features',
        heading: 'Quick facts',
        cards: [
          { icon: Building2, title: 'Headquarters', body: 'Wilmington, Delaware. Team distributed across four continents.' },
          { icon: Users, title: 'Team size', body: '~30 people as of April 2026.' },
          { icon: Briefcase, title: 'Founded', body: '2024 by former engineers and designers from GitHub, Notion, and Linear.' },
          { icon: Heart, title: 'Customers', body: 'Trusted by 1,000+ teams in 40+ countries.' },
        ],
      },
      {
        type: 'list',
        heading: 'Press resources',
        items: [
          'Logo pack (SVG, PNG, light + dark variants)',
          'High-resolution product screenshots',
          'Founder headshots',
          'Latest fundraising and customer announcements',
          'Statement on security incidents (if applicable)',
          'Embargo policy and press timeline templates',
        ],
      },
      {
        type: 'features',
        heading: 'Recent coverage',
        cards: [
          { icon: Newspaper, title: 'TechCrunch — Series A',         body: '"Leedsphere raises $14M to take on Slack with a workspace-first approach." February 2026.' },
          { icon: Newspaper, title: 'The Verge — product review',    body: '"This is what Notion would feel like if it had real-time chat in its DNA." January 2026.' },
          { icon: Newspaper, title: 'Hacker News — front page',      body: '"Show HN: Leedsphere — collaboration software that respects your time." December 2025.' },
          { icon: Newspaper, title: 'Wired — culture feature',       body: '"The new wave of async-first work tools that don\'t feel like work." November 2025.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Press inquiries',
        body: 'Email admin@leedsphere.com or use the contact form. We aim to reply within one business day.',
        button: { label: 'Contact press', to: '/contact' },
      },
    ],
  },

  partners: {
    eyebrow: 'Company',
    title: 'Partners',
    tagline:
      'Build with us, integrate with us, or refer customers to us — the Leedsphere partner program has a track for each.',
    sections: [
      {
        type: 'features',
        heading: 'Partner tracks',
        cards: [
          { icon: Code2, title: 'Technology partners', body: 'Build integrations, apps, and bots on the Leedsphere platform. Joint marketing once you\'re live.' },
          { icon: Handshake, title: 'Solution partners', body: 'Consultancies and agencies that implement Leedsphere for their clients. Discounts, training, and co-marketing.' },
          { icon: Megaphone, title: 'Referral partners', body: 'Refer customers and earn a commission for the lifetime of the account.' },
          { icon: GraduationCap, title: 'Education & nonprofits', body: 'Free or discounted Leedsphere for accredited schools and registered nonprofits.' },
        ],
      },
      {
        type: 'list',
        heading: 'What partners get',
        items: [
          'Featured listing in the Leedsphere directory',
          'Joint launch announcements and co-marketing budget',
          'Dedicated partner Slack channel and named partner manager',
          'Early access to APIs, betas, and product roadmap',
          'Partner-priced Leedsphere licenses for your team',
          'Quarterly business reviews and pipeline planning',
        ],
      },
      {
        type: 'features',
        heading: 'Featured partners',
        cards: [
          { icon: Code2, title: 'Linear', body: 'Two-way sync between Leedsphere channels and Linear issues. Live now.' },
          { icon: Code2, title: 'Vercel', body: 'Deploy notifications and preview links flow into your release channels.' },
          { icon: ShieldCheck, title: 'Auth0', body: 'Enterprise SSO via SAML / OIDC. Tested at scale.' },
          { icon: Handshake, title: '+30 more', body: 'Browse the full partner directory inside any workspace.' },
        ],
      },
      {
        type: 'cta',
        heading: 'Apply to partner with us',
        body: 'Tell us about your business and how you\'d like to work together. We review applications weekly.',
        button: { label: 'Apply now', to: '/contact' },
      },
    ],
  },
};

/* Aliases — short slugs the router uses, mapped to the registry keys above. */
export const SLUG_ALIASES = {
  'use-cases/product':     'use-cases-product',
  'use-cases/engineering': 'use-cases-engineering',
  'use-cases/design':      'use-cases-design',
  'use-cases/marketing':   'use-cases-marketing',
  'use-cases/support':     'use-cases-support',
  'use-cases/remote':      'use-cases-remote',
  'use-cases/startups':    'use-cases-startups',
  'use-cases/enterprises': 'use-cases-enterprises',
};
