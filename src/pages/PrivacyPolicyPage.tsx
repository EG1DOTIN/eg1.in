import React, { useEffect } from 'react';
import {
  Container,
  PageHeader,
  ConsentControl,
} from 'eg-web-core';

export interface PrivacyPolicyPageProps {
  onNavigate?: (href: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  // Update document title and metadata for SEO on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Privacy Policy - EG1';

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute(
        'content',
        'Privacy policy and data protection details for the EG1 website and applications.'
      );

      // Canonical link
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', 'https://www.eg1.in/privacypolicy.html');
    }
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('http://') || href.startsWith('https://')) return;
    if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
  };

  return (
    <Container narrow>
      <PageHeader
        title="Privacy Policy"
        subtitle="Our policies regarding the collection, use, and disclosure of personal and telemetry data."
      />

      <article
        style={{
          background: 'var(--eg-bg-surface, #ffffff)',
          border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.1))',
          borderRadius: 'var(--eg-radius-lg, 12px)',
          padding: '36px',
          boxShadow: 'var(--eg-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08))',
          lineHeight: 1.8,
          color: 'var(--eg-text-secondary, #334155)',
          marginBottom: '48px',
          textAlign: 'justify',
          textJustify: 'inter-word',
        }}
      >
        <p style={{ marginTop: 0 }}>
          EG1 (&quot;we&quot;, &quot;our&quot; or &quot;us&quot;) operates the{' '}
          <a
            href="https://eg1.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--eg-color-primary, #10b981)', textDecoration: 'underline' }}
          >
            https://eg1.in
          </a>{' '}
          website.
        </p>

        <p>
          This page informs you of our policies regarding the collection, use, and disclosure
          of personal and diagnostic data when you use our Service (EG1 website) and the choices you have
          associated with that data.
        </p>

        <p>
          We use your data to provide, secure, and improve the Service. By using the Service, you agree
          to the collection and use of information in accordance with this policy.
        </p>

        {/* 1. Information Collection And Use */}
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '32px',
            marginBottom: '12px',
          }}
        >
          Information Collection And Use
        </h2>
        <p>
          We collect several different types of information for various purposes to provide,
          protect, and optimize our Service to you.
        </p>

        {/* Types of Data Collected */}
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '24px',
            marginBottom: '8px',
          }}
        >
          Types of Data Collected
        </h3>

        <h4
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '16px',
            marginBottom: '6px',
          }}
        >
          Personal Data
        </h4>
        <p>
          While using our Service (such as when submitting our Contact Form), we may ask you to provide us
          with certain personally identifiable information that can be used to contact or identify you (&quot;Personal Data&quot;).
          Personally identifiable information may include:
        </p>
        <ul style={{ paddingLeft: '24px', margin: '8px 0 16px' }}>
          <li>Name</li>
          <li>Email address</li>
          <li>Phone / Contact number (optional)</li>
          <li>Message content</li>
        </ul>

        <h4
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '20px',
            marginBottom: '6px',
          }}
        >
          Website Analytics & Usage Data
        </h4>
        <p>
          When you access our Service, we automatically collect non-invasive telemetry and usage data (&quot;Usage Data&quot;). This includes:
        </p>
        <ul style={{ paddingLeft: '24px', margin: '8px 0 16px' }}>
          <li>
            <strong>Device & Browser Information:</strong> Operating system (e.g., Windows, macOS, Android, iOS,
            Linux, ChromeOS), browser type, browser version, preferred language, and screen resolution.
          </li>
          <li>
            <strong>Network & Approximate Location:</strong> Public Internet Protocol (IP) address, approximate
            geographic location (city, region, country, postal area), and Internet Service Provider (ISP) / Autonomous
            System (Org). We do <strong>not</strong> collect precise GPS coordinates.
          </li>
          <li>
            <strong>Browsing Activity:</strong> Pages visited within our website, landing page, referring website,
            and timestamp of the visit.
          </li>
          <li>
            <strong>Session Identifiers:</strong> Anonymous, random session tokens stored in browser{' '}
            <code>sessionStorage</code> to prevent duplicate traffic logging.
          </li>
        </ul>

        {/* 50-record Batched Bucket Pattern */}
        <h4
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '20px',
            marginBottom: '6px',
          }}
        >
          50-Record Batched Bucket Telemetry Pattern
        </h4>
        <p>
          To maintain high performance and prevent unnecessary database writes, our telemetry uses a 50-record
          Batched Bucket Pattern. Rather than creating individual database documents for each visit, telemetry
          records are aggregated into document buckets of 50 anonymous entries. This ensures minimal cloud footprint
          and protects visitor privacy through aggregate grouping.
        </p>

        {/* No Sale of Data Guarantee Callout Box */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            borderLeft: '4px solid #10b981',
            borderRadius: '8px',
            padding: '16px 20px',
            margin: '24px 0',
            color: 'var(--eg-text-primary, #0f172a)',
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ display: 'block', marginBottom: '4px', color: '#10b981' }}>
            🛡️ No Sale of Data Guarantee
          </strong>
          We strictly respect your privacy. <strong>We do NOT sell, rent, monetize, or trade visitor analytics
          or personal data with any third-party advertisers or data brokers.</strong>
        </div>

        <h4
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '20px',
            marginBottom: '6px',
          }}
        >
          Tracking & Storage Technologies
        </h4>
        <p>
          We use browser <code>sessionStorage</code> and <code>localStorage</code> to manage sessions,
          remember user preferences (such as light/dark mode and consent choices), and securely operate our Service.
          Unlike tracking cookies, our session storage does not follow you across third-party websites.
        </p>

        <h4
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '20px',
            marginBottom: '6px',
          }}
        >
          Analytics Notice & Opt-Out Choice
        </h4>
        <p>
          When you visit our website, a notice is presented informing you:{' '}
          <em>&quot;We collect anonymous telemetry to optimize tools & apps performance.&quot;</em> with prominent{' '}
          <strong>[Decline]</strong> and <strong>[OK]</strong> buttons. Clicking <strong>Decline</strong>{' '}
          immediately halts telemetry collection and stores an opt-out flag in your browser&apos;s{' '}
          <code>localStorage</code> so no tracking occurs during future visits.
        </p>

        {/* Interactive GDPR / CCPA 1-Click Opt-Out Switch Card */}
        <ConsentControl
          title="Manage Your Analytics Preferences"
          description="View your current tracking status or toggle telemetry on / off with 1 click."
        />

        {/* 2. Use of Data */}
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '32px',
            marginBottom: '12px',
          }}
        >
          Use of Data
        </h2>
        <p>EG1 uses the collected data for legitimate operational purposes:</p>
        <ul style={{ paddingLeft: '24px', margin: '8px 0 16px' }}>
          <li>To provide, operate, and maintain the Service</li>
          <li>To respond to your inquiries and support requests</li>
          <li>To monitor website traffic trends, aggregate visitor demographics, and optimize page performance</li>
          <li>To detect, prevent, and mitigate security threats, spam, bot attacks, and unauthorized access</li>
          <li>To analyze how our technical articles, software applications, and tools are utilized</li>
        </ul>

        {/* 3. Transfer Of Data */}
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '32px',
            marginBottom: '12px',
          }}
        >
          Transfer Of Data
        </h2>
        <p>
          Your information, including Personal Data, may be transferred to — and maintained
          on — computers located outside of your state, province, country or other governmental
          jurisdiction where the data protection laws may differ than those from your jurisdiction.
        </p>
        <p>
          If you are located outside India and choose to provide information to us, please
          note that we transfer the data, including Personal Data, to India and process it
          there.
        </p>
        <p>
          Your consent to this Privacy Policy followed by your submission of such information
          represents your agreement to that transfer.
        </p>
        <p>
          EG1 will take all steps reasonably necessary to ensure that your data is treated
          securely and in accordance with this Privacy Policy and no transfer of your Personal
          Data will take place to an organization or a country unless there are adequate controls
          in place including the security of your data and other personal information.
        </p>

        {/* 4. Disclosure Of Data */}
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '32px',
            marginBottom: '12px',
          }}
        >
          Disclosure Of Data
        </h2>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '16px',
            marginBottom: '8px',
          }}
        >
          Legal Requirements
        </h3>
        <p>
          EG1 may disclose your Personal Data in the good faith belief that such action is necessary to:
        </p>
        <ul style={{ paddingLeft: '24px', margin: '8px 0 16px' }}>
          <li>To comply with a legal obligation</li>
          <li>To protect and defend the rights or property of EG1</li>
          <li>To prevent or investigate possible wrongdoing in connection with the Service</li>
          <li>To protect the personal safety of users of the Service or the public</li>
          <li>To protect against legal liability</li>
        </ul>

        {/* 5. Security Of Data */}
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '32px',
            marginBottom: '12px',
          }}
        >
          Security Of Data
        </h2>
        <p>
          The security of your data is important to us, but remember that no method of transmission
          over the Internet, or method of electronic storage is 100% secure. While we strive
          to use commercially acceptable means to protect your Personal Data, we cannot guarantee
          its absolute security. All communications are served over encrypted HTTPS/TLS connections, and dynamic
          Markdown outputs undergo strict HTML and URI sanitization to block Cross-Site Scripting (XSS).
        </p>

        {/* 6. Service Providers */}
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '32px',
            marginBottom: '12px',
          }}
        >
          Service Providers
        </h2>
        <p>
          EG1 may employ third party companies and individuals to facilitate our Service (&quot;Service
          Providers&quot;), to provide the Service on our behalf, to perform Service-related services,
          or to assist us in analyzing how our Service is used.
        </p>
        <p>
          These third parties have access to your Personal Data only to perform these tasks
          on our behalf and are obligated not to disclose or use it for any other purpose.
        </p>

        {/* 7. Links To Other Sites */}
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '32px',
            marginBottom: '12px',
          }}
        >
          Links To Other Sites
        </h2>
        <p>
          Our Service may contain links to other sites that are not operated by us. If you
          click on a third party link, you will be directed to that third party&apos;s site. We
          strongly advise you to review the Privacy Policy of every site you visit.
        </p>
        <p>
          We have no control over and assume no responsibility for the content, privacy policies
          or practices of any third party sites or services.
        </p>

        {/* 8. Children's Privacy */}
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '32px',
            marginBottom: '12px',
          }}
        >
          Children&apos;s Privacy
        </h2>
        <p>Our Service does not address anyone under the age of 18 (&quot;Children&quot;).</p>
        <p>
          We do not knowingly collect personally identifiable information from anyone under
          the age of 18. If you are a parent or guardian and you are aware that your Children
          has provided us with Personal Data, please contact us. If we become aware that we
          have collected Personal Data from children without verification of parental consent,
          we take steps to remove that information from our servers.
        </p>

        {/* 9. Changes To This Privacy Policy */}
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '32px',
            marginBottom: '12px',
          }}
        >
          Changes To This Privacy Policy
        </h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes
          by posting the new Privacy Policy on this page.
        </p>
        <p>
          We will let you know via email and/or a prominent notice on our Service, prior to
          the change becoming effective and update the &quot;effective date&quot; at the top of this
          Privacy Policy.
        </p>
        <p>
          You are advised to review this Privacy Policy periodically for any changes. Changes
          to this Privacy Policy are effective when they are posted on this page.
        </p>

        {/* 10. Contact Section */}
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--eg-text-primary, #0f172a)',
            marginTop: '32px',
            marginBottom: '12px',
          }}
        >
          Contact
        </h2>
        <p style={{ marginBottom: 0 }}>
          If you have any questions about this privacy policy, please contact us via our{' '}
          <a
            href="contact.html"
            onClick={(e) => handleLinkClick(e, 'contact.html')}
            style={{
              color: 'var(--eg-color-primary, #10b981)',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            Contact Page
          </a>.
        </p>
      </article>
    </Container>
  );
};
