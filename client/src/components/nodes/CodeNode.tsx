/**
 * CodeNode - Synthase script execution node
 */

import { memo, useCallback, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap, Code } from 'lucide-react';
import type { IODefinition } from '@polymerase/core';
import { useFlowStore } from '../../store/flowStore';

interface CodeNodeData {
  label?: string;
  code?: string;
  io?: IODefinition;
}

const CodeNode = memo(({ id, data, selected }: NodeProps & { data: CodeNodeData }) => {
  const selectNode = useFlowStore((state) => state.selectNode);
  const [isHovered, setIsHovered] = useState(false);
  
  const inputs = data.io?.inputs || {};
  const outputs = data.io?.outputs || {};
  
  const inputHandles = Object.entries(inputs);
  const outputHandles = Object.entries(outputs);
  
  const inputSpacing = inputHandles.length > 1 ? 100 / (inputHandles.length + 1) : 50;
  const outputSpacing = outputHandles.length > 1 ? 100 / (outputHandles.length + 1) : 50;

  const handleClick = useCallback(() => {
    selectNode(id);
  }, [id, selectNode]);

  return (
    <div
      className={`
        relative min-w-[220px] rounded-xl overflow-hidden
        bg-neutral-900/80 backdrop-blur-sm
        border transition-all duration-200
        ${selected 
          ? 'border-green-500/50 shadow-lg shadow-green-500/10' 
          : isHovered 
            ? 'border-neutral-600/50' 
            : 'border-neutral-800/50'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-900/30 to-neutral-900/50 border-b border-neutral-800/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-500/20">
            <Zap className="w-4 h-4 text-green-400" />
          </div>
          <span className="font-medium text-sm text-white truncate">
            {data.label || 'Code Node'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="bg-neutral-950/50 rounded-lg p-3 font-mono text-xs text-neutral-400 max-h-20 overflow-hidden border border-neutral-800/30">
          {data.code ? (
            <div className="flex items-start gap-2">
              <Code className="w-3 h-3 mt-0.5 text-neutral-500 flex-shrink-0" />
              <pre className="whitespace-pre-wrap break-all flex-1">
                {data.code.slice(0, 80)}
                {data.code.length > 80 ? '...' : ''}
              </pre>
            </div>
          ) : (
            <span className="text-neutral-600 italic">Double-click to edit code</span>
          )}
        </div>

        {/* IO Summary */}
        {(inputHandles.length > 0 || outputHandles.length > 0) && (
          <div className="mt-2 flex gap-2 text-[10px]">
            {inputHandles.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                {inputHandles.length} in
              </span>
            )}
            {outputHandles.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                {outputHandles.length} out
              </span>
            )}
          </div>
        )}
      </div>

      {/* Input Handles */}
      {inputHandles.map(([key, port], index) => (
        <Handle
          key={`input-${key}`}
          type="target"
          position={Position.Left}
          id={key}
          style={{ top: `${inputSpacing * (index + 1)}%` }}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-neutral-900"
          title={`${key} (${port.type})`}
        />
      ))}

      {/* Default input handle if no IO defined */}
      {inputHandles.length === 0 && (
        <Handle
          type="target"
          position={Position.Left}
          id="default"
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-neutral-900"
          title="Input"
        />
      )}

      {/* Output Handles */}
      {outputHandles.map(([key, port], index) => (
        <Handle
          key={`output-${key}`}
          type="source"
          position={Position.Right}
          id={key}
          style={{ top: `${outputSpacing * (index + 1)}%` }}
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-neutral-900"
          title={`${key} (${port.type})`}
        />
      ))}

      {/* Default output handle if no IO defined */}
      {outputHandles.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-neutral-900"
          title="Output"
        />
      )}
    </div>
  );
});

CodeNode.displayName = 'CodeNode';

export default CodeNode;
