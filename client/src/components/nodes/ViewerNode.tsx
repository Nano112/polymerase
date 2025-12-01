import { memo, useState, useCallback, useRef } from 'react';
import { Handle, Position, type NodeProps, NodeResizer } from '@xyflow/react';
import { Eye, Box, Hash, Type, ToggleLeft, Code2, ArrowRight, Download } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { isSchematicData, type SchematicData } from '@polymerase/core';

// Adjust these imports based on your actual file structure
import SchematicRenderer from '../others/SchematicRenderer';

interface ViewerNodeData {
  label?: string;
  passthrough?: boolean; // Whether to relay input to output
  width?: number;
  height?: number;
}

// --- 1. MEMOIZED RENDERER WRAPPER ---
// This is critical. It prevents the 3D canvas from re-initializing 
// every time React Flow updates the node position or selection.
const MemoizedSchematicRenderer = memo(({ schematic }: { schematic: Uint8Array | ArrayBuffer }) => {
  return (
    <div className="w-full h-full bg-neutral-950 rounded border border-neutral-800 overflow-hidden relative">
      <SchematicRenderer schematic={schematic} />
    </div>
  );
}, (prev, next) => {
  // Compare by byte length and first few bytes for efficiency
  if (prev.schematic === next.schematic) return true;
  if (!prev.schematic || !next.schematic) return false;
  
  const prevBytes = prev.schematic instanceof Uint8Array ? prev.schematic : new Uint8Array(prev.schematic);
  const nextBytes = next.schematic instanceof Uint8Array ? next.schematic : new Uint8Array(next.schematic);
  
  if (prevBytes.byteLength !== nextBytes.byteLength) return false;
  // Check first 8 bytes for quick comparison
  for (let i = 0; i < Math.min(8, prevBytes.byteLength); i++) {
    if (prevBytes[i] !== nextBytes[i]) return false;
  }
  return true;
});

