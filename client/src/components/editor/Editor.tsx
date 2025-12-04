/**
 * Editor - Main flow editor component with execution state visualization
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Edge } from '@xyflow/react';
import { type FlowNode } from '../../store/flowStore';

import { 
  FolderOpen, 
  Play, 
  Settings,
  Zap,
  Terminal,
  Code,
  RotateCcw,
  ChevronDown,
  Menu,
  X,
  Plus,
  Undo2,
  Redo2,
  Maximize2,
  Trash2,
  Copy,
  Grid3X3,
  HelpCircle,
} from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import { Toolbar } from './Toolbar';
import { CodePanel } from './CodePanel';
import { ExecutionPanel } from './ExecutionPanel';
import { NodePropertiesPanel } from './NodePropertiesPanel';
import { FlowManager } from './FlowManager';
import { Modal } from '../ui/Modal';
import { ShortcutsModal } from '../ui/ShortcutsModal';
import { CommandPalette } from '../ui/CommandPalette';
import { useLocalExecutor } from '../../hooks/useLocalExecutor';

export function Editor() {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    flowName,
    flowId,
    setFlowName,
    selectedNodeId,
    selectNode,
    deleteNode,
    addNode,
    clearAllCache,
    nodeCache,
    isExecuting,
    setIsExecuting,
    clearExecutionLogs,
    addExecutionLog,
    setNodeExecutionStatus,
    setExecutingNodeId,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useFlowStore();

  // Modal states
  const [showFlowManager, setShowFlowManager] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showNodeProperties, setShowNodeProperties] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [showExecuteMenu, setShowExecuteMenu] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<{ nodes: FlowNode[]; edges: Edge[] } | null>(null);
  
  // Mobile states
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Zoom to fit all nodes
  const handleZoomToFit = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.2, duration: 300 });
    }
  }, []);
  
  // Duplicate selected node
  const handleDuplicateNode = useCallback(() => {
    if (!selectedNodeId) return;
    
    const nodeToClone = nodes.find(n => n.id === selectedNodeId);
    if (!nodeToClone) return;
    
    const newId = `${nodeToClone.type}-${crypto.randomUUID().slice(0, 8)}`;
    const newNode: FlowNode = {
      ...nodeToClone,
      id: newId,
      position: {
        x: nodeToClone.position.x + 30,
        y: nodeToClone.position.y + 30,
      },
      data: { ...nodeToClone.data },
      selected: false,
    };
    
    addNode(newNode);
    selectNode(newId);
  }, [selectedNodeId, nodes, addNode, selectNode]);
  
  // Copy selected nodes
  const handleCopyNodes = useCallback(() => {
    // Get all selected nodes
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0 && selectedNodeId) {
      // If no multi-selection, use the single selected node
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        selectedNodes.push(node);
      }
    }
    
    if (selectedNodes.length === 0) return;
    
    // Get edges between selected nodes
    const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
    const selectedEdges = edges.filter(
      e => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );
    
    setClipboard({ nodes: selectedNodes, edges: selectedEdges });
    addExecutionLog(`[OK] Copied ${selectedNodes.length} node(s)`);
  }, [nodes, edges, selectedNodeId, addExecutionLog]);
  
  // Paste nodes from clipboard
  const handlePasteNodes = useCallback(() => {
    if (!clipboard || clipboard.nodes.length === 0) return;
    
    // Generate ID mapping for new nodes
    const idMap = new Map<string, string>();
    clipboard.nodes.forEach(node => {
      const newId = `${node.type}-${crypto.randomUUID().slice(0, 8)}`;
      idMap.set(node.id, newId);
    });
    
    // Offset pasted nodes by 50px
    const offsetX = 50;
    const offsetY = 50;
    
    // Create new nodes
    const newNodes: FlowNode[] = clipboard.nodes.map(node => ({
      ...node,
      id: idMap.get(node.id)!,
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY,
      },
      data: { ...node.data },
      selected: true,
    }));
    
    // Create new edges with updated IDs
    const newEdges: Edge[] = clipboard.edges.map(edge => ({
      ...edge,
      id: `edge-${crypto.randomUUID().slice(0, 8)}`,
      source: idMap.get(edge.source)!,
      target: idMap.get(edge.target)!,
    }));
    
    // Deselect all existing nodes and add new ones
    nodes.forEach(n => {
      if (n.selected) {
        onNodesChange([{ type: 'select', id: n.id, selected: false }]);
      }
    });
    
    // Add nodes and edges
    newNodes.forEach(node => addNode(node));
    newEdges.forEach(edge => onConnect({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
    }));
    
    addExecutionLog(`[OK] Pasted ${newNodes.length} node(s)`);
  }, [clipboard, nodes, addNode, onNodesChange, onConnect, addExecutionLog]);
  
  // Keyboard shortcuts for undo/redo/copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (cmdKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
      } else if (cmdKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo()) redo();
      } else if (cmdKey && e.key === 'y') {
        // Windows-style redo
        e.preventDefault();
        if (canRedo()) redo();
      } else if (cmdKey && e.key === 'd') {
        // Duplicate selected node
        e.preventDefault();
        handleDuplicateNode();
      } else if (cmdKey && e.key === 'c') {
        // Copy nodes
        e.preventDefault();
        handleCopyNodes();
      } else if (cmdKey && e.key === 'v') {
        // Paste nodes
        e.preventDefault();
        handlePasteNodes();
      } else if ((cmdKey && e.key === '0') || e.key === 'f') {
        // Zoom to fit
        if (!cmdKey || e.key === '0') {
          e.preventDefault();
          handleZoomToFit();
        }
      } else if ((cmdKey && e.key === '/') || e.key === '?') {
        // Show shortcuts panel
        e.preventDefault();
        setShowShortcuts(true);
      } else if (cmdKey && e.key === 'k') {
        // Show command palette
        e.preventDefault();
        setShowCommandPalette(true);
      } else if (e.key === 'Escape') {
        // Close modals
        setShowShortcuts(false);
        setShowCommandPalette(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, handleDuplicateNode, handleCopyNodes, handlePasteNodes, handleZoomToFit]);
  
  // Clear all node caches
  const handleClearCache = useCallback(() => {
    clearAllCache();
    addExecutionLog('Cleared all node outputs');
  }, [clearAllCache, addExecutionLog]);

  const { executeScript, workerClient } = useLocalExecutor();

  /**
   * Get nodes in topological order for execution
   * Returns nodes from inputs → code → viewers
   */
  const getExecutionOrder = useCallback((nodes: FlowNode[], edges: Edge[]): FlowNode[] => {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    
    // Initialize
    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }
    
    // Build graph
    for (const edge of edges) {
      const targets = adjacency.get(edge.source) || [];
      targets.push(edge.target);
      adjacency.set(edge.source, targets);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
    
    // Kahn's algorithm
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) queue.push(nodeId);
    }
    
    const sorted: FlowNode[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodeMap.get(nodeId);
      if (node) sorted.push(node);
      
      for (const neighbor of adjacency.get(nodeId) || []) {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }
    
    return sorted;
  }, []);

  const handleQuickRun = useCallback(async () => {
    setIsExecuting(true);
    clearExecutionLogs();
    addExecutionLog('Starting quick run...');

    // Store outputs from each node for passing to downstream nodes
    const nodeOutputs = new Map<string, Record<string, unknown>>();

    try {
      // Get execution order (topological sort)
      const executionOrder = getExecutionOrder(nodes, edges);
      
      // Find code nodes
      const codeNodes = executionOrder.filter(n => n.type === 'code');
      
      if (codeNodes.length === 0) {
        addExecutionLog('[ERROR] No code node found');
        setIsExecuting(false);
        return;
      }

      // Mark all nodes as pending
      for (const node of nodes) {
        setNodeExecutionStatus(node.id, 'pending');
      }

      // Process nodes in topological order
      for (const node of executionOrder) {
        // Handle input nodes - they just output their value
        if (node.type?.includes('input') && !node.type?.includes('schematic')) {
          const output = { default: node.data.value };
          nodeOutputs.set(node.id, output);
          setNodeExecutionStatus(node.id, 'completed', output);
          continue;
        }

        // Handle code nodes
        if (node.type === 'code') {
          const code = node.data.code;
          
          if (!code) {
            addExecutionLog(`[WARN] Code node "${node.data.label || node.id}" has no script, skipping`);
            setNodeExecutionStatus(node.id, 'error', undefined, 'No script');
            continue;
          }

          // Gather inputs from connected upstream nodes
          const inputValues: Record<string, unknown> = {};
          const incomingEdges = edges.filter(e => e.target === node.id);
          
          for (const edge of incomingEdges) {
            const sourceOutput = nodeOutputs.get(edge.source);
            console.log('Edge:', edge.source, '->', edge.target, 'handles:', edge.sourceHandle, '->', edge.targetHandle);
            console.log('Source output:', sourceOutput);
            
            if (sourceOutput) {
              // Use the targetHandle as the input name
              const inputName = edge.targetHandle || 'default';
              // Try to get the value by sourceHandle, then by inputName, then 'default'
              const outputKey = edge.sourceHandle || inputName;
              let value = sourceOutput[outputKey];
              
              // If not found by outputKey, try to find a matching key or use 'default'
              if (value === undefined) {
                // Check if there's only one key in the output (common case)
                const outputKeys = Object.keys(sourceOutput);
                if (outputKeys.length === 1) {
                  value = sourceOutput[outputKeys[0]];
                } else {
                  value = sourceOutput['default'];
                }
              }
              
              console.log('Mapping input:', inputName, '=', value);
              inputValues[inputName] = value;
            }
          }

          // Mark as running
          setExecutingNodeId(node.id);
          setNodeExecutionStatus(node.id, 'running');
          addExecutionLog(`Executing "${node.data.label || 'Code'}"...`);

          // Execute with timing
          const startTime = Date.now();
          const result = await executeScript(code, inputValues);
          const executionTime = Date.now() - startTime;

          if (result.success) {
            // Build final result with binary schematic data
            let finalResult: Record<string, unknown>;
            
            console.log('Execution result:', { 
              result: result.result, 
              schematics: result.schematics,
              schematicKeys: result.schematics ? Object.keys(result.schematics) : []
            });
            
            if (result.schematics && Object.keys(result.schematics).length > 0) {
              // Build result using schematics (which have been serialized for transfer)
              finalResult = {};
              
              // Add all schematics to the result
              for (const [key, value] of Object.entries(result.schematics)) {
                if (value) {
                  finalResult[key] = value;
                }
              }
              
              // Also add 'default' pointing to first schematic if there's only one
              if (Object.keys(finalResult).length === 1 && !('default' in finalResult)) {
                const firstKey = Object.keys(finalResult)[0];
                finalResult['default'] = finalResult[firstKey];
              }
              const name = node.data.label || node.id;
              console.log(`Final result with schematics for node "${name}":`, finalResult);
            } else {
              finalResult = result.result || {};
            }

            nodeOutputs.set(node.id, finalResult);
            setNodeExecutionStatus(node.id, 'completed', finalResult, undefined, executionTime);
            addExecutionLog(`[OK] "${node.data.label || 'Code'}" completed in ${executionTime}ms`);
          } else {
            setNodeExecutionStatus(node.id, 'error', undefined, result.error?.message);
            addExecutionLog(`[ERROR] "${node.data.label || 'Code'}": ${result.error?.message}`);
            // Stop execution on error
            break;
          }
        }

        // Handle viewer nodes - they receive data and can pass it through
        if (node.type === 'viewer') {
          const incomingEdge = edges.find(e => e.target === node.id);
          if (incomingEdge) {
            const sourceOutput = nodeOutputs.get(incomingEdge.source);
            if (sourceOutput) {
              // Unwrap to get the actual value - prefer sourceHandle, then 'default', then first key
              const handleKey = incomingEdge.sourceHandle || 'default';
              let viewerValue: unknown = sourceOutput;
              
              if (handleKey in sourceOutput) {
                viewerValue = sourceOutput[handleKey];
              } else if ('default' in sourceOutput) {
                viewerValue = sourceOutput['default'];
              } else {
                const keys = Object.keys(sourceOutput);
                if (keys.length === 1) {
                  viewerValue = sourceOutput[keys[0]];
                }
              }
              
              // Set the viewer's cache with the unwrapped value
              setNodeExecutionStatus(node.id, 'completed', { default: viewerValue });
              
              // If passthrough is enabled, make output available to downstream nodes
              const viewerData = node.data as { passthrough?: boolean };
              if (viewerData.passthrough) {
                // Store output for downstream nodes - wrap in 'output' key for the output handle
                nodeOutputs.set(node.id, { output: viewerValue, default: viewerValue });
              }
            }
          }
        }

        // Handle output nodes - they receive data and mark it as a flow output
        if (node.type === 'output' || node.type === 'file_output') {
          const incomingEdge = edges.find(e => e.target === node.id);
          if (incomingEdge) {
            const sourceOutput = nodeOutputs.get(incomingEdge.source);
            if (sourceOutput) {
              // Unwrap - prefer sourceHandle, then 'default', then first key
              const handleKey = incomingEdge.sourceHandle || 'default';
              let outputValue: unknown = sourceOutput;
              
              if (handleKey in sourceOutput) {
                outputValue = sourceOutput[handleKey];
              } else if ('default' in sourceOutput) {
                outputValue = sourceOutput['default'];
              } else {
                const keys = Object.keys(sourceOutput);
                if (keys.length === 1) {
                  outputValue = sourceOutput[keys[0]];
                }
              }
              
              // Set the output node's cache
              setNodeExecutionStatus(node.id, 'completed', { output: outputValue, default: outputValue });
              
              // Store for downstream nodes (in case of chaining)
              nodeOutputs.set(node.id, { output: outputValue, default: outputValue });
            }
          }
        }

        // Handle subflow nodes - execute the embedded flow
        if (node.type === 'subflow') {
          const subflowData = node.data as { 
            flowId: string; 
            subflowConfig: { inputs: { id: string }[]; outputs: { id: string }[] };
            flowDefinition?: { nodes: FlowNode[]; edges: Edge[] };
          };
          
          if (!subflowData.flowDefinition) {
            setNodeExecutionStatus(node.id, 'error', undefined, 'Subflow definition not loaded');
            addExecutionLog(`[ERROR] Subflow "${node.data.label || node.id}": Definition not loaded`);
            continue;
          }
          
          // Mark as running
          setExecutingNodeId(node.id);
          setNodeExecutionStatus(node.id, 'running');
          addExecutionLog(`Executing subflow "${node.data.label || 'Subflow'}"...`);
          
          const subflowStartTime = Date.now();
          try {
            // Gather inputs for the subflow
            const subflowInputs: Record<string, unknown> = {};
            const incomingEdges = edges.filter(e => e.target === node.id);
            
            for (const edge of incomingEdges) {
              const sourceOutput = nodeOutputs.get(edge.source);
              if (sourceOutput) {
                const inputPortId = edge.targetHandle;
                if (inputPortId) {
                  // Get the value from source output
                  const outputKey = edge.sourceHandle || 'default';
                  let value = sourceOutput[outputKey];
                  if (value === undefined && Object.keys(sourceOutput).length === 1) {
                    value = sourceOutput[Object.keys(sourceOutput)[0]];
                  }
                  subflowInputs[inputPortId] = value;
                }
              }
            }
            
            // Execute the subflow's code nodes
            // For now, we run them sequentially - could optimize with parallel execution
            const subflowDef = subflowData.flowDefinition;
            const subflowOrder = getExecutionOrder(subflowDef.nodes as FlowNode[], subflowDef.edges);
            const subflowOutputs = new Map<string, Record<string, unknown>>();
            
            // Set input values from external inputs
            for (const subNode of subflowOrder) {
              if (subNode.type?.includes('input') && !subNode.type?.includes('schematic')) {
                // Check if this input has an external value
                const externalValue = subflowInputs[subNode.id];
                if (externalValue !== undefined) {
                  subflowOutputs.set(subNode.id, { default: externalValue });
                } else {
                  // Use the node's default value
                  subflowOutputs.set(subNode.id, { default: subNode.data.value });
                }
              }
            }
            
            // Execute code nodes in the subflow
            for (const subNode of subflowOrder) {
              if (subNode.type === 'code') {
                const code = subNode.data.code;
                if (!code) continue;
                
                // Gather inputs
                const codeInputs: Record<string, unknown> = {};
                const subIncomingEdges = subflowDef.edges.filter(e => e.target === subNode.id);
                
                for (const edge of subIncomingEdges) {
                  const srcOutput = subflowOutputs.get(edge.source);
                  if (srcOutput) {
                    const inputName = edge.targetHandle || 'default';
                    const outputKey = edge.sourceHandle || inputName;
                    let val = srcOutput[outputKey];
                    if (val === undefined && Object.keys(srcOutput).length === 1) {
                      val = srcOutput[Object.keys(srcOutput)[0]];
                    }
                    codeInputs[inputName] = val;
                  }
                }
                
                // Execute
                const result = await executeScript(code, codeInputs);
                
                if (result.success) {
                  let finalResult: Record<string, unknown>;
                  if (result.schematics && Object.keys(result.schematics).length > 0) {
                    finalResult = {};
                    for (const [key, value] of Object.entries(result.schematics)) {
                      if (value) finalResult[key] = value;
                    }
                    if (Object.keys(finalResult).length === 1 && !('default' in finalResult)) {
                      finalResult['default'] = finalResult[Object.keys(finalResult)[0]];
                    }
                  } else {
                    finalResult = result.result || {};
                  }
                  subflowOutputs.set(subNode.id, finalResult);
                } else {
                  throw new Error(`Subflow code node error: ${result.error?.message}`);
                }
              }
            }
            
            // Collect outputs from output nodes (viewers with passthrough or file_output)
            const subflowResult: Record<string, unknown> = {};
            
            for (const outputPort of subflowData.subflowConfig.outputs) {
              // Find the output node
              const outputNode = subflowDef.nodes.find(n => n.id === outputPort.id);
              if (outputNode) {
                // Get the value coming into this output node
                const outputIncomingEdge = subflowDef.edges.find(e => e.target === outputNode.id);
                if (outputIncomingEdge) {
                  const srcOutput = subflowOutputs.get(outputIncomingEdge.source);
                  if (srcOutput) {
                    const keys = Object.keys(srcOutput);
                    const value = keys.length === 1 ? srcOutput[keys[0]] : srcOutput;
                    subflowResult[outputPort.id] = value;
                  }
                }
              }
            }
            
            // Add default output if there's only one
            if (Object.keys(subflowResult).length === 1 && !('default' in subflowResult)) {
              subflowResult['default'] = subflowResult[Object.keys(subflowResult)[0]];
            }
            
            nodeOutputs.set(node.id, subflowResult);
            const subflowTime = Date.now() - subflowStartTime;
            setNodeExecutionStatus(node.id, 'completed', subflowResult, undefined, subflowTime);
            addExecutionLog(`[OK] Subflow "${node.data.label || 'Subflow'}" completed in ${subflowTime}ms`);
            
          } catch (err) {
            const error = err as Error;
            setNodeExecutionStatus(node.id, 'error', undefined, error.message);
            addExecutionLog(`[ERROR] Subflow "${node.data.label || 'Subflow'}": ${error.message}`);
            break;
          }
        }
      }

      addExecutionLog('[OK] Execution complete');

    } catch (error) {
      const err = error as Error;
      addExecutionLog(`[ERROR] ${err.message}`);
      // Mark all code nodes as error
      for (const node of nodes.filter(n => n.type === 'code')) {
        setNodeExecutionStatus(node.id, 'error', undefined, err.message);
      }
    } finally {
      setIsExecuting(false);
      setExecutingNodeId(null);
    }
  }, [nodes, edges, setIsExecuting, clearExecutionLogs, addExecutionLog, setNodeExecutionStatus, setExecutingNodeId, executeScript, getExecutionOrder]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  // Handle node double-click to open editor
  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: { id: string; type?: string }) => {
    // First select the node
    selectNode(node.id);
    // Then open the appropriate editor
    setEditingNodeId(node.id);
    if (node.type === 'code') {
      setShowCodeEditor(true);
    } else {
      setShowNodeProperties(true);
    }
  }, [selectNode]);

  // Handle keyboard shortcuts
  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Don't delete nodes when user is typing in an input field
    const target = event.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable ||
                           target.closest('input, textarea, [contenteditable="true"]');
    
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Only delete node if not in an input element and modals are closed
      if (selectedNodeId && !showCodeEditor && !showNodeProperties && !isInputElement) {
        deleteNode(selectedNodeId);
      }
    }
    if (event.key === 'Escape') {
      selectNode(null);
    }
  }, [selectedNodeId, deleteNode, selectNode, showCodeEditor, showNodeProperties]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  
  // Calculate cache stats
  const completedCount = Object.values(nodeCache).filter(c => c.status === 'completed').length;
  const totalNodes = nodes.length;

  return (
    <div 
      className="h-screen w-screen bg-neutral-950 flex flex-col no-select"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Top Bar - Responsive */}
      <div className="h-14 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800/50 flex items-center justify-between px-2 sm:px-4 flex-shrink-0 mobile-header">
        {/* Left: Flow info */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          {/* Desktop flows button */}
          {!isMobile && (
            <>
              <button
                onClick={() => setShowFlowManager(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="text-sm">Flows</span>
              </button>
              <div className="h-6 w-px bg-neutral-800" />
            </>
          )}
          
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="bg-transparent text-white font-semibold text-sm focus:outline-none border-b border-transparent hover:border-neutral-700 focus:border-neutral-600 px-1 min-w-0 w-full max-w-[150px] sm:max-w-[200px]"
              placeholder="Untitled Flow"
            />
            {flowId && !isMobile && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap">
                Saved
              </span>
            )}
          </div>
          
          {/* Undo/Redo buttons - Desktop only */}
          {!isMobile && (
            <>
              <div className="h-6 w-px bg-neutral-800" />
              <div className="flex items-center gap-1">
                <button
                  onClick={undo}
                  disabled={!canUndo()}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Undo (Cmd+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo()}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Redo (Cmd+Shift+Z)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-neutral-700 mx-1" />
                <button
                  onClick={handleDuplicateNode}
                  disabled={!selectedNodeId}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Duplicate (Cmd+D)"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomToFit}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
                  title="Zoom to Fit (Cmd+0)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={`p-2 rounded-lg transition-colors ${
                    snapToGrid 
                      ? 'text-blue-400 bg-blue-500/20 hover:bg-blue-500/30' 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                  }`}
                  title={`Snap to Grid (${snapToGrid ? 'On' : 'Off'})`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClearCache}
                  disabled={completedCount === 0}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Clear All Outputs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-neutral-700" />
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
                  title="Keyboard Shortcuts (⌘/)"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Center: Execution status - Hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center gap-3">
            {totalNodes > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${completedCount === totalNodes ? 'bg-green-500' : 'bg-neutral-600'}`} />
                  <span className="text-xs text-neutral-400">
                    {completedCount}/{totalNodes} computed
                  </span>
                </div>
                {completedCount > 0 && (
                  <button
                    onClick={clearAllCache}
                    className="p-1 rounded hover:bg-neutral-700/50 text-neutral-500 hover:text-neutral-300 transition-colors"
                    title="Clear all cached results"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Edit node button - compact on mobile */}
          {selectedNode && (
            <button
              onClick={() => {
                setEditingNodeId(selectedNode.id);
                if (selectedNode.type === 'code') {
                  setShowCodeEditor(true);
                } else {
                  setShowNodeProperties(true);
                }
              }}
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
            >
              {selectedNode.type === 'code' ? (
                <Code className="w-4 h-4" />
              ) : (
                <Settings className="w-4 h-4" />
              )}
              <span className="text-sm hidden sm:inline">Edit Node</span>
            </button>
          )}
          
          {/* Run button - Desktop only, FAB on mobile */}
          {!isMobile && (
            <div className="flex items-center rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={handleQuickRun}
                disabled={isExecuting}
                className={`
                  flex items-center gap-2 px-3 py-2 text-white text-sm font-medium transition-all border-r border-white/10
                  ${isExecuting 
                    ? 'bg-amber-600/80 cursor-wait' 
                    : 'bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500/80 hover:to-emerald-500/80'
                  }
                `}
                title="Run Flow"
              >
                <Play className="w-4 h-4 fill-current" />
                {isExecuting ? 'Running...' : 'Run'}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExecuteMenu(!showExecuteMenu)}
                  disabled={isExecuting}
                  className={`
                    flex items-center justify-center px-1.5 py-2 text-white transition-all h-full
                    ${isExecuting 
                      ? 'bg-amber-600/80 cursor-wait' 
                      : 'bg-emerald-600/80 hover:bg-emerald-500/80'
                    }
                  `}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showExecuteMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowExecuteMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                      <button
                        onClick={() => {
                          setShowExecution(true);
                          setShowExecuteMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
                      >
                        <Terminal className="w-4 h-4" />
                        Open Console...
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {isMobile && showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div 
            className="absolute top-0 left-0 h-full w-72 bg-neutral-900 border-r border-neutral-800 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  setShowFlowManager(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <FolderOpen className="w-5 h-5" />
                <span>Manage Flows</span>
              </button>
              
              <button
                onClick={() => {
                  setShowExecution(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <Terminal className="w-5 h-5" />
                <span>Console Output</span>
              </button>
              
              {completedCount > 0 && (
                <button
                  onClick={() => {
                    clearAllCache();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Clear Cache ({completedCount})</span>
                </button>
              )}
            </div>
            
            {/* Status on mobile menu */}
            {totalNodes > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800 bg-neutral-900/90">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${completedCount === totalNodes ? 'bg-green-500' : 'bg-neutral-600'}`} />
                  <span className="text-sm text-neutral-400">
                    {completedCount}/{totalNodes} nodes computed
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeClick={(_event, node) => selectNode(node.id)}
          onPaneClick={() => {
            selectNode(null);
            if (isMobile) setShowMobileToolbar(false);
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid={snapToGrid}
          snapGrid={[16, 16]}
          defaultEdgeOptions={{
            type: 'data',
            animated: false,
          }}
          proOptions={{ hideAttribution: true }}
          // Mobile touch improvements
          panOnDrag={true}
          zoomOnPinch={true}
          zoomOnScroll={!isMobile}
          preventScrolling={true}
        >
          <Background color="#262626" gap={16} size={1} />
          <Controls className="!bg-neutral-900 !border-neutral-800 !rounded-xl !shadow-xl" />
          {!isMobile && (
            <MiniMap
              className="!bg-neutral-900 !border-neutral-800 !rounded-xl !shadow-xl"
              nodeColor={(node) => {
                const cache = nodeCache[node.id];
                if (cache?.status === 'completed') return '#22c55e';
                if (cache?.status === 'running') return '#f59e0b';
                if (cache?.status === 'error') return '#ef4444';
                
                switch (node.type) {
                  case 'code': return '#22c55e40';
                  case 'input':
                  case 'number_input':
                  case 'text_input':
                  case 'boolean_input':
                  case 'select_input': return '#a855f7';
                  case 'viewer': return '#ec4899';
                  case 'subflow': return '#6366f1';
                  case 'file_input': return '#f97316';
                  case 'file_output': return '#06b6d4';
                  case 'schematic_input': return '#f97316';
                  case 'schematic_output': return '#06b6d4';
                  case 'schematic_viewer': return '#ec4899';
                  default: return '#525252';
                }
              }}
              maskColor="rgba(10, 10, 10, 0.85)"
            />
          )}
          
          {/* Help Panel - Desktop only */}
          {!isMobile && (
            <Panel position="bottom-center">
              <div className="bg-neutral-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-neutral-800/50 text-xs text-neutral-500 flex items-center gap-4">
                <span>Double-click to edit</span>
                <span className="text-neutral-700">•</span>
                <span>Delete to remove</span>
                <span className="text-neutral-700">•</span>
                <span>Drag handles to connect</span>
                <span className="text-neutral-700">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Data ready
                </span>
              </div>
            </Panel>
          )}
        </ReactFlow>

        {/* Node Toolbar - Desktop only */}
        {!isMobile && <Toolbar />}
        
        {/* Mobile: Floating Action Buttons */}
        {isMobile && (
          <>
            {/* Run FAB */}
            <button
              onClick={handleQuickRun}
              disabled={isExecuting}
              className={`
                fab 
                ${isExecuting 
                  ? 'bg-amber-500' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-600'
                }
              `}
              style={{ bottom: showMobileToolbar ? 'calc(70vh + 1.5rem)' : '5.5rem' }}
            >
              <Play className="w-6 h-6 text-white fill-white" />
            </button>
            
            {/* Add Node FAB */}
            <button
              onClick={() => setShowMobileToolbar(!showMobileToolbar)}
              className={`
                fab bg-indigo-500 transition-transform duration-300
                ${showMobileToolbar ? 'rotate-45' : ''}
              `}
              style={{ right: '1.5rem', bottom: '1.5rem' }}
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          </>
        )}
        
        {/* Mobile Bottom Sheet Toolbar */}
        {isMobile && (
          <div 
            className={`mobile-sheet ${showMobileToolbar ? '' : 'collapsed'}`}
            style={{ transform: showMobileToolbar ? 'translateY(0)' : 'translateY(calc(100% - 0px))' }}
          >
            {/* Handle */}
            <div 
              className="mobile-sheet-handle cursor-pointer"
              onClick={() => setShowMobileToolbar(!showMobileToolbar)}
            />
            
            {showMobileToolbar && (
              <div className="px-4 pb-4">
                <Toolbar isMobile={true} onNodeAdded={() => setShowMobileToolbar(false)} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <FlowManager 
        isOpen={showFlowManager} 
        onClose={() => setShowFlowManager(false)} 
      />

      {/* Code Editor Modal */}
      <Modal
        isOpen={showCodeEditor}
        onClose={() => {
          setShowCodeEditor(false);
          setEditingNodeId(null);
        }}
        title="Code Editor"
        subtitle="Edit your Synthase script"
        icon={<Zap className="w-5 h-5" />}
        iconColor="text-green-400"
        size={isMobile ? 'full' : 'xl'}
      >
        {editingNodeId && <CodePanel nodeId={editingNodeId} />}
      </Modal>

      {/* Node Properties Modal */}
      <Modal
        isOpen={showNodeProperties}
        onClose={() => {
          setShowNodeProperties(false);
          setEditingNodeId(null);
        }}
        title="Node Properties"
        subtitle="Configure node settings"
        icon={<Settings className="w-5 h-5" />}
        iconColor="text-purple-400"
        size={isMobile ? 'full' : 'md'}
      >
        {editingNodeId && <NodePropertiesPanel nodeId={editingNodeId} />}
      </Modal>

      {/* Execution Modal */}
      <Modal
        isOpen={showExecution}
        onClose={() => setShowExecution(false)}
        title="Execute Flow"
        subtitle="Run and debug your flow"
        icon={<Terminal className="w-5 h-5" />}
        iconColor="text-cyan-400"
        size={isMobile ? 'full' : 'lg'}
      >
        <ExecutionPanel workerClient={workerClient} />
      </Modal>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </div>
  );
}
