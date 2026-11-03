import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  PageHeader,
  BlogList,
  BlogPostView,
  BlogSidebar,
  BlogPostItem,
  useBlogs,
} from 'eg-web-core';

export interface BlogPageProps {
  onNavigate?: (href: string) => void;
}

export const BlogPage: React.FC<BlogPageProps> = () => {
  const { blogs, loading } = useBlogs('data/blog-index.json', 'data/blog/');

  const [selectedPost, setSelectedPost] = useState<BlogPostItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync state from URL query parameters (id, slug, cat, search, page)
  const syncFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const reqId = params.get('id') || params.get('title') || params.get('slug');
    const reqCat = params.get('cat');
    const reqSearch = params.get('search');
    const reqPage = params.get('page');

    setSelectedCategory(reqCat ? reqCat.trim() : null);
    setSearchQuery(reqSearch ? reqSearch.trim() : '');

    if (reqPage) {
      const p = parseInt(reqPage, 10);
      if (!isNaN(p) && p > 0) setCurrentPage(p);
    } else {
      setCurrentPage(1);
    }

    if (reqId && blogs.length > 0) {
      const clean = reqId.trim().replace(/^id/i, '');
      const found = blogs.find(
        (p) =>
          p.id === clean ||
          p.id === reqId ||
          p.slug === reqId ||
          p.slug === `post-${clean}` ||
          (p.title && p.title.toLowerCase() === reqId.toLowerCase())
      );
      if (found) {
        setSelectedPost(found);
      }
    } else if (!reqId) {
      setSelectedPost(null);
    }
  }, [blogs]);

  useEffect(() => {
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [syncFromUrl]);

  // Helper to push URL query updates
  const updateUrl = (updates: {
    id?: string | null;
    cat?: string | null;
    search?: string | null;
    page?: number | null;
  }) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    if (updates.id !== undefined) {
      if (updates.id) {
        params.set('id', updates.id);
      } else {
        params.delete('id');
        params.delete('slug');
        params.delete('title');
      }
    }

    if (updates.cat !== undefined) {
      if (updates.cat) {
        params.set('cat', updates.cat);
      } else {
        params.delete('cat');
      }
    }

    if (updates.search !== undefined) {
      if (updates.search) {
        params.set('search', updates.search);
      } else {
        params.delete('search');
      }
    }

    if (updates.page !== undefined) {
      if (updates.page && updates.page > 1) {
        params.set('page', updates.page.toString());
      } else {
        params.delete('page');
      }
    }

    const query = params.toString();
    const newUrl = query ? `/blog?${query}` : '/blog';
    window.history.pushState({}, '', newUrl);
  };

  // Synchronize SEO Title & Meta Description
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (selectedPost) {
      document.title = `${selectedPost.title} - EG1 Blog`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          selectedPost.short_description || selectedPost.description || selectedPost.title
        );
      }
    } else {
      document.title = 'EG1 Blog - Technical Articles, Tutorials & Code';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          'Technical articles, tutorials, source code, algorithms, and practical programming write-ups across various topics.'
        );
      }
    }
  }, [selectedPost]);

  // Compute Categories with Article Counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    blogs.forEach((b) => {
      const cat = b.category || (b.tags && b.tags.length > 0 ? b.tags[0] : 'General');
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [blogs]);

  // Recent Posts Widget (5 latest articles)
  const recentPosts = useMemo(() => {
    return blogs.slice(0, 5);
  }, [blogs]);

  // Filtered Posts according to selected category and live search
  const filteredPosts = useMemo(() => {
    let result = blogs;

    if (selectedCategory) {
      const sel = selectedCategory.toLowerCase();
      result = result.filter((p) => {
        const cat = (p.category || '').toLowerCase();
        if (cat === sel) return true;
        if (Array.isArray(p.tags)) {
          return p.tags.some((t) => t.toLowerCase() === sel || t.toLowerCase().includes(sel));
        }
        return false;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const descMatch = (p.short_description || p.description || '').toLowerCase().includes(q);
        const tagMatch = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q));
        const catMatch = (p.category || '').toLowerCase().includes(q);
        const contentMatch = (p.content || '').toLowerCase().includes(q);
        return titleMatch || descMatch || tagMatch || catMatch || contentMatch;
      });
    }

    return result;
  }, [blogs, selectedCategory, searchQuery]);

  const handleSelectPost = (post: BlogPostItem) => {
    setSelectedPost(post);
    updateUrl({ id: post.id });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToBlog = () => {
    setSelectedPost(null);
    updateUrl({ id: null });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategorySelect = (cat: string | null) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    // If viewing single post, return to catalog view
    if (selectedPost) {
      setSelectedPost(null);
      updateUrl({ id: null, cat, page: 1 });
    } else {
      updateUrl({ cat, page: 1 });
    }
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
    // If viewing single post, return to catalog view
    if (selectedPost) {
      setSelectedPost(null);
      updateUrl({ id: null, search: q || null, page: 1 });
    } else {
      updateUrl({ search: q || null, page: 1 });
    }
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    updateUrl({ page: p });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading && blogs.length === 0) {
    return (
      <Container style={{ paddingTop: '28px' }}>
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--eg-text-muted, #94a3b8)' }}>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>Loading technical engineering articles...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <style>{`
        .eg-blog-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 32px;
          align-items: start;
        }
        .eg-blog-layout.has-selected-post {
          margin-top: 28px;
        }
        .eg-blog-main-col {
          min-width: 0;
          max-width: 100%;
        }
        .eg-blog-sidebar-col {
          min-width: 0;
          max-width: 100%;
        }
        @media (max-width: 900px) {
          .eg-blog-layout {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }
        @media (max-width: 600px) {
          .eg-blog-layout {
            gap: 20px;
          }
        }
      `}</style>

      {!selectedPost && (
        <PageHeader
          title="Technical Articles & Tutorials"
          subtitle="Tutorials, deep-dives, systems programming, and web development write-ups."
          badge="Engineering"
        />
      )}

      <div
        className={`eg-blog-layout ${selectedPost ? 'has-selected-post' : ''}`}
        style={{
          marginTop: selectedPost ? '28px' : '0',
        }}
      >
        {/* Main Column */}
        <div className="eg-blog-main-col">
          {selectedPost ? (
            <BlogPostView post={selectedPost} onBack={handleBackToBlog} />
          ) : (
            <div>
              {/* Active Filter Indicators */}
              {(selectedCategory || searchQuery.trim()) && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '24px',
                    padding: '12px 18px',
                    background: 'var(--eg-bg-surface, #ffffff)',
                    border: '1px solid var(--eg-border-default, rgba(0, 0, 0, 0.1))',
                    borderRadius: '8px',
                    boxShadow: 'var(--eg-shadow-sm, 0 1px 3px rgba(0,0,0,0.04))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedCategory && (
                      <span style={{ fontSize: '13.5px', color: 'var(--eg-text-primary, #0f172a)' }}>
                        Category: <strong>{selectedCategory}</strong>
                      </span>
                    )}
                    {selectedCategory && searchQuery.trim() && <span>•</span>}
                    {searchQuery.trim() && (
                      <span style={{ fontSize: '13.5px', color: 'var(--eg-text-primary, #0f172a)' }}>
                        Search: <strong>"{searchQuery}"</strong>
                      </span>
                    )}
                    <span style={{ fontSize: '12.5px', color: 'var(--eg-text-muted, #94a3b8)' }}>
                      ({filteredPosts.length} article{filteredPosts.length === 1 ? '' : 's'})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearchQuery('');
                      setCurrentPage(1);
                      updateUrl({ cat: null, search: null, page: 1 });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--eg-color-primary, #b8860b)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Clear filters &times;
                  </button>
                </div>
              )}

              <BlogList
                posts={filteredPosts}
                pageSize={6}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onSelectPost={handleSelectPost}
              />
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="eg-blog-sidebar-col">
          <BlogSidebar
            categories={categoriesWithCounts}
            recentPosts={recentPosts}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onCategorySelect={handleCategorySelect}
            onPostSelect={handleSelectPost}
          />
        </div>
      </div>
    </Container>
  );
};
