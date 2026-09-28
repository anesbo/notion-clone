-- ============================================================================
-- NOTION PLUS OPEN-SOURCE ALTERNATIVE: CORE DATABASE SCHEMA
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
    CREATE TYPE workspace_role AS ENUM ('owner', 'member', 'guest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE page_access_level AS ENUM ('private', 'workspace', 'public');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE database_property_type AS ENUM (
        'title', 'text', 'number', 'select', 'multi_select', 
        'date', 'checkbox', 'url', 'relation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE database_view_type AS ENUM (
        'table', 'board', 'calendar', 'list', 'gallery'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT '🚀',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. WORKSPACE MEMBERS (RBAC)
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role workspace_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_workspace_user UNIQUE(workspace_id, user_id)
);

-- 5. TEAMSPACES (Notion Plus Feature)
CREATE TABLE IF NOT EXISTS public.teamspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '👥',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PAGES (Nested Hierarchy & Access)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    teamspace_id UUID REFERENCES public.teamspaces(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled',
    icon TEXT DEFAULT '📄',
    cover_url TEXT,
    access_level page_access_level NOT NULL DEFAULT 'workspace',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_template BOOLEAN NOT NULL DEFAULT false,
    position DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. BLOCKS (Hierarchical, Rich Content, Synced Blocks)
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    parent_block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    position DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    synced_from_id UUID REFERENCES public.blocks(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. PAGE REVISIONS (Capped at 30 per page for storage efficiency)
CREATE TABLE IF NOT EXISTS public.page_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    snapshot JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    commit_message TEXT DEFAULT 'Automated snapshot',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. RELATIONAL DATABASES
CREATE TABLE IF NOT EXISTS public.databases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Database',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. DATABASE PROPERTIES (Schema Columns)
CREATE TABLE IF NOT EXISTS public.database_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL REFERENCES public.databases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type database_property_type NOT NULL DEFAULT 'text',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    position DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. DATABASE VIEWS (Table, Board, Calendar, List, Gallery)
CREATE TABLE IF NOT EXISTS public.database_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL REFERENCES public.databases(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Default View',
    type database_view_type NOT NULL DEFAULT 'table',
    filter_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    group_by_property_id UUID REFERENCES public.database_properties(id) ON DELETE SET NULL,
    position DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. DATABASE ROWS (Data Entries with JSONB Cells)
CREATE TABLE IF NOT EXISTS public.database_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL REFERENCES public.databases(id) ON DELETE CASCADE,
    page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
    cell_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    position DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- CLEAN LOW-OVERHEAD INDEXES (<50ms query times)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_lookup ON public.workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_pages_workspace ON public.pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent ON public.pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_archived ON public.pages(workspace_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_blocks_page_pos ON public.blocks(page_id, position);
CREATE INDEX IF NOT EXISTS idx_blocks_parent ON public.blocks(parent_block_id);
CREATE INDEX IF NOT EXISTS idx_page_revisions_lookup ON public.page_revisions(page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_databases_page ON public.databases(page_id);
CREATE INDEX IF NOT EXISTS idx_database_props_db ON public.database_properties(database_id, position);
CREATE INDEX IF NOT EXISTS idx_database_views_db ON public.database_views(database_id, position);
CREATE INDEX IF NOT EXISTS idx_database_rows_db ON public.database_rows(database_id, position);

-- ============================================================================
-- HELPER FUNCTIONS FOR SECURITY & TRIGGER LOGIC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.workspace_members 
        WHERE workspace_id = ws_id 
          AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.prune_page_revisions()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.page_revisions
    WHERE id IN (
        SELECT id
        FROM public.page_revisions
        WHERE page_id = NEW.page_id
        ORDER BY created_at DESC
        OFFSET 30
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.cleanup_storage_on_delete()
RETURNS TRIGGER AS $$
DECLARE
    file_path TEXT;
BEGIN
    IF TG_TABLE_NAME = 'pages' AND OLD.cover_url IS NOT NULL THEN
        IF OLD.cover_url LIKE '%/workspace-assets/%' THEN
            file_path := split_part(OLD.cover_url, '/workspace-assets/', 2);
            DELETE FROM storage.objects WHERE bucket_id = 'workspace-assets' AND name = file_path;
        END IF;
    END IF;

    IF TG_TABLE_NAME = 'blocks' AND (OLD.type = 'image' OR OLD.type = 'file') THEN
        IF (OLD.content->>'url') LIKE '%/workspace-assets/%' THEN
            file_path := split_part(OLD.content->>'url', '/workspace-assets/', 2);
            DELETE FROM storage.objects WHERE bucket_id = 'workspace-assets' AND name = file_path;
        END IF;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ATTACH TRIGGERS
-- ============================================================================

CREATE OR REPLACE TRIGGER trg_workspaces_updated
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_pages_updated
    BEFORE UPDATE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_blocks_updated
    BEFORE UPDATE ON public.blocks
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_database_rows_updated
    BEFORE UPDATE ON public.database_rows
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_prune_revisions
    AFTER INSERT ON public.page_revisions
    FOR EACH ROW EXECUTE FUNCTION public.prune_page_revisions();

CREATE OR REPLACE TRIGGER trg_cleanup_page_storage
    AFTER DELETE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_storage_on_delete();

CREATE OR REPLACE TRIGGER trg_cleanup_block_storage
    AFTER DELETE ON public.blocks
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_storage_on_delete();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teamspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_rows ENABLE ROW LEVEL SECURITY;

-- WORKSPACES
CREATE POLICY "Workspaces viewable by active members"
    ON public.workspaces FOR SELECT
    USING (public.check_is_workspace_member(id));

CREATE POLICY "Workspaces insertable by authenticated users"
    ON public.workspaces FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Workspaces updatable by workspace owners"
    ON public.workspaces FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = id AND user_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Workspaces deletable by workspace owners"
    ON public.workspaces FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = id AND user_id = auth.uid() AND role = 'owner'
        )
    );

-- WORKSPACE MEMBERS
CREATE POLICY "Workspace members viewable by fellow members"
    ON public.workspace_members FOR SELECT
    USING (public.check_is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can be added by owners"
    ON public.workspace_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_members.workspace_id 
              AND user_id = auth.uid() 
              AND role = 'owner'
        ) OR (
            user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members manageable by owners"
    ON public.workspace_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_members.workspace_id 
              AND user_id = auth.uid() 
              AND role = 'owner'
        )
    );

CREATE POLICY "Workspace members removable by owners"
    ON public.workspace_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_members.workspace_id 
              AND user_id = auth.uid() 
              AND role = 'owner'
        ) OR user_id = auth.uid()
    );

-- TEAMSPACES
CREATE POLICY "Teamspaces viewable by workspace members"
    ON public.teamspaces FOR ALL
    USING (public.check_is_workspace_member(workspace_id));

-- PAGES
CREATE POLICY "Pages readable by members or public"
    ON public.pages FOR SELECT
    USING (
        access_level = 'public' 
        OR public.check_is_workspace_member(workspace_id)
    );

CREATE POLICY "Pages insertable by workspace members"
    ON public.pages FOR INSERT
    WITH CHECK (public.check_is_workspace_member(workspace_id));

CREATE POLICY "Pages updatable by workspace members"
    ON public.pages FOR UPDATE
    USING (public.check_is_workspace_member(workspace_id));

CREATE POLICY "Pages deletable by workspace members"
    ON public.pages FOR DELETE
    USING (public.check_is_workspace_member(workspace_id));

-- BLOCKS
CREATE POLICY "Blocks readable if page is accessible"
    ON public.blocks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE id = blocks.page_id 
              AND (access_level = 'public' OR public.check_is_workspace_member(workspace_id))
        )
    );

