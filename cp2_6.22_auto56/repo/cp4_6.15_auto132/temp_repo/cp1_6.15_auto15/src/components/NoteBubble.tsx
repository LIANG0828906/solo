import React, { useRef, useState, useEffect } from 'react';
import './NoteBubble.css';

interface NoteBubbleProps {
  note: string;
  delay?: number;
}

const NoteBubble: React.FC<NoteBubbleProps> = ({ note, delay = 0 }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [animProps, setAnimProps] = useState({
    scale1: 0.95,
    scale2: 1.02,
    duration: 0.5,
  });

  useEffect(() => {
    if (bubbleRef.current) {
      const width = bubbleRef.current.offsetWidth;
      const minWidth = 120;
      const maxWidth = 400;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));
      const ratio = (clampedWidth - minWidth) / (maxWidth - minWidth);

      const scale1 = 0.93 + ratio * 0.04;
      const scale2 = 1.03 - ratio * 0.02;
      const duration = 0.5 - ratio * 0.1;

      setAnimProps({ scale1, scale2, duration });
    }
  }, [note]);

  return (
    <div
      ref={bubbleRef}
      className="note-bubble animate-slide-in-left animate-bounce-in animate-float-soft"
      style={{
        '--bubble-scale-1': animProps.scale1,
        '--bubble-scale-2': animProps.scale2,
        '--bounce-duration': `${animProps.duration}s`,
        animationDelay: `${delay}ms, ${delay + 400}ms, ${delay + 900}ms`,
      } as React.CSSProperties}
    >
      <div className="note-arrow" />
      <p className="note-text handwriting">{note}</p>
    </div>
  );
};

export default React.memo(NoteBubble);
