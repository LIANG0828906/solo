import { useState, useEffect, useCallback, useRef } from 'react';
import type { Frame } from '../../types';

interface PreviewModalProps {
  frames: Frame[];
  currentIndex: number;
  onClose: () => void;
  onGoToFrame: (index: number) => void;
  canvasWidth: number;
  canvasHeight: number;
}

function htmlToPlainText(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function formatTimestamp(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const AUTO_PLAY_INTERVAL = 2000;

export default function PreviewModal({
  frames,
  currentIndex,
  onClose,
  onGoToFrame,
  canvasWidth,
  canvasHeight,
}: PreviewModalProps) {
  const [displayIndex, setDisplayIndex] = useState(currentIndex);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const autoPlayRef = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= frames.length || index === displayIndex) return;
      setAnimatingIndex(displayIndex);
      setDisplayIndex(index);
      onGoToFrame(index);
      setTimeout(() => setAnimatingIndex(null), 320);
    },
    [displayIndex, frames.length, onGoToFrame]
  );

  const goPrev = useCallback(() => goTo(displayIndex - 1), [displayIndex, goTo]);
  const goNext = useCallback(() => goTo(displayIndex + 1), [displayIndex, goTo]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = window.setInterval(() => {
        setDisplayIndex((idx) => {
          const next = idx + 1;
          if (next >= frames.length) {
            setIsAutoPlaying(false);
            return idx;
          }
          setAnimatingIndex(idx);
          onGoToFrame(next);
          setTimeout(() => setAnimatingIndex(null), 320);
          return next;
        });
      }, AUTO_PLAY_INTERVAL);
    }
    return () => {
      if (autoPlayRef.current) {
        window.clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [isAutoPlaying, frames.length, onGoToFrame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleAutoPlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext, toggleAutoPlay, onClose]);

  const currentFrame = frames[displayIndex];
  const timestamp = formatTimestamp(displayIndex * 2);

  return (
    <div className="preview-modal">
      <button className="preview-close" onClick={onClose} title="关闭 (Esc)">
        ✕
      </button>

      <div className="preview-timestamp">
        {timestamp} · {displayIndex + 1} / {frames.length}
      </div>

      <div className="preview-controller">
        <button
          className="controller-btn"
          onClick={goPrev}
          disabled={displayIndex <= 0}
          title="上一帧 (←)"
        >
          ‹
        </button>
        <button
          className={`controller-btn ${isAutoPlaying ? 'active' : ''}`}
          onClick={toggleAutoPlay}
          title={isAutoPlaying ? '暂停 (空格)' : '自动播放 (空格)'}
        >
          {isAutoPlaying ? '❚❚' : '▶'}
        </button>
        <button
          className="controller-btn"
          onClick={goNext}
          disabled={displayIndex >= frames.length - 1}
          title="下一帧 (→)"
        >
          ›
        </button>
        <div className="preview-progress">
          {displayIndex + 1}/{frames.length}
        </div>
      </div>

      <div className="preview-canvas-wrapper">
        {animatingIndex !== null && frames[animatingIndex] && (
          <div className="preview-slide leaving" key={`leaving-${animatingIndex}`}>
            <canvas
              className="preview-canvas"
              width={canvasWidth}
              height={canvasHeight}
              style={{ width: canvasWidth * 0.8, height: canvasHeight * 0.8 }}
            />
          </div>
        )}
        <div className="preview-slide current" key={`current-${displayIndex}`}>
          <canvas
            className="preview-canvas"
            width={canvasWidth}
            height={canvasHeight}
            style={{ width: canvasWidth * 0.8, height: canvasHeight * 0.8 }}
          />
          <div className="preview-description">
            {htmlToPlainText(currentFrame?.description || '') || '（无描述）'}
          </div>
        </div>
      </div>
    </div>
  );
}
