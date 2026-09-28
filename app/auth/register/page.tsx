'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Failed to sign up.');
      setLoading(false);
      return;
    }

    // Auto create default workspace
    const slug = (workspaceName || 'workspace')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

    const { data: wsData, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: workspaceName || 'My Workspace',
        slug,
        icon: '🚀',
        created_by: authData.user.id,
      })
      .select()
      .single();

    if (wsError || !wsData) {
      setError(wsError?.message || 'Failed to initialize workspace.');
      setLoading(false);
      return;
    }

    // Assign owner
    await supabase.from('workspace_members').insert({
      workspace_id: wsData.id,
      user_id: authData.user.id,
      email,
      role: 'owner',
    });

    // Create initial page
    const { data: pageData } = await supabase
      .from('pages')
      .insert({
        workspace_id: wsData.id,
        title: 'Getting Started',
        icon: '📄',
        position: 1000,
      })
      .select()
      .single();

    if (pageData) {
      await supabase.from('blocks').insert({
        page_id: pageData.id,
        type: 'paragraph',
        content: { text: 'Welcome to your private Notion Plus workspace!' },
        position: 1000,
      });

      router.push(`/${wsData.slug}/${pageData.id}`);
    } else {
      router.push('/');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--color-canvas)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '32px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-canvas)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🚀</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Create your workspace</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Fast, self-hosted Notion Plus alternative
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-accent-red-subtle)',
              color: 'var(--color-accent-red)',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
              Workspace Name
            </label>
            <input
              type="text"
              required
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Acme Corp"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-canvas)',
                color: 'var(--color-text)',
                outline: 'none',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-canvas)',
                color: 'var(--color-text)',
                outline: 'none',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-canvas)',
                color: 'var(--color-text)',
                outline: 'none',
                fontSize: '14px',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-accent-blue)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Get Started'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--color-accent-blue)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
