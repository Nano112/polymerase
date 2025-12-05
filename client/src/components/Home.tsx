import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { ArrowRight, Box, Zap, Share2, Cpu, Layers } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero Animation
    anime({
      targets: '.hero-element',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(100),
      easing: 'easeOutExpo',
      duration: 1200
    });

    // Floating animation for background elements
    anime({
      targets: '.floating-shape',
      translateY: [-10, 10],
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      duration: 3000,
      delay: anime.stagger(500)
    });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-x-hidden selection:bg-green-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Box className="w-5 h-5 text-neutral-950" />
            </div>
            <span className="font-bold text-xl tracking-tight">Polymerase</span>
          </div>
          <button 
            onClick={() => navigate('/editor')}
            className="px-4 py-2 bg-neutral-100 text-neutral-950 rounded-lg font-medium hover:bg-white transition-colors flex items-center gap-2 text-sm"
          >
            Launch Editor <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative" ref={heroRef}>
        {/* Background Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl floating-shape" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl floating-shape" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="hero-element inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/50 border border-neutral-800 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-neutral-400">v0.5.0 Beta Available</span>
          </div>
          
          <h1 className="hero-element text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
            Visual Programming for <br />
            <span className="text-green-400">Minecraft Schematics</span>
          </h1>
          
          <p className="hero-element text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Build complex logic, manipulate NBT data, and automate schematic generation using a powerful node-based editor.
          </p>
          
          <div className="hero-element flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/editor')}
              className="px-8 py-4 bg-green-500 text-neutral-950 rounded-xl font-bold hover:bg-green-400 transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-green-500/20"
            >
              Start Building <Zap className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 border border-neutral-800 transition-all">
              View Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-neutral-900/30" ref={featuresRef}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Layers className="w-6 h-6 text-purple-400" />}
              title="Node-Based Logic"
              description="Drag and drop nodes to create complex logic flows. Connect inputs and outputs to process data visually."
              delay={0}
            />
            <FeatureCard 
              icon={<Cpu className="w-6 h-6 text-blue-400" />}
              title="Real-time Execution"
              description="Execute your flows in real-time with our high-performance engine. See results instantly as you build."
              delay={100}
            />
            <FeatureCard 
              icon={<Share2 className="w-6 h-6 text-orange-400" />}
              title="Schematic Export"
              description="Generate and export standard .schem files compatible with WorldEdit and other Minecraft tools."
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Step 
                number="01"
                title="Add Nodes"
                description="Choose from a library of nodes for math, logic, NBT manipulation, and more."
              />
              <Step 
                number="02"
                title="Connect Data"
                description="Link nodes together to define how data flows through your schematic logic."
              />
              <Step 
                number="03"
                title="Execute & Export"
                description="Run your flow to generate the schematic and export it to your Minecraft world."
              />
            </div>
            
            <div className="relative h-[400px] bg-neutral-900 rounded-2xl border border-neutral-800 p-4 overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:16px_16px]" />
              {/* Abstract representation of the editor */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4">
                <div className="absolute top-10 left-10 w-32 h-20 bg-neutral-800 rounded-lg border border-neutral-700 shadow-xl p-3">
                  <div className="h-2 w-16 bg-purple-500/20 rounded mb-2" />
                  <div className="h-2 w-24 bg-neutral-700 rounded" />
                </div>
                <div className="absolute bottom-20 right-10 w-32 h-20 bg-neutral-800 rounded-lg border border-neutral-700 shadow-xl p-3">
                  <div className="h-2 w-16 bg-green-500/20 rounded mb-2" />
                  <div className="h-2 w-24 bg-neutral-700 rounded" />
                </div>
                {/* Animated connection line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path 
                    d="M 100 60 C 200 60 200 200 300 200" 
                    fill="none" 
                    stroke="#4ade80" 
                    strokeWidth="2" 
                    className="opacity-50"
                  />
                  <circle r="4" fill="#4ade80">
                    <animateMotion 
                      dur="2s" 
                      repeatCount="indefinite"
                      path="M 100 60 C 200 60 200 200 300 200"
                    />
                  </circle>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-neutral-800 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-neutral-500" />
            <span className="text-neutral-500 font-medium">Polymerase &copy; 2025</span>
          </div>
          <div className="flex gap-6 text-neutral-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <div 
      className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-all hover:-translate-y-1 duration-300 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mb-4 group-hover:bg-neutral-800/80 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-neutral-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-4">
      <div className="text-4xl font-bold text-neutral-800 font-mono">{number}</div>
      <div>
        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        <p className="text-neutral-400">{description}</p>
      </div>
    </div>
  );
}
