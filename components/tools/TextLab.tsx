import React, { useMemo, useEffect, useRef } from 'react';
import { FileCode, Mail, Check, X } from 'lucide-react';
import SimpleDiff from './SimpleDiff';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/themes/prism-tomorrow.css';

export interface TextSource {
  id: string;
  type: 'code' | 'email';
  label: string;
  content: string;
  pendingContent?: string;
}

interface TextLabProps {
  sources: TextSource[];
  activeSourceId: string;
  onSourceChange: (id: string) => void;
  onAcceptChange: (id: string) => void;
  onRejectChange: (id: string) => void;
  onContentUpdate: (id: string, content: string) => void;
}

// Syntax highlighted code display
const HighlightedCode: React.FC<{ code: string; language?: string }> = ({ code, language = 'javascript' }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const lines = code.split('\n');

  return (
    <div className="relative">
      {/* Line numbers */}
      <div className="absolute left-0 top-0 select-none text-neutral-600 text-right pr-3 border-r border-neutral-800">
        {lines.map((_, i) => (
          <div key={i} className="leading-relaxed">{i + 1}</div>
        ))}
      </div>
      {/* Code content */}
      <pre className="pl-12 overflow-x-auto">
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};

const TextLab: React.FC<TextLabProps> = ({
  sources,
  activeSourceId,
  onSourceChange,
  onAcceptChange,
  onRejectChange,
  onContentUpdate
}) => {
  const activeSource = useMemo(() =>
    sources.find(s => s.id === activeSourceId) || sources[0],
    [sources, activeSourceId]
  );

  const hasPendingChange = !!activeSource?.pendingContent;

  // Calculate simple stats
  const stats = useMemo(() => {
    if (!activeSource?.content || !activeSource?.pendingContent) return null;
    const oldLines = activeSource.content.split('\n').length;
    const newLines = activeSource.pendingContent.split('\n').length;
    return {
      added: Math.max(0, newLines - oldLines),
      removed: Math.max(0, oldLines - newLines),
      changed: Math.abs(newLines - oldLines) === 0 ? 'modified' : null
    };
  }, [activeSource?.content, activeSource?.pendingContent]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Tab Bar */}
      <div className="shrink-0 h-8 bg-neutral-900 border-b border-neutral-800 flex items-center px-2 gap-1">
        {sources.map(source => (
          <button
            key={source.id}
            onClick={() => onSourceChange(source.id)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium transition-colors
              ${activeSourceId === source.id
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'}
            `}
          >
            {source.type === 'code' ? <FileCode size={12} /> : <Mail size={12} />}
            {source.label}
            {source.pendingContent && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        ))}

        <div className="flex-1" />

        {/* Diff Stats */}
        {stats && hasPendingChange && (
          <div className="flex items-center gap-2 text-[9px] font-mono mr-2">
            {stats.added > 0 && <span className="text-emerald-500">+{stats.added}</span>}
            {stats.removed > 0 && <span className="text-red-500">-{stats.removed}</span>}
            {stats.changed && <span className="text-amber-500">~</span>}
          </div>
        )}

        {/* Accept/Reject buttons */}
        {hasPendingChange && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAcceptChange(activeSourceId)}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold transition-colors"
              title="Accept changes"
            >
              <Check size={10} />
              ACCEPT
            </button>
            <button
              onClick={() => onRejectChange(activeSourceId)}
              className="flex items-center gap-1 px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-[9px] font-bold transition-colors"
              title="Reject changes"
            >
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {hasPendingChange && activeSource ? (
          // Diff View
          <div className="h-full flex flex-col">
            <div className="shrink-0 px-3 py-2 bg-amber-900/20 border-b border-amber-800/30 text-amber-400 text-[10px]">
              Proposed changes — review and accept or reject
            </div>
            <div className="flex-1 overflow-auto">
              <SimpleDiff
                oldContent={activeSource.content}
                newContent={activeSource.pendingContent || ''}
                oldLabel={activeSource.label}
                newLabel={`${activeSource.label} (modified)`}
              />
            </div>
          </div>
        ) : (
          // Normal View with syntax highlighting
          <div className="p-3 font-mono text-[11px] leading-relaxed">
            {activeSource?.type === 'code' ? (
              <HighlightedCode
                code={activeSource?.content || ''}
                language="javascript"
              />
            ) : (
              <div className="text-neutral-300 whitespace-pre-wrap">
                {activeSource?.content}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="shrink-0 h-6 bg-neutral-900/50 border-t border-neutral-800 flex items-center px-3 text-[9px] text-neutral-500">
        <span className="uppercase">{activeSource?.type}</span>
        <span className="mx-2">•</span>
        <span>{activeSource?.content.split('\n').length} lines</span>
        {hasPendingChange && (
          <>
            <span className="mx-2">•</span>
            <span className="text-amber-500">PENDING CHANGES</span>
          </>
        )}
      </div>
    </div>
  );
};

export default TextLab;
