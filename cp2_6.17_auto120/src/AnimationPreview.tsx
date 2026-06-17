import React, { useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Gauge } from 'lucide-react';
import { useAnimationStore } from './store/useAnimationStore';
import { sortKeyframes, cubicBezierToString, buildTransformString, MAX_DURATION } from './utils/animationUtils';

export const AnimationPreview: React.FC = () => {
  const keyframes = useAnimationStore((s) => s.keyframes);
  const isPlaying = useAnimationStore((s) => s.isPlaying);
  const currentTime = useAnimationStore((s) => s.currentTime);
  const playbackSpeed = useAnimationStore((s) => s.playbackSpeed);
  const config = useAnimationStore((s) => s.animationConfig);
  const setPlaying = useAnimationStore((s) => s.setPlaying);
  const setCurrentTime = useAnimationStore((s) => s.setCurrentTime);
  const setPlaybackSpeed = useAnimationStore((s) => s.setPlaybackSpeed);
  const resetAnimation = useAnimationStore((s) => s.resetAnimation);
  const setExportModalOpen = useAnimationStore((s) => s.setExportModalOpen);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(currentTime);
  const speedRef = useRef(playbackSpeed);

  useEffect(() => {
    timeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  const sortedKeyframes = useMemo(() => sortKeyframes(keyframes), [keyframes]);

  const cssKeyframes = useMemo(() => {
    if (sortedKeyframes.length === 0) return null;
    const frames = sortedKeyframes
      .map((kf) => {
        const percent = (kf.time / MAX_DURATION) * 100;
        const transform = buildTransformString(kf.transform);
        return `  ${percent.toFixed(1)}% {
    transform: ${transform};
    opacity: ${kf.opacity};
    background-color: ${kf.backgroundColor};
  }`;
      })
      .join('\n');
    return `@keyframes livePreviewAnimation {
${frames}
}`;
  }, [sortedKeyframes]);

  const animationStyle = useMemo<React.CSSProperties>(() => {
    if (isPlaying && sortedKeyframes.length > 0) {
      return {
        animation: `livePreviewAnimation ${config.duration / playbackSpeed}s ${cubicBezierToString(config.easing)} ${config.iterations}`,
        animationPlayState: 'running',
      } as React.CSSProperties;
    }
    if (sortedKeyframes.length > 0) {
      const t = currentTime;
      let prev = sortedKeyframes[0];
      let next = sortedKeyframes[sortedKeyframes.length - 1];
      for (let i = 0; i < sortedKeyframes.length - 1; i++) {
        if (t >= sortedKeyframes[i].time && t <= sortedKeyframes[i + 1].time) {
          prev = sortedKeyframes[i];
          next = sortedKeyframes[i + 1];
          break;
        }
      }
      if (t <= sortedKeyframes[0].time) {
        prev = sortedKeyframes[0];
        next = sortedKeyframes[0];
      }
      if (t >= sortedKeyframes[sortedKeyframes.length - 1].time) {
        prev = sortedKeyframes[sortedKeyframes.length - 1];
        next = sortedKeyframes[sortedKeyframes.length - 1];
      }
      const range = Math.max(0.0001, next.time - prev.time);
      const progress = Math.max(0, Math.min(1, (t - prev.time) / range));

      const lerp = (a: number, b: number) => a + (b - a) * progress;
      const lerpColor = (a: string, b: string) => {
        const parseHex = (hex: string) => {
          const h = hex.replace('#', '');
          return {
            r: parseInt(h.substring(0, 2), 16),
            g: parseInt(h.substring(2, 4), 16),
            b: parseInt(h.substring(4, 6), 16),
          };
        };
        const ca = parseHex(a);
        const cb = parseHex(b);
        const r = Math.round(lerp(ca.r, cb.r));
        const g = Math.round(lerp(ca.g, cb.g));
        const bb = Math.round(lerp(ca.b, cb.b));
        return `rgb(${r}, ${g}, ${bb})`;
      };

      return {
        transform: buildTransformString({
          translateX: lerp(prev.transform.translateX, next.transform.translateX),
          translateY: lerp(prev.transform.translateY, next.transform.translateY),
          rotate: lerp(prev.transform.rotate, next.transform.rotate),
          scale: lerp(prev.transform.scale, next.transform.scale),
        }),
        opacity: lerp(prev.opacity, next.opacity),
        backgroundColor: lerpColor(prev.backgroundColor, next.backgroundColor),
        transition: 'none',
        animation: 'none',
      } as React.CSSProperties;
    }
    return {
      transform: 'translate(0, 0) rotate(0deg) scale(1)',
      opacity: 1,
      backgroundColor: '#6C63FF',
    } as React.CSSProperties;
  }, [isPlaying, sortedKeyframes, currentTime, config, playbackSpeed]);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      timeRef.current = currentTime;
      lastTsRef.current = null;
      const tick = (ts: number) => {
        if (!isPlayingRef.current) return;
        if (lastTsRef.current === null) lastTsRef.current = ts;
        const delta = (ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;
        const newTime = timeRef.current + delta * speedRef.current;
        if (newTime >= MAX_DURATION) {
          if (config.iterations === 'infinite') {
            setCurrentTime(0);
            timeRef.current = 0;
          } else {
            setPlaying(false);
            setCurrentTime(MAX_DURATION);
            timeRef.current = MAX_DURATION;
            return;
          }
        } else {
          setCurrentTime(newTime);
          timeRef.current = newTime;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [isPlaying, config.iterations, setCurrentTime, setPlaying]);

  const progressPercent = (currentTime / MAX_DURATION) * 100;

  return (
    <div
      style={{
        flex: 2,
        backgroundColor: '#2B2B3D',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        position: 'relative',
      }}
    >
      {cssKeyframes && <style>{cssKeyframes}</style>}

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          ref={previewRef}
          style={{
            width: 200,
            height: 200,
            borderRadius: 8,
            ...animationStyle,
          }}
        />
      </div>

      <div
        style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => (isPlaying ? setPlaying(false) : setPlaying(true))}
            style={{
              width: 80,
              height: 36,
              borderRadius: 6,
              border: 'none',
              backgroundColor: isPlaying ? '#FF9800' : '#4CAF50',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isPlaying ? '#F57C00' : '#43A047';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isPlaying ? '#FF9800' : '#4CAF50';
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? '暂停' : '播放'}
          </button>

          <button
            onClick={resetAnimation}
            style={{
              width: 80,
              height: 36,
              borderRadius: 6,
              border: 'none',
              backgroundColor: '#f44336',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e53935';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f44336';
            }}
          >
            <RotateCcw size={16} />
            重置
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <Gauge size={16} style={{ color: '#E0E0E0' }} />
            <span style={{ fontSize: 12, color: '#E0E0E0' }}>{playbackSpeed.toFixed(1)}x</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              style={{
                width: 80,
                accentColor: '#6C63FF',
              }}
            />
          </div>

          <button
            onClick={() => setExportModalOpen(true)}
            style={{
              width: 120,
              height: 40,
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#2196F3',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1976D2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2196F3';
            }}
          >
            导出CSS
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              flex: 1,
              height: 6,
              backgroundColor: '#1E1E2E',
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percent = x / rect.width;
              setCurrentTime(percent * MAX_DURATION);
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: '#6C63FF',
                transition: isPlaying ? 'none' : 'width 0.1s ease-out',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#E0E0E0', minWidth: 60, textAlign: 'right' }}>
            {currentTime.toFixed(1)}s / {MAX_DURATION.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
};
