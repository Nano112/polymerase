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
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Workflow,
  Save,
  Trash2,
  FolderTree,
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
    name: 'Files',
    nodes: [
      {
        type: 'file_input',
        label: 'File Input',
        Icon: Upload,
        description: 'Load any file (schematic, image, CSV, etc.)',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
      },
      {
        type: 'file_output',
        label: 'File Output',
        Icon: Download,
        description: 'Export/download file',
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

export function Toolbar({ isMobile = false, onNodeAdded }: ToolbarProps) {
  const { 
    addNode, 
    nodes, 
    edges,
    setNodeOutput, 
    savedSubflows, 
    saveAsSubflow, 
    deleteSubflow, 
    addSubflowNode,
    exportFlow
  } = useFlowStore();
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Logic: true,
    Inputs: true,
    Files: false,
    Subflows: true,
  });
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Check if current flow can be saved as a subflow
  const canSaveAsSubflow = useMemo(() => {
    const flow = exportFlow();
    const extracted = extractSubflowConfig(flow);
    return extracted.valid;
  }, [exportFlow, nodes, edges]);
  
  // Get validation message
  const subflowValidation = useMemo(() => {
    const flow = exportFlow();
    return extractSubflowConfig(flow);
  }, [exportFlow, nodes, edges]);

  // Group subflows by category
  const subflowsByCategory = useMemo(() => {
    const grouped: Record<string, SavedSubflow[]> = {};
    for (const subflow of savedSubflows) {
      const cat = subflow.category || 'Custom';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(subflow);
    }
    return grouped;
  }, [savedSubflows]);

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
      
      // Callback for mobile to close sheet
      onNodeAdded?.();
    },
    [addNode, nodes, setNodeOutput, onNodeAdded]
  );

  const handleAddSubflow = useCallback((subflow: SavedSubflow) => {
    const existingPositions = nodes.map((n) => n.position);
    const maxX = existingPositions.reduce((max, p) => Math.max(max, p.x), 0);
    const avgY = existingPositions.length > 0
      ? existingPositions.reduce((sum, p) => sum + p.y, 0) / existingPositions.length
      : 200;
      
    addSubflowNode(subflow, { x: maxX + 280, y: avgY });
    onNodeAdded?.();
  }, [nodes, addSubflowNode, onNodeAdded]);

  const handleSaveAsSubflow = useCallback((name: string, category: string) => {
    const result = saveAsSubflow(name, category);
    if (result) {
      setShowSaveDialog(false);
      setValidationError(undefined);
    } else {
      setValidationError(subflowValidation.error || 'Failed to save as subflow');
    }
  }, [saveAsSubflow, subflowValidation]);

  const handleOpenSaveDialog = useCallback(() => {
    if (!canSaveAsSubflow) {
      setValidationError(subflowValidation.error);
    } else {
      setValidationError(undefined);
    }
    setShowSaveDialog(true);
  }, [canSaveAsSubflow, subflowValidation]);

  // Mobile layout
  if (isMobile) {
    return (
      <>
        {/* Mobile Grid Layout */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Add Node</h3>
            <button
              onClick={handleOpenSaveDialog}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                ${canSaveAsSubflow 
                  ? 'bg-indigo-500/20 text-indigo-400' 
                  : 'bg-neutral-800 text-neutral-500'
                }
              `}
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">Save as Node</span>
            </button>
          </div>
          
          {/* Node Grid */}
          {nodeCategories.map((category) => (
            <div key={category.name}>
              <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                {category.name}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {category.nodes.map((template, index) => (
                  <button
                    key={`${template.type}-${template.label}-${index}`}
                    onClick={() => handleAddNode(template)}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-xl
                      border ${template.border} ${template.bg}
                      active:scale-95 transition-transform
                    `}
                  >
                    <template.Icon className={`w-6 h-6 ${template.color}`} />
                    <span className="text-xs font-medium text-white text-center">{template.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {/* Subflows */}
          {savedSubflows.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FolderTree className="w-3 h-3" />
                Subflows
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {savedSubflows.map((subflow) => (
                  <button
                    key={subflow.id}
                    onClick={() => handleAddSubflow(subflow)}
                    className="flex items-center gap-2 p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 active:scale-95 transition-transform"
                  >
                    <Workflow className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-medium text-white truncate">{subflow.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Save As Node Dialog */}
        <SaveAsNodeDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={handleSaveAsSubflow}
          validationError={validationError}
        />
      </>
    );
  }

  // Desktop layout
  return (
    <>
      <div className="absolute top-4 left-4 z-10 w-56">
        <div className="bg-neutral-900/90 backdrop-blur-xl rounded-xl border border-neutral-800/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-800/50 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Add Node
            </h3>
            <button
              onClick={handleOpenSaveDialog}
              className={`
                p-1.5 rounded-lg transition-colors
                ${canSaveAsSubflow 
                  ? 'text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300' 
                  : 'text-neutral-600 hover:text-neutral-500'
                }
              `}
              title={canSaveAsSubflow ? 'Save flow as reusable node' : 'Add inputs and outputs to save as node'}
            >
              <Save className="w-4 h-4" />
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
                  {expandedCategories[category.name] ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

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
                  {expandedCategories['Subflows'] ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {expandedCategories['Subflows'] && (
                  <div className="mt-1 space-y-2 ml-2">
                    {Object.entries(subflowsByCategory).map(([cat, subflows]) => (
                      <div key={cat}>
                        <div className="text-[10px] text-neutral-500 px-2 py-1">{cat}</div>
                        {subflows.map((subflow) => (
                          <div
                            key={subflow.id}
                            className="group relative"
                          >
                            <button
                              onClick={() => handleAddSubflow(subflow)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
                              title={`${subflow.config.inputs.length} inputs, ${subflow.config.outputs.length} outputs`}
                            >
                              <Workflow className="w-4 h-4 text-indigo-400" />
                              <div className="flex-1 text-left">
                                <span className="text-sm font-medium text-white">{subflow.name}</span>
                              </div>
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${subflow.name}"?`)) {
                                  deleteSubflow(subflow.id);
                                }
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Delete subflow"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
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
      </div>
      
      {/* Save As Node Dialog */}
      <SaveAsNodeDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveAsSubflow}
        validationError={validationError}
      />
    </>
  );
}
