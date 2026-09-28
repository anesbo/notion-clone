'use client';

import React, { useState } from 'react';
import type {
  DatabasePropertyRecord,
  DatabaseRowRecord,
  DatabaseViewRecord,
  DatabaseViewType,
} from '@/types/notion.types';
import { TableView } from './table-view';
import { KanbanView } from './kanban-view';
import styles from './database.module.css';

interface DatabaseComponentProps {
  databaseId: string;
  initialProperties: DatabasePropertyRecord[];
  initialViews: DatabaseViewRecord[];
  initialRows: DatabaseRowRecord[];
}

export function DatabaseView({
  databaseId,
  initialProperties,
  initialViews,
  initialRows,
}: DatabaseComponentProps) {
  const [properties] = useState<DatabasePropertyRecord[]>(initialProperties);
  const [views] = useState<DatabaseViewRecord[]>(initialViews);
  const [rows, setRows] = useState<DatabaseRowRecord[]>(initialRows);
  const [activeViewId, setActiveViewId] = useState<string>(
    views[0]?.id || 'default'
  );

  const activeView = views.find((v) => v.id === activeViewId) || {
    id: 'default',
    database_id: databaseId,
    name: 'Table View',
    type: 'table' as DatabaseViewType,
    filter_config: [],
    sort_config: [],
    group_by_property_id: null,
    position: 1000,
    created_at: new Date().toISOString(),
  };

  return (
    <div className={styles.databaseWrapper}>
      {/* View Switcher Tabs */}
      <div className={styles.viewTabBar}>
        {views.map((v) => (
          <button
            key={v.id}
            className={`${styles.viewTab} ${v.id === activeView.id ? styles.active : ''}`}
            onClick={() => setActiveViewId(v.id)}
          >
            <span>{v.type === 'board' ? '📋' : '▦'}</span>
            <span>{v.name}</span>
          </button>
        ))}
      </div>

      {/* Dynamic View Representation */}
      {activeView.type === 'table' && (
        <TableView
          databaseId={databaseId}
          properties={properties}
          rows={rows}
          onRowsChange={setRows}
        />
      )}

      {activeView.type === 'board' && (
        <KanbanView
          databaseId={databaseId}
          properties={properties}
          rows={rows}
          onRowsChange={setRows}
        />
      )}
    </div>
  );
}
