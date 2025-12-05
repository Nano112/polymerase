import { Layers, Globe } from 'lucide-react';

export function MockFlowGraph() {
  return (
    <div className="relative w-full h-full text-xs select-none p-10 flex items-center justify-center gap-12">
      
      {/* Wires (SVG) - Fixed coordinates */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
        {/* Input to Subflow - radius */}
        <path d="M 280 180 C 330 180 330 200 380 200" fill="none" stroke="#a855f7" strokeWidth="2.5" />
        {/* Input to Subflow - material */}
        <path d="M 280 220 C 330 220 330 240 380 240" fill="none" stroke="#22c55e" strokeWidth="2.5" />
        
        {/* Subflow to Output */}
        <path d="M 580 220 C 630 220 630 210 680 210" fill="none" stroke="#22c55e" strokeWidth="2.5" />
      </svg>

      {/* Node 1: Inputs */}
      <div className="w-44 bg-[#18181b] border border-neutral-700 rounded-lg shadow-xl relative z-10">
        <div className="h-8 bg-[#27272a] border-b border-neutral-700 rounded-t-lg px-3 flex items-center justify-between">
          <span className="font-bold text-neutral-300 text-[11px]">Inputs</span>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-[10px]">Radius</span>
            <div className="flex items-center gap-2">
              <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 text-[9px] font-mono">32</span>
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-neutral-900"></div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-[10px]">Material</span>
            <div className="flex items-center gap-2">
              <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 text-[9px] font-mono">"stone"</span>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-neutral-900"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Node 2: Logic (Subflow) */}
      <div className="w-48 bg-[#18181b] border border-neutral-700 rounded-lg shadow-xl relative z-10">
        <div className="h-8 bg-[#27272a] border-b border-neutral-700 rounded-t-lg px-3 flex items-center justify-between">
          <span className="font-bold text-blue-400 flex items-center gap-1.5 text-[11px]">
            <Layers className="w-3 h-3" /> Sphere Generator
          </span>
        </div>
        <div className="p-3 relative">
          {/* Input ports */}
          <div className="absolute -left-[5px] top-6 w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-neutral-900"></div>
          <div className="absolute -left-[5px] top-[50px] w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-neutral-900"></div>

          {/* Output port */}
          <div className="absolute -right-[5px] top-8 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-neutral-900"></div>

          <div className="text-neutral-500 italic text-center py-4 text-[10px]">
            Contains 14 nodes
          </div>
        </div>
      </div>

      {/* Node 3: API Output */}
      <div className="w-44 bg-[#18181b] border border-green-900/50 rounded-lg shadow-xl relative z-10 shadow-green-900/20">
        <div className="h-8 bg-green-900/20 border-b border-green-900/30 rounded-t-lg px-3 flex items-center justify-between">
          <span className="font-bold text-green-400 flex items-center gap-1.5 text-[11px]">
            <Globe className="w-3 h-3" /> API Output
          </span>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-neutral-900"></div>
               <span className="text-neutral-400 text-[10px]">Schematic</span>
            </div>
          </div>
          <div className="bg-black/50 p-2 rounded text-[9px] font-mono text-green-300">
            POST /api/v1/run
          </div>
        </div>
      </div>

    </div>
  );
}
