import React from 'react';
import { Header, HeaderProps } from 'eg-web-core';
import { Eg1Logo } from './Eg1Logo';
import { EG1_NAV_LINKS, EG1_SITE_CONFIG } from '../config/siteConfig';

export interface Eg1HeaderProps extends Partial<HeaderProps> {
  currentPath?: string;
  onNavigate?: (href: string) => void;
}

/**
 * Branded Header component for eg1.in portal.
 * Injects EG1 typography, logo badge, and navigation structure into the generic Header.
 */
export const Eg1Header: React.FC<Eg1HeaderProps> = ({
  currentPath = 'index',
  onNavigate,
  ...props
}) => {
  return (
    <Header
      logoComponent={<Eg1Logo size={110} theme="auto" />}
      brandUrl="index"
      navLinks={EG1_NAV_LINKS}
      currentPath={currentPath}
      onNavigate={onNavigate}
      githubUrl={EG1_SITE_CONFIG.githubUrl}
      showForkRibbon={true}
      forkRibbonUrl={EG1_SITE_CONFIG.forkRibbonUrl}
      notificationFetchUrl="data/updates.json"
      notificationStorageKey="eg1_seen_updates"
      {...props}
    />
  );
};
