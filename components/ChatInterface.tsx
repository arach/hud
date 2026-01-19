import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { ArrowRight, Terminal, Mic, MicOff, Activity, Link2 } from 'lucide-react';
import { useLiveSession } from '../hooks/useLiveSession';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeContext?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, activeContext = 'GLOBAL' }) => {
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Voice Mode Hook
  const { connect, disconnect, isConnected, isTalking, volume, transcripts } = useLiveSession();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, transcripts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const toggleVoiceMode = () => {
    if (isConnected) {
        disconnect();
    } else {
        connect();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black border border-neutral-700 shadow-2xl pointer-events-auto">
      {/* Window Header */}
      <div className="h-8 bg-neutral-900 border-b border-neutral-700 flex items-center justify-between px-3 select-none">
        <div className="flex items-center gap-2">
            <Terminal size={12} className="text-neutral-400" />
            <span className="text-xs font-bold tracking-widest text-neutral-400">TERMINAL_UPLINK</span>
        </div>
        
        {/* Context Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-950 rounded border border-neutral-800">
             <Link2 size={10} className="text-neutral-500" />
             <span className="text-[9px] font-mono text-neutral-400">CTX:</span>
             <span className="text-[9px] font-bold text-emerald-500 uppercase">{activeContext}</span>
        </div>
        
        <div className="flex items-center gap-2">
            {isConnected && (
                <div className="flex items-center gap-1 mr-2">
                    <div className="flex gap-0.5 items-end h-3">
                         <div className="w-1 bg-emerald-500 animate-pulse" style={{ height: `${Math.min(100, Math.max(20, volume * 2))}%` }}></div>
                         <div className="w-1 bg-emerald-500 animate-pulse delay-75" style={{ height: `${Math.min(100, Math.max(20, volume * 1.5))}%` }}></div>
                         <div className="w-1 bg-emerald-500 animate-pulse delay-150" style={{ height: `${Math.min(100, Math.max(20, volume * 2.5))}%` }}></div>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wide">LIVE_LINK ACTIVE</span>
                </div>
            )}
            <button 
                onClick={toggleVoiceMode}
                className={`p-1 rounded transition-colors ${isConnected ? 'bg-red-500/20 text-red-500 hover:bg-red-500/40' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                title={isConnected ? "Disconnect Voice Link" : "Initialize Voice Link"}
            >
                {isConnected ? <MicOff size={12} /> : <Mic size={12} />}
            </button>
            <div className="w-2 h-2 bg-emerald-500/50"></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 select-text" ref={scrollRef}>
        {/* Standard Text History */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <span className="text-[10px] text-neutral-600 uppercase mb-1 select-none">
                 {msg.role === 'user' ? '>> OPR' : '>> SYS'} 
                 <span className="mx-1 text-neutral-800">::</span> 
                 {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
            </span>
            
            <div className={`max-w-[85%] text-xs leading-relaxed p-3 border
                  ${msg.role === 'user' 
                    ? 'bg-neutral-900 border-neutral-700 text-neutral-200' 
                    : 'bg-black border-neutral-800 text-neutral-300'
                  }`}>
                 {msg.content}
            </div>
          </div>
        ))}
        
        {/* Live Transcripts */}
        {isConnected && transcripts.map((t, idx) => (
           <div
            key={`transcription-${idx}`}
            className={`flex flex-col gap-1 ${t.role === 'user' ? 'items-end' : 'items-start'} opacity-90`}
          >
            <span className="text-[10px] text-emerald-700 uppercase mb-1 flex items-center gap-1 select-none">
                 {t.role === 'user' ? <Mic size={8} /> : <Activity size={8} />}
                 {t.role === 'user' ? 'VOICE_IN' : 'VOICE_OUT'} 
                 {!t.isFinal && <span className="animate-pulse">...</span>}
            </span>
            
            <div className={`max-w-[85%] text-xs leading-relaxed p-3 border border-dashed
                  ${t.role === 'user' 
                    ? 'bg-emerald-950/20 border-emerald-900 text-emerald-100' 
                    : 'bg-emerald-950/10 border-emerald-900 text-emerald-200'
                  }`}>
                 {t.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="text-[10px] text-emerald-500 animate-pulse font-bold select-none">
             >> PROCESSING STREAM...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-neutral-700 bg-black p-2">
        <form onSubmit={handleSubmit} className="flex bg-neutral-900 border border-neutral-800 items-center">
          <div className="px-3 py-2 text-neutral-500 text-xs select-none">root@nexus:~#</div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isConnected} 
            placeholder={isConnected ? "Voice Mode Active - Listening..." : ""}
            className="flex-1 bg-transparent border-none text-neutral-200 px-2 py-2 focus:ring-0 focus:outline-none text-xs disabled:opacity-50"
            autoFocus
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={isLoading || isConnected}
            className="px-4 text-neutral-400 hover:text-white disabled:opacity-30"
          >
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;