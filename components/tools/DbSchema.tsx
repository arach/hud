import React from 'react';
import { Database, Key } from 'lucide-react';

const TableNode: React.FC<{ name: string; fields: string[]; x: number; y: number; color: string }> = ({ name, fields, x, y, color }) => (
  <div 
    className="absolute w-40 bg-neutral-900/90 border border-neutral-700 rounded shadow-xl overflow-hidden group hover:border-white/40 transition-colors cursor-move"
    style={{ left: x, top: y }}
  >
    <div className={`h-6 ${color} px-2 flex items-center justify-between`}>
      <span className="text-[10px] font-bold text-black uppercase tracking-wider">{name}</span>
      <Database size={10} className="text-black/50" />
    </div>
    <div className="p-2 space-y-1.5">
      {fields.map((f, i) => (
        <div key={i} className="flex items-center text-[10px] text-neutral-400 font-mono">
           {i === 0 && <Key size={8} className="mr-1 text-yellow-500" />}
           <span className={i === 0 ? "text-neutral-200" : ""}>{f}</span>
           <span className="ml-auto opacity-30">
               {i === 0 ? 'UUID' : f.includes('_id') ? 'UUID' : 'VARCHAR'}
           </span>
        </div>
      ))}
    </div>
  </div>
);

const DbSchema: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-[#080808] overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#555 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* Connections (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <path d="M 180 80 C 230 80, 230 180, 280 180" fill="none" stroke="#666" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 180 80 C 230 80, 230 280, 280 280" fill="none" stroke="#666" strokeWidth="2" strokeDasharray="4 4" />
        </svg>

        <TableNode 
            name="Users" 
            fields={['id', 'username', 'email', 'role', 'created_at']} 
            x={20} y={40} 
            color="bg-emerald-500" 
        />
        
        <TableNode 
            name="Workspaces" 
            fields={['id', 'owner_id', 'name', 'settings_json']} 
            x={280} y={150} 
            color="bg-blue-500" 
        />

        <TableNode 
            name="Tasks" 
            fields={['id', 'workspace_id', 'assigned_to', 'status']} 
            x={280} y={280} 
            color="bg-amber-500" 
        />

        <div className="absolute bottom-2 right-2 flex gap-2">
            <div className="px-2 py-1 bg-neutral-800 rounded text-[9px] text-neutral-400">PostgreSQL 15</div>
            <div className="px-2 py-1 bg-neutral-800 rounded text-[9px] text-emerald-500 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
            </div>
        </div>
    </div>
  );
};

export default DbSchema;
