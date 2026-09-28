'use client';

import React from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DatabasePropertyRecord, DatabaseRowRecord } from '@/types/notion.types';
import styles from './database.module.css';

interface TableViewProps {
  databaseId: string;
  properties: DatabasePropertyRecord[];
  rows: DatabaseRowRecord[];
  onRowsChange: React.Dispatch<React.SetStateAction<DatabaseRowRecord[]>>;
}

export function TableView({ databaseId, properties, rows, onRowsChange }: TableViewProps) {
  const supabase = createClient();

  const handleCellBlur = async (rowId: string, propertyId: string, value: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    const updatedCellValues = { ...row.cell_values, [propertyId]: value };

    onRowsChange((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, cell_values: updatedCellValues } : r))
    );

    await supabase
      .from('database_rows')
      .update({ cell_values: updatedCellValues })
      .eq('id', rowId);
  };

  const handleAddRow = async () => {
    const defaultValues: Record<string, string> = {};
    properties.forEach((p) => {
      defaultValues[p.id] = '';
    });

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
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {properties.map((prop) => (
              <th key={prop.id} className={styles.th}>
                {prop.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {properties.map((prop) => (
                <td key={prop.id} className={styles.td}>
                  <input
                    className={styles.cellInput}
                    defaultValue={(row.cell_values[prop.id] as string) || ''}
                    onBlur={(e) => handleCellBlur(row.id, prop.id, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button className={styles.addCardBtn} onClick={handleAddRow} style={{ margin: '8px' }}>
        + New entry
      </button>
    </div>
  );
}
