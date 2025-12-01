/**
 * MessageHandler - Handles worker-side message processing
 * Used by both browser WebWorkers and Bun Worker Threads
 */

import { MESSAGE_TYPES, type MessageType, type WorkerMessage } from '../types/index.js';
import { SynthaseService } from '../services/SynthaseService.js';
import { createContextProviders } from './contextProviders.js';
import type { IODefinition } from '../types/index.js';

export interface MessageHandlerOptions {
  postMessage: (message: WorkerMessage) => void;
  postProgress: (message: string, percent?: number, data?: unknown) => void;
}

/**
 * MessageHandler processes messages from the main thread
 */
export class MessageHandler {
  private synthaseService: SynthaseService | null = null;
  private isInitialized = false;
  private currentExecution: { cancelled: boolean } | null = null;
  private postMessage: (message: WorkerMessage) => void;
  private postProgress: (message: string, percent?: number, data?: unknown) => void;

  constructor(options: MessageHandlerOptions) {
    this.postMessage = options.postMessage;
    this.postProgress = options.postProgress;
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(data: WorkerMessage): Promise<void> {
    const { type, payload, id } = data;

    try {
      let result: unknown;

      switch (type) {
        case MESSAGE_TYPES.INITIALIZE:
          result = await this.handleInitialize(payload as InitializePayload);
          this.sendMessage(MESSAGE_TYPES.INITIALIZE_SUCCESS, result, id);
          break;

        case MESSAGE_TYPES.EXECUTE_SCRIPT:
          result = await this.handleExecuteScript(payload as ExecuteScriptPayload);
          this.sendMessage(MESSAGE_TYPES.EXECUTION_SUCCESS, result, id);
          break;

        case MESSAGE_TYPES.VALIDATE_SCRIPT:
          result = await this.handleValidateScript(payload as ValidateScriptPayload);
          this.sendMessage(MESSAGE_TYPES.VALIDATION_RESULT, result, id);
          break;

        case MESSAGE_TYPES.GET_CONTEXT_PROVIDERS:
          result = this.handleGetContextProviders();
          this.sendMessage(MESSAGE_TYPES.CONTEXT_PROVIDERS_RESULT, result, id);
          break;

        case MESSAGE_TYPES.CANCEL_EXECUTION:
          result = this.handleCancelExecution();
          this.sendMessage(MESSAGE_TYPES.EXECUTION_CANCELLED, result, id);
          break;

        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      const err = error as Error;
      this.sendMessage(MESSAGE_TYPES.ERROR, err.message, id);
    }
  }

  /**
   * Handle initialization
   */
  private async handleInitialize(payload: InitializePayload): Promise<InitializeResult> {
    if (this.isInitialized) {
      return { status: 'already_initialized' };
    }

    try {
      console.log('🚀 Initializing Synthase Service in worker...');

      // Create context providers with callbacks
      const contextProviders = await createContextProviders({
        logCallback: (entry) => {
          this.postProgress(`Log: ${entry.message}`, undefined, entry);
        },
        progressCallback: (message, percent, data) => {
          this.sendMessage(MESSAGE_TYPES.EXECUTION_PROGRESS, { message, percent, data });
        },
        customProviders: payload.customContextProviders || {},
      });

      // Create the service
      this.synthaseService = new SynthaseService(contextProviders);
      this.isInitialized = true;

      console.log('✅ Synthase Service initialized in worker');

      return {
        status: 'initialized',
        contextProviders: Object.keys(contextProviders),
      };
    } catch (error) {
      const err = error as Error;
      console.error('❌ Worker initialization failed:', err);
      throw new Error(`Worker initialization failed: ${err.message}`);
    }
  }

  /**
   * Handle script execution
   */
  private async handleExecuteScript(payload: ExecuteScriptPayload): Promise<ExecuteScriptResult> {
    if (!this.isInitialized || !this.synthaseService) {
      throw new Error('Service not initialized');
    }

    const { code, inputs, options } = payload;

    // Cancel any previous execution
    if (this.currentExecution) {
      this.currentExecution.cancelled = true;
    }

    // Create execution tracker
    this.currentExecution = { cancelled: false };
    const executionId = this.currentExecution;

    this.postProgress('Starting script execution...');

    try {
      const executionOptions = {
        ...options,
        timeout: options?.timeout || 60000,
      };

      if (executionId.cancelled) {
        throw new Error('Execution cancelled');
      }

      const executionResult = await this.synthaseService.executeScript(
        code,
        inputs,
        executionOptions
      );

      if (executionId.cancelled) {
        throw new Error('Execution cancelled');
      }

      if (executionResult.success) {
        this.postProgress('Script executed successfully');

        // Process schematics for transfer
        let processedSchematics = null;
        if (executionResult.hasSchematic && executionResult.schematics) {
          processedSchematics = await this.processSchematicsForTransfer(
            executionResult.schematics
          );
        }

        this.currentExecution = null;

        return {
          success: true,
          result: executionResult.result,
          schematics: processedSchematics,
          executionTime: executionResult.executionTime,
        };
      } else {
        this.currentExecution = null;
        throw new Error(executionResult.error?.message || 'Unknown execution error');
      }
    } catch (error) {
      this.currentExecution = null;
      const err = error as Error;
      this.postProgress('Execution failed: ' + err.message);
      throw error;
    }
  }

  /**
   * Handle script validation
   */
  private async handleValidateScript(payload: ValidateScriptPayload): Promise<IODefinition | null> {
    if (!this.isInitialized || !this.synthaseService) {
      return null;
    }

    try {
      const validation = await this.synthaseService.validateScript(payload.code);
      return validation.valid ? (validation.io ?? null) : null;
    } catch (error) {
      console.warn('Validation failed:', error);
      return null;
    }
  }

  /**
   * Handle getting context providers
   */
  private handleGetContextProviders(): Record<string, unknown> {
    if (!this.isInitialized || !this.synthaseService) {
      return {};
    }
    return this.synthaseService.getContextProviders() || {};
  }

  /**
   * Handle execution cancellation
   */
  private handleCancelExecution(): { cancelled: boolean; message?: string } {
    if (this.currentExecution) {
      this.currentExecution.cancelled = true;
      this.postProgress('Execution cancelled by user');
      return { cancelled: true };
    }
    return { cancelled: false, message: 'No execution in progress' };
  }

  /**
   * Send a message to the main thread
   */
  private sendMessage(type: MessageType, payload: unknown, id?: number): void {
    this.postMessage({ type, payload, id });
  }

  /**
   * Process schematics for transfer to main thread
   */
  private async processSchematicsForTransfer(
    schematics: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const processed: Record<string, unknown> = {};

    for (const [key, schematic] of Object.entries(schematics)) {
      try {
        const schem = schematic as { to_schematic?: () => Uint8Array };
        if (schem && typeof schem.to_schematic === 'function') {
          const schematicData = schem.to_schematic();
          processed[key] = schematicData;
          this.postProgress(`Processed schematic: ${key}`);
        } else {
          processed[key] = schematic;
        }
      } catch (error) {
        console.warn(`Failed to process schematic ${key}:`, error);
        processed[key] = null;
      }
    }

    return processed;
  }
}

// Payload types
interface InitializePayload {
  customContextProviders?: Record<string, unknown>;
}

interface InitializeResult {
  status: string;
  contextProviders?: string[];
}

interface ExecuteScriptPayload {
  code: string;
  inputs: Record<string, unknown>;
  options?: {
    timeout?: number;
  };
}

interface ExecuteScriptResult {
  success: boolean;
  result?: Record<string, unknown>;
  schematics?: Record<string, unknown> | null;
  executionTime?: number;
}

interface ValidateScriptPayload {
  code: string;
}

