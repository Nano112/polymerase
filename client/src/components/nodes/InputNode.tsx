/**
 * InputNode - Unified input node with data type and widget type settings
 * Supports: number, string, boolean with various widget options
 */

import { memo, useCallback, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { 
  Hash, Type, ToggleLeft, List, Lock, Unlock, Sliders,
  CheckCircle, Settings
} from 'lucide-react';
import { useFlowStore, type InputWidgetType } from '../../store/flowStore';

export type DataType = 'number' | 'string' | 'boolean';

interface InputNodeData {
  label?: string;
  value?: unknown;
  dataType?: DataType;          // The actual data type
  widgetType?: InputWidgetType; // How to display/input the value
  isConstant?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  placeholder?: string;
  description?: string;
  // Legacy support
  inputType?: 'number' | 'text' | 'boolean';
}

// Widget options per data type
const widgetOptionsForType: Record<DataType, { value: InputWidgetType; label: string; icon: typeof Hash }[]> = {
  number: [
    { value: 'number', label: 'Number Field', icon: Hash },
    { value: 'slider', label: 'Slider', icon: Sliders },
  ],
  string: [
    { value: 'text', label: 'Text Field', icon: Type },
    { value: 'textarea', label: 'Text Area', icon: Type },
    { value: 'select', label: 'Dropdown', icon: List },
  ],
  boolean: [
    { value: 'boolean', label: 'Toggle', icon: ToggleLeft },
  ],
};

const InputNode = memo(({ id, data, selected, type }: NodeProps & { data: InputNodeData }) => {
  const { selectNode, updateNodeData, nodeCache, setNodeOutput } = useFlowStore();
  const [isHovered, setIsHovered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const cache = nodeCache[id];
  const isReady = cache?.status === 'completed';
  
  // Determine data type from node type or data (support legacy and new format)
  const dataType: DataType = data.dataType || 
    (type === 'number_input' ? 'number' : 
     type === 'boolean_input' ? 'boolean' : 
     type === 'text_input' || type === 'select_input' ? 'string' : 
     data.inputType === 'number' ? 'number' :
     data.inputType === 'boolean' ? 'boolean' : 'string');
  
  // Determine widget type (default based on data type)
  const widgetType: InputWidgetType = data.widgetType || 
    (dataType === 'number' ? 'number' : 
     dataType === 'boolean' ? 'boolean' : 
     data.options?.length ? 'select' : 'text');
  
  const isConstant = data.isConstant ?? false;
  const availableWidgets = widgetOptionsForType[dataType] || [];

  const handleValueChange = useCallback((newValue: unknown) => {
    updateNodeData(id, { value: newValue });
    // Mark as ready immediately for input nodes
    setNodeOutput(id, { output: newValue });
  }, [id, updateNodeData, setNodeOutput]);

  const handleWidgetTypeChange = useCallback((newWidgetType: InputWidgetType) => {
    updateNodeData(id, { widgetType: newWidgetType });
    setShowSettings(false);
  }, [id, updateNodeData]);

  const toggleConstant = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateNodeData(id, { isConstant: !isConstant });
  }, [id, isConstant, updateNodeData]);

  const getIcon = () => {
    switch (widgetType) {
      case 'slider': return Sliders;
      case 'number': return Hash;
      case 'boolean': return ToggleLeft;
      case 'select': return List;
      default: return Type;
    }
  };

  const getNodeColor = () => {
    if (isReady) {
      return { 
        bg: 'bg-green-500/10', 
        border: 'border-green-500/30', 
        text: 'text-green-400',
        gradient: 'from-green-900/30 to-neutral-900/50'
      };
    }
    return { 
      bg: 'bg-purple-500/10', 
      border: 'border-purple-500/30', 
      text: 'text-purple-400',
      gradient: 'from-purple-900/30 to-neutral-900/50'
    };
  };

  const colors = getNodeColor();
  const Icon = getIcon();

  const renderWidget = () => {
    switch (widgetType) {
      case 'slider':
        return (
          <div className="space-y-2 nodrag nopan">
            <input
              type="range"
              value={Number(data.value) || 0}
              min={data.min ?? 0}
              max={data.max ?? 100}
              step={data.step ?? 1}
              onChange={(e) => handleValueChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>{data.min ?? 0}</span>
              <span className="font-mono text-purple-400">{String(data.value ?? 0)}</span>
              <span>{data.max ?? 100}</span>
            </div>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={data.value as number ?? ''}
            min={data.min}
            max={data.max}
            step={data.step}
            onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500 nodrag"
            placeholder={data.placeholder || '0'}
          />
        );

      case 'boolean':
        return (
          <button
            onClick={() => handleValueChange(!data.value)}
            className={`
              w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 nodrag
              ${data.value 
                ? 'bg-green-600 text-white hover:bg-green-500' 
                : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
              }
            `}
          >
            {data.value ? 'True' : 'False'}
          </button>
        );

      case 'select':
        return (
          <select
            value={String(data.value ?? '')}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 nodrag"
          >
            {(data.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={String(data.value ?? '')}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500 resize-none nodrag"
            rows={3}
            placeholder={data.placeholder || 'Enter text...'}
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={String(data.value ?? '')}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 nodrag"
            placeholder={data.placeholder || 'Enter value...'}
          />
        );
    }
  };

  return (
    <div
      className={`
        relative min-w-[180px] max-w-[240px] rounded-xl overflow-hidden
        bg-neutral-900/80 backdrop-blur-sm
        border transition-all duration-200
        ${selected 
          ? `${colors.border} shadow-lg` 
          : isHovered 
            ? 'border-neutral-600/50' 
            : colors.border
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => selectNode(id)}
    >
      {/* Ready indicator glow */}
      {isReady && (
        <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />
      )}

      {/* Header */}
      <div className={`px-3 py-2.5 bg-gradient-to-r ${colors.gradient} border-b border-neutral-800/50`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`flex items-center justify-center w-6 h-6 rounded-lg ${colors.bg}`}>
              {isReady ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
              )}
            </div>
            <span className="font-medium text-xs text-white truncate">
              {data.label || `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Input`}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Widget type selector (if multiple options) */}
            {availableWidgets.length > 1 && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(!showSettings);
                  }}
                  className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                  title="Change widget type"
                >
                  <Settings className="w-3 h-3" />
                </button>
                
                {showSettings && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                    {availableWidgets.map((widget) => (
                      <button
                        key={widget.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWidgetTypeChange(widget.value);
                        }}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors
                          ${widgetType === widget.value 
                            ? 'bg-purple-500/20 text-purple-300' 
                            : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
                          }
                        `}
                      >
                        <widget.icon className="w-3 h-3" />
                        {widget.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Constant toggle */}
            <button
              onClick={toggleConstant}
              className={`
                p-1 rounded transition-colors
                ${isConstant 
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }
              `}
              title={isConstant ? 'Constant (not exposed in API)' : 'Exposed (visible in API)'}
            >
              {isConstant ? (
                <Lock className="w-3 h-3" />
              ) : (
                <Unlock className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-3">
        {renderWidget()}
        
        {/* Description */}
        {data.description && (
          <p className="mt-2 text-[10px] text-neutral-500">{data.description}</p>
        )}
        
        {/* Constant badge */}
        {isConstant && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <Lock className="w-2.5 h-2.5" />
            <span>Constant</span>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className={`!w-3 !h-3 !border-2 !border-neutral-900 ${
          isReady ? '!bg-green-500' : '!bg-purple-500'
        }`}
        title={`${data.label || dataType} output`}
      />
    </div>
  );
});

InputNode.displayName = 'InputNode';

export default InputNode;
