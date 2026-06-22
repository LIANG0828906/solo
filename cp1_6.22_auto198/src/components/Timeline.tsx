import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { formatDate } from '@/utils/colorUtils';

interface TimelineProps {
  days: number[];
  currentIndex: number;
  onChange: (index: number) => void;
}

export default function Timeline({ days, currentIndex, onChange }: TimelineProps) {
  const [playing, setPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % days.length;
      onChange(next);
    }, 2000);
    return () => clearInterval(id);
  }, [playing, days.length, onChange]);

  const height = isMobile ? 48 : 60;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height,
        background: 'linear-gradient(90deg, #16213E, #0F3460)',
        borderTop: '1px solid rgba(233,69,96,0.25)',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 10px' : '0 24px',
        gap: isMobile ? 10 : 20,
        zIndex: 40,
        color: '#E0E0E0',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
        <IconButton
          onClick={() => {
            onChange(Math.max(0, currentIndex - 1));
          }}
        >
          <SkipBack size={isMobile ? 14 : 16} />
        </IconButton>
        <IconButton
          onClick={() => setPlaying((p) => !p)}
          active={playing}
          wide
        >
          {playing ? <Pause size={isMobile ? 14 : 16} /> : <Play size={isMobile ? 14 : 16} />}
          {!isMobile && <span style={{ fontSize: 12, fontWeight: 600 }}>{playing ? '暂停' : '播放'}</span>}
        </IconButton>
        <IconButton
          onClick={() => {
            onChange(Math.min(days.length - 1, currentIndex + 1));
          }}
        >
          <SkipForward size={isMobile ? 14 : 16} />
        </IconButton>
      </div>

      <div style={{ flex: 1, position: 'relative', height: height - 20 }}>
        <div
          style={{
            position: 'absolute',
            top: isMobile ? 10 : 14,
            left: 0,
            right: 0,
            height: 3,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: isMobile ? 10 : 14,
            left: 0,
            width: `${(currentIndex / (days.length - 1)) * 100}%`,
            height: 3,
            background: 'linear-gradient(90deg, #E94560, #FF6B35)',
            borderRadius: 2,
            transition: 'width 0.5s ease-in-out',
          }}
        />

        {days.map((day, i) => {
          const leftPct = (i / (days.length - 1)) * 100;
          const isCurrent = i === currentIndex;
          return (
            <div
              key={day}
              style={{
                position: 'absolute',
                top: isMobile ? 5 : 6,
                left: `${leftPct}%`,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() => onChange(i)}
            >
              <div
                style={{
                  width: isCurrent ? (isMobile ? 14 : 18) : 8,
                  height: isCurrent ? (isMobile ? 14 : 18) : 8,
                  borderRadius: '50%',
                  background: isCurrent ? '#E94560' : '#533483',
                  boxShadow: isCurrent ? '0 0 12px rgba(233,69,96,0.7)' : 'none',
                  transition: 'all 0.3s ease',
                  border: '2px solid #16213E',
                }}
              />
              {!isMobile && (
                <span
                  style={{
                    position: 'absolute',
                    top: 28,
                    fontSize: 11,
                    color: isCurrent ? '#fff' : 'rgba(224,224,224,0.5)',
                    whiteSpace: 'nowrap',
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  {formatDate(day)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface IconButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  wide?: boolean;
}

function IconButton({ onClick, children, active, wide }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: wide ? '6px 14px' : 6,
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        background: active
          ? 'linear-gradient(90deg, #E94560, #FF3366)'
          : 'rgba(255,255,255,0.08)',
        color: '#fff',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(233,69,96,0.35)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      {children}
    </button>
  );
}
