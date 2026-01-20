import React, { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';

export interface ContextDef {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  icon: React.ReactNode;
}

interface ContextBarProps {
  contexts: ContextDef[];
  activeContextId: string;
  onSelect: (context: ContextDef) => void;
  namespaceQuery: string;
  onNamespaceQueryChange: (value: string) => void;
  logsOpen?: boolean;
  onToggleLogs?: () => void;
}

const ContextBar: React.FC<ContextBarProps> = ({ contexts, activeContextId, onSelect, namespaceQuery, onNamespaceQueryChange, logsOpen = false, onToggleLogs }) => {
  const [draftQuery, setDraftQuery] = useState(namespaceQuery);
  const draftQueryRef = useRef(namespaceQuery);

  useEffect(() => {
    setDraftQuery(namespaceQuery);
    draftQueryRef.current = namespaceQuery;
  }, [namespaceQuery]);

  const buildContextQuery = (contextId: string) => {
    return contextId === 'global' ? 'hud.**' : `hud.${contextId}.**`;
  };

  const handleContextClick = (ctx: ContextDef) => {
    if (ctx.id === activeContextId) {
      const globalContext = contexts.find(c => c.id === 'global');
      if (!globalContext) return;
      const nextQuery = buildContextQuery('global');
      draftQueryRef.current = nextQuery;
      setDraftQuery(nextQuery);
      onNamespaceQueryChange(nextQuery);
      onSelect(globalContext);
      return;
    }

    const nextQuery = buildContextQuery(ctx.id);
    draftQueryRef.current = nextQuery;
    setDraftQuery(nextQuery);
    onNamespaceQueryChange(nextQuery);
    onSelect(ctx);
  };
  
  // Separate Global from specific scopes
  const specificContexts = contexts.filter(c => c.id !== 'global');

  return (
    <div data-hud-panel="context-bar" className="fixed top-4 left-4 right-4 z-50 pointer-events-auto">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 w-full">
        {/* Logs Anchor */}
        <div className="flex items-center">
          <button
            onClick={onToggleLogs}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold tracking-wide transition-all duration-300 shadow-xl border backdrop-blur-md shrink-0 whitespace-nowrap
              ${logsOpen 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
                  : 'bg-black/40 text-neutral-400 border-neutral-800 hover:bg-black/60 hover:text-white'}
            `}
            title="Toggle log stream"
          >
            <Activity size={14} className={logsOpen ? 'text-emerald-400' : 'text-neutral-500'} />
            <span>LOGS</span>
          </button>
        </div>

        {/* Specific Scopes Pill */}
        <div className="flex justify-center">
          <div className="flex flex-nowrap bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-2xl gap-1 transition-colors duration-300 hover:bg-neutral-900/80">
            {specificContexts.map((ctx) => {
              const isActive = activeContextId === ctx.id;
              return (
                <button
                  key={ctx.id}
                  onClick={() => handleContextClick(ctx)}
                  className={`
                    relative flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-300 shrink-0 whitespace-nowrap
                    ${isActive ? 'text-black shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}
                  `}
                  style={{
                    backgroundColor: isActive ? ctx.color : 'transparent',
                    boxShadow: isActive ? `0 0 15px ${ctx.color}60` : 'none'
                  }}
                >
                  <span className={isActive ? 'opacity-90' : 'opacity-60'}>
                    {ctx.icon}
                  </span>
                  <span className="whitespace-nowrap">{ctx.label}</span>

                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-white/20 blur-[4px] -z-10"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Namespace Query */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-neutral-800 rounded-full px-3 py-1.5 shadow-xl">
            <span className="text-[9px] font-bold tracking-widest text-neutral-500">SCOPE</span>
            <input
              value={draftQuery}
              onChange={(e) => {
                draftQueryRef.current = e.target.value;
                setDraftQuery(e.target.value);
              }}
              onBlur={() => onNamespaceQueryChange(draftQueryRef.current)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="bg-transparent text-neutral-200 font-mono text-[11px] w-[220px] focus:outline-none placeholder:text-neutral-600"
              placeholder="hud.**"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextBar;
