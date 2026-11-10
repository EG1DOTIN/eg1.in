import React, { useState, useEffect, useCallback } from 'react';
import {
  ConsentBanner,
  SmartScrollButton,
  useProducts,
  useNews,
  useVisitorTracker,
  DataCache,
} from 'eg-web-core';
import { EG1_FIREBASE_CONFIG } from './config/firebase';

// Register site-specific application catalog slugs and blog post IDs for Markdown fallback lookups
DataCache.registerAppSlugs(['marwadi-chess', 'pyegclamui', 'eg-web-core']);
DataCache.registerBlogIds([
  '6', '7', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46',
  '47', '48', '49', '50', '51', '53', '54', '55', '56', '57', '58', '59', '60',
  '61', '62', '63', '64', '67', '68', '69', '70'
]);

import { HomePage } from './pages/HomePage';
const AppsPage = React.lazy(() => import('./pages/AppsPage').then((m) => ({ default: m.AppsPage })));
const AboutPage = React.lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const BlogPage = React.lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const UpdatesPage = React.lazy(() => import('./pages/UpdatesPage').then((m) => ({ default: m.UpdatesPage })));
const ContactPage = React.lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
import { Eg1Header } from './components/Eg1Header';
import { Eg1Footer } from './components/Eg1Footer';

const normalizePath = (path: string): string => {
  const clean = path.replace(/^\/+/, '').split('?')[0].split('#')[0];
  if (!clean || clean === 'index.html' || clean === 'index') return 'index';
  const lower = clean.toLowerCase().replace(/\.html$/, '');
  if (
    lower === 'admin' ||
    lower.startsWith('admin/') ||
    lower === 'adminpanel' ||
    lower.startsWith('adminpanel/')
  ) {
    return 'admin';
  }
  if (lower === 'privacy-policy' || lower === 'privacypolicy') {
    return 'privacypolicy';
  }
  return lower;
};

// Stable options for markdown apps catalog ingestion
const PRODUCTS_OPTIONS = { mdDir: '/data/apps/' };

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return 'index';
    return normalizePath(window.location.pathname);
  });
  const [currentSearch, setCurrentSearch] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.location.search;
  });

  const { products, loading } = useProducts(PRODUCTS_OPTIONS);
  const { news } = useNews('data/website_content.json');

  // Activate anonymous non-invasive telemetry
  useVisitorTracker({
    appName: 'eg1.in',
    firebaseConfig: EG1_FIREBASE_CONFIG,
    firestoreCollection: 'visitor_analytics',
    onLogReady: (log) => {
      console.log('[Telemetry Session]', log.id, log.city, log.country, log.os);
    },
  });

  const handleNavigate = useCallback((href: string) => {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    const norm = normalizePath(href);
    const queryPart = href.includes('?') ? `?${href.split('?')[1]}` : '';
    setCurrentPath(norm);
    setCurrentSearch(queryPart);
    if (typeof window !== 'undefined' && window.history.pushState) {
      const targetPath = norm === 'index' ? '/' : `/${norm}`;
      window.history.pushState({}, '', `${targetPath}${queryPart}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
      setCurrentSearch(window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const renderCurrentPage = () => {
    switch (currentPath) {
      case 'apps':
      case 'apps.html':
        return (
          <AppsPage
            products={products}
            loading={loading}
            currentSearch={currentSearch}
            onNavigate={handleNavigate}
          />
        );
      case 'about':
      case 'about.html':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'blog':
      case 'blog.html':
        return <BlogPage onNavigate={handleNavigate} />;
      case 'updates':
      case 'updates.html':
        return <UpdatesPage onNavigate={handleNavigate} />;
      case 'contact':
      case 'contact.html':
        return <ContactPage onNavigate={handleNavigate} />;
      case 'privacypolicy':
      case 'privacy-policy':
      case 'privacypolicy.html':
      case 'privacy-policy.html':
        return <PrivacyPolicyPage onNavigate={handleNavigate} />;
      case 'admin':
      case 'admin.html':
        return <AdminPage onNavigate={handleNavigate} />;
      case 'index':
      case 'index.html':
      default:
        return (
          <HomePage
            products={products}
            news={news}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  if (currentPath === 'admin' || currentPath === 'admin.html') {
    return (
      <React.Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
        <AdminPage onNavigate={handleNavigate} />
      </React.Suspense>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Universal EG1 Header */}
      <Eg1Header
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />

      {/* Main Body Content */}
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        <React.Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
          {renderCurrentPage()}
        </React.Suspense>
      </main>

      {/* Floating GDPR Consent Banner */}
      <ConsentBanner privacyPolicyUrl="privacypolicy" />

      {/* Floating Bidirectional Smart Scroll Assistant */}
      <SmartScrollButton variant="primary" />

      {/* Universal EG1 Footer */}
      <Eg1Footer onNavigate={handleNavigate} />
    </div>
  );
};
