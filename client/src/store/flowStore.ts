/**
 * Zustand store for managing flow state with execution cache
 */

import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type { FlowData, IODefinition, NodeData } from '@polymerase/core';

// ============================================================================
// Types
// ============================================================================

export type NodeExecutionStatus = 'idle' | 'pending' | 'running' | 'completed' | 'error' | 'stale';

export type InputWidgetType = 
  | 'number'        // Standard number input
  | 'slider'        // Range slider
  | 'text'          // Single line text
  | 'textarea'      // Multi-line text
  | 'boolean'       // Toggle switch
  | 'select'        // Dropdown
  | 'color';        // Color picker

export interface NodeExecutionCache {
  status: NodeExecutionStatus;
  output?: unknown;
  error?: string;
  lastExecutedAt?: number;
  inputHash?: string;  // Hash of inputs to detect changes
}

export interface FlowNode extends Node {
  data: {
    label?: string;
    code?: string;
    value?: unknown;
    io?: IODefinition;
    config?: Record<string, unknown>;
    // Input node specific
    dataType?: 'number' | 'string' | 'boolean';  // The actual data type
    inputType?: 'number' | 'text' | 'boolean';   // Legacy support
    widgetType?: InputWidgetType;                 // How to display/input
    isConstant?: boolean;      // If true, not exposed in API
    min?: number;              // For number/slider
    max?: number;              // For number/slider
    step?: number;             // For number/slider
    options?: string[];        // For select
    placeholder?: string;      // For text inputs
    description?: string;      // Input description
    // Viewer node specific
    passthrough?: boolean;     // If true, viewer passes value to output
    // File input/output node specific
    fileData?: unknown;        // Loaded file data (DataValue)
    fileName?: string;         // Original filename
    customFileName?: string;   // Custom output filename
    acceptedTypes?: string[];  // Accepted data categories for file input
    outputFormat?: string;     // Override output format
  };
}

interface FlowState {
  // Flow data
  flowId: string | null;
  flowName: string;
  nodes: FlowNode[];
  edges: Edge[];
  
  // Execution state
  nodeCache: Record<string, NodeExecutionCache>;
  executingNodeId: string | null;
  isExecuting: boolean;
  executionLogs: string[];
  
  // UI state
  selectedNodeId: string | null;
  
