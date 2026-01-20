import React from 'react';
import {
  Search,
  Mic,
  MicOff,
  Terminal,
  Plus,
  Minus
} from 'lucide-react';
import { PANEL_STYLES } from '../lib/hudChrome';

interface CommandDockProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
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
  onOpenCommandPalette,
  onToggleVoice,
  onToggleTerminal,
  isVoiceConnected,
  isTerminalOpen
}) => {
  return (
    <div className={`${PANEL_STYLES.commandDock} pointer-events-auto`}>
      <div className="p-3 flex items-center justify-between text-[10px] font-mono">
        {/* LEFT: Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onZoomOut}
            className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <Minus size={12} />
          </button>
          <span className="w-10 text-center text-[9px] text-neutral-500 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
            title="Zoom In"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* RIGHT: Command + Controls */}
        <div className="flex items-center gap-3">
          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 text-neutral-500 hover:text-white transition-colors"
          >
            <Search size={10} />
            <span className="text-[9px]">CMD+K</span>
          </button>

          <div className="h-3 w-px bg-neutral-800" />

          {/* Voice Toggle */}
          <button
            onClick={onToggleVoice}
            className={`
              flex items-center justify-center transition-colors
              ${isVoiceConnected
                ? 'text-emerald-400'
                : 'text-neutral-500 hover:text-white'}
            `}
            title={isVoiceConnected ? 'Disable Voice' : 'Enable Voice'}
          >
            {isVoiceConnected ? <Mic size={12} className="animate-pulse" /> : <MicOff size={12} />}
          </button>

          {/* Terminal Toggle */}
          <button
            onClick={onToggleTerminal}
            className={`
              flex items-center justify-center transition-colors
              ${isTerminalOpen
                ? 'text-white'
                : 'text-neutral-500 hover:text-white'}
            `}
            title="Toggle Terminal"
          >
            <Terminal size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandDock;
