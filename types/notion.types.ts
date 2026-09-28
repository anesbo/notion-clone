export type WorkspaceRole = 'owner' | 'member' | 'guest';
export type PageAccessLevel = 'private' | 'workspace' | 'public';

export type BlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bullet_list'
  | 'numbered_list'
  | 'todo'
  | 'toggle'
  | 'callout'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'file'
  | 'synced_block'
  | 'database';

export interface BlockContent {
  text?: string;
  checked?: boolean;
  isOpen?: boolean;
  icon?: string;
  color?: string;
  language?: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  databaseId?: string;
}

export interface BlockRecord {
  id: string;
  page_id: string;
  parent_block_id: string | null;
  type: BlockType;
  content: BlockContent;
  properties: Record<string, string | number | boolean | null>;
  position: number;
  synced_from_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageRecord {
  id: string;
  workspace_id: string;
  teamspace_id: string | null;
  parent_id: string | null;
  title: string;
  icon: string;
  cover_url: string | null;
  access_level: PageAccessLevel;
  is_archived: boolean;
  is_template: boolean;
  position: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  subPages?: PageRecord[];
}

export interface PageRevisionRecord {
  id: string;
  page_id: string;
  title: string;
  snapshot: {
    page: PageRecord;
    blocks: BlockRecord[];
  };
  created_by: string | null;
  commit_message: string;
  created_at: string;
}

export type DatabasePropertyType =
  | 'title'
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'relation';

export type DatabaseViewType = 'table' | 'board' | 'calendar' | 'list' | 'gallery';

export interface SelectOption {
  id: string;
  value: string;
  color: string;
}

export interface DatabasePropertyConfig {
  options?: SelectOption[];
  relationDatabaseId?: string;
}

export interface DatabasePropertyRecord {
  id: string;
  database_id: string;
  name: string;
  type: DatabasePropertyType;
  config: DatabasePropertyConfig;
  position: number;
  created_at: string;
}

export interface DatabaseViewRecord {
  id: string;
  database_id: string;
  name: string;
  type: DatabaseViewType;
  filter_config: Array<{
    propertyId: string;
    operator: 'equals' | 'contains' | 'is_empty' | 'is_not_empty';
    value: string | boolean | number;
  }>;
  sort_config: Array<{
    propertyId: string;
    direction: 'asc' | 'desc';
  }>;
  group_by_property_id: string | null;
  position: number;
  created_at: string;
}

export interface DatabaseRowRecord {
  id: string;
  database_id: string;
  page_id: string | null;
  cell_values: Record<string, string | number | boolean | string[] | null>;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  icon: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMemberRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  email: string;
  role: WorkspaceRole;
  joined_at: string;
  updated_at: string;
}
