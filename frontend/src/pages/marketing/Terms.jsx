import MarketingPage, { Section } from '../../components/marketing/MarketingPage';

const LAST_UPDATED = 'April 27, 2026';

/**
 * Standard SaaS terms of service. NOT legal advice — replace with a version
 * reviewed by counsel before production. Structured to mirror common
 * frameworks (acceptance, account, content ownership, prohibited use,
 * termination, warranties, liability, governing law).
 */
const Terms = () => (
  <MarketingPage
    eyebrow="Legal"
    title="Terms of Service"
    tagline={`Last updated: ${LAST_UPDATED}. By accessing or using Leedsphere, you agree to these terms.`}
  >
    <Section heading="1. Agreement">
      <p>These Terms of Service ("Terms") form a binding agreement between you and Leedsphere,
      Inc. ("Leedsphere", "we", "us") governing your access to and use of the Leedsphere website,
      applications, and APIs (the "Service"). If you do not agree to these Terms, do not use the
      Service.</p>
    </Section>

    <Section heading="2. Accounts">
      <p>You must be at least 13 years old (16 in the EU) to use the Service. You agree to
      provide accurate information when creating an account, to keep your credentials confidential,
      and to be responsible for all activity under your account. Notify us promptly of any
      unauthorized use.</p>
    </Section>

    <Section heading="3. Acceptable use">
      <p>You agree not to:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Violate any law or third-party rights, including intellectual property rights.</li>
        <li>Upload malware, harmful code, or content that is unlawful, abusive, or infringing.</li>
        <li>Use the Service to send unsolicited messages, spam, or phishing.</li>
        <li>Attempt to access systems or data you are not authorized to access.</li>
        <li>Reverse-engineer, scrape, or otherwise interfere with the Service&apos;s normal
          operation.</li>
        <li>Use the Service in a way that materially degrades performance for other customers.</li>
      </ul>
      <p>We may suspend or terminate access for violations.</p>
    </Section>

    <Section heading="4. Your content">
      <p>You retain all rights to the content you upload, post, or otherwise make available
      through the Service ("Customer Content"). You grant Leedsphere a worldwide, non-exclusive,
      royalty-free license to host, store, transmit, and display Customer Content solely as
      necessary to provide and improve the Service.</p>
      <p>You are solely responsible for Customer Content and represent that you have the rights
      necessary to upload it.</p>
    </Section>

    <Section heading="5. Our content & trademarks">
      <p>The Service, including all software, design, text, graphics, and trademarks (excluding
      Customer Content), is owned by Leedsphere or its licensors. We grant you a limited,
      non-transferable license to use the Service in accordance with these Terms.</p>
    </Section>

    <Section heading="6. Subscription, fees & billing">
      <p>Some features of the Service are offered on a paid subscription basis. Fees, billing
      cycles, and payment terms are presented at signup or in your account settings. Unless stated
      otherwise: subscriptions auto-renew at the end of each billing cycle, fees are
      non-refundable except where required by law, and we may change pricing with 30 days&apos;
      notice.</p>
    </Section>

    <Section heading="7. Termination">
      <p>You may cancel your subscription at any time from your account settings. We may suspend
      or terminate your access for material breach of these Terms, with reasonable notice where
      practical. On termination, your right to use the Service ends, and you may export Customer
      Content for a limited period before deletion.</p>
    </Section>

    <Section heading="8. Disclaimer of warranties">
      <p>To the maximum extent permitted by law, the Service is provided "as is" and "as
      available", without warranties of any kind, express or implied, including merchantability,
      fitness for a particular purpose, and non-infringement. We do not warrant that the Service
      will be uninterrupted, error-free, or secure.</p>
    </Section>

    <Section heading="9. Limitation of liability">
      <p>To the maximum extent permitted by law, Leedsphere shall not be liable for any indirect,
      incidental, special, consequential, or punitive damages, or for any loss of profits or
      revenues, whether incurred directly or indirectly. Our total liability under these Terms
      shall not exceed the greater of (a) USD 100, or (b) the fees you paid us in the 12 months
      preceding the event giving rise to the claim.</p>
    </Section>

    <Section heading="10. Indemnification">
      <p>You agree to defend, indemnify, and hold Leedsphere harmless from any claims, damages,
      and expenses arising from (a) your use of the Service, (b) Customer Content, or (c) your
      breach of these Terms.</p>
    </Section>

    <Section heading="11. Changes to the service or terms">
      <p>We may modify the Service or these Terms at any time. Material changes to the Terms will
      be communicated by email or in-app notice at least 14 days before they take effect. Continued
      use after the effective date constitutes acceptance.</p>
    </Section>

    <Section heading="12. Governing law">
      <p>These Terms are governed by the laws of the State of Delaware, USA, without regard to
      conflict-of-laws principles. Any dispute will be resolved in the state or federal courts
      located in Delaware, except where applicable consumer-protection laws give you the right to
      sue in your local jurisdiction.</p>
    </Section>

    <Section heading="13. Contact">
      <p>Questions about these Terms? Email <a href="mailto:legal@leedsphere.app">legal@leedsphere.app</a>
      &nbsp;or use our <a href="/contact">contact form</a>.</p>
    </Section>
  </MarketingPage>
);

export default Terms;
