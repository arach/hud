import React, { useMemo } from 'react';
import { diffLines, Change } from 'diff';

interface SimpleDiffProps {
  oldContent: string;
  newContent: string;
  oldLabel?: string;
  newLabel?: string;
}

const SimpleDiff: React.FC<SimpleDiffProps> = ({
  oldContent,
  newContent,
  oldLabel = 'original',
  newLabel = 'modified'
}) => {
  const changes = useMemo(() => {
    return diffLines(oldContent, newContent);
  }, [oldContent, newContent]);

  // Calculate line numbers
  const lines = useMemo(() => {
    let oldLine = 1;
    let newLine = 1;
    const result: Array<{
      type: 'added' | 'removed' | 'unchanged';
      content: string;
      oldLineNum: number | null;
      newLineNum: number | null;
    }> = [];

    changes.forEach((change: Change) => {
      const lineContents = change.value.split('\n');
      // Remove last empty string from split if ends with newline
      if (lineContents[lineContents.length - 1] === '') {
        lineContents.pop();
      }

      lineContents.forEach((line) => {
        if (change.added) {
          result.push({
            type: 'added',
            content: line,
            oldLineNum: null,
            newLineNum: newLine++
          });
        } else if (change.removed) {
          result.push({
            type: 'removed',
            content: line,
            oldLineNum: oldLine++,
            newLineNum: null
          });
        } else {
          result.push({
            type: 'unchanged',
            content: line,
            oldLineNum: oldLine++,
            newLineNum: newLine++
          });
        }
      });
    });

    return result;
  }, [changes]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    lines.forEach(l => {
      if (l.type === 'added') added++;
      if (l.type === 'removed') removed++;
    });
    return { added, removed };
  }, [lines]);

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-[11px] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-3">
          <span className="text-neutral-400">{oldLabel}</span>
          <span className="text-neutral-600">→</span>
          <span className="text-neutral-300">{newLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          {stats.added > 0 && (
            <span className="text-emerald-400">+{stats.added}</span>
          )}
          {stats.removed > 0 && (
            <span className="text-red-400">-{stats.removed}</span>
          )}
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr
                key={idx}
                className={`
                  ${line.type === 'added' ? 'bg-emerald-500/10' : ''}
                  ${line.type === 'removed' ? 'bg-red-500/10' : ''}
                  hover:bg-white/5
                `}
              >
                {/* Old line number */}
                <td className="w-12 text-right pr-2 text-neutral-600 select-none border-r border-[#30363d]/50">
                  {line.oldLineNum || ''}
                </td>
                {/* New line number */}
                <td className="w-12 text-right pr-2 text-neutral-600 select-none border-r border-[#30363d]/50">
                  {line.newLineNum || ''}
                </td>
                {/* Change indicator */}
                <td className={`w-6 text-center select-none ${
                  line.type === 'added' ? 'text-emerald-400' :
                  line.type === 'removed' ? 'text-red-400' : 'text-neutral-700'
                }`}>
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </td>
                {/* Content */}
                <td className={`pl-2 whitespace-pre ${
                  line.type === 'added' ? 'text-emerald-300' :
                  line.type === 'removed' ? 'text-red-300' : 'text-neutral-300'
                }`}>
                  {line.content || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimpleDiff;
