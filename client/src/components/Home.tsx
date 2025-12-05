import { Navigation } from './home/Navigation';
import { Hero } from './home/Hero';
import { Philosophy } from './home/Philosophy';
import { Workflow } from './home/Workflow';
import { CTA } from './home/CTA';
import { Footer } from './home/Footer';

export function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden font-sans selection:bg-green-500/30">
      <Navigation />
      <Hero />
      <Philosophy />
      <Workflow />
      <CTA />
      <Footer />
    </div>
  );
}
