import React, { useState, useEffect, useRef } from 'react';
import { Key, Check, AlertCircle } from 'lucide-react';
import { chime } from '../../lib/sounds';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  isOpen: boolean;
  onActivated?: () => void;
}

type ActivationPhase = 'idle' | 'spinning' | 'activated' | 'done';

const BRAILLE_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];


const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, isOpen, onActivated }) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<ActivationPhase>('idle');
  const [brailleIndex, setBrailleIndex] = useState(0);
  const [statusText, setStatusText] = useState('');
  const savedKeyRef = useRef('');

  // Braille spinner animation
  useEffect(() => {
    if (phase !== 'spinning') return;
    const interval = setInterval(() => {
      setBrailleIndex(i => (i + 1) % BRAILLE_FRAMES.length);
    }, 80);
    return () => clearInterval(interval);
  }, [phase]);

  // Status text typewriter during spinning
  useEffect(() => {
    if (phase !== 'spinning') return;

    const steps = [
      { text: 'VALIDATING KEY', delay: 0 },
      { text: 'ESTABLISHING LINK', delay: 600 },
      { text: 'CONFIGURING VOICE PIPELINE', delay: 1200 },
      { text: 'FINALIZING', delay: 1800 },
    ];

    const timers = steps.map(step =>
      setTimeout(() => setStatusText(step.text), step.delay)
    );

    const activateTimer = setTimeout(() => {
      setPhase('activated');
      setStatusText('ACTIVATED');
      chime();
    }, 2400);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(activateTimer);
    };
  }, [phase]);

  // After activated, save and close
  useEffect(() => {
    if (phase !== 'activated') return;

    const timer = setTimeout(() => {
      setPhase('done');
      onSave(savedKeyRef.current);
      setKeyInput('');
      setError('');
      setTimeout(() => {
        setPhase('idle');
        setStatusText('');
        onActivated?.();
      }, 100);
    }, 1600);

    return () => clearTimeout(timer);
  }, [phase, onSave, onActivated]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== 'idle') return;
    if (!keyInput.trim()) {
      setError('API Key cannot be empty');
      return;
    }
    if (!keyInput.startsWith('AIza')) {
      setError('Invalid API Key format (usually starts with AIza)');
      return;
    }
    savedKeyRef.current = keyInput;
    setError('');
    setPhase('spinning');
  };

  const isActivating = phase === 'spinning' || phase === 'activated';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="h-10 bg-black border-b border-neutral-800 flex items-center justify-between px-4 select-none">
            <div className="flex items-center gap-2 text-emerald-500">
                <Key size={14} />
                <span className="text-xs font-bold tracking-widest uppercase">API Key Setup</span>
            </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isActivating ? (
            <>
              <p className="text-neutral-300 text-sm mb-4 leading-relaxed">
                  <strong className="text-white">Activation Required.</strong><br/>
                  Voice mode connects directly from your browser to the Gemini API using your own key. No data passes through any intermediary server &mdash; HUD is a static site hosted on GitHub Pages.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Your Gemini API Key</label>
                      <div className="relative">
                          <input
                              type="password"
                              value={keyInput}
                              onChange={(e) => { setKeyInput(e.target.value); setError(''); }}
                              placeholder="AIza..."
                              className="w-full bg-black border border-neutral-700 text-emerald-500 text-sm px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-neutral-800 font-mono"
                              autoFocus
                          />
                          {keyInput && !error && (
                              <div className="absolute right-3 top-2.5 text-emerald-500">
                                  <Check size={14} />
                              </div>
                          )}
                      </div>
                      {error && (
                          <div className="flex items-center gap-2 text-red-500 text-xs mt-1 animate-pulse">
                              <AlertCircle size={12} />
                              <span>{error}</span>
                          </div>
                      )}
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                      <button
                          type="submit"
                          className="bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-500 border border-emerald-900/50 px-4 py-2 text-xs font-bold tracking-wider transition-all flex items-center gap-2"
                      >
                          <Check size={14} />
                          ACTIVATE
                      </button>
                  </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              {phase === 'spinning' && (
                <>
                  <div className="text-4xl text-emerald-500 font-mono animate-pulse">
                    {BRAILLE_FRAMES[brailleIndex]}
                  </div>
                  <div className="text-[10px] text-neutral-400 tracking-widest font-bold font-mono">
                    {statusText}
                  </div>
                </>
              )}
              {phase === 'activated' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center animate-in zoom-in-50 duration-300">
                    <Check size={24} className="text-emerald-400" />
                  </div>
                  <div className="text-sm text-emerald-400 tracking-widest font-bold font-mono animate-in fade-in duration-500">
                    ACTIVATED
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono animate-in fade-in duration-700 delay-300">
                    Voice uplink ready
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-black/50 p-3 border-t border-neutral-800">
            <p className="text-[10px] text-neutral-600 text-center leading-relaxed">
                Your key is stored only in your browser's local storage. HUD has no backend &mdash; all API calls go directly from your machine to Google. Your key and traffic never touch our servers.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
