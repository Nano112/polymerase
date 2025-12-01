/**
 * Editor - Main flow editor component
 */

import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '../../store/flowStore';
import { nodeTypes } from '../nodes';
import { Toolbar } from './Toolbar';
import { CodePanel } from './CodePanel';
import { ExecutionPanel } from './ExecutionPanel';

export function Editor() {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    flowName,
    setFlowName,
  } = useFlowStore();

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  return (
    <div className="h-screen w-screen bg-slate-950 flex">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#64748b', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#334155" gap={16} size={1} />
          <Controls className="!bg-slate-800 !border-slate-700 !rounded-lg" />
          <MiniMap
            className="!bg-slate-900 !border-slate-700 !rounded-lg"
            nodeColor={(node) => {
              switch (node.type) {
                case 'code': return '#10b981';
                case 'number_input':
                case 'text_input':
                case 'boolean_input':
                case 'static_input': return '#8b5cf6';
                case 'schematic_input': return '#f97316';
                case 'schematic_output': return '#06b6d4';
                case 'schematic_viewer': return '#ec4899';
                default: return '#64748b';
              }
            }}
            maskColor="rgba(15, 23, 42, 0.8)"
          />
          
          {/* Title Panel */}
          <Panel position="top-center">
            <div className="bg-slate-900/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700">
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="bg-transparent text-white font-semibold text-lg focus:outline-none text-center min-w-[200px]"
                placeholder="Untitled Flow"
              />
            </div>
          </Panel>
        </ReactFlow>

        {/* Node Toolbar */}
        <Toolbar />
      </div>

      {/* Right Sidebar */}
      <div className="w-[400px] bg-slate-900 border-l border-slate-700 flex flex-col">
        {/* Code/Properties Panel */}
        <div className="flex-1 border-b border-slate-700 overflow-hidden">
          <CodePanel />
        </div>

        {/* Execution Panel */}
        <div className="h-[280px]">
          <ExecutionPanel />
        </div>
      </div>
    </div>
  );
}

