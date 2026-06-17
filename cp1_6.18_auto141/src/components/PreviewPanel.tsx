import { useEffect, useRef, useMemo, type CSSProperties } from 'react';
import { useAnimationStore } from '@/stores/animationStore';
import type { PlaybackSpeed, AnimatableElement, KeyframeNode } from '@/types';
import { bezierFromPoints, lerpValue } from '@/utils/easing';

interface ComputedStyle {
  transform: string;
  opacity: number;
  backgroundColor: string;
  width: number;
  height: number;
  borderRadius: number;
  boxShadow?: string;
}

function computeElementStyle(
  element: AnimatableElement,
  kfs: KeyframeNode[],
  currentTime: number,
): ComputedStyle {
  const base: ComputedStyle = {
    transform: 'translate(0px, 0px) rotate(0deg) scale(1, 1)',
    opacity: 1,
    backgroundColor: element.color,
    width: Number(element.initialStyles.width) || 200,
    height: Number(element.initialStyles.height) || 200,
    borderRadius: Number(element.initialStyles.borderRadius) || 12,
  };

  const sorted = [...kfs]
    .filter((k) => k.elementId === element.id)
    .sort((a, b) => a.time - b.time);

  if (sorted.length === 0) return base;
  if (sorted.length === 1 || currentTime <= sorted[0].time) {
    return applyProperties(base, sorted[0].properties);
  }
  if (currentTime >= sorted[sorted.length - 1].time) {
    return applyProperties(base, sorted[sorted.length - 1].properties);
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (currentTime >= a.time && currentTime <= b.time) {
      const segDur = b.time - a.time;
      const rawT = segDur > 0 ? (currentTime - a.time) / segDur : 0;
      const eased = bezierFromPoints(a.easing)(rawT);
      return interpolateStyles(
        applyProperties({ ...base }, a.properties),
        applyProperties({ ...base }, b.properties),
        a.properties,
        b.properties,
        eased,
      );
    }
  }
  return base;
}

function applyProperties(
  s: ComputedStyle,
  props: Record<string, string | number>,
): ComputedStyle {
  let tx = 0;
  let ty = 0;
  let rot = 0;
  let sx = 1;
  let sy = 1;

  for (const [key, val] of Object.entries(props)) {
    const v = typeof val === 'string' ? parseFloat(val) : val;
    const isNum = typeof val === 'number' || !isNaN(v);
    switch (key) {
      case 'transform.translateX':
        tx = isNum ? v : 0;
        break;
      case 'transform.translateY':
        ty = isNum ? v : 0;
        break;
      case 'transform.rotate':
        rot = isNum ? v : 0;
        break;
      case 'transform.scale':
        sx = isNum ? v : 1;
        sy = sx;
        break;
      case 'transform.scaleX':
        sx = isNum ? v : 1;
        break;
      case 'transform.scaleY':
        sy = isNum ? v : 1;
        break;
      case 'opacity':
        s.opacity = isNum ? Math.max(0, Math.min(1, v)) : 1;
        break;
      case 'background-color':
        s.backgroundColor = String(val);
        break;
      case 'width':
        s.width = isNum ? v : 200;
        break;
      case 'height':
        s.height = isNum ? v : 200;
        break;
      case 'border-radius':
        s.borderRadius = isNum ? v : 12;
        break;
      case 'box-shadow':
        s.boxShadow = String(val);
        break;
    }
  }

  s.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sx}, ${sy})`;
  return s;
}

function interpolateStyles(
  a: ComputedStyle,
  b: ComputedStyle,
  propsA: Record<string, string | number>,
  propsB: Record<string, string | number>,
  t: number,
): ComputedStyle {
  const res: ComputedStyle = {
    opacity: lerpValue(a.opacity, b.opacity, t) as number,
    backgroundColor: lerpValue(a.backgroundColor, b.backgroundColor, t) as string,
    width: lerpValue(a.width, b.width, t) as number,
    height: lerpValue(a.height, b.height, t) as number,
    borderRadius: lerpValue(a.borderRadius, b.borderRadius, t) as number,
    transform: '',
  };

  const keys = new Set([...Object.keys(propsA), ...Object.keys(propsB)]);
  const num = (k: string): number => {
    const va = propsA[k];
    const vb = propsB[k];
    const aVal =
      va === undefined
        ? k.startsWith('transform.scale')
          ? 1
          : 0
        : typeof va === 'number'
          ? va
          : parseFloat(String(va));
    const bVal =
      vb === undefined
        ? k.startsWith('transform.scale')
          ? 1
          : 0
        : typeof vb === 'number'
          ? vb
          : parseFloat(String(vb));
    return lerpValue(aVal, bVal, t) as number;
  };

  const tx = num('transform.translateX');
  const ty = num('transform.translateY');
  const rot = num('transform.rotate');
  const hasScale =
    keys.has('transform.scale') ||
    keys.has('transform.scaleX') ||
    keys.has('transform.scaleY');
  let sx = 1;
  let sy = 1;
  if (hasScale) {
    sx = keys.has('transform.scaleX')
      ? num('transform.scaleX')
      : num('transform.scale');
    sy = keys.has('transform.scaleY')
      ? num('transform.scaleY')
      : num('transform.scale');
  }

  res.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sx}, ${sy})`;

  if (keys.has('box-shadow')) {
    res.boxShadow = (t < 0.5 ? propsA['box-shadow'] : propsB['box-shadow']) as string;
  }

  return res;
}

