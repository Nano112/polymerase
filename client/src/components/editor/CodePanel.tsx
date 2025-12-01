/**
 * CodePanel - Monaco editor for code node scripts
 */

import { useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useFlowStore } from '../../store/flowStore';

export function CodePanel() {
  const { nodes, selectedNodeId, updateNodeData } = useFlowStore();
  const [localCode, setLocalCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const isCodeNode = selectedNode?.type === 'code';

  useEffect(() => {
    if (isCodeNode && selectedNode) {
      setLocalCode(selectedNode.data.code || '');
      setValidationError(null);
    }
  }, [selectedNodeId, isCodeNode, selectedNode]);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const code = value || '';
      setLocalCode(code);
      
      // Debounced update to store
      const timer = setTimeout(() => {
        if (selectedNodeId && isCodeNode) {
          updateNodeData(selectedNodeId, { code });
          // TODO: Validate script and update IO
        }
      }, 500);

      return () => clearTimeout(timer);
    },
    [selectedNodeId, isCodeNode, updateNodeData]
  );

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <p>Select a node to edit</p>
        </div>
      </div>
    );
  }

  if (!isCodeNode) {
    return (
      <div className="h-full flex flex-col p-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          {selectedNode.data.label || selectedNode.type}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Label</label>
            <input
              type="text"
              value={selectedNode.data.label || ''}
              onChange={(e) => updateNodeData(selectedNodeId!, { label: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          {selectedNode.type?.includes('input') && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Default Value</label>
              <input
                type={selectedNode.type === 'number_input' ? 'number' : 'text'}
                value={selectedNode.data.value as string ?? ''}
                onChange={(e) => updateNodeData(selectedNodeId!, { 
                  value: selectedNode.type === 'number_input' 
                    ? parseFloat(e.target.value) || 0 
                    : e.target.value 
                })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Node ID: <code className="text-slate-400">{selectedNode.id}</code>
            </p>
            <p className="text-xs text-slate-500">
              Type: <code className="text-slate-400">{selectedNode.type}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500">⚡</span>
          <input
            type="text"
            value={selectedNode.data.label || ''}
            onChange={(e) => updateNodeData(selectedNodeId!, { label: e.target.value })}
            className="bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-slate-600"
            placeholder="Node label..."
          />
        </div>
        
        {validationError && (
          <span className="text-xs text-red-400 px-2 py-1 bg-red-500/10 rounded">
            {validationError}
          </span>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
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
            padding: { top: 12, bottom: 12 },
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
          }}
        />
      </div>

      {/* IO Preview */}
      {selectedNode.data.io && (
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/50">
          <div className="flex gap-4 text-xs">
            {Object.keys(selectedNode.data.io.inputs || {}).length > 0 && (
              <div>
                <span className="text-blue-400">Inputs:</span>{' '}
                <span className="text-slate-400">
                  {Object.keys(selectedNode.data.io.inputs).join(', ')}
                </span>
              </div>
            )}
            {Object.keys(selectedNode.data.io.outputs || {}).length > 0 && (
              <div>
                <span className="text-amber-400">Outputs:</span>{' '}
                <span className="text-slate-400">
                  {Object.keys(selectedNode.data.io.outputs).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

