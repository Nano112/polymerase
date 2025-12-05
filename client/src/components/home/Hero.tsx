import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { Zap, Book } from 'lucide-react';
import { MockFlowGraph } from './MockFlowGraph';

export function Hero() {
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
                  <MockFlowGraph />
              </div>
              
              {/* Overlay Gradient at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none"></div>
           </div>
        </div>
      </div>
    </section>
  );
}
