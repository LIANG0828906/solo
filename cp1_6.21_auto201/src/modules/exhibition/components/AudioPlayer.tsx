import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';

interface AudioPlayerProps {
  audioUrl: string;
  playing: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onProgressUpdate: (progress: number, currentTime: number, duration: number) => void;
  onEnded: () => void;
}

const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  playing,
  onPlayStateChange,
  onProgressUpdate,
  onEnded,
}) => {
  const howlRef = useRef<Howl | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [tooltipTime, setTooltipTime] = useState('');
  const [tooltipX, setTooltipX] = useState(0);
  const [showReplay, setShowReplay] = useState(false);
  const rafRef = useRef<number>(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const updateTime = useCallback(() => {
    const howl = howlRef.current;
    if (!howl || !howl.playing()) return;
    const ct = howl.seek() as number;
    const d = howl.duration() as number;
    setCurrentTime(ct);
    setProgress(d > 0 ? ct / d : 0);
    onProgressUpdate(d > 0 ? ct / d : 0, ct, d);
    rafRef.current = requestAnimationFrame(updateTime);
  }, [onProgressUpdate]);

  const createHowl = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.unload();
    }

    const howl = new Howl({
      src: [audioUrl],
      html5: true,
      preload: false,
      onload: () => {
        setLoaded(true);
        setDuration(howl.duration() as number);
      },
      onplay: () => {
        rafRef.current = requestAnimationFrame(updateTime);
      },
      onpause: () => {
        cancelAnimationFrame(rafRef.current);
      },
      onstop: () => {
        cancelAnimationFrame(rafRef.current);
      },
      onend: () => {
        cancelAnimationFrame(rafRef.current);
        setProgress(0);
        setCurrentTime(0);
        setShowReplay(true);
        onPlayStateChange(false);
        onEnded();
      },
    });

    howlRef.current = howl;
  }, [audioUrl, onPlayStateChange, onEnded, updateTime]);

  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
      }
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    setLoaded(false);
    setDuration(0);
    setCurrentTime(0);
    setProgress(0);
    setShowReplay(false);
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }
  }, [audioUrl]);

  const handlePlayPause = useCallback(() => {
    if (showReplay) {
      setShowReplay(false);
      createHowl();
      howlRef.current!.load();
      howlRef.current!.once('load', () => {
        howlRef.current!.play();
        onPlayStateChange(true);
      });
      return;
    }

    if (!howlRef.current) {
      createHowl();
      howlRef.current!.load();
      howlRef.current!.once('load', () => {
        howlRef.current!.play();
        onPlayStateChange(true);
      });
      return;
    }

    if (howlRef.current.playing()) {
      howlRef.current.pause();
      onPlayStateChange(false);
    } else {
      howlRef.current.play();
      onPlayStateChange(true);
    }
  }, [createHowl, onPlayStateChange, showReplay]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!howlRef.current || !loaded) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const d = howlRef.current.duration() as number;
      howlRef.current.seek(pct * d);
      setProgress(pct);
      setCurrentTime(pct * d);
      onProgressUpdate(pct, pct * d, d);
    },
    [loaded, onProgressUpdate]
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(true);
      handleProgressClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    },
    [handleProgressClick]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current || !loaded) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const d = howlRef.current ? (howlRef.current.duration() as number) : duration;
      setProgress(pct);
      setCurrentTime(pct * d);
      setTooltipTime(formatTime(pct * d));
      setTooltipX(x);
    };

    const handleMouseUp = (e: MouseEvent) => {
      setDragging(false);
      if (howlRef.current && loaded && progressRef.current) {
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        const d = howlRef.current.duration() as number;
        howlRef.current.seek(pct * d);
        onProgressUpdate(pct, pct * d, d);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, loaded, duration, onProgressUpdate]);

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.playButton,
          cursor: loaded || !playing ? 'pointer' : 'wait',
        }}
        onClick={handlePlayPause}
        aria-label={playing ? 'Pause' : showReplay ? 'Replay' : 'Play'}
      >
        {showReplay ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#38BDF8">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        ) : playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#38BDF8">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#38BDF8">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      <div style={styles.progressSection}>
        <span style={styles.timeLabel}>{formatTime(currentTime)}</span>
        <div
          ref={progressRef}
          style={styles.progressBarBg}
          onClick={handleProgressClick}
          onMouseDown={handleDragStart}
        >
          <div
            style={{
              ...styles.progressBarFill,
              width: `${progress * 100}%`,
            }}
          />
          <div
            style={{
              ...styles.progressThumb,
              left: `${progress * 100}%`,
            }}
          />
          {dragging && (
            <div style={{ ...styles.tooltip, left: tooltipX }}>
              {tooltipTime}
            </div>
          )}
        </div>
        <span style={styles.timeLabel}>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.2s, transform 0.2s',
  },
  progressSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  timeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    minWidth: 36,
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    background: '#334155',
    position: 'relative' as const,
    cursor: 'pointer',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    background: 'linear-gradient(90deg, #38BDF8, #7DD3FC)',
    transition: 'width 0.1s linear',
  },
  progressThumb: {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#38BDF8',
    border: '2px solid #0F172A',
    transition: 'left 0.1s linear',
  },
  tooltip: {
    position: 'absolute' as const,
    top: -28,
    transform: 'translateX(-50%)',
    background: '#334155',
    color: '#F1F5F9',
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 4,
    whiteSpace: 'nowrap' as const,
    pointerEvents: 'none' as const,
  },
};

export default AudioPlayer;
