import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { 
  ArrowRight, Box, Zap, Share2, Cpu, Layers, Code, 
  Play, Download, Book, Github, Network, Globe, 
  Database, Braces, Workflow
} from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero Animation
    anime({
      targets: '.hero-element',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(100, {start: 100}),
      easing: 'easeOutQuad',
      duration: 800
    });

    // Subtle breathing for background
    anime({
      targets: '.glow-bg',
      opacity: [0.3, 0.6],
      scale: [1, 1.2],
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      duration: 4000,
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden font-sans selection:bg-green-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-all duration-300">
              <Workflow className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-green-400 transition-colors">Flow</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="https://github.com/Nano112/polymerase" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <button 
              onClick={() => navigate('/editor')}
              className="px-5 py-2 bg-white text-black rounded-md font-semibold hover:bg-neutral-200 transition-all flex items-center gap-2 text-xs shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
            >
              Open Editor <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative flex flex-col items-center justify-center overflow-hidden" ref={heroRef}>
        {/* Abstract Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="glow-bg absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px]" />
          <div className="glow-bg absolute top-[10%] right-[20%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
          <div className="hero-element inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-white/10 mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-mono text-neutral-400">v0.5.0 &mdash; Now with API Generation</span>
          </div>
          
          <h1 className="hero-element text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            Build tools,<br /> not just structures.
          </h1>
          
          <p className="hero-element text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            A visual metaprogramming environment for Minecraft. Define schemas, compose logic flows, and instantly deploy them as API endpoints.
          </p>
          
          <div className="hero-element flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button 
              onClick={() => navigate('/editor')}
              className="h-12 px-8 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(34,197,94,0.4)] flex items-center gap-2"
            >
              Start Building <Zap className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/docs')}
              className="h-12 px-8 bg-neutral-900 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Book className="w-4 h-4" /> Documentation
            </button>
          </div>

          {/* Visualization of the Editor */}
          <div className="hero-element w-full max-w-4xl relative perspective-1000">
             <div className="relative rounded-xl border border-white/10 bg-[#0c0c0e] shadow-2xl overflow-hidden aspect-[16/9] group">
                {/* Editor Top Bar Mockup */}
                <div className="h-10 border-b border-white/5 bg-[#121214] flex items-center justify-between px-4">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-neutral-500">
                        <span className="px-2 py-0.5 bg-green-900/20 text-green-400 rounded">10/10 computed</span>
                        <span>API Mode</span>
                    </div>
                </div>

                {/* Grid Canvas */}
                <div className="absolute inset-0 top-10 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px]">
                    {/* CSS-Only Node Graph Representation */}
                    <MockFlowGraph />
                </div>
                
                {/* Overlay Gradient at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none"></div>
             </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
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

      {/* The Workflow: Input -> Process -> API */}
      <section className="py-32 px-6 bg-[#0c0c0e] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-20">
             <h2 className="text-3xl md:text-5xl font-bold mb-4">From Flow to Endpoint</h2>
             <p className="text-neutral-400">Design your logic visually, then consume it programmatically.</p>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
               {/* Arrow Connectors (Desktop only) */}
               <div className="hidden lg:block absolute top-12 left-[30%] text-neutral-700"><ArrowRight className="w-8 h-8" /></div>
               <div className="hidden lg:block absolute top-12 right-[30%] text-neutral-700"><ArrowRight className="w-8 h-8" /></div>

               <WorkflowStep 
                 number="01"
                 title="Define Inputs"
                 desc="Set up your flow schema. Accept Integers, Strings, Booleans, or even File uploads (Schematics/NBT)."
                 code={`{
  "radius": "number",
  "material": "string",
  "template": "file"
}`}
               />

               <WorkflowStep 
                 number="02"
                 title="Process Logic"
                 desc="Use 50+ built-in nodes or write custom scripts to manipulate data, generate geometry, and merge NBT."
                 isCenter={true}
                 code={`// Visual Flow Execution
Running Node: GenSphere
Running Node: NBTMerge
Subflow: 'TreeGenerator'
> Completed in 12ms`}
               />

               <WorkflowStep 
                 number="03"
                 title="Call API"
                 desc="Your flow is instantly available as a POST endpoint. Send JSON, receive the processed file or data."
                 code={`curl -X POST /api/run/flow-id \\
  -d '{"radius": 32}' \\
  -o output.schem`}
               />
           </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center border border-white/10 bg-[#121214] rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"></div>
          <div className="absolute -top-[100px] -left-[100px] w-[300px] h-[300px] bg-green-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <h2 className="text-4xl font-bold mb-6 relative z-10">Start engineering your builds</h2>
          <p className="text-neutral-400 mb-10 max-w-xl mx-auto relative z-10">
            Join the community of developers and builders creating the next generation of Minecraft tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button 
              onClick={() => navigate('/editor')}
              className="px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
            >
              Launch Editor <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              href="https://github.com/Nano112/polymerase"
              target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 bg-black border border-neutral-800 text-white rounded-xl font-bold hover:border-neutral-600 transition-all flex items-center justify-center gap-2"
            >
              <Github className="w-4 h-4" /> View Source
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-neutral-400">
            <Workflow className="w-4 h-4" />
            <span className="text-sm">Flow &copy; 2025</span>
          </div>
          <div className="text-sm text-neutral-500">
            Built for the <span className="text-neutral-300">Technical Minecraft</span> community.
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Sub Components ---

function WorkflowStep({ number, title, desc, code, isCenter }: { number: string, title: string, desc: string, code: string, isCenter?: boolean }) {
    return (
        <div className={`relative p-1 rounded-xl bg-gradient-to-b from-white/10 to-transparent ${isCenter ? 'lg:-translate-y-4' : ''}`}>
            <div className="bg-[#09090b] h-full rounded-lg p-6 border border-white/5 flex flex-col">
                <div className="text-4xl font-bold text-neutral-800 mb-4 font-mono">{number}</div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-neutral-400 text-sm mb-6 flex-grow">{desc}</p>
                
                <div className="bg-black rounded border border-white/10 p-3 overflow-hidden">
                    <pre className="font-mono text-xs text-neutral-300 overflow-x-auto">
                        {code}
                    </pre>
                </div>
            </div>
        </div>
    )
}

// A CSS-only mock of the Node Graph to look like the screenshot
function MockFlowGraph() {
    return (
        <div className="relative w-full h-full text-xs select-none p-10 flex items-center justify-center gap-16">
            
            {/* Wires (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                {/* Input to Process */}
                <path d="M 320 200 C 370 200 370 250 420 250" fill="none" stroke="#3f3f46" strokeWidth="2" />
                <path d="M 320 220 C 370 220 370 270 420 270" fill="none" stroke="#22c55e" strokeWidth="2" />
                
                {/* Process to Output */}
                <path d="M 620 250 C 670 250 670 220 720 220" fill="none" stroke="#22c55e" strokeWidth="2" />
            </svg>

            {/* Node 1: Inputs */}
            <div className="w-48 bg-[#18181b] border border-neutral-700 rounded-lg shadow-xl relative z-10">
                <div className="h-8 bg-[#27272a] border-b border-neutral-700 rounded-t-lg px-3 flex items-center justify-between">
                    <span className="font-bold text-neutral-300">Inputs</span>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <div className="p-3 space-y-4">
                    <div className="flex justify-between items-center group">
                        <span className="text-neutral-400">Radius</span>
                        <div className="flex items-center gap-2">
                            <span className="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">32</span>
                            <div className="w-3 h-3 rounded-full bg-purple-500 border border-neutral-900"></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Material</span>
                        <div className="flex items-center gap-2">
                            <span className="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">"stone"</span>
                            <div className="w-3 h-3 rounded-full bg-green-500 border border-neutral-900"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Node 2: Logic (Subflow) */}
            <div className="w-56 bg-[#18181b] border border-neutral-700 rounded-lg shadow-xl relative z-10">
                <div className="h-8 bg-[#27272a] border-b border-neutral-700 rounded-t-lg px-3 flex items-center justify-between">
                    <span className="font-bold text-blue-400 flex items-center gap-2"><Layers className="w-3 h-3" /> Generator Subflow</span>
                </div>
                <div className="p-3 space-y-4 relative">
                    {/* Inputs */}
                    <div className="absolute -left-1.5 top-10 w-3 h-3 rounded-full bg-purple-500 border border-neutral-900"></div>
                    <div className="absolute -left-1.5 top-[60px] w-3 h-3 rounded-full bg-green-500 border border-neutral-900"></div>

                    {/* Outputs */}
                    <div className="absolute -right-1.5 top-10 w-3 h-3 rounded-full bg-green-500 border border-neutral-900"></div>

                    <div className="text-neutral-500 italic text-center py-2">
                        Contains 14 nodes
                    </div>
                </div>
            </div>

            {/* Node 3: API Output */}
            <div className="w-48 bg-[#18181b] border border-green-900/50 rounded-lg shadow-xl relative z-10 shadow-green-900/20">
                <div className="h-8 bg-green-900/20 border-b border-green-900/30 rounded-t-lg px-3 flex items-center justify-between">
                    <span className="font-bold text-green-400 flex items-center gap-2"><Globe className="w-3 h-3" /> API Response</span>
                </div>
                <div className="p-3 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-green-500 border border-neutral-900"></div>
                             <span className="text-neutral-400">Schema</span>
                        </div>
                    </div>
                    <div className="bg-black/50 p-2 rounded text-[10px] font-mono text-green-300">
                        POST /api/v1/run
                    </div>
                </div>
            </div>

        </div>
    )
}