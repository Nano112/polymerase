/**
 * InputNode - Static value input nodes
 */

import { memo, useCallback, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useFlowStore } from '../../store/flowStore';

interface InputNodeData {
  label?: string;
  value?: unknown;
  inputType?: 'number' | 'text' | 'boolean';
}

const InputNode = memo(({ id, data, selected }: NodeProps & { data: InputNodeData }) => {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const selectNode = useFlowStore((state) => state.selectNode);
  const [localValue, setLocalValue] = useState<string | number | boolean>(
    (data.value as string | number | boolean) ?? ''
  );

  const handleChange = useCallback(
    (newValue: string | number | boolean) => {
      setLocalValue(newValue);
      updateNodeData(id, { value: newValue });
    },
    [id, updateNodeData]
  );

  const inputType = data.inputType || 'text';
  
  const renderInput = () => {
    switch (inputType) {
      case 'number':
        return (
          <input
            type="number"
            value={localValue as number}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-violet-500"
          />
        );
      case 'boolean':
        return (
          <button
            onClick={() => handleChange(!localValue)}
            className={`
              w-full px-3 py-1 rounded text-sm font-medium transition-colors
              ${localValue 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-700 text-slate-400'
              }
            `}
          >
            {localValue ? 'True' : 'False'}
          </button>
        );
      default:
        return (
          <input
            type="text"
            value={localValue as string}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-violet-500"
            placeholder="Enter value..."
          />
        );
    }
  };

  const getIcon = () => {
    switch (inputType) {
      case 'number': return '🔢';
      case 'boolean': return '⚡';
      default: return '📝';
    }
  };

  return (
    <div
      className={`
        relative min-w-[160px] rounded-lg overflow-hidden
        bg-gradient-to-br from-slate-900 to-slate-800
        border-2 transition-all duration-200
        ${selected ? 'border-violet-500 shadow-lg shadow-violet-500/20' : 'border-slate-700'}
      `}
      onClick={() => selectNode(id)}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getIcon()}</span>
          <span className="font-medium text-sm truncate">
            {data.label || 'Input'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {renderInput()}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900"
        title="Value"
      />
    </div>
  );
});

InputNode.displayName = 'InputNode';

export default InputNode;

