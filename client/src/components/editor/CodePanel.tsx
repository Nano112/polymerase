/**
 * CodePanel - Monaco editor for code node scripts (Modal version)
 * Includes validation and IO extraction
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Zap, Info, ArrowRight, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import type { IODefinition } from '@polymerase/core';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

interface CodePanelProps {
  nodeId: string;
  onClose?: () => void;
}

interface ValidationState {
  status: 'idle' | 'validating' | 'valid' | 'invalid';
  io?: IODefinition;
  error?: string;
}

export function CodePanel({ nodeId }: CodePanelProps) {
  const { nodes, updateNodeData, addNode, edges, setEdges, setNodeOutput } = useFlowStore();
  const [localCode, setLocalCode] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({ status: 'idle' });
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialValidationDone = useRef(false);
  const lastValidatedCode = useRef<string>('');

  // Find the node - check both by ID and look for code nodes
  const node = nodeId ? nodes.find((n) => n.id === nodeId) : null;
  const isCodeNode = node?.type === 'code';

  // Debug logging if node not found
  if (!node && nodeId) {
    console.warn('[CodePanel] Node not found:', nodeId, 'Available nodes:', nodes.map(n => ({ id: n.id, type: n.type })));
  }

  // Validate script against server - stable reference
  const validateScript = useCallback(async (code: string) => {
    // Skip if code hasn't changed
    if (code === lastValidatedCode.current) {
      return;
    }

    if (!code.trim()) {
      setValidation({ status: 'idle' });
      lastValidatedCode.current = code;
      return;
    }

    setValidation({ status: 'validating' });

    try {
      const response = await fetch(`${SERVER_URL}/api/execute/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      lastValidatedCode.current = code;

      if (result.success && result.valid) {
        const io = result.io as IODefinition;
        setValidation({ status: 'valid', io });
        // Update node with IO schema
        updateNodeData(nodeId, { io });
      } else {
        setValidation({
          status: 'invalid',
          error: result.error || 'Validation failed'
        });
        updateNodeData(nodeId, { io: undefined });
      }
    } catch (error) {
      const err = error as Error;
      setValidation({ status: 'invalid', error: err.message });
      lastValidatedCode.current = code;
    }
  }, [nodeId, updateNodeData]);

  // Initialize local code when node changes
  useEffect(() => {
    // Reset flags when nodeId changes
    initialValidationDone.current = false;
    lastValidatedCode.current = '';
  }, [nodeId]);

  useEffect(() => {
    if (isCodeNode && node) {
      const nodeCode = node.data.code || '';
      setLocalCode(nodeCode);
      setHasChanges(false);

      // Only validate on initial mount for this node
      if (!initialValidationDone.current && nodeCode) {
        initialValidationDone.current = true;
        validateScript(nodeCode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, isCodeNode]); // Only re-run when nodeId or isCodeNode changes

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const code = value || '';
      setLocalCode(code);
      setHasChanges(true);

      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounced update to store and validate
      debounceRef.current = setTimeout(() => {
        updateNodeData(nodeId, { code });
        setHasChanges(false);
        validateScript(code);
      }, 1000); // Increased debounce to 1 second
    },
    [nodeId, updateNodeData, validateScript]
  );

  // Auto-create input nodes from IO schema
  const createInputNodesFromIO = useCallback(() => {
    if (!validation.io?.inputs || !node) return;

    const existingInputs = edges.filter(e => e.target === nodeId);
    const existingHandles = new Set(existingInputs.map(e => e.targetHandle));

    const inputEntries = Object.entries(validation.io.inputs);
    const newNodes: Parameters<typeof addNode>[0][] = [];
    const newEdges: typeof edges = [];

    inputEntries.forEach(([key, config], index) => {
      // Skip if already has an input connected
      if (existingHandles.has(key)) return;

      const inputNodeId = `input-${nodeId}-${key}-${Date.now()}-${index}`;
      const yOffset = (index - inputEntries.length / 2) * 100;

      // Determine widget type based on input config
      let widgetType: 'number' | 'slider' | 'text' | 'boolean' | 'select' = 'text';
      if (config.type === 'number') {
        widgetType = config.options ? 'select' : 'number';
      } else if (config.type === 'boolean') {
        widgetType = 'boolean';
      } else if (config.type === 'string' && config.options) {
        widgetType = 'select';
      }

      // Prepare the input node
      newNodes.push({
        id: inputNodeId,
        type: 'input',
        position: {
          x: node.position.x - 300,
          y: node.position.y + yOffset,
        },
        data: {
          label: key,
          value: config.default,
          dataType: config.type as 'number' | 'string' | 'boolean',
          widgetType,
          isConstant: false,
          min: config.min,
          max: config.max,
          step: config.step,
          options: config.options,
          description: config.description,
        },
      });

      // Prepare edge connecting input to code node
      newEdges.push({
        id: `edge-${inputNodeId}-${nodeId}-${key}`,
        source: inputNodeId,
        target: nodeId,
        sourceHandle: 'output',
        targetHandle: key,
        type: 'data',
      });
    });

    // Add all nodes and edges at once
    if (newNodes.length > 0) {
      // Add nodes
      newNodes.forEach(n => addNode(n));

      // Set all edges including new ones
      setEdges([...edges, ...newEdges]);

      // Mark all new input nodes as ready with their default values
      setTimeout(() => {
        newNodes.forEach(n => {
          setNodeOutput(n.id, { output: n.data.value });
        });
      }, 50);

      console.log(`Created ${newNodes.length} input node(s) from IO schema`);
    }
  }, [validation.io, node, nodeId, edges, addNode, setEdges, setNodeOutput]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (!node || !isCodeNode) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 p-8">
        <div className="text-center">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Node not found or not a code node</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Header info */}
      <div className="px-6 py-4 border-b border-neutral-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20">
            <Zap className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <input
              type="text"
              value={node.data.label || ''}
              onChange={(e) => updateNodeData(nodeId, { label: e.target.value })}
              className="bg-transparent text-white font-semibold focus:outline-none border-b border-transparent focus:border-neutral-600 text-lg"
              placeholder="Node label..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-amber-400 px-2 py-1 bg-amber-500/10 rounded border border-amber-500/20">
              Unsaved
            </span>
          )}

          {validation.status === 'validating' && (
            <span className="text-xs text-blue-400 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Validating
            </span>
          )}

          {validation.status === 'valid' && (
            <span className="text-xs text-green-400 px-2 py-1 bg-green-500/10 rounded border border-green-500/20 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Valid
            </span>
          )}

          {validation.status === 'invalid' && (
            <span className="text-xs text-red-400 px-2 py-1 bg-red-500/10 rounded border border-red-500/20 flex items-center gap-1" title={validation.error}>
              <XCircle className="w-3 h-3" />
              Invalid
            </span>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 border-b border-neutral-800/50">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={localCode}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Error display */}
      {validation.status === 'invalid' && validation.error && (
        <div className="px-6 py-3 bg-red-900/20 border-b border-red-500/20">
          <div className="flex items-start gap-2 text-sm text-red-400">
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <pre className="whitespace-pre-wrap font-mono text-xs">{validation.error}</pre>
          </div>
        </div>
      )}

      {/* IO Preview */}
      {validation.io && (
        <div className="px-6 py-4 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">IO Schema</h4>
            {Object.keys(validation.io.inputs || {}).length > 0 && (
              <button
                onClick={createInputNodesFromIO}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors border border-blue-500/30"
              >
                <Plus className="w-3 h-3" />
                Create Input Nodes
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Inputs */}
            <div>
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Inputs</h4>
              {Object.keys(validation.io.inputs || {}).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(validation.io.inputs).map(([key, config]) => (
                    <div key={key} className="text-xs text-neutral-400 flex items-center gap-2 p-2 bg-neutral-800/50 rounded border border-neutral-700/50">
                      <span className="font-mono text-blue-300">{key}</span>
                      <span className="text-neutral-600">:</span>
                      <span className="text-neutral-500">{config.type}</span>
                      {'default' in config && (
                        <span className="text-neutral-600 ml-auto">= {String(config.default)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-600">No inputs defined</p>
              )}
            </div>

            {/* Outputs */}
            <div>
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Outputs</h4>
              {Object.keys(validation.io.outputs || {}).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(validation.io.outputs).map(([key, config]) => (
                    <div key={key} className="text-xs text-neutral-400 flex items-center gap-2 p-2 bg-neutral-800/50 rounded border border-neutral-700/50">
                      <span className="font-mono text-amber-300">{key}</span>
                      <span className="text-neutral-600">:</span>
                      <span className="text-neutral-500">{config.type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-600">No outputs defined</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="p-4 bg-neutral-900/50 border-t border-neutral-800/50">
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-900/10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-100">Script Format</span>
          </div>
          <div className="space-y-2 text-xs text-green-200/70">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
              <span>Define IO with <code className="px-1 rounded bg-green-500/20 text-green-300">export const io = {'{ inputs: {}, outputs: {} }'}</code></span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
              <span>Export default function: <code className="px-1 rounded bg-green-500/20 text-green-300">export default async function(inputs, context)</code></span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
              <span>Context provides: <code className="px-1 rounded bg-green-500/20 text-green-300">Schematic, Logger, Vec3, Noise, Math</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
