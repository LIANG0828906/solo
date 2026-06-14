import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { diffLines, Change } from 'diff';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import type { Language } from '../types';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import styles from './Diff.module.css';

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  language: Language;
  onClose: () => void;
  oldVersionLabel?: string;
  newVersionLabel?: string;
}

interface DiffLineData {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
  isModified?: boolean;
  highlightIndices?: Array<[number, number]>;
}

const languageMap: Record<Language, string> = {
  javascript: 'javascript',
  python: 'python',
  html: 'markup',
  css: 'css',
};

function highlightCode(code: string, language: Language): string {
  const grammar = Prism.languages[languageMap[language]];
  if (grammar) {
    return Prism.highlight(code, grammar, languageMap[language]);
  }
  return code;
}

function findCharDifferences(oldStr: string, newStr: string): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  const minLen = Math.min(oldStr.length, newStr.length);
  let start = -1;

  for (let i = 0; i < minLen; i++) {
    if (oldStr[i] !== newStr[i]) {
      if (start === -1) start = i;
    } else {
      if (start !== -1) {
        result.push([start, i]);
        start = -1;
      }
    }
  }

  if (start !== -1) {
    result.push([start, minLen]);
  }

  if (newStr.length > oldStr.length) {
    result.push([minLen, newStr.length]);
  }

  return result;
}

function processDiff(changes: Change[]): { leftLines: DiffLineData[]; rightLines: DiffLineData[]; diffBlocks: number[] } {
  const leftLines: DiffLineData[] = [];
  const rightLines: DiffLineData[] = [];
  const diffBlocks: number[] = [];

  let oldLineNum = 1;
  let newLineNum = 1;

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const lines = change.value.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();

    if (change.added && change.removed) {
      const oldLines = change.value.split('\n').filter((_, idx) => idx < Math.floor(lines.length / 2));
      const newLines = change.value.split('\n').filter((_, idx) => idx >= Math.floor(lines.length / 2));

      diffBlocks.push(leftLines.length);

      oldLines.forEach((line) => {
        leftLines.push({
          type: 'removed',
          content: line,
          oldLineNumber: oldLineNum++,
          isModified: true,
        });
      });

      newLines.forEach((line) => {
        rightLines.push({
          type: 'added',
          content: line,
          newLineNumber: newLineNum++,
          isModified: true,
        });
      });
    } else if (change.added) {
      diffBlocks.push(rightLines.length);

      lines.forEach((line) => {
        rightLines.push({
          type: 'added',
          content: line,
          newLineNumber: newLineNum++,
        });
        leftLines.push({
          type: 'unchanged',
          content: '',
          oldLineNumber: undefined,
        });
      });
    } else if (change.removed) {
      diffBlocks.push(leftLines.length);

      lines.forEach((line) => {
        leftLines.push({
          type: 'removed',
          content: line,
          oldLineNumber: oldLineNum++,
        });
        rightLines.push({
          type: 'unchanged',
          content: '',
          newLineNumber: undefined,
        });
      });
    } else {
      lines.forEach((line) => {
        leftLines.push({
          type: 'unchanged',
          content: line,
          oldLineNumber: oldLineNum++,
        });
        rightLines.push({
          type: 'unchanged',
          content: line,
          newLineNumber: newLineNum++,
        });
      });
    }
  }

  for (let i = 0; i < changes.length - 1; i++) {
    if (changes[i].removed && changes[i + 1].added) {
      const removedLines = leftLines.filter((l) => l.type === 'removed').length;
      const addedLines = rightLines.filter((l) => l.type === 'added').length;
      const minLines = Math.min(removedLines, addedLines);

      if (minLines > 0) {
        const removedStartIdx = leftLines.findIndex((l) => l.type === 'removed');
        const addedStartIdx = rightLines.findIndex((l) => l.type === 'added');

        for (let j = 0; j < minLines; j++) {
          if (removedStartIdx + j < leftLines.length && addedStartIdx + j < rightLines.length) {
            const leftLine = leftLines[removedStartIdx + j];
            const rightLine = rightLines[addedStartIdx + j];
            if (leftLine.type === 'removed' && rightLine.type === 'added') {
              leftLine.isModified = true;
              rightLine.isModified = true;
              leftLine.highlightIndices = findCharDifferences(leftLine.content, rightLine.content).map(
                ([start, end]) => [start, end] as [number, number]
              );
              rightLine.highlightIndices = findCharDifferences(leftLine.content, rightLine.content).map(
                ([start, end]) => [start, end] as [number, number]
              );
            }
          }
        }
      }
    }
  }

  const uniqueBlocks = [...new Set(diffBlocks)].sort((a, b) => a - b);
  return { leftLines, rightLines, diffBlocks: uniqueBlocks };
}

export function DiffViewer({
  oldCode,
  newCode,
  language,
  onClose,
  oldVersionLabel = '旧版本',
  newVersionLabel = '新版本',
}: DiffViewerProps) {
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [currentDiffIndex, setCurrentDiffIndex] = useState(-1);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const isSyncing = useRef(false);

  const { leftLines, rightLines, diffBlocks } = useMemo(() => {
    const changes = diffLines(oldCode, newCode);
    return processDiff(changes);
  }, [oldCode, newCode]);

  const highlightedLeftLines = useMemo(
    () => leftLines.map((line) => highlightCode(line.content, language)),
    [leftLines, language]
  );

  const highlightedRightLines = useMemo(
    () => rightLines.map((line) => highlightCode(line.content, language)),
    [rightLines, language]
  );

  const handleScroll = useCallback((side: 'left' | 'right') => {
    if (isSyncing.current) return;

    isSyncing.current = true;
    requestAnimationFrame(() => {
      if (side === 'left' && leftPanelRef.current && rightPanelRef.current) {
        rightPanelRef.current.scrollTop = leftPanelRef.current.scrollTop;
      } else if (side === 'right' && leftPanelRef.current && rightPanelRef.current) {
        leftPanelRef.current.scrollTop = rightPanelRef.current.scrollTop;
      }
      isSyncing.current = false;
    });
  }, []);

  const scrollToDiff = (index: number) => {
    if (index < 0 || index >= diffBlocks.length) return;

    setCurrentDiffIndex(index);
    setFlashIndex(diffBlocks[index]);

    const lineElement = rightPanelRef.current?.querySelector(`[data-line-index="${diffBlocks[index]}"]`);
    if (lineElement && rightPanelRef.current) {
      const containerRect = rightPanelRef.current.getBoundingClientRect();
      const lineRect = lineElement.getBoundingClientRect();
      const offsetTop = lineRect.top - containerRect.top + rightPanelRef.current.scrollTop - 60;
      rightPanelRef.current.scrollTo({ top: offsetTop, behavior: 'smooth' });
      leftPanelRef.current?.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }

    setTimeout(() => setFlashIndex(null), 600);
  };

  const goToPrevDiff = () => {
    if (diffBlocks.length === 0) return;
    const newIndex = currentDiffIndex <= 0 ? diffBlocks.length - 1 : currentDiffIndex - 1;
    scrollToDiff(newIndex);
  };

  const goToNextDiff = () => {
    if (diffBlocks.length === 0) return;
    const newIndex = currentDiffIndex >= diffBlocks.length - 1 ? 0 : currentDiffIndex + 1;
    scrollToDiff(newIndex);
  };

  useEffect(() => {
    if (diffBlocks.length > 0 && currentDiffIndex === -1) {
      setCurrentDiffIndex(0);
    }
  }, [diffBlocks.length, currentDiffIndex]);

  const renderLineContent = (line: DiffLineData, highlighted: string, index: number, isFlash: boolean) => {
    const lineClass = [
      styles.diffLine,
      line.type === 'added' ? styles.added : '',
      line.type === 'removed' ? styles.removed : '',
      line.isModified ? styles.modified : '',
      isFlash ? styles.flash : '',
    ].filter(Boolean).join(' ');

    return (
      <div key={index} className={lineClass} data-line-index={index}>
        {line.type === 'added' && (
          <span className={`${styles.diffIcon} ${styles.addIcon}`}>+</span>
        )}
        {line.type === 'removed' && (
          <span className={`${styles.diffIcon} ${styles.removeIcon}`}>-</span>
        )}
        {line.type === 'unchanged' && line.content !== '' && (
          <span className={styles.diffIconSpace}></span>
        )}
        <span
          className={styles.lineContent}
          dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }}
        />
      </div>
    );
  };

  return (
    <div className={styles.diffModalOverlay} onClick={onClose}>
      <div className={styles.diffModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.diffHeader}>
          <h2 className={styles.diffTitle}>代码差异对比</h2>
          <div className={styles.diffNav}>
            <button
              className={styles.navButton}
              onClick={goToPrevDiff}
              title="上一处差异"
              disabled={diffBlocks.length === 0}
            >
              <ChevronUp size={18} />
            </button>
            <span className={styles.diffCount}>
              {diffBlocks.length > 0 ? `${currentDiffIndex + 1} / ${diffBlocks.length}` : '0 / 0'}
            </span>
            <button
              className={styles.navButton}
              onClick={goToNextDiff}
              title="下一处差异"
              disabled={diffBlocks.length === 0}
            >
              <ChevronDown size={18} />
            </button>
          </div>
          <button className={styles.closeButton} onClick={onClose} title="关闭">
            <X size={20} />
          </button>
        </div>

        <div className={styles.diffLabels}>
          <div className={styles.diffLabel}>{oldVersionLabel}</div>
          <div className={styles.diffDivider}></div>
          <div className={styles.diffLabel}>{newVersionLabel}</div>
        </div>

        <div className={styles.diffContainer}>
          <div
            className={`${styles.diffPanel} ${styles.leftPanel}`}
            ref={leftPanelRef}
            onScroll={() => handleScroll('left')}
          >
            <div className={`${styles.lineNumbers} language-${languageMap[language]}`}>
              {leftLines.map((line, index) => (
                <div
                  key={index}
                  className={`${styles.lineNumber} ${line.oldLineNumber ? '' : styles.emptyLineNumber}`}
                >
                  {line.oldLineNumber || ''}
                </div>
              ))}
            </div>
            <div className={styles.diffContent}>
              {leftLines.map((line, index) =>
                renderLineContent(line, highlightedLeftLines[index], index, flashIndex === index && line.type === 'removed')
              )}
            </div>
          </div>

          <div className={styles.panelDivider}></div>

          <div
            className={`${styles.diffPanel} ${styles.rightPanel}`}
            ref={rightPanelRef}
            onScroll={() => handleScroll('right')}
          >
            <div className={`${styles.lineNumbers} language-${languageMap[language]}`}>
              {rightLines.map((line, index) => (
                <div
                  key={index}
                  className={`${styles.lineNumber} ${line.newLineNumber ? '' : styles.emptyLineNumber}`}
                >
                  {line.newLineNumber || ''}
                </div>
              ))}
            </div>
            <div className={styles.diffContent}>
              {rightLines.map((line, index) =>
                renderLineContent(line, highlightedRightLines[index], index, flashIndex === index && line.type === 'added')
              )}
            </div>
          </div>
        </div>

        {diffBlocks.length === 0 && (
          <div className={styles.noDiffMessage}>
            <p>两个版本的代码完全相同，没有差异</p>
          </div>
        )}
      </div>
    </div>
  );
}
