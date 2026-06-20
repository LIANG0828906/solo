import React, { useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store';

const SPEED_MAP: Record<number, number> = {
  0.25: 4,
  0.5: 2,
  1: 1,
  2: 0.5,
  4: 0.25,
};

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];

function Preview() {
  const keyframes = useStore((s) => s.keyframes);
  const speed = useStore((s) => s.speed);
  const loopCount = useStore((s) => s.loopCount);
  const setSpeed = useStore((s) => s.setSpeed);
  const incrementLoopCount = useStore((s) => s.incrementLoopCount);
  const resetLoopCount = useStore((s) => s.resetLoopCount);
  const animationName = useStore((s) => s.animationName);
  const styleElRef = useRef<HTMLStyleElement | null>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const loopCountRef = useRef(0);
  const animNameRef = useRef(animationName);

  const generatedCSS = useStore((s) => s.generateCSS);

  const dynamicKeyframes = useMemo(() => {
    return generatedCSS();
  }, [keyframes, generatedCSS]);

  useEffect(() => {
    if (!styleElRef.current) {
      styleElRef.current = document.createElement('style');
      document.head.appendChild(styleElRef.current);
    }
    styleElRef.current.textContent = dynamicKeyframes;
    return () => {
      if (styleElRef.current && styleElRef.current.parentNode) {
        styleElRef.current.parentNode.removeChild(styleElRef.current);
        styleElRef.current = null;
      }
    };
  }, [dynamicKeyframes]);

  useEffect(() => {
    const cube = cubeRef.current;
    if (!cube) return;

    resetLoopCount();
    loopCountRef.current = 0;

    const duration = SPEED_MAP[speed] || 1;
    cube.style.animation = 'none';
    void cube.offsetHeight;
    cube.style.animation = `${animationName} ${duration}s linear infinite`;
    cube.style.filter = speed >= 2 ? 'blur(0.5px)' : 'none';

    const handleIter = () => {
      loopCountRef.current += 1;
      incrementLoopCount();
    };

    cube.addEventListener('animationiteration', handleIter);
    return () => {
      cube.removeEventListener('animationiteration', handleIter);
    };
  }, [speed, animationName, dynamicKeyframes, resetLoopCount, incrementLoopCount]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="panel-card">
        <div className="panel-title">动画预览</div>
        <div className="preview-area">
          <div className="cube-scene">
            <div className="cube" ref={cubeRef}>
              <div className="cube-face front">前</div>
              <div className="cube-face back">后</div>
              <div className="cube-face right">右</div>
              <div className="cube-face left">左</div>
              <div className="cube-face top">顶</div>
              <div className="cube-face bottom">底</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-title">速度控制</div>
        <div className="speed-controls">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              className={`speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
        <div className="loop-counter">
          循环次数: <span>{loopCount}</span>
        </div>
      </div>
    </div>
  );
}

export default Preview;
