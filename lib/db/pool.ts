/**
 * Drop-in replacement for pg Pool that works on Vercel (IPv4 only).
 *
 * On Vercel: routes SQL through Supabase's exec_sql RPC function via HTTPS (IPv4).
 * Locally: uses pg Pool directly (supports IPv6).
 *
 * Usage: import { pool } from '@/lib/db/pool';
 *        const { rows } = await pool.query('SELECT * FROM foo WHERE id = $1', [42]);
 */

import { Pool } from 'pg';

const isVercel = process.env.VERCEL === '1';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nhjwpmfcpbfbzcaookkw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Direct pg Pool for local development
const pgPool = !isVercel
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

/**
 * Execute a SQL query via Supabase REST API (IPv4 compatible).
 * Substitutes $1, $2, etc. with actual parameter values before sending,
 * since the exec_sql function receives the final query string.
 */
async function queryViaRest(text: string, params?: unknown[]): Promise<{ rows: any[]; rowCount: number }> {
  // Substitute $N parameters with properly escaped values
  let query = text;
  if (params && params.length > 0) {
    params.forEach((param, i) => {
      const placeholder = `$${i + 1}`;
      let value: string;
      if (param === null || param === undefined) {
        value = 'NULL';
      } else if (typeof param === 'number') {
        value = String(param);
      } else if (typeof param === 'boolean') {
        value = param ? 'TRUE' : 'FALSE';
      } else {
        // Escape single quotes for SQL
        value = `'${String(param).replace(/'/g, "''")}'`;
      }
      // Replace only the exact placeholder (not $10 when replacing $1)
      query = query.replace(new RegExp(`\\$${i + 1}(?!\\d)`, 'g'), value);
    });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Supabase query error (${res.status}): ${error}`);
  }

  const rows = await res.json();
  return { rows: Array.isArray(rows) ? rows : [], rowCount: Array.isArray(rows) ? rows.length : 0 };
}

export const pool = {
  async query(text: string, params?: unknown[]): Promise<{ rows: any[]; rowCount: number }> {
    if (pgPool) {
      const result = await pgPool.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    }
    return queryViaRest(text, params);
  },
};
