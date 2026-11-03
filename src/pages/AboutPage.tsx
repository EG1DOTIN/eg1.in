import React, { useEffect } from 'react';
import {
  Container,
  usePageContent,
  Badge,
  sanitizeHtml,
  sanitizeUrl,
} from 'eg-web-core';

export interface AboutPageProps {
  onNavigate: (href: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { content: aboutData } = usePageContent('about');

  // Synchronize SEO Title & Meta Description matching website_content.json
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = 'About EG1 - Open Source Software & Creative Projects';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'About EG1, a hobby platform for creating, experimenting, and sharing helpful open-source digital projects, practical tools, and tutorials.'
      );
    }
  }, []);

  const rawTitle = aboutData?.title || `
    <h1>ABOUT EG1</h1>
    <p style="font-size: 20px; text-align: center;">
      A hobby platform for open-source and creative digital projects,<br />
      featuring practical apps/tools, interactive web applications <br />
      and technical articles.
    </p>
  `;

  const rawContent = aboutData?.content || `
    <p style="font-size: 1.18rem; line-height: 1.8; text-align: justify; text-justify: inter-word; color: var(--eg-text-primary, #0f172a); max-width: 840px; margin: 0 auto 20px auto;">
      This website is a hobby playground for creating, experimenting and sharing helpful, open-source digital projects built for real-world use.
    </p>
    <p style="font-size: 1.18rem; line-height: 1.8; text-align: justify; text-justify: inter-word; color: var(--eg-text-primary, #0f172a); max-width: 840px; margin: 0 auto;">
      It features two main sections: an Apps section, showcasing custom webapps, and software/tools made for practical application; and a Blog section, featuring technical articles, tutorials, and engineering write-ups. Driven by an open-source approach, everything here is built with simplicity, functionality, and open access for curious minds who love building and tinkering from the ground up.
    </p>
  `;

  return (
    <div className="eg1-about-page" style={{ paddingBottom: '60px' }}>
      {/* ── 1. Hero Title Banner Section ──────────────────────────────────── */}
      <section
        style={{
          padding: '40px 16px 20px',
          textAlign: 'center',
        }}
      >
        <Container narrow>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              background: 'rgba(184, 134, 11, 0.12)',
              color: 'var(--eg-color-primary, #b8860b)',
              marginBottom: '14px',
            }}
          >
            Mission &amp; Philosophy
          </span>

          <div
            className="eg1-about-hero-title"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(rawTitle) }}
            style={{
              color: 'var(--eg-text-primary, #0f172a)',
            }}
          />
        </Container>
      </section>

      {/* Scoped styling to ensure raw HTML from website_content.json renders with proper theme colors */}
      <style>{`
        .eg1-about-hero-title h1 {
          font-size: clamp(1.75rem, 3.5vw, 2.4rem);
          font-weight: 800;
          color: var(--eg-text-primary, #0f172a);
          margin: 0 0 12px;
          letter-spacing: -0.5px;
        }
        .eg1-about-hero-title p {
          font-size: clamp(1.05rem, 2vw, 1.25rem);
          color: var(--eg-text-secondary, #475569);
          line-height: 1.6;
          margin: 0 auto;
          max-width: 680px;
        }
        .eg1-about-body-text p {
          font-size: 1.15rem;
          line-height: 1.85;
          text-align: justify;
          text-justify: inter-word;
          color: var(--eg-text-primary, #0f172a);
          margin-bottom: 20px;
        }
        .eg1-about-body-text p:last-child {
          margin-bottom: 0;
        }
        @media (max-width: 640px) {
          .eg1-about-body-text p {
            text-align: left;
            font-size: 1.05rem;
            line-height: 1.7;
          }
        }
      `}</style>

      {/* ── 2. Showcase Media Banner ────────────────────────────────────── */}
      <section style={{ padding: '16px 16px 36px' }}>
        <Container narrow>
          <div
            style={{
              position: 'relative',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
              border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.12))',
              background: 'var(--eg-bg-surface, #ffffff)',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 18px 48px rgba(0, 0, 0, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.18)';
            }}
          >
            <img
              src="assets/img/eg1-social-preview.webp"
              alt="EG1 - Innovating, building useful digital projects"
              width="1200"
              height="630"
              loading="lazy"
              decoding="async"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'cover',
              }}
            />
          </div>
        </Container>
      </section>

      {/* ── 3. Narrative Article Content ────────────────────────────────── */}
      <section style={{ padding: '0 16px 40px' }}>
        <Container narrow>
          <article
            style={{
              background: 'var(--eg-bg-surface, #ffffff)',
              border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.1))',
              borderRadius: 'var(--eg-radius-lg, 14px)',
              padding: 'clamp(24px, 4vw, 44px)',
              boxShadow: 'var(--eg-shadow-sm, 0 1px 4px rgba(0, 0, 0, 0.06))',
              boxSizing: 'border-box',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.35rem, 2.5vw, 1.7rem)',
                fontWeight: 700,
                color: 'var(--eg-text-primary, #0f172a)',
                marginTop: 0,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ color: 'var(--eg-color-primary, #b8860b)' }}>💡</span>
              <span>Practical Tools &amp; Open Experimentation</span>
            </h2>

            <div
              className="eg1-about-body-text"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(rawContent) }}
            />

            {/* Core Architectural Badges */}
            <div
              style={{
                marginTop: '36px',
                paddingTop: '24px',
                borderTop: '1px solid var(--eg-border-subtle, rgba(0, 0, 0, 0.08))',
              }}
            >
              <h3
                style={{
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.9px',
                  color: 'var(--eg-text-muted, #64748b)',
                  margin: '0 0 14px 0',
                  fontWeight: 700,
                }}
              >
                Core Ecosystem Principles
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <Badge variant="primary">100% Free &amp; Open Source</Badge>
                <Badge variant="neutral">Zero Ad Trackers</Badge>
                <Badge variant="neutral">Privacy-First (GDPR Respect)</Badge>
                <Badge variant="neutral">Vanilla Web + EG-Web-Core Library</Badge>
                <Badge variant="neutral">Permissive MIT / GPL Licensing</Badge>
              </div>
            </div>
          </article>
        </Container>
      </section>

      {/* ── 4. Mission Pillars & Open-Source Commitment ─────────────────── */}
      <section style={{ padding: '0 16px 40px' }}>
        <Container narrow>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
              gap: '20px',
            }}
          >
            {/* Pillar 1 */}
            <div
              style={{
                background: 'var(--eg-bg-surface, #ffffff)',
                border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.1))',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--eg-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>📖</div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--eg-text-primary, #0f172a)',
                  margin: '0 0 8px',
                }}
              >
                Open Architecture
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: 'var(--eg-text-secondary, #475569)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                All source code for web applications, algorithms, desktop GUIs, and libraries is public on GitHub for educational inspection and contributions.
              </p>
            </div>

            {/* Pillar 2 */}
            <div
              style={{
                background: 'var(--eg-bg-surface, #ffffff)',
                border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.1))',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--eg-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>🛡️</div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--eg-text-primary, #0f172a)',
                  margin: '0 0 8px',
                }}
              >
                Zero Commercial Telemetry
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: 'var(--eg-text-secondary, #475569)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                No behavioral profiling, invasive surveillance, or commercial third-party trackers. Anonymous metrics respect user consent with zero write-quota abuse.
              </p>
            </div>

            {/* Pillar 3 */}
            <div
              style={{
                background: 'var(--eg-bg-surface, #ffffff)',
                border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.1))',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--eg-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚙️</div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--eg-text-primary, #0f172a)',
                  margin: '0 0 8px',
                }}
              >
                Lightweight Vanilla Delivery
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: 'var(--eg-text-secondary, #475569)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Engineered with clean HTML5, CSS tokens, and ES6+ standards for instant loading, high frame rates, and longevity across viewports.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 5. Action Hub CTA Buttons ───────────────────────────────────── */}
      <section style={{ textAlign: 'center', marginTop: '10px' }}>
        <Container narrow>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => onNavigate('apps')}
              style={{
                padding: '11px 24px',
                borderRadius: '8px',
                background: 'var(--eg-color-primary, #b8860b)',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(184, 134, 11, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              Explore Applications &rarr;
            </button>

            <button
              type="button"
              onClick={() => onNavigate('blog')}
              style={{
                padding: '11px 22px',
                borderRadius: '8px',
                background: 'var(--eg-bg-surface, #ffffff)',
                color: 'var(--eg-text-primary, #0f172a)',
                border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.15))',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Read Technical Blog
            </button>

            <button
              type="button"
              onClick={() => onNavigate('contact')}
              style={{
                padding: '11px 20px',
                borderRadius: '8px',
                background: 'var(--eg-bg-subtle, rgba(0, 0, 0, 0.04))',
                color: 'var(--eg-text-primary, #0f172a)',
                border: '1px solid var(--eg-border-subtle, rgba(0, 0, 0, 0.1))',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Get In Touch
            </button>

            <a
              href={sanitizeUrl('https://github.com/EG1DOTIN/eg1.in')}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '11px 20px',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--eg-text-secondary, #475569)',
                border: '1px solid var(--eg-border-subtle, rgba(0, 0, 0, 0.12))',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </Container>
      </section>
    </div>
  );
};
