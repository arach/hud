import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { Mic, Activity, Terminal } from 'lucide-react';

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
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  isConnected,
  transcripts
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
  }, [messages, isLoading, transcripts, input]);

  // Focus input on mount and interaction
  useEffect(() => {
    const timeout = setTimeout(() => {
        inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const handleContainerClick = () => {
    // Prevent focus stealing if selecting text
    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0) {
        inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Add to history
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
        className="flex flex-col h-full bg-black font-mono text-xs md:text-sm cursor-text"
        onClick={handleContainerClick}
    >
      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" ref={scrollRef}>
        
        {/* Welcome Message */}
        <div className="mb-6 text-neutral-500 select-none">
            <p>Nexus OS [Version 2.0.4]</p>
            <p>(c) 2026 Nexus Corp. All rights reserved.</p>
            <br />
            <p className="text-emerald-500/80">System initialized. Uplink established.</p>
        </div>

        {/* Message History */}
        {messages.map((msg) => (
          <div key={msg.id} className="mb-4 group">
            {msg.role === 'user' ? (
              <div className="flex gap-3">
                <span className="text-emerald-500 font-bold select-none shrink-0">root@nexus:~$</span>
                <span className="text-neutral-100 whitespace-pre-wrap">{msg.content}</span>
              </div>
            ) : (
              <div className="flex gap-3 pl-0 relative">
                {/* Decoration Line */}
                <div className="absolute left-[3px] top-0 bottom-0 w-px bg-neutral-800 group-hover:bg-neutral-700 transition-colors"></div>
                <span className="text-neutral-500 select-none shrink-0 pl-4">{'>'}</span>
                <div className="text-neutral-300 leading-relaxed whitespace-pre-wrap flex-1">
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
            className="mb-2 pl-4 border-l-2 border-emerald-900/30 ml-1 opacity-80"
          >
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 uppercase mb-0.5 select-none">
                 {t.role === 'user' ? <Mic size={10} /> : <Activity size={10} />}
                 {t.role === 'user' ? 'AUDIO_IN' : 'AUDIO_OUT'} 
                 {!t.isFinal && <span className="animate-pulse">_</span>}
            </div>
            <div className="text-emerald-100/70 italic">
                 "{t.text}"
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 pl-0 animate-pulse">
             <span className="text-neutral-500 select-none shrink-0 pl-4">{'>'}</span>
             <span className="text-emerald-500">_</span>
          </div>
        )}
      </div>

      {/* Input Area (Fixed at bottom) */}
      <div className="p-4 pt-0 bg-black shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
          <div className="text-emerald-500 font-bold select-none shrink-0">
             {isConnected ? (
                 <span className="animate-pulse flex items-center gap-1"><Mic size={12} /> LISTENING</span>
             ) : (
                 'root@nexus:~$'
             )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isConnected} 
            className="flex-1 bg-transparent border-none text-neutral-100 p-0 focus:ring-0 focus:outline-none placeholder-neutral-700"
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;