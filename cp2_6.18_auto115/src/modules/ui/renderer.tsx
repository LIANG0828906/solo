import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '../gameLogic/gameState';
import { trySpawnMeteor, updateMeteors, checkWaveComplete } from '../gameLogic/meteorManager';
import {
  updateTowersFire,
  updateBullets,
  updateParticles,
  buildTowerAt,
  canBuildAt,
  getTowerAtPosition,
} from '../gameLogic/towerManager';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  GRID_SIZE,
  CORE_X,
  CORE_Y,
  CORE_RADIUS,
  getGridCount,
  worldToGrid,
  gridToWorld,
  dist,
  RESOURCE_TICK_INTERVAL,
  RESOURCE_TICK_AMOUNT,
  SCREEN_SHAKE_DURATION,
  SCREEN_SHAKE_INTENSITY,
  VICTORY_ANIM_DURATION,
  INSUFFICIENT_MSG_DURATION,
  TOWER_COST,
} from '../../utils/math';
import ResourceBar from './ResourceBar';
import BuildPanel from './BuildPanel';
import BuildBubble from './BuildBubble';
import GameOverMask from './GameOverMask';

const Renderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [mapScale, setMapScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  const {
    coreHp,
    coreMaxHp,
    corePosition,
    resources,
    currentWave,
    isWaveActive,
    meteors,
    towers,
    bullets,
    particles,
    buildBubblePosition,
    selectedTowerId,
    insufficientResourceMsg,
    insufficientResourceTime,
    isGameOver,
    finalWave,
    buildMode,
    screenShake,
    screenShakeStart,
    isVictoryAnimating,
    victoryAnimStart,
    isWaveActive: _isWaveActive,
  } = useGameStore();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        const scale = (window.innerWidth * 0.9) / MAP_WIDTH;
        setMapScale(Math.min(scale, 1));
      } else {
        setMapScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gameLoop = useCallback((now: number) => {
    const state = useGameStore.getState();
    if (state.isGameOver) {
      drawScene(now);
      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const lastTime = lastTimeRef.current || now;
    let deltaTime = now - lastTime;
    deltaTime = Math.min(deltaTime, 50);
    lastTimeRef.current = now;

    if (state.lastResourceTick === 0) {
      state.setLastResourceTick(now);
    } else if (now - state.lastResourceTick >= RESOURCE_TICK_INTERVAL) {
      state.addResources(RESOURCE_TICK_AMOUNT);
      state.setLastResourceTick(now);
    }

    if (state.insufficientResourceMsg && now - state.insufficientResourceTime >= INSUFFICIENT_MSG_DURATION) {
      state.clearInsufficientResource();
    }

    if (state.screenShake > 0) {
      const elapsed = now - state.screenShakeStart;
      const remaining = Math.max(0, SCREEN_SHAKE_DURATION - elapsed);
      state.setScreenShake(remaining);
    }

    if (state.isVictoryAnimating && now - state.victoryAnimStart >= VICTORY_ANIM_DURATION) {
      state.setVictoryAnimating(false);
    }

    trySpawnMeteor(now);
    updateMeteors(deltaTime);
    updateTowersFire(now);
    updateBullets(deltaTime);
    updateParticles(deltaTime);

    if (checkWaveComplete()) {
      state.completeWave();
    }

    drawScene(now);
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const drawScene = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = useGameStore.getState();
    let shakeX = 0;
    let shakeY = 0;
    if (state.screenShake > 0) {
      const t = state.screenShake / SCREEN_SHAKE_DURATION;
      shakeX = (Math.random() - 0.5) * SCREEN_SHAKE_INTENSITY * t * 2;
      shakeY = (Math.random() - 0.5) * SCREEN_SHAKE_INTENSITY * t * 2;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    drawGrid(ctx, state.buildMode);
    drawVictoryGlow(ctx, now, state.isVictoryAnimating, state.victoryAnimStart);
    drawCore(ctx, state.corePosition, state.coreHp, state.coreMaxHp);
    drawTowers(ctx, state.towers, state.selectedTowerId);
    drawMeteors(ctx, state.meteors);
    drawBullets(ctx, state.bullets);
    drawParticles(ctx, state.particles);

    ctx.restore();

    drawMapBorder(ctx, state.isVictoryAnimating, state.victoryAnimStart, now);
  }, []);

  const drawGrid = (ctx: CanvasRenderingContext2D, inBuildMode: boolean) => {
    const { cols, rows } = getGridCount();
    ctx.strokeStyle = '#2A2F3A';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GRID_SIZE, 0);
      ctx.lineTo(x * GRID_SIZE, MAP_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE);
      ctx.lineTo(MAP_WIDTH, y * GRID_SIZE);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#2A2F3A';
    for (let gx = 0; gx <= cols; gx++) {
      for (let gy = 0; gy <= rows; gy++) {
        const x = gx * GRID_SIZE;
        const y = gy * GRID_SIZE;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (inBuildMode) {
      for (let gx = 0; gx < cols; gx++) {
        for (let gy = 0; gy < rows; gy++) {
          if (canBuildAt(gx, gy)) {
            const center = gridToWorld(gx, gy);
            ctx.fillStyle = 'rgba(78, 205, 196, 0.08)';
            ctx.fillRect(center.x - GRID_SIZE / 2, center.y - GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
            ctx.strokeStyle = 'rgba(78, 205, 196, 0.25)';
            ctx.lineWidth = 1;
            ctx.strokeRect(center.x - GRID_SIZE / 2, center.y - GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
          }
        }
      }
    }
  };

  const drawCore = (ctx: CanvasRenderingContext2D, pos: { x: number; y: number }, hp: number, maxHp: number) => {
    const hpRatio = hp / maxHp;
    const gradient = ctx.createRadialGradient(pos.x, pos.y, 5, pos.x, pos.y, CORE_RADIUS * 1.8);
    gradient.addColorStop(0, `rgba(0, 200, 255, ${0.9 * hpRatio + 0.1})`);
    gradient.addColorStop(0.5, `rgba(0, 150, 255, ${0.5 * hpRatio + 0.1})`);
    gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, CORE_RADIUS * 1.8, 0, Math.PI * 2);
    ctx.fill();

    const coreGradient = ctx.createRadialGradient(pos.x - 8, pos.y - 8, 2, pos.x, pos.y, CORE_RADIUS);
    coreGradient.addColorStop(0, '#8FDFFF');
    coreGradient.addColorStop(0.6, '#00BFFF');
    coreGradient.addColorStop(1, '#0066CC');
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, CORE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#B0E0E6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, CORE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    const barWidth = 60;
    const barHeight = 6;
    const barX = pos.x - barWidth / 2;
    const barY = pos.y + CORE_RADIUS + 12;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const hpColor = hpRatio > 0.5 ? '#00FF66' : hpRatio > 0.25 ? '#FFCC00' : '#FF3333';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  };

  const drawTowers = (ctx: CanvasRenderingContext2D, towersArr: typeof towers, selectedId: string | null) => {
    for (const tower of towersArr) {
      if (tower.id === selectedId) {
        ctx.fillStyle = 'rgba(75, 158, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(75, 158, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const size = 36;
      const half = size / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(tower.x - half + 2, tower.y - half + 2, size, size);

      const gradient = ctx.createLinearGradient(tower.x - half, tower.y - half, tower.x + half, tower.y + half);
      if (tower.level === 2) {
        gradient.addColorStop(0, '#7FB8FF');
        gradient.addColorStop(0.5, '#4B9EFF');
        gradient.addColorStop(1, '#2672D4');
      } else {
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.5, '#E8E8E8');
        gradient.addColorStop(1, '#CCCCCC');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(tower.x - half, tower.y - half, size, size);

      ctx.strokeStyle = tower.level === 2 ? '#1E5AA8' : '#999999';
      ctx.lineWidth = 2;
      ctx.strokeRect(tower.x - half, tower.y - half, size, size);

      ctx.fillStyle = tower.level === 2 ? '#FFFFFF' : '#333333';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${tower.level}`, tower.x, tower.y);
    }
  };

  const drawMeteors = (ctx: CanvasRenderingContext2D, meteorsArr: typeof meteors) => {
    for (const meteor of meteorsArr) {
      const gradient = ctx.createRadialGradient(
        meteor.x - 3,
        meteor.y - 3,
        2,
        meteor.x,
        meteor.y,
        meteor.radius
      );
      gradient.addColorStop(0, '#FF8C00');
      gradient.addColorStop(0.5, '#FF6347');
      gradient.addColorStop(1, '#FF4500');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 150, 50, 0.4)';
      const trailAngle = meteor.angle + Math.PI;
      for (let i = 1; i <= 3; i++) {
        const tx = meteor.x + Math.cos(trailAngle) * i * 8;
        const ty = meteor.y + Math.sin(trailAngle) * i * 8;
        const tr = meteor.radius * (1 - i * 0.2);
        ctx.globalAlpha = 0.3 - i * 0.08;
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (meteor.hp < meteor.maxHp) {
        const barWidth = 24;
        const barHeight = 3;
        const barX = meteor.x - barWidth / 2;
        const barY = meteor.y - meteor.radius - 8;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(barX, barY, barWidth * (meteor.hp / meteor.maxHp), barHeight);
      }
    }
  };

  const drawBullets = (ctx: CanvasRenderingContext2D, bulletsArr: typeof bullets) => {
    for (const bullet of bulletsArr) {
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, particlesArr: typeof particles) => {
    for (const p of particlesArr) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const drawMapBorder = (
    ctx: CanvasRenderingContext2D,
    victoryAnim: boolean,
    victoryStart: number,
    now: number
  ) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(30, 58, 95, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, MAP_WIDTH - 4, MAP_HEIGHT - 4);

    if (victoryAnim) {
      const elapsed = now - victoryStart;
      const t = elapsed / VICTORY_ANIM_DURATION;
      const alpha = Math.sin(t * Math.PI);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    }
    ctx.restore();
  };

  const drawVictoryGlow = (
    ctx: CanvasRenderingContext2D,
    now: number,
    victoryAnim: boolean,
    victoryStart: number
  ) => {
    if (!victoryAnim) return;
    const elapsed = now - victoryStart;
    const t = elapsed / VICTORY_ANIM_DURATION;
    const alpha = Math.sin(t * Math.PI) * 0.15;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  };

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameLoop]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = MAP_WIDTH / rect.width;
    const scaleY = MAP_HEIGHT / rect.height;
    const worldX = (e.clientX - rect.left) * scaleX;
    const worldY = (e.clientY - rect.top) * scaleY;

    const state = useGameStore.getState();

    const clickedTower = getTowerAtPosition(worldX, worldY);
    if (clickedTower) {
      if (state.selectedTowerId === clickedTower.id) {
        state.selectTower(null);
      } else {
        state.selectTower(clickedTower.id);
      }
      return;
    }

    if (state.buildMode) {
      const grid = worldToGrid(worldX, worldY);
      if (canBuildAt(grid.x, grid.y)) {
        const center = gridToWorld(grid.x, grid.y);
        if (state.resources >= TOWER_COST) {
          state.setBuildBubble(center);
        } else {
          state.showInsufficientResource('资源不足');
        }
      }
    } else {
      state.selectTower(null);
    }
  };

  const handleConfirmBuild = () => {
    const state = useGameStore.getState();
    if (!state.buildBubblePosition) return;
    const grid = worldToGrid(state.buildBubblePosition.x, state.buildBubblePosition.y);
    buildTowerAt(grid.x, grid.y);
  };

  const handleCancelBuild = () => {
    useGameStore.getState().setBuildBubble(null);
  };

  const handleUpgradeTower = () => {
    const state = useGameStore.getState();
    if (!state.selectedTowerId) return;
    const tower = state.towers.find((t) => t.id === state.selectedTowerId);
    if (!tower) return;
    if (tower.level >= 2) return;
    const success = state.upgradeTower(state.selectedTowerId);
    if (!success) {
      state.showInsufficientResource('资源不足');
    }
  };

  const hpPercent = (coreHp / coreMaxHp) * 100;
  const selectedTower = towers.find((t) => t.id === selectedTowerId);

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        MeteorGuard
      </div>

      <ResourceBar
        hp={coreHp}
        maxHp={coreMaxHp}
        hpPercent={hpPercent}
        resources={resources}
        currentWave={currentWave}
        isMobile={isMobile}
      />

      <div
        style={{
          ...styles.mapWrapper,
          transform: `scale(${mapScale})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          onClick={handleCanvasClick}
          style={styles.canvas}
        />

        {buildBubblePosition && (
          <BuildBubble
            position={buildBubblePosition}
            mapWidth={MAP_WIDTH}
            cost={TOWER_COST}
            canAfford={resources >= TOWER_COST}
            onConfirm={handleConfirmBuild}
            onCancel={handleCancelBuild}
          />
        )}

        {selectedTower && selectedTower.level < 2 && (
          <BuildBubble
            position={{ x: selectedTower.x, y: selectedTower.y - 50 }}
            mapWidth={MAP_WIDTH}
            cost={100}
            canAfford={resources >= 100}
            onConfirm={handleUpgradeTower}
            onCancel={() => useGameStore.getState().selectTower(null)}
            isUpgrade
          />
        )}
      </div>

      <BuildPanel
        resources={resources}
        isWaveActive={isWaveActive}
        buildMode={buildMode}
        isMobile={isMobile}
      />

      {insufficientResourceMsg && (
        <div style={styles.insufficientMsg}>
          {insufficientResourceMsg}
        </div>
      )}

      {isGameOver && (
        <GameOverMask finalWave={finalWave} />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0E14',
    overflow: 'hidden',
  },
  title: {
    position: 'absolute',
    top: 20,
    left: 24,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 1,
    textShadow: '0 2px 8px rgba(0,150,255,0.6)',
    zIndex: 10,
  },
  mapWrapper: {
    position: 'relative',
    boxShadow: '0 0 30px rgba(30, 58, 95, 0.5)',
    borderRadius: 4,
  },
  canvas: {
    display: 'block',
    cursor: 'crosshair',
    borderRadius: 4,
  },
  insufficientMsg: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#FF3333',
    fontSize: 20,
    fontWeight: 700,
    padding: '12px 24px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    pointerEvents: 'none',
    zIndex: 50,
    animation: 'fadeInOut 1s ease',
  },
};

export default Renderer;
