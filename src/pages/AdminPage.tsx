import React, { useState, useEffect } from 'react';
import {
  AdminAuthGuard,
  AdminLayout,
  AdminAnalyticsView,
  AdminMessagesView,
  AdminBlogEditor,
  AdminNavItem,
} from 'eg-web-core';
import { EG1_FIREBASE_CONFIG } from '../config/firebase';
import { Eg1Logo } from '../components/Eg1Logo';

export interface AdminPageProps {
  onNavigate?: (href: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    document.title = 'Admin Panel - EG1';
  }, []);
  const [activeTab, setActiveTab] = useState<'analytics' | 'messages' | 'blog'>('analytics');

  const navItems: AdminNavItem[] = [
    {
      id: 'analytics',
      label: 'Visitor Analytics',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      badge: 'Live',
      badgeColor: 'rgba(16, 185, 129, 0.2)',
    },
    {
      id: 'messages',
      label: 'Contact Inquiries',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
    {
      id: 'blog',
      label: 'Blog Article Editor',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
  ];

  return (
    <AdminAuthGuard
      authConfig={{
        allowedEmails: import.meta.env.VITE_ADMIN_ALLOWED_EMAILS
          ? (import.meta.env.VITE_ADMIN_ALLOWED_EMAILS as string).split(',').map((e) => e.trim()).filter(Boolean)
          : undefined,
        pinSalt: (import.meta.env.VITE_ADMIN_PIN_SALT as string) || 'EG1_ADMIN_SECURE_SALT_2026',
        firebaseConfig: EG1_FIREBASE_CONFIG,
        lockoutCollection: 'admin_lockout',
        logCollection: 'admin_login_log',
        securityCollection: 'admin_security',
      }}
      loginProps={{
        title: 'EG1 Admin Console',
        subtitle: 'Two-factor authorized administrator access',
        logo: <Eg1Logo size={80} theme="auto" />,
      }}
    >
      {({ user, logout }) => (
        <AdminLayout
          brandTitle="EG1 Admin"
          brandSubtitle="Portal Management Console"
          logo={<Eg1Logo size={42} theme="auto" />}
          navItems={navItems}
          activeNavId={activeTab}
          onNavSelect={(id) => setActiveTab(id as any)}
          user={user}
          onLogout={logout}
          headerActions={
            onNavigate ? (
              <button
                type="button"
                onClick={() => onNavigate('index.html')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'var(--eg-bg-tertiary, #1f2937)',
                  border: '1px solid var(--eg-border, rgba(255, 255, 255, 0.12))',
                  borderRadius: 'var(--eg-radius-md, 8px)',
                  color: 'var(--eg-text-primary, #f9fafb)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Exit to Website</span>
              </button>
            ) : undefined
          }
        >
          {activeTab === 'analytics' && (
            <AdminAnalyticsView
              collectionName="visitor_analytics"
              domains={['All Domains', 'eg1.in', 'mchess.eg1.in', 'av.eg1.in']}
            />
          )}

          {activeTab === 'messages' && (
            <AdminMessagesView
              collectionName="messages"
              title="EG1 Contact Inquiries & Messages"
            />
          )}

          {activeTab === 'blog' && (
            <AdminBlogEditor
              title="EG1 Article Editor & Markdown Studio"
              defaultAuthor="EG1 Engineering"
              categories={['Programming', 'Tutorial', 'Architecture', 'Security', 'Announcements']}
              onSave={(_markdown, metadata) => {
                console.log('Saved article:', metadata.title);
                alert(`Article "${metadata.title}" ready! You can now copy or download the markdown file.`);
              }}
            />
          )}
        </AdminLayout>
      )}
    </AdminAuthGuard>
  );
};
