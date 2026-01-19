import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  isOpen: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, isOpen }) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setError('API Key is required to initialize Nexus uplink.');
      return;
    }
    if (!keyInput.startsWith('AIza')) {
      setError('Invalid key format. Should start with "AIza".');
      return;
    }
    onSave(keyInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[500px] bg-neutral-900 border border-neutral-700 shadow-2xl rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 bg-black border-b border-neutral-800 flex items-center px-4 gap-3">
          <ShieldCheck size={18} className="text-emerald-500" />
          <span className="text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
            Security Clearance Required
          </span>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="shrink-0 p-3 bg-neutral-800 rounded-lg h-fit">
              <Key size={24} className="text-neutral-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-neutral-200 font-medium">Enter Gemini API Key</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                This workspace requires a connection to the Google Gemini API. 
                Your key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
          </div>

          <div className="mt-2">
            <div className="relative">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setError('');
                }}
                placeholder="Paste your API Key here..."
                className="w-full bg-black border border-neutral-700 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-700 font-mono"
              />
            </div>
            {error && (
              <div className="mt-2 flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={12} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Get Key &rarr;
            </a>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Initialize Uplink
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;
