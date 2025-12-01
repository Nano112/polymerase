/**
 * CodeNode - Synthase script execution node with aligned input/output labels
 */

import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap, Code, CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { IODefinition } from '@polymerase/core';
import { useFlowStore, type NodeExecutionStatus } from '../../store/flowStore';

interface CodeNodeData {
  label?: string;
  code?: string;
  io?: IODefinition;
}

const StatusIndicator = ({ status }: { status: NodeExecutionStatus }) => {
  switch (status) {
    case 'completed':
      return (
        <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
          <CheckCircle className="w-3 h-3" />
          <span>Ready</span>
        </div>
      );
    case 'running':
      return (
        <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Running</span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
          <AlertCircle className="w-3 h-3" />
          <span>Error</span>
        </div>
      );
    case 'stale':
      return (
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded border border-neutral-500/20">
          <Clock className="w-3 h-3" />
          <span>Stale</span>
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </div>
      );
    default:
      return null;
  }
};

const CodeNode = memo(({ id, data, selected }: NodeProps & { data: CodeNodeData }) => {
  const selectNode = useFlowStore((state) => state.selectNode);
  const nodeCache = useFlowStore((state) => state.nodeCache);
  const executingNodeId = useFlowStore((state) => state.executingNodeId);
  const edges = useFlowStore((state) => state.edges);
  const [isHovered, setIsHovered] = useState(false);
  
  // Refs for measuring label positions
  const inputLabelsRef = useRef<HTMLDivElement>(null);
  const outputLabelsRef = useRef<HTMLDivElement>(null);
  const [inputLabelOffsets, setInputLabelOffsets] = useState<number[]>([]);
  const [outputLabelOffsets, setOutputLabelOffsets] = useState<number[]>([]);
  
  const cache = nodeCache[id];
  const status = cache?.status || 'idle';
  const isExecuting = executingNodeId === id;
  
  const inputs = data.io?.inputs || {};
  const outputs = data.io?.outputs || {};
  
  const inputHandles = Object.entries(inputs);
  const outputHandles = Object.entries(outputs);
  
  // Check which inputs are connected
  const connectedInputs = new Set(
    edges.filter(e => e.target === id).map(e => e.targetHandle)
  );

  // Measure label positions on mount and when IO changes
  useEffect(() => {
    const measureLabels = () => {
      if (inputLabelsRef.current) {
        const labels = inputLabelsRef.current.querySelectorAll('[data-label]');
        const offsets: number[] = [];
        labels.forEach((label) => {
          const rect = label.getBoundingClientRect();
          const parentRect = inputLabelsRef.current!.parentElement?.getBoundingClientRect();
          if (parentRect) {
            // Get the center of the label relative to the node
            offsets.push(rect.top - parentRect.top + rect.height / 2);
          }
        });
        setInputLabelOffsets(offsets);
      }
      
      if (outputLabelsRef.current) {
        const labels = outputLabelsRef.current.querySelectorAll('[data-label]');
        const offsets: number[] = [];
        labels.forEach((label) => {
          const rect = label.getBoundingClientRect();
          const parentRect = outputLabelsRef.current!.parentElement?.getBoundingClientRect();
          if (parentRect) {
            offsets.push(rect.top - parentRect.top + rect.height / 2);
          }
        });
        setOutputLabelOffsets(offsets);
      }
    };

    // Small delay to ensure DOM is rendered
    const timer = setTimeout(measureLabels, 50);
    return () => clearTimeout(timer);
  }, [inputHandles.length, outputHandles.length, data.io]);

  const handleClick = useCallback(() => {
    selectNode(id);
  }, [id, selectNode]);

  // Status-based border colors
  const getStatusBorder = () => {
    if (isExecuting) return 'border-amber-500/70 shadow-lg shadow-amber-500/20';
    switch (status) {
      case 'completed': return 'border-green-500/30';
      case 'error': return 'border-red-500/50';
      case 'stale': return 'border-neutral-600/50';
      default: return 'border-neutral-800/50';
    }
  };

  return (
    <div
      className={`
        relative min-w-[280px] rounded-xl overflow-visible
        bg-neutral-900 
        border transition-all duration-200
        ${selected 
          ? 'border-green-500/50 shadow-lg shadow-green-500/10' 
          : isHovered 
            ? 'border-neutral-600/50' 
            : getStatusBorder()
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Execution glow effect */}
      {isExecuting && (
        <div className="absolute inset-0 bg-amber-500/5 animate-pulse pointer-events-none rounded-xl" />
      )}
      {status === 'completed' && (
        <div className="absolute inset-0 bg-green-500/5 pointer-events-none rounded-xl" />
      )}

      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-900/30 to-neutral-900/50 border-b border-neutral-800/50 rounded-t-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${
              status === 'completed' ? 'bg-green-500/30' : 
              isExecuting ? 'bg-amber-500/30' : 
              'bg-green-500/20'
            }`}>
              {isExecuting ? (
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              ) : (
                <Zap className={`w-4 h-4 ${status === 'completed' ? 'text-green-300' : 'text-green-400'}`} />
              )}
            </div>
            <span className="font-medium text-sm text-white truncate">
              {data.label || 'Code Node'}
            </span>
          </div>
          <StatusIndicator status={status} />
        </div>
      </div>

      {/* Content with IO sections */}
      <div className="flex">
        {/* Inputs Section - labels align with handles */}
        {inputHandles.length > 0 && (
          <div ref={inputLabelsRef} className="py-3 pl-3 pr-2 border-r border-neutral-800/30 min-w-[90px]">
            <div className="text-[9px] uppercase tracking-wider text-blue-400/70 font-semibold mb-2">Inputs</div>
            <div className="space-y-2">
              {inputHandles.map(([key, port]) => {
                const isConnected = connectedInputs.has(key);
                return (
                  <div 
                    key={key}
                    data-label={key}
                    className={`text-[11px] py-1.5 px-2 rounded flex items-center gap-1.5 ${
                      isConnected 
                        ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
                        : 'text-blue-400/70 bg-blue-500/5 border border-blue-500/10'
                    }`}
                    title={port.description || `${key}: ${port.type}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-blue-400/50'}`} />
                    {key}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Code Preview */}
        <div className="p-3 flex-1 min-w-0">
          <div className="bg-neutral-950/50 rounded-lg p-3 font-mono text-xs text-neutral-400 max-h-16 overflow-hidden border border-neutral-800/30">
            {data.code ? (
              <div className="flex items-start gap-2">
                <Code className="w-3 h-3 mt-0.5 text-neutral-500 flex-shrink-0" />
                <pre className="whitespace-pre-wrap break-all flex-1 text-[10px]">
                  {data.code.slice(0, 60)}
                  {data.code.length > 60 ? '...' : ''}
                </pre>
              </div>
            ) : (
              <span className="text-neutral-600 italic text-[10px]">Double-click to edit</span>
            )}
          </div>

          {/* IO Summary & Status */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-2 text-[10px]">
              {inputHandles.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                  {inputHandles.length} in
                </span>
              )}
              {outputHandles.length > 0 && (
                <span className={`px-2 py-0.5 rounded border ${
                  status === 'completed' 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {outputHandles.length} out
                </span>
              )}
            </div>
            
            {status === 'completed' && cache?.output && (
              <div className="text-[9px] text-green-400/70">
                Cached
              </div>
            )}
          </div>
        </div>

        {/* Outputs Section */}
        {outputHandles.length > 0 && (
          <div ref={outputLabelsRef} className="py-3 pr-3 pl-2 border-l border-neutral-800/30 min-w-[90px]">
            <div className="text-[9px] uppercase tracking-wider text-amber-400/70 font-semibold mb-2 text-right">Outputs</div>
            <div className="space-y-2">
              {outputHandles.map(([key, port]) => (
                <div 
                  key={key}
                  data-label={key}
                  className={`text-[11px] py-1.5 px-2 rounded text-right flex items-center justify-end gap-1.5 ${
                    status === 'completed'
                      ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                      : 'text-amber-400/70 bg-amber-500/5 border border-amber-500/10'
                  }`}
                  title={port.description || `${key}: ${port.type}`}
                >
                  {key}
                  <div className={`w-1.5 h-1.5 rounded-full ${status === 'completed' ? 'bg-green-400' : 'bg-amber-400/50'}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Handles - aligned with labels */}
      {inputHandles.map(([key, port], index) => (
        <Handle
          key={`input-${key}`}
          type="target"
          position={Position.Left}
          id={key}
          style={{ 
            top: inputLabelOffsets[index] || (60 + 36 + index * 32), // Fallback calculation
          }}
          className={`!w-3 !h-3 !border-2 !border-neutral-900 ${
            connectedInputs.has(key) ? '!bg-green-500' : '!bg-blue-500'
          }`}
          title={`${key} (${port.type})${port.description ? `: ${port.description}` : ''}`}
        />
      ))}

      {/* Default input handle if no IO defined */}
      {inputHandles.length === 0 && (
        <Handle
          type="target"
          position={Position.Left}
          id="default"
          style={{ top: '50%' }}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-neutral-900"
          title="Input"
        />
      )}

      {/* Output Handles - aligned with labels */}
      {outputHandles.map(([key, port], index) => (
        <Handle
          key={`output-${key}`}
          type="source"
          position={Position.Right}
          id={key}
          style={{ 
            top: outputLabelOffsets[index] || (60 + 36 + index * 32),
          }}
          className={`!w-3 !h-3 !border-2 !border-neutral-900 ${
            status === 'completed' ? '!bg-green-500' : '!bg-amber-500'
          }`}
          title={`${key} (${port.type})${port.description ? `: ${port.description}` : ''}`}
        />
      ))}

      {/* Default output handle if no IO defined */}
      {outputHandles.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          style={{ top: '50%' }}
          className={`!w-3 !h-3 !border-2 !border-neutral-900 ${
            status === 'completed' ? '!bg-green-500' : '!bg-amber-500'
          }`}
          title="Output"
        />
      )}
    </div>
  );
});

CodeNode.displayName = 'CodeNode';

export default CodeNode;
