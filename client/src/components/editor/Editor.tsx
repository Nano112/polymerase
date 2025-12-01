/**
 * Editor - Main flow editor component with execution state visualization
 */

import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { 
  FolderOpen, 
  Play, 
  Settings,
  Zap,
  Terminal,
  Code,
  RotateCcw,
} from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import { Toolbar } from './Toolbar';
import { CodePanel } from './CodePanel';
import { ExecutionPanel } from './ExecutionPanel';
import { NodePropertiesPanel } from './NodePropertiesPanel';
import { FlowManager } from './FlowManager';
import { Modal } from '../ui/Modal';

export function Editor() {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    flowName,
    flowId,
    setFlowName,
    selectedNodeId,
    selectNode,
    deleteNode,
    clearAllCache,
    nodeCache,
    isExecuting,
  } = useFlowStore();

  // Modal states
  const [showFlowManager, setShowFlowManager] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showNodeProperties, setShowNodeProperties] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  // Handle node double-click to open editor
  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: { id: string; type?: string }) => {
    // First select the node
    selectNode(node.id);
    // Then open the appropriate editor
    setEditingNodeId(node.id);
    if (node.type === 'code') {
      setShowCodeEditor(true);
    } else {
      setShowNodeProperties(true);
    }
  }, [selectNode]);

  // Handle keyboard shortcuts
  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedNodeId && !showCodeEditor && !showNodeProperties) {
        deleteNode(selectedNodeId);
      }
    }
    if (event.key === 'Escape') {
      selectNode(null);
    }
  }, [selectedNodeId, deleteNode, selectNode, showCodeEditor, showNodeProperties]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  
  // Calculate cache stats
  const completedCount = Object.values(nodeCache).filter(c => c.status === 'completed').length;
  const totalNodes = nodes.length;

  return (
    <div 
      className="h-screen w-screen bg-neutral-950 flex flex-col"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Top Bar */}
      <div className="h-14 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800/50 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left: Flow info */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFlowManager(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm">Flows</span>
          </button>
          
          <div className="h-6 w-px bg-neutral-800" />
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="bg-transparent text-white font-semibold text-sm focus:outline-none border-b border-transparent hover:border-neutral-700 focus:border-neutral-600 px-1 min-w-[150px]"
              placeholder="Untitled Flow"
            />
            {flowId && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Center: Execution status */}
        <div className="flex items-center gap-3">
          {totalNodes > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${completedCount === totalNodes ? 'bg-green-500' : 'bg-neutral-600'}`} />
                <span className="text-xs text-neutral-400">
                  {completedCount}/{totalNodes} computed
                </span>
              </div>
              {completedCount > 0 && (
                <button
                  onClick={clearAllCache}
                  className="p-1 rounded hover:bg-neutral-700/50 text-neutral-500 hover:text-neutral-300 transition-colors"
                  title="Clear all cached results"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {selectedNode && (
            <button
              onClick={() => {
                // Use selectedNode.id directly to ensure we have the correct ID
                setEditingNodeId(selectedNode.id);
                if (selectedNode.type === 'code') {
                  setShowCodeEditor(true);
                } else {
                  setShowNodeProperties(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
            >
              {selectedNode.type === 'code' ? (
                <Code className="w-4 h-4" />
              ) : (
                <Settings className="w-4 h-4" />
              )}
              <span className="text-sm">Edit Node</span>
            </button>
          )}
          
          <button
            onClick={() => setShowExecution(true)}
            disabled={isExecuting}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all
              ${isExecuting 
                ? 'bg-amber-600/80 cursor-wait' 
                : 'bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500/80 hover:to-emerald-500/80'
              }
            `}
          >
            <Play className="w-4 h-4" />
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeClick={(_event, node) => selectNode(node.id)}
          onPaneClick={() => selectNode(null)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          defaultEdgeOptions={{
            type: 'data',
            animated: false,
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#262626" gap={16} size={1} />
          <Controls className="!bg-neutral-900 !border-neutral-800 !rounded-xl !shadow-xl" />
          <MiniMap
            className="!bg-neutral-900 !border-neutral-800 !rounded-xl !shadow-xl"
            nodeColor={(node) => {
              const cache = nodeCache[node.id];
              if (cache?.status === 'completed') return '#22c55e';
              if (cache?.status === 'running') return '#f59e0b';
              if (cache?.status === 'error') return '#ef4444';
              
              switch (node.type) {
                case 'code': return '#22c55e40';
                case 'input':
                case 'number_input':
                case 'text_input':
                case 'boolean_input':
                case 'select_input': return '#a855f7';
                case 'viewer': return '#ec4899';
                case 'schematic_input': return '#f97316';
                case 'schematic_output': return '#06b6d4';
                case 'schematic_viewer': return '#ec4899';
                default: return '#525252';
              }
            }}
            maskColor="rgba(10, 10, 10, 0.85)"
          />
          
          {/* Help Panel */}
          <Panel position="bottom-center">
            <div className="bg-neutral-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-neutral-800/50 text-xs text-neutral-500 flex items-center gap-4">
              <span>Double-click to edit</span>
              <span className="text-neutral-700">•</span>
              <span>Delete to remove</span>
              <span className="text-neutral-700">•</span>
              <span>Drag handles to connect</span>
              <span className="text-neutral-700">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Data ready
              </span>
            </div>
          </Panel>
        </ReactFlow>

        {/* Node Toolbar */}
        <Toolbar />
      </div>

      {/* Modals */}
      <FlowManager 
        isOpen={showFlowManager} 
        onClose={() => setShowFlowManager(false)} 
      />

      {/* Code Editor Modal */}
      <Modal
        isOpen={showCodeEditor}
        onClose={() => {
          setShowCodeEditor(false);
          setEditingNodeId(null);
        }}
        title="Code Editor"
        subtitle="Edit your Synthase script"
        icon={<Zap className="w-5 h-5" />}
        iconColor="text-green-400"
        size="xl"
      >
        {editingNodeId && <CodePanel nodeId={editingNodeId} />}
      </Modal>

      {/* Node Properties Modal */}
      <Modal
        isOpen={showNodeProperties}
        onClose={() => {
          setShowNodeProperties(false);
          setEditingNodeId(null);
        }}
        title="Node Properties"
        subtitle="Configure node settings"
        icon={<Settings className="w-5 h-5" />}
        iconColor="text-purple-400"
        size="md"
      >
        {editingNodeId && <NodePropertiesPanel nodeId={editingNodeId} />}
      </Modal>

      {/* Execution Modal */}
      <Modal
        isOpen={showExecution}
        onClose={() => setShowExecution(false)}
        title="Execute Flow"
        subtitle="Run and debug your flow"
        icon={<Terminal className="w-5 h-5" />}
        iconColor="text-cyan-400"
        size="lg"
      >
        <ExecutionPanel />
      </Modal>
    </div>
  );
}
