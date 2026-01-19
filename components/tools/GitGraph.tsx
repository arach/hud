import React from 'react';
import { GitBranch, GitCommit, GitMerge } from 'lucide-react';

const CommitRow: React.FC<{ msg: string; hash: string; author: string; time: string; active?: boolean }> = ({ msg, hash, author, time, active }) => (
  <div className={`flex items-center gap-3 py-2 px-3 border-l-2 ${active ? 'border-emerald-500 bg-white/5' : 'border-neutral-800 hover:bg-white/5'} transition-colors cursor-pointer group`}>
    <div className="flex flex-col items-center mr-1">
        <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-neutral-600 group-hover:bg-neutral-400'}`} />
    </div>
    <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-medium truncate ${active ? 'text-emerald-400' : 'text-neutral-300'}`}>{msg}</span>
            <span className="text-[9px] font-mono text-neutral-600 bg-neutral-900 px-1 rounded">{hash}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
             <span className="text-[10px] text-neutral-500">{author}</span>
             <span className="text-[9px] text-neutral-600">{time}</span>
        </div>
    </div>
  </div>
);

const GitGraph: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#0c0c0c]">
      <div className="h-8 border-b border-neutral-800 flex items-center px-3 justify-between">
         <div className="flex items-center gap-2 text-neutral-400">
            <GitBranch size={14} />
            <span className="text-xs font-bold">feature/visual-primitives</span>
         </div>
         <div className="text-[10px] px-2 py-0.5 bg-emerald-900/30 text-emerald-500 rounded border border-emerald-900/50">
            Ahead 2
         </div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
         {/* Connector Line */}
         <div className="absolute top-4 bottom-4 left-[21px] w-px bg-neutral-800 pointer-events-none" />
         
         <div className="space-y-0">
            <CommitRow msg="feat: implement branch visualizer" hash="8a2b9d" author="Dev_AI" time="2m ago" active />
            <CommitRow msg="ui: update dashboard layout" hash="7c1x4f" author="Dev_AI" time="15m ago" />
            <CommitRow msg="fix: draggable window constraints" hash="3d9e2a" author="Human_Op" time="1h ago" />
            <CommitRow msg="merge: pull request #42" hash="1b4c8d" author="System" time="3h ago" />
            <CommitRow msg="chore: update dependencies" hash="9f3a1c" author="Human_Op" time="5h ago" />
            <CommitRow msg="init: project scaffold" hash="0a1b2c" author="System" time="1d ago" />
         </div>
      </div>
      
      <div className="p-2 border-t border-neutral-800 bg-black">
         <div className="flex gap-2">
            <button className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 rounded transition-colors">Fetch</button>
            <button className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 rounded transition-colors">Pull</button>
         </div>
      </div>
    </div>
  );
};

export default GitGraph;
