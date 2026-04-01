import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/pool';

let tableReady = false;

async function ensureAnalyticsTable() {
  if (tableReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_funnel_events (
      id BIGSERIAL PRIMARY KEY,
      event_name TEXT NOT NULL,
      session_id TEXT,
      path TEXT,
      properties JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  tableReady = true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventName = String(body?.eventName || '').trim();
    const sessionId = body?.sessionId ? String(body.sessionId) : null;
    const path = body?.path ? String(body.path) : request.nextUrl.pathname;
    const properties = body?.properties && typeof body.properties === 'object' ? body.properties : {};

    if (!eventName) {
      return NextResponse.json({ ok: false, error: 'eventName is required' }, { status: 400 });
    }

    try {
      await ensureAnalyticsTable();
      await pool.query(
        `INSERT INTO ai_funnel_events (event_name, session_id, path, properties)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [eventName, sessionId, path, JSON.stringify(properties)]
      );
    } catch (error) {
      console.error('Analytics insert failed:', error);
      return NextResponse.json({ ok: true, stored: false }, { status: 202 });
    }

    return NextResponse.json({ ok: true, stored: true });
  } catch (error) {
    console.error('Analytics route error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
