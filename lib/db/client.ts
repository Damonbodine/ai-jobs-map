import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Use same env check fallback behavior
const connectionString = process.env.DATABASE_URL;

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in production');
  }
  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} else {
  // In development, cache client connection to prevent exhausting postgres clients on hot-reloads
  if (!globalForDb.pool) {
    const devDbUrl = connectionString || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    globalForDb.pool = new Pool({
      connectionString: devDbUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  pool = globalForDb.pool;
}

export const db = drizzle(pool, { schema });
