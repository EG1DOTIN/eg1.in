import React, { useEffect, useState } from 'react';
import {
  Container,
  PageHeader,
  ContactForm,
  DataCache,
} from 'eg-web-core';
import { EG1_FIREBASE_CONFIG } from '../config/firebase';
import './ContactPage.css';

export interface ContactPageProps {
  onNavigate?: (href: string) => void;
}

/**
 * Contact inquiries page featuring math captcha, rate limiting, and direct Firestore ingestion.
 *
 * @param props - ContactPageProps configuration
 * @returns ContactPage view component
 *
 * @example
 * ```tsx
 * <ContactPage onNavigate={navigate} />
 * ```
 */
export const ContactPage: React.FC<ContactPageProps> = () => {
  const [subtitle, setSubtitle] = useState<string>(
    'To maintain a high-quality community, please avoid posting spam or irrelevant content. Your feedback and suggestions are welcome.'
  );

  // Ingest community guidelines / copy from website_content.json
  useEffect(() => {
    let active = true;
    DataCache.getPageContent('contact').then((data) => {
      if (!active || !data) return;
      if (data.title) {
        const div = document.createElement('div');
        div.innerHTML = data.title;
        const p = div.querySelector('p')?.innerText?.trim();
        if (p) {
          setSubtitle(p);
        }
      }
    });

    if (typeof document !== 'undefined') {
      document.title = 'Contact EG1 - Feedback & Inquiries';
    }

    return () => {
      active = false;
    };
  }, []);

  return (
    <Container narrow className="eg1-contact-page">
      {/* 
        Clean, non-repetitive page header:
        - Navbar shows "CONTACT"
        - PageHeader uses meaningful "Feedback & Inquiries" (no redundant badge or repeated "Contact Us / Contact EG1")
      */}
      <PageHeader
        title="Feedback & Inquiries"
        subtitle={subtitle}
      />

      <div className="eg1-contact-page__form-container">
        <ContactForm
          title="Any message?"
          submitButtonText="Send ⮠"
          requireContactNumber={true}
          enableCaptcha={true}
          lazyCaptcha={true}
          rateLimitHours={24}
          rateLimitKey="lastMessageTime"
          firestoreCollection="messages"
          firebaseConfig={EG1_FIREBASE_CONFIG}
          appName="eg1.in"
          successTitle="Thank You for Contacting Us!"
          successMessage="Your message has been received. We will get back to you shortly."
          className="eg1-contact-page__form"
        />
      </div>
    </Container>
  );
};
