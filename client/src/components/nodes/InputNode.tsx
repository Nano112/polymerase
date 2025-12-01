/**
 * InputNode - Static value input nodes
 */

import { memo, useCallback, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Hash, Type, ToggleLeft } from 'lucide-react';
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
  const [isHovered, setIsHovered] = useState(false);

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
            className="w-full px-3 py-2 bg-neutral-950/50 border border-neutral-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        );
      case 'boolean':
        return (
          <button
            onClick={() => handleChange(!localValue)}
            className={`
              w-full px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${localValue 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-neutral-800/50 text-neutral-400 border border-neutral-700/50'
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
            className="w-full px-3 py-2 bg-neutral-950/50 border border-neutral-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            placeholder="Enter value..."
          />
        );
    }
  };

  const getIcon = () => {
    switch (inputType) {
      case 'number': return Hash;
      case 'boolean': return ToggleLeft;
      default: return Type;
    }
  };

  const Icon = getIcon();

  return (
    <div
      className={`
        relative min-w-[180px] rounded-xl overflow-hidden
        bg-neutral-900/80 backdrop-blur-sm
        border transition-all duration-200
        ${selected 
          ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' 
          : isHovered 
            ? 'border-neutral-600/50' 
            : 'border-neutral-800/50'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => selectNode(id)}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-900/30 to-neutral-900/50 border-b border-neutral-800/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-500/20">
            <Icon className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-medium text-sm text-white truncate">
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
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-neutral-900"
        title="Value"
      />
    </div>
  );
});

InputNode.displayName = 'InputNode';

export default InputNode;
