import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { 
  Workflow,
  CheckCircle, Loader2, AlertCircle, Clock,
  Play, FlaskConical
} from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { 
  type SubflowConfig,
  type SubflowPort 
} from '@polymerase/core';
import type { NodeExecutionStatus } from '../../store/flowStore';
import { Modal } from '../ui/Modal';

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
// Subflow Test Modal
// ============================================================================

interface SubflowTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SubflowConfig;
  nodeLabel: string;
}

function SubflowTestModal({ isOpen, onClose, config, nodeLabel }: SubflowTestModalProps) {
  const [mockInputs, setMockInputs] = useState<Record<string, unknown>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; result?: unknown; error?: string } | null>(null);
  
  const inputs = config?.inputs || [];
  
  // Initialize mock inputs with defaults
  useEffect(() => {
    if (isOpen) {
      const defaults: Record<string, unknown> = {};
      inputs.forEach((port) => {
        switch (port.type) {
          case 'number':
            defaults[port.id] = port.defaultValue ?? 0;
            break;
          case 'string':
            defaults[port.id] = port.defaultValue ?? '';
            break;
          case 'boolean':
            defaults[port.id] = port.defaultValue ?? false;
            break;
          default:
            defaults[port.id] = port.defaultValue ?? null;
        }
      });
      setMockInputs(defaults);
      setTestResult(null);
    }
  }, [isOpen, inputs]);
  
  const handleInputChange = useCallback((portId: string, value: unknown) => {
    setMockInputs(prev => ({ ...prev, [portId]: value }));
  }, []);
  
  const runTest = useCallback(async () => {
    setIsRunning(true);
    setTestResult(null);
    
    // Simulate a test run (in real implementation, this would execute the subflow)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTestResult({
      success: true,
      result: {
        message: 'Test completed with mock inputs',
        inputs: mockInputs,
      },
    });
    setIsRunning(false);
  }, [mockInputs]);
  
  const getInputWidget = (port: SubflowPort) => {
    const value = mockInputs[port.id];
    
    switch (port.type) {
      case 'number':
        return (
          <input
            type="number"
            value={(value as number) ?? 0}
            onChange={(e) => handleInputChange(port.id, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white"
          />
        );
      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(value as boolean) ?? false}
              onChange={(e) => handleInputChange(port.id, e.target.checked)}
              className="w-4 h-4 rounded border-neutral-700 bg-neutral-800"
            />
            <span className="text-sm text-neutral-400">{value ? 'true' : 'false'}</span>
          </label>
        );
      case 'string':
      default:
        return (
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => handleInputChange(port.id, e.target.value)}
            placeholder={port.description || port.name}
            className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white"
          />
        );
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Test: ${nodeLabel}`}
      subtitle="Run subflow with mock inputs"
      icon={<FlaskConical className="w-5 h-5" />}
      iconColor="text-indigo-400"
      size="md"
    >
      <div className="space-y-6">
        {/* Mock Inputs */}
        {inputs.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-neutral-300">Mock Inputs</h4>
            <div className="space-y-3">
              {inputs.map((port) => (
                <div key={port.id} className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-neutral-400">
                    <span className="font-medium">{port.name}</span>
                    <span className="text-xs text-neutral-500">({port.type})</span>
                  </label>
                  {getInputWidget(port)}
                  {port.description && (
                    <p className="text-xs text-neutral-500">{port.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-neutral-500 text-center py-4">
            This subflow has no inputs
          </div>
        )}
        
        {/* Run Button */}
        <button
          onClick={runTest}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg transition-colors"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Test
            </>
          )}
        </button>
        
        {/* Results */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <h4 className={`text-sm font-semibold mb-2 ${
              testResult.success ? 'text-green-400' : 'text-red-400'
            }`}>
              {testResult.success ? 'Test Passed' : 'Test Failed'}
            </h4>
            {testResult.result !== undefined && (
              <pre className="text-xs font-mono text-neutral-300 bg-neutral-900/50 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(testResult.result, null, 2)}
              </pre>
            )}
            {testResult.error && (
              <p className="text-sm text-red-400">{testResult.error}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
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
  const [showTestModal, setShowTestModal] = useState(false);
  
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
            {cache.error.message}
          </div>
        </div>
      )}

      {/* Test Button - visible on hover */}
      {isHovered && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTestModal(true);
            }}
            className="p-1.5 bg-indigo-600/80 hover:bg-indigo-500 rounded-md text-white transition-colors"
            title="Test subflow with mock inputs"
          >
            <FlaskConical className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Test Modal */}
      <SubflowTestModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        config={config}
        nodeLabel={data.label || config?.nodeName || 'Subflow'}
      />
    </div>
  );
});

SubflowNode.displayName = 'SubflowNode';

export default SubflowNode;