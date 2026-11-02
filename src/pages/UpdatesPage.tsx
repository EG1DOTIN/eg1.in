import React, { useEffect, useMemo } from 'react';
import {
  Container,
  UpdatesTimeline,
  useUpdates,
  FilterTabOption,
  UpdateItem,
} from 'eg-web-core';

export interface UpdatesPageProps {
  onNavigate?: (href: string) => void;
}

export const UpdatesPage: React.FC<UpdatesPageProps> = ({ onNavigate }) => {
  // 1. Fetch platform updates from static JSON feed
  const { updates, loading, error, refresh } = useUpdates('data/updates.json');

  // 2. Synchronize exact SEO Title & Meta Description matching website_content.json
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = 'Updates - EG1 Platform Changelog & Releases';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Changelog, release history, and latest development updates for EG1 apps, tools, and website features.'
      );
    }
  }, []);

  // 3. Resolve initial filter from URL query parameter (e.g., ?filter=website, ?filter=app, ?cat=...)
  const defaultFilter = useMemo(() => {
    if (typeof window === 'undefined' || !window.location.search) return 'all';
    const params = new URLSearchParams(window.location.search);
    const f = params.get('filter') || params.get('cat') || params.get('type');
    if (f) {
      const lower = f.trim().toLowerCase();
      if (lower === 'website' || lower === 'app' || lower === 'apps') {
        return lower === 'apps' ? 'app' : lower;
      }
    }
    return 'all';
  }, []);

  // 4. Custom filter tabs matching EG1 updates specifications
  const customTabs: FilterTabOption[] = useMemo(
    () => [
      { id: 'all', label: 'All Updates', filter: () => true },
      { id: 'website', label: 'Website', filter: (u: UpdateItem) => (u.type || '').toLowerCase() === 'website' },
      { id: 'app', label: 'Apps', filter: (u: UpdateItem) => (u.type || '').toLowerCase() === 'app' },
    ],
    []
  );

  return (
    <div>
      {/* Header Banner Section matching EG1 Image Slider style */}
      <section
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.06) 100%)',
          borderBottom: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.08))',
          padding: '48px 20px',
          textAlign: 'center',
          marginBottom: '40px',
          position: 'relative',
        }}
      >
        <Container>
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            {/* Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumb"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--eg-text-muted, #94a3b8)',
                marginBottom: '16px',
                fontWeight: 600,
              }}
            >
              <a
                href="index.html"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate('index.html');
                  }
                }}
                style={{
                  color: 'var(--eg-text-secondary, #475569)',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--eg-color-primary, #10b981)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--eg-text-secondary, #475569)')}
              >
                Home
              </a>
              <span>/</span>
              <span style={{ color: 'var(--eg-color-primary, #10b981)' }}>Updates</span>
            </nav>

            <h1
              style={{
                fontSize: 'clamp(1.8rem, 1.4rem + 2vw, 2.8rem)',
                fontWeight: 800,
                color: 'var(--eg-text-primary, #0f172a)',
                margin: '0 0 12px',
                letterSpacing: '-0.5px',
                lineHeight: 1.2,
              }}
            >
              UPDATES &amp; RELEASES
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 0.95rem + 0.3vw, 1.15rem)',
                color: 'var(--eg-text-secondary, #475569)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Changelog, release history, and continuous development updates for EG1 apps, tools, and website features.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Updates Content Container */}
      <Container>
        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'var(--eg-text-muted, #94a3b8)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--eg-border-default, rgba(0, 0, 0, 0.1))',
                borderTopColor: 'var(--eg-color-primary, #10b981)',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Loading latest updates...</p>
            <style>
              {`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--eg-bg-surface, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--eg-color-crimson, #ef4444)',
              color: 'var(--eg-text-primary, #0f172a)',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <p style={{ margin: '0 0 16px', fontSize: '15px' }}>
              Unable to load updates at this time. Please check your network connection.
            </p>
            <button
              type="button"
              onClick={() => refresh()}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'var(--eg-color-primary, #10b981)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <UpdatesTimeline
            updates={updates}
            filterTabs={customTabs}
            defaultFilter={defaultFilter}
            showFilterCounts={true}
            showSearch={true}
            searchPlaceholder="Search updates by version, keyword, or feature..."
            onNavigate={onNavigate}
            seenStorageKey="eg_seen_updates"
            emptyMessage="No updates found matching your filter or search criteria."
          />
        )}
      </Container>
    </div>
  );
};
