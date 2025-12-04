import { memo, useState, useCallback, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { 
  Workflow,
  CheckCircle, Loader2, AlertCircle, Clock
} from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { 
  type SubflowConfig,
  type SubflowPort 
} from '@polymerase/core';
import type { NodeExecutionStatus } from '../../store/flowStore';

// ============================================================================
// Types
// ============================================================================

interface SubflowNodeData {
  label?: string;
  flowId: string;
  subflowConfig: SubflowConfig;
  expanded?: boolean;
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

// ============================================================================
// Handle Components  
// ============================================================================

interface PortHandleProps {
  port: SubflowPort;
  type: 'source' | 'target';
  position: Position;
  isConnected: boolean;
}

const PortHandle = memo(({ port, type, position, isConnected }: PortHandleProps) => {
  const getTypeColor = (portType: string) => {
    switch (portType) {
      case 'number': return 'border-blue-500/50 bg-blue-500';
      case 'string': return 'border-green-500/50 bg-green-500';
      case 'boolean': return 'border-amber-500/50 bg-amber-500';
      case 'file': return 'border-purple-500/50 bg-purple-500';
      case 'schematic': return 'border-pink-500/50 bg-pink-500';
      case 'any': return 'border-neutral-500/50 bg-neutral-400';
      default: return 'border-neutral-500/50 bg-neutral-400';
    }
  };
  
  const isLeft = position === Position.Left;
  
  return (
    <div className={`flex items-center gap-1.5 ${
      isLeft ? 'flex-row justify-start' : 'flex-row-reverse justify-end'
    }`}>
      <Handle
        type={type}
        position={position}
        id={port.id}
        className={`
          !relative !transform-none !top-auto !left-auto !right-auto
          !w-2 !h-2 !rounded-full !border-2 !border-neutral-900
          ${isConnected ? getTypeColor(port.type) : '!bg-neutral-700 !border-neutral-600'}
          transition-all hover:!scale-125
        `}
        title={`${port.name} (${port.type})${port.description ? `: ${port.description}` : ''}`}
      />
      <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap">
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
  const nodeCache = useFlowStore((state) => state.nodeCache);
  const edges = useFlowStore((state) => state.edges);
  const executingNodeId = useFlowStore((state) => state.executingNodeId);
  const [isHovered, setIsHovered] = useState(false);
  
  const cache = nodeCache[id];
  const status = cache?.status || 'idle';
  const isExecuting = executingNodeId === id;
  
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
  
  const handleClick = useCallback(() => {
    selectNode(id);
  }, [id, selectNode]);

  // Status-based border colors
  const getStatusBorder = () => {
    if (isExecuting) return 'border-amber-500/70 shadow-lg shadow-amber-500/20';
    switch (status) {
      case 'completed': return 'border-green-500/30';
      case 'error': return 'border-red-500/50';
      case 'pending': return 'border-blue-500/30';
      default: return 'border-neutral-800/50';
    }
  };

  return (
    <div
      className={`
        relative rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950
        border-2 transition-all duration-200
        ${
          selected
            ? 'border-indigo-500 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-500/30'
            : isHovered
              ? 'border-indigo-500/30 shadow-lg'
              : getStatusBorder()
        }
        hover:shadow-xl
      `}
      style={{ minWidth: 240 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-b border-neutral-800/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
              <Workflow className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-white truncate">
                {data.label || config?.nodeName || 'Subflow'}
              </div>
              {config?.category && (
                <div className="text-[10px] text-neutral-500 truncate">
                  {config.category}
                </div>
              )}
            </div>
          </div>
          
          {/* Status Badge */}
          <StatusIndicator status={status} />
        </div>
      </div>

      {/* Input/Output Lists */}
      <div className="px-4 py-3 space-y-3">
        {/* Inputs */}
        {inputs.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider px-1">Inputs</div>
            {inputs.map((port) => (
              <PortHandle
                key={`input-${port.id}`}
                port={port}
                type="target"
                position={Position.Left}
                isConnected={connectedInputs.has(port.id)}
              />
            ))}
          </div>
        )}
        
        {/* Outputs */}
        {outputs.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider px-1">Outputs</div>
            {outputs.map((port) => (
              <PortHandle
                key={`output-${port.id}`}
                port={port}
                type="source"
                position={Position.Right}
                isConnected={connectedOutputs.has(port.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {status === 'error' && cache?.error && (
        <div className="px-4 pb-3">
          <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 font-mono">
            {cache.error}
          </div>
        </div>
      )}
    </div>
  );
});

SubflowNode.displayName = 'SubflowNode';

export default SubflowNode;
