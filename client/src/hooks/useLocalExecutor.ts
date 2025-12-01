import { useEffect, useRef, useCallback } from 'react';
import { WorkerClient } from '@polymerase/core/worker';
// @ts-ignore - Import worker directly from source
import Worker from '../../../packages/core/src/worker/browser.worker.ts?worker';
import { useFlowStore } from '../store/flowStore';

export function useLocalExecutor() {
  const workerClientRef = useRef<WorkerClient | null>(null);
  const { addExecutionLog } = useFlowStore();

  useEffect(() => {
    // Initialize worker
    const worker = new Worker();
    const client = new WorkerClient({ worker });
    workerClientRef.current = client;

    // Set up event listeners
    client.on('progress', (payload: any) => {
      if (payload.message) {
        // Clean up log prefix if present
        const message = payload.message.startsWith('Log: ') 
          ? payload.message.substring(5) 
          : payload.message;
        
        // Determine log level/style based on message content or data
        let formattedMessage = message;
        if (payload.data && payload.data.level) {
           // If we have structured log data
           const level = payload.data.level.toUpperCase();
           if (level === 'ERROR') formattedMessage = `[ERROR] ${message}`;
           else if (level === 'WARN') formattedMessage = `[WARN] ${message}`;
           else formattedMessage = `[OK] ${message}`;
        } else if (!message.startsWith('[')) {
           // Add default prefix if none exists
           formattedMessage = `[OK] ${message}`;
        }
        
        addExecutionLog(formattedMessage);
      }
    });

    client.on('error', (error: any) => {
      addExecutionLog(`[ERROR] Worker error: ${error.message || error}`);
    });

    return () => {
      client.destroy();
      workerClientRef.current = null;
    };
  }, [addExecutionLog]);

  const executeScript = useCallback(async (code: string, inputs: Record<string, unknown>) => {
    if (!workerClientRef.current) {
      throw new Error('Worker client not initialized');
    }
    return workerClientRef.current.executeScript(code, inputs, { timeout: 60000 });
  }, []);

  return { executeScript, workerClient: workerClientRef.current };
}
