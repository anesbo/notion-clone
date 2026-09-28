'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BlockRecord, BlockType, PageRecord } from '@/types/notion.types';
import { SlashMenu } from './slash-menu';
import styles from './editor.module.css';

interface EditorProps {
  initialPage: PageRecord;
  initialBlocks: BlockRecord[];
}

export function Editor({ initialPage, initialBlocks }: EditorProps) {
  const [page, setPage] = useState<PageRecord>(initialPage);
  const [blocks, setBlocks] = useState<BlockRecord[]>(initialBlocks);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);

  // Slash command state
  const [slashMenuState, setSlashMenuState] = useState<{
    isOpen: boolean;
    blockId: string | null;
    query: string;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    blockId: null,
    query: '',
    position: { top: 0, left: 0 },
  });

  const supabase = createClient();
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Restrict Supabase Realtime to current active page
  useEffect(() => {
    const channel = supabase
      .channel(`page-blocks-${initialPage.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `page_id=eq.${initialPage.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('blocks')
            .select('*')
            .eq('page_id', initialPage.id)
            .order('position', { ascending: true });
          if (data) setBlocks(data as BlockRecord[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialPage.id, supabase]);

  const handleTitleChange = (newTitle: string) => {
    setPage((prev) => ({ ...prev, title: newTitle }));
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(async () => {
      await supabase.from('pages').update({ title: newTitle }).eq('id', page.id);
    }, 500);
  };

  const updateBlockContent = async (id: string, updates: Partial<BlockRecord['content']>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...updates } } : b))
    );

    const target = blocks.find((b) => b.id === id);
    if (!target) return;

    await supabase
      .from('blocks')
      .update({ content: { ...target.content, ...updates } })
      .eq('id', id);
  };

  const handleKeyDown = async (
    e: React.KeyboardEvent<HTMLDivElement>,
    block: BlockRecord,
    index: number
  ) => {
    const text = block.content.text || '';

    // Trigger Slash Menu
    if (e.key === '/') {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setSlashMenuState({
        isOpen: true,
        blockId: block.id,
        query: '',
        position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX },
      });
    }

    // Enter: Insert new paragraph block below
    if (e.key === 'Enter' && !e.shiftKey && !slashMenuState.isOpen) {
      e.preventDefault();
      const newPos = block.position + 10;
      const { data } = await supabase
        .from('blocks')
        .insert({
          page_id: page.id,
          type: 'paragraph',
          content: { text: '' },
          position: newPos,
        })
        .select()
        .single();

      if (data) {
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, data as BlockRecord);
        setBlocks(newBlocks);
      }
    }

    // Backspace: Delete empty block
    if (e.key === 'Backspace' && text === '' && blocks.length > 1) {
      e.preventDefault();
      await supabase.from('blocks').delete().eq('id', block.id);
      setBlocks((prev) => prev.filter((b) => b.id !== block.id));
    }
  };

  const handleSlashSelect = async (newType: BlockType) => {
    if (!slashMenuState.blockId) return;
    const targetId = slashMenuState.blockId;

    await supabase
      .from('blocks')
      .update({ type: newType, content: { text: '' } })
      .eq('id', targetId);

    setBlocks((prev) =>
      prev.map((b) => (b.id === targetId ? { ...b, type: newType, content: { ...b.content, text: '' } } : b))
    );

    setSlashMenuState((prev) => ({ ...prev, isOpen: false }));
  };

  // HTML5 Drag-and-Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedBlockIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === index) return;

    const updated = [...blocks];
    const [dragged] = updated.splice(draggedBlockIndex, 1);
    updated.splice(index, 0, dragged);

    const reindexed = updated.map((b, idx) => ({ ...b, position: (idx + 1) * 1000 }));
    setBlocks(reindexed);
    setDraggedBlockIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedBlockIndex(null);
    for (const b of blocks) {
      await supabase.from('blocks').update({ position: b.position }).eq('id', b.id);
    }
  };

  return (
    <div className={styles.editorContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageIcon}>{page.icon || '📄'}</div>
        <input
          className={styles.pageTitleInput}
          value={page.title}
          placeholder="Untitled"
          onChange={(e) => handleTitleChange(e.target.value)}
        />
      </div>

      {/* Block Stream */}
      <div className={styles.blocksContainer}>
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={styles.blockRow}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            {/* 6-dot Drag Handle */}
            <div className={styles.dragHandle} title="Drag to reorder">
              ⋮⋮
            </div>

            {/* Block Type Renderers */}
            {block.type === 'paragraph' && (
              <div
                className={styles.blockContent}
                contentEditable
                suppressContentEditableWarning
                onKeyDown={(e) => handleKeyDown(e, block, index)}
                onBlur={(e) => updateBlockContent(block.id, { text: e.currentTarget.textContent || '' })}
              >
                {block.content.text}
              </div>
            )}

            {block.type === 'heading_1' && (
              <div
                className={`${styles.blockContent} ${styles.h1}`}
                contentEditable
                suppressContentEditableWarning
                onKeyDown={(e) => handleKeyDown(e, block, index)}
                onBlur={(e) => updateBlockContent(block.id, { text: e.currentTarget.textContent || '' })}
              >
                {block.content.text}
              </div>
            )}

            {block.type === 'heading_2' && (
              <div
                className={`${styles.blockContent} ${styles.h2}`}
                contentEditable
                suppressContentEditableWarning
                onKeyDown={(e) => handleKeyDown(e, block, index)}
                onBlur={(e) => updateBlockContent(block.id, { text: e.currentTarget.textContent || '' })}
              >
                {block.content.text}
              </div>
            )}

            {block.type === 'heading_3' && (
              <div
                className={`${styles.blockContent} ${styles.h3}`}
                contentEditable
                suppressContentEditableWarning
                onKeyDown={(e) => handleKeyDown(e, block, index)}
                onBlur={(e) => updateBlockContent(block.id, { text: e.currentTarget.textContent || '' })}
              >
                {block.content.text}
              </div>
            )}

            {block.type === 'todo' && (
              <div className={styles.todoRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={block.content.checked || false}
                  onChange={(e) => updateBlockContent(block.id, { checked: e.target.checked })}
                />
                <div
                  className={`${styles.blockContent} ${block.content.checked ? styles.checkedText : ''}`}
                  contentEditable
                  suppressContentEditableWarning
                  onKeyDown={(e) => handleKeyDown(e, block, index)}
                  onBlur={(e) => updateBlockContent(block.id, { text: e.currentTarget.textContent || '' })}
                >
                  {block.content.text}
                </div>
              </div>
            )}

            {block.type === 'callout' && (
              <div className={styles.callout}>
                <span>{block.content.icon || '💡'}</span>
                <div
                  className={styles.blockContent}
                  contentEditable
                  suppressContentEditableWarning
                  onKeyDown={(e) => handleKeyDown(e, block, index)}
                  onBlur={(e) => updateBlockContent(block.id, { text: e.currentTarget.textContent || '' })}
                >
                  {block.content.text}
                </div>
              </div>
            )}

            {block.type === 'quote' && (
              <div
                className={`${styles.blockContent} ${styles.quote}`}
                contentEditable
                suppressContentEditableWarning
                onKeyDown={(e) => handleKeyDown(e, block, index)}
                onBlur={(e) => updateBlockContent(block.id, { text: e.currentTarget.textContent || '' })}
              >
                {block.content.text}
              </div>
            )}

            {block.type === 'code' && (
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>
                  <span>{block.content.language || 'typescript'}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(block.content.text || '')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  className={styles.codeTextarea}
                  rows={4}
                  value={block.content.text || ''}
                  onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                />
              </div>
            )}

            {block.type === 'divider' && <hr className={styles.divider} />}

            {block.type === 'synced_block' && (
              <div className={styles.syncedBlock}>
                <div className={styles.syncedBadge}>🔄 Synced Block</div>
                <div
                  className={styles.blockContent}
                  contentEditable
                  suppressContentEditableWarning
                  onKeyDown={(e) => handleKeyDown(e, block, index)}
                  onBlur={(e) => updateBlockContent(block.id, { text: e.currentTarget.textContent || '' })}
                >
                  {block.content.text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Slash Commands Modal */}
      {slashMenuState.isOpen && (
        <SlashMenu
          position={slashMenuState.position}
          query={slashMenuState.query}
          onSelect={handleSlashSelect}
          onClose={() => setSlashMenuState((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}
