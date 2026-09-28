'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { BlockType } from '@/types/notion.types';
import styles from './editor.module.css';

interface SlashMenuItem {
  type: BlockType;
  label: string;
  icon: string;
  keywords: string[];
}

const MENU_ITEMS: SlashMenuItem[] = [
  { type: 'paragraph', label: 'Text', icon: 'T', keywords: ['p', 'paragraph', 'text'] },
  { type: 'heading_1', label: 'Heading 1', icon: 'H1', keywords: ['h1', 'heading', 'title'] },
  { type: 'heading_2', label: 'Heading 2', icon: 'H2', keywords: ['h2', 'subheading'] },
  { type: 'heading_3', label: 'Heading 3', icon: 'H3', keywords: ['h3', 'section'] },
  { type: 'todo', label: 'To-do list', icon: '☑️', keywords: ['todo', 'task', 'check'] },
  { type: 'bullet_list', label: 'Bulleted list', icon: '•', keywords: ['bullet', 'list', 'unordered'] },
  { type: 'numbered_list', label: 'Numbered list', icon: '1.', keywords: ['number', 'ordered'] },
  { type: 'toggle', label: 'Toggle list', icon: '▶', keywords: ['toggle', 'accordion', 'collapse'] },
  { type: 'callout', label: 'Callout', icon: '💡', keywords: ['callout', 'box', 'alert', 'note'] },
  { type: 'quote', label: 'Quote', icon: '❝', keywords: ['quote', 'cite'] },
  { type: 'code', label: 'Code', icon: '</>', keywords: ['code', 'javascript', 'sql', 'python'] },
  { type: 'divider', label: 'Divider', icon: '—', keywords: ['divider', 'hr', 'line'] },
  { type: 'synced_block', label: 'Synced block', icon: '🔄', keywords: ['sync', 'shared'] },
];

interface SlashMenuProps {
  position: { top: number; left: number };
  query: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function SlashMenu({ position, query, onSelect, onClose }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = MENU_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.keywords.some((k) => k.includes(query.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex].type);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, onSelect, onClose]);

  if (!filteredItems.length) return null;

  return (
    <div
      ref={menuRef}
      className={styles.slashMenu}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {filteredItems.map((item, index) => (
        <div
          key={item.type}
          className={`${styles.slashItem} ${index === selectedIndex ? styles.selected : ''}`}
          onClick={() => onSelect(item.type)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className={styles.slashIcon}>{item.icon}</div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
