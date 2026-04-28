import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronDown, Menu, X, Home as HomeIcon, Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';

/**
 * Sticky marketing top-nav. Used on the landing page and on every static
 * content page (about, pricing, docs, etc.).
 *
 * Structure:
 *   Logo · Home · Product▾ · Teams▾ · Resources▾ · Company▾ · [Login] [Get Started]
 *
 * Desktop: hover-open dropdowns; active page highlighted.
 * Mobile: hamburger toggles a full-screen sheet with collapsible groups.
 *
 * Hash links (Features, How it works, Preview, Roles) are kept as
 * `/#features` — the leading slash means React Router will navigate to /
 * first if you're on another page, then the browser scrolls to the anchor.
 * This is the only way they work consistently from sub-pages.
 */

const MENU = [
  {
    label: 'Product',
    items: [
      { label: 'Overview',          to: '/overview' },
      { label: 'Features',          to: '/#features' },
      { label: 'Team Channels',     to: '/channels' },
      { label: 'Messaging',         to: '/messaging' },
      { label: 'File Sharing',      to: '/file-sharing' },
      { label: 'Workspace Search',  to: '/search' },
      { label: 'Security',          to: '/security' },
      { label: 'Roadmap',           to: '/roadmap' },
      { label: 'Changelog',         to: '/changelog' },
    ],
  },
  {
    label: 'Teams',
    items: [
      { label: 'Product Teams',     to: '/use-cases/product' },
      { label: 'Engineering',       to: '/use-cases/engineering' },
      { label: 'Design Teams',      to: '/use-cases/design' },
      { label: 'Marketing',         to: '/use-cases/marketing' },
      { label: 'Customer Support',  to: '/use-cases/support' },
      { label: 'Remote Teams',      to: '/use-cases/remote' },
      { label: 'Startups',          to: '/use-cases/startups' },
      { label: 'Enterprises',       to: '/use-cases/enterprises' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Help Center',       to: '/help' },
      { label: 'Getting Started',   to: '/getting-started' },
      { label: 'Documentation',     to: '/docs' },
      { label: 'Guides',            to: '/guides' },
      { label: 'Tutorials',         to: '/tutorials' },
      { label: 'Blog',              to: '/blog' },
      { label: 'Community',         to: '/community' },
    ],
  },
  {
    label: 'Company',
    items: [
      { label: 'About Us',          to: '/about' },
      { label: 'Careers',           to: '/careers' },
      { label: 'Contact',           to: '/contact' },
      { label: 'Press',             to: '/press' },
      { label: 'Partners',          to: '/partners' },
    ],
  },
];

const MarketingNavbar = () => {
  const [openIdx, setOpenIdx] = useState(null);   // desktop dropdown
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close dropdowns when the route changes — otherwise a click that
  // navigates to a sub-page would leave the menu hovering.
  useEffect(() => {
    setOpenIdx(null);
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/30">
            L
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Leedsphere</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400">
          <HomeLink />
          {MENU.map((group, i) => (
            <DropdownNavItem
              key={group.label}
              group={group}
              isOpen={openIdx === i}
              onOpen={() => setOpenIdx(i)}
              onClose={() => setOpenIdx((cur) => (cur === i ? null : cur))}
              currentPath={location.pathname}
            />
          ))}
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <Link
            to="/login"
            className="hidden sm:inline-flex text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-2"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="hidden sm:inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            Get Started <ArrowRight size={14} />
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileOpen && <MobileSheet onClose={() => setMobileOpen(false)} />}
    </header>
  );
};

/* ---------- Theme toggle ---------- */

/**
 * Sun / Moon toggle in the top-right of the nav.
 * Cross-fades + rotates the icons so the swap feels smooth (0.3s ease).
 * State + localStorage persistence live in useThemeStore.
 */
const ThemeToggle = () => {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors duration-300 active:scale-90"
    >
      <Sun
        size={17}
        className={`absolute transition-all duration-300 ${
          isDark ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
        }`}
      />
      <Moon
        size={17}
        className={`absolute transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
        }`}
      />
    </button>
  );
};

/* ---------- Home (always-visible) ---------- */

const HomeLink = () => (
  <NavLink
    to="/"
    end
    className={({ isActive }) =>
      `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'text-slate-900 bg-slate-100 dark:text-white dark:bg-slate-800'
          : 'hover:text-slate-900 hover:bg-slate-50 dark:hover:text-white dark:hover:bg-slate-800/60'
      }`
    }
  >
    <HomeIcon size={14} /> Home
  </NavLink>
);

