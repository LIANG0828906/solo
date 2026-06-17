import { useEffect, useRef } from 'react';
import { FileCode } from 'lucide-react';
import { useAppStore } from '@/store';

export default function CodePreview() {
  const rawCode = useAppStore((s) => s.rawCode);
  const fileName = useAppStore((s) => s.fileName);
  const selectedSmellId = useAppStore((s) => s.selectedSmellId);
  const badSmells = useAppStore((s) => s.analysisResult.badSmells);
  const selectSmell = useAppStore((s) => s.selectSmell);

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const lines = rawCode.split('\n');
  const totalLines = lines.length;
  const lineNumberWidth = Math.max(String(totalLines).length, 2) * 10 + 24;

  const selectedSmell = badSmells.find((b) => b.id === selectedSmellId);

  const isHighlightedLine = (lineNum: number) => {
    if (!selectedSmell) return false;
    return (
      lineNum >= selectedSmell.position.startLine &&
      lineNum <= selectedSmell.position.endLine
    );
  };

  useEffect(() => {
    if (selectedSmell && containerRef.current) {
      const startLine = selectedSmell.position.startLine;
      const targetEl = lineRefs.current.get(startLine);
      if (targetEl) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const offset =
          targetRect.top - containerRect.top - container.clientHeight / 2 + 16;
        container.scrollBy({ top: offset, behavior: 'smooth' });
      }
    }
  }, [selectedSmellId]);

  if (!rawCode) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-16 text-center bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
        <FileCode size={48} className="text-slate-600 mb-4" />
        <p className="text-slate-500">上传代码后在此处预览</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center gap-2 text-sm">
          <FileCode size={16} className="text-slate-400" />
          <span className="text-slate-200 font-medium">
            {fileName || '代码预览'}
          </span>
          <span className="text-slate-500 text-xs">
            ({totalLines} 行)
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ maxHeight: '500px' }}
      >
        <div className="flex min-w-max">
          <div
            className="flex-shrink-0 sticky left-0 select-none"
            style={{
              width: `${lineNumberWidth}px`,
              backgroundColor: '#0F172A',
              color: '#475569',
            }}
          >
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const highlighted = isHighlightedLine(lineNum);
              return (
                <div
                  key={lineNum}
                  ref={(el) => {
                    if (el) lineRefs.current.set(lineNum, el);
                    else lineRefs.current.delete(lineNum);
                  }}
                  className="pr-4 pl-3 text-right text-xs leading-[1.6]"
                  style={{
                    fontFamily:
                      "ui-monospace,'JetBrains Mono',Fira Code,monospace",
                    fontSize: '13px',
                    lineHeight: '1.6',
                    backgroundColor: highlighted ? '#FEF08A' : undefined,
                    color: highlighted ? '#713F12' : '#475569',
                    minHeight: '20.8px',
                  }}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>

          <div className="flex-1 min-w-0">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const highlighted = isHighlightedLine(lineNum);
              return (
                <div
                  key={lineNum}
                  onClick={() => {
                    const match = badSmells.find(
                      (b) =>
                        lineNum >= b.position.startLine &&
                        lineNum <= b.position.endLine,
                    );
                    if (match) selectSmell(match.id);
                  }}
                  className="px-4 whitespace-pre cursor-pointer"
                  style={{
                    fontFamily:
                      "ui-monospace,'JetBrains Mono',Fira Code,monospace",
                    fontSize: '13px',
                    lineHeight: '1.6',
                    backgroundColor: highlighted ? '#FEF08A' : undefined,
                    color: highlighted ? '#1F2937' : '#E2E8F0',
                    minHeight: '20.8px',
                  }}
                >
                  {line || '\u00A0'}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
