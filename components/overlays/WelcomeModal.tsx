import React, { useState } from 'react';
import { Mic, Terminal, Search, Radio, ChevronRight, Key, ExternalLink } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [voiceExpanded, setVoiceExpanded] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = () => {
    localStorage.setItem('hud_welcomed', 'true');
    onClose();
  };

  const hasApiKey = !!localStorage.getItem('GEMINI_API_KEY');

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-auto"
      onClick={handleDismiss}
    >
      <div
        className="w-[480px] max-w-[90vw] bg-[#111] border border-neutral-800 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Radio size={14} className="text-emerald-500" />
            <span className="text-[9px] tracking-widest font-bold text-neutral-400">CENTRALCOMS</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">HUD</h1>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Built by arach. A spatial canvas for organizing context, windows &amp; workflows.
          </p>
        </div>

        {/* Feature callouts */}
        <div className="px-6 pb-4">
          <div className="border border-neutral-800 rounded bg-black/40 divide-y divide-neutral-800/50">
            {/* VOICE_MODE - expandable */}
            <div>
              <button
                onClick={() => setVoiceExpanded(!voiceExpanded)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors"
              >
                <Mic size={14} className="text-emerald-500 shrink-0" />
                <span className="text-[10px] text-neutral-300 font-bold tracking-wide flex-1 text-left">VOICE_MODE</span>
                <span className="text-[10px] text-neutral-600 mr-1">bottom-right</span>
                <ChevronRight size={10} className={`text-neutral-600 transition-transform duration-150 ${voiceExpanded ? 'rotate-90' : ''}`} />
              </button>
              {voiceExpanded && (
                <div className="px-3 pb-3 pt-1 ml-[26px]">
                  <p className="text-[10px] text-neutral-500 leading-relaxed mb-2">
                    Voice mode uses the <span className="text-neutral-300">Gemini Live API</span> for real-time voice interaction. HUD is a static site (GitHub Pages) with no backend &mdash; your key stays in your browser and all API calls go directly from your machine to Google.
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <Key size={11} className="text-neutral-600" />
                    <span className="text-[10px] text-neutral-500">
                      {hasApiKey
                        ? <span className="text-emerald-500">Key configured</span>
                        : <span className="text-amber-500">No key set</span>
                      }
                    </span>
                  </div>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 hover:text-emerald-400 transition-colors"
                  >
                    <ExternalLink size={10} />
                    Get a Gemini API key
                  </a>
                </div>
              )}
            </div>

            {/* CONSOLE */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Terminal size={14} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] text-neutral-300 font-bold tracking-wide flex-1">CONSOLE</span>
              <span className="text-[10px] text-neutral-600">Ctrl + `</span>
            </div>

            {/* CMD_PALETTE */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Search size={14} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] text-neutral-300 font-bold tracking-wide flex-1">CMD_PALETTE</span>
              <span className="text-[10px] text-neutral-600">{'\u2318K'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <p className="text-[10px] text-neutral-600 text-center">
            Find this guide anytime in CENTRALCOMS on the left sidebar
          </p>
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold tracking-wide rounded transition-colors"
          >
            Enter HUD
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
