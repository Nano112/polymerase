/**
 * Zustand store for managing flow state
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

export interface FlowNode extends Node {
  data: {
    label?: string;
    code?: string;
    value?: unknown;
    io?: IODefinition;
    config?: Record<string, unknown>;
    inputType?: 'number' | 'text' | 'boolean';
  };
}

interface FlowState {
  // Flow data
  flowId: string | null;
  flowName: string;
  nodes: FlowNode[];
  edges: Edge[];
  
  // UI state
  selectedNodeId: string | null;
  isExecuting: boolean;
  executionLogs: string[];
  
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
  
  // Execution
  setIsExecuting: (isExecuting: boolean) => void;
  addExecutionLog: (log: string) => void;
  clearExecutionLogs: () => void;
  
  // Flow operations
  loadFlow: (flow: FlowData) => void;
  exportFlow: () => FlowData;
  clearFlow: () => void;
}

const initialNodes: FlowNode[] = [];
const initialEdges: Edge[] = [];

export const useFlowStore = create<FlowState>((set, get) => ({
  // Initial state
  flowId: null,
  flowName: 'Untitled Flow',
  nodes: initialNodes,
  edges: initialEdges,
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
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  // Node operations
  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  // Execution
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  
  addExecutionLog: (log) => {
    set({
      executionLogs: [...get().executionLogs, `[${new Date().toLocaleTimeString()}] ${log}`],
    });
  },
  
  clearExecutionLogs: () => set({ executionLogs: [] }),

  // Flow operations
  loadFlow: (flow) => {
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
      selectedNodeId: null,
      executionLogs: [],
    });
  },
}));

