/**
 * Editor Toolbar - Node palette and actions
 * Simplified: one input node per data type
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
  Box,
} from 'lucide-react';
import { useFlowStore, type FlowNode } from '../../store/flowStore';

interface NodeTemplate {
  type: string;
  label: string;
  Icon: typeof Zap;
  description: string;
  color: string;
  bg: string;
  border: string;
  defaultValue?: unknown;
  dataType?: 'number' | 'string' | 'boolean';
  config?: Record<string, unknown>;
}

const nodeCategories: { name: string; nodes: NodeTemplate[] }[] = [
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
      {
        type: 'viewer',
        label: 'Viewer',
        Icon: Eye,
        description: 'View any data type',
        color: 'text-pink-400',
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/20',
      },
    ],
  },
  {
    name: 'Inputs',
    nodes: [
      {
        type: 'input',
        label: 'Number',
        Icon: Hash,
        description: 'Number input (field or slider)',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        dataType: 'number',
        defaultValue: 0,
        config: { widgetType: 'number' },
      },
      {
        type: 'input',
        label: 'Text',
        Icon: Type,
        description: 'Text input (field or textarea)',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        dataType: 'string',
        defaultValue: '',
        config: { widgetType: 'text' },
      },
      {
        type: 'input',
        label: 'Boolean',
        Icon: ToggleLeft,
        description: 'True/False toggle',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        dataType: 'boolean',
        defaultValue: false,
        config: { widgetType: 'boolean' },
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
        description: 'Load schematic file',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
      },
      {
        type: 'schematic_output',
        label: 'Save',
        Icon: Save,
        description: 'Export schematic file',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
      },
    ],
  },
];

const getDefaultCode = () => `export const io = {
    inputs: {
        height: { type: 'number', default: 5, description: 'Height of the tower' },
        width: { type: 'number', default: 3, description: 'Width of the tower' },
        depth: { type: 'number', default: 3, description: 'Depth of the tower' },
        material: { 
            type: 'string', 
            default: 'minecraft:stone', 
            description: 'Material to use',
            options: ['minecraft:stone', 'minecraft:redstone_block', 'minecraft:glass']
        },
    },
    outputs: {
        schematic: { type: 'object' }
    }
};

export default async function({ height, width, depth, material }, { Schematic }) {
    const schem = new Schematic();
    
    // Build vertical tower
    for (let y = 0; y < height; y++) {
        schem.set_block(0, y, 0, material);
    }
    
    // Build along width
    for (let x = 1; x < width; x++) {
        schem.set_block(x, 0, 0, material);
    }
    
    // Build along depth
    for (let z = 1; z < depth; z++) {
        schem.set_block(0, 0, z, material);
    }
    
    return { schematic: schem };
}
`;

export function Toolbar() {
  const { addNode, nodes, setNodeOutput } = useFlowStore();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Logic: true,
    Inputs: true,
    Schematics: false,
  });

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleAddNode = useCallback(
    (template: NodeTemplate) => {
      const existingPositions = nodes.map((n) => n.position);
      const maxX = existingPositions.reduce((max, p) => Math.max(max, p.x), 0);
      const avgY = existingPositions.length > 0
        ? existingPositions.reduce((sum, p) => sum + p.y, 0) / existingPositions.length
        : 200;

      const nodeId = `${template.type}-${Date.now()}`;
      const isInputNode = template.type === 'input';
      
      const newNode: FlowNode = {
        id: nodeId,
        type: template.type,
        position: { x: maxX + 280, y: avgY },
        data: {
          label: template.label,
          code: template.type === 'code' ? getDefaultCode() : undefined,
          value: template.defaultValue,
          dataType: template.dataType,
          ...template.config,
        },
      };

      addNode(newNode);
      
      // For input nodes, immediately set their output as ready
      if (isInputNode && template.defaultValue !== undefined) {
        setTimeout(() => {
          setNodeOutput(nodeId, { output: template.defaultValue });
        }, 0);
      }
    },
    [addNode, nodes, setNodeOutput]
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
        <div className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
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
                  {category.nodes.map((template, index) => (
                    <button
                      key={`${template.type}-${template.label}-${index}`}
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
        
        {/* Help tip */}
        <div className="px-4 py-3 border-t border-neutral-800/50 bg-neutral-900/50">
          <p className="text-[10px] text-neutral-500">
            Input nodes have widget settings (gear icon) to change between slider/field
          </p>
        </div>
      </div>
    </div>
  );
}
