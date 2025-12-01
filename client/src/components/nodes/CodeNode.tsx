/**
 * CodeNode - Synthase script execution node
 */

import { memo, useCallback, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
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
  
  // Calculate handle positions
  const inputSpacing = inputHandles.length > 1 ? 100 / (inputHandles.length + 1) : 50;
  const outputSpacing = outputHandles.length > 1 ? 100 / (outputHandles.length + 1) : 50;

  const handleClick = useCallback(() => {
    selectNode(id);
  }, [id, selectNode]);

  return (
    <div
      className={`
        relative min-w-[200px] rounded-lg overflow-hidden
        bg-gradient-to-br from-slate-900 to-slate-800
        border-2 transition-all duration-200
        ${selected ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-700'}
        ${isHovered ? 'border-slate-500' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <span className="font-medium text-sm truncate">
            {data.label || 'Code Node'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Code preview */}
        <div className="bg-slate-950 rounded p-2 font-mono text-xs text-slate-400 max-h-20 overflow-hidden">
          {data.code ? (
            <pre className="whitespace-pre-wrap break-all">
              {data.code.slice(0, 100)}
              {data.code.length > 100 ? '...' : ''}
            </pre>
          ) : (
            <span className="text-slate-600 italic">No code</span>
          )}
        </div>

        {/* IO Summary */}
        <div className="mt-2 flex gap-2 text-[10px]">
          {inputHandles.length > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
              {inputHandles.length} input{inputHandles.length !== 1 ? 's' : ''}
            </span>
          )}
          {outputHandles.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
              {outputHandles.length} output{outputHandles.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Input Handles */}
      {inputHandles.map(([key, port], index) => (
        <Handle
          key={`input-${key}`}
          type="target"
          position={Position.Left}
          id={key}
          style={{ top: `${inputSpacing * (index + 1)}%` }}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900"
          title={`${key} (${port.type})`}
        />
      ))}

      {/* Default input handle if no IO defined */}
      {inputHandles.length === 0 && (
        <Handle
          type="target"
          position={Position.Left}
          id="default"
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900"
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
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900"
          title={`${key} (${port.type})`}
        />
      ))}

      {/* Default output handle if no IO defined */}
      {outputHandles.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900"
          title="Output"
        />
      )}
    </div>
  );
});

CodeNode.displayName = 'CodeNode';

export default CodeNode;

