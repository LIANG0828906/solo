import { useState, useEffect, useRef, useCallback } from 'react';
import type { PoemLine } from './ArtGenerator';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

interface PoetryScrollProps {
  lines: PoemLine[];
  images: string[];
  isPlaying: boolean;
  currentLine: number;
  onPlayToggle: () => void;
  onCurrentLineChange: (line: number) => void;
  onPlayEnd: () => void;
}

export default function PoetryScroll({
  lines,
  images,
  isPlaying,
  currentLine,
  onPlayToggle,
  onCurrentLineChange,
  onPlayEnd,
}: PoetryScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [ripplePos, setRipplePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, lines.length);
  }, [lines.length]);

  useEffect(() => {
    if (!isPlaying || lines.length === 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      const nextLine = currentLine + 1;
      if (nextLine >= lines.length) {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#ff6b6b', '#ffd93d', '#6c5ce7', '#74b9ff', '#a29bfe'],
        });
        onPlayEnd();
        return;
      }
      onCurrentLineChange(nextLine);
    }, 2000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentLine, lines.length, onCurrentLineChange, onPlayEnd]);

  useEffect(() => {
    if (isPlaying && lineRefs.current[currentLine]) {
      lineRefs.current[currentLine]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLine, isPlaying]);

  const handleExport = useCallback(async () => {
    if (!scrollRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(scrollRef.current, {
        backgroundColor: '#0d1b2a',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = 'poetry-scroll.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  const handleExportClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setRipplePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setRipplePos(null), 600);
      handleExport();
    },
    [handleExport]
  );

  if (lines.length === 0) return null;

  return (
    <div className="poetry-scroll-wrapper">
      <div className="scroll-controls">
        <button className="control-btn" onClick={onPlayToggle}>
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
          <span>{isPlaying ? '暂停' : '播放'}</span>
        </button>
        <button className="control-btn export-btn" onClick={handleExportClick}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>导出长图</span>
          {ripplePos && (
            <span
              className="ripple"
              style={{
                left: ripplePos.x,
                top: ripplePos.y,
              }}
            />
          )}
        </button>
      </div>

      <div className="poetry-scroll" ref={scrollRef}>
        {lines.map((line, idx) => (
          <div
            key={idx}
            ref={(el) => {
              lineRefs.current[idx] = el;
            }}
            className={`poem-line-item ${isPlaying && idx === currentLine ? 'active' : ''}`}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="art-image-wrapper">
              <img
                src={images[idx]}
                alt={`Abstract art for line ${idx + 1}`}
                className="art-image"
              />
            </div>
            <div className="poem-text-card">
              <p className="poem-text">{line.text}</p>
              <span className="sentiment-badge" data-sentiment={line.sentiment}>
                {line.sentiment === 'positive' ? '☀️' : '🌙'}
              </span>
            </div>
            {idx < lines.length - 1 && <div className="line-divider" />}
          </div>
        ))}
      </div>

      {exporting && (
        <div className="export-overlay">
          <div className="export-spinner" />
          <p>正在导出画卷...</p>
        </div>
      )}
    </div>
  );
}


