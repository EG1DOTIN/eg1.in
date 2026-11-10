import React, { useEffect, useMemo } from 'react';
import {
  Container,
  UpdatesTimeline,
  useUpdates,
  FilterTabOption,
  UpdateItem,
} from 'eg-web-core';
import './UpdatesPage.css';

export interface UpdatesPageProps {
  onNavigate?: (href: string) => void;
}

/**
 * Updates timeline and release notes page reading from updates.json.
 *
 * @param props - UpdatesPageProps configuration
 * @returns UpdatesPage view component
 *
 * @example
 * ```tsx
 * <UpdatesPage onNavigate={navigate} />
 * ```
 */
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
    <div className="eg1-updates-page">
      {/* Header Banner Section matching EG1 Image Slider style */}
      <section className="eg1-updates-page__hero">
        <Container>
          <div className="eg1-updates-page__hero-content">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="eg1-updates-page__breadcrumb">
              <a
                href="index"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate('index');
                  }
                }}
                className="eg1-updates-page__breadcrumb-link"
              >
                Home
              </a>
              <span>/</span>
              <span className="eg1-updates-page__breadcrumb-current">Updates</span>
            </nav>

            <h1 className="eg1-updates-page__title">
              UPDATES &amp; RELEASES
            </h1>

            <p className="eg1-updates-page__subtitle">
              Changelog, release history, and continuous development updates for EG1 apps, tools, and website features.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Updates Content Container */}
      <Container>
        {loading && (
          <div className="eg1-updates-page__loading">
            <div className="eg1-updates-page__spinner" />
            <p className="eg1-updates-page__loading-text">Loading latest updates...</p>
          </div>
        )}

        {error && (
          <div className="eg1-updates-page__error">
            <p className="eg1-updates-page__error-text">
              Unable to load updates at this time. Please check your network connection.
            </p>
            <button
              type="button"
              onClick={() => refresh()}
              className="eg1-updates-page__retry-btn"
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