  // Actions
  setFlowId: (id: string | null) => void;
  setFlowName: (name: string) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange<FlowNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  // Node operations
  addNode: (node: FlowNode) => void;
  updateNodeData: (nodeId: string, data: Partial<FlowNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  
  // Execution cache
  setNodeExecutionStatus: (nodeId: string, status: NodeExecutionStatus, output?: unknown, error?: string) => void;
  setNodeOutput: (nodeId: string, output: unknown) => void;
  invalidateNode: (nodeId: string) => void;
  invalidateDownstream: (nodeId: string) => void;
  clearAllCache: () => void;
  getNodeCache: (nodeId: string) => NodeExecutionCache | undefined;
  isEdgeReady: (edgeId: string) => boolean;
  
  // Execution
  setIsExecuting: (isExecuting: boolean) => void;
  setExecutingNodeId: (nodeId: string | null) => void;
  addExecutionLog: (log: string) => void;
  clearExecutionLogs: () => void;
  
  // Flow operations
  loadFlow: (flow: FlowData) => void;
  exportFlow: () => FlowData;
  clearFlow: () => void;
  
  // Input node helpers
  getExposedInputs: () => FlowNode[];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get all downstream nodes from a given node
 */
function getDownstreamNodes(nodeId: string, edges: Edge[]): Set<string> {
  const downstream = new Set<string>();
  const queue = [nodeId];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const outgoingEdges = edges.filter(e => e.source === current);
    
    for (const edge of outgoingEdges) {
      if (!downstream.has(edge.target)) {
        downstream.add(edge.target);
        queue.push(edge.target);
      }
    }
  }
  
  return downstream;
}

// ============================================================================
// Store
// ============================================================================

const initialNodes: FlowNode[] = [];
const initialEdges: Edge[] = [];

export const useFlowStore = create<FlowState>((set, get) => ({
  // Initial state
  flowId: null,
  flowName: 'Untitled Flow',
  nodes: initialNodes,
  edges: initialEdges,
  nodeCache: {},
  executingNodeId: null,
  selectedNodeId: null,
  isExecuting: false,
  executionLogs: [],

  // Setters
  setFlowId: (id) => set({ flowId: id }),
  setFlowName: (name) => set({ flowName: name }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // React Flow handlers
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  onConnect: (connection) => {
    // When a new connection is made, invalidate the target node
    const targetId = connection.target;
    if (targetId) {
      get().invalidateNode(targetId);
    }
    
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  // Node operations
  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
      nodeCache: {
        ...get().nodeCache,
        [node.id]: { status: 'idle' },
      },
    });
  },

  updateNodeData: (nodeId, data) => {
    const state = get();
    const node = state.nodes.find(n => n.id === nodeId);
    const isInputNode = node?.type === 'input' || node?.type?.includes('_input');
    
    // For input nodes, update the cache with the new value immediately
    // For code nodes, invalidate on code changes
    const shouldInvalidate = 'code' in data && !isInputNode;
    
    set({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
    
    // For input nodes with value changes, update cache and invalidate downstream
    if (isInputNode && 'value' in data) {
      get().setNodeOutput(nodeId, { output: data.value });
      get().invalidateDownstream(nodeId);
    } else if (shouldInvalidate) {
      get().invalidateNode(nodeId);
    }
  },

  deleteNode: (nodeId) => {
    const { nodeCache } = get();
    const newCache = { ...nodeCache };
    delete newCache[nodeId];
    
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      nodeCache: newCache,
    });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  // Execution cache
  setNodeExecutionStatus: (nodeId, status, output, error) => {
    set({
      nodeCache: {
        ...get().nodeCache,
        [nodeId]: {
          ...get().nodeCache[nodeId],
          status,
          output: output !== undefined ? output : get().nodeCache[nodeId]?.output,
          error,
          lastExecutedAt: status === 'completed' ? Date.now() : get().nodeCache[nodeId]?.lastExecutedAt,
        },
      },
    });
  },
  
  setNodeOutput: (nodeId, output) => {
    set({
      nodeCache: {
        ...get().nodeCache,
        [nodeId]: {
          ...get().nodeCache[nodeId],
          status: 'completed',
          output,
          lastExecutedAt: Date.now(),
        },
      },
    });
  },
  
  invalidateNode: (nodeId) => {
    const state = get();
    const downstream = getDownstreamNodes(nodeId, state.edges);
    
    const newCache = { ...state.nodeCache };
    
    // Mark this node as stale
    newCache[nodeId] = {
      ...newCache[nodeId],
      status: 'stale',
    };
    
    // Mark all downstream nodes as stale
    for (const downstreamId of downstream) {
      newCache[downstreamId] = {
        ...newCache[downstreamId],
        status: 'stale',
      };
    }
    
    set({ nodeCache: newCache });
  },
  
  invalidateDownstream: (nodeId) => {
    const state = get();
    const downstream = getDownstreamNodes(nodeId, state.edges);
    
    const newCache = { ...state.nodeCache };
    
    for (const downstreamId of downstream) {
      newCache[downstreamId] = {
        ...newCache[downstreamId],
        status: 'stale',
      };
    }
    
    set({ nodeCache: newCache });
  },
  
  clearAllCache: () => {
    const newCache: Record<string, NodeExecutionCache> = {};
    for (const node of get().nodes) {
      newCache[node.id] = { status: 'idle' };
    }
    set({ nodeCache: newCache });
  },
  
  getNodeCache: (nodeId) => {
    return get().nodeCache[nodeId];
  },
  
  isEdgeReady: (edgeId) => {
    const state = get();
    const edge = state.edges.find(e => e.id === edgeId);
    if (!edge) return false;
    
    const sourceCache = state.nodeCache[edge.source];
    return sourceCache?.status === 'completed';
  },

  // Execution
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setExecutingNodeId: (nodeId) => set({ executingNodeId: nodeId }),
  
  addExecutionLog: (log) => {
    set({
      executionLogs: [...get().executionLogs, `[${new Date().toLocaleTimeString()}] ${log}`],
    });
  },
  
  clearExecutionLogs: () => set({ executionLogs: [] }),

  // Flow operations
  loadFlow: (flow) => {
    const newCache: Record<string, NodeExecutionCache> = {};
    for (const node of flow.nodes) {
      newCache[node.id] = { status: 'idle' };
    }
    
    set({
      flowId: flow.id,
      flowName: flow.name,
      nodes: flow.nodes.map((node: NodeData) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: flow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
      nodeCache: newCache,
      executionLogs: [],
    });
  },

  exportFlow: () => {
    const state = get();
    return {
      id: state.flowId || crypto.randomUUID(),
      name: state.flowName,
      version: '1.0.0',
      nodes: state.nodes.map((node) => ({
        id: node.id,
        type: node.type as NodeData['type'],
        position: node.position,
        data: node.data,
      })),
      edges: state.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? undefined,
        targetHandle: edge.targetHandle ?? undefined,
      })),
      createdAt: Date.now(),
    };
  },

  clearFlow: () => {
    set({
      flowId: null,
      flowName: 'Untitled Flow',
      nodes: [],
      edges: [],
      nodeCache: {},
      selectedNodeId: null,
      executionLogs: [],
    });
  },
  
  // Input node helpers
  getExposedInputs: () => {
    const state = get();
    return state.nodes.filter(
      node => node.type?.includes('input') && !node.data.isConstant
    );
  },
}));
