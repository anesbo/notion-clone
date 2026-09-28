'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PageRevisionRecord } from '@/types/notion.types';

interface VersionHistoryProps {
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export function VersionHistoryDrawer({ pageId, isOpen, onClose, onRestore }: VersionHistoryProps) {
  const [revisions, setRevisions] = useState<PageRevisionRecord[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<PageRevisionRecord | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;

    const fetchRevisions = async () => {
      const { data } = await supabase
        .from('page_revisions')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: false });

      if (data) {
        setRevisions(data as PageRevisionRecord[]);
        if (data.length) setSelectedRevision(data[0] as PageRevisionRecord);
      }
    };

    fetchRevisions();
  }, [pageId, isOpen, supabase]);

  const handleRestore = async (revision: PageRevisionRecord) => {
    // 1. Restore Page metadata
    await supabase
      .from('pages')
      .update({
        title: revision.snapshot.page.title,
        icon: revision.snapshot.page.icon,
        cover_url: revision.snapshot.page.cover_url,
      })
      .eq('id', pageId);

    // 2. Wipe current blocks and re-insert revision snapshot
    await supabase.from('blocks').delete().eq('page_id', pageId);

    if (revision.snapshot.blocks.length > 0) {
      await supabase.from('blocks').insert(
        revision.snapshot.blocks.map((b) => ({
          id: b.id,
          page_id: pageId,
          type: b.type,
          content: b.content,
          properties: b.properties,
          position: b.position,
        }))
      );
    }

    onRestore();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '320px',
        height: '100vh',
        backgroundColor: 'var(--color-canvas-secondary)',
        borderLeft: '1px solid var(--color-border)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '14px' }}>Page History</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {revisions.map((rev) => (
          <div
            key={rev.id}
            onClick={() => setSelectedRevision(rev)}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '8px',
              cursor: 'pointer',
              backgroundColor:
                selectedRevision?.id === rev.id ? 'var(--color-canvas-hover)' : 'transparent',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 500 }}>
              {new Date(rev.created_at).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              {rev.commit_message || 'Snapshot'} • {rev.snapshot.blocks.length} blocks
            </div>
          </div>
        ))}
      </div>

      {selectedRevision && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => handleRestore(selectedRevision)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-accent-blue)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Restore this version
          </button>
        </div>
      )}
    </div>
  );
}
