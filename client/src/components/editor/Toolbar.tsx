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
  GripVertical,
  Plus,
  X
} from 'lucide-react';
import { useFlowStore, type FlowNode, type SavedSubflow } from '../../store/flowStore';
import { Modal } from '../ui/Modal';

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

// ============================================================================
// Main Toolbar Component
// ============================================================================

export function Toolbar() {
  const addNode = useFlowStore((state) => state.addNode);
  const savedSubflows = useFlowStore((state) => state.savedSubflows);
  const deleteSubflow = useFlowStore((state) => state.deleteSubflow);
  const saveAsSubflow = useFlowStore((state) => state.saveAsSubflow);
  const flowName = useFlowStore((state) => state.flowName);
  
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Logic', 'Inputs', 'Outputs', 'Subflows']);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [subflowName, setSubflowName] = useState('');
  const [subflowCategory, setSubflowCategory] = useState('Custom');
  const [saveError, setSaveError] = useState<string | null>(null);

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
    
    const newNode: FlowNode = {
      id,
      type: 'subflow',
      position: { x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 },
      data: { 
        label: subflow.name,
        flowId: subflow.id,
        subflowConfig: subflow.config
      },
    };
    addNode(newNode);
  }, [addNode]);

  const handleSaveAsSubflow = useCallback(() => {
    if (!subflowName.trim()) {
      setSaveError('Please enter a name');
      return;
    }
    
    const result = saveAsSubflow(subflowName.trim(), subflowCategory);
    if (result) {
      setShowSaveDialog(false);
      setSubflowName('');
      setSubflowCategory('Custom');
      setSaveError(null);
    } else {
      setSaveError('Flow must have at least one input and one output node to be saved as a subflow');
    }
  }, [subflowName, subflowCategory, saveAsSubflow]);

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
      event.dataTransfer.setData('application/reactflow-data', JSON.stringify({
        label: subflow.name,
        flowId: subflow.id,
        subflowConfig: subflow.config
      }));
    }
    
    event.dataTransfer.effectAllowed = 'move';
  };

  if (isCollapsed) {
    return (
      <div className="absolute left-4 top-20 z-10 flex flex-col gap-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-lg text-neutral-400 hover:text-white hover:border-white/20 shadow-lg transition-all"
          title="Expand Toolbar"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="absolute left-4 top-20 bottom-4 w-64 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-left-4 duration-200">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            Nodes
          </h2>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Collapse Toolbar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Categories */}
        <div className="p-2 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {/* Built-in node categories */}
          {nodeCategories.map((category) => (
            <div key={category.name}>
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors rounded-lg hover:bg-white/5"
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
                        hover:border-white/10 hover:bg-white/5 cursor-grab active:cursor-grabbing transition-all
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
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors rounded-lg hover:bg-white/5"
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
                          className="group relative flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 cursor-grab active:cursor-grabbing transition-all bg-indigo-500/5"
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
        <div className="px-4 py-3 border-t border-white/5 bg-white/5 space-y-2 rounded-b-2xl">
          <button
            onClick={() => {
              setSubflowName(flowName || 'My Subflow');
              setShowSaveDialog(true);
              setSaveError(null);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            <Plus className="w-4 h-4" />
            Save as Subflow
          </button>
          <p className="text-[10px] text-neutral-500 text-center">
            {savedSubflows.length === 0 
              ? 'Create reusable nodes from flows'
              : `${savedSubflows.length} custom node${savedSubflows.length !== 1 ? 's' : ''} available`
            }
          </p>
        </div>
      </div>

      {/* Save as Subflow Dialog */}
      <Modal
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title="Save as Subflow"
        subtitle="Create a reusable node from your current flow"
        icon={<Workflow className="w-5 h-5" />}
        iconColor="text-blue-400"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Name</label>
            <input
              type="text"
              value={subflowName}
              onChange={(e) => setSubflowName(e.target.value)}
              placeholder="My Subflow"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveAsSubflow();
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Category</label>
            <input
              type="text"
              value={subflowCategory}
              onChange={(e) => setSubflowCategory(e.target.value)}
              placeholder="Custom"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          {saveError && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
              <X className="w-4 h-4" />
              {saveError}
            </div>
          )}
          
          <p className="text-xs text-neutral-500">
            The flow must have at least one input node and one output node to be saved as a reusable subflow.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAsSubflow}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Save className="w-4 h-4" />
              Save Subflow
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
