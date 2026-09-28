# Notion Plus Open-Source Alternative

A production-ready, self-hosted Notion Plus alternative built with Next.js (App Router), Strict TypeScript, Pure CSS Custom Properties, and Supabase.

---

## 1. Prerequisites

- **Node.js:** v18.17.0+ or v20.0.0+ (Tested on v22)
- **Package Manager:** `npm` or `pnpm`
- **Supabase Account:** Free Tier or Self-Hosted instance

---

## 2. Environment Variables Configuration

Open `.env.local` in the project root and add your Supabase credentials:

```env
# Supabase API Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Service Role Key (for administrative tasks/cron jobs)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Database & Storage Initialization

1. Navigate to your **Supabase Dashboard** -> **SQL Editor**.
2. Click **New Query**.
3. Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and paste it into the editor.
4. Click **Run**.
5. Verify in your dashboard:
   - Tables: `workspaces`, `workspace_members`, `pages`, `blocks`, `page_revisions`, `databases`, `database_properties`, `database_views`, `database_rows`.
   - Storage Buckets: `workspace-assets` bucket created with a **10 MB limit**.
   - Database Triggers: `trg_prune_revisions`, `trg_cleanup_page_storage`, `trg_cleanup_block_storage`.

---

## 4. Local Development Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Run the Next.js development server
npm run dev

# 3. Open http://localhost:3000 in your browser
```

---

## 5. Verification & Acceptance Checklist

| Feature | Verification Step | Expected Outcome |
| :--- | :--- | :--- |
| **Authentication & Workspace** | Sign up with email or GitHub OAuth. | Auto-redirects to new workspace onboarding with default '🚀 Workspace'. |
| **Document Hierarchy** | Click '+' on the sidebar to create nested subpages. | Infinite recursive tree renders with breadcrumbs and expand/collapse chevrons. |
| **Slash Commands (`/`)** | Type `/` on any blank block row. | Interactive popover displays with keyboard navigation (Up/Down/Enter/Escape). |
| **Block Types** | Insert H1, To-do list, Callout, Quote, and Code blocks. | Renders 1:1 Notion styling with interactive check toggles and copy buttons. |
| **Drag & Drop** | Hover over any block to reveal `⋮⋮` handle and drag vertically. | Drop placeholder highlights line; array re-indexes and saves to PostgreSQL. |
| **Multi-View Databases** | Switch between Table and Board (Kanban) tabs. | Table allows cell edits; Kanban allows drag-and-drop card moves between status columns. |
| **Storage & WebP Cap** | Drag and drop an image > 3MB into a page. | Client-side Canvas compresses to WebP before upload; asset URL saves to `workspace-assets`. |
| **Version History** | Make edits, open Page History drawer, and click 'Restore this version'. | Document snapshots revert point-in-time while auto-pruning to max 30 records. |
| **Theme Toggle** | Toggle Dark / Light button at the bottom of the sidebar. | Instant 1:1 Notion color palette swap with **zero flash of unstyled content (FOUC)**. |
| **Native Arabic (RTL)** | Click 'العربية (AR)' toggle. | `dir="rtl"` sets dynamically; sidebar, page tree, chevrons, and text flip with Cairo font. |
