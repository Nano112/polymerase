/**
 * Editor Toolbar - Node palette, subflows, and actions
 */

import { useCallback, useState, useMemo } from 'react';
import { 
  Zap, 
  Hash, 
  Type, 
  ToggleLeft, 
  Upload,
  ArrowRightFromLine,
  Eye,
  ChevronDown,
  ChevronUp,
  Workflow,
  Save,
  Trash2,
  FolderTree,
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical
} from 'lucide-react';
import { useFlowStore, type FlowNode, type SavedSubflow } from '../../store/flowStore';
import { extractSubflowConfig } from '@polymerase/core';

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
        description: 'Preview any data type',
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
      {
        type: 'file_input',
        label: 'File',
        Icon: Upload,
        description: 'Load file (schematic, image, CSV, etc.)',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
      },
    ],
  },
  {
    name: 'Outputs',
    nodes: [
      {
        type: 'output',
        label: 'Output',
        Icon: ArrowRightFromLine,
        description: 'Flow output (for subflows) with optional download',
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

// ============================================================================
// Save As Node Dialog
// ============================================================================

interface SaveAsNodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, category: string) => void;
  validationError?: string;
}

function SaveAsNodeDialog({ isOpen, onClose, onSave, validationError }: SaveAsNodeDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl w-96 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Save className="w-5 h-5 text-indigo-400" />
          Save as Reusable Node
        </h2>
        
        {validationError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {validationError}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Node Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Node"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Custom"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name, category)}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Node
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Toolbar Component
// ============================================================================

interface ToolbarProps {
  isMobile?: boolean;
  onNodeAdded?: () => void;
}

export function Toolbar() {
  const addNode = useFlowStore((state) => state.addNode);
  const savedSubflows = useFlowStore((state) => state.savedSubflows);
  const deleteSubflow = useFlowStore((state) => state.deleteSubflow);
  
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Logic', 'Inputs', 'Outputs', 'Subflows']);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const subflowsByCategory = useMemo(() => {
    const groups: Record<string, SavedSubflow[]> = {};
    savedSubflows.forEach(subflow => {
      const category = subflow.category || 'Custom';
      if (!groups[category]) groups[category] = [];
      groups[category].push(subflow);
    });
    return groups;
  }, [savedSubflows]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddNode = useCallback((template: NodeTemplate) => {
    const id = `${template.type}-${crypto.randomUUID().slice(0, 8)}`;
    const newNode: FlowNode = {
      id,
      type: template.type,
      position: { x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 },
      data: { 
        label: template.label,
        value: template.defaultValue,
        dataType: template.dataType,
        ...template.config
      },
    };
    addNode(newNode);
  }, [addNode]);

  const handleAddSubflow = useCallback((subflow: SavedSubflow) => {
    const id = `subflow-${crypto.randomUUID().slice(0, 8)}`;
    
    // Extract config from the saved flow
    const subflowConfig = extractSubflowConfig(subflow.flow);
    
    const newNode: FlowNode = {
      id,
      type: 'subflow',
      position: { x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 },
      data: { 
        label: subflow.name,
        flowId: subflow.id,
        subflowConfig
      },
    };
    addNode(newNode);
  }, [addNode]);

  const onDragStart = (event: React.DragEvent, nodeType: string, template?: NodeTemplate, subflow?: SavedSubflow) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    
    if (template) {
      event.dataTransfer.setData('application/reactflow-data', JSON.stringify({
        label: template.label,
        value: template.defaultValue,
        dataType: template.dataType,
        ...template.config
      }));
    } else if (subflow) {
      const subflowConfig = extractSubflowConfig(subflow.flow);
      event.dataTransfer.setData('application/reactflow-data', JSON.stringify({
        label: subflow.name,
        flowId: subflow.id,
        subflowConfig
      }));
    }
    
    event.dataTransfer.effectAllowed = 'move';
  };

  if (isCollapsed) {
    return (
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-700 shadow-lg transition-all"
          title="Expand Toolbar"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-4 bottom-4 w-64 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-left-4 duration-200">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          Nodes
        </h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-300 transition-colors"
          title="Collapse Toolbar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Categories */}
      <div className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
        {/* Built-in node categories */}
        {nodeCategories.map((category) => (
          <div key={category.name}>
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-800/50"
            >
              <span>{category.name}</span>
              {expandedCategories.includes(category.name) ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {expandedCategories.includes(category.name) && (
              <div className="mt-1 space-y-1 ml-2">
                {category.nodes.map((node) => (
                  <div
                    key={node.type + node.label}
                    draggable
                    onDragStart={(event) => onDragStart(event, node.type, node)}
                    onClick={() => handleAddNode(node)}
                    className={`
                      group flex items-center gap-3 p-2.5 rounded-lg border border-transparent
                      hover:border-neutral-700 hover:bg-neutral-800/50 cursor-grab active:cursor-grabbing transition-all
                      ${node.bg} bg-opacity-5
                    `}
                  >
                    <div className={`p-2 rounded-md ${node.bg} ${node.border} border`}>
                      <node.Icon className={`w-4 h-4 ${node.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
                        {node.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate">
                        {node.description}
                      </div>
                    </div>
                    <GripVertical className="w-4 h-4 text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Subflows section */}
        {savedSubflows.length > 0 && (
          <div>
            <button
              onClick={() => toggleCategory('Subflows')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-800/50"
            >
              <span className="flex items-center gap-1.5">
                <FolderTree className="w-3 h-3" />
                Subflows
              </span>
              {expandedCategories.includes('Subflows') ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {expandedCategories.includes('Subflows') && (
              <div className="mt-1 space-y-2 ml-2">
                {Object.entries(subflowsByCategory).map(([cat, subflows]) => (
                  <div key={cat}>
                    <div className="text-[10px] text-neutral-500 px-2 py-1">{cat}</div>
                    {subflows.map((subflow) => (
                      <div
                        key={subflow.id}
                        draggable
                        onDragStart={(event) => onDragStart(event, 'subflow', undefined, subflow)}
                        className="group relative flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-neutral-700 hover:bg-neutral-800/50 cursor-grab active:cursor-grabbing transition-all bg-indigo-500/5"
                      >
                        <div className="p-2 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                          <Workflow className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleAddSubflow(subflow)}
                        >
                          <div className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors truncate">
                            {subflow.name}
                          </div>
                          <div className="text-[10px] text-neutral-500 truncate">
                            {new Date(subflow.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSubflow(subflow.id);
                          }}
                          className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete Subflow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <GripVertical className="w-4 h-4 text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-800/50 bg-neutral-900/50">
        {savedSubflows.length === 0 ? (
          <p className="text-[10px] text-neutral-500">
            Save a flow with inputs & outputs to create reusable nodes
          </p>
        ) : (
          <p className="text-[10px] text-neutral-500">
            {savedSubflows.length} custom node{savedSubflows.length !== 1 ? 's' : ''} available
          </p>
        )}
      </div>
    </div>
  );
}
