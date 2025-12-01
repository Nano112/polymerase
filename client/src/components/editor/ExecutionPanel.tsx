/**
 * ExecutionPanel - Shows execution logs and controls (Modal version)
 */

import { useCallback } from 'react';
import { Play, Trash2, Loader2, CheckCircle, XCircle, AlertTriangle, Terminal } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function ExecutionPanel() {
  const { 
    executionLogs, 
    clearExecutionLogs, 
    isExecuting, 
    setIsExecuting,
    addExecutionLog,
    exportFlow,
  } = useFlowStore();

  const handleExecute = useCallback(async () => {
    setIsExecuting(true);
    clearExecutionLogs();
    addExecutionLog('Starting flow execution...');

    try {
      const flowData = exportFlow();
      addExecutionLog(`Flow "${flowData.name}" - ${flowData.nodes.length} nodes`);

      const response = await fetch(`${SERVER_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowData }),
      });

      const result = await response.json();

      if (result.success) {
        addExecutionLog('[OK] Flow executed successfully');
        if (result.logs) {
          result.logs.forEach((log: string) => addExecutionLog(log));
        }
        if (result.executionTime) {
          addExecutionLog(`Completed in ${result.executionTime}ms`);
        }
      } else {
        addExecutionLog(`[ERROR] Execution failed: ${result.error}`);
      }
    } catch (error) {
      const err = error as Error;
      addExecutionLog(`[ERROR] ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [exportFlow, setIsExecuting, clearExecutionLogs, addExecutionLog]);

  const getLogStyle = (log: string) => {
    if (log.includes('[ERROR]')) return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', Icon: XCircle };
    if (log.includes('[OK]')) return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', Icon: CheckCircle };
    if (log.includes('[WARN]')) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', Icon: AlertTriangle };
    return { bg: '', text: 'text-neutral-400', border: 'border-transparent', Icon: null };
  };

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Terminal className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Execution</h3>
            <p className="text-xs text-neutral-500">{executionLogs.length} log entries</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearExecutionLogs}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 rounded-lg transition-colors border border-neutral-700/50"
            disabled={isExecuting}
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className={`
              flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all
              ${isExecuting 
                ? 'bg-amber-600/80 text-white cursor-wait' 
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
              }
            `}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Execute Flow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs">
        {executionLogs.length === 0 ? (
          <div className="text-neutral-500 text-center py-12">
            <Terminal className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No execution logs yet</p>
            <p className="mt-1 text-neutral-600">Click "Execute Flow" to run</p>
          </div>
        ) : (
          <div className="space-y-1">
            {executionLogs.map((log, index) => {
              const style = getLogStyle(log);
              return (
                <div
                  key={index}
                  className={`py-2 px-3 rounded-lg flex items-start gap-2 ${style.bg} border ${style.border} ${style.text}`}
                >
                  {style.Icon && <style.Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                  <span className="flex-1">{log.replace(/^\[(ERROR|OK|WARN)\]\s*/, '')}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
