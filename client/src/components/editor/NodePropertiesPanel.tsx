/**
 * NodePropertiesPanel - Edit non-code node properties
 */

import { Hash, Type, ToggleLeft, FolderOpen, Save, Eye, Info } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';

interface NodePropertiesPanelProps {
  nodeId: string;
}

export function NodePropertiesPanel({ nodeId }: NodePropertiesPanelProps) {
  const { nodes, updateNodeData } = useFlowStore();
  const node = nodes.find((n) => n.id === nodeId);

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 p-8">
        <div className="text-center">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Node not found</p>
        </div>
      </div>
    );
  }

  const getNodeIcon = () => {
    switch (node.type) {
      case 'number_input': return Hash;
      case 'text_input': return Type;
      case 'boolean_input': return ToggleLeft;
      case 'schematic_input': return FolderOpen;
      case 'schematic_output': return Save;
      case 'schematic_viewer': return Eye;
      default: return Info;
    }
  };

  const getNodeColor = () => {
    switch (node.type) {
      case 'number_input':
      case 'text_input':
      case 'boolean_input':
        return { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' };
      case 'schematic_input':
        return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' };
      case 'schematic_output':
        return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' };
      case 'schematic_viewer':
        return { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400' };
      default:
        return { bg: 'bg-neutral-500/10', border: 'border-neutral-500/20', text: 'text-neutral-400' };
    }
  };

  const Icon = getNodeIcon();
  const colors = getNodeColor();

  const isInputNode = node.type?.includes('input');

  return (
    <div className="p-6">
      {/* Node Type Header */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-800/50">
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colors.bg} border ${colors.border}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div>
          <div className="font-semibold text-white text-lg">
            {node.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </div>
          <div className="text-sm text-neutral-500">
            Node ID: <code className="text-neutral-400">{node.id}</code>
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="space-y-5">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Label</label>
          <input
            type="text"
            value={node.data.label || ''}
            onChange={(e) => updateNodeData(nodeId, { label: e.target.value })}
            className="input"
            placeholder="Enter node label..."
          />
        </div>

        {/* Value for input nodes */}
        {isInputNode && (
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Default Value</label>
            {node.type === 'boolean_input' ? (
              <button
                onClick={() => updateNodeData(nodeId, { value: !node.data.value })}
                className={`
                  w-full px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${node.data.value 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-neutral-800/50 text-neutral-400 border border-neutral-700/50'
                  }
                `}
              >
                {node.data.value ? 'True' : 'False'}
              </button>
            ) : (
              <input
                type={node.type === 'number_input' ? 'number' : 'text'}
                value={node.data.value as string ?? ''}
                onChange={(e) => updateNodeData(nodeId, { 
                  value: node.type === 'number_input' 
                    ? parseFloat(e.target.value) || 0 
                    : e.target.value 
                })}
                className="input"
                placeholder={node.type === 'number_input' ? '0' : 'Enter value...'}
              />
            )}
          </div>
        )}

        {/* Position info */}
        <div className="pt-5 border-t border-neutral-800/50">
          <label className="block text-sm font-medium text-neutral-300 mb-3">Position</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">X</label>
              <div className="px-3 py-2 bg-neutral-900/50 border border-neutral-800/50 rounded-lg text-sm text-neutral-400 font-mono">
                {Math.round(node.position.x)}
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Y</label>
              <div className="px-3 py-2 bg-neutral-900/50 border border-neutral-800/50 rounded-lg text-sm text-neutral-400 font-mono">
                {Math.round(node.position.y)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

