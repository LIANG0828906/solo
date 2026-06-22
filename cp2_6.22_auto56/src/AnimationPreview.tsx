import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface KeyframeData {
  id: string;
  time: number;
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotate: number;
}

interface AnimationPreviewProps {
  cp1: [number, number];
  cp2: [number, number];
  keyframes: KeyframeData[];
  isPlaying: boolean;
  onPlayToggle: () => void;
  duration: number;
  onProgressChange: (progress: number) => void;
}

type ElementType = 'square' | 'circle' | 'text';

function generateKeyframesCSS(keyframes: KeyframeData[]): string {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  const frames = sorted.map((kf) => {
    const percent = Math.round(kf.time * 100);
    const transform = `translateX(${kf.translateX}px) translateY(${kf.translateY}px) scale(${kf.scale}) rotate(${kf.rotate}deg)`;
    return `  ${percent}% {\n    opacity: ${kf.opacity};\n    transform: ${transform};\n  }`;
  });
  return `@keyframes bezierAnimation {\n${frames.join('\n')}\n}`;
}

function generateAnimationCSS(
  cp1: [number, number],
  cp2: [number, number],
  duration: number
): string {
  return `animation: bezierAnimation ${duration}ms cubic-bezier(${cp1[0]}, ${cp1[1]}, ${cp2[0]}, ${cp2[1]}) infinite;`;
}

function interpolateValue(
  keyframes: KeyframeData[],
  progress: number,
  prop: keyof KeyframeData
): number {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (sorted.length === 0) return 0;
  if (progress <= sorted[0].time) return Number(sorted[0][prop]);
  if (progress >= sorted[sorted.length - 1].time)
    return Number(sorted[sorted.length - 1][prop]);

  let prev = sorted[0];
  let next = sorted[1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (progress >= sorted[i].time && progress <= sorted[i + 1].time) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }

  const range = next.time - prev.time;
  if (range === 0) return Number(prev[prop]);
  const t = (progress - prev.time) / range;
  return Number(prev[prop]) + (Number(next[prop]) - Number(prev[prop])) * t;
}

