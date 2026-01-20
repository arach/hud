import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Eye, Edit3, Code2, Link, List } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';

const DocsEditor: React.FC = () => {
  const [content, setContent] = useState(`# HUD Workspace

A **futuristic** coding agent HUD.

## Features
- Infinite Canvas
- AI Integration
- Visual Tools

## Getting Started
1. Initialize core
2. Connect neural link
3. Begin development

## Code Example
\`\`\`javascript
const agent = new HudAgent();
agent.init();
\`\`\`
`);

  const [activeTab, setActiveTab] = useState<'edit'|'preview'>('edit');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const isScrollingRef = useRef(false);

  // Initial highlight
  useEffect(() => {
    if (highlightRef.current) {
        Prism.highlightElement(highlightRef.current.querySelector('code')!);
    }
  }, []);

  // Sync Scroll Handler
  const handleScroll = (source: 'editor' | 'preview') => {
    if (isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    
    const editor = editorRef.current;
    const preview = previewRef.current;
    
    if (editor && preview) {
        if (source === 'editor') {
            const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
            preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
            // Also sync highlight layer
            if (highlightRef.current) {
                highlightRef.current.scrollTop = editor.scrollTop;
            }
        } else {
            const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
            const editorScrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
            editor.scrollTop = editorScrollTop;
            if (highlightRef.current) {
                highlightRef.current.scrollTop = editorScrollTop;
            }
        }
    }

    setTimeout(() => {
        isScrollingRef.current = false;
    }, 50);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Re-highlight on content change
  useEffect(() => {
    if (highlightRef.current) {
       // We manually update the code content and highlight
       const code = highlightRef.current.querySelector('code');
       if (code) {
           code.textContent = content;
           Prism.highlightElement(code);
       }
    }
  }, [content]);

  // Primitive Markdown Renderer for Preview
  const renderMarkdown = (text: string) => {
      // Very basic renderer for demonstration
      const lines = text.split('\n');
      return lines.map((line, i) => {
          if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-2 text-white border-b border-neutral-700 pb-1">{line.replace('## ', '')}</h2>;
          if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mb-4 text-emerald-400">{line.replace('# ', '')}</h1>;
          if (line.startsWith('- ')) return <li key={i} className="ml-4 text-neutral-300 list-disc">{line.replace('- ', '')}</li>;
          if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 text-neutral-300 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
          if (line.startsWith('```')) return <div key={i} className="my-2 bg-neutral-900 p-2 rounded border border-neutral-800 font-mono text-xs opacity-70">Code Block</div>;
          if (line.trim() === '') return <br key={i} />;
          return <p key={i} className="mb-2 text-neutral-400">{line}</p>;
      });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
        {/* Toolbar */}
        <div className="h-9 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2 text-neutral-400">
                <BookOpen size={14} className="text-emerald-500" />
                <span className="text-xs font-bold">README.md</span>
                <span className="text-[10px] text-neutral-600 ml-2">EDITING</span>
            </div>
            <div className="flex gap-2">
                 <button className="flex items-center gap-1 text-[10px] bg-neutral-800 px-2 py-1 rounded text-neutral-300 hover:text-white">
                    <Link size={10} /> Link
                 </button>
                 <button className="flex items-center gap-1 text-[10px] bg-neutral-800 px-2 py-1 rounded text-neutral-300 hover:text-white">
                    <List size={10} /> List
                 </button>
                 <button className="flex items-center gap-1 text-[10px] bg-neutral-800 px-2 py-1 rounded text-neutral-300 hover:text-white">
                    <Code2 size={10} /> Code
                 </button>
            </div>
        </div>

        <div className="flex-1 flex min-h-0 relative">
            {/* Editor Pane (Left) */}
            <div className="w-1/2 border-r border-neutral-800 relative bg-[#0c0c0c]">
                <div className="absolute top-0 right-0 z-20 px-2 py-1 bg-black/50 text-[9px] text-neutral-500 uppercase font-bold tracking-wider rounded-bl">Markdown Input</div>
                
                {/* Overlay Container */}
                <div className="editor-container w-full h-full relative">
                    {/* Syntax Highlight Layer (Underlay) */}
                    <pre 
                        ref={highlightRef}
                        className="editor-layer editor-highlight language-markdown"
                        aria-hidden="true"
                    >
                        <code>{content}</code>
                    </pre>

                    {/* Actual Textarea (Overlay) */}
                    <textarea 
                        ref={editorRef}
                        value={content}
                        onChange={handleInput}
                        onScroll={() => handleScroll('editor')}
                        className="editor-layer editor-textarea"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* Preview Pane (Right) */}
            <div 
                ref={previewRef}
                onScroll={() => handleScroll('preview')}
                className="w-1/2 p-4 prose prose-invert prose-xs overflow-y-auto bg-black"
            >
                 <div className="absolute top-0 right-0 z-20 px-2 py-1 bg-black/50 text-[9px] text-neutral-500 uppercase font-bold tracking-wider rounded-bl">Preview</div>
                {renderMarkdown(content)}
            </div>
        </div>
        
        {/* Footer */}
        <div className="h-6 bg-[#080808] border-t border-neutral-800 flex items-center px-3 text-[10px] text-neutral-500 gap-4">
             <span>Ln {content.split('\n').length}, Col {content.length}</span>
             <span>UTF-8</span>
             <span className="ml-auto flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced</span>
        </div>
    </div>
  );
};

export default DocsEditor;