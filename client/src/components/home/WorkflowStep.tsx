interface WorkflowStepProps {
  number: string;
  title: string;
  desc: string;
  code: string;
  isCenter?: boolean;
}

export function WorkflowStep({ number, title, desc, code, isCenter }: WorkflowStepProps) {
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
  );
}
