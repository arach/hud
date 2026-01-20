import React from 'react';
import {
  Search,
  Mic,
  MicOff,
  Terminal
} from 'lucide-react';
import { PANEL_STYLES } from '../lib/hudChrome';

interface CommandDockProps {
  onOpenCommandPalette: () => void;
  onToggleVoice: () => void;
  onToggleTerminal: () => void;
  isVoiceConnected: boolean;
  isTerminalOpen: boolean;
}

const CommandDock: React.FC<CommandDockProps> = ({
  onOpenCommandPalette,
  onToggleVoice,
  onToggleTerminal,
  isVoiceConnected,
  isTerminalOpen
}) => {
  return (
    <div className={`${PANEL_STYLES.commandDock} pointer-events-auto`}>
      <div className="p-3 flex items-center justify-between text-[10px] font-mono">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-white transition-colors"
        >
          <Search size={10} />
          <span className="text-[9px]">CMD+K</span>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-3">
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
