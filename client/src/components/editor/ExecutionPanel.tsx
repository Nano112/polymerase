/**
 * ExecutionPanel - Shows execution logs and controls
 */

import { useCallback } from 'react';
import { useFlowStore } from '../../store/flowStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

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
    addExecutionLog('🚀 Starting flow execution...');

    try {
      const flowData = exportFlow();
      addExecutionLog(`📦 Flow "${flowData.name}" has ${flowData.nodes.length} nodes`);

      const response = await fetch(`${SERVER_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowData }),
      });

      const result = await response.json();

      if (result.success) {
        addExecutionLog('✅ Flow executed successfully!');
        if (result.logs) {
          result.logs.forEach((log: string) => addExecutionLog(log));
        }
        if (result.executionTime) {
          addExecutionLog(`⏱️ Completed in ${result.executionTime}ms`);
        }
      } else {
        addExecutionLog(`❌ Execution failed: ${result.error}`);
      }
    } catch (error) {
      const err = error as Error;
      addExecutionLog(`❌ Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [exportFlow, setIsExecuting, clearExecutionLogs, addExecutionLog]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h3 className="font-semibold text-white">Execution</h3>
        <div className="flex gap-2">
          <button
            onClick={clearExecutionLogs}
            className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            disabled={isExecuting}
          >
            Clear
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className={`
              px-4 py-1.5 text-xs font-medium rounded-lg transition-all
              ${isExecuting 
                ? 'bg-amber-600 text-white cursor-wait' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }
            `}
          >
            {isExecuting ? '⏳ Running...' : '▶ Execute'}
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs">
        {executionLogs.length === 0 ? (
          <div className="text-slate-500 text-center py-8">
            <p>No execution logs yet.</p>
            <p className="mt-1">Click "Execute" to run the flow.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {executionLogs.map((log, index) => (
              <div
                key={index}
                className={`
                  py-1 px-2 rounded
                  ${log.includes('❌') ? 'bg-red-500/10 text-red-400' :
                    log.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' :
                    log.includes('⚠') ? 'bg-amber-500/10 text-amber-400' :
                    'text-slate-400'
                  }
                `}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