const ViewerNode = memo(({ id, data, selected, width, height }: NodeProps & { data: ViewerNodeData }) => {
  const selectNode = useFlowStore((state) => state.selectNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const nodeCache = useFlowStore((state) => state.nodeCache);
  const edges = useFlowStore((state) => state.edges);
  const [isHovered, setIsHovered] = useState(false);
  
  // Keep track of the last valid schematic so we can show it during re-execution
  const lastSchematicRef = useRef<SchematicData | null>(null);
  
  // Check if node has been resized (has explicit dimensions)
  const isResized = !!(width && height);
  
  // Get input data from the cache
  const inputEdge = edges.find(e => e.target === id);
  const sourceCache = inputEdge ? nodeCache[inputEdge.source] : null;
  const rawOutput = sourceCache?.output;
  const hasInput = inputEdge && sourceCache?.status === 'completed';
  const isExecuting = sourceCache?.status === 'running' || sourceCache?.status === 'pending';
  
  // Extract actual value - if output is an object with a single key containing SchematicData,
  // unwrap it for display. This handles cases like { default: SchematicData }
  const inputValue = (() => {
    if (!rawOutput || typeof rawOutput !== 'object') return rawOutput;
    
    // If it's already a SchematicData, use it directly
    if (isSchematicData(rawOutput)) return rawOutput;
    
    // Check if it's an object with schematic values
    const entries = Object.entries(rawOutput as Record<string, unknown>);
    if (entries.length === 1) {
      const [, value] = entries[0];
      if (isSchematicData(value)) {
        return value; // Unwrap single schematic
      }
    }
    
    // Check if any value is a schematic (prioritize showing schematic)
    for (const [, value] of entries) {
      if (isSchematicData(value)) {
        return value;
      }
    }
    
    return rawOutput;
  })();
  
  // Update last schematic ref when we have a valid schematic
  if (isSchematicData(inputValue)) {
    lastSchematicRef.current = inputValue;
  }
  
  // Use the last known schematic if current value is not available but we had one before
  const displayValue = inputValue ?? (lastSchematicRef.current ? lastSchematicRef.current : undefined);
  const hasSchematicToShow = isSchematicData(displayValue);
  
  const passthrough = data.passthrough ?? false;

  const togglePassthrough = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateNodeData(id, { passthrough: !passthrough });
  }, [id, passthrough, updateNodeData]);

  // Determine the type of input value safely
  const getValueType = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    
    // Check for SchematicData wrapper (has format + data properties)
    if (isSchematicData(value)) {
      return 'schematic';
    }
    
    if (typeof value === 'object') {
      return 'object';
    }
    return typeof value;
  };

  // Determine value type - use displayValue to handle cached schematics
  const valueType = hasInput ? getValueType(inputValue) : 
    (hasSchematicToShow ? 'schematic' : null);

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
    // Show "no input" only if there's no connection AND no cached schematic to display
    if (!hasInput && !hasSchematicToShow) {
      return (
        <div className="text-center text-neutral-500 py-6">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-xs">No input connected</div>
        </div>
      );
    }
    
    // If input is invalidated but we have a cached schematic, show it
    if ((!hasInput || inputValue === undefined) && hasSchematicToShow) {
      const schematicWrapper = displayValue as SchematicData;
      const binaryData = schematicWrapper.data instanceof Uint8Array 
        ? schematicWrapper.data 
        : new TextEncoder().encode(schematicWrapper.data as string);
      const byteSize = binaryData.byteLength;
      const name = schematicWrapper.metadata?.name || 'Schematic';
      
      return (
        <div className="flex flex-col h-full w-full relative">
          {/* Show overlay when cache is invalidated/re-executing */}
          <div className="absolute inset-0 bg-neutral-900/60 z-10 flex items-center justify-center rounded">
            <div className="text-xs text-neutral-400 animate-pulse">
              {isExecuting ? 'Updating...' : 'Waiting for input...'}
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            <MemoizedSchematicRenderer schematic={binaryData} />
          </div>
          <div className="text-center mt-2 flex-shrink-0">
            <div className="text-xs text-neutral-300 font-medium">{name}</div>
            <div className="text-[10px] text-neutral-500">
              {schematicWrapper.format} • {byteSize} bytes
            </div>
          </div>
          
        </div>
      );
    }
    
    // No input value yet
    if (inputValue === undefined) {
      return (
        <div className="text-center text-neutral-500 py-6">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-xs">Waiting for data...</div>
        </div>
      );
    }

    switch (valueType) {
      case 'number':
        return (
          <div className="text-center py-4">
            <div className="text-3xl font-mono font-bold text-blue-400">
              {typeof inputValue === 'number' ? inputValue.toLocaleString() : String(inputValue)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">number</div>
          </div>
        );

      case 'string': {
        const strValue = String(inputValue);
        return (
          <div className="py-2">
            <div className="text-xs font-mono text-green-400 break-all max-h-20 overflow-y-auto whitespace-pre-wrap">
              {strValue.slice(0, 150)}{strValue.length > 150 ? '...' : ''}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">string ({strValue.length} chars)</div>
          </div>
        );
      }

      case 'boolean':
        return (
          <div className="text-center py-4">
            <div className={`text-2xl font-mono font-bold ${inputValue ? 'text-green-400' : 'text-red-400'}`}>
              {inputValue ? 'true' : 'false'}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">boolean</div>
          </div>
        );

      case 'schematic': {
        // Use displayValue which includes cached schematic when input is invalidated
        const schematicWrapper = (isSchematicData(inputValue) ? inputValue : displayValue) as SchematicData;
        const binaryData = schematicWrapper.data instanceof Uint8Array 
          ? schematicWrapper.data 
          : new TextEncoder().encode(schematicWrapper.data as string);
        const byteSize = binaryData.byteLength;
        const name = schematicWrapper.metadata?.name || 'Schematic';
        
        return (
          <div className="flex flex-col h-full w-full relative">
            {/* Show overlay when re-executing */}
            {isExecuting && (
              <div className="absolute inset-0 bg-neutral-900/60 z-10 flex items-center justify-center rounded">
                <div className="text-xs text-neutral-400 animate-pulse">Updating...</div>
              </div>
            )}
            <div className="flex-1 min-h-0 w-full">
              {/* Using the Memoized Component here */}
              <MemoizedSchematicRenderer schematic={binaryData} />
            </div>


          </div>
        );
      }

      case 'array': {
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
      }

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
    <>
      {/* Resize handle - always available, visible on hover/select */}
      <NodeResizer
        minWidth={180}
        minHeight={120}
        isVisible={selected || isHovered}
        lineClassName="!border-pink-500"
        handleClassName="!w-2 !h-2 !bg-pink-500 !border-pink-600"
      />
      <div
        className={`
          relative rounded-xl overflow-hidden
          bg-neutral-900 flex flex-col
          border transition-all duration-200
          ${isResized ? 'w-full h-full' : 'min-w-[180px] max-w-[240px]'}
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
      <div className={`${isResized || valueType === 'schematic' ? 'flex-1 min-h-0 p-0' : 'p-3'}`}>
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
    </>
  );
});

ViewerNode.displayName = 'ViewerNode';

export default ViewerNode;