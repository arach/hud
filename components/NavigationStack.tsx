import React from 'react';
import { Globe, Search, X } from 'lucide-react';
import { ContextDef } from './ContextBar';

interface NavigationStackProps {
  contexts: ContextDef[];
  activeContextId: string;
  onContextSelect: (context: ContextDef) => void;
  onResetToGlobal: () => void;
  namespaceQuery: string;
  onNamespaceQueryChange: (value: string) => void;
}

const NavigationStack: React.FC<NavigationStackProps> = ({
  contexts,
  activeContextId,
  onContextSelect,
  onResetToGlobal,
  namespaceQuery,
  onNamespaceQueryChange
}) => {
  const specificContexts = contexts.filter(c => c.id !== 'global');
  const isFiltered = namespaceQuery && namespaceQuery !== '**';

  return (
    <div
      data-hud-panel="navigation-stack"
      className="fixed top-0 left-0 right-0 z-50 pointer-events-auto"
    >
      {/* Edge-to-edge navigation bar */}
      <div className="h-12 bg-black/90 backdrop-blur-xl border-b border-neutral-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex items-center px-4">
        {/* Top highlight line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* LEFT: Home/Globe - Reset to Global */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onResetToGlobal}
            className={`
              flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
              ${activeContextId === 'global'
                ? 'bg-white/10 text-white'
                : 'text-neutral-500 hover:text-white hover:bg-white/5'}
            `}
            title="Reset to Global View"
          >
            <Globe size={18} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-neutral-800 mx-4" />

        {/* CENTER: Context Tabs */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {specificContexts.map((ctx) => {
              const isActive = activeContextId === ctx.id;
              return (
                <button
                  key={ctx.id}
                  onClick={() => onContextSelect(ctx)}
                  className={`
                    relative flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-all duration-200 shrink-0
                    ${isActive
                      ? 'text-black shadow-lg'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'}
                  `}
                  style={{
                    backgroundColor: isActive ? ctx.color : 'transparent',
                    boxShadow: isActive ? `0 0 12px ${ctx.color}50` : 'none'
                  }}
                >
                  <span className={isActive ? 'opacity-80' : 'opacity-60'}>
                    {ctx.icon}
                  </span>
                  <span>{ctx.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Scope Filter - aligned with Inspector panel */}
        <div className="flex items-center gap-3 shrink-0 pr-[268px]">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase whitespace-nowrap">Scope Filter</span>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={namespaceQuery}
                onChange={(e) => onNamespaceQueryChange(e.target.value)}
                placeholder="**"
                className={`
                  w-[200px] h-8 pl-8 pr-8 bg-white/5 border rounded-lg text-[11px] font-mono
                  placeholder:text-neutral-600 text-neutral-300
                  focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/10
                  transition-all duration-200
                  ${isFiltered ? 'border-emerald-700/50 bg-emerald-950/20' : 'border-neutral-700/50'}
                `}
              />
              {isFiltered && (
                <button
                  onClick={() => onNamespaceQueryChange('**')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationStack;
