import { useRef, useEffect } from 'react';
import { LyricLine } from './useAudioPlayer';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentIndex: number;
}

export default function LyricsDisplay({ lyrics, currentIndex }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef(0);
  const currentScrollRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current || currentIndex < 0) return;

    const container = containerRef.current;
    const lines = container.querySelectorAll<HTMLElement>('.lyric-line');
    const targetLine = lines[currentIndex];

    if (targetLine) {
      const containerRect = container.getBoundingClientRect();
      const lineRect = targetLine.getBoundingClientRect();
      const lineTop = lineRect.top - containerRect.top + container.scrollTop;
      const targetScroll = lineTop - container.clientHeight / 2 + targetLine.clientHeight / 2;
      scrollTargetRef.current = Math.max(0, targetScroll);
    }
  }, [currentIndex, lyrics]);

  useEffect(() => {
    const animateScroll = (timestamp: number) => {
      if (!containerRef.current) {
        rafIdRef.current = requestAnimationFrame(animateScroll);
        return;
      }

      if (timestamp - lastFrameTimeRef.current >= 16) {
        lastFrameTimeRef.current = timestamp;
        const diff = scrollTargetRef.current - currentScrollRef.current;
        if (Math.abs(diff) > 0.5) {
          currentScrollRef.current += diff * 0.15;
          containerRef.current.scrollTop = currentScrollRef.current;
        }
      }
      rafIdRef.current = requestAnimationFrame(animateScroll);
    };

    rafIdRef.current = requestAnimationFrame(animateScroll);
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  if (lyrics.length === 0) {
    return (
      <div style={styles.container}>
        <p style={styles.placeholder}>请加载歌词文件 (.lrc)</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.container}>
      <div style={styles.padding} />
      {lyrics.map((line, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={index}
            className="lyric-line"
            style={{
              ...styles.line,
              opacity: isActive ? 1 : 0.35,
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              textShadow: isActive ? '0 0 20px rgba(139, 92, 246, 0.8)' : 'none',
              transition: 'opacity 0.3s ease, color 0.3s ease, transform 0.3s ease, text-shadow 0.3s ease',
              willChange: 'transform, opacity',
            }}
          >
            {line.text}
          </div>
        );
      })}
      <div style={styles.padding} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: 240,
    overflowY: 'hidden',
    padding: '0 20px',
    textAlign: 'center',
    scrollBehavior: 'auto',
    maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
  },
  padding: {
    height: 100,
  },
  line: {
    padding: '10px 0',
    fontSize: 16,
    lineHeight: 1.6,
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  placeholder: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    padding: '80px 0',
    fontSize: 14,
  },
};
