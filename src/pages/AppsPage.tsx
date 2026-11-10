import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  PageHeader,
  ProductGrid,
  ProductDetail,
  ProductItem,
  DataCache,
  getAppSlug,
} from 'eg-web-core';

export interface AppsPageProps {
  products: ProductItem[];
  loading?: boolean;
  currentSearch?: string;
  onNavigate?: (href: string) => void;
}

export const AppsPage: React.FC<AppsPageProps> = ({
  products,
  loading = false,
  currentSearch,
  onNavigate,
}) => {
  // Read query parameters for deep linking (?title=slug or ?id=id)
  const getSlugFromUrl = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    const searchStr = currentSearch !== undefined ? currentSearch : window.location.search;
    if (!searchStr) return null;
    const params = new URLSearchParams(searchStr);
    const title = params.get('title') || params.get('id');
    return title ? title.trim().toLowerCase().replace(/_/g, '-') : null;
  }, [currentSearch]);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(getSlugFromUrl);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  // Synchronize when currentSearch updates via SPA navigation
  useEffect(() => {
    setSelectedSlug(getSlugFromUrl());
  }, [getSlugFromUrl]);

  // Handle browser back / forward navigation
  useEffect(() => {
    const onPopState = () => {
      setSelectedSlug(getSlugFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [getSlugFromUrl]);

  // Find the selected product from passed products or from DataCache memory
  const selectedProduct = useMemo(() => {
    if (!selectedSlug) return null;
    const all = products.length > 0 ? products : DataCache.products || [];
    return (
      all.find((p) => {
        const slug = getAppSlug(p).toLowerCase();
        const cleanSlug = selectedSlug.toLowerCase();
        const normParam = cleanSlug.replace(/_/g, '-');
        return (
          slug === cleanSlug ||
          slug === normParam ||
          String(p.id).toLowerCase() === cleanSlug ||
          String(p.title || p.name || '').toLowerCase() === cleanSlug
        );
      }) || null
    );
  }, [selectedSlug, products]);

  // Synchronize document title and meta description
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (selectedProduct) {
      const appName = selectedProduct.title || selectedProduct.name || 'Application';
      document.title = `${appName} - EG1 Apps`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          selectedProduct.short_description || selectedProduct.description || `${appName} on EG1 Apps.`
        );
      }
    } else {
      document.title = 'EG1 Apps - Practical Software, Tools & Web Applications';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          'A collection of practical open-source applications, desktop software, utilities, and interactive web tools built for real-world use.'
        );
      }
    }
  }, [selectedProduct]);

  // Handle navigation to detail view
  const handleSelectProduct = useCallback(
    (product: ProductItem) => {
      const slug = getAppSlug(product);
      setSelectedSlug(slug);
      if (onNavigate) {
        onNavigate(`apps?title=${slug}`);
      } else if (typeof window !== 'undefined' && window.history.pushState) {
        window.history.pushState({}, '', `/apps?title=${slug}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [onNavigate]
  );

  // Handle return back to catalog grid
  const handleBackToCatalog = useCallback(() => {
    setSelectedSlug(null);
    if (onNavigate) {
      onNavigate('apps');
    } else if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '/apps');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onNavigate]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'All' ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      const query = search.trim().toLowerCase();
      const matchSearch =
        query === '' ||
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.slug && p.slug.toLowerCase().includes(query)) ||
        (p.product_type && p.product_type.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.short_description && p.short_description.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query));

      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, search]);

  return (
    <Container style={{ paddingTop: '24px' }}>
      {/* ── Mode 1: Deep-Linked Detail View ── */}
      {selectedSlug ? (
        loading && !selectedProduct ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              background: 'var(--eg-bg-surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.12))',
            }}
          >
            <p style={{ color: 'var(--eg-text-muted, #64748b)', margin: 0, fontSize: '15px' }}>
              Loading application details...
            </p>
          </div>
        ) : selectedProduct ? (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <button
                type="button"
                onClick={handleBackToCatalog}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--eg-color-primary, #b8860b)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <span>&larr;</span>
                <span>Back to All Applications</span>
              </button>
            </div>
            <ProductDetail
              product={selectedProduct}
              onBack={handleBackToCatalog}
              backLabel="← Back to all applications"
            />
          </div>
        ) : (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              background: 'var(--eg-bg-surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.12))',
            }}
          >
            <h2 style={{ color: 'var(--eg-text-primary, #0f172a)', margin: '0 0 12px' }}>
              Application Not Found
            </h2>
            <p style={{ color: 'var(--eg-text-muted, #64748b)', margin: '0 0 24px' }}>
              The application requested (<code>{selectedSlug}</code>) could not be located in our catalog.
            </p>
            <button
              type="button"
              onClick={handleBackToCatalog}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: 'var(--eg-color-primary, #b8860b)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Return to Catalog
            </button>
          </div>
        )
      ) : (
        /* ── Mode 2: Catalog Grid View ── */
        <div>
          <PageHeader
            title="Software Applications"
            subtitle="A collection of practical open-source software, desktop suites, utilities, and interactive web tools built for real-world use."
            badge="Catalog"
          />

          {/* Filter and Search Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '32px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--eg-border-subtle, rgba(0, 0, 0, 0.08))',
            }}
          >
            {/* Category Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      border: active
                        ? '1px solid var(--eg-color-primary, #b8860b)'
                        : '1px solid var(--eg-border-subtle, rgba(0,0,0,0.12))',
                      background: active
                        ? 'var(--eg-color-primary, #b8860b)'
                        : 'var(--eg-bg-surface, #ffffff)',
                      color: active ? '#ffffff' : 'var(--eg-text-primary, #0f172a)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applications..."
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.15))',
                  background: 'var(--eg-bg-surface, #ffffff)',
                  color: 'var(--eg-text-primary, #0f172a)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Product Grid or Empty State */}
          {loading && products.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 0',
                color: 'var(--eg-text-muted, #94a3b8)',
              }}
            >
              <p style={{ fontSize: '15px' }}>Loading application catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 0',
                color: 'var(--eg-text-muted, #94a3b8)',
              }}
            >
              <p style={{ fontSize: '16px' }}>No applications found matching your criteria.</p>
            </div>
          ) : (
            <ProductGrid
              products={filteredProducts}
              onSelect={handleSelectProduct}
            />
          )}
        </div>
      )}
    </Container>
  );
};
