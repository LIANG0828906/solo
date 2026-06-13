import React, { useRef, useEffect, useState, useCallback } from 'react';

interface MoodWheelProps {
  onMoodSelect: (mood: string, label: string, color: string) => void;
}

interface MoodConfig {
  key: string;
  label: string;
  color: string;
  desc: string;
}

interface Particle {
  angle: number;
  radius: number;
  size: number;
  opacity: number;
  speed: number;
}

const MOODS: MoodConfig[] = [
  { key: 'happy', label: '开心', color: '#FFD93D', desc: '阳光灿烂，心情愉悦' },
  { key: 'calm', label: '平静', color: '#98FB98', desc: '内心宁静，岁月静好' },
  { key: 'anxious', label: '焦虑', color: '#8E8E9E', desc: '心情紧张，需要安抚' },
  { key: 'nostalgic', label: '怀旧', color: '#C68642', desc: '回忆涌上，思绪万千' },
  { key: 'angry', label: '愤怒', color: '#DC143C', desc: '怒火中烧，需要宣泄' },
];

const BASE_CANVAS_SIZE = 380;
const BASE_WHEEL_RADIUS = 150;
const SLICE_ANGLE = (2 * Math.PI) / MOODS.length;
const START_ANGLE = -Math.PI / 2 - SLICE_ANGLE / 2;

const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const lightenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * percent));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * percent));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * percent));
  return `rgb(${r}, ${g}, ${b})`;
};

