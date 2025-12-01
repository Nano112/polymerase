import { z } from 'zod';

// ============================================================================
// Core Flow Types
// ============================================================================

/**
 * IO Definition for script inputs/outputs
 * Extracted from Synthase validation
 */
export interface IODefinition {
  inputs: Record<string, IOPort>;
  outputs: Record<string, IOPort>;
}

export interface IOPort {
  name?: string;
  type: string;
  required?: boolean;
  default?: unknown;
  description?: string;
  options?: string[];  // For select inputs
  min?: number;        // For number inputs
  max?: number;        // For number inputs
  step?: number;       // For number inputs
}

/**
 * Position in 2D space for node placement
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Node data stored in the flow graph
 */
export interface NodeData {
  id: string;
  type: NodeType;
  position: Position;
  data: {
    label?: string;
    code?: string;           // For code nodes (Synthase scripts)
    value?: unknown;         // For static input nodes
    io?: IODefinition;       // Cached IO from static analysis
    config?: Record<string, unknown>; // Node-specific config
  };
}

/**
 * Edge connecting two nodes
 */
export interface EdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;    // Output handle on source node
  targetHandle?: string;    // Input handle on target node
}

/**
 * Complete flow definition stored in SQLite
 */
export interface FlowData {
  id: string;
  name: string;
  version: string;
  nodes: NodeData[];
  edges: EdgeData[];
  createdAt: number;
  updatedAt?: number;
  metadata?: FlowMetadata;
}

export interface FlowMetadata {
  description?: string;
  author?: string;
  tags?: string[];
}

// ============================================================================
// Node Types
// ============================================================================

export type NodeType = 
  | 'code'              // Synthase script execution
  | 'schematic_input'   // Load schematic file
  | 'schematic_output'  // Export schematic file
  | 'schematic_viewer'  // 3D preview of schematic
  | 'static_input'      // Static value input
  | 'number_input'      // Number slider/input
  | 'text_input'        // Text field
  | 'boolean_input'     // Toggle switch
  | 'select_input'      // Dropdown selection
  | 'comment';          // Non-functional comment node

// ============================================================================
// Execution Types
// ============================================================================

export interface ExecutionResult {
  success: boolean;
  result?: Record<string, unknown>;
  schematics?: Record<string, SchematicData>;
  hasSchematic?: boolean;
  executionTime?: number;
  error?: ExecutionError;
}

export interface ExecutionError {
  message: string;
  type: string;
  stack?: string;
  nodeId?: string;
}

export interface NodeExecutionState {
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  startTime?: number;
  endTime?: number;
  output?: unknown;
  error?: ExecutionError;
}

export interface FlowExecutionState {
  flowId: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  startTime: number;
  endTime?: number;
  nodeStates: Record<string, NodeExecutionState>;
  finalOutput?: Record<string, unknown>;
}

// ============================================================================
// Schematic Types
// ============================================================================

export interface SchematicData {
  format: 'litematic' | 'schematic' | 'schem' | 'nbt' | 'mock';
  data: Uint8Array | string;
  metadata?: SchematicMetadata;
}

export interface SchematicMetadata {
  name?: string;
  author?: string;
  description?: string;
  dimensions?: { x: number; y: number; z: number };
  blockCount?: number;
  createdAt?: number;
}

/**
 * Type guard to check if a value is a SchematicData object
 */
export function isSchematicData(value: unknown): value is SchematicData {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  
  // Check for required SchematicData properties
  const validFormats = ['litematic', 'schematic', 'schem', 'nbt', 'mock'];
  const hasValidFormat = typeof obj.format === 'string' && validFormats.includes(obj.format);
  const hasData = obj.data instanceof Uint8Array || typeof obj.data === 'string';
  
  return hasValidFormat && hasData;
}

// ============================================================================
// Worker Communication Types
// ============================================================================

