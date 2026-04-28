import MarketingNavbar from './MarketingNavbar';
import MarketingFooter from './MarketingFooter';

/**
 * Layout shell for static marketing pages (about, contact, privacy, …).
 * Renders the shared navbar, a hero band with title + tagline, the page
 * body, and the shared footer. Keeps every static page visually consistent
 * without each one re-implementing nav/footer.
 *
 * Props:
 *   eyebrow  — small uppercase label above the title
 *   title    — page heading
 *   tagline  — sub-heading paragraph
 *   children — page body
 */
const MarketingPage = ({ eyebrow, title, tagline, children }) => (
  <div className="min-h-screen bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-200/60 selection:text-indigo-900 transition-colors duration-300">
    <MarketingNavbar />

    <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute -top-1/2 left-0 w-1/2 h-full rounded-full bg-indigo-200/40 dark:bg-indigo-700/15 blur-[120px]" />
        <div className="absolute -top-1/3 right-0 w-1/2 h-full rounded-full bg-purple-200/40 dark:bg-purple-700/15 blur-[120px]" />
      </div>
      <div className="max-w-4xl mx-auto px-6 py-16 lg:py-24 text-center">
        {eyebrow && (
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">{eyebrow}</p>
        )}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white">{title}</h1>
        {tagline && (
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">{tagline}</p>
        )}
      </div>
    </section>

    {/*
      Body. We don't rely on @tailwindcss/typography (not installed); each
      Section / Card / list item carries its own Tailwind utilities so the
      body looks identical with or without the typography plugin.
      Anchor styling is set here so inline <a> in body copy looks consistent.
    */}
    <main className="max-w-4xl mx-auto px-6 py-16 lg:py-20
                     [&_a]:text-indigo-600 dark:[&_a]:text-indigo-400
                     hover:[&_a]:text-indigo-700 dark:hover:[&_a]:text-indigo-300
                     [&_a]:underline-offset-2 hover:[&_a]:underline
                     [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_strong]:font-semibold">
      <div className="space-y-12">
        {children}
      </div>
    </main>

    <MarketingFooter />
  </div>
);

/* Section primitives — used by individual marketing pages so they don't
   need to repeat the same Tailwind class soup. */

export const Section = ({ heading, children }) => (
  <section>
    {heading && (
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">{heading}</h2>
    )}
    <div className="space-y-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">{children}</div>
  </section>
);

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm dark:shadow-black/20 ${className}`}>
    {children}
  </div>
);

export default MarketingPage;