const MoodWheel: React.FC<MoodWheelProps> = ({ onMoodSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodConfig | null>(null);
  const [canvasSize, setCanvasSize] = useState<number>(BASE_CANVAS_SIZE);
  const displayMood = hoveredIndex !== null ? MOODS[hoveredIndex] : selectedMood;

  const wheelRadius = (canvasSize / BASE_CANVAS_SIZE) * BASE_WHEEL_RADIUS;

  const bounceRef = useRef<{
    active: boolean;
    sliceIndex: number;
    startTime: number;
    duration: number;
  } | null>(null);

  const particlesRef = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
    particles: Particle[];
    color: string;
  } | null>(null);

  const animFrameRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      const width = entry.contentRect.width;
      const size = Math.max(200, Math.min(BASE_CANVAS_SIZE, width - 32));
      setCanvasSize(Math.floor(size));
    };

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(container);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  const getMousePosition = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const hitTest = useCallback(
    (x: number, y: number, size: number, radius: number): number | null => {
      const cx = size / 2;
      const cy = size / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius || dist < 10) return null;

      let angle = Math.atan2(dy, dx) - START_ANGLE;
      while (angle < 0) angle += 2 * Math.PI;
      while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;

      const idx = Math.floor(angle / SLICE_ANGLE);
      return idx >= 0 && idx < MOODS.length ? idx : null;
    },
    []
  );

  const drawSlice = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      color: string,
      glow: boolean,
      scale: number
    ) => {
      const r = radius * scale;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      if (glow) {
        ctx.save();
        ctx.shadowColor = lightenColor(color, 0.3);
        ctx.shadowBlur = 25;
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = lightenColor(color, 0.5);
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    },
    []
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvasSize;
    const radius = wheelRadius;

    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    let bounceScale = 1;
    let bounceIdx = -1;
    if (bounceRef.current && bounceRef.current.active) {
      const elapsed = performance.now() - bounceRef.current.startTime;
      const t = Math.min(1, elapsed / bounceRef.current.duration);
      const eased = easeOutBack(t);
      bounceScale = 1 + 0.2 * (1 - Math.abs(eased - 1));
      bounceIdx = bounceRef.current.sliceIndex;
    }

    MOODS.forEach((mood, i) => {
      const start = START_ANGLE + i * SLICE_ANGLE;
      const end = start + SLICE_ANGLE;
      const isHovered = hoveredIndex === i;
      const scale = bounceIdx === i ? bounceScale : 1;
      drawSlice(ctx, cx, cy, radius, start, end, mood.color, isHovered, scale);
    });

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const centerText = displayMood ? displayMood.label : '选择心情';
    const fontSize = Math.max(14, Math.floor(size * 0.058));
    ctx.save();
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(centerText, cx + 2, cy + 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(centerText, cx, cy);
    ctx.restore();

    if (particlesRef.current && particlesRef.current.active) {
      const { particles, startTime, duration, color } = particlesRef.current;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const alpha = 1 - progress;
      const rotationProgress = progress * 4 * Math.PI;

      particles.forEach((p) => {
        const angle = p.angle + rotationProgress + p.speed * progress;
        const pr = radius * 1.3 + p.radius * (1 - progress);
        const px = cx + Math.cos(angle) * pr;
        const py = cy + Math.sin(angle) * pr;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }
  }, [canvasSize, wheelRadius, hoveredIndex, displayMood, drawSlice]);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      if (bounceRef.current && bounceRef.current.active) {
        const elapsed = performance.now() - bounceRef.current.startTime;
        if (elapsed >= bounceRef.current.duration) {
          bounceRef.current.active = false;
        }
      }
      if (particlesRef.current && particlesRef.current.active) {
        const elapsed = performance.now() - particlesRef.current.startTime;
        if (elapsed >= particlesRef.current.duration) {
          particlesRef.current.active = false;
        }
      }
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [render]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePosition(e);
    if (!pos) return;
    const idx = hitTest(pos.x, pos.y, canvasSize, wheelRadius);
    setHoveredIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePosition(e);
    if (!pos) return;
    const idx = hitTest(pos.x, pos.y, canvasSize, wheelRadius);
    if (idx === null) return;

    const mood = MOODS[idx];
    setSelectedMood(mood);
    onMoodSelect(mood.key, mood.label, mood.color);

    bounceRef.current = {
      active: true,
      sliceIndex: idx,
      startTime: performance.now(),
      duration: 300,
    };

    if (particlesRef.current && particlesRef.current.active) {
      particlesRef.current.active = false;
    }

    const count = 40 + Math.floor(Math.random() * 21);
    const particles: Particle[] = Array.from({ length: count }, () => ({
      angle: Math.random() * 2 * Math.PI,
      radius: (Math.random() - 0.5) * 30,
      size: 2 + Math.random() * 3,
      opacity: 0.4 + Math.random() * 0.6,
      speed: (Math.random() - 0.5) * 2,
    }));

    particlesRef.current = {
      active: true,
      startTime: performance.now(),
      duration: 2000,
      particles,
      color: mood.color,
    };
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: `${BASE_CANVAS_SIZE + 32}px`,
        margin: '0 auto',
        aspectRatio: `${BASE_CANVAS_SIZE} / ${BASE_CANVAS_SIZE}`,
        background: 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)',
        borderRadius: '20px',
        padding: '16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        boxSizing: 'border-box',
      }}
    >
      {hoveredIndex !== null && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translate(-50%, -100%)',
            background: 'rgba(20, 20, 40, 0.95)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '10px',
            border: `2px solid ${MOODS[hoveredIndex].color}`,
            boxShadow: `0 4px 20px ${MOODS[hoveredIndex].color}55`,
            whiteSpace: 'nowrap',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              fontSize: '16px',
              color: MOODS[hoveredIndex].color,
              marginBottom: '2px',
            }}
          >
            {MOODS[hoveredIndex].label}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.85 }}>
            {MOODS[hoveredIndex].desc}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '-7px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '12px',
              height: '12px',
              background: 'rgba(20, 20, 40, 0.95)',
              borderRight: `2px solid ${MOODS[hoveredIndex].color}`,
              borderBottom: `2px solid ${MOODS[hoveredIndex].color}`,
            }}
          />
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: hoveredIndex !== null ? 'pointer' : 'default',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
    </div>
  );
};

export default MoodWheel;
