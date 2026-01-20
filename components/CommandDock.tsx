import React from 'react';
import {
  Search,
  Mic,
  MicOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Terminal
} from 'lucide-react';
import { PANEL_STYLES } from '../lib/hudChrome';

interface CommandDockProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetLayout: () => void;
  onOpenCommandPalette: () => void;
  onToggleVoice: () => void;
  onToggleTerminal: () => void;
  isVoiceConnected: boolean;
  isTerminalOpen: boolean;
}

const CommandDock: React.FC<CommandDockProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetLayout,
  onOpenCommandPalette,
  onToggleVoice,
  onToggleTerminal,
  isVoiceConnected,
  isTerminalOpen
}) => {
  return (
    <div className={`${PANEL_STYLES.commandDock} w-[280px] pointer-events-auto`}>
      <div className="p-3 flex items-center justify-between gap-2">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-neutral-700/50 rounded-lg hover:bg-white/10 transition-colors flex-1"
        >
          <Search size={12} className="text-neutral-500" />
          <span className="text-[10px] text-neutral-400 font-mono">CMD+K</span>
        </button>

        {/* Voice Toggle */}
        <button
          onClick={onToggleVoice}
          className={`
            w-8 h-8 flex items-center justify-center rounded-lg transition-colors
            ${isVoiceConnected
              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50'
              : 'bg-white/5 text-neutral-500 border border-neutral-700/50 hover:bg-white/10 hover:text-white'}
          `}
          title={isVoiceConnected ? 'Disable Voice' : 'Enable Voice'}
        >
          {isVoiceConnected ? <Mic size={14} className="animate-pulse" /> : <MicOff size={14} />}
        </button>

        {/* Terminal Toggle */}
        <button
          onClick={onToggleTerminal}
          className={`
            w-8 h-8 flex items-center justify-center rounded-lg transition-colors
            ${isTerminalOpen
              ? 'bg-white/10 text-white border border-neutral-600/50'
              : 'bg-white/5 text-neutral-500 border border-neutral-700/50 hover:bg-white/10 hover:text-white'}
          `}
          title="Toggle Terminal"
        >
          <Terminal size={14} />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onZoomOut}
            className="w-7 h-7 flex items-center justify-center rounded bg-white/5 border border-neutral-700/50 hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>

          <button
            onClick={onResetLayout}
            className="px-3 h-7 flex items-center justify-center rounded bg-white/5 border border-neutral-700/50 hover:bg-white/10 text-[10px] font-mono text-neutral-400 hover:text-white transition-colors"
            title="Reset Layout"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={onZoomIn}
            className="w-7 h-7 flex items-center justify-center rounded bg-white/5 border border-neutral-700/50 hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
        </div>

        <button
          onClick={onResetLayout}
          className="p-1.5 rounded hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
          title="Reset View"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
};

export default CommandDock;
