import React from 'react';
import { Cloud, Server, Database, Globe, Smartphone, Shield } from 'lucide-react';

const ArchNode: React.FC<{ icon: any; label: string; sub: string; x: number; y: number }> = ({ icon: Icon, label, sub, x, y }) => (
  <div 
    className="absolute flex flex-col items-center gap-2 group cursor-pointer"
    style={{ left: x, top: y }}
  >
    <div className="w-16 h-16 bg-neutral-900 border border-neutral-700 rounded-full flex items-center justify-center shadow-lg group-hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all z-10">
        <Icon size={24} className="text-neutral-300 group-hover:text-emerald-400" />
    </div>
    <div className="text-center">
        <div className="text-[10px] font-bold text-neutral-300">{label}</div>
        <div className="text-[9px] text-neutral-600">{sub}</div>
    </div>
  </div>
);

const ArchDiagram: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-[#0b0b0b] overflow-hidden">
       {/* Flow Lines */}
       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#888" />
            </marker>
          </defs>
          {/* Client to LB */}
          <line x1="80" y1="150" x2="180" y2="150" stroke="#444" strokeWidth="2" markerEnd="url(#arrow)" />
          {/* LB to API */}
          <line x1="260" y1="150" x2="360" y2="150" stroke="#444" strokeWidth="2" markerEnd="url(#arrow)" />
          {/* API to DB */}
          <line x1="400" y1="180" x2="400" y2="250" stroke="#444" strokeWidth="2" markerEnd="url(#arrow)" />
           {/* API to Worker */}
           <line x1="440" y1="150" x2="520" y2="150" stroke="#444" strokeWidth="2" markerEnd="url(#arrow)" />
       </svg>

       <div className="absolute top-4 left-4 text-[10px] font-mono text-neutral-500 uppercase border border-neutral-800 px-2 py-1 rounded">
          System: Production-US-East
       </div>

       <ArchNode icon={Globe} label="Client App" sub="React / Vite" x={20} y={120} />
       <ArchNode icon={Shield} label="WAF / LB" sub="Cloudflare" x={200} y={120} />
       <ArchNode icon={Server} label="API Cluster" sub="Node.js / Express" x={380} y={120} />
       <ArchNode icon={Database} label="Primary DB" sub="Postgres RDS" x={380} y={280} />
       <ArchNode icon={Cloud} label="Async Worker" sub="Lambda" x={540} y={120} />

       {/* Traffic Particles (Simulated) */}
       <div className="absolute top-[149px] left-[100px] w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
       <div className="absolute top-[149px] left-[300px] w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping delay-75" />
    </div>
  );
};

export default ArchDiagram;