export const MESSAGE_TYPES = {
  // Initialization
  INITIALIZE: 'INITIALIZE',
  INITIALIZE_SUCCESS: 'INITIALIZE_SUCCESS',
  INITIALIZE_ERROR: 'INITIALIZE_ERROR',
  
  // Execution
  EXECUTE_SCRIPT: 'EXECUTE_SCRIPT',
  EXECUTE_FLOW: 'EXECUTE_FLOW',
  EXECUTION_SUCCESS: 'EXECUTION_SUCCESS',
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  EXECUTION_PROGRESS: 'EXECUTION_PROGRESS',
  
  // Validation
  VALIDATE_SCRIPT: 'VALIDATE_SCRIPT',
  VALIDATION_RESULT: 'VALIDATION_RESULT',
  
  // Node events
  NODE_START: 'NODE_START',
  NODE_FINISH: 'NODE_FINISH',
  NODE_ERROR: 'NODE_ERROR',
  
  // Utilities
  GET_CONTEXT_PROVIDERS: 'GET_CONTEXT_PROVIDERS',
  CONTEXT_PROVIDERS_RESULT: 'CONTEXT_PROVIDERS_RESULT',
  
  // Cancellation
  CANCEL_EXECUTION: 'CANCEL_EXECUTION',
  EXECUTION_CANCELLED: 'EXECUTION_CANCELLED',
  
  // General
  ERROR: 'ERROR',
  READY: 'READY',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

export const WORKER_STATES = {
  INITIALIZING: 'initializing',
  READY: 'ready',
  EXECUTING: 'executing',
  ERROR: 'error',
} as const;

export type WorkerState = typeof WORKER_STATES[keyof typeof WORKER_STATES];

export interface WorkerMessage<T = unknown> {
  type: MessageType;
  payload: T;
  id?: number;
  error?: string;
}

export interface WorkerConfig {
  timeout?: number;
  maxSchematicSize?: number;
  progressUpdateInterval?: number;
  customContextProviders?: Record<string, unknown>;
}

export const DEFAULT_WORKER_CONFIG: WorkerConfig = {
  timeout: 120000, // 2 minutes
  maxSchematicSize: 50 * 1024 * 1024, // 50MB
  progressUpdateInterval: 100,
};

// ============================================================================
// Engine Events
// ============================================================================

export type EngineEvents = {
  'flow:start': { flowId: string };
  'flow:finish': { flowId: string; result: FlowExecutionState };
  'flow:error': { flowId: string; error: ExecutionError };
  'flow:cancelled': { flowId: string };
  
  'node:start': { nodeId: string; flowId: string };
  'node:finish': { nodeId: string; flowId: string; output: unknown };
  'node:error': { nodeId: string; flowId: string; error: ExecutionError };
  
  'progress': { message: string; percent?: number; data?: unknown };
  'log': { level: 'info' | 'warn' | 'error' | 'debug'; message: string };
  
  'worker:ready': Record<string, never>;
  'worker:error': { error: Error };
};

// ============================================================================
// Validation Schemas (Zod)
// ============================================================================

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const IOPortSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean().optional(),
  default: z.unknown().optional(),
  description: z.string().optional(),
});

export const IODefinitionSchema = z.object({
  inputs: z.record(IOPortSchema),
  outputs: z.record(IOPortSchema),
});

export const NodeDataSchema = z.object({
  id: z.string(),
  type: z.enum([
    'code', 'schematic_input', 'schematic_output', 'schematic_viewer',
    'static_input', 'number_input', 'text_input', 'boolean_input',
    'select_input', 'comment'
  ]),
  position: PositionSchema,
  data: z.object({
    label: z.string().optional(),
    code: z.string().optional(),
    value: z.unknown().optional(),
    io: IODefinitionSchema.optional(),
    config: z.record(z.unknown()).optional(),
  }),
});

export const EdgeDataSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const FlowMetadataSchema = z.object({
  description: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const FlowDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  nodes: z.array(NodeDataSchema),
  edges: z.array(EdgeDataSchema),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  metadata: FlowMetadataSchema.optional(),
});

// Type guard utilities
export function isCodeNode(node: NodeData): boolean {
  return node.type === 'code';
}

export function isInputNode(node: NodeData): boolean {
  return node.type.endsWith('_input');
}

export function isSchematicNode(node: NodeData): boolean {
  return node.type.startsWith('schematic_');
}

