import { useEffect, useRef, useState } from 'react';
import type { NarrationState } from '../types/artifact';

interface SubtitleBarProps {
  narrationState: NarrationState;
  opacity: number;
}

export function SubtitleBar({ narrationState, opacity }: SubtitleBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, [narrationState.isPlaying]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!narrationState.isPlaying || !narrationState.text) return null;

  const textOffset = -narrationState.scrollPosition;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: 'rgba(0, 0, 0, 0.67)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 50,
        opacity: opacity,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        ref={textRef}
        style={{
          position: 'absolute',
          whiteSpace: 'nowrap',
          color: 'white',
          fontSize: 18,
          fontFamily: "'Microsoft YaHei', sans-serif",
          transform: `translateX(${textOffset + containerWidth}px)`,
          willChange: 'transform',
        }}
      >
        {narrationState.text}
        {'　　　　　　'}
        {narrationState.text}
      </div>
    </div>
  );
}
