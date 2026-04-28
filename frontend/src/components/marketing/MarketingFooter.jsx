import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

/* ---------- inline brand marks ---------- */
const TwitterMark = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);
const LinkedinMark = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z" />
  </svg>
);
const GithubMark = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.52-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.17.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.74.11 3.03.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

/**
 * Premium SaaS footer — 4 columns, both light and dark modes, hover-shifts,
 * social row, dynamic year. Every link routes to a real, content-filled
 * page (see App.jsx routes + pages/marketing/content.js).
 *
 * Light mode: bg #f9fafb, slate-on-light text.
 * Dark mode:  bg #0f172a, slate-on-dark text.
 */
const FOOTER_COLS = [
  {
    title: 'Product',
    links: [
      { label: 'Overview',     to: '/overview' },
      { label: 'Features',     to: '/#features' },
      { label: 'Messaging',    to: '/messaging' },
      { label: 'File Sharing', to: '/file-sharing' },
      { label: 'Security',     to: '/security' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Engineering',      to: '/use-cases/engineering' },
      { label: 'Design',           to: '/use-cases/design' },
      { label: 'Marketing',        to: '/use-cases/marketing' },
      { label: 'Customer Support', to: '/use-cases/support' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center',   to: '/help' },
      { label: 'Documentation', to: '/docs' },
      { label: 'Tutorials',     to: '/tutorials' },
      { label: 'Blog',          to: '/blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us',         to: '/about' },
      { label: 'Careers',          to: '/careers' },
      { label: 'Contact',          to: '/contact' },
      { label: 'Privacy Policy',   to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
];

const FooterLink = ({ to, children }) => {
  // text-2 in light, text-2 in dark — same neutral as the rest of the page.
  const cls =
    'inline-block text-sm text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white hover:translate-x-0.5 transition-all';
  if (to.startsWith('#') || to.includes('/#')) return <a href={to} className={cls}>{children}</a>;
  return <Link to={to} className={cls}>{children}</Link>;
};

const MarketingFooter = () => {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-[#f9fafb] dark:bg-[#0f172a] text-[#6b7280] dark:text-[#9ca3af] border-t border-[#e5e7eb] dark:border-[#334155] transition-colors duration-300 overflow-hidden">
      {/* Soft accent on the very top edge */}
      <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-indigo-300/60 dark:via-indigo-500/40 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20">
        {/* Brand block + 4 link columns */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand — spans wide on desktop */}
          <div className="col-span-2 lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">L</div>
              <span className="font-bold text-xl tracking-tight text-[#111827] dark:text-[#e5e7eb]">Leedsphere</span>
            </Link>
            <p className="mt-5 text-sm leading-relaxed max-w-sm text-[#6b7280] dark:text-[#9ca3af]">
              Bring your team&apos;s conversations, files, and tools into one shared workspace.
              Work together, stay aligned, and move faster.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="text-sm font-semibold tracking-wide mb-4 text-[#111827] dark:text-[#e5e7eb]">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterLink to={l.to}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-14 lg:mt-16 border-t border-[#e5e7eb] dark:border-[#334155]" />

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500 dark:text-slate-500">
            &copy; {year} Leedsphere. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            <SocialIcon href="https://twitter.com" label="Twitter">
              <TwitterMark width={15} height={15} />
            </SocialIcon>
            <SocialIcon href="https://linkedin.com" label="LinkedIn">
              <LinkedinMark width={15} height={15} />
            </SocialIcon>
            <SocialIcon href="https://github.com" label="GitHub">
              <GithubMark width={15} height={15} />
            </SocialIcon>
          </div>
        </div>
      </div>

      {/* Back-to-top floating button */}
      <button
        onClick={scrollTop}
        aria-label="Back to top"
        className="group absolute right-6 bottom-24 sm:bottom-20 w-11 h-11 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-indigo-400/60 dark:hover:border-indigo-500/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center"
      >
        <ArrowUp size={16} className="group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </footer>
  );
};

const SocialIcon = ({ href, label, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer noopener"
    aria-label={label}
    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-white dark:hover:bg-slate-800 hover:scale-110 hover:shadow-md hover:shadow-indigo-500/20 flex items-center justify-center transition-all"
  >
    {children}
  </a>
);

export default MarketingFooter;
