import React from 'react';
import { Sidebar } from '@/components/sidebar/sidebar';
import { Editor } from '@/components/editor/editor';
import { DatabaseView } from '@/components/database/database-view';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  PageRecord,
  WorkspaceRecord,
  BlockRecord,
  DatabasePropertyRecord,
  DatabaseViewRecord,
  DatabaseRowRecord,
} from '@/types/notion.types';

interface PageProps {
  params: {
    workspaceSlug: string;
    pageId: string;
  };
}

export default async function WorkspacePage({ params }: PageProps) {
  const { workspaceSlug, pageId } = params;

  let workspace: WorkspaceRecord = {
    id: 'default-ws',
    name: 'My Workspace',
    slug: workspaceSlug,
    icon: '🚀',
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let pages: PageRecord[] = [];
  let currentPage: PageRecord = {
    id: pageId,
    workspace_id: workspace.id,
    teamspace_id: null,
    parent_id: null,
    title: 'Getting Started with Notion Plus',
    icon: '📄',
    cover_url: null,
    access_level: 'workspace',
    is_archived: false,
    is_template: false,
    position: 1000,
    created_by: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let blocks: BlockRecord[] = [
    {
      id: 'block-1',
      page_id: pageId,
      parent_block_id: null,
      type: 'heading_1',
      content: { text: 'Welcome to your new Notion Plus workspace!' },
      properties: {},
      position: 1000,
      synced_from_id: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'block-2',
      page_id: pageId,
      parent_block_id: null,
      type: 'callout',
      content: { text: 'Type / anywhere to open the command menu and add headers, to-do lists, code blocks, or dividers.', icon: '💡' },
      properties: {},
      position: 2000,
      synced_from_id: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'block-3',
      page_id: pageId,
      parent_block_id: null,
      type: 'todo',
      content: { text: 'Toggle dark mode using the switcher at the bottom-left', checked: false },
      properties: {},
      position: 3000,
      synced_from_id: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'block-4',
      page_id: pageId,
      parent_block_id: null,
      type: 'todo',
      content: { text: 'Switch language to Arabic (العربية) to test 100% RTL bidirectional mirroring', checked: false },
      properties: {},
      position: 4000,
      synced_from_id: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Try fetching from Supabase if connected
  try {
    const supabase = await createServerSupabaseClient();
    const { data: wsData } = await supabase
      .from('workspaces')
      .select('*')
      .eq('slug', workspaceSlug)
      .single();

    if (wsData) {
      workspace = wsData as WorkspaceRecord;

      const { data: pagesData } = await supabase
        .from('pages')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('is_archived', false)
        .order('position', { ascending: true });

      if (pagesData && pagesData.length > 0) {
        pages = pagesData as PageRecord[];
      }

      const { data: pageData } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (pageData) {
        currentPage = pageData as PageRecord;

        const { data: blockData } = await supabase
          .from('blocks')
          .select('*')
          .eq('page_id', pageId)
          .order('position', { ascending: true });

        if (blockData && blockData.length > 0) {
          blocks = blockData as BlockRecord[];
        }
      }
    }
  } catch {
    // Uses fallback demo state
  }

  // Ensure current page is in the list
  if (!pages.some((p) => p.id === currentPage.id)) {
    pages = [currentPage, ...pages];
  }

  // Demo database data for showcase
  const demoProperties: DatabasePropertyRecord[] = [
    { id: 'prop-1', database_id: 'db-1', name: 'Task Name', type: 'title', config: {}, position: 1000, created_at: '' },
    {
      id: 'prop-2',
      database_id: 'db-1',
      name: 'Status',
      type: 'select',
      config: {
        options: [
          { id: '1', value: 'To Do', color: 'gray' },
          { id: '2', value: 'In Progress', color: 'blue' },
          { id: '3', value: 'Done', color: 'green' },
        ],
      },
      position: 2000,
      created_at: '',
    },
  ];

  const demoViews: DatabaseViewRecord[] = [
    { id: 'view-1', database_id: 'db-1', name: 'Table View', type: 'table', filter_config: [], sort_config: [], group_by_property_id: null, position: 1000, created_at: '' },
    { id: 'view-2', database_id: 'db-1', name: 'Kanban Board', type: 'board', filter_config: [], sort_config: [], group_by_property_id: 'prop-2', position: 2000, created_at: '' },
  ];

  const demoRows: DatabaseRowRecord[] = [
    { id: 'row-1', database_id: 'db-1', page_id: null, cell_values: { 'prop-1': 'Design System Spec', 'prop-2': 'Done' }, position: 1000, created_by: null, created_at: '', updated_at: '' },
    { id: 'row-2', database_id: 'db-1', page_id: null, cell_values: { 'prop-1': 'Postgres RLS Policies', 'prop-2': 'In Progress' }, position: 2000, created_by: null, created_at: '', updated_at: '' },
    { id: 'row-3', database_id: 'db-1', page_id: null, cell_values: { 'prop-1': 'Client WebP Compression', 'prop-2': 'To Do' }, position: 3000, created_by: null, created_at: '', updated_at: '' },
  ];

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 1:1 Notion Sidebar */}
      <Sidebar initialWorkspace={workspace} initialPages={pages} />

      {/* Main Content Area */}
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', backgroundColor: 'var(--color-canvas)' }}>
        <Editor initialPage={currentPage} initialBlocks={blocks} />
        <div style={{ maxWidth: 'var(--editor-max-width)', margin: '0 auto', padding: '0 64px 64px 64px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Project Database</h3>
          <DatabaseView
            databaseId="demo-db"
            initialProperties={demoProperties}
            initialViews={demoViews}
            initialRows={demoRows}
          />
        </div>
      </main>
    </div>
  );
}
