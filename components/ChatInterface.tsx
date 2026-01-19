import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { ArrowRight, Mic, Activity } from 'lucide-react';

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
  // Voice Props
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
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 select-text custom-scrollbar" ref={scrollRef}>
        
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
            
            <div className={`max-w-[85%] text-xs leading-relaxed p-3 border rounded-sm
                  ${msg.role === 'user' 
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-200' 
                    : 'bg-black border-neutral-800 text-neutral-300'
                  }`}>
                 {msg.content}
            </div>
          </div>
        ))}
        
        {/* Live Transcripts (Voice) */}
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
            
            <div className={`max-w-[85%] text-xs leading-relaxed p-3 border border-dashed rounded-sm
                  ${t.role === 'user' 
                    ? 'bg-emerald-950/20 border-emerald-900 text-emerald-100' 
                    : 'bg-emerald-950/10 border-emerald-900 text-emerald-200'
                  }`}>
                 {t.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="text-[10px] text-emerald-500 animate-pulse font-bold select-none pl-2">
             >> PROCESSING...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-800 bg-neutral-950 p-2">
        <form onSubmit={handleSubmit} className="flex bg-black border border-neutral-800 items-center rounded-sm focus-within:border-neutral-600 transition-colors">
          <div className="px-3 py-2 text-neutral-500 text-xs select-none font-mono">root@nexus:~#</div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isConnected} 
            placeholder={isConnected ? "Voice Link Active - Listening..." : "Enter command..."}
            className="flex-1 bg-transparent border-none text-neutral-200 px-2 py-2 focus:ring-0 focus:outline-none text-xs disabled:opacity-50 font-mono"
            autoFocus
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={isLoading || isConnected}
            className="px-4 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;