import { ArrowRight } from 'lucide-react';
import { WorkflowStep } from './WorkflowStep';

export function Workflow() {
  return (
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
Running Node: SphereGenerator
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
  );
}
