/**
 * Worker module exports
 * Provides both browser WebWorker and Bun Worker Thread support
 */

export { WorkerClient, type WorkerClientOptions } from './WorkerClient.js';
export { BunWorkerClient, type BunWorkerClientOptions } from './BunWorkerClient.js';
export { MessageHandler } from './MessageHandler.js';
export { createContextProviders, createMinimalContextProviders } from './contextProviders.js';

// Re-export types
export type { WorkerMessage, WorkerConfig, WorkerState } from '../types/index.js';
export { MESSAGE_TYPES, WORKER_STATES, DEFAULT_WORKER_CONFIG } from '../types/index.js';

