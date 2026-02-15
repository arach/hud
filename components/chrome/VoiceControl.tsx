import React, { useState } from 'react';
import { Mic, MicOff, HelpCircle, Command, X } from 'lucide-react';

interface VoiceControlProps {
  isConnected: boolean;
  onToggle: () => void;
  onOpenCommandPalette: () => void;
}

const SHORTCUTS = [
  { keys: '⌘ K', label: 'Command palette' },
  { keys: 'Ctrl `', label: 'Toggle terminal' },
  { keys: 'Ctrl Scroll', label: 'Pan canvas' },
  { keys: 'Scroll', label: 'Zoom in / out' },
  { keys: 'Click + Drag', label: 'Move windows' },
  { keys: 'Click zone', label: 'Focus context' },
  { keys: 'Click canvas', label: 'Deselect / unfocus' },
];

/**
 * Floating toolbar — voice, help, and command palette.
 * Positioned top-right of the canvas viewport.
 */
const VoiceControl: React.FC<VoiceControlProps> = ({ isConnected, onToggle, onOpenCommandPalette }) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <div className="fixed top-16 right-[296px] z-30 pointer-events-auto flex flex-col items-center bg-neutral-900/70 backdrop-blur-md border border-neutral-700/50 rounded-md shadow-lg shadow-black/30">
        {/* Voice */}
        <button
          onClick={onToggle}
          className={`
            relative w-9 h-8 flex items-center justify-center rounded-t-md transition-all border-b border-neutral-700/30
            ${isConnected
              ? 'text-emerald-400 hover:bg-emerald-500/15'
              : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }
          `}
          title={isConnected ? 'Disconnect Voice' : 'Connect Voice'}
        >
          {isConnected ? <Mic size={14} /> : <MicOff size={14} />}
          {isConnected && (
            <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          )}
        </button>

        {/* Command Palette */}
        <button
          onClick={onOpenCommandPalette}
          className="w-9 h-8 flex items-center justify-center hover:bg-white/10 text-neutral-400 hover:text-white transition-colors border-b border-neutral-700/30"
          title="Command Palette (⌘K)"
        >
          <Command size={14} />
        </button>

        {/* Help */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`w-9 h-8 flex items-center justify-center rounded-b-md transition-all
            ${showHelp ? 'text-white bg-white/10' : 'text-neutral-400 hover:text-white hover:bg-white/10'}
          `}
          title="Keyboard Shortcuts & Help"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="fixed top-16 right-[340px] z-30 pointer-events-auto animate-in fade-in slide-in-from-right-2 duration-200">
          <div
            style={{
              background: 'linear-gradient(180deg, #222 0%, #181818 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(0,0,0,0.4)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
            className="rounded-lg w-[220px]"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/50">
              <span className="text-[9px] tracking-widest font-bold text-neutral-400">NAVIGATION</span>
              <button onClick={() => setShowHelp(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={12} />
              </button>
            </div>
            <div className="px-3 py-2 flex flex-col gap-1.5">
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-neutral-400">{s.label}</span>
                  <kbd className="text-[9px] font-mono text-neutral-500 bg-neutral-800/80 px-1.5 py-0.5 rounded border border-neutral-700/50 whitespace-nowrap">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-neutral-800/50">
              <p className="text-[9px] text-neutral-600 leading-relaxed">
                Pan the canvas with Ctrl + scroll or middle-click drag. Click empty canvas to deselect.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceControl;
