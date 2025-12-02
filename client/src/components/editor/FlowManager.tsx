/**
 * FlowManager - Manage flows from database
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  Clock, 
  FileCode,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { Modal } from '../ui/Modal';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3000';

interface FlowListItem {
  id: string;
  name: string;
  version: string;
  createdAt: number;
  updatedAt?: number;
  metadata?: Record<string, unknown>;
}

interface FlowManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FlowManager({ isOpen, onClose }: FlowManagerProps) {
  const queryClient = useQueryClient();
  const { loadFlow, exportFlow, clearFlow, flowId, flowName } = useFlowStore();
  const [newFlowName, setNewFlowName] = useState('');
  const [showNewFlow, setShowNewFlow] = useState(false);

  // Fetch all flows
  const { data, isLoading, error } = useQuery({
    queryKey: ['flows'],
    queryFn: async () => {
      const res = await fetch(`${SERVER_URL}/api/flows`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.flows as FlowListItem[];
    },
    enabled: isOpen,
  });

  // Load a flow
  const loadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${SERVER_URL}/api/flows/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.flow;
    },
    onSuccess: (flow) => {
      loadFlow(flow.jsonContent);
      onClose();
    },
  });

  // Save current flow
  const saveMutation = useMutation({
    mutationFn: async () => {
      const flowData = exportFlow();
      const method = flowId ? 'PUT' : 'POST';
      const url = flowId 
        ? `${SERVER_URL}/api/flows/${flowId}`
        : `${SERVER_URL}/api/flows`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.flow;
    },
    onSuccess: (flow) => {
      useFlowStore.getState().setFlowId(flow.id);
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
  });

  // Create new flow
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${SERVER_URL}/api/flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nodes: [], edges: [] }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.flow;
    },
    onSuccess: (flow) => {
      clearFlow();
      useFlowStore.getState().setFlowId(flow.id);
      useFlowStore.getState().setFlowName(flow.name);
      queryClient.invalidateQueries({ queryKey: ['flows'] });
      setShowNewFlow(false);
      setNewFlowName('');
      onClose();
    },
  });

  // Delete a flow
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${SERVER_URL}/api/flows/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return id;
    },
    onSuccess: (id) => {
      if (flowId === id) {
        clearFlow();
      }
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Flow Manager"
      subtitle="Create, load, and manage your flows"
      icon={<FolderOpen className="w-5 h-5" />}
      iconColor="text-blue-400"
      size="lg"
    >
      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewFlow(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-purple-600/80 to-cyan-600/80 hover:from-purple-500/80 hover:to-cyan-500/80 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Flow
            </button>
            {flowId && (
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-300 rounded-lg bg-neutral-800/50 border border-neutral-700/50 hover:bg-neutral-700/50 transition-all disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveMutation.isSuccess ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <FileCode className="w-4 h-4" />
                )}
                Save Current
              </button>
            )}
          </div>
          
          {flowId && (
            <div className="text-sm text-neutral-400">
              Editing: <span className="text-white font-medium">{flowName}</span>
            </div>
          )}
        </div>

        {/* New Flow Form */}
        {showNewFlow && (
          <div className="mb-6 p-4 rounded-xl border border-purple-500/20 bg-purple-900/10 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-100">Create New Flow</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="Flow name..."
                className="flex-1 input"
                autoFocus
              />
              <button
                onClick={() => createMutation.mutate(newFlowName)}
                disabled={!newFlowName.trim() || createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create'
                )}
              </button>
              <button
                onClick={() => {
                  setShowNewFlow(false);
                  setNewFlowName('');
                }}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Flow List */}
        <div className="space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading flows...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-900/10 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Failed to load flows: {(error as Error).message}</span>
            </div>
          )}

          {data && data.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No flows yet</p>
              <p className="text-sm mt-1">Create your first flow to get started</p>
            </div>
          )}

          {data?.map((flow) => (
            <div
              key={flow.id}
              className={`
                group flex items-center justify-between p-4 rounded-xl 
                border transition-all duration-200 cursor-pointer
                ${flowId === flow.id
                  ? 'border-blue-500/30 bg-blue-500/5'
                  : 'border-neutral-800/50 bg-neutral-900/30 hover:border-neutral-700/50 hover:bg-neutral-800/30'
                }
              `}
              onClick={() => !loadMutation.isPending && loadMutation.mutate(flow.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg
                  ${flowId === flow.id ? 'bg-blue-500/20' : 'bg-neutral-800/50'}
                `}>
                  <FileCode className={`w-5 h-5 ${flowId === flow.id ? 'text-blue-400' : 'text-neutral-400'}`} />
                </div>
                <div>
                  <div className="font-medium text-white flex items-center gap-2">
                    {flow.name}
                    {flowId === flow.id && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(flow.updatedAt || flow.createdAt)}
                    </span>
                    <span>v{flow.version}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {loadMutation.isPending && loadMutation.variables === flow.id && (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${flow.name}"?`)) {
                      deleteMutation.mutate(flow.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

