import React from 'react';
import { FileCode, FileJson, Folder, ChevronRight, Copy } from 'lucide-react';

const CodeEditor: React.FC = () => {
  return (
    <div className="flex h-full bg-[#0a0a0a] text-xs font-mono select-text">
      {/* Sidebar */}
      <div className="w-40 border-r border-neutral-800 bg-black/50 flex flex-col select-none">
        <div className="p-2 text-neutral-500 font-bold tracking-wider">EXPLORER</div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="flex items-center gap-1 text-neutral-300"><ChevronRight size={12} /><Folder size={12} className="text-blue-500" /> src</div>
          <div className="pl-4 flex items-center gap-1 text-emerald-400 bg-neutral-800/50 rounded cursor-pointer"><FileCode size={12} /> App.tsx</div>
          <div className="pl-4 flex items-center gap-1 text-neutral-400"><FileCode size={12} /> types.ts</div>
          <div className="pl-4 flex items-center gap-1 text-neutral-400"><FileCode size={12} /> utils.ts</div>
          <div className="flex items-center gap-1 text-neutral-300 mt-2"><ChevronRight size={12} /><Folder size={12} className="text-amber-500" /> public</div>
          <div className="pl-4 flex items-center gap-1 text-neutral-400"><FileJson size={12} /> manifest.json</div>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-8 bg-[#0f0f0f] border-b border-neutral-800 flex items-center px-4 gap-2 text-neutral-400 select-none">
           <FileCode size={12} className="text-emerald-500" />
           <span>App.tsx</span>
           <span className="ml-auto text-[10px] opacity-50">UTF-8</span>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-[#0a0a0a] text-neutral-300 relative selection:bg-emerald-900/30">
          <div className="absolute top-2 right-4 opacity-0 hover:opacity-100 transition-opacity cursor-pointer select-none">
             <Copy size={14} />
          </div>
          <pre className="leading-6">
            <code>
              <span className="text-purple-400">import</span> React <span className="text-purple-400">from</span> <span className="text-amber-300">'react'</span>;{'\n'}
              <span className="text-purple-400">import</span> {'{'} useState {'}'} <span className="text-purple-400">from</span> <span className="text-amber-300">'react'</span>;{'\n'}
              {'\n'}
              <span className="text-blue-400">const</span> <span className="text-yellow-200">App</span>: <span className="text-emerald-300">React.FC</span> = () <span className="text-blue-400">=&gt;</span> {'{'}{'\n'}
              {'  '}<span className="text-blue-400">const</span> [state, setState] = <span className="text-blue-300">useState</span>(<span className="text-amber-300">"init"</span>);{'\n'}
              {'  '}<span className="text-neutral-500">// Initialize agent protocol</span>{'\n'}
              {'  '}<span className="text-purple-400">return</span> ({'\n'}
              {'    '}&lt;<span className="text-emerald-300">div</span> className=<span className="text-amber-300">"hud-container"</span>&gt;{'\n'}
              {'      '}&lt;<span className="text-emerald-300">AgentVisualizer</span> data={'{'}state{'}'} /&gt;{'\n'}
              {'    '}&lt;/<span className="text-emerald-300">div</span>&gt;{'\n'}
              {'  '});{'\n'}
              {'}'};{'\n'}
              {'\n'}
              <span className="text-purple-400">export default</span> App;
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;