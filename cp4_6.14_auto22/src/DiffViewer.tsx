import { useRef, useEffect, useState, useMemo } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  oldVersion: string;
  newVersion: string;
  oldVersionLabel: string;
  newVersionLabel: string;
  height: number;
  onHeightChange: (height: number) => void;
  onClose: () => void;
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function DiffViewer({
  oldVersion,
  newVersion,
  oldVersionLabel,
  newVersionLabel,
  height,
  onHeightChange,
  onClose,
}: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const [diffResult, setDiffResult] = useState<{
    oldLines: Array<{ text: string; type: 'normal' | 'added' | 'removed' | 'modified' }>;
    newLines: Array<{ text: string; type: 'normal' | 'added' | 'removed' | 'modified' }>;
  }>({ oldLines: [], newLines: [] });

  useEffect(() => {
    const startTime = performance.now();

    const oldText = stripHtml(oldVersion);
    const newText = stripHtml(newVersion);

    const diff = Diff.diffLines(oldText, newText);

    const oldLines: Array<{ text: string; type: 'normal' | 'added' | 'removed' | 'modified' }> = [];
    const newLines: Array<{ text: string; type: 'normal' | 'added' | 'removed' | 'modified' }> = [];

    diff.forEach((part) => {
      const lines = part.value.split('\n');
      if (lines[lines.length - 1] === '') {
        lines.pop();
      }

      lines.forEach((line) => {
        if (part.added) {
          newLines.push({ text: line, type: 'added' });
        } else if (part.removed) {
          oldLines.push({ text: line, type: 'removed' });
        } else {
          oldLines.push({ text: line, type: 'normal' });
          newLines.push({ text: line, type: 'normal' });
        }
      });
    });

    const maxLen = Math.max(oldLines.length, newLines.length);
    while (oldLines.length < maxLen) {
      oldLines.push({ text: '', type: 'normal' });
    }
    while (newLines.length < maxLen) {
      newLines.push({ text: '', type: 'normal' });
    }

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine.type === 'removed' && newLine.type === 'added') {
        oldLine.type = 'modified';
        newLine.type = 'modified';
      }
    }

    const endTime = performance.now();
    console.log(`Diff generated in ${(endTime - startTime).toFixed(2)}ms`);

    setDiffResult({ oldLines, newLines });
  }, [oldVersion, newVersion]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startY.current - e.clientY;
      const newHeight = Math.min(Math.max(startHeight.current + delta, 100), 600);
      onHeightChange(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onHeightChange]);

  const getLineClass = (type: string) => {
    switch (type) {
      case 'added':
        return 'diff-line added';
      case 'removed':
        return 'diff-line removed';
      case 'modified':
        return 'diff-line modified';
      default:
        return 'diff-line';
    }
  };

  return (
    <div
      ref={containerRef}
      className="diff-viewer"
      style={{ height: `${height}px` }}
    >
      <div className="diff-resize-handle" onMouseDown={handleMouseDown} />
      <div className="diff-header">
        <span className="diff-title">
          版本对比：{oldVersionLabel} → {newVersionLabel}
        </span>
        <button className="diff-close-btn" onClick={onClose}>
          关闭
        </button>
      </div>
      <div className="diff-content">
        <div className="diff-panel">
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
            {oldVersionLabel} (旧版本)
          </div>
          {diffResult.oldLines.map((line, index) => (
            <div key={index} className={getLineClass(line.type)}>
              {line.text || '\u00A0'}
            </div>
          ))}
        </div>
        <div className="diff-panel">
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
            {newVersionLabel} (新版本)
          </div>
          {diffResult.newLines.map((line, index) => (
            <div key={index} className={getLineClass(line.type)}>
              {line.text || '\u00A0'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DiffViewer;
