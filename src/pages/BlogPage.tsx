import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  PageHeader,
  BlogList,
  BlogPostView,
  BlogSidebar,
  BlogPostItem,
  useBlogs,
  getBlogSlug,
} from 'eg-web-core';
import './BlogPage.css';

export interface BlogPageProps {
  onNavigate?: (href: string) => void;
}

/**
 * Blog index and article reading view with categories, search, and Markdown rendering.
 *
 * @param props - BlogPageProps configuration
 * @returns BlogPage view component
 *
 * @example
 * ```tsx
 * <BlogPage onNavigate={navigate} />
 * ```
 */
export const BlogPage: React.FC<BlogPageProps> = () => {
  const { blogs, loading } = useBlogs('data/blog-index.json', 'data/blog/');

  const [selectedPost, setSelectedPost] = useState<BlogPostItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync state from URL query parameters (title, id, slug, cat, search, page)
  const syncFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const reqTitle = params.get('title') || params.get('id?title');
    const reqId = params.get('id') || params.get('slug');
    const rawQuery = (reqTitle || reqId || '').trim();
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

    if (rawQuery && blogs.length > 0) {
      const cleanId = rawQuery.replace(/^id/i, '');
      const querySlug = rawQuery.toLowerCase().replace(/[\s_]+/g, '-');
      const found = blogs.find((p) => {
        const pSlug = getBlogSlug(p).toLowerCase();
        const pTitleSlug = (p.title || '')
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/[\s_]+/g, '-');
        const pTitleLower = (p.title || '').toLowerCase();
        const pHeadingLower = (p.heading || '').toLowerCase();
        const rawLower = rawQuery.toLowerCase();

        return (
          p.id === cleanId ||
          p.id === rawQuery ||
          p.slug === rawQuery ||
          pSlug === querySlug ||
          pTitleSlug === querySlug ||
          pTitleLower === rawLower ||
          pHeadingLower === rawLower
        );
      });
      if (found) {
        setSelectedPost(found);
      }
    } else if (!rawQuery) {
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
    title?: string | null;
    id?: string | null;
    cat?: string | null;
    search?: string | null;
    page?: number | null;
  }) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    if (updates.title !== undefined) {
      if (updates.title) {
        params.set('title', updates.title);
        params.delete('id');
        params.delete('slug');
      } else {
        params.delete('title');
        params.delete('id');
        params.delete('slug');
      }
    } else if (updates.id !== undefined) {
      if (updates.id) {
        params.set('title', updates.id);
        params.delete('id');
        params.delete('slug');
      } else {
        params.delete('title');
        params.delete('id');
        params.delete('slug');
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

    const isHtml = window.location.pathname.endsWith('.html');
    const basePath = isHtml ? '/blog.html' : '/blog';
    const query = params.toString();
    const newUrl = query ? `${basePath}?${query}` : basePath;
    window.history.pushState({}, '', newUrl);
  };

  // Synchronize SEO Title, Open Graph & Twitter Card Meta Tags
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const isProp = selector.includes('property=');
        const match = selector.match(/["'](.*?)["']/);
        if (match) {
          el.setAttribute(isProp ? 'property' : 'name', match[1]);
          document.head.appendChild(el);
        }
      }
      el.setAttribute(attr, value);
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.eg1.in';
    const isHtml = typeof window !== 'undefined' && window.location.pathname.endsWith('.html');

    if (selectedPost) {
      const pageTitle = `${selectedPost.title} - EG1 Blog`;
      const desc =
        selectedPost.short_description ||
        selectedPost.description ||
        `Learn about ${selectedPost.title} on EG1 Blog.`;
      const postSlug = getBlogSlug(selectedPost);
      const canonicalUrl = `${origin}${isHtml ? '/blog.html' : '/blog'}?title=${postSlug}`;

      // Construct absolute image URL for crawler thumbnail rendering
      const rawImg =
        selectedPost.output_image ||
        selectedPost.imageUrl ||
        `assets/img/blog/id${selectedPost.id}.webp`;
      const absImgUrl =
        rawImg.startsWith('http://') || rawImg.startsWith('https://')
          ? rawImg
          : `${origin}/${rawImg.replace(/^\//, '')}`;

      document.title = pageTitle;
      setMeta('meta[name="title"]', 'content', pageTitle);
      setMeta('meta[name="description"]', 'content', desc);

      // Open Graph / Facebook / WhatsApp / LinkedIn
      setMeta('meta[property="og:title"]', 'content', selectedPost.title);
      setMeta('meta[property="og:description"]', 'content', desc);
      setMeta('meta[property="og:url"]', 'content', canonicalUrl);
      setMeta('meta[property="og:image"]', 'content', absImgUrl);
      setMeta('meta[property="og:type"]', 'content', 'article');

      // Twitter / X
      setMeta('meta[name="twitter:title"]', 'content', selectedPost.title);
      setMeta('meta[name="twitter:description"]', 'content', desc);
      setMeta('meta[name="twitter:image"]', 'content', absImgUrl);
      setMeta('meta[name="twitter:url"]', 'content', canonicalUrl);

      // Canonical link tag
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', canonicalUrl);
      }
    } else {
      const defaultTitle = 'EG1 Blog - Technical Articles, Tutorials & Code';
      const defaultDesc =
        'Technical articles, tutorials, source code, algorithms, and practical programming write-ups across various topics.';
      const defaultUrl = `${origin}${isHtml ? '/blog.html' : '/blog'}`;
      const defaultImg = `${origin}/assets/img/eg1-social-preview.webp`;

      document.title = defaultTitle;
      setMeta('meta[name="title"]', 'content', defaultTitle);
      setMeta('meta[name="description"]', 'content', defaultDesc);

      setMeta('meta[property="og:title"]', 'content', 'EG1 - Technical Blog & Tutorials');
      setMeta('meta[property="og:description"]', 'content', defaultDesc);
      setMeta('meta[property="og:url"]', 'content', defaultUrl);
      setMeta('meta[property="og:image"]', 'content', defaultImg);
      setMeta('meta[property="og:type"]', 'content', 'website');

      setMeta('meta[name="twitter:title"]', 'content', 'EG1 - Technical Blog & Tutorials');
      setMeta('meta[name="twitter:description"]', 'content', defaultDesc);
      setMeta('meta[name="twitter:image"]', 'content', defaultImg);
      setMeta('meta[name="twitter:url"]', 'content', defaultUrl);

      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', defaultUrl);
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
    const postSlug = getBlogSlug(post);
    updateUrl({ title: postSlug });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToBlog = () => {
    setSelectedPost(null);
    updateUrl({ title: null });
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
      updateUrl({ title: null, cat, page: 1 });
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
      updateUrl({ title: null, search: q || null, page: 1 });
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
      <Container className="eg1-blog-page__loading-wrapper">
        <div className="eg1-blog-page__loading-text">
          <p style={{ fontSize: '16px', fontWeight: 600 }}>Loading technical engineering articles...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
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
            <BlogPostView
              post={selectedPost}
              onBack={handleBackToBlog}
              shareUrl={`${typeof window !== 'undefined' ? window.location.origin : 'https://www.eg1.in'}${typeof window !== 'undefined' && window.location.pathname.endsWith('.html') ? '/blog.html' : '/blog'}?title=${getBlogSlug(selectedPost)}`}
            />
          ) : (
            <div>
              {/* Active Filter Indicators */}
              {(selectedCategory || searchQuery.trim()) && (
                <div className="eg1-blog-page__filter-bar">
                  <div className="eg1-blog-page__filter-tags">
                    {selectedCategory && (
                      <span className="eg1-blog-page__filter-label">
                        Category: <strong>{selectedCategory}</strong>
                      </span>
                    )}
                    {selectedCategory && searchQuery.trim() && <span>•</span>}
                    {searchQuery.trim() && (
                      <span className="eg1-blog-page__filter-label">
                        Search: <strong>"{searchQuery}"</strong>
                      </span>
                    )}
                    <span className="eg1-blog-page__filter-count">
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
                    className="eg1-blog-page__clear-btn"
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