CREATE POLICY "Blocks writable by workspace members"
    ON public.blocks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE id = blocks.page_id 
              AND public.check_is_workspace_member(workspace_id)
        )
    );

CREATE POLICY "Blocks updatable by workspace members"
    ON public.blocks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE id = blocks.page_id 
              AND public.check_is_workspace_member(workspace_id)
        )
    );

CREATE POLICY "Blocks deletable by workspace members"
    ON public.blocks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE id = blocks.page_id 
              AND public.check_is_workspace_member(workspace_id)
        )
    );

-- PAGE REVISIONS
CREATE POLICY "Revisions viewable by workspace members"
    ON public.page_revisions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE id = page_revisions.page_id 
              AND public.check_is_workspace_member(workspace_id)
        )
    );

CREATE POLICY "Revisions insertable by workspace members"
    ON public.page_revisions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pages
            WHERE id = page_revisions.page_id 
              AND public.check_is_workspace_member(workspace_id)
        )
    );

-- DATABASES & VIEWS
CREATE POLICY "Databases access control"
    ON public.databases FOR ALL
    USING (public.check_is_workspace_member(workspace_id));

CREATE POLICY "Database properties access control"
    ON public.database_properties FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.databases
            WHERE id = database_properties.database_id 
              AND public.check_is_workspace_member(workspace_id)
        )
    );

CREATE POLICY "Database views access control"
    ON public.database_views FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.databases
            WHERE id = database_views.database_id 
              AND public.check_is_workspace_member(workspace_id)
        )
    );

CREATE POLICY "Database rows access control"
    ON public.database_rows FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.databases
            WHERE id = database_rows.database_id 
              AND public.check_is_workspace_member(workspace_id)
        )
    );

-- ============================================================================
-- STORAGE BUCKET & STORAGE RLS POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'workspace-assets',
    'workspace-assets',
    true,
    10485760, -- 10 MB strict limit
    ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    public = true;

CREATE POLICY "Authenticated users can upload workspace assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'workspace-assets');

CREATE POLICY "Workspace assets are publicly readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'workspace-assets');

CREATE POLICY "Authenticated users can delete their assets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'workspace-assets');
