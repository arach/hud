import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceControlProps {
  isConnected: boolean;
  onToggle: () => void;
}

/**
 * Floating voice toggle button — matches ZoomControls style.
 * Positioned top-right of the canvas viewport.
 */
const VoiceControl: React.FC<VoiceControlProps> = ({ isConnected, onToggle }) => {
  return (
    <div className="fixed top-16 right-[296px] z-30 pointer-events-auto flex flex-col items-center bg-neutral-900/70 backdrop-blur-md border border-neutral-700/50 rounded-md shadow-lg shadow-black/30">
      <button
        onClick={onToggle}
        className={`
          w-9 h-9 flex items-center justify-center rounded-md transition-all
          ${isConnected
            ? 'text-emerald-400 hover:bg-emerald-500/15'
            : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }
        `}
        title={isConnected ? 'Disconnect Voice' : 'Connect Voice'}
      >
        {isConnected ? <Mic size={15} /> : <MicOff size={15} />}
      </button>

      {/* Active indicator dot */}
      {isConnected && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      )}
    </div>
  );
};

export default VoiceControl;
