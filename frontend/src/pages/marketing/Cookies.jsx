import MarketingPage, { Section } from '../../components/marketing/MarketingPage';

const LAST_UPDATED = 'April 27, 2026';

const COOKIE_TABLE = [
  {
    name: 'Strictly necessary',
    examples: 'Session token, CSRF token, load-balancer routing',
    purpose: 'Required to authenticate you and keep the Service secure. Cannot be disabled.',
    duration: 'Session or up to 1 year',
  },
  {
    name: 'Preferences',
    examples: 'Theme (light/dark), active workspace, last-used team',
    purpose: 'Remembers UI choices so you don&apos;t reconfigure on every visit.',
    duration: 'Up to 1 year',
  },
  {
    name: 'Analytics',
    examples: 'Anonymized page-view counters, feature-usage metrics',
    purpose: 'Helps us understand which parts of the product are used so we can improve them.',
    duration: 'Up to 13 months',
  },
];

/**
 * Cookie policy. Explains what's set, why, and how to opt out. Pairs with
 * the Privacy Policy at /privacy.
 */
const Cookies = () => (
  <MarketingPage
    eyebrow="Legal"
    title="Cookie Policy"
    tagline={`Last updated: ${LAST_UPDATED}. What we store on your device, why, and how to control it.`}
  >
    <Section heading="What are cookies?">
      <p>
        Cookies are small text files placed on your device when you visit a website. Similar
        technologies — local storage, IndexedDB, session storage — work the same way. We use the
        word "cookies" loosely to refer to all of them.
      </p>
    </Section>

    <Section heading="How we use cookies">
      <p>We group the cookies we set into three categories:</p>
      <div className="not-prose overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Examples</th>
              <th className="px-4 py-3 font-semibold">Purpose</th>
              <th className="px-4 py-3 font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {COOKIE_TABLE.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                <td className="px-4 py-3 text-slate-600">{row.examples}</td>
                <td className="px-4 py-3 text-slate-600" dangerouslySetInnerHTML={{ __html: row.purpose }} />
                <td className="px-4 py-3 text-slate-600">{row.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>

    <Section heading="Third parties">
      <p>
        We use a small number of trusted vendors that may set their own cookies on your device,
        including:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Firebase Authentication</strong> — for sign-in session handling.</li>
        <li><strong>Plausible / similar privacy-friendly analytics</strong> — for aggregated usage
          metrics. No personal data is sent to third parties for advertising.</li>
      </ul>
      <p>
        We do not use advertising or cross-site tracking cookies, and we do not sell data to
        third-party advertisers.
      </p>
    </Section>

    <Section heading="Managing your preferences">
      <p>
        You can control cookies through your browser settings — most browsers let you block all
        cookies, accept only first-party cookies, or delete existing ones. Note that blocking
        strictly-necessary cookies will prevent you from signing in.
      </p>
      <p>
        If you&apos;re in a region that requires consent for non-essential cookies (e.g. the EU/UK
        under GDPR), you&apos;ll see a banner the first time you visit Leedsphere offering an
        Accept / Reject choice. You can revisit your choice anytime from the cookie banner&apos;s
        "Manage preferences" link.
      </p>
    </Section>

    <Section heading="Updates">
      <p>
        We&apos;ll update this page if our cookie practices change. Material changes are
        communicated through the same banner.
      </p>
    </Section>

    <Section heading="Questions">
      <p>
        Email <a href="mailto:privacy@leedsphere.app">privacy@leedsphere.app</a> or use our
        <a href="/contact"> contact form</a>. Our full <a href="/privacy">Privacy Policy</a> covers
        what we do with the data these cookies collect.
      </p>
    </Section>
  </MarketingPage>
);

export default Cookies;
