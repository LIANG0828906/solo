import { useState, useMemo, useCallback } from 'react';
import DiffMatchPatch from 'diff-match-patch';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  oldLabel: string;
  newLabel: string;
  onClose: () => void;
}

interface DiffLine {
  type: 'unchanged' | 'added' | 'deleted' | 'modified';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

const COLLAPSE_THRESHOLD = 5;

function computeDiffLines(oldText: string, newText: string): DiffLine[] {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  const lines: DiffLine[] = [];
  let oldLineNum = 0;
  let newLineNum = 0;

  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const oldLineMap = new Map<number, string>();
  const newLineMap = new Map<number, string>();
  oldLines.forEach((line, i) => oldLineMap.set(i, line));
  newLines.forEach((line, i) => newLineMap.set(i, line));

  let oldIdx = 0;
  let newIdx = 0;

  for (const [op, text] of diffs) {
    const textLines = text.split('\n');
    if (text.endsWith('\n')) {
      textLines.pop();
    }

    for (const line of textLines) {
      if (op === DiffMatchPatch.DIFF_EQUAL) {
        oldLineNum++;
        newLineNum++;
        oldIdx++;
        newIdx++;
        lines.push({
          type: 'unchanged',
          content: line,
          oldLineNum,
          newLineNum,
        });
      } else if (op === DiffMatchPatch.DIFF_INSERT) {
        newLineNum++;
        newIdx++;
        lines.push({
          type: 'added',
          content: line,
          newLineNum,
        });
      } else if (op === DiffMatchPatch.DIFF_DELETE) {
        oldLineNum++;
        oldIdx++;
        lines.push({
          type: 'deleted',
          content: line,
          oldLineNum,
        });
      }
    }
  }

  const merged: DiffLine[] = [];
  let i = 0;
  while (i < lines.length) {
    if (
      lines[i].type === 'deleted' &&
      i + 1 < lines.length &&
      lines[i + 1].type === 'added'
    ) {
      merged.push({
        type: 'modified',
        content: `- ${lines[i].content}\n+ ${lines[i + 1].content}`,
        oldLineNum: lines[i].oldLineNum,
        newLineNum: lines[i + 1].newLineNum,
      });
      i += 2;
    } else {
      merged.push(lines[i]);
      i++;
    }
  }

  return merged;
}

export function DiffViewer({ oldText, newText, oldLabel, newLabel, onClose }: DiffViewerProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const diffLines = useMemo(() => computeDiffLines(oldText, newText), [oldText, newText]);

  const { renderedLines, collapsibleRanges } = useMemo(() => {
    const ranges: { start: number; end: number }[] = [];
    let rangeStart = -1;
    let unchangedCount = 0;

    for (let i = 0; i < diffLines.length; i++) {
      if (diffLines[i].type === 'unchanged') {
        if (rangeStart === -1) rangeStart = i;
        unchangedCount++;
      } else {
        if (unchangedCount >= COLLAPSE_THRESHOLD && rangeStart !== -1) {
          ranges.push({ start: rangeStart, end: i - 1 });
        }
        rangeStart = -1;
        unchangedCount = 0;
      }
    }
    if (unchangedCount >= COLLAPSE_THRESHOLD && rangeStart !== -1) {
      ranges.push({ start: rangeStart, end: diffLines.length - 1 });
    }

    return { renderedLines: diffLines, collapsibleRanges: ranges };
  }, [diffLines]);

  const isLineCollapsed = useCallback(
    (index: number) => {
      for (const section of collapsedSections) {
        const range = collapsibleRanges[section];
        if (range && index > range.start && index < range.end) {
          return true;
        }
      }
      return false;
    },
    [collapsedSections, collapsibleRanges]
  );

  const isSectionExpanded = useCallback(
    (sectionIndex: number) => expandedSections.has(sectionIndex),
    [expandedSections]
  );

  const toggleSection = useCallback((sectionIndex: number) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) {
        next.delete(sectionIndex);
        setExpandedSections((ep) => {
          const en = new Set(ep);
          en.delete(sectionIndex);
          return en;
        });
      } else {
        next.add(sectionIndex);
      }
      return next;
    });
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) {
        next.delete(sectionIndex);
      } else {
        next.add(sectionIndex);
      }
      return next;
    });
  }, []);

  const hasDiff = diffLines.some((l) => l.type !== 'unchanged');

  const getLineStyles = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-[#9ece6a]/15 border-l-2 border-l-[#9ece6a]';
      case 'deleted':
        return 'bg-[#f7768e]/15 border-l-2 border-l-[#f7768e]';
      case 'modified':
        return 'bg-[#e0af68]/15 border-l-2 border-l-[#e0af68]';
      default:
        return 'border-l-2 border-l-transparent';
    }
  };

  const getLinePrefix = (type: DiffLine['type']) => {
    switch (type) {
      case 'added': return '+';
      case 'deleted': return '-';
      case 'modified': return '~';
      default: return ' ';
    }
  };

  const getPrefixColor = (type: DiffLine['type']) => {
    switch (type) {
      case 'added': return 'text-[#9ece6a]';
      case 'deleted': return 'text-[#f7768e]';
      case 'modified': return 'text-[#e0af68]';
      default: return 'text-muted-light dark:text-muted-dark';
    }
  };

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-full sm:w-[560px] z-50',
        'bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl',
        'border-l border-border-light dark:border-border-dark',
        'shadow-2xl',
        'animate-slide-in-right',
        'flex flex-col',
        'outline-none'
      )}
    >
      <div className={cn('flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark')}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#f7768e]/15 text-[#f7768e]">
              {oldLabel}
            </span>
            <span className="text-muted-light dark:text-muted-dark text-xs">→</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#9ece6a]/15 text-[#9ece6a]">
              {newLabel}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className={cn(
            'p-1 rounded-md',
            'text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark',
            'hover:bg-black/5 dark:hover:bg-white/5',
            'transition-colors duration-200'
          )}
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth">
        {!hasDiff ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-light dark:text-muted-dark font-sans text-sm">
              两个版本内容相同
            </p>
          </div>
        ) : (
          <div className="font-mono text-sm leading-6">
            {diffLines.map((line, index) => {
              if (isLineCollapsed(index) && !isSectionExpanded(collapsibleRanges.findIndex((r) => index > r.start && index < r.end))) {
                return null;
              }

              const sectionIdx = collapsibleRanges.findIndex(
                (r) => index === r.start || index === r.end
              );
              const isCollapseStart = sectionIdx !== -1 && collapsibleRanges[sectionIdx]?.start === index && collapsedSections.has(sectionIdx) && !expandedSections.has(sectionIdx);

              if (isCollapseStart) {
                const range = collapsibleRanges[sectionIdx];
                const hiddenCount = range.end - range.start - 1;
                return (
                  <div key={`collapse-${sectionIdx}`}>
                    <div className={cn('flex items-center px-4', getLineStyles(line.type))}>
                      <span className="w-10 text-right pr-2 text-muted-light/50 dark:text-muted-dark/50 select-none text-xs">
                        {line.oldLineNum ?? ''}
                      </span>
                      <span className="w-10 text-right pr-2 text-muted-light/50 dark:text-muted-dark/50 select-none text-xs">
                        {line.newLineNum ?? ''}
                      </span>
                      <span className={cn('w-5 text-center select-none text-xs', getPrefixColor(line.type))}>
                        {getLinePrefix(line.type)}
                      </span>
                      <span className="flex-1 text-text-light dark:text-text-dark whitespace-pre">
                        {line.content}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSection(sectionIdx)}
                      className={cn(
                        'w-full flex items-center justify-center gap-1 py-1',
                        'text-muted-light dark:text-muted-dark text-xs font-sans',
                        'hover:bg-black/5 dark:hover:bg-white/5',
                        'transition-colors duration-150'
                      )}
                    >
                      <ChevronDown size={12} />
                      {hiddenCount} 行未变更
                    </button>
                  </div>
                );
              }

              const sectionEndIdx = collapsibleRanges.findIndex(
                (r) => index === r.end && collapsedSections.has(collapsibleRanges.indexOf(r)) && !expandedSections.has(collapsibleRanges.indexOf(r))
              );

              if (sectionEndIdx !== -1) {
                return (
                  <div key={`line-${index}`}>
                    <div className={cn('flex items-center px-4', getLineStyles(line.type))}>
                      <span className="w-10 text-right pr-2 text-muted-light/50 dark:text-muted-dark/50 select-none text-xs">
                        {line.oldLineNum ?? ''}
                      </span>
                      <span className="w-10 text-right pr-2 text-muted-light/50 dark:text-muted-dark/50 select-none text-xs">
                        {line.newLineNum ?? ''}
                      </span>
                      <span className={cn('w-5 text-center select-none text-xs', getPrefixColor(line.type))}>
                        {getLinePrefix(line.type)}
                      </span>
                      <span className="flex-1 text-text-light dark:text-text-dark whitespace-pre">
                        {line.content}
                      </span>
                    </div>
                  </div>
                );
              }

              const expandedSectionIdx = collapsibleRanges.findIndex(
                (r) => index === r.start && expandedSections.has(collapsibleRanges.indexOf(r))
              );
              if (expandedSectionIdx !== -1) {
                const range = collapsibleRanges[expandedSectionIdx];
                return (
                  <div key={`line-${index}`}>
                    <button
                      onClick={() => toggleSection(expandedSectionIdx)}
                      className={cn(
                        'w-full flex items-center justify-center gap-1 py-1',
                        'text-muted-light dark:text-muted-dark text-xs font-sans',
                        'hover:bg-black/5 dark:hover:bg-white/5',
                        'transition-colors duration-150'
                      )}
                    >
                      <ChevronUp size={12} />
                      折叠
                    </button>
                    <div className={cn('flex items-center px-4', getLineStyles(line.type))}>
                      <span className="w-10 text-right pr-2 text-muted-light/50 dark:text-muted-dark/50 select-none text-xs">
                        {line.oldLineNum ?? ''}
                      </span>
                      <span className="w-10 text-right pr-2 text-muted-light/50 dark:text-muted-dark/50 select-none text-xs">
                        {line.newLineNum ?? ''}
                      </span>
                      <span className={cn('w-5 text-center select-none text-xs', getPrefixColor(line.type))}>
                        {getLinePrefix(line.type)}
                      </span>
                      <span className="flex-1 text-text-light dark:text-text-dark whitespace-pre">
                        {line.content}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={`line-${index}`} className={cn('flex items-center px-4', getLineStyles(line.type))}>
                  <span className="w-10 text-right pr-2 text-muted-light/50 dark:text-muted-dark/50 select-none text-xs">
                    {line.oldLineNum ?? ''}
                  </span>
                  <span className="w-10 text-right pr-2 text-muted-light/50 dark:text-muted-dark/50 select-none text-xs">
                    {line.newLineNum ?? ''}
                  </span>
                  <span className={cn('w-5 text-center select-none text-xs', getPrefixColor(line.type))}>
                    {getLinePrefix(line.type)}
                  </span>
                  <span className="flex-1 text-text-light dark:text-text-dark whitespace-pre overflow-x-auto">
                    {line.content}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
