'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/components/providers/i18n-provider';
import { useTheme } from '@/components/providers/theme-provider';
import type { PageRecord, WorkspaceRecord } from '@/types/notion.types';
import styles from './sidebar.module.css';

interface SidebarProps {
  initialWorkspace: WorkspaceRecord;
  initialPages: PageRecord[];
}

export function Sidebar({ initialWorkspace, initialPages }: SidebarProps) {
  const { t, locale, setLocale, direction } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [pages, setPages] = useState<PageRecord[]>(initialPages);
  const [collapsedPages, setCollapsedPages] = useState<Record<string, boolean>>({});
  const activePageId = params?.pageId as string | undefined;

  useEffect(() => {
    // Restrict Supabase Realtime to current workspace pages
    const channel = supabase
      .channel(`workspace-pages-${initialWorkspace.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pages',
          filter: `workspace_id=eq.${initialWorkspace.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('pages')
            .select('*')
            .eq('workspace_id', initialWorkspace.id)
            .eq('is_archived', false)
            .order('position', { ascending: true });
          if (data) setPages(data as PageRecord[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialWorkspace.id, supabase]);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCollapsedPages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreatePage = async (parentId: string | null = null) => {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: initialWorkspace.id,
        parent_id: parentId,
        title: 'Untitled',
        icon: '📄',
        position: Date.now(),
      })
      .select()
      .single();

    if (!error && data) {
      await supabase.from('blocks').insert({
        page_id: data.id,
        type: 'paragraph',
        content: { text: '' },
        position: 1000,
      });

      router.push(`/${initialWorkspace.slug}/${data.id}`);
    }
  };

  // Build recursive hierarchy tree
  const buildTree = (parentId: string | null = null, depth = 0): React.ReactNode => {
    const children = pages.filter((p) => p.parent_id === parentId);
    if (!children.length) return null;

    return children.map((page) => {
      const isCollapsed = collapsedPages[page.id] ?? true;
      const hasSubPages = pages.some((p) => p.parent_id === page.id);
      const isActive = activePageId === page.id;

      return (
        <div key={page.id} className={styles.treeItemContainer} style={{ '--depth': depth } as React.CSSProperties}>
          <Link
            href={`/${initialWorkspace.slug}/${page.id}`}
            className={`${styles.treeItem} ${isActive ? styles.active : ''}`}
          >
            <span
              className={styles.chevron}
              onClick={(e) => hasSubPages && toggleCollapse(page.id, e)}
              style={{ visibility: hasSubPages ? 'visible' : 'hidden' }}
            >
              {isCollapsed ? (direction === 'rtl' ? '◀' : '▶') : '▼'}
            </span>
            <span>{page.icon || '📄'}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {page.title || 'Untitled'}
            </span>
            <button
              className={styles.actionButton}
              title={t('add_subpage')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCreatePage(page.id);
              }}
            >
              +
            </button>
          </Link>
          {!isCollapsed && buildTree(page.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <aside className={styles.sidebar}>
      {/* Workspace Switcher */}
      <div className={styles.header}>
        <button className={styles.workspaceButton}>
          <span className={styles.workspaceIcon}>{initialWorkspace.icon}</span>
          <span>{initialWorkspace.name}</span>
        </button>
      </div>

      {/* Primary Actions */}
      <div className={styles.navGroup}>
        <button className={styles.navItem}>
          <span>🔍</span>
          <span>{t('search')}</span>
        </button>
        <button className={styles.navItem} onClick={() => handleCreatePage(null)}>
          <span>➕</span>
          <span>{t('new_page')}</span>
        </button>
        <button className={styles.navItem}>
          <span>⚙️</span>
          <span>{t('settings')}</span>
        </button>
      </div>

      {/* Pages Hierarchy */}
      <div className={styles.pageTreeSection}>
        {buildTree(null, 0)}
      </div>

      {/* Footer Controls (Theme & Language Switchers) */}
      <div className={styles.footer}>
        <button
          onClick={toggleTheme}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'inherit' }}
          title="Toggle Theme"
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <button
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'inherit' }}
          title="Toggle Language"
        >
          {locale === 'en' ? 'العربية (AR)' : 'English (EN)'}
        </button>
      </div>
    </aside>
  );
}
