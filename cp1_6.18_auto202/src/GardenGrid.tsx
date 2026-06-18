import { useEffect, useRef, useState, useCallback } from 'react';
import { useGardenStore } from './gardenStore';
import {
  tickGrowth,
  updateParticles,
  generateDirtParticles,
  generatePollenParticles,
  generatePetalParticles,
  startGrowth,
  resetGrowth,
} from './seedEngine';
import { renderGrowthAnimation } from './seedRenderer';
import SeedCard from './SeedCard';
import ArtworkCard from './ArtworkCard';
import type { Particle, Seed, GrowthStage } from './types/seed';
import './styles/GardenGrid.css';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 420;
const MAX_PARTICLES = 150;

export default function GardenGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const prevStageRef = useRef<GrowthStage>('idle');
  const pollenTimerRef = useRef<number>(0);

  const seeds = useGardenStore((s) => s.seeds);
  const growth = useGardenStore((s) => s.growth);
  const growthRef = useRef(growth);
  growthRef.current = growth;

  const selectedSeed = seeds.find((s) => s.id === growth.selectedSeedId) || null;
  const [showArtworkCard, setShowArtworkCard] = useState(false);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  const renderFrame = useCallback(
    (seed: Seed, stage: GrowthStage, stageProgress: number, time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const scaledCtx = {
        ctx,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        dpr,
      };

      renderGrowthAnimation(scaledCtx, {
        seed,
        stage,
        stageProgress,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        particles: particlesRef.current,
        time,
      });
    },
    []
  );

  const addParticles = useCallback((newParticles: Particle[]) => {
    const available = MAX_PARTICLES - particlesRef.current.length;
    if (available <= 0) return;
    const toAdd = newParticles.slice(0, available);
    particlesRef.current = [...particlesRef.current, ...toAdd];
  }, []);

  const animate = useCallback(
    (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const currentGrowth = growthRef.current;
      const seed = seeds.find((s) => s.id === currentGrowth.selectedSeedId);

      tickGrowth(time);

      if (prevStageRef.current !== currentGrowth.stage) {
        if (currentGrowth.stage === 'sprouting' && prevStageRef.current === 'idle') {
          const centerX = CANVAS_WIDTH / 2;
          const baseY = CANVAS_HEIGHT - 60;
          addParticles(generateDirtParticles(centerX, baseY, 35));
        } else if (currentGrowth.stage === 'blooming' && seed) {
          const flowerCenterY = CANVAS_HEIGHT - 170;
          addParticles(generatePollenParticles(CANVAS_WIDTH / 2, flowerCenterY, 25, seed.petalColor));
          addParticles(generatePetalParticles(CANVAS_WIDTH / 2, flowerCenterY, 10, seed.petalColor));
          pollenTimerRef.current = 0;
        } else if (currentGrowth.stage === 'complete') {
          setShowArtworkCard(true);
        }
        prevStageRef.current = currentGrowth.stage;
      }

      if (currentGrowth.stage === 'complete' && seed) {
        pollenTimerRef.current += deltaTime;
        if (pollenTimerRef.current > 800) {
          pollenTimerRef.current = 0;
          const flowerCenterY = CANVAS_HEIGHT - 170;
          addParticles(generatePollenParticles(CANVAS_WIDTH / 2, flowerCenterY, 3, seed.petalColor));
        }
      }

      particlesRef.current = updateParticles(particlesRef.current, deltaTime);

      if (seed) {
        const latestGrowth = growthRef.current;
        renderFrame(seed, latestGrowth.stage, latestGrowth.stageProgress, time);
      }

      rafRef.current = requestAnimationFrame(animate);
    },
    [seeds, addParticles, renderFrame]
  );

  useEffect(() => {
    if (growth.stage !== 'idle' && growth.startTime !== null) {
      lastTimeRef.current = 0;
      prevStageRef.current = 'idle';
      particlesRef.current = [];
      setupCanvas();
      rafRef.current = requestAnimationFrame(animate);

      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }
  }, [growth.stage, growth.startTime, setupCanvas, animate]);

  const handleSeedClick = useCallback(
    (seedId: string) => {
      setShowArtworkCard(false);
      startGrowth(seedId);
    },
    []
  );

  const handleClose = useCallback(() => {
    resetGrowth();
    setShowArtworkCard(false);
    particlesRef.current = [];
    prevStageRef.current = 'idle';
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const isOverlayOpen = growth.stage !== 'idle';

  return (
    <div className="garden-container">
      <header className="garden-header">
        <h1 className="garden-title">数字生长花园</h1>
        <p className="garden-subtitle">点击种子，开启一段生长之旅</p>
      </header>

      <main className="garden-grid-wrapper">
        <div className="garden-grid">
          {seeds.map((seed) => (
            <SeedCard key={seed.id} seed={seed} onClick={() => handleSeedClick(seed.id)} />
          ))}
        </div>
      </main>

      {isOverlayOpen && (
        <div className="garden-canvas-overlay" onClick={handleClose} role="presentation">
          <div className="garden-canvas-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="garden-close-btn"
              onClick={handleClose}
              aria-label="关闭生长动画"
              title="关闭"
            >
              ×
            </button>
            <canvas ref={canvasRef} className="garden-canvas" />
          </div>

          {showArtworkCard && selectedSeed && (
            <div
              className="garden-artwork-wrapper"
              onClick={(e) => e.stopPropagation()}
            >
              <ArtworkCard seed={selectedSeed} onClose={handleClose} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
