import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import MarketingPage, { Section, Card } from '../../components/marketing/MarketingPage';
import { PAGES } from './content';

/**
 * Renders a marketing page from the content registry. Drives every footer
 * link under Product / Teams / Resources / extra Company pages.
 *
 * Usage:
 *   <Route path="/overview" element={<ContentPage slug="overview" />} />
 *
 * If the slug isn't in the registry we redirect home rather than showing a
 * blank — same defensive default as the wildcard route in App.jsx.
 */
const ContentPage = ({ slug }) => {
  const data = PAGES[slug];
  if (!data) return <Navigate to="/" replace />;

  return (
    <MarketingPage eyebrow={data.eyebrow} title={data.title} tagline={data.tagline}>
      {(data.sections || []).map((section, i) => (
        <SectionRenderer key={i} section={section} />
      ))}
    </MarketingPage>
  );
};

/**
 * Single dispatcher that picks the right block based on `section.type`.
 * Kept verbose on purpose — easier to read at a glance than a generic.
 */
const SectionRenderer = ({ section }) => {
  switch (section.type) {
    case 'text':
      return (
        <Section heading={section.heading}>
          {(section.paragraphs || []).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Section>
      );

    case 'features':
      return (
        <Section heading={section.heading}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 not-prose">
            {(section.cards || []).map(({ icon: Icon, title, body }) => (
              <Card key={title}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  {Icon ? <Icon size={18} /> : null}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </Card>
            ))}
          </div>
        </Section>
      );

    case 'list':
      return (
        <Section heading={section.heading}>
          <ul className="not-prose space-y-2.5">
            {(section.items || []).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-600">
                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      );

    case 'steps':
      return (
        <Section heading={section.heading}>
          <ol className="not-prose space-y-4">
            {(section.items || []).map((step, i) => (
              <li key={i} className="flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      );

    case 'faq':
      return (
        <Section heading={section.heading}>
          <div className="not-prose space-y-3">
            {(section.items || []).map((item, i) => (
              <details key={i} className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 transition-colors">
                <summary className="cursor-pointer list-none p-5 flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-900">{item.q}</span>
                  <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-5 -mt-1 text-sm text-slate-600 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </Section>
      );

    case 'cta':
      return (
        <section className="not-prose">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/20">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{section.heading}</h2>
            {section.body && <p className="mt-3 text-indigo-100 max-w-2xl">{section.body}</p>}
            {section.button && (
              <Link
                to={section.button.to}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 bg-white hover:bg-indigo-50 shadow-lg transition-all active:scale-[0.98]"
              >
                {section.button.label} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </section>
      );

    case 'quote':
      return (
        <section className="not-prose">
          <figure className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 sm:p-10">
            <blockquote className="text-xl sm:text-2xl font-semibold text-slate-900 leading-snug">
              &ldquo;{section.quote}&rdquo;
            </blockquote>
            {section.attribution && (
              <figcaption className="mt-5 flex items-center gap-3 text-sm">
                {section.avatar && (
                  <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${section.avatar} text-white font-bold flex items-center justify-center shrink-0`}>
                    {section.attribution.charAt(0).toUpperCase()}
                  </span>
                )}
                <span>
                  <span className="font-semibold text-slate-900">{section.attribution}</span>
                  {section.role && <span className="text-slate-500">, {section.role}</span>}
                </span>
              </figcaption>
            )}
          </figure>
        </section>
      );

    case 'stats':
      return (
        <Section heading={section.heading}>
          <div className={`grid not-prose ${section.items?.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
            {(section.items || []).map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-700">{stat.label}</div>
                {stat.body && <div className="mt-2 text-xs text-slate-500 leading-relaxed">{stat.body}</div>}
              </div>
            ))}
          </div>
        </Section>
      );

    default:
      return null;
  }
};

export default ContentPage;
