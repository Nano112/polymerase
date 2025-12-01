/**
 * ViewerNode - Generic data viewer that can display any input type
 * Optionally can relay data to an output
 */

import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Eye, Box, Hash, Type, ToggleLeft, Code2, ArrowRight, Download } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';

interface ViewerNodeData {
  label?: string;
  passthrough?: boolean;  // Whether to relay input to output
}

const ViewerNode = memo(({ id, data, selected }: NodeProps & { data: ViewerNodeData }) => {
  const selectNode = useFlowStore((state) => state.selectNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const nodeCache = useFlowStore((state) => state.nodeCache);
  const edges = useFlowStore((state) => state.edges);
  const [isHovered, setIsHovered] = useState(false);
  
  const cache = nodeCache[id];
  const inputEdge = edges.find(e => e.target === id);
  const sourceCache = inputEdge ? nodeCache[inputEdge.source] : null;
  const inputValue = sourceCache?.output;
  const hasInput = inputEdge && sourceCache?.status === 'completed';
  
  const passthrough = data.passthrough ?? false;

  const togglePassthrough = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateNodeData(id, { passthrough: !passthrough });
  }, [id, passthrough, updateNodeData]);

  // Determine the type of input value
  const getValueType = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') {
      // Check for schematic-like object
      if ('blocks' in (value as object) || 'dimensions' in (value as object)) {
        return 'schematic';
      }
      return 'object';
    }
    return typeof value;
  };

  const valueType = hasInput ? getValueType(inputValue) : null;

  const getTypeIcon = () => {
    switch (valueType) {
      case 'number': return Hash;
      case 'string': return Type;
      case 'boolean': return ToggleLeft;
      case 'schematic': return Box;
      case 'array':
      case 'object': return Code2;
      default: return Eye;
    }
  };

  const TypeIcon = getTypeIcon();

  const renderPreview = () => {
    if (!hasInput || inputValue === undefined) {
      return (
        <div className="text-center text-neutral-500 py-6">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-xs">No input connected</div>
        </div>
      );
    }

    switch (valueType) {
      case 'number':
        return (
          <div className="text-center py-4">
            <div className="text-3xl font-mono font-bold text-blue-400">
              {typeof inputValue === 'number' ? inputValue.toLocaleString() : inputValue}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">number</div>
          </div>
        );

      case 'string':
        const strValue = String(inputValue);
        return (
          <div className="py-2">
            <div className="text-sm font-mono text-green-400 break-all max-h-20 overflow-y-auto">
              "{strValue.slice(0, 100)}{strValue.length > 100 ? '...' : ''}"
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">string ({strValue.length} chars)</div>
          </div>
        );

      case 'boolean':
        return (
          <div className="text-center py-4">
            <div className={`text-2xl font-mono font-bold ${inputValue ? 'text-green-400' : 'text-red-400'}`}>
              {inputValue ? 'true' : 'false'}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">boolean</div>
          </div>
        );

      case 'schematic':
        const schem = inputValue as { dimensions?: { x: number; y: number; z: number }; blockCount?: number };
        return (
          <div className="py-2">
            <div className="flex items-center justify-center mb-2">
              <Box className="w-10 h-10 text-pink-400" />
            </div>
            <div className="text-center">
              <div className="text-xs text-neutral-300 font-medium">Schematic</div>
              {schem.dimensions && (
                <div className="text-[10px] text-neutral-500">
                  {schem.dimensions.x}×{schem.dimensions.y}×{schem.dimensions.z}
                </div>
              )}
              {schem.blockCount !== undefined && (
                <div className="text-[10px] text-neutral-500">
                  {schem.blockCount.toLocaleString()} blocks
                </div>
              )}
            </div>
            <button className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs hover:bg-pink-500/30 transition-colors">
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        );

      case 'array':
        const arr = inputValue as unknown[];
        return (
          <div className="py-2">
            <div className="text-xs text-neutral-300 font-mono bg-neutral-900/50 rounded p-2 max-h-20 overflow-y-auto">
              [{arr.slice(0, 5).map((item, i) => (
                <span key={i} className="text-amber-400">
                  {JSON.stringify(item)}{i < Math.min(arr.length - 1, 4) ? ', ' : ''}
                </span>
              ))}
              {arr.length > 5 && <span className="text-neutral-500">...+{arr.length - 5} more</span>}]
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">array ({arr.length} items)</div>
          </div>
        );

      case 'object':
        return (
          <div className="py-2">
            <pre className="text-[10px] text-neutral-300 font-mono bg-neutral-900/50 rounded p-2 max-h-24 overflow-y-auto">
              {JSON.stringify(inputValue, null, 2).slice(0, 200)}
              {JSON.stringify(inputValue).length > 200 && '...'}
            </pre>
            <div className="text-[10px] text-neutral-500 mt-1">object</div>
          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-neutral-500">
            <Code2 className="w-6 h-6 mx-auto mb-1" />
            <div className="text-xs">{String(inputValue)}</div>
          </div>
        );
    }
  };

  return (
    <div
      className={`
        relative min-w-[180px] max-w-[240px] rounded-xl overflow-hidden
        bg-neutral-900
        border transition-all duration-200
        ${selected 
          ? 'border-pink-500/50 shadow-lg shadow-pink-500/10' 
          : isHovered 
            ? 'border-neutral-600/50' 
            : hasInput
              ? 'border-green-500/30'
              : 'border-neutral-800/50'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => selectNode(id)}
    >
      {/* Header */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-pink-900/30 to-neutral-900/50 border-b border-neutral-800/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`flex items-center justify-center w-6 h-6 rounded-lg ${
              hasInput ? 'bg-green-500/20' : 'bg-pink-500/20'
            }`}>
              {hasInput ? (
                <TypeIcon className={`w-3.5 h-3.5 ${
                  valueType === 'schematic' ? 'text-pink-400' :
                  valueType === 'number' ? 'text-blue-400' :
                  valueType === 'string' ? 'text-green-400' :
                  valueType === 'boolean' ? 'text-amber-400' :
                  'text-neutral-400'
                }`} />
              ) : (
                <Eye className="w-3.5 h-3.5 text-pink-400" />
              )}
            </div>
            <span className="font-medium text-xs text-white truncate">
              {data.label || 'Viewer'}
            </span>
          </div>
          
          {/* Passthrough toggle */}
          <button
            onClick={togglePassthrough}
            className={`
              p-1 rounded transition-colors flex items-center gap-1
              ${passthrough 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              }
            `}
            title={passthrough ? 'Output enabled' : 'Click to enable output relay'}
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {renderPreview()}
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className={`!w-3 !h-3 !border-2 !border-neutral-900 ${
          hasInput ? '!bg-green-500' : '!bg-blue-500'
        }`}
        title="Data input"
      />

      {/* Output Handle (only if passthrough enabled) */}
      {passthrough && (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className={`!w-3 !h-3 !border-2 !border-neutral-900 ${
            hasInput ? '!bg-green-500' : '!bg-amber-500'
          }`}
          title="Data output (passthrough)"
        />
      )}
    </div>
  );
});

ViewerNode.displayName = 'ViewerNode';

export default ViewerNode;

