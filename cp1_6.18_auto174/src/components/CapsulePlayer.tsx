import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Capsule } from '../../shared/types';
import { useCapsuleStore } from '../stores/capsuleStore';
import { EMOTION_COLORS } from '../engine/capsuleEngine';

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  color: string;
  size: number;
  progress: number;
  delay: number;
  vx: number;
  vy: number;
}

const CapsulePlayer: React.FC = () => {
  const playingCapsule = useCapsuleStore((s) => s.playingCapsule);
  const setPlayingCapsule = useCapsuleStore((s) => s.setPlayingCapsule);
  const markAsRead = useCapsuleStore((s) => s.markAsRead);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [bgProgress, setBgProgress] = useState(0);
  const [phase, setPhase] = useState<'entering' | 'text' | 'particles' | 'done'>('entering');
  const imageDataRef = useRef<ImageData | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastTimeRef = useRef<number>(0);

  const closePlayer = useCallback(() => {
    if (playingCapsule && playingCapsule.status === 'opened') {
      markAsRead(playingCapsule.id);
    }
    setPlayingCapsule(null);
    setDisplayText('');
    setTextIndex(0);
    setBgProgress(0);
    setPhase('entering');
    particlesRef.current = [];
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [playingCapsule, setPlayingCapsule, markAsRead]);

  useEffect(() => {
    if (!playingCapsule) return;

    const color = EMOTION_COLORS[playingCapsule.emotion];

    const loadImageAndInitParticles = async () => {
      if (playingCapsule.imageBase64) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const offscreen = document.createElement('canvas');
            const maxSize = 400;
            let w = img.width;
            let h = img.height;
            if (w > h) {
              if (w > maxSize) {
                h = (h * maxSize) / w;
                w = maxSize;
              }
            } else {
              if (h > maxSize) {
                w = (w * maxSize) / h;
                h = maxSize;
              }
            }
            offscreen.width = w;
            offscreen.height = h;
            const ctx = offscreen.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              imageDataRef.current = ctx.getImageData(0, 0, w, h);
              offscreenCanvasRef.current = offscreen;
              initParticles(w, h, color);
            }
          };
          img.src = playingCapsule.imageBase64;
        } catch (e) {
          console.error('Failed to load image:', e);
        }
      }
    };

    const initParticles = (imgWidth: number, imgHeight: number, color: string) => {
      const imageData = imageDataRef.current;
      if (!imageData) return;

      const particles: Particle[] = [];
      const data = imageData.data;
      const area = imgWidth * imgHeight;
      const particleCount = Math.floor(area / 100);
      const step = Math.floor(Math.sqrt(area / particleCount));

      const canvas = canvasRef.current;
      const centerX = canvas ? canvas.width / 2 : 400;
      const centerY = canvas ? canvas.height / 2 : 300;

      for (let y = 0; y < imgHeight; y += step) {
        for (let x = 0; x < imgWidth; x += step) {
          const idx = (y * imgWidth + x) * 4;
          const alpha = data[idx + 3];
          if (alpha > 50) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const startX = centerX + (Math.random() - 0.5) * 600;
            const startY = centerY + (Math.random() - 0.5) * 400;
            const targetX = centerX - imgWidth / 2 + x;
            const targetY = centerY - imgHeight / 2 + y - 50;

            particles.push({
              x: startX,
              y: startY,
              targetX,
              targetY,
              startX,
              startY,
              color: `rgb(${r},${g},${b})`,
              size: step * 0.8,
              progress: 0,
              delay: Math.random() * 0.5,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
            });
          }
        }
      }
      particlesRef.current = particles;
    };

    const startTime = performance.now();
    startTimeRef.current = startTime;
    lastTimeRef.current = startTime;

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const delta = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      if (elapsed < 1.5) {
        const progress = Math.min(1, elapsed / 1.5);
        setBgProgress(progress);
        setPhase('entering');
      } else if (phase !== 'done') {
        setBgProgress(1);

        const textElapsed = elapsed - 1.5;
        if (textElapsed >= 0 && playingCapsule.text) {
          const charInterval = 0.08;
          const newIndex = Math.min(
            playingCapsule.text.length,
            Math.floor(textElapsed / charInterval)
          );
          if (newIndex !== textIndex) {
            setTextIndex(newIndex);
            setDisplayText(playingCapsule.text.slice(0, newIndex));
          }
          setPhase('text');
        }

        const particleElapsed = elapsed - 2.5;
        if (particleElapsed >= 0 && particlesRef.current.length > 0) {
          setPhase('particles');
          const duration = 2;
          const t = Math.min(1, particleElapsed / duration);

          particlesRef.current.forEach((p) => {
            const particleT = Math.max(0, Math.min(1, (particleElapsed - p.delay) / (duration - p.delay)));
            const easeT = 1 - Math.pow(1 - particleT, 3);

            if (particleT < 0.5) {
              p.x = p.startX + p.vx * particleT * 200;
              p.y = p.startY + p.vy * particleT * 200;
            } else {
              const gatherT = (particleT - 0.5) * 2;
              const easeGather = 1 - Math.pow(1 - gatherT, 3);
              p.x = p.startX + p.vx * 100 + (p.targetX - p.startX - p.vx * 100) * easeGather;
              p.y = p.startY + p.vy * 100 + (p.targetY - p.startY - p.vy * 100) * easeGather;
            }
            p.progress = easeT;
          });

          if (t >= 1) {
            setPhase('done');
          }
        }
      }

      drawParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    const drawParticles = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (phase === 'particles' || phase === 'done') {
        particlesRef.current.forEach((p) => {
          if (p.progress > 0) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(1, p.progress * 2);
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          }
        });
        ctx.globalAlpha = 1;
      }
    };

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    loadImageAndInitParticles();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playingCapsule, phase, textIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePlayer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePlayer]);

  if (!playingCapsule) return null;

  const emotionColor = EMOTION_COLORS[playingCapsule.emotion];
  const startColor = '#1A1A2E';
  const endColor = emotionColor;

  const lerpColor = (a: string, b: string, t: number) => {
    const ah = parseInt(a.replace('#', ''), 16);
    const bh = parseInt(b.replace('#', ''), 16);
    const ar = (ah >> 16) & 255;
    const ag = (ah >> 8) & 255;
    const ab = ah & 255;
    const br = (bh >> 16) & 255;
    const bg = (bh >> 8) & 255;
    const bb = bh & 255;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return `rgb(${rr}, ${rg}, ${rb})`;
  };

  const bgColor = lerpColor(startColor, endColor, bgProgress * 0.3);

  return (
    <div
      style={{
        ...overlayStyle,
        backgroundColor: bgColor,
      }}
      onClick={closePlayer}
    >
      <canvas ref={canvasRef} style={canvasStyle} />

      <div style={contentContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            ...textContainerStyle,
            opacity: bgProgress,
            transform: `translateY(${(1 - bgProgress) * 30}px)`,
          }}
        >
          <p style={textStyle}>{displayText}</p>
          {(phase === 'text' || phase === 'particles') && displayText.length < playingCapsule.text.length && (
            <span style={cursorStyle}>|</span>
          )}
        </div>
      </div>

      <button style={closeBtnStyle} onClick={closePlayer}>
        ✕ 关闭 (ESC)
      </button>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1000,
  transition: 'background-color 1.5s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const canvasStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
};

const contentContainerStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 10,
  maxWidth: '600px',
  width: '80%',
  pointerEvents: 'auto',
};

const textContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
  marginTop: '200px',
};

const textStyle: React.CSSProperties = {
  color: '#E0E0E0',
  fontSize: '22px',
  lineHeight: 1.8,
  letterSpacing: '1px',
  display: 'inline',
};

const cursorStyle: React.CSSProperties = {
  color: '#E0E0E0',
  fontSize: '24px',
  marginLeft: '2px',
  animation: 'pulse 0.8s ease-in-out infinite',
};

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '24px',
  right: '24px',
  backgroundColor: 'rgba(255,255,255,0.1)',
  color: '#E0E0E0',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  padding: '10px 20px',
  fontSize: '14px',
  cursor: 'pointer',
  zIndex: 20,
  transition: 'all 0.3s ease-in-out',
};

export default CapsulePlayer;
