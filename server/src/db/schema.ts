/**
 * SQLite database schema using Drizzle ORM
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Flows table - stores Polymerase flow graphs
 */
export const flows = sqliteTable('flows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  version: text('version').notNull().default('1.0.0'),
  jsonContent: text('json_content').notNull(), // Stores the full JSON graph
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  metadata: text('metadata'), // Optional JSON metadata
});

/**
 * Executions table - stores execution history
 */
export const executions = sqliteTable('executions', {
  id: text('id').primaryKey(),
  flowId: text('flow_id').notNull().references(() => flows.id),
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'error' | 'cancelled'
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  result: text('result'), // JSON result
  error: text('error'), // Error message if failed
});

/**
 * Schematics table - stores generated schematics
 */
export const schematics = sqliteTable('schematics', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  flowId: text('flow_id').references(() => flows.id),
  executionId: text('execution_id').references(() => executions.id),
  format: text('format').notNull(), // 'litematic' | 'schematic' | 'schem' | 'nbt'
  data: text('data').notNull(), // Base64 encoded schematic data
  metadata: text('metadata'), // JSON metadata (dimensions, block count, etc.)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Type exports for use in the application
export type Flow = typeof flows.$inferSelect;
export type NewFlow = typeof flows.$inferInsert;
export type Execution = typeof executions.$inferSelect;
export type NewExecution = typeof executions.$inferInsert;
export type Schematic = typeof schematics.$inferSelect;
export type NewSchematic = typeof schematics.$inferInsert;

