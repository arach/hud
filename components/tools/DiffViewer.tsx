import React from 'react';
import { GitCommit, ArrowRightLeft, FileDiff } from 'lucide-react';

const DiffViewer: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] font-mono text-[10px]">
        {/* Header */}
        <div className="h-8 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3">
             <div className="flex items-center gap-2 text-neutral-400">
                 <FileDiff size={14} />
                 <span className="font-bold">App.tsx</span>
                 <span className="text-neutral-600">(Working Tree)</span>
             </div>
             <div className="flex items-center gap-4 text-neutral-500">
                 <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500/50 rounded-sm"></span> -12</div>
                 <div className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500/50 rounded-sm"></span> +45</div>
             </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Original (Left) */}
            <div className="w-1/2 border-r border-neutral-800 bg-[#0a0a0a] overflow-hidden flex flex-col">
                 <div className="px-2 py-1 bg-neutral-800/30 text-neutral-500 text-center uppercase tracking-widest text-[9px]">Original</div>
                 <div className="flex-1 p-2 space-y-1 overflow-y-auto opacity-60">
                     <div className="flex gap-2 text-neutral-500"><span>1</span> <span>import React from 'react';</span></div>
                     <div className="flex gap-2 text-neutral-500"><span>2</span> <span>import {'{'} useState {'}'} from 'react';</span></div>
                     <div className="flex gap-2 bg-red-900/20 text-red-400/50"><span>3</span> <span>const App = () ={'>'} {'{'}</span></div>
                     <div className="flex gap-2 text-neutral-500"><span>4</span> <span>  return {'<div />'}</span></div>
                     <div className="flex gap-2 text-neutral-500"><span>5</span> <span>{'}'}</span></div>
                 </div>
            </div>

            {/* Modified (Right) */}
            <div className="w-1/2 bg-[#0a0a0a] overflow-hidden flex flex-col">
                 <div className="px-2 py-1 bg-neutral-800/30 text-emerald-500/50 text-center uppercase tracking-widest text-[9px]">Modified</div>
                 <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                     <div className="flex gap-2 text-neutral-500"><span>1</span> <span>import React from 'react';</span></div>
                     <div className="flex gap-2 text-neutral-500"><span>2</span> <span>import {'{'} useState, useEffect {'}'} from 'react';</span></div>
                     <div className="flex gap-2 bg-emerald-900/20 text-emerald-400"><span>3</span> <span>const App: React.FC = () ={'>'} {'{'}</span></div>
                     <div className="flex gap-2 bg-emerald-900/20 text-emerald-400"><span>4</span> <span>  const [mounted, setMounted] = useState(false);</span></div>
                     <div className="flex gap-2 text-neutral-500"><span>5</span> <span>  return {'<div />'}</span></div>
                     <div className="flex gap-2 text-neutral-500"><span>6</span> <span>{'}'}</span></div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default DiffViewer;