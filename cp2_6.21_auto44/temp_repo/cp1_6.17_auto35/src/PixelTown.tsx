import React, { useRef, useEffect, useCallback } from 'react';
import { useTownStore } from './store';
import { Season, House, Tree } from './types';
import {
  SEASON_COLORS,
  syncParticles,
  updateParticles,
  createSmokeParticle,
  updateSmokeParticles,
  lerpColor,
} from './particles';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TRANSITION_DURATION = 1500;
const SMOKE_DURATION = 5000;
const SMOKE_INTERVAL = 500;

export const PixelTown: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const prevSeasonRef = useRef<Season>(Season.SPRING);
  const transitionStartRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const houseSmokeTimersRef = useRef<Map<number, number>>(new Map());

  const season = useTownStore((s) => s.season);
  const particleCount = useTownStore((s) => s.particleCount);
  const particles = useTownStore((s) => s.particles);
  const smokeParticles = useTownStore((s) => s.smokeParticles);
  const houses = useTownStore((s) => s.houses);
  const trees = useTownStore((s) => s.trees);
  const setParticles = useTownStore((s) => s.setParticles);
  const setSmokeParticles = useTownStore((s) => s.setSmokeParticles);
  const addSmokeParticle = useTownStore((s) => s.addSmokeParticle);
  const setHouseSmoking = useTownStore((s) => s.setHouseSmoking);

  useEffect(() => {
    if (prevSeasonRef.current !== season) {
      isTransitioningRef.current = true;
      transitionStartRef.current = performance.now();
      prevSeasonRef.current = season;
    }
  }, [season]);

  const drawSky = useCallback(
    (ctx: CanvasRenderingContext2D, transitionT: number) => {
      const currentColors = SEASON_COLORS[season];
      const prevColors = SEASON_COLORS[prevSeasonRef.current];

      const skyTop = lerpColor(prevColors.skyGradient, currentColors.skyGradient, transitionT);
      const skyBottom = lerpColor(prevColors.sky, currentColors.sky, transitionT);

      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.7);
      gradient.addColorStop(0, skyTop);
      gradient.addColorStop(1, skyBottom);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.7);
    },
    [season]
  );

  const drawGrass = useCallback(
    (ctx: CanvasRenderingContext2D, transitionT: number) => {
      const currentColors = SEASON_COLORS[season];
      const prevColors = SEASON_COLORS[prevSeasonRef.current];
      const grassColor = lerpColor(prevColors.grass, currentColors.grass, transitionT);

      ctx.fillStyle = grassColor;
      ctx.fillRect(0, CANVAS_HEIGHT * 0.6, CANVAS_WIDTH, CANVAS_HEIGHT * 0.4);

      ctx.fillStyle = lerpColor(grassColor, '#000000', 0.1);
      for (let x = 0; x < CANVAS_WIDTH; x += 8) {
        for (let y = CANVAS_HEIGHT * 0.65; y < CANVAS_HEIGHT; y += 12) {
          if ((x + y) % 24 === 0) {
            ctx.fillRect(x, y, 4, 2);
          }
        }
      }
    },
    [season]
  );

  const drawTree = useCallback(
    (ctx: CanvasRenderingContext2D, tree: Tree, transitionT: number) => {
      const currentColors = SEASON_COLORS[season];
      const prevColors = SEASON_COLORS[prevSeasonRef.current];

      const trunkColor = '#6D4C41';
      ctx.fillStyle = trunkColor;
      const trunkX = tree.x - tree.trunkWidth / 2;
      const trunkY = tree.y;
      ctx.fillRect(trunkX, trunkY, tree.trunkWidth, tree.trunkHeight);

      let crownColor = lerpColor(prevColors.treeCrown, currentColors.treeCrown, transitionT);

      const radius = tree.crownDiameter / 2;
      const centerX = tree.x;
      const centerY = tree.y - radius + 5;

      ctx.fillStyle = crownColor;
      for (let dy = -radius; dy <= radius; dy += 4) {
        for (let dx = -radius; dx <= radius; dx += 4) {
          if (dx * dx + dy * dy <= radius * radius) {
            ctx.fillRect(Math.round(centerX + dx), Math.round(centerY + dy), 4, 4);
          }
        }
      }

      if (season === Season.WINTER || prevSeasonRef.current === Season.WINTER) {
        const hasSnow = transitionT > 0.5 ? season === Season.WINTER : prevSeasonRef.current === Season.WINTER;
        if (hasSnow && currentColors.treeShadow) {
          ctx.fillStyle = currentColors.treeShadow;
          for (let dy = -radius; dy <= radius; dy += 4) {
            for (let dx = -radius; dx <= radius; dx += 4) {
              if (dx * dx + dy * dy <= radius * radius && dy > radius * 0.3) {
                ctx.fillRect(Math.round(centerX + dx), Math.round(centerY + dy), 4, 4);
              }
            }
          }
        }
      }
    },
    [season]
  );

  const drawHouse = useCallback(
    (ctx: CanvasRenderingContext2D, house: House, transitionT: number, index: number) => {
      const currentColors = SEASON_COLORS[season];
      const prevColors = SEASON_COLORS[prevSeasonRef.current];

      const wallColor = lerpColor(prevColors.houseWall, currentColors.houseWall, transitionT);
      const roofColor = lerpColor(prevColors.houseRoof, currentColors.houseRoof, transitionT);

      ctx.fillStyle = wallColor;
      ctx.fillRect(house.x, house.y, house.width, house.height);

      ctx.fillStyle = '#90A4AE';
      const windowSize = 16;
      const windowGap = 12;
      const windowY = house.y + 20;
      const windowCount = Math.floor((house.width - windowGap * 2) / (windowSize + windowGap));
      for (let i = 0; i < Math.max(1, windowCount); i++) {
        const wx = house.x + windowGap + i * (windowSize + windowGap);
        ctx.fillRect(wx, windowY, windowSize, windowSize);
        ctx.fillStyle = '#455A64';
        ctx.fillRect(wx + windowSize / 2 - 1, windowY, 2, windowSize);
        ctx.fillRect(wx, windowY + windowSize / 2 - 1, windowSize, 2);
        ctx.fillStyle = '#90A4AE';
      }

      ctx.fillStyle = '#5D4037';
      const doorWidth = 24;
      const doorHeight = 36;
      ctx.fillRect(
        house.x + house.width / 2 - doorWidth / 2,
        house.y + house.height - doorHeight,
        doorWidth,
        doorHeight
      );

      ctx.fillStyle = roofColor;
      ctx.beginPath();
      ctx.moveTo(house.x - 8, house.y);
      ctx.lineTo(house.x + house.width / 2, house.y - house.roofHeight);
      ctx.lineTo(house.x + house.width + 8, house.y);
      ctx.closePath();
      ctx.fill();

      const showSnow = transitionT > 0.5 ? currentColors.houseRoofSnow : prevColors.houseRoofSnow;
      if (showSnow) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(house.x - 4, house.y - 2);
        ctx.lineTo(house.x + house.width / 2, house.y - house.roofHeight + 6);
        ctx.lineTo(house.x + house.width + 4, house.y - 2);
        ctx.lineTo(house.x + house.width + 2, house.y + 2);
        ctx.lineTo(house.x + house.width / 2, house.y - house.roofHeight + 12);
        ctx.lineTo(house.x - 2, house.y + 2);
        ctx.closePath();
        ctx.fill();
      }

      const chimneyX = house.x + house.width * 0.7;
      const chimneyY = house.y - house.roofHeight * 0.5;
      ctx.fillStyle = '#795548';
      ctx.fillRect(chimneyX, chimneyY, 12, house.roofHeight * 0.5 + 4);

      if (house.smoking) {
        if (!houseSmokeTimersRef.current.has(index)) {
          houseSmokeTimersRef.current.set(index, 0);
        }
      }
    },
    [season]
  );

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particles.forEach((p) => {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      const half = p.size / 2;
      ctx.fillRect(Math.round(p.x - half), Math.round(p.y - half), p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }, [particles]);

  const drawSmokeParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    smokeParticles.forEach((s) => {
      ctx.globalAlpha = s.opacity;
      ctx.fillStyle = '#ECEFF1';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }, [smokeParticles]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      houses.forEach((house, index) => {
        if (
          x >= house.x - 8 &&
          x <= house.x + house.width + 8 &&
          y >= house.y - house.roofHeight &&
          y <= house.y + house.height
        ) {
          setHouseSmoking(index, true);
          houseSmokeTimersRef.current.set(index, 0);
          setTimeout(() => {
            setHouseSmoking(index, false);
            houseSmokeTimersRef.current.delete(index);
          }, SMOKE_DURATION);
        }
      });
    },
    [houses, setHouseSmoking]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const animate = (time: number) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      let transitionT = 1;
      if (isTransitioningRef.current) {
        transitionT = Math.min(1, (time - transitionStartRef.current) / TRANSITION_DURATION);
        if (transitionT >= 1) {
          isTransitioningRef.current = false;
        }
      }

      const state = useTownStore.getState();

      const syncedParticles = syncParticles(state.particles, state.particleCount, state.season);
      const updatedParticles = updateParticles(syncedParticles);
      if (
        updatedParticles.length !== state.particles.length ||
        updatedParticles.some((p, i) => p !== state.particles[i])
      ) {
        setParticles(updatedParticles);
      }

      state.houses.forEach((house, index) => {
        if (house.smoking) {
          const currentTimer = (houseSmokeTimersRef.current.get(index) || 0) + deltaTime;
          houseSmokeTimersRef.current.set(index, currentTimer);
          if (currentTimer >= SMOKE_INTERVAL) {
            houseSmokeTimersRef.current.set(index, 0);
            const chimneyX = house.x + house.width * 0.7 + 6;
            const chimneyY = house.y - house.roofHeight * 0.5;
            addSmokeParticle(createSmokeParticle(chimneyX, chimneyY));
          }
        }
      });

      const updatedSmoke = updateSmokeParticles(state.smokeParticles);
      if (
        updatedSmoke.length !== state.smokeParticles.length ||
        updatedSmoke.some((s, i) => s !== state.smokeParticles[i])
      ) {
        setSmokeParticles(updatedSmoke);
      }

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawSky(ctx, transitionT);
      drawGrass(ctx, transitionT);

      const sortedTrees = [...state.trees].sort((a, b) => a.y - b.y);
      const sortedHouses = [...state.houses].map((h, i) => ({ ...h, originalIndex: i })).sort((a, b) => a.y - b.y);

      let treeIdx = 0;
      let houseIdx = 0;

      while (treeIdx < sortedTrees.length || houseIdx < sortedHouses.length) {
        const nextTree = sortedTrees[treeIdx];
        const nextHouse = sortedHouses[houseIdx];

        if (!nextHouse || (nextTree && nextTree.y < nextHouse.y)) {
          drawTree(ctx, nextTree, transitionT);
          treeIdx++;
        } else {
          drawHouse(ctx, nextHouse, transitionT, nextHouse.originalIndex);
          houseIdx++;
        }
      }

      drawParticles(ctx);
      drawSmokeParticles(ctx);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [drawSky, drawGrass, drawTree, drawHouse, drawParticles, drawSmokeParticles, setParticles, setSmokeParticles, addSmokeParticle]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
};
