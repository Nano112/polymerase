import { memo, useState, useCallback, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { 
  Box, Workflow, ChevronDown, ChevronRight, 
  Play
} from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { 
  type SubflowConfig,
  type SubflowPort 
} from '@polymerase/core';

// ============================================================================
// Types
// ============================================================================

interface SubflowNodeData {
  label?: string;
  flowId: string;
  subflowConfig: SubflowConfig;
  expanded?: boolean;
}

// ============================================================================
// Handle Components
// ============================================================================

interface PortHandleProps {
  port: SubflowPort;
  type: 'source' | 'target';
  position: Position;
  index: number;
  total: number;
  isConnected: boolean;
}

const PortHandle = memo(({ port, type, position, index, total, isConnected }: PortHandleProps) => {
  // Calculate vertical position
  const spacing = 100 / (total + 1);
  const topPercent = spacing * (index + 1);
  
  const getTypeColor = (portType: string) => {
    switch (portType) {
      case 'number': return 'bg-blue-500';
      case 'string': return 'bg-green-500';
      case 'boolean': return 'bg-amber-500';
      case 'file': return 'bg-purple-500';
      case 'schematic': return 'bg-pink-500';
      default: return 'bg-neutral-400';
    }
  };
  
  return (
    <div
      className="absolute flex items-center gap-1"
      style={{
        top: `${topPercent}%`,
        transform: 'translateY(-50%)',
        [position === Position.Left ? 'left' : 'right']: 0,
        flexDirection: position === Position.Left ? 'row' : 'row-reverse'
      }}
    >
      <Handle
        type={type}
        position={position}
        id={port.id}
        className={`!w-2.5 !h-2.5 !border-2 !border-neutral-900 ${
          isConnected ? getTypeColor(port.type) : '!bg-neutral-600'
        }`}
        title={`${port.name} (${port.type})${port.description ? `: ${port.description}` : ''}`}
      />
      <span className={`text-[9px] text-neutral-400 ${position === Position.Left ? 'ml-1' : 'mr-1'}`}>
        {port.name}
      </span>
    </div>
  );
});

PortHandle.displayName = 'PortHandle';

// ============================================================================
// Main SubflowNode Component
// ============================================================================

const SubflowNode = memo(({ id, data, selected }: NodeProps & { data: SubflowNodeData }) => {
  const selectNode = useFlowStore((state) => state.selectNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const nodeCache = useFlowStore((state) => state.nodeCache);
  const edges = useFlowStore((state) => state.edges);
  const [isHovered, setIsHovered] = useState(false);
  
  const cache = nodeCache[id];
  const status = cache?.status || 'idle';
  
  const config = data.subflowConfig;
  const inputs = config?.inputs || [];
  const outputs = config?.outputs || [];
  
  // Determine which handles are connected
  const connectedInputs = useMemo(() => {
    const connected = new Set<string>();
    edges.filter(e => e.target === id).forEach(e => {
      if (e.targetHandle) connected.add(e.targetHandle);
    });
    return connected;
  }, [edges, id]);
  
  const connectedOutputs = useMemo(() => {
    const connected = new Set<string>();
    edges.filter(e => e.source === id).forEach(e => {
      if (e.sourceHandle) connected.add(e.sourceHandle);
    });
    return connected;
  }, [edges, id]);
  
  // Calculate node height based on max(inputs, outputs)
  const maxPorts = Math.max(inputs.length, outputs.length, 1);
  const nodeHeight = Math.max(80, 40 + maxPorts * 24);
  
  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateNodeData(id, { expanded: !data.expanded });
  }, [id, data.expanded, updateNodeData]);
  
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'border-green-500/50 shadow-green-500/10';
      case 'running': return 'border-amber-500/50 shadow-amber-500/10 animate-pulse';
      case 'error': return 'border-red-500/50 shadow-red-500/10';
      case 'pending': return 'border-blue-500/30';
      default: return 'border-neutral-700/50';
    }
  };

  return (
    <div
      className={`
        relative rounded-xl overflow-visible
        bg-neutral-900 flex flex-col
        border-2 transition-all duration-200 shadow-lg
        ${selected 
          ? 'border-indigo-500/50 shadow-indigo-500/20' 
          : isHovered 
            ? 'border-neutral-600/50' 
            : getStatusColor()
        }
      `}
      style={{ 
        minWidth: 180, 
        minHeight: nodeHeight,
        width: 200
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => selectNode(id)}
    >
      {/* Header */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border-b border-neutral-800/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20">
              <Workflow className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="font-medium text-xs text-white truncate">
              {data.label || config?.nodeName || 'Subflow'}
            </span>
          </div>
          
          {/* Expand/collapse toggle */}
          <button
            onClick={toggleExpanded}
            className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
            title={data.expanded ? 'Collapse' : 'Expand to see internal flow'}
          >
            {data.expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        </div>
        
        {/* Category and version */}
        {(config?.category || config?.version) && (
          <div className="flex items-center gap-2 mt-1">
            {config?.category && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800/50 text-neutral-500">
                {config.category}
              </span>
            )}
            {config?.version && (
              <span className="text-[9px] text-neutral-600">v{config.version}</span>
            )}
          </div>
        )}
      </div>

      {/* Port labels area */}
      <div 
        className="relative flex-1 px-2 py-2"
        style={{ minHeight: maxPorts * 24 }}
      >
        {/* Status indicator */}
        {status === 'running' && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50">
            <div className="flex items-center gap-2 text-amber-400">
              <Play className="w-4 h-4 animate-pulse" />
              <span className="text-xs">Running...</span>
            </div>
          </div>
        )}
        
        {status === 'error' && cache?.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 p-2">
            <div className="text-[10px] text-red-400 text-center truncate">
              {cache.error}
            </div>
          </div>
        )}
        
        {/* Expanded view placeholder */}
        {data.expanded && (
          <div className="text-center text-neutral-600 text-[10px] py-2">
            <Box className="w-6 h-6 mx-auto mb-1 opacity-50" />
            Internal flow preview
          </div>
        )}
      </div>

      {/* Input Handles */}
      {inputs.map((port, index) => (
        <PortHandle
          key={`input-${port.id}`}
          port={port}
          type="target"
          position={Position.Left}
          index={index}
          total={inputs.length}
          isConnected={connectedInputs.has(port.id)}
        />
      ))}

      {/* Output Handles */}
      {outputs.map((port, index) => (
        <PortHandle
          key={`output-${port.id}`}
          port={port}
          type="source"
          position={Position.Right}
          index={index}
          total={outputs.length}
          isConnected={connectedOutputs.has(port.id)}
        />
      ))}
    </div>
  );
});

SubflowNode.displayName = 'SubflowNode';

export default SubflowNode;