function formatTime(ms: number): string {
  const s = ms / 1000;
  return `${s.toFixed(2)}s`;
}

export default function PreviewPanel() {
  const {
    elements,
    keyframes,
    timeline,
    play,
    pause,
    stop,
    setPlaybackSpeed,
    setCurrentTime,
    setTimelineDuration,
  } = useAnimationStore();

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeline.playState !== 'playing') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const dt = (now - lastTimeRef.current) * timeline.playbackSpeed;
      lastTimeRef.current = now;

      let next = timeline.currentTime + dt;
      if (next >= timeline.duration) {
        next = 0;
      }
      setCurrentTime(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    timeline.playState,
    timeline.playbackSpeed,
    timeline.currentTime,
    timeline.duration,
    setCurrentTime,
  ]);

  const computedStyles = useMemo(() => {
    const map: Record<string, ComputedStyle> = {};
    for (const el of elements) {
      map[el.id] = computeElementStyle(el, keyframes, timeline.currentTime);
    }
    return map;
  }, [elements, keyframes, timeline.currentTime]);

  const togglePlay = () => {
    if (timeline.playState === 'playing') {
      pause();
    } else {
      play();
    }
  };

  const speeds: PlaybackSpeed[] = [0.5, 1, 2];

  return (
    <div className="preview-section">
      <div className="preview-panel">
        <div className="preview-grid" />
        <div className="preview-targets">
          {elements.map((el) => {
            const s = computedStyles[el.id];
            const style: CSSProperties = {
              width: s.width,
              height: s.height,
              backgroundColor: s.backgroundColor,
              borderRadius: s.borderRadius,
              opacity: s.opacity,
              transform: s.transform,
              boxShadow: s.boxShadow
                ? s.boxShadow
                : `0 8px 32px ${el.color}33`,
              transition: 'none',
            };
            return <div key={el.id} className="preview-element" style={style} />;
          })}
        </div>
      </div>

      <div className="controls-bar">
        <div className="playback-buttons">
          <button
            className={`btn-play ${timeline.playState === 'playing' ? 'active' : ''}`}
            onClick={togglePlay}
            title={timeline.playState === 'playing' ? '暂停' : '播放'}
          >
            {timeline.playState === 'playing' ? '❚❚' : '▶'}
          </button>
          <button className="btn-play" onClick={stop} title="停止">
            ■
          </button>
        </div>

        <div className="speed-selector">
          {speeds.map((s) => (
            <button
              key={s}
              className={`speed-btn ${timeline.playbackSpeed === s ? 'active' : ''}`}
              onClick={() => setPlaybackSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="time-display">
          {formatTime(timeline.currentTime)} / {formatTime(timeline.duration)}
        </div>

        <div className="duration-control">
          <span className="duration-label">时长</span>
          <input
            type="number"
            className="duration-input"
            min={1}
            max={10}
            step={0.5}
            value={timeline.duration / 1000}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) setTimelineDuration(v * 1000);
            }}
          />
          <span className="duration-label">秒</span>
        </div>
      </div>
    </div>
  );
}
