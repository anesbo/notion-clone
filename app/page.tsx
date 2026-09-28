import React from 'react';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function HomePage() {
  let workspaceSlug = 'default-workspace';

  try {
    const supabase = await createServerSupabaseClient();
    const { data: workspaces } = await supabase.from('workspaces').select('slug').limit(1);
    if (workspaces && workspaces.length > 0) {
      workspaceSlug = workspaces[0].slug;
    }
  } catch {
    // Falls back to static link if Supabase env vars not filled yet
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚀</div>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
        Notion Plus Open-Source Alternative
      </h1>
      <p
        style={{
          color: 'var(--color-text-secondary)',
          maxWidth: '540px',
          marginBottom: '28px',
          fontSize: '16px',
        }}
      >
        A fast, minimal, self-hosted workspace with infinite nested pages, block editor,
        relational multi-view databases, and native English/Arabic RTL support.
      </p>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Link
          href={`/${workspaceSlug}/welcome`}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--color-accent-blue)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          Open Workspace
        </Link>
        <Link
          href="/auth/login"
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--color-canvas-secondary)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
