import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { AnimationStep } from './presets';

interface Props {
  steps: AnimationStep[];
  isPlaying: boolean;
  speed: number;
  duration: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

function buildKeyframes(steps: AnimationStep[]): Record<number, Record<string, string>> {
  const frames: Record<number, Record<string, string>> = {};
  steps.forEach((s) => {
    if (!frames[s.percentage]) frames[s.percentage] = {};
    frames[s.percentage][s.property] = s.value;
  });
  return frames;
}

function generateKeyframesCSS(name: string, steps: AnimationStep[]): string {
  const frames = buildKeyframes(steps);
  const percentages = Object.keys(frames)
    .map(Number)
    .sort((a, b) => a - b);

  if (percentages.length === 0) return '';

  let css = `@keyframes ${name} {\n`;
  percentages.forEach((p) => {
    css += `  ${p}% {\n`;
    Object.entries(frames[p]).forEach(([prop, val]) => {
      css += `    ${prop}: ${val};\n`;
    });
    css += `  }\n`;
  });
  css += `}\n`;
  return css;
}

const AnimationPreview: React.FC<Props> = ({
  steps,
  isPlaying,
  speed,
  duration,
  onTogglePlay,
  onReset,
  onSpeedChange,
}) => {
  const animName = useRef(`anim-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  const keyframesCSS = useMemo(
    () => generateKeyframesCSS(animName.current, steps),
    [steps]
  );

  const effectiveDuration = duration / speed;

  useEffect(() => {
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = keyframesCSS;
  }, [keyframesCSS]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    box.style.animationName = animName.current;
    box.style.animationDuration = `${effectiveDuration}s`;
    box.style.animationTimingFunction = 'ease-in-out';
    box.style.animationIterationCount = 'infinite';
    box.style.animationPlayState = isPlaying ? 'running' : 'paused';

    if (isPlaying) {
      box.style.animationDelay = `-${pausedAtRef.current}s`;
    }
  }, [effectiveDuration, isPlaying, keyframesCSS]);

  const tick = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - pausedAtRef.current * 1000;
      }
      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const p = (elapsed % effectiveDuration) / effectiveDuration;
      setProgress(p);
      rafRef.current = requestAnimationFrame(tick);
    },
    [effectiveDuration]
  );

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pausedAtRef.current = progress * effectiveDuration;
      startTimeRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, tick, effectiveDuration, progress]);

  const handleReset = useCallback(() => {
    startTimeRef.current = null;
    pausedAtRef.current = 0;
    setProgress(0);
    onReset();
    const box = boxRef.current;
    if (box) {
      box.style.animationDelay = '0s';
      box.style.animation = 'none';
      box.offsetHeight;
      box.style.animation = `${animName.current} ${effectiveDuration}s ease-in-out infinite ${
        isPlaying ? 'running' : 'paused'
      }`;
    }
  }, [effectiveDuration, isPlaying, onReset]);

  return (
    <div style={styles.container}>
      <div style={styles.previewArea}>
        <div style={styles.guideBox}>
          <div ref={boxRef} style={styles.previewBox} />
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.progressWrap}>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${progress * 100}%`,
                transition: isPlaying ? 'none' : 'width 0.1s linear',
              }}
            />
          </div>
          <span style={styles.timeLabel}>
            {(progress * duration).toFixed(2)}s / {duration.toFixed(2)}s
          </span>
        </div>

        <div style={styles.controlRow}>
          <button onClick={handleReset} style={styles.resetBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button onClick={onTogglePlay} style={styles.playBtn}>
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div style={styles.speedWrap}>
            <span style={styles.speedLabel}>速度</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              style={styles.speedSlider}
            />
            <span style={styles.speedValue}>{speed.toFixed(1)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    background: '#111827',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  previewArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 20,
    overflow: 'hidden',
  },
  guideBox: {
    position: 'relative',
    padding: 30,
    border: '1px dashed #334155',
    borderRadius: 4,
  },
  previewBox: {
    width: 300,
    height: 300,
    background: '#3B82F6',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
    willChange: 'transform, opacity, filter, clip-path, border-radius, background-color',
  },
  controls: {
    padding: '16px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: 'rgba(15, 23, 42, 0.5)',
    borderTop: '1px solid #1E293B',
  },
  progressWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    background: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#A78BFA',
    borderRadius: 3,
  },
  timeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'monospace',
    minWidth: 90,
    textAlign: 'right',
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#475569',
    color: '#E2E8F0',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease-out',
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#475569',
    color: '#E2E8F0',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease-out',
  },
  speedWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginLeft: 16,
  },
  speedLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  speedSlider: {
    width: 120,
    height: 6,
    background: '#334155',
    borderRadius: 3,
    cursor: 'pointer',
    WebkitAppearance: 'none',
    appearance: 'none',
    outline: 'none',
  },
  speedValue: {
    fontSize: 12,
    color: '#E2E8F0',
    fontFamily: 'monospace',
    minWidth: 30,
  },
};

const animStyle = document.createElement('style');
animStyle.textContent = `
  [data-playbtn]:hover, [data-resetbtn]:hover { background: #6366F1 !important; }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #A78BFA;
    cursor: pointer;
    border: 2px solid #fff;
    transition: transform 0.15s ease-out;
  }
  input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); }
  input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #A78BFA;
    cursor: pointer;
    border: 2px solid #fff;
  }
`;
document.head.appendChild(animStyle);

export default AnimationPreview;
