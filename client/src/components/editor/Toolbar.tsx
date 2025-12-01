/**
 * Editor Toolbar - Node palette and actions
 */

import { useCallback, useState } from 'react';
import { 
  Zap, 
  Hash, 
  Type, 
  ToggleLeft, 
  FolderOpen, 
  Save, 
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useFlowStore, type FlowNode } from '../../store/flowStore';

const nodeCategories = [
  {
    name: 'Logic',
    nodes: [
      {
        type: 'code',
        label: 'Code',
        Icon: Zap,
        description: 'Execute Synthase script',
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
      },
    ],
  },
  {
    name: 'Inputs',
    nodes: [
      {
        type: 'number_input',
        label: 'Number',
        Icon: Hash,
        description: 'Numeric input',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
      },
      {
        type: 'text_input',
        label: 'Text',
        Icon: Type,
        description: 'Text input',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
      },
      {
        type: 'boolean_input',
        label: 'Boolean',
        Icon: ToggleLeft,
        description: 'True/False',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
      },
    ],
  },
  {
    name: 'Schematics',
    nodes: [
      {
        type: 'schematic_input',
        label: 'Load',
        Icon: FolderOpen,
        description: 'Load schematic',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
      },
      {
        type: 'schematic_output',
        label: 'Save',
        Icon: Save,
        description: 'Export schematic',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
      },
      {
        type: 'schematic_viewer',
        label: 'Viewer',
        Icon: Eye,
        description: '3D preview',
        color: 'text-pink-400',
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/20',
      },
    ],
  },
];

export function Toolbar() {
  const { addNode, nodes } = useFlowStore();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Logic: true,
    Inputs: true,
    Schematics: true,
  });

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleAddNode = useCallback(
    (template: typeof nodeCategories[0]['nodes'][0]) => {
      const existingPositions = nodes.map((n) => n.position);
      const maxX = existingPositions.reduce((max, p) => Math.max(max, p.x), 0);
      const avgY = existingPositions.length > 0
        ? existingPositions.reduce((sum, p) => sum + p.y, 0) / existingPositions.length
        : 200;

      const newNode: FlowNode = {
        id: `${template.type}-${Date.now()}`,
        type: template.type,
        position: { x: maxX + 280, y: avgY },
        data: {
          label: template.label,
          code: template.type === 'code' ? '// Write your script here\n\nconst { Schematic } = context;\nconst schem = new Schematic();\n\nexport const output = schem;\n' : undefined,
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
    <div className="absolute top-4 left-4 z-10 w-56">
      <div className="bg-neutral-900/90 backdrop-blur-xl rounded-xl border border-neutral-800/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-800/50">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Add Node
          </h3>
        </div>

        {/* Categories */}
        <div className="p-2 space-y-1">
          {nodeCategories.map((category) => (
            <div key={category.name}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-800/50"
              >
                <span>{category.name}</span>
                {expandedCategories[category.name] ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>

              {/* Nodes */}
              {expandedCategories[category.name] && (
                <div className="mt-1 space-y-1 ml-2">
                  {category.nodes.map((template) => (
                    <button
                      key={template.type}
                      onClick={() => handleAddNode(template)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg
                        border ${template.border} ${template.bg}
                        hover:scale-[1.02] active:scale-[0.98]
                        transition-all duration-150
                        group
                      `}
                      title={template.description}
                    >
                      <template.Icon className={`w-4 h-4 ${template.color}`} />
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-white">{template.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
