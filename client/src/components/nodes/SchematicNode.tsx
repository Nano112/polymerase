/**
 * SchematicNode - Schematic input/output/viewer nodes
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useFlowStore } from '../../store/flowStore';

interface SchematicNodeData {
  label?: string;
  schematicType?: 'input' | 'output' | 'viewer';
  fileName?: string;
  dimensions?: { x: number; y: number; z: number };
  blockCount?: number;
}

const SchematicNode = memo(({ id, data, selected, type }: NodeProps & { data: SchematicNodeData }) => {
  const selectNode = useFlowStore((state) => state.selectNode);
  
  const schematicType = data.schematicType || 
    (type === 'schematic_input' ? 'input' : 
     type === 'schematic_output' ? 'output' : 'viewer');

  const getColors = () => {
    switch (schematicType) {
      case 'input':
        return {
          gradient: 'from-orange-600 to-red-600',
          border: 'border-orange-500',
          shadow: 'shadow-orange-500/20',
        };
      case 'output':
        return {
          gradient: 'from-cyan-600 to-blue-600',
          border: 'border-cyan-500',
          shadow: 'shadow-cyan-500/20',
        };
      default:
        return {
          gradient: 'from-pink-600 to-rose-600',
          border: 'border-pink-500',
          shadow: 'shadow-pink-500/20',
        };
    }
  };

  const colors = getColors();
  const hasInput = schematicType !== 'input';
  const hasOutput = schematicType !== 'viewer';

  const getIcon = () => {
    switch (schematicType) {
      case 'input': return '📂';
      case 'output': return '💾';
      default: return '👁️';
    }
  };

  return (
    <div
      className={`
        relative min-w-[180px] rounded-lg overflow-hidden
        bg-gradient-to-br from-slate-900 to-slate-800
        border-2 transition-all duration-200
        ${selected ? `${colors.border} shadow-lg ${colors.shadow}` : 'border-slate-700'}
      `}
      onClick={() => selectNode(id)}
    >
      {/* Header */}
      <div className={`px-3 py-2 bg-gradient-to-r ${colors.gradient} text-white`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{getIcon()}</span>
          <span className="font-medium text-sm truncate">
            {data.label || `Schematic ${schematicType.charAt(0).toUpperCase() + schematicType.slice(1)}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Schematic preview placeholder */}
        <div className="bg-slate-950 rounded aspect-video flex items-center justify-center border border-slate-800">
          <div className="text-center text-slate-600">
            <div className="text-2xl mb-1">📦</div>
            <div className="text-[10px]">
              {data.fileName ? data.fileName : 'No schematic'}
            </div>
          </div>
        </div>

        {/* Metadata */}
        {(data.dimensions || data.blockCount) && (
          <div className="mt-2 flex gap-2 flex-wrap text-[10px]">
            {data.dimensions && (
              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                {data.dimensions.x}×{data.dimensions.y}×{data.dimensions.z}
              </span>
            )}
            {data.blockCount !== undefined && (
              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                {data.blockCount.toLocaleString()} blocks
              </span>
            )}
          </div>
        )}
      </div>

      {/* Input Handle */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900"
          title="Schematic In"
        />
      )}

      {/* Output Handle */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900"
          title="Schematic Out"
        />
      )}
    </div>
  );
});

SchematicNode.displayName = 'SchematicNode';

export default SchematicNode;

