import React, { useState } from 'react';
import { Key, Check, AlertCircle, X } from 'lucide-react';

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
        setError('API Key cannot be empty');
        return;
    }
    if (!keyInput.startsWith('AIza')) {
        setError('Invalid API Key format (usually starts with AIza)');
        return;
    }
    onSave(keyInput);
    setKeyInput('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="h-10 bg-black border-b border-neutral-800 flex items-center justify-between px-4 select-none">
            <div className="flex items-center gap-2 text-emerald-500">
                <Key size={14} />
                <span className="text-xs font-bold tracking-widest uppercase">Security Clearance</span>
            </div>
        </div>

        {/* Content */}
        <div className="p-6">
            <p className="text-neutral-300 text-sm mb-4 leading-relaxed">
                <strong className="text-white">Authentication Required.</strong><br/>
                Please provide a valid Gemini API Key to establish a secure uplink with the HUD Core.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">API Access Token</label>
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
                        AUTHENTICATE
                    </button>
                </div>
            </form>
        </div>
        
        {/* Footer */}
        <div className="bg-black/50 p-3 border-t border-neutral-800">
            <p className="text-[10px] text-neutral-600 text-center">
                Keys are stored locally in your browser's encrypted storage.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
