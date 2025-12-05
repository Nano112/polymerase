import { Layers, Code, Database, Globe } from 'lucide-react';

export function Philosophy() {
  return (
    <section className="py-24 px-6 border-t border-white/5 bg-neutral-950">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Logic, Abstracted.</h2>
          <div className="space-y-6 text-neutral-400 text-lg">
            <p>
              Building complex generators requires more than just placing blocks. Flow allows you to create 
              <span className="text-white font-semibold"> reusable logic units</span> (Subflows) that act like functions in code.
            </p>
            <p>
              Design your logic once, define your inputs (numbers, schematics, strings), and use it anywhere. It's not just a schematic generator; it's a visual programming language for spatial data.
            </p>
          </div>
          
          <div className="mt-8 flex gap-4 text-sm font-mono text-green-400">
            <span className="px-3 py-1 bg-green-500/10 rounded border border-green-500/20">.flow</span>
            <span className="px-3 py-1 bg-green-500/10 rounded border border-green-500/20">.schem</span>
            <span className="px-3 py-1 bg-green-500/10 rounded border border-green-500/20">JSON API</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-[#121214] border border-white/5 rounded-xl">
            <Layers className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-white font-bold mb-2">Recursive Subflows</h3>
            <p className="text-neutral-500 text-sm">Package complex logic into a single node. Nest flows infinitely.</p>
          </div>
          <div className="p-6 bg-[#121214] border border-white/5 rounded-xl mt-8">
            <Code className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-white font-bold mb-2">Synthase Script</h3>
            <p className="text-neutral-500 text-sm">Drop into JS when visual nodes aren't enough. Full AST control.</p>
          </div>
          <div className="p-6 bg-[#121214] border border-white/5 rounded-xl">
            <Database className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-white font-bold mb-2">Strict Schemas</h3>
            <p className="text-neutral-500 text-sm">Type-safe inputs and outputs ensure your tools are robust.</p>
          </div>
          <div className="p-6 bg-[#121214] border border-white/5 rounded-xl mt-8">
            <Globe className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-white font-bold mb-2">Instant API</h3>
            <p className="text-neutral-500 text-sm">Your flow becomes a REST endpoint automatically.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
