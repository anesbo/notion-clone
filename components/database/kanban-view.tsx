'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DatabasePropertyRecord, DatabaseRowRecord } from '@/types/notion.types';
import styles from './database.module.css';

interface KanbanViewProps {
  databaseId: string;
  properties: DatabasePropertyRecord[];
  rows: DatabaseRowRecord[];
  onRowsChange: React.Dispatch<React.SetStateAction<DatabaseRowRecord[]>>;
}

export function KanbanView({ databaseId, properties, rows, onRowsChange }: KanbanViewProps) {
  const supabase = createClient();
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);

  const statusProp = properties.find((p) => p.type === 'select') || properties[0];
  const columns = statusProp?.config.options || [
    { id: 'todo', value: 'To Do', color: 'gray' },
    { id: 'in_progress', value: 'In Progress', color: 'blue' },
    { id: 'done', value: 'Done', color: 'green' },
  ];

  const handleDragStart = (rowId: string) => {
    setDraggedRowId(rowId);
  };

  const handleDrop = async (statusValue: string) => {
    if (!draggedRowId || !statusProp) return;

    const row = rows.find((r) => r.id === draggedRowId);
    if (!row) return;

    const updatedCellValues = { ...row.cell_values, [statusProp.id]: statusValue };

    onRowsChange((prev) =>
      prev.map((r) => (r.id === draggedRowId ? { ...r, cell_values: updatedCellValues } : r))
    );

    setDraggedRowId(null);

    await supabase
      .from('database_rows')
      .update({ cell_values: updatedCellValues })
      .eq('id', draggedRowId);
  };

  const handleAddCard = async (statusValue: string) => {
    if (!statusProp) return;
    const titleProp = properties.find((p) => p.type === 'title') || properties[0];

    const defaultValues: Record<string, string> = {
      [titleProp.id]: 'Untitled card',
      [statusProp.id]: statusValue,
    };

    const { data } = await supabase
      .from('database_rows')
      .insert({
        database_id: databaseId,
        cell_values: defaultValues,
        position: Date.now(),
      })
      .select()
      .single();

    if (data) {
      onRowsChange((prev) => [...prev, data as DatabaseRowRecord]);
    }
  };

  return (
    <div className={styles.kanbanBoard}>
      {columns.map((col) => {
        const columnRows = rows.filter(
          (r) => (r.cell_values[statusProp?.id || ''] as string) === col.value
        );

        return (
          <div
            key={col.id}
            className={styles.kanbanColumn}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.value)}
          >
            <div className={styles.columnHeader}>
              <span>{col.value}</span>
              <span>{columnRows.length}</span>
            </div>

            {columnRows.map((row) => (
              <div
                key={row.id}
                className={styles.kanbanCard}
                draggable
                onDragStart={() => handleDragStart(row.id)}
              >
                <div className={styles.cardTitle}>
                  {Object.values(row.cell_values)[0] as string || 'Untitled'}
                </div>
              </div>
            ))}

            <button className={styles.addCardBtn} onClick={() => handleAddCard(col.value)}>
              + Add card
            </button>
          </div>
        );
      })}
    </div>
  );
}
