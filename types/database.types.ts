export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          email: string;
          role: 'owner' | 'member' | 'guest';
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          email: string;
          role?: 'owner' | 'member' | 'guest';
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          email?: string;
          role?: 'owner' | 'member' | 'guest';
          joined_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      teamspaces: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          icon: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          icon?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          icon?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pages: {
        Row: {
          id: string;
          workspace_id: string;
          teamspace_id: string | null;
          parent_id: string | null;
          title: string;
          icon: string;
          cover_url: string | null;
          access_level: 'private' | 'workspace' | 'public';
          is_archived: boolean;
          is_template: boolean;
          position: number;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          teamspace_id?: string | null;
          parent_id?: string | null;
          title?: string;
          icon?: string;
          cover_url?: string | null;
          access_level?: 'private' | 'workspace' | 'public';
          is_archived?: boolean;
          is_template?: boolean;
          position?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          teamspace_id?: string | null;
          parent_id?: string | null;
          title?: string;
          icon?: string;
          cover_url?: string | null;
          access_level?: 'private' | 'workspace' | 'public';
          is_archived?: boolean;
          is_template?: boolean;
          position?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          id: string;
          page_id: string;
          parent_block_id: string | null;
          type: string;
          content: Json;
          properties: Json;
          position: number;
          synced_from_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          parent_block_id?: string | null;
          type: string;
          content?: Json;
          properties?: Json;
          position?: number;
          synced_from_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          parent_block_id?: string | null;
          type?: string;
          content?: Json;
          properties?: Json;
          position?: number;
          synced_from_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      page_revisions: {
        Row: {
          id: string;
          page_id: string;
          title: string;
          snapshot: Json;
          created_by: string | null;
          commit_message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          title: string;
          snapshot: Json;
          created_by?: string | null;
          commit_message?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          title?: string;
          snapshot?: Json;
          created_by?: string | null;
          commit_message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      databases: {
        Row: {
          id: string;
          page_id: string;
          workspace_id: string;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          workspace_id: string;
          title?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          workspace_id?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      database_properties: {
        Row: {
          id: string;
          database_id: string;
          name: string;
          type: 'title' | 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'relation';
          config: Json;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          database_id: string;
          name: string;
          type?: 'title' | 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'relation';
          config?: Json;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          database_id?: string;
          name?: string;
          type?: 'title' | 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'relation';
          config?: Json;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      database_views: {
        Row: {
          id: string;
          database_id: string;
          name: string;
          type: 'table' | 'board' | 'calendar' | 'list' | 'gallery';
          filter_config: Json;
          sort_config: Json;
          group_by_property_id: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          database_id: string;
          name?: string;
          type?: 'table' | 'board' | 'calendar' | 'list' | 'gallery';
          filter_config?: Json;
          sort_config?: Json;
          group_by_property_id?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          database_id?: string;
          name?: string;
          type?: 'table' | 'board' | 'calendar' | 'list' | 'gallery';
          filter_config?: Json;
          sort_config?: Json;
          group_by_property_id?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      database_rows: {
        Row: {
          id: string;
          database_id: string;
          page_id: string | null;
          cell_values: Json;
          position: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          database_id: string;
          page_id?: string | null;
          cell_values?: Json;
          position?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          database_id?: string;
          page_id?: string | null;
          cell_values?: Json;
          position?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_is_workspace_member: {
        Args: {
          ws_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      workspace_role: 'owner' | 'member' | 'guest';
      page_access_level: 'private' | 'workspace' | 'public';
      database_property_type:
        | 'title'
        | 'text'
        | 'number'
        | 'select'
        | 'multi_select'
        | 'date'
        | 'checkbox'
        | 'url'
        | 'relation';
      database_view_type: 'table' | 'board' | 'calendar' | 'list' | 'gallery';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