/* ---------- Desktop dropdown trigger ---------- */

const DropdownNavItem = ({ group, isOpen, onOpen, onClose, currentPath }) => {
  const ref = useRef(null);

  // Close on outside click (covers focus-out + click-elsewhere).
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('focusin', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('focusin', handler);
    };
  }, [isOpen, onClose]);

  // Group is "active" if the current page is one of its items.
  const isGroupActive = group.items.some(
    (item) => !item.to.includes('#') && currentPath === item.to
  );

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? onClose() : onOpen())}
        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
          isGroupActive
            ? 'text-slate-900 bg-slate-100 dark:text-white dark:bg-slate-800'
            : 'hover:text-slate-900 hover:bg-slate-50 dark:hover:text-white dark:hover:bg-slate-800/60'
        }`}
      >
        {group.label}
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full pt-2 min-w-[260px] z-50"
        >
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden">
            <div className="py-2">
              {group.items.map((item) => (
                <DropdownLink key={item.label} item={item} currentPath={currentPath} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DropdownLink = ({ item, currentPath }) => {
  const baseCls =
    'block px-4 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400';

  // Hash links — render as anchor so the leading-slash form ("/#features")
  // bounces home and scrolls. Using <Link> would treat the # as part of the
  // route and never trigger the scroll.
  if (item.to.includes('#')) {
    return (
      <a href={item.to} className={`${baseCls} text-slate-700 dark:text-slate-300`}>
        {item.label}
      </a>
    );
  }

  const isActive = currentPath === item.to;
  return (
    <Link
      to={item.to}
      className={`${baseCls} ${
        isActive
          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/10 font-semibold'
          : 'text-slate-700 dark:text-slate-300'
      }`}
    >
      {item.label}
    </Link>
  );
};

/* ---------- Mobile sheet ---------- */

const MobileSheet = ({ onClose }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="px-6 py-5 space-y-1">
        <MobileLink to="/" exact onClose={onClose}>
          <HomeIcon size={15} className="mr-2 inline" />
          Home
        </MobileLink>

        {MENU.map((group) => (
          <MobileGroup key={group.label} group={group} onClose={onClose} />
        ))}

        <div className="h-px bg-slate-200 dark:bg-slate-800 my-3" />

        <MobileLink to="/login" onClose={onClose}>
          Login
        </MobileLink>

        <Link
          to="/signup"
          onClick={onClose}
          className="mt-2 block w-full text-center px-5 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
        >
          Get Started
        </Link>

        {/* Hash anchors only useful on home; surfaced as a quick row when there */}
        {isHome && (
          <div className="pt-4">
            <p className="px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold mb-2">
              Jump to
            </p>
            <div className="flex flex-wrap gap-2 px-1">
              {[
                { label: 'Features',     href: '#features' },
                { label: 'How it works', href: '#how-it-works' },
                { label: 'Preview',      href: '#preview' },
                { label: 'Roles',        href: '#roles' },
              ].map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                >
                  {a.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MobileGroup = ({ group, onClose }) => {
  const location = useLocation();
  const isExpanded = group.items.some(
    (i) => !i.to.includes('#') && location.pathname === i.to
  );
  const [open, setOpen] = useState(isExpanded);

  return (
    <div className="rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
      >
        {group.label}
        <ChevronDown size={15} className={`text-slate-400 dark:text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ml-2 pl-3 border-l border-slate-200 dark:border-slate-700 space-y-0.5 py-1">
          {group.items.map((item) =>
            item.to.includes('#') ? (
              <a
                key={item.label}
                href={item.to}
                onClick={onClose}
                className="block px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <MobileLink key={item.label} to={item.to} onClose={onClose} subtle>
                {item.label}
              </MobileLink>
            )
          )}
        </div>
      )}
    </div>
  );
};

const MobileLink = ({ to, exact, onClose, subtle, children }) => (
  <NavLink
    to={to}
    end={exact}
    onClick={onClose}
    className={({ isActive }) =>
      `block px-3 py-${subtle ? '1.5' : '2.5'} rounded-lg transition-colors ${
        subtle ? 'text-sm' : 'text-sm font-semibold'
      } ${
        isActive
          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/10'
          : subtle
            ? 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            : 'text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
      }`
    }
  >
    {children}
  </NavLink>
);

export default MarketingNavbar;
