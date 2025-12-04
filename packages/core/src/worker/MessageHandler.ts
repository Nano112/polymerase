/**
 * MessageHandler - Handles worker-side message processing
 * Used by both browser WebWorkers and Bun Worker Threads
 */

import { MESSAGE_TYPES, type MessageType, type WorkerMessage, type SchematicData, type DataHandle, type DataValue, type DataFormat } from '../types/index.js';
import { SynthaseService } from '../services/SynthaseService.js';
import { createContextProviders } from './contextProviders.js';
import { workerDataStore, type StoreDataOptions, type SerializeOptions } from './WorkerDataStore.js';
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

        // Data store operations
        case MESSAGE_TYPES.STORE_DATA:
          result = this.handleStoreData(payload as StoreDataPayload);
          this.sendMessage(MESSAGE_TYPES.STORE_DATA_SUCCESS, result, id);
          break;

        case MESSAGE_TYPES.GET_DATA:
          result = this.handleGetData(payload as GetDataPayload);
          this.sendMessage(MESSAGE_TYPES.GET_DATA_SUCCESS, result, id);
          break;

        case MESSAGE_TYPES.GET_PREVIEW:
          result = this.handleGetPreview(payload as GetDataPayload);
          this.sendMessage(MESSAGE_TYPES.GET_PREVIEW_SUCCESS, result, id);
          break;

        case MESSAGE_TYPES.RELEASE_DATA:
          result = this.handleReleaseData(payload as ReleaseDataPayload);
          this.sendMessage(MESSAGE_TYPES.RELEASE_DATA_SUCCESS, result, id);
          break;

        case MESSAGE_TYPES.LIST_HANDLES:
          result = this.handleListHandles();
          this.sendMessage(MESSAGE_TYPES.LIST_HANDLES_SUCCESS, result, id);
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
      const contextProviders = await createContextProviders({
        logCallback: (entry) => {
          this.postProgress(`Log: ${entry.message}`, undefined, entry);
        },
        progressCallback: (message, percent, data) => {
          this.sendMessage(MESSAGE_TYPES.EXECUTION_PROGRESS, { message, percent, data });
        },
        customProviders: payload.customContextProviders || {},
      });

      this.synthaseService = new SynthaseService(contextProviders);
      this.isInitialized = true;

      return {
        status: 'initialized',
        contextProviders: Object.keys(contextProviders),
      };
    } catch (error) {
      const err = error as Error;
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

  // ==========================================================================
  // Data Store Operations
  // ==========================================================================

  /**
   * Store data in the worker and return a handle
   */
  private handleStoreData(payload: StoreDataPayload): DataHandle {
    const { value, format, options } = payload;
    return workerDataStore.store(value, format, options);
  }

  /**
   * Get serialized data from a handle
   */
  private handleGetData(payload: GetDataPayload): DataValue | null {
    const { handleId, options } = payload;
    return workerDataStore.serialize(handleId, { fullData: true, ...options });
  }

  /**
   * Get a preview of data from a handle (may be lower quality/smaller)
   */
  private handleGetPreview(payload: GetDataPayload): DataValue | null {
    const { handleId, options } = payload;
    return workerDataStore.serialize(handleId, { fullData: false, ...options });
  }

  /**
   * Release a data handle
   */
  private handleReleaseData(payload: ReleaseDataPayload): { released: boolean } {
    const released = workerDataStore.release(payload.handleId);
    return { released };
  }

  /**
   * List all data handles
   */
  private handleListHandles(): { handles: DataHandle[]; stats: ReturnType<typeof workerDataStore.stats> } {
    return {
      handles: workerDataStore.list(),
      stats: workerDataStore.stats(),
    };
  }

  /**
   * Send a message to the main thread
   */
  private sendMessage(type: MessageType, payload: unknown, id?: number): void {
    this.postMessage({ type, payload, id });
  }

  /**
   * Process schematics for transfer to main thread.
   * Serializes SchematicWrapper WASM objects to SchematicData objects
   * since WASM objects cannot be transferred across worker boundaries.
   */
  private async processSchematicsForTransfer(
    schematics: Record<string, unknown>
  ): Promise<Record<string, SchematicData>> {
    const processed: Record<string, SchematicData> = {};

    for (const [key, schematic] of Object.entries(schematics)) {
      try {
        const schem = schematic as { to_schematic?: () => Uint8Array; name?: () => string };
        
        if (!schem) continue;

        // Serialize to binary using to_schematic()
        if (typeof schem.to_schematic === 'function') {
          const binaryData = schem.to_schematic();
          
          // Wrap in SchematicData for proper typing
          // to_schematic() outputs .schem format (Sponge schematic)
          processed[key] = {
            format: 'schem',
            data: binaryData,
            metadata: {
              name: typeof schem.name === 'function' ? schem.name() : key,
            }
          };
          
          this.postProgress(`Serialized schematic: ${key} (${binaryData.byteLength} bytes)`);
        }
      } catch (error) {
        console.error(`Failed to serialize schematic ${key}:`, error);
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
  schematics?: Record<string, SchematicData> | null;
  executionTime?: number;
}

interface ValidateScriptPayload {
  code: string;
}

// Data store payload types
interface StoreDataPayload {
  value: unknown;
  format: DataFormat;
  options?: StoreDataOptions;
}

interface GetDataPayload {
  handleId: string;
  options?: SerializeOptions;
}

interface ReleaseDataPayload {
  handleId: string;
}

