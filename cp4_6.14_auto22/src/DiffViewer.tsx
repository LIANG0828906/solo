import { useRef, useEffect, useState } from 'react';
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

interface DiffLine {
  text: string;
  type: 'normal' | 'added' | 'removed' | 'modified';
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
    oldLines: DiffLine[];
    newLines: DiffLine[];
  }>({ oldLines: [], newLines: [] });

  useEffect(() => {
    const startTime = performance.now();

    const oldText = stripHtml(oldVersion);
    const oldLines = oldText.split('\n');
    const newText = stripHtml(newVersion);
    const newLines = newText.split('\n');

    const oldResult: DiffLine[] = [];
    const newResult: DiffLine[] = [];

    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine === newLine) {
        oldResult.push({ text: oldLine, type: 'normal' });
        newResult.push({ text: newLine, type: 'normal' });
      } else if (oldLine && !newLine) {
        oldResult.push({ text: oldLine, type: 'removed' });
        newResult.push({ text: newLine, type: 'added' });
      } else if (oldLine && newLine) {
        const charDiff = Diff.diffChars(oldLine, newLine);
        let hasChanges = false;
        for (const part of charDiff) {
          if (part.added || part.removed) {
            hasChanges = true;
            break;
          }
        }

        if (hasChanges) {
          oldResult.push({ text: oldLine, type: 'modified' });
          newResult.push({ text: newLine, type: 'modified' });
        } else {
          oldResult.push({ text: oldLine, type: 'normal' });
          newResult.push({ text: newLine, type: 'normal' });
        }
      } else if (!oldLine && newLine) {
        oldResult.push({ text: '', type: 'normal' });
        newResult.push({ text: newLine, type: 'added' });
      } else if (oldLine && !newLine) {
        oldResult.push({ text: oldLine, type: 'removed' });
        newResult.push({ text: '', type: 'normal' });
      }
    }

    const endTime = performance.now();
    console.log(`Diff generated in ${(endTime - startTime).toFixed(2)}ms`);

    setDiffResult({ oldLines: oldResult, newLines: newResult });
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

  const renderDiffText = (line: DiffLine, isOld: boolean) => {
    if (line.type === 'normal') {
      return <span>{line.text || '\u00A0'}</span>;
    }

    if (line.type === 'added' && !isOld) {
      return <span style={{ backgroundColor: '#d4edda' }}>{line.text || '\u00A0'}</span>;
    }

    if (line.type === 'removed' && isOld) {
      return <span style={{ backgroundColor: '#f8d7da' }}>{line.text || '\u00A0'}</span>;
    }

    if (line.type === 'modified') {
      const otherText = isOld
        ? diffResult.newLines[diffResult.oldLines.indexOf(line)]?.text || ''
        : diffResult.oldLines[diffResult.newLines.indexOf(line)]?.text || '';

      const charDiff = Diff.diffChars(line.text, otherText);

      return (
        <>
          {charDiff.map((part, idx) => {
          if (part.added) {
            return isOld ? null : (
              <span key={idx} style={{ backgroundColor: '#d4edda' }}>{part.value}</span>
            );
          }
          if (part.removed) {
            return isOld ? (
              <span key={idx} style={{ backgroundColor: '#f8d7da' }}>{part.value}</span>
            ) : null;
          }
          return <span key={idx}>{part.value}</span>;
        })}
        </>
      );
    }

    return <span>{line.text || '\u00A0'}</span>;
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
              {renderDiffText(line, true)}
            </div>
          ))}
        </div>
        <div className="diff-panel">
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
            {newVersionLabel} (新版本)
          </div>
          {diffResult.newLines.map((line, index) => (
            <div key={index} className={getLineClass(line.type)}>
              {renderDiffText(line, false)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DiffViewer;
