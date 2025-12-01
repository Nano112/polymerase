/**
 * Polymerase Server
 * Hono + Bun + SQLite backend for the Polymerase execution engine
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { ApiResponse } from 'shared/dist';
import { initializeDatabase } from './db/index.js';
import flowsRouter from './routes/flows.js';
import executeRouter from './routes/execute.js';

// Initialize database
initializeDatabase();

export const app = new Hono()
	// Middleware
	.use(cors())
	.use(logger())

	// Health check
	.get('/', (c) => {
		return c.json({
			name: 'Polymerase Server',
			version: '0.5.0',
			status: 'running',
		});
	})

	// Legacy hello endpoint for BHVR compatibility
	.get('/hello', async (c) => {
		const data: ApiResponse = {
			message: 'Hello from Polymerase!',
			success: true,
		};
		return c.json(data, { status: 200 });
	})

	// API Routes
	.route('/api/flows', flowsRouter)
	.route('/api/execute', executeRouter);

// Export for Hono client type inference
export type AppType = typeof app;

// Bun server configuration
const port = Number(process.env.PORT) || 3001;

console.log(`Polymerase Server starting on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
