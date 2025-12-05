import { useNavigate } from 'react-router-dom';
import { ArrowRight, Github, Workflow } from 'lucide-react';

export function Navigation() {
  const navigate = useNavigate();

  return (
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
  );
}
