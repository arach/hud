import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { Mic, Activity, ChevronRight, CornerDownLeft, Hash } from 'lucide-react';

interface Transcript {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    isFinal: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isConnected: boolean;
  transcripts: Transcript[];
  isActive?: boolean;
  activeScope?: string; // New prop
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  isConnected,
  transcripts,
  isActive,
  activeScope = 'GLOBAL'
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, transcripts, input, isActive]);

  // Focus input when terminal becomes active
  useEffect(() => {
    if (isActive) {
        // Small delay to allow CSS transitions to settle
        const timeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }
  }, [isActive, isLoading]);

  const handleContainerClick = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0) {
        inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Add to local history
    setHistory(prev => [...prev, input]);
    setHistoryPointer(null);
    
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        const newPointer = historyPointer === null ? history.length - 1 : Math.max(0, historyPointer - 1);
        setHistoryPointer(newPointer);
        setInput(history[newPointer]);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyPointer === null) return;
        const newPointer = historyPointer + 1;
        if (newPointer >= history.length) {
            setHistoryPointer(null);
            setInput('');
        } else {
            setHistoryPointer(newPointer);
            setInput(history[newPointer]);
        }
    }
  };

  return (
    <div 
        className="flex flex-col h-full font-mono text-[11px] md:text-[12px] font-normal cursor-text bg-transparent"
        onClick={handleContainerClick}
    >
      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4" ref={scrollRef}>
        
        {/* Welcome Message */}
        <div className="text-neutral-500 select-none pb-4 border-b border-neutral-800/50 mb-4">
            <p>HUD OS [Version 2.0.4]</p>
            <p className="opacity-50">(c) 2026 HUD Systems. All rights reserved.</p>
            <p className="text-emerald-500/80 mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                System initialized. Uplink established.
            </p>
        </div>

        {/* Message History */}
        {messages.map((msg) => (
          <div key={msg.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
            {msg.role === 'user' ? (
              // User Command Block
              <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-r-lg rounded-bl-lg p-3 max-w-[90%] md:max-w-[70%] mb-2">
                <span className="text-emerald-400 font-bold select-none mt-0.5">$</span>
                <span className="text-white whitespace-pre-wrap font-normal">{msg.content}</span>
              </div>
            ) : (
              // System Response Block
              <div className="flex gap-3 pl-2 relative max-w-full">
                {/* Decoration Line */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors rounded-full"></div>
                <div className="text-emerald-100/80 leading-relaxed whitespace-pre-wrap flex-1 pl-2 py-1">
                    {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Live Transcripts (Voice) */}
        {isConnected && transcripts.map((t, idx) => (
           <div
            key={`transcription-${idx}`}
            className="pl-4 ml-1 opacity-80"
          >
            <div className="flex items-center gap-2 text-[10px] text-emerald-600 uppercase mb-0.5 select-none">
                 {t.role === 'user' ? <Mic size={10} /> : <Activity size={10} />}
                 {t.role === 'user' ? 'AUDIO_IN' : 'AUDIO_OUT'} 
                 {!t.isFinal && <span className="animate-pulse">_</span>}
            </div>
            <div className={`text-[11px] md:text-[12px] italic ${t.role === 'user' ? 'text-white/70' : 'text-emerald-400/70'}`}>
                 "{t.text}"
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 pl-4 animate-pulse">
             <span className="text-emerald-500">Processing...</span>
          </div>
        )}
      </div>

      {/* Input Area (Fixed at bottom) */}
      <div className="p-3 bg-black/40 backdrop-blur-md border-t border-neutral-800/50 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-3 items-center relative">
          
          {/* Active Scope Pill */}
          <div className="px-2 py-0.5 bg-neutral-800 rounded text-[9px] font-bold text-neutral-400 uppercase select-none flex items-center gap-1 shrink-0">
              <Hash size={8} /> {activeScope}
          </div>

          <div className="text-emerald-500 font-bold select-none shrink-0 pl-1">
             {isConnected ? (
                 <span className="animate-pulse flex items-center gap-2 text-[10px] uppercase tracking-widest"><Mic size={12} /> Voice Active</span>
             ) : (
                 <ChevronRight size={16} />
             )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isConnected} 
            placeholder={isConnected ? `Listening for ${activeScope.toLowerCase()} commands...` : `Enter command for ${activeScope}...`}
            className="flex-1 bg-transparent border-none text-white p-0 focus:ring-0 focus:outline-none placeholder-neutral-600 h-6"
            autoComplete="off"
            spellCheck={false}
          />
          {!isConnected && input.length > 0 && (
              <button type="submit" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                  <CornerDownLeft size={16} />
              </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
