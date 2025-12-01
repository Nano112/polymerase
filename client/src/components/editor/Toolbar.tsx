/**
 * Editor Toolbar - Node palette and actions
 */

import { useCallback } from 'react';
import { useFlowStore, type FlowNode } from '../../store/flowStore';

const nodeTemplates = [
  {
    type: 'code',
    label: 'Code',
    icon: '⚡',
    description: 'Execute Synthase script',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    type: 'number_input',
    label: 'Number',
    icon: '🔢',
    description: 'Numeric input value',
    color: 'from-violet-600 to-purple-600',
  },
  {
    type: 'text_input',
    label: 'Text',
    icon: '📝',
    description: 'Text input value',
    color: 'from-violet-600 to-purple-600',
  },
  {
    type: 'boolean_input',
    label: 'Boolean',
    icon: '⚡',
    description: 'True/False toggle',
    color: 'from-violet-600 to-purple-600',
  },
  {
    type: 'schematic_input',
    label: 'Load Schematic',
    icon: '📂',
    description: 'Load schematic file',
    color: 'from-orange-600 to-red-600',
  },
  {
    type: 'schematic_output',
    label: 'Save Schematic',
    icon: '💾',
    description: 'Export schematic file',
    color: 'from-cyan-600 to-blue-600',
  },
  {
    type: 'schematic_viewer',
    label: 'Viewer',
    icon: '👁️',
    description: '3D schematic preview',
    color: 'from-pink-600 to-rose-600',
  },
];

export function Toolbar() {
  const { addNode, nodes } = useFlowStore();

  const handleAddNode = useCallback(
    (template: typeof nodeTemplates[0]) => {
      // Calculate position based on existing nodes
      const existingPositions = nodes.map((n) => n.position);
      const maxX = existingPositions.reduce((max, p) => Math.max(max, p.x), 0);
      const avgY = existingPositions.length > 0
        ? existingPositions.reduce((sum, p) => sum + p.y, 0) / existingPositions.length
        : 200;

      const newNode: FlowNode = {
        id: `${template.type}-${Date.now()}`,
        type: template.type,
        position: { x: maxX + 250, y: avgY },
        data: {
          label: template.label,
          code: template.type === 'code' ? '// Write your script here\n\nexport const output = input;\n' : undefined,
          value: template.type === 'number_input' ? 0 : 
                 template.type === 'boolean_input' ? false : '',
          inputType: template.type.replace('_input', '') as 'number' | 'text' | 'boolean',
        },
      };

      addNode(newNode);
    },
    [addNode, nodes]
  );

  return (
    <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700 p-3 shadow-xl">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
        Add Node
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {nodeTemplates.map((template) => (
          <button
            key={template.type}
            onClick={() => handleAddNode(template)}
            className={`
              flex flex-col items-center gap-1 p-2 rounded-lg
              bg-gradient-to-br ${template.color}
              hover:scale-105 active:scale-95
              transition-all duration-150
              text-white shadow-lg
            `}
            title={template.description}
          >
            <span className="text-lg">{template.icon}</span>
            <span className="text-[10px] font-medium">{template.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

