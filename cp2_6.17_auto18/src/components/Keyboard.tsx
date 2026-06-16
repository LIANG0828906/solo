import React, { useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { getWhiteKeys, getBlackKeys, getKeyFromKeyboard } from '../utils/audio';

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  startTime: number;
  duration: number;
}

const PARTICLE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1'];

const Keyboard: React.FC = () => {
  const pressedKeys = useStore(state => state.pressedKeys);
  const tone = useStore(state => state.tone);
  const pressKey = useStore(state => state.pressKey);
  const releaseKey = useStore(state => state.releaseKey);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const particleIdRef = useRef(0);
  const keyboardRef = useRef<HTMLDivElement>(null);

  const whiteKeys = getWhiteKeys();
  const blackKeys = getBlackKeys();

  const WHITE_KEY_WIDTH = 48;
  const BLACK_KEY_WIDTH = 30;
  const WHITE_KEY_HEIGHT = 160;
  const BLACK_KEY_HEIGHT = 100;

  const getToneColor = useCallback((isWhite: boolean, isPressed: boolean) => {
    if (isWhite) {
      if (isPressed) return '#AED6F1';
      if (tone === 'piano') return 'linear-gradient(180deg, #FAFAFA 0%, #E0E0E0 100%)';
      if (tone === 'guitar') return 'linear-gradient(180deg, #F5CBA7 0%, #DCB897 100%)';
      if (tone === 'synth') return 'linear-gradient(180deg, #D6EAF8 0%, #AED6F1 100%)';
    } else {
      if (isPressed) return '#2E4053';
      return 'linear-gradient(180deg, #4A4A4A 0%, #1A1A1A 100%)';
    }
    return isWhite ? '#FAFAFA' : '#333';
  }, [tone]);

  const spawnParticle = useCallback((note: string, keyElement: HTMLElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = keyElement.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const startX = rect.left - canvasRect.left + rect.width / 2;
    const startY = rect.top - canvasRect.top + rect.height / 2;

    const targetX = canvas.width / 2 + (Math.random() - 0.5) * 100;
    const targetY = canvas.height - 60 + (Math.random() - 0.5) * 40;

    const particle: Particle = {
      id: particleIdRef.current++,
      x: startX,
      y: startY,
      targetX,
      targetY,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      startTime: performance.now(),
      duration: 600,
    };

    particlesRef.current.push(particle);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = performance.now();
      particlesRef.current = particlesRef.current.filter(p => {
        const elapsed = now - p.startTime;
        if (elapsed >= p.duration) return false;

        const t = elapsed / p.duration;
        const easeOut = 1 - Math.pow(1 - t, 3);
        const currentX = p.x + (p.targetX - p.x) * easeOut;
        const arcHeight = 80;
        const arcY = -4 * arcHeight * t * (t - 1);
        const currentY = p.y + (p.targetY - p.y) * easeOut - arcY;

        const alpha = 1 - t;
        const radius = 8 * (1 - t * 0.5);

        ctx.save();
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const note = getKeyFromKeyboard(e.key);
      if (note) {
        pressKey(note);
        const keyEl = document.querySelector(`[data-note="${note}"]`);
        if (keyEl) {
          spawnParticle(note, keyEl as HTMLElement);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = getKeyFromKeyboard(e.key);
      if (note) {
        releaseKey(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pressKey, releaseKey, spawnParticle]);

  const handleMouseDown = (note: string, e: React.MouseEvent) => {
    e.preventDefault();
    pressKey(note);
    spawnParticle(note, e.currentTarget as HTMLElement);
  };

  const handleMouseUp = (note: string) => {
    releaseKey(note);
  };

  const handleMouseLeave = (note: string) => {
    if (pressedKeys.has(note)) {
      releaseKey(note);
    }
  };

  const getBlackKeyOffset = (note: string): number => {
    const whiteKeyIndex = whiteKeys.findIndex(k => k === note.replace('#', ''));
    if (whiteKeyIndex === -1) return 0;
    return whiteKeyIndex * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;
  };

  const keyboardWidth = whiteKeys.length * WHITE_KEY_WIDTH;

  return (
    <div className="keyboard-wrapper" style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={keyboardWidth + 100}
        height={WHITE_KEY_HEIGHT + 120}
        style={{
          position: 'absolute',
          top: -60,
          left: -50,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
      <div
        ref={keyboardRef}
        className="piano-keyboard"
        style={{
          position: 'relative',
          width: keyboardWidth,
          height: WHITE_KEY_HEIGHT,
          margin: '0 auto',
          userSelect: 'none',
        }}
      >
        {whiteKeys.map((note, index) => (
          <div
            key={note}
            data-note={note}
            className="white-key"
            onMouseDown={(e) => handleMouseDown(note, e)}
            onMouseUp={() => handleMouseUp(note)}
            onMouseLeave={() => handleMouseLeave(note)}
            onTouchStart={(e) => {
              e.preventDefault();
              pressKey(note);
              spawnParticle(note, e.currentTarget as HTMLElement);
            }}
            onTouchEnd={() => releaseKey(note)}
            style={{
              position: 'absolute',
              left: index * WHITE_KEY_WIDTH,
              top: 0,
              width: WHITE_KEY_WIDTH,
              height: WHITE_KEY_HEIGHT,
              background: getToneColor(true, pressedKeys.has(note)),
              border: '1px solid #999',
              borderRadius: '0 0 6px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 10,
              fontSize: 12,
              color: '#666',
              transition: 'background 0.15s ease, transform 0.1s ease',
              boxShadow: pressedKeys.has(note)
                ? 'inset 0 4px 8px rgba(0,0,0,0.2)'
                : '0 2px 4px rgba(0,0,0,0.1)',
              transform: pressedKeys.has(note) ? 'translateY(2px)' : 'translateY(0)',
              zIndex: 1,
            }}
          >
            {note}
          </div>
        ))}

        {blackKeys.map((note) => (
          <div
            key={note}
            data-note={note}
            className="black-key"
            onMouseDown={(e) => handleMouseDown(note, e)}
            onMouseUp={() => handleMouseUp(note)}
            onMouseLeave={() => handleMouseLeave(note)}
            onTouchStart={(e) => {
              e.preventDefault();
              pressKey(note);
            }}
            onTouchEnd={() => releaseKey(note)}
            style={{
              position: 'absolute',
              left: getBlackKeyOffset(note),
              top: 0,
              width: BLACK_KEY_WIDTH,
              height: BLACK_KEY_HEIGHT,
              background: getToneColor(false, pressedKeys.has(note)),
              border: '1px solid #222',
              borderRadius: '0 0 4px 4px',
              cursor: 'pointer',
              transition: 'background 0.15s ease, box-shadow 0.1s ease',
              boxShadow: pressedKeys.has(note)
                ? 'inset 0 4px 8px rgba(0,0,0,0.6)'
                : '0 3px 6px rgba(0,0,0,0.4)',
              transform: pressedKeys.has(note) ? 'translateY(2px)' : 'translateY(0)',
              zIndex: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Keyboard;
