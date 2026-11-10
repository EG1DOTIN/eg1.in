import React, { useState, useEffect } from 'react';
import {
  Container,
  Section,
  ProductGrid,
  ProductItem,
  NewsItem,
  TotemTicker,
  DataCache,
  getAppSlug,
  sanitizeHtml,
  sanitizeUrl,
} from 'eg-web-core';
import { EG1_SITE_CONFIG } from '../config/siteConfig';

export interface HomePageProps {
  products: ProductItem[];
  news: NewsItem[];
  onNavigate: (href: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ products, news, onNavigate }) => {
  const [heroTitleHtml, setHeroTitleHtml] = useState<string>(
    EG1_SITE_CONFIG.heroTitle || 'EG1 - An open-source hub for innovative and creative projects'
  );
  const [announcements, setAnnouncements] = useState<NewsItem[]>([]);

  useEffect(() => {
    document.title = 'EG1 - A hobby platform for open-source and creative digital projects';
    let active = true;

    async function loadHeroAndAnnouncements() {
      let rawTitle = EG1_SITE_CONFIG.heroTitle || 'EG1 - An open-source hub for innovative and creative projects';

      try {
        // 1. Fetch template from website_content.json via DataCache (SSOT)
        const hpContent = await DataCache.getPageContent('homepage');
        if (hpContent && hpContent.title && hpContent.title.trim().length > 0) {
          rawTitle = hpContent.title.trim();
        }

        // Clean out any legacy or stale cached version markers from localStorage
        let cleanTitle = rawTitle
          .replace(/\s*<sup[^>]*>\s*(\{version\}|[vV]?\d+[\w.-]*)\s*<\/sup>/gi, '')
          .replace(/\{version\}/gi, '')
          .trim();

        if (active) {
          setHeroTitleHtml(cleanTitle);
        }
      } catch (err) {
        console.warn('[HomePage] Failed to load hero title:', err);
      }

      // Filter active announcements
      if (news && news.length > 0) {
        const activeNews = news.filter(
          (n) =>
            n.description &&
            n.description.trim().length > 0 &&
            n.description.toLowerCase() !== 'welcome to eg1'
        );
        if (active) {
          setAnnouncements(activeNews);
        }
      }
    }

    loadHeroAndAnnouncements();

    return () => {
      active = false;
    };
  }, [news]);

  const handleActionClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('http://') || href.startsWith('https://')) return;
    e.preventDefault();
    onNavigate(href);
  };

  // Top 2 latest applications in chronological order (createdAt descending)
  const featuredProducts = [...(products || [])]
    .filter((p) => p.active !== false && (p as any).active !== '0' && (p as any).active !== 0)
    .sort((a, b) => {
      const dateA = new Date((a.createdAt || a.updatedAt || 0) as string).getTime();
      const dateB = new Date((b.createdAt || b.updatedAt || 0) as string).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
        return dateB - dateA;
      }
      return String(b.id || '').localeCompare(String(a.id || ''));
    })
    .slice(0, 2);

  return (
    <div className="eg1-homepage-view">
      {/* ── 1. Hero Banner Section ────────────────────────────────────────── */}
      <section
        className="eg1-hero-banner-section"
        style={{
          background: 'linear-gradient(180deg, #18202f 0%, #0d121d 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '48px 20px 42px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle radial ambient glow behind title */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(217, 119, 6, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '980px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Dynamic Hydrated Title */}
          <h1
            className="eg1-hero-title"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(heroTitleHtml) }}
            style={{
              color: 'var(--banner-heading-color, #d97706)',
              fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)',
              fontWeight: 400,
              fontFamily: 'Georgia, "Times New Roman", Times, serif',
              fontStyle: 'italic',
              letterSpacing: '0.2px',
              margin: '0 auto 24px auto',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)',
              lineHeight: 1.45,
              textAlign: 'center',
            }}
          />

          {/* Quick Action CTAs */}
          <div
            className="eg1-hero-actions"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              margin: '0 auto',
            }}
          >
            {/* Primary CTA: Explore Projects */}
            <a
              href="apps"
              onClick={(e) => handleActionClick(e, 'apps')}
              className="eg1-hero-btn eg1-hero-btn-primary"
              title="Explore EG1 Applications & Projects"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.92rem',
                textDecoration: 'none',
                minHeight: '44px',
                cursor: 'pointer',
                backgroundColor: '#b8860b',
                color: '#ffffff',
                border: '1px solid transparent',
                boxShadow: '0 4px 14px rgba(184, 134, 11, 0.45)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(184, 134, 11, 0.65)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(184, 134, 11, 0.45)';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Explore Projects</span>
            </a>

            {/* Secondary CTA: What's New */}
            <a
              href="updates"
              onClick={(e) => handleActionClick(e, 'updates')}
              className="eg1-hero-btn eg1-hero-btn-secondary"
              title="View Latest Updates & Changelog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.92rem',
                textDecoration: 'none',
                minHeight: '44px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.24)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>What&apos;s New</span>
            </a>

            {/* Ghost CTA: Read Blogs */}
            <a
              href="blog"
              onClick={(e) => handleActionClick(e, 'blog')}
              className="eg1-hero-btn eg1-hero-btn-ghost"
              title="Read Technical Blog Tutorials"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.92rem',
                textDecoration: 'none',
                minHeight: '44px',
                cursor: 'pointer',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.92)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.92)';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Read Blogs</span>
            </a>
          </div>

          {/* Announcements Ticker if available */}
          {announcements.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <TotemTicker items={announcements} label="Announcement" intervalMs={4500} theme="dark" />
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Built for Builders & Curious Minds Block ────────────────────── */}
      <section
        id="platform-highlights"
        className="eg1-home-section"
        style={{
          padding: '48px 20px',
          borderBottom: '1px solid var(--eg-border-subtle, rgba(0, 0, 0, 0.08))',
          backgroundColor: 'var(--eg-bg-canvas, #f8fafc)',
        }}
      >
        <Container>
          {/* Centered Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: 'clamp(1.25rem, 2.5vw, 1.7rem)',
                fontWeight: 700,
                color: 'var(--eg-text-primary, #0f172a)',
                margin: '0 0 8px 0',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                lineHeight: 1.35,
              }}
            >
              <span style={{ color: '#b8860b' }}>🛡️</span>
              <span>Built for Builders &amp; Curious Minds</span>
            </h2>
            <p
              style={{
                fontSize: '0.94rem',
                color: 'var(--eg-text-muted, #64748b)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              Core principles guiding every line of code on the EG1 platform.
            </p>
          </div>

          {/* 4-Card Responsive Principles Grid */}
          <div className="eg1-principles-grid">
            {/* Card 1: Free & Open-Source */}
            <div className="eg1-principle-card">
              <div className="eg1-principle-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
              </div>
              <h3 className="eg1-principle-name">Free &amp; Open-Source</h3>
              <p className="eg1-principle-text">
                All projects, tools, and algorithms are published openly on GitHub under permissive licenses. Learn, fork, and build freely.
              </p>
            </div>

            {/* Card 2: Lightweight Vanilla Web */}
            <div className="eg1-principle-card">
              <div className="eg1-principle-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="eg1-principle-name">Lightweight Vanilla Web</h3>
              <p className="eg1-principle-text">
                Engineered with modern ES6+, HTML5, and CSS custom properties without heavyweight framework bloat or unnecessary runtimes.
              </p>
            </div>

            {/* Card 3: Privacy-First & Zero Telemetry */}
            <div className="eg1-principle-card">
              <div className="eg1-principle-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </div>
              <h3 className="eg1-principle-name">Privacy-First &amp; Zero Telemetry</h3>
              <p className="eg1-principle-text">
                No intrusive trackers, behavioral tracking, commercial ads, or tracking cookies. Your digital privacy and respect come first.
              </p>
            </div>

            {/* Card 4: Practical Real-World Utilities */}
            <div className="eg1-principle-card">
              <div className="eg1-principle-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <h3 className="eg1-principle-name">Practical Real-World Utilities</h3>
              <p className="eg1-principle-text">
                From desktop antivirus GUIs to interactive chess and low-level C tutorials—everything is built for real-world application.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 3. Featured Applications Showcase ──────────────────────────────── */}
      {featuredProducts && featuredProducts.length > 0 && (
        <Section id="featured-apps" style={{ padding: '48px 0' }}>
          <Container>
            <div
              className="eg1-featured-header"
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: '28px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: '#b8860b',
                  }}
                >
                  Applications &amp; Software
                </span>
                <h2
                  style={{
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.7rem)',
                    fontWeight: 800,
                    color: 'var(--eg-text-primary, #0f172a)',
                    margin: '6px 0 0',
                  }}
                >
                  Featured Projects
                </h2>
              </div>
              <a
                href="apps"
                onClick={(e) => handleActionClick(e, 'apps')}
                className="eg1-featured-view-all-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: '#b8860b',
                  textDecoration: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--eg-border-subtle, rgba(0, 0, 0, 0.12))',
                  background: 'var(--eg-bg-surface, #ffffff)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#b8860b';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eg-border-subtle, rgba(0, 0, 0, 0.12))';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>View All Applications</span>
                <span>&rarr;</span>
              </a>
            </div>

            <ProductGrid
              products={featuredProducts}
              onSelect={(p) => onNavigate(`apps?title=${getAppSlug(p)}`)}
            />
          </Container>
        </Section>
      )}

      {/* ── 4. Join the Open-Source Journey Community Banner ──────────────── */}
      <section
        id="community-cta"
        className="eg1-home-section"
        style={{
          padding: '28px 20px 48px',
          borderBottom: 'none',
        }}
      >
        <Container>
          <div
            className="eg1-community-banner"
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              borderRadius: '12px',
              padding: '36px 28px',
              background: 'linear-gradient(135deg, #1e2229 0%, #101217 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              color: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient radial glow */}
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle at 50% 50%, rgba(184, 134, 11, 0.14) 0%, transparent 60%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '660px', margin: '0 auto' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '12px', color: '#f59e0b' }}>
                <svg width="38" height="38" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </div>

              <h2
                style={{
                  fontSize: 'clamp(1.25rem, 2.6vw, 1.7rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: '0 0 12px 0',
                  lineHeight: 1.35,
                }}
              >
                Join the Open-Source Journey
              </h2>

              <p
                style={{
                  fontSize: 'clamp(0.95rem, 1.8vw, 1.08rem)',
                  color: '#e2e8f0',
                  lineHeight: 1.65,
                  margin: '0 auto 24px auto',
                  maxWidth: '620px',
                }}
              >
                EG1 is a transparent, open hobby ecosystem. Inspect the source code, star the repository on GitHub, report an issue, or propose a new tool.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <a
                  href={sanitizeUrl('https://github.com/EG1DOTIN/eg1.in')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="eg1-cta-btn eg1-cta-btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 26px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.94rem',
                    textDecoration: 'none',
                    minHeight: '44px',
                    cursor: 'pointer',
                    backgroundColor: '#b8860b',
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(184, 134, 11, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 22px rgba(184, 134, 11, 0.65)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(184, 134, 11, 0.4)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  <span>Star on GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Embedded Responsive Stylesheet ───────────────────────────────── */}
      <style>{`
        .eg1-hero-version {
          text-transform: none !important;
          font-size: 0.64em !important;
          font-family: Georgia, 'Times New Roman', Times, serif !important;
          font-style: normal !important;
          font-weight: 400 !important;
          vertical-align: super !important;
          color: inherit !important;
          display: inline !important;
          line-height: 0 !important;
        }

        .eg1-principles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 22px;
        }

        .eg1-principle-card {
          background-color: var(--eg-bg-surface, #ffffff);
          border: 1px solid var(--eg-border-subtle, rgba(0, 0, 0, 0.08));
          border-radius: 10px;
          padding: 28px 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          text-align: center;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .eg1-principle-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          border-color: #b8860b;
        }

        .eg1-principle-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background-color: rgba(184, 134, 11, 0.12);
          color: #b8860b;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
          border: 1px solid rgba(184, 134, 11, 0.22);
        }

        [data-theme="dark"] .eg1-principle-icon-wrap,
        [data-theme="clamui-dark"] .eg1-principle-icon-wrap,
        [data-theme="crystal"] .eg1-principle-icon-wrap {
          background-color: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border-color: rgba(245, 158, 11, 0.3);
        }

        .eg1-principle-name {
          font-size: 1.08rem;
          font-weight: 700;
          color: var(--eg-text-primary, #0f172a);
          margin: 0 0 10px 0;
          line-height: 1.4;
        }

        .eg1-principle-text {
          font-size: 0.88rem;
          color: var(--eg-text-secondary, #64748b);
          line-height: 1.6;
          margin: 0;
        }

        /* ── Mobile Responsive Overrides ───────────────────────────────── */
        @media (max-width: 768px) {
          .eg1-hero-actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .eg1-hero-btn {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .eg1-principles-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .eg1-principle-card {
            padding: 22px 18px !important;
          }
          .eg1-community-banner {
            padding: 24px 16px !important;
          }
          .eg1-cta-btn {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .eg1-featured-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .eg1-featured-view-all-btn {
            width: 100% !important;
            justify-content: center !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
};
