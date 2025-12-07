import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Zap, 
  Save, 
  FolderOpen, 
  ChevronDown, 
  Menu, 
  Undo2, 
  Redo2, 
  Maximize2, 
  Grid3X3, 
  Eye, 
  Trash2, 
  RefreshCw,
  Terminal,
  Globe,
  Loader2,
  Download,
} from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? '';

interface TopBarProps {
  isMobile: boolean;
  onRun: () => void;
  onRunStale: () => void;
  isExecuting: boolean;
  hasStaleNodes: boolean;
  staleCount: number;
  completedCount: number;
  totalNodes: number;
  onClearCache: () => void;
  onShowFlowManager: () => void;
  onShowExecution: () => void;
  onShowApiPanel: () => void;
  onShowShortcuts: () => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  onZoomToFit: () => void;
  onToggleMobileMenu?: () => void;
}

export function TopBar({
  isMobile,
  onRun,
  onRunStale,
  isExecuting,
  hasStaleNodes,
  staleCount,
  completedCount,
  totalNodes,
  onClearCache,
  onShowFlowManager,
  onShowExecution,
  onShowApiPanel,
  onShowShortcuts,
  snapToGrid,
  setSnapToGrid,
  onZoomToFit,
  onToggleMobileMenu,
}: TopBarProps) {
  const { 
    flowName, 
    setFlowName, 
    flowId, 
    setFlowId, 
    exportFlow, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    debugMode, 
    toggleDebugMode,
    executionSettings,
    setExecutionMode
  } = useFlowStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(flowName);
  const [showRunMenu, setShowRunMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setTempName(flowName);
  }, [flowName]);

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      setFlowName(tempName.trim());
    } else {
      setTempName(flowName);
    }
    setIsEditingName(false);
  };

  // Save mutation (duplicated from FlowManager for now, ideally shared)
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
      setFlowId(flow.id);
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
  });

  const handleExportToFile = () => {
    const flowData = exportFlow();
    const json = JSON.stringify(flowData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.polyflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowFileMenu(false);
  };

  return (
    <div className="h-16 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-4 z-50 relative">
      
      {/* Left: Logo & Flow Info */}
      <div className="flex items-center gap-4">
        {isMobile && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link 
          to="/" 
          className="flex items-center gap-2 group focus:outline-none mr-2"
          aria-label="Go to homepage"
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full relative z-10">
              <rect x="24" y="24" width="16" height="16" rx="4" className="fill-neutral-800" />
              <rect x="24" y="48" width="16" height="16" rx="4" className="fill-neutral-800" />
              <rect x="48" y="24" width="16" height="16" rx="4" className="fill-neutral-800" />
              <rect x="72" y="24" width="16" height="16" rx="4" className="fill-green-500/20 stroke-green-500" strokeWidth="1.5" />
              <path d="M40 32 H48 M64 32 H72 M40 56 H48 M32 40 V48" className="stroke-neutral-700" strokeWidth="2" />
            </svg>
          </div>
        </Link>

        <div className="h-6 w-px bg-white/10" />

        {/* Flow Name & Menus */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className="bg-transparent text-sm font-medium text-white focus:outline-none border-b border-green-500 min-w-[150px]"
                autoFocus
              />
            ) : (
              <button 
                onClick={() => setIsEditingName(true)}
                className="text-sm font-medium text-white hover:text-green-400 transition-colors text-left truncate max-w-[200px]"
              >
                {flowName}
              </button>
            )}
            <span className="text-xs text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-800/50 border border-neutral-800">
              v1.0
            </span>
          </div>
          
          {/* Menu Bar */}
          <div className="flex items-center gap-4 mt-0.5">
            {/* File Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowFileMenu(!showFileMenu)}
                className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                File <ChevronDown className="w-3 h-3" />
              </button>
              {showFileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFileMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#0a0a0a] border border-neutral-800 rounded-lg shadow-xl z-50 py-1">
                    <button onClick={() => { onShowFlowManager(); setShowFileMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" /> Open...
                    </button>
                    <button onClick={() => { saveMutation.mutate(); setShowFileMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <div className="h-px bg-neutral-800 my-1" />
                    <button onClick={handleExportToFile} className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
                      <Download className="w-4 h-4" /> Export JSON
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* View Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                View <ChevronDown className="w-3 h-3" />
              </button>
              {showViewMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowViewMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#0a0a0a] border border-neutral-800 rounded-lg shadow-xl z-50 py-1">
                    <button onClick={() => { onZoomToFit(); setShowViewMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
                      <Maximize2 className="w-4 h-4" /> Zoom to Fit
                    </button>
                    <button onClick={() => { setSnapToGrid(!snapToGrid); setShowViewMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
                      <Grid3X3 className={`w-4 h-4 ${snapToGrid ? 'text-green-400' : ''}`} /> Snap to Grid
                    </button>
                    <button onClick={() => { toggleDebugMode(); setShowViewMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
                      <Eye className={`w-4 h-4 ${debugMode ? 'text-green-400' : ''}`} /> Debug Mode
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <button onClick={onShowShortcuts} className="text-xs text-neutral-400 hover:text-white transition-colors">
              Help
            </button>
          </div>
        </div>
      </div>

      {/* Center: Toolbar Actions (Undo/Redo/etc) - Desktop Only */}
      {!isMobile && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-neutral-900/50 p-1 rounded-lg border border-white/5">
          <button onClick={undo} disabled={!canUndo()} className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={!canRedo()} className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button onClick={() => setExecutionMode(executionSettings.mode === 'live' ? 'manual' : 'live')} className={`p-1.5 rounded hover:bg-white/10 transition-colors ${executionSettings.mode === 'live' ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-400 hover:text-white'}`} title="Live Mode">
            <Zap className="w-4 h-4" />
          </button>
          <button onClick={onShowExecution} className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors" title="Console">
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right: Run & Save Actions */}
      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        {!isMobile && totalNodes > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/50 border border-white/5 text-xs">
            <div className={`w-2 h-2 rounded-full ${hasStaleNodes ? 'bg-amber-500' : completedCount === totalNodes ? 'bg-green-500' : 'bg-neutral-500'}`} />
            <span className="text-neutral-400">
              {completedCount}/{totalNodes}
              {hasStaleNodes && <span className="text-amber-500 ml-1">({staleCount} stale)</span>}
            </span>
            {completedCount > 0 && (
              <button onClick={onClearCache} className="ml-1 hover:text-white transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save</span>
        </button>

        {/* Run Button Group */}
        <div className="flex items-center rounded-lg bg-green-600 p-0.5">
          <button
            onClick={onRun}
            disabled={isExecuting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
          <div className="w-px h-4 bg-green-700 mx-0.5" />
          <div className="relative">
            <button
              onClick={() => setShowRunMenu(!showRunMenu)}
              disabled={isExecuting}
              className="p-1.5 text-white hover:bg-green-500 rounded-md transition-colors disabled:opacity-50"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            
            {showRunMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRunMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#0a0a0a] border border-neutral-800 rounded-lg shadow-xl z-50 py-1">
                  <button
                    onClick={() => { onRun(); setShowRunMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    <Play className="w-4 h-4 text-green-400" />
                    <div className="text-left">
                      <div className="font-medium">Run All</div>
                      <div className="text-xs text-neutral-500">Execute entire flow</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => { onRunStale(); setShowRunMenu(false); }}
                    disabled={!hasStaleNodes}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <div className="text-left">
                      <div className="font-medium">Run Stale Only</div>
                      <div className="text-xs text-neutral-500">
                        {hasStaleNodes ? `${staleCount} node(s) need update` : 'All nodes up to date'}
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* API Button */}
        {!isMobile && flowId && (
          <button
            onClick={onShowApiPanel}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="API Settings"
          >
            <Globe className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
