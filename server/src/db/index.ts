/**
 * Database connection and setup
 */

import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema.js';

// Database file path
const DB_PATH = process.env.DATABASE_PATH || './data/polymerase.db';

// Ensure data directory exists
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Create SQLite connection
const sqlite = new Database(DB_PATH);

// Enable WAL mode for better performance
sqlite.exec('PRAGMA journal_mode = WAL;');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export schema for use elsewhere
export * from './schema.js';

/**
 * Initialize database tables
 */
export function initializeDatabase() {
  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS flows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0.0',
      json_content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      flow_id TEXT NOT NULL REFERENCES flows(id),
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      result TEXT,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS schematics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flow_id TEXT REFERENCES flows(id),
      execution_id TEXT REFERENCES executions(id),
      format TEXT NOT NULL,
      data TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_executions_flow_id ON executions(flow_id);
    CREATE INDEX IF NOT EXISTS idx_schematics_flow_id ON schematics(flow_id);
    CREATE INDEX IF NOT EXISTS idx_schematics_execution_id ON schematics(execution_id);
  `);

  // Database initialized
}

/**
 * Close database connection
 */
export function closeDatabase() {
  sqlite.close();
}

