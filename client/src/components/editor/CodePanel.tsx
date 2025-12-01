/**
 * CodePanel - Monaco editor for code node scripts (Modal version)
 */

import { useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Zap, Info, ArrowRight } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';

interface CodePanelProps {
  nodeId: string;
  onClose?: () => void;
}

export function CodePanel({ nodeId }: CodePanelProps) {
  const { nodes, updateNodeData } = useFlowStore();
  const [localCode, setLocalCode] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const node = nodes.find((n) => n.id === nodeId);
  const isCodeNode = node?.type === 'code';

  useEffect(() => {
    if (isCodeNode && node) {
      setLocalCode(node.data.code || '');
      setHasChanges(false);
    }
  }, [nodeId, isCodeNode, node]);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const code = value || '';
      setLocalCode(code);
      setHasChanges(true);
      
      // Debounced update to store
      const timer = setTimeout(() => {
        if (nodeId && isCodeNode) {
          updateNodeData(nodeId, { code });
          setHasChanges(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    },
    [nodeId, isCodeNode, updateNodeData]
  );

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
        
        {hasChanges && (
          <span className="text-xs text-amber-400 px-2 py-1 bg-amber-500/10 rounded border border-amber-500/20">
            Unsaved changes
          </span>
        )}
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

      {/* Tips Section */}
      <div className="p-4 bg-neutral-900/50">
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-900/10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-100">Quick Tips</span>
          </div>
          <div className="space-y-2 text-xs text-green-200/70">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
              <span>Use <code className="px-1 rounded bg-green-500/20 text-green-300">context.Schematic</code> to create schematics</span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
              <span>Export values with <code className="px-1 rounded bg-green-500/20 text-green-300">export const result = ...</code></span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
              <span>Use <code className="px-1 rounded bg-green-500/20 text-green-300">Logger.info()</code> for debugging</span>
            </div>
          </div>
        </div>
      </div>

      {/* IO Preview */}
      {node.data.io && (
        <div className="px-6 py-4 border-t border-neutral-800/50">
          <div className="flex gap-6 text-sm">
            {Object.keys(node.data.io.inputs || {}).length > 0 && (
              <div>
                <span className="text-blue-400 font-medium">Inputs:</span>{' '}
                <span className="text-neutral-400">
                  {Object.keys(node.data.io.inputs).join(', ')}
                </span>
              </div>
            )}
            {Object.keys(node.data.io.outputs || {}).length > 0 && (
              <div>
                <span className="text-amber-400 font-medium">Outputs:</span>{' '}
                <span className="text-neutral-400">
                  {Object.keys(node.data.io.outputs).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
