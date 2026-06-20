import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useEmotionStore } from './emotionManager';
import { useTimeStore } from './timeController';
import { EmotionType, PixelData, PlanetData } from './planetGenerator';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface SparkleDot {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

const PIXEL_SIZE = 8;
const PARTICLE_COUNT = 200;
const PARTICLE_DURATION = 1200;

const EMOTION_COLOR_MAP: Record<EmotionType, string[]> = {
  joy: ['#FFB347', '#FFD700', '#FFA500', '#FFC107'],
  miss: ['#FFB6C1', '#9B59B6', '#DA70D6', '#BA55D3'],
  adventure: ['#2ECC71', '#3498DB', '#00B894', '#66C7F2'],
  contemplation: ['#34495E', '#5D6D7E', '#4B5E73', '#85929E']
};

function App() {
  const planet = useEmotionStore((s) => s.currentPlanet);
  const weather = useEmotionStore((s) => s.weather);
  const distribution = useEmotionStore((s) => s.emotionDistribution);
  const compassAngle = useEmotionStore((s) => s.compassAngle);
  const isCompassGlowing = useEmotionStore((s) => s.isCompassGlowing);
  const getLabel = useEmotionStore((s) => s.getEmotionLabel);
  const clickHistory = useEmotionStore((s) => s.clickHistory);
  const registerEmotionClick = useEmotionStore((s) => s.registerEmotionClick);
  const generateNewPlanet = useEmotionStore((s) => s.generateNewPlanet);
  const triggerCompassGlow = useEmotionStore((s) => s.triggerCompassGlow);

  const elapsedTime = useTimeStore((s) => s.elapsedTime);
  const timelinePhase = useTimeStore((s) => s.timelinePhase);
  const startTimer = useTimeStore((s) => s.startTimer);
  const resetTimeline = useTimeStore((s) => s.resetTimeline);
  const setAnimating = useTimeStore((s) => s.setAnimating);
  const isAnimating = useTimeStore((s) => s.isAnimating);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planetContainerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleAnimRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [planetSize, setPlanetSize] = useState(600);
  const [hoverPixel, setHoverPixel] = useState<PixelData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [planetAnimClass, setPlanetAnimClass] = useState<string>('rotating-in');
  const [sparkles, setSparkles] = useState<SparkleDot[]>([]);
  const sparkleIdRef = useRef(0);

  const pixelMap = useMemo(() => {
    const map = new Map<string, PixelData>();
    if (planet) {
      planet.pixels.forEach((p) => {
        map.set(`${p.gridX},${p.gridY}`, p);
      });
    }
    return map;
  }, [planet]);

  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3
    }));
  }, []);

  useEffect(() => {
    const updateSize = () => {
      const size = Math.min(window.innerHeight * 0.6, window.innerWidth * 0.6);
      setPlanetSize(Math.round(size));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const drawPlanet = useCallback(
    (ctx: CanvasRenderingContext2D, p: PlanetData, size: number, hover: PixelData | null) => {
      const scale = size / (p.radius * 2);
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      p.pixels.forEach((pixel) => {
        ctx.fillStyle = pixel.color;
        const sx = pixel.x * scale;
        const sy = pixel.y * scale;
        const s = PIXEL_SIZE * scale + 0.5;
        ctx.fillRect(sx, sy, s, s);
      });

      if (hover) {
        ctx.save();
        const sx = hover.x * scale;
        const sy = hover.y * scale;
        const s = PIXEL_SIZE * scale;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(sx - 1, sy - 1, s + 2, s + 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - 1, sy - 1, s + 2, s + 2);
        ctx.restore();
      }

      ctx.restore();
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !planet) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = planetSize * dpr;
    canvas.height = planetSize * dpr;
    canvas.style.width = `${planetSize}px`;
    canvas.style.height = `${planetSize}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPlanet(ctx, planet, planetSize, hoverPixel);
  }, [planet, planetSize, hoverPixel, drawPlanet]);

  useEffect(() => {
    if (planetAnimClass === 'rotating-in') {
      const t = setTimeout(() => setPlanetAnimClass(''), 900);
      return () => clearTimeout(t);
    }
  }, [planetAnimClass]);

  useEffect(() => {
    startTimer();
    return () => {
      useTimeStore.getState().stopTimer();
    };
  }, [startTimer]);

  const getPixelAt = (clientX: number, clientY: number): PixelData | null => {
    const canvas = canvasRef.current;
    if (!canvas || !planet) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > planetSize || y > planetSize) return null;
    const scale = planetSize / (planet.radius * 2);
    const gx = Math.floor(x / (PIXEL_SIZE * scale));
    const gy = Math.floor(y / (PIXEL_SIZE * scale));
    return pixelMap.get(`${gx},${gy}`) || null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAnimating) return;
    const pixel = getPixelAt(e.clientX, e.clientY);
    setHoverPixel(pixel);
    if (pixel) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseLeave = () => {
    setHoverPixel(null);
  };

  const spawnParticles = (cx: number, cy: number, emotion: EmotionType) => {
    const colors = EMOTION_COLOR_MAP[emotion];
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5;
      const speed = 2 + Math.random() * 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        life: PARTICLE_DURATION,
        maxLife: PARTICLE_DURATION,
        color,
        size: 2 + Math.random() * 3,
        trail: []
      });
    }
    particlesRef.current = particles;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    const animate = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      const scale = planetSize / ((planet?.radius || 300) * 2);

      ctx.clearRect(0, 0, planetSize, planetSize);
      if (planet) drawPlanet(ctx, planet, planetSize, hoverPixel);

      let alive = 0;
      particlesRef.current.forEach((p) => {
        p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
        if (p.trail.length > 6) p.trail.shift();

        p.trail.forEach((t, idx) => {
          const a = (t.alpha * idx) / p.trail.length * 0.6;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = a;
          ctx.fillRect(t.x * scale - 1, t.y * scale - 1, p.size, p.size);
        });

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / p.maxLife);

        if (p.life > 0) {
          alive++;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fillRect(p.x * scale - p.size / 2, p.y * scale - p.size / 2, p.size, p.size);
        }
      });
      ctx.globalAlpha = 1;

      if (alive > 0) {
        particleAnimRef.current = requestAnimationFrame(animate);
      } else {
        particlesRef.current = [];
      }
    };
    particleAnimRef.current = requestAnimationFrame(animate);
  };

  const spawnSparkles = () => {
    const colors = ['#FFB347', '#FFD700', '#9B59B6', '#2ECC71', '#3498DB', '#FF6B9D', '#9B59B6'];
    const dots: SparkleDot[] = [];
    for (let i = 0; i < 10; i++) {
      dots.push({
        id: sparkleIdRef.current++,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setSparkles(dots);
    setTimeout(() => setSparkles([]), 900);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAnimating || !planet) return;
    const pixel = getPixelAt(e.clientX, e.clientY);
    if (!pixel) return;

    setAnimating(true);
    registerEmotionClick(pixel.emotion);
    resetTimeline();
    triggerCompassGlow();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const scale = (planet.radius * 2) / planetSize;
    const cx = (e.clientX - rect.left) * scale;
    const cy = (e.clientY - rect.top) * scale;
    spawnParticles(cx, cy, pixel.emotion);

    setTimeout(() => {
      setPlanetAnimClass('rotating-out');
    }, 300);

    setTimeout(() => {
      if (particleAnimRef.current) cancelAnimationFrame(particleAnimRef.current);
      generateNewPlanet();
      setPlanetAnimClass('rotating-in');
      spawnSparkles();
      setTimeout(() => {
        setAnimating(false);
      }, 900);
    }, 1200);
  };

  const timelineClass =
    timelinePhase === 'sliding-out'
      ? 'timeline sliding-out'
      : timelinePhase === 'sliding-in'
      ? 'timeline sliding-in'
      : 'timeline';

  return (
    <div className="app-container">
      <div className="starfield">
        {stars.map((s) => (
          <div
            key={s.id}
            className="star"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`
            }}
          />
        ))}
      </div>

      <div
        className="weather-panel"
        onClick={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(0.98)';
          setTimeout(() => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1)';
          }, 100);
        }}
      >
        <div className="weather-icon">{weather.icon}</div>
        <div className="weather-title">星空天气</div>
        <div className="weather-desc">{weather.description}</div>
        <div className="weather-stats">
          <div className="weather-stat">
            <span className="weather-stat-label">快乐</span>
            <div className="weather-stat-bar">
              <div className="weather-stat-fill fill-joy" style={{ width: `${distribution.joy * 100}%` }} />
            </div>
          </div>
          <div className="weather-stat">
            <span className="weather-stat-label">思念</span>
            <div className="weather-stat-bar">
              <div className="weather-stat-fill fill-miss" style={{ width: `${distribution.miss * 100}%` }} />
            </div>
          </div>
          <div className="weather-stat">
            <span className="weather-stat-label">冒险</span>
            <div className="weather-stat-bar">
              <div className="weather-stat-fill fill-adventure" style={{ width: `${distribution.adventure * 100}%` }} />
            </div>
          </div>
          <div className="weather-stat">
            <span className="weather-stat-label">沉思</span>
            <div className="weather-stat-bar">
              <div className="weather-stat-fill fill-contemplation" style={{ width: `${distribution.contemplation * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div
        className="compass"
        onClick={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
          setTimeout(() => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }, 100);
        }}
      >
        <div className={`compass-ring ${isCompassGlowing ? 'glowing' : ''}`} />
        <div className="compass-inner" />
        <div className="compass-center">🚀</div>
        <div
          className="compass-needle"
          style={{ transform: `translate(-50%, -100%) rotate(${compassAngle}deg)` }}
        />
        <div className="compass-label label-joy">快乐</div>
        <div className="compass-label label-miss">思念</div>
        <div className="compass-label label-adventure">冒险</div>
        <div className="compass-label label-contemplation">沉思</div>
      </div>

      <div className="planet-wrapper">
        <div
          ref={planetContainerRef}
          className={`planet-container ${planetAnimClass}`}
          style={{ width: `${planetSize}px`, height: `${planetSize}px` }}
        >
          <canvas
            ref={canvasRef}
            className="planet-canvas"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          />
          {hoverPixel && (
            <div
              className="emotion-tooltip visible"
              style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
            >
              {getLabel(hoverPixel.emotion)}
            </div>
          )}
          {sparkles.map((s) => (
            <div
              key={s.id}
              className="sparkle-dot"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                color: s.color,
                background: s.color,
                animationDelay: `${Math.random() * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="travel-count">已探索星球 · {clickHistory.length}</div>

      <div className={timelineClass}>
        <div className="timeline-track">
          <div className="timeline-fill" style={{ width: `${Math.min(elapsedTime * 3, 100)}%` }} />
          <div className="timeline-content">
            <span className="timeline-label">宇宙时间</span>
            <span className="timeline-time">{elapsedTime.toFixed(1)}s</span>
            <span className="timeline-label">在此停留</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
