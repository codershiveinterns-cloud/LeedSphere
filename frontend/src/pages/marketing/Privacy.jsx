import MarketingPage, { Section } from '../../components/marketing/MarketingPage';

const LAST_UPDATED = 'April 27, 2026';

/**
 * Plain-English privacy policy. NOT legal advice — replace with text reviewed
 * by counsel before you ship to production. The structure (what we collect,
 * how we use it, retention, your rights, contact) follows GDPR / CCPA norms.
 */
const Privacy = () => (
  <MarketingPage
    eyebrow="Legal"
    title="Privacy Policy"
    tagline={`Last updated: ${LAST_UPDATED}. Plain English where we can manage it; precise terms where we can't.`}
  >
    <Section heading="1. Overview">
      <p>
        Leedsphere ("we", "us") provides a workspace for teams to chat, share files, and manage
        projects. This policy explains what data we collect when you use Leedsphere, how we use
        it, who we share it with, and the choices you have. By using the service you agree to the
        practices described here.
      </p>
    </Section>

    <Section heading="2. What we collect">
      <p><strong>Account information.</strong> When you sign up we collect your name, email
      address, and authentication identifiers (e.g. Firebase UID). If you sign in with a third-party
      provider, we receive the basic profile fields that provider exposes.</p>
      <p><strong>Workspace content.</strong> Messages, files, projects, tasks, and channel
      memberships you create or upload. This content is stored to deliver the service to you and
      your teammates.</p>
      <p><strong>Usage data.</strong> Information about how you interact with Leedsphere —
      features used, pages viewed, approximate location derived from IP, device and browser type.
      We use this for analytics, debugging, and abuse prevention.</p>
      <p><strong>Cookies and similar technologies.</strong> See our <a href="/cookies">Cookie
      Policy</a> for details.</p>
    </Section>

    <Section heading="3. How we use your data">
      <ul className="list-disc pl-6 space-y-2">
        <li>To operate, maintain, and improve the service.</li>
        <li>To authenticate you and keep your account secure.</li>
        <li>To send transactional email (account changes, security alerts, billing).</li>
        <li>To respond to support requests and feedback.</li>
        <li>To detect, prevent, and respond to fraud, abuse, or technical issues.</li>
        <li>To comply with legal obligations.</li>
      </ul>
      <p>We do not sell your personal data, and we do not use your workspace content to train
      machine learning models.</p>
    </Section>

    <Section heading="4. How we share data">
      <p>We share data only in the limited circumstances below:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Within your workspace:</strong> messages, files, and presence are visible to
          other members of the same workspace and channels you participate in.</li>
        <li><strong>Service providers:</strong> infrastructure, analytics, and email delivery
          partners (e.g. MongoDB Atlas, Firebase, Vercel) that process data on our behalf under
          contractual confidentiality obligations.</li>
        <li><strong>Legal:</strong> if required by law, a court order, or to protect rights and
          safety.</li>
        <li><strong>Business transfers:</strong> in the event of a merger, acquisition, or asset
          sale, with notice to you before any transfer takes effect.</li>
      </ul>
    </Section>

    <Section heading="5. Data retention">
      <p>We retain your account and workspace content for as long as your account is active.
      After you delete your account, we remove or anonymize personal data within 30 days, except
      where retention is required for legal, tax, or security reasons.</p>
    </Section>

    <Section heading="6. Your rights">
      <p>Depending on where you live, you may have rights to:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your data.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Receive a portable copy of your data.</li>
      </ul>
      <p>To exercise any of these, email <a href="mailto:privacy@leedsphere.app">privacy@leedsphere.app</a>.
      We&apos;ll respond within 30 days.</p>
    </Section>

    <Section heading="7. Security">
      <p>We use industry-standard safeguards: TLS for data in transit, encryption at rest for
      sensitive fields, role-based access controls, and regular security reviews. No system is
      perfectly secure — if you believe your account has been compromised, contact
      <a href="mailto:security@leedsphere.app"> security@leedsphere.app</a> immediately.</p>
    </Section>

    <Section heading="8. International transfers">
      <p>Leedsphere operates globally. By using the service you consent to your information being
      transferred to, processed in, and stored in countries other than the one in which you live,
      including the United States. Where required, we use Standard Contractual Clauses or
      equivalent mechanisms.</p>
    </Section>

    <Section heading="9. Children">
      <p>Leedsphere is not directed at children under 13 (or 16 in the EU). We do not knowingly
      collect personal data from children. If you believe a child has provided us with data, please
      contact us so we can remove it.</p>
    </Section>

    <Section heading="10. Changes to this policy">
      <p>We may update this policy from time to time. Material changes will be communicated via
      email or in-app notice at least 14 days before they take effect.</p>
    </Section>

    <Section heading="11. Contact">
      <p>Questions or concerns? Email <a href="mailto:privacy@leedsphere.app">privacy@leedsphere.app</a>
      &nbsp;or use our <a href="/contact">contact form</a>.</p>
    </Section>
  </MarketingPage>
);

export default Privacy;
