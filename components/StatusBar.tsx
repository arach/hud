import React, { useState, useEffect, useRef } from 'react';
import { Wifi, GitBranch, Activity, Clock, Mic, Terminal, Radio, Map, Maximize2, ChevronDown, Check } from 'lucide-react';
import { PANEL_STYLES } from '../lib/hudChrome';

const MOCK_BRANCHES = [
  { name: 'main', isDefault: true },
  { name: 'feature/hud-structure', isCurrent: true },
  { name: 'feature/voice-integration', isRecent: true },
  { name: 'fix/minimap-rendering', isRecent: true },
  { name: 'develop' },
];

interface StatusBarProps {
  panOffset: { x: number; y: number };
  scale: number;
  viewport: { width: number; height: number };
  activeContextId: string;
  isVoiceConnected?: boolean;
  // Compact Mode Props
  isCompact?: boolean;
  onToggleTerminal?: () => void;
  onToggleVoice?: () => void;
  isTerminalOpen?: boolean;
  // Minimap integration
  isMinimapCollapsed?: boolean;
  onToggleMinimap?: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  panOffset,
  scale,
  viewport,
  activeContextId,
  isVoiceConnected,
  isCompact,
  onToggleTerminal,
  onToggleVoice,
  isTerminalOpen,
  isMinimapCollapsed = false,
  onToggleMinimap
}) => {
  const [time, setTime] = useState(new Date());
  const [latency, setLatency] = useState(24);
  const [vpCopied, setVpCopied] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState('feature/hud-structure');
  const branchMenuRef = useRef<HTMLDivElement>(null);

  // Close branch menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target as Node)) {
        setBranchMenuOpen(false);
      }
    };
    if (branchMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [branchMenuOpen]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const latencyTimer = setInterval(() => {
        setLatency(prev => {
            const change = Math.floor(Math.random() * 10) - 5;
            return Math.max(10, Math.min(100, prev + change));
        });
    }, 2000);
    return () => {
        clearInterval(timer);
        clearInterval(latencyTimer);
    };
  }, []);

  const viewportCamera = {
    x: -panOffset.x,
    y: -panOffset.y
  };
  const viewportSize = {
    w: viewport.width / scale,
    h: viewport.height / scale
  };

  const handleCopyViewport = async () => {
    const payload = `PAN: ${viewportCamera.x.toFixed(0)},${viewportCamera.y.toFixed(0)} | SIZE: ${viewportSize.w.toFixed(0)}x${viewportSize.h.toFixed(0)} | ZOOM: ${(scale * 100).toFixed(0)}%`;
    try {
      await navigator.clipboard.writeText(payload);
      setVpCopied(true);
      setTimeout(() => setVpCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy viewport bounds', error);
    }
  };

  return (
    <div data-hud-panel="status-bar" className={`${PANEL_STYLES.statusBar} h-7 flex items-center justify-between px-3 select-none font-mono text-[10px] text-neutral-500 pointer-events-auto`}>
      
      {/* LEFT: System Health + Collapsed Minimap */}
      <div className="flex items-center gap-4">
        {/* Collapsed Minimap Indicator */}
        {isMinimapCollapsed && (
          <>
            <button
              onClick={onToggleMinimap}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-neutral-800 hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
              title="Expand minimap"
            >
              <Map size={10} />
              <span className="text-[9px] font-bold">MAP</span>
              <Maximize2 size={8} className="opacity-60" />
            </button>
            <div className="h-3 w-px bg-neutral-800" />
          </>
        )}

        <div className="flex items-center gap-2 text-emerald-500">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="font-bold tracking-wider">ONLINE</span>
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        <div className="relative" ref={branchMenuRef}>
          <button
            onClick={() => setBranchMenuOpen(!branchMenuOpen)}
            className="flex items-center gap-1.5 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            <GitBranch size={10} />
            <span className="max-w-[100px] truncate">{currentBranch}</span>
            <ChevronDown size={10} className={`transition-transform ${branchMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Branch Selector Popup */}
          {branchMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-black/95 backdrop-blur-xl border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-2 border-b border-neutral-800 text-[9px] text-neutral-500 uppercase tracking-widest">
                Switch Branch
              </div>
              <div className="py-1 max-h-48 overflow-y-auto">
                {MOCK_BRANCHES.map((branch) => (
                  <button
                    key={branch.name}
                    onClick={() => {
                      setCurrentBranch(branch.name);
                      setBranchMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-white/5 transition-colors ${
                      currentBranch === branch.name ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="w-4 flex justify-center">
                      {currentBranch === branch.name && <Check size={10} className="text-emerald-500" />}
                    </div>
                    <span className={`flex-1 truncate ${currentBranch === branch.name ? 'text-white' : 'text-neutral-400'}`}>
                      {branch.name}
                    </span>
                    {branch.isDefault && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">default</span>
                    )}
                    {branch.isRecent && !branch.isCurrent && (
                      <span className="text-[8px] text-neutral-600">recent</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        <div className="flex items-center gap-1.5">
            <Wifi size={10} className={latency > 80 ? "text-amber-500" : "text-neutral-600"} />
            <span className="tabular-nums">{latency}ms</span>
        </div>
      </div>

      {/* CENTER: Viewport Data (Hidden on mobile or when controls need space) */}
      <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-3 hidden md:flex opacity-70 hover:opacity-100 transition-opacity ${isCompact ? 'opacity-30' : ''}`}>
         <button
             onClick={handleCopyViewport}
             className="flex items-center gap-3 hover:text-neutral-200 transition-colors cursor-pointer"
             title="Copy viewport data"
         >
             <div className="flex items-center gap-1">
                 <span className="text-neutral-600">PAN:</span>
                 <span className={`tabular-nums ${vpCopied ? 'text-emerald-500' : ''}`}>
                   {viewportCamera.x.toFixed(0)},{viewportCamera.y.toFixed(0)}
                 </span>
             </div>
             <div className="h-3 w-px bg-neutral-800" />
             <div className="flex items-center gap-1">
                 <span className="text-neutral-600">SIZE:</span>
                 <span className={`tabular-nums ${vpCopied ? 'text-emerald-500' : ''}`}>
                   {viewportSize.w.toFixed(0)}x{viewportSize.h.toFixed(0)}
                 </span>
             </div>
             <div className="h-3 w-px bg-neutral-800" />
             <div className="flex items-center gap-1">
                 <span className="text-neutral-600">ZOOM:</span>
                 <span className={`tabular-nums ${vpCopied ? 'text-emerald-500' : ''}`}>{(scale * 100).toFixed(0)}%</span>
             </div>
         </button>
      </div>

      {/* RIGHT: Controls & Context */}
      <div className="flex items-center gap-4">
        
        {/* Compact Mode Controls */}
        {isCompact && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300 slide-in-from-right-4">
                {/* Terminal Toggle */}
                <button 
                    onClick={onToggleTerminal}
                    className={`flex items-center justify-center w-5 h-5 rounded hover:bg-neutral-800 transition-colors ${isTerminalOpen ? 'text-white bg-neutral-800' : 'text-neutral-500'}`}
                    title="Toggle Terminal"
                >
                    <Terminal size={10} />
                </button>

                <div className="h-3 w-px bg-neutral-800" />

                {/* Voice Toggle */}
                <button 
                    onClick={onToggleVoice}
                    className={`flex items-center justify-center w-5 h-5 rounded hover:bg-neutral-800 transition-colors ${isVoiceConnected ? 'text-emerald-400 bg-emerald-950/50' : 'text-neutral-500'}`}
                    title={isVoiceConnected ? "Disable Voice" : "Enable Voice"}
                >
                    <Mic size={10} className={isVoiceConnected ? "animate-pulse" : ""} />
                </button>
            </div>
        )}

        {/* Standard Voice Status (Only if NOT compact, or if compact but showing detail? 
           Actually, in compact mode we use the button above. 
           Let's hide the large "VOICE ACTIVE" pill in compact mode to save space, relying on the button icon.) 
        */}
        {!isCompact && isVoiceConnected && (
           <div className="flex items-center gap-2 animate-pulse text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
               <Mic size={10} />
               <span className="font-bold tracking-wider">VOICE ACTIVE</span>
               <div className="flex gap-0.5 items-end h-2 ml-1">
                   <div className="w-0.5 h-full bg-emerald-500 animate-[bounce_1s_infinite]"></div>
                   <div className="w-0.5 h-2/3 bg-emerald-500 animate-[bounce_1.2s_infinite]"></div>
                   <div className="w-0.5 h-full bg-emerald-500 animate-[bounce_0.8s_infinite]"></div>
               </div>
           </div>
        )}

        {!isCompact && !isVoiceConnected && (
           <div className="flex items-center gap-1.5">
              <Activity size={10} className="text-neutral-600" />
              <span className="uppercase text-neutral-400">System: Nominal</span>
           </div>
        )}

        <div className="h-3 w-px bg-neutral-800" />

        <div className="flex items-center gap-1.5 text-neutral-400">
             <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
             <span className="uppercase">{activeContextId}</span>
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        <div className="flex items-center gap-1.5 text-neutral-300 min-w-[60px] justify-end">
            <Clock size={10} className="text-neutral-600" />
            <span>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </div>

    </div>
  );
};

export default StatusBar;
