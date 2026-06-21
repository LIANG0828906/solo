import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore, LEVELS } from './data';
import {
  getEquipotentialSurfaces,
  interpolateColor,
  checkLevelMatch,
  CANVAS_SIZE,
  type Star,
  type Lens,
  type VirtualImage,
  type EquipotentialSurface
} from './core';
import type { LevelConfig } from './data';
import LensWorker from './lens-worker?worker';

function GravitationalLensCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const virtualImagesRef = useRef<VirtualImage[]>([]);
  const lastComputeRef = useRef<number>(0);
  const workerRef = useRef<InstanceType<typeof LensWorker> | null>(null);
  const workerReqIdRef = useRef<number>(0);
  const workerBusyRef = useRef<boolean>(false);
  const draggingRef = useRef<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const stars = useGameStore((s) => s.stars);
  const lens = useGameStore((s) => s.lens);
  const zoom = useGameStore((s) => s.zoom);
  const lensTrail = useGameStore((s) => s.lensTrail);
  const moveLens = useGameStore((s) => s.moveLens);
  const pushTrail = useGameStore((s) => s.pushTrail);
  const clearTrail = useGameStore((s) => s.clearTrail);
  const setZoom = useGameStore((s) => s.setZoom);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const completeLevel = useGameStore((s) => s.completeLevel);
  const completedLevels = useGameStore((s) => s.completedLevels);

  const level: LevelConfig | undefined =
    currentLevel !== null
      ? LEVELS.find((l) => l.id === currentLevel)
      : undefined;

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      return { x, y };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const dx = x - lens.x;
      const dy = y - lens.y;
      if (Math.sqrt(dx * dx + dy * dy) < lens.radius + 40) {
        draggingRef.current = true;
        dragOffsetRef.current = { x: dx, y: dy };
      }
    },
    [lens.x, lens.y, lens.radius, screenToCanvas]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!draggingRef.current) return;
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const newX = Math.max(0, Math.min(CANVAS_SIZE, x - dragOffsetRef.current.x));
      const newY = Math.max(0, Math.min(CANVAS_SIZE, y - dragOffsetRef.current.y));
      moveLens(newX, newY);
      pushTrail(newX, newY);
    },
    [moveLens, pushTrail, screenToCanvas]
  );

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
    setTimeout(() => clearTrail(), 500);
  }, [clearTrail]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(zoom + delta);
    },
    [zoom, setZoom]
  );

  useEffect(() => {
    workerRef.current = new LensWorker();
    workerRef.current.onmessage = (e: MessageEvent<{
      id: number;
      virtualImages: VirtualImage[];
      timestamp: number;
    }>) => {
      if (e.data.id === workerReqIdRef.current || e.data.id > workerReqIdRef.current - 2) {
        virtualImagesRef.current = e.data.virtualImages;
      }
      workerBusyRef.current = false;
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const requestWorkerCompute = () => {
      if (workerBusyRef.current || !workerRef.current) return;
      workerBusyRef.current = true;
      workerReqIdRef.current++;
      workerRef.current.postMessage({
        id: workerReqIdRef.current,
        stars,
        lens
      });
    };

    const drawStars = (starsArr: Star[]) => {
      ctx.fillStyle = '#ffffff';
      for (const star of starsArr) {
        ctx.globalAlpha = star.brightness;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawReferenceStars = (starsArr: Star[]) => {
      ctx.fillStyle = '#ffffff';
      for (const star of starsArr) {
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawVirtualImages = (images: VirtualImage[]) => {
      for (const img of images) {
        ctx.globalAlpha = Math.min(img.brightness * 0.85, 1);

        let glowColor = '#00ffff';
        if (img.imageType === 'secondary') glowColor = '#ff00ff';
        else if (img.imageType === 'tangential') glowColor = '#ffcc00';
        else if (img.imageType === 'radial') glowColor = '#ff6600';

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = Math.min(8, 3 * Math.max(1, img.magnification * 0.3));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const size = Math.min(3.5, 1.2 + img.magnification * 0.1);
        ctx.arc(img.x, img.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    const drawEquipotentialRings = (
      lensObj: Lens,
      surfaces: EquipotentialSurface[]
    ) => {
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      const ex = 1 - lensObj.ellipticity;
      const ey = 1 + lensObj.ellipticity;

      if (surfaces.length === 0) return;

      const maxGradient = Math.max(...surfaces.map((s) => s.gradient), 0.001);

      surfaces.forEach((surface, i) => {
        const t = i / Math.max(surfaces.length - 1, 1);
        const gradientT = Math.min(1, surface.gradient / maxGradient);
        const alpha = 0.4 + gradientT * 0.4;

        const dashes = Math.max(1, Math.floor(3 + (1 - gradientT) * 5));
        ctx.setLineDash([dashes, dashes]);

        ctx.strokeStyle = interpolateColor(t);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = Math.max(0.5, 0.5 + gradientT * 0.8);

        ctx.beginPath();
        ctx.save();
        ctx.translate(lensObj.x, lensObj.y);
        ctx.rotate(lensObj.rotation);
        ctx.scale(ex, ey);
        ctx.arc(0, 0, surface.radius, 0, Math.PI * 2);
        ctx.restore();
        ctx.stroke();
      });

      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    };

    const drawLensTrail = (trail: { x: number; y: number }[]) => {
      for (let i = 0; i < trail.length; i++) {
        const alpha = (i / trail.length) * 0.55;
        ctx.fillStyle = `rgba(68, 136, 255, ${alpha})`;
        ctx.beginPath();
        const r = lens.radius * (0.3 + (i / trail.length) * 0.7);
        ctx.arc(trail[i].x, trail[i].y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawLens = (lensObj: Lens) => {
      const ex = 1 - lensObj.ellipticity;
      const ey = 1 + lensObj.ellipticity;

      const gradient = ctx.createRadialGradient(
        lensObj.x,
        lensObj.y,
        0,
        lensObj.x,
        lensObj.y,
        lensObj.radius * 1.5
      );
      gradient.addColorStop(0, 'rgba(68, 136, 255, 0.55)');
      gradient.addColorStop(0.4, 'rgba(68, 136, 255, 0.3)');
      gradient.addColorStop(0.8, 'rgba(68, 136, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(68, 136, 255, 0.0)');

      ctx.save();
      ctx.translate(lensObj.x, lensObj.y);
      ctx.rotate(lensObj.rotation);
      ctx.scale(ex, ey);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, lensObj.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, lensObj.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    let surfacesCache = getEquipotentialSurfaces(lens);
    let lastLensParams = `${lens.strength}_${lens.radius}_${lens.ellipticity}`;

    const render = () => {
      const now = performance.now();

      if (now - lastComputeRef.current >= 33) {
        lastComputeRef.current = now;
        requestWorkerCompute();

        if (level && !completedLevels.includes(level.id)) {
          if (checkLevelMatch(lens, level.targetLens, level.tolerance)) {
            completeLevel(level.id);
          }
        }
      }

      const lensKey = `${lens.strength.toFixed(1)}_${lens.radius.toFixed(0)}_${lens.ellipticity.toFixed(2)}`;
      if (lensKey !== lastLensParams) {
        surfacesCache = getEquipotentialSurfaces(lens);
        lastLensParams = lensKey;
      }

      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx.save();
      ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-CANVAS_SIZE / 2, -CANVAS_SIZE / 2);

      drawStars(stars);
      drawReferenceStars(stars);
      drawVirtualImages(virtualImagesRef.current);
      drawEquipotentialRings(lens, surfacesCache);
      drawLensTrail(lensTrail);
      drawLens(lens);

      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animRef.current);
  }, [
    stars,
    lens,
    zoom,
    lensTrail,
    level,
    completeLevel,
    completedLevels
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
        display: 'block',
        borderRadius: '12px',
        boxShadow: '0 0 60px rgba(0, 255, 255, 0.1)'
      }}
    />
  );
}

function ControlPanel() {
  const lens = useGameStore((s) => s.lens);
  const setLensStrength = useGameStore((s) => s.setLensStrength);
  const setLensEllipticity = useGameStore((s) => s.setLensEllipticity);
  const setLensRotation = useGameStore((s) => s.setLensRotation);
  const resetLevel = useGameStore((s) => s.resetLevel);
  const setShowLevelSelect = useGameStore((s) => s.setShowLevelSelect);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const level =
    currentLevel !== null ? LEVELS.find((l) => l.id === currentLevel) : null;

  return (
    <div
      className="glass"
      style={{
        position: 'absolute',
        top: 24,
        right: 24,
        width: 290,
        padding: 20,
        zIndex: 10
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 16,
          color: '#00ffff'
        }}
      >
        控制面板
      </h2>

      {level && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: 'rgba(68, 136, 255, 0.15)',
            border: '1px solid rgba(68, 136, 255, 0.3)'
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              marginBottom: 4
            }}
          >
            关卡 {level.id}: {level.name}
          </div>
          <div
            style={{ fontSize: 11, color: '#aab', lineHeight: 1.4 }}
          >
            {level.description}
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#667',
              marginTop: 8,
              fontStyle: 'italic'
            }}
          >
            匹配精度: 位置 / 强度 / 椭圆率 偏差均 &lt; 5%
          </div>
        </div>
      )}

      <div className="slider-container" style={{ marginBottom: 16 }}>
        <div className="slider-label">
          <span>引力强度 (θ = 4GM/c²b)</span>
          <span className="slider-value">
            {lens.strength.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.1"
          value={lens.strength}
          onChange={(e) => setLensStrength(parseFloat(e.target.value))}
        />
      </div>

      <div className="slider-container" style={{ marginBottom: 16 }}>
        <div className="slider-label">
          <span>椭圆率</span>
          <span className="slider-value">
            {lens.ellipticity.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="0.8"
          step="0.01"
          value={lens.ellipticity}
          onChange={(e) =>
            setLensEllipticity(parseFloat(e.target.value))
          }
        />
      </div>

      <div className="slider-container" style={{ marginBottom: 20 }}>
        <div className="slider-label">
          <span>旋转角度</span>
          <span className="slider-value">
            {Math.round((lens.rotation * 180) / Math.PI)}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={String(Math.PI * 2)}
          step="0.01"
          value={lens.rotation}
          onChange={(e) => setLensRotation(parseFloat(e.target.value))}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn"
          style={{ flex: 1 }}
          onClick={resetLevel}
        >
          重置
        </button>
        <button
          className="btn"
          style={{ flex: 1 }}
          onClick={() => setShowLevelSelect(true)}
        >
          关卡
        </button>
      </div>

      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 11,
          color: '#888',
          lineHeight: 1.6
        }}
      >
        <div style={{ marginBottom: 4 }}>• 拖拽蓝色透镜调整位置</div>
        <div style={{ marginBottom: 4 }}>
          • 滚轮缩放 (0.5x - 3x)
        </div>
        <div style={{ marginBottom: 4 }}>
          • 滑块调节质量与形状
        </div>
        <div>• 虚像数取决于源与透镜相对位置</div>
      </div>
    </div>
  );
}

function LevelSelectPanel() {
  const showLevelSelect = useGameStore((s) => s.showLevelSelect);
  const setShowLevelSelect = useGameStore((s) => s.setShowLevelSelect);
  const selectLevel = useGameStore((s) => s.selectLevel);
  const completedLevels = useGameStore((s) => s.completedLevels);
  const [animState, setAnimState] = useState<
    'hidden' | 'entering' | 'visible' | 'exiting'
  >(showLevelSelect ? 'entering' : 'hidden');

  useEffect(() => {
    if (showLevelSelect) {
      setAnimState('entering');
      const t = setTimeout(() => setAnimState('visible'), 10);
      return () => clearTimeout(t);
    } else if (animState !== 'hidden') {
      setAnimState('exiting');
      const t = setTimeout(() => setAnimState('hidden'), 300);
      return () => clearTimeout(t);
    }
  }, [showLevelSelect]);

  if (animState === 'hidden') return null;

  const opacity =
    animState === 'entering' || animState === 'exiting' ? 0 : 1;
  const scale = animState === 'visible' ? 1 : 0.95;

  const isLevelUnlocked = (id: number) => {
    if (id === 1) return true;
    return completedLevels.includes(id - 1);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transition: 'opacity 0.3s ease'
      }}
      onClick={() => setShowLevelSelect(false)}
    >
      <div
        className="glass"
        style={{
          width: 720,
          maxWidth: '90%',
          maxHeight: '80%',
          padding: 32,
          transform: `scale(${scale})`,
          transition: 'transform 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}
        >
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#00ffff'
            }}
          >
            选择关卡
          </h2>
          <button
            className="btn"
            onClick={() => setShowLevelSelect(false)}
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            关闭
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16
          }}
        >
          {LEVELS.map((lvl) => {
            const unlocked = isLevelUnlocked(lvl.id);
            const completed = completedLevels.includes(lvl.id);
            const classes = ['level-card', 'glass'];
            if (!unlocked) classes.push('locked');
            if (completed) classes.push('completed');

            return (
              <div
                key={lvl.id}
                className={classes.join(' ')}
                onClick={() => unlocked && selectLevel(lvl.id)}
              >
                <div
                  style={{
                    width: '100%',
                    height: 100,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(68, 136, 255, 0.4)',
                      boxShadow: '0 0 20px rgba(68, 136, 255, 0.5)'
                    }}
                  />
                  {!unlocked && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.5)',
                        fontSize: 28,
                        color: '#888'
                      }}
                    >
                      🔒
                    </div>
                  )}
                  {completed && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'rgba(0, 255, 128, 0.3)',
                        border: '2px solid #00ff80',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        color: '#00ff80'
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: '#fff'
                  }}
                >
                  {lvl.id}. {lvl.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#888',
                    lineHeight: 1.4
                  }}
                >
                  {lvl.description}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            className="btn"
            onClick={() => {
              selectLevel(null);
              setShowLevelSelect(false);
            }}
          >
            自由模式
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessEffect() {
  const showSuccess = useGameStore((s) => s.showSuccess);
  const setShowSuccess = useGameStore((s) => s.setShowSuccess);
  const particlesRef = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
    }[]
  >([]);
  const animRef = useRef<number>(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      setVisible(true);
      particlesRef.current = [];
      for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 6;
        particlesRef.current.push({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 4,
          life: 1
        });
      }

      const start = performance.now();
      const animate = () => {
        const elapsed = performance.now() - start;
        const progress = elapsed / 2000;

        if (progress >= 1) {
          setShowSuccess(false);
          setVisible(false);
          return;
        }

        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.02;
          p.life = 1 - progress;
        });

        const overlay = document.getElementById(
          'success-particles'
        ) as HTMLCanvasElement | null;
        if (overlay) {
          const ctx = overlay.getContext('2d');
          if (ctx) {
            overlay.width = window.innerWidth;
            overlay.height = window.innerHeight;
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            particlesRef.current.forEach((p) => {
              const alpha = Math.max(0, p.life);
              ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
              ctx.shadowColor = '#ffa500';
              ctx.shadowBlur = 10 * alpha;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
              ctx.fill();
            });
            ctx.shadowBlur = 0;
          }
        }

        animRef.current = requestAnimationFrame(animate);
      };

      animRef.current = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animRef.current);
    }
  }, [showSuccess, setShowSuccess]);

  if (!visible) return null;

  return (
    <canvas
      id="success-particles"
      className="success-overlay"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

export {
  GravitationalLensCanvas,
  ControlPanel,
  LevelSelectPanel,
  SuccessEffect
};
