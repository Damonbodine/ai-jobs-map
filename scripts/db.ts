/**
 * Shared DB access for one-off scripts. Loads .env.local (without overriding
 * vars already set on the command line), then exposes a Drizzle client over
 * the same schema the app uses.
 *
 * Usage: import { db, pool, schema } from "./db"
 * Call `await pool.end()` at the end of the script so the process exits.
 */
import fs from "node:fs"
import path from "node:path"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "../lib/db/schema"

const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  // Built-in since Node 21 — does not override already-set variables.
  process.loadEnvFile(envPath)
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Check .env.local.")
}

export const pool = new Pool({ connectionString, max: 5 })
export const db = drizzle(pool, { schema })
export { schema }
