import React from 'react';
import { Footer, FooterProps } from 'eg-web-core';
import { Eg1Logo } from './Eg1Logo';
import { EG1_SITE_CONFIG, EG1_SOCIAL_LINKS } from '../config/siteConfig';
import './Eg1Footer.css';

export interface Eg1FooterProps extends Partial<FooterProps> {
  onNavigate?: (href: string) => void;
}

/**
 * Branded Footer component for eg1.in portal.
 * Injects EG1 branding, about text, social channels, and copyright attribution into the generic Footer.
 *
 * @param props - Eg1FooterProps configuration
 * @returns Fully styled footer with EG1 brand identity
 *
 * @example
 * ```tsx
 * <Eg1Footer onNavigate={(path) => navigate(path)} />
 * ```
 */
export const Eg1Footer: React.FC<Eg1FooterProps> = ({ onNavigate, ...props }) => {
  return (
    <Footer
      logoComponent={<Eg1Logo size={110} theme="dark" />}
      brandTitle={EG1_SITE_CONFIG.brandTitle}
      aboutText={EG1_SITE_CONFIG.aboutText}
      developedByText={EG1_SITE_CONFIG.developedByText}
      developedByUrl={EG1_SITE_CONFIG.developedByUrl}
      privacyPolicyUrl={EG1_SITE_CONFIG.privacyPolicyUrl}
      contactUrl={EG1_SITE_CONFIG.contactUrl}
      socialLinks={EG1_SOCIAL_LINKS}
      socialAlignment="center"
      contactAlignment="center"
      onNavigate={onNavigate}
      {...props}
    />
  );
};
