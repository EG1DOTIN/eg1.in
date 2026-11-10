import React, { useEffect } from 'react';
import {
  Container,
  usePageContent,
  Badge,
  sanitizeHtml,
  sanitizeUrl,
} from 'eg-web-core';
import './AboutPage.css';

export interface AboutPageProps {
  onNavigate: (href: string) => void;
}

/**
 * About page presenting platform philosophy, tech stack, and creator background.
 *
 * @param props - AboutPageProps configuration
 * @returns AboutPage view component
 *
 * @example
 * ```tsx
 * <AboutPage onNavigate={navigate} />
 * ```
 */
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
    <div className="eg1-about-page">
      {/* ── 1. Hero Title Banner Section ──────────────────────────────────── */}
      <section className="eg1-about-page__hero">
        <Container narrow>
          <span className="eg1-about-page__mission-pill">
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

      {/* ── 2. Showcase Media Banner ────────────────────────────────────── */}
      <section style={{ padding: '16px 16px 36px' }}>
        <Container narrow>
          <div className="eg1-about-page__media-card">
            <img
              src="assets/img/eg1-social-preview.webp"
              alt="EG1 - Innovating, building useful digital projects"
              width="1200"
              height="630"
              loading="lazy"
              decoding="async"
              className="eg1-about-page__media-img"
            />
          </div>
        </Container>
      </section>

      {/* ── 3. Narrative Article Content ────────────────────────────────── */}
      <section style={{ padding: '0 16px 40px' }}>
        <Container narrow>
          <article className="eg1-about-page__article">
            <h2 className="eg1-about-page__article-heading">
              <span style={{ color: 'var(--eg-color-primary, #b8860b)' }}>💡</span>
              <span>Practical Tools &amp; Open Experimentation</span>
            </h2>

            <div
              className="eg1-about-body-text"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(rawContent) }}
            />

            {/* Core Architectural Badges */}
            <div className="eg1-about-page__principles">
              <h3 className="eg1-about-page__principles-title">
                Core Ecosystem Principles
              </h3>
              <div className="eg1-about-page__badges-row">
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
          <div className="eg1-about-page__pillars-grid">
            {/* Pillar 1 */}
            <div className="eg1-about-page__pillar-card">
              <div className="eg1-about-page__pillar-icon">📖</div>
              <h3 className="eg1-about-page__pillar-title">
                Open Architecture
              </h3>
              <p className="eg1-about-page__pillar-desc">
                All source code for web applications, algorithms, desktop GUIs, and libraries is public on GitHub for educational inspection and contributions.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="eg1-about-page__pillar-card">
              <div className="eg1-about-page__pillar-icon">🛡️</div>
              <h3 className="eg1-about-page__pillar-title">
                Zero Commercial Telemetry
              </h3>
              <p className="eg1-about-page__pillar-desc">
                No behavioral profiling, invasive surveillance, or commercial third-party trackers. Anonymous metrics respect user consent with zero write-quota abuse.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="eg1-about-page__pillar-card">
              <div className="eg1-about-page__pillar-icon">⚙️</div>
              <h3 className="eg1-about-page__pillar-title">
                Lightweight Vanilla Delivery
              </h3>
              <p className="eg1-about-page__pillar-desc">
                Engineered with clean HTML5, CSS tokens, and ES6+ standards for instant loading, high frame rates, and longevity across viewports.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 5. Action Hub CTA Buttons ───────────────────────────────────── */}
      <section style={{ textAlign: 'center', marginTop: '10px' }}>
        <Container narrow>
          <div className="eg1-about-page__actions">
            <button
              type="button"
              onClick={() => onNavigate('apps')}
              className="eg1-about-page__btn-primary"
            >
              Explore Applications &rarr;
            </button>

            <button
              type="button"
              onClick={() => onNavigate('blog')}
              className="eg1-about-page__btn-secondary"
            >
              Read Technical Blog
            </button>

            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="eg1-about-page__btn-subtle"
            >
              Get In Touch
            </button>

            <a
              href={sanitizeUrl('https://github.com/EG1DOTIN/eg1.in')}
              target="_blank"
              rel="noopener noreferrer"
              className="eg1-about-page__btn-ghost"
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