const AnimationPreview: React.FC<AnimationPreviewProps> = ({
  cp1,
  cp2,
  keyframes,
  isPlaying,
  onPlayToggle,
  duration,
  onProgressChange,
}) => {
  const [elementType, setElementType] = useState<ElementType>('square');
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const interpolatedStyle = useMemo(() => {
    const opacity = interpolateValue(keyframes, progress, 'opacity');
    const translateX = interpolateValue(keyframes, progress, 'translateX');
    const translateY = interpolateValue(keyframes, progress, 'translateY');
    const scale = interpolateValue(keyframes, progress, 'scale');
    const rotate = interpolateValue(keyframes, progress, 'rotate');
    return {
      opacity,
      transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
    };
  }, [keyframes, progress]);

  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = (elapsed % duration) / duration;
      setProgress(rawProgress);
      onProgressChange(rawProgress);
      rafRef.current = requestAnimationFrame(animate);
    },
    [duration, onProgressChange]
  );

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, animate]);

  const keyframesCSS = useMemo(() => generateKeyframesCSS(keyframes), [keyframes]);
  const animationCSS = useMemo(
    () => generateAnimationCSS(cp1, cp2, duration),
    [cp1, cp2, duration]
  );
  const fullCSS = `${keyframesCSS}\n\n.animated-element {\n  ${animationCSS}\n}`;

  const handleCopyCSS = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullCSS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullCSS;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullCSS]);

  const renderPreviewElement = () => {
    const baseStyle: React.CSSProperties = {
      ...interpolatedStyle,
      transition: 'none',
    };

    switch (elementType) {
      case 'square':
        return (
          <div
            style={{
              ...baseStyle,
              width: 60,
              height: 60,
              backgroundColor: '#00ff88',
              borderRadius: 4,
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)',
            }}
          />
        );
      case 'circle':
        return (
          <div
            style={{
              ...baseStyle,
              width: 64,
              height: 64,
              backgroundColor: '#00d4ff',
              borderRadius: '50%',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
            }}
          />
        );
      case 'text':
        return (
          <div
            style={{
              ...baseStyle,
              color: '#ffffff',
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'monospace',
              textShadow: '0 0 12px rgba(0, 212, 255, 0.6)',
              whiteSpace: 'nowrap',
            }}
          >
            Aa
          </div>
        );
    }
  };

  const elementTypes: ElementType[] = ['square', 'circle', 'text'];

  return (
    <div
      style={{
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#e0e0e0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {elementTypes.map((type) => (
            <button
              key={type}
              onClick={() => setElementType(type)}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                textTransform: 'capitalize' as const,
                backgroundColor:
                  elementType === type ? '#00ff88' : '#2a2a4a',
                color: elementType === type ? '#1a1a2e' : '#aaa',
                transition: 'background-color 0.2s, color 0.2s, box-shadow 0.2s',
                boxShadow:
                  elementType === type
                    ? '0 0 12px rgba(0, 255, 136, 0.3)'
                    : 'none',
              }}
              onMouseEnter={(e) => {
                if (elementType !== type) {
                  e.currentTarget.style.backgroundColor = '#3a3a5a';
                  e.currentTarget.style.boxShadow =
                    '0 0 8px rgba(0, 212, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (elementType !== type) {
                  e.currentTarget.style.backgroundColor = '#2a2a4a';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onPlayToggle}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: isPlaying ? '#ff4466' : '#00d4ff',
              color: '#1a1a2e',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = isPlaying
                ? '0 0 12px rgba(255, 68, 102, 0.4)'
                : '0 0 12px rgba(0, 212, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={handleCopyCSS}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: copied ? '#00ff88' : '#2a2a4a',
              color: copied ? '#1a1a2e' : '#e0e0e0',
              transition: 'background-color 0.2s, color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.boxShadow =
                  '0 0 12px rgba(0, 255, 136, 0.3)';
                e.currentTarget.style.backgroundColor = '#3a3a5a';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              if (!copied) {
                e.currentTarget.style.backgroundColor = '#2a2a4a';
              }
            }}
          >
            {copied ? 'Copied!' : 'Copy CSS'}
          </button>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          backgroundColor: '#12122a',
          borderRadius: 8,
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundImage:
            'linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {renderPreviewElement()}

        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            fontFamily: 'monospace',
          }}
        >
          {Math.round(progress * 100)}%
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          height: 4,
          backgroundColor: '#2a2a4a',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: '#00ff88',
            borderRadius: 2,
            transition: isPlaying ? 'none' : 'width 0.1s',
            boxShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
          }}
        />
      </div>

      <div
        style={{
          backgroundColor: '#0d0d1f',
          borderRadius: 8,
          padding: 16,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          maxHeight: 200,
          overflow: 'auto',
        }}
      >
        <pre
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.6,
            fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
            color: '#c0c0c0',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          <span style={{ color: '#ff79c6' }}>@keyframes</span>
          <span style={{ color: '#00d4ff' }}> bezierAnimation</span>
          {' {\n'}
          {[...keyframes]
            .sort((a, b) => a.time - b.time)
            .map((kf, i) => (
              <span key={kf.id}>
                {'  '}
                <span style={{ color: '#bd93f9' }}>
                  {Math.round(kf.time * 100)}%
                </span>
                {' {\n'}
                {'    '}
                <span style={{ color: '#50fa7b' }}>opacity</span>
                {': '}
                <span style={{ color: '#f1fa8c' }}>{kf.opacity}</span>
                {';\n'}
                {'    '}
                <span style={{ color: '#50fa7b' }}>transform</span>
                {': '}
                <span style={{ color: '#f1fa8c' }}>
                  translateX({kf.translateX}px) translateY({kf.translateY}px)
                  scale({kf.scale}) rotate({kf.rotate}deg)
                </span>
                {';\n'}
                {'  }'}
                {i < keyframes.length - 1 ? '\n' : ''}
              </span>
            ))}
          {'\n}\n\n'}
          <span style={{ color: '#ff79c6' }}>.animated-element</span>
          {' {\n'}
          {'  '}
          <span style={{ color: '#50fa7b' }}>animation</span>
          {': '}
          <span style={{ color: '#00d4ff' }}>bezierAnimation</span>{' '}
          <span style={{ color: '#f1fa8c' }}>{duration}ms</span>{' '}
          <span style={{ color: '#ff79c6' }}>
            cubic-bezier({cp1[0]}, {cp1[1]}, {cp2[0]}, {cp2[1]})
          </span>{' '}
          <span style={{ color: '#00d4ff' }}>infinite</span>
          {';\n}'}
        </pre>
      </div>
    </div>
  );
};

export default AnimationPreview;
