import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store';
import {
  Alien,
  AlienType,
  Bullet,
  RuneType,
  MagicEffect,
  ALIEN_CONFIGS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GAME_AREA_HEIGHT,
  DRAW_AREA_X,
  DRAW_AREA_Y,
  DRAW_AREA_WIDTH,
  DRAW_AREA_HEIGHT,
  WAVE_SPAWN_INTERVAL,
  WAVE_MIN_COUNT,
  WAVE_MAX_COUNT,
  TRAJECTORY_SAMPLE_INTERVAL,
  RUNE_ENERGY_COST,
  KILL_ENERGY_REWARD,
  ENERGY_REGEN_INTERVAL,
  BASE_SCORE,
  COMBO_BONUS,
  COMBO_THRESHOLD,
  PLAYER_X,
  PLAYER_Y,
  RUNE_TEMPLATES,
} from '../types';
import {
  generateId,
  generateBezierPath,
  getPointOnPath,
  matchRune,
  getDistance,
  circleCollision,
} from '../utils';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const lastSamplePoint = useRef<{ x: number; y: number } | null>(null);

  const {
    gameState,
    aliens,
    bullets,
    magicEffects,
    trajectory,
    isDrawing,
    energy,
    lastWaveTime,
    matchFailFlash,
    shieldActive,
    starParticles,
    addAlien,
    removeAlien,
    updateAlien,
    addBullet,
    removeBullet,
    updateBullet,
    addMagicEffect,
    removeMagicEffect,
    addTrajectoryPoint,
    clearTrajectory,
    setDrawing,
    consumeEnergy,
    addEnergy,
    regenerateEnergy,
    addScore,
    incrementCombo,
    resetCombo,
    incrementEscaped,
    setLastWaveTime,
    setLastEnergyRegenTime,
    setSelectedRune,
    triggerMatchFail,
    clearMatchFail,
    triggerComboBreak,
    clearComboBreak,
    activateShield,
    deactivateShield,
    updateStarParticles,
  } = useGameStore();

  const spawnWave = useCallback(() => {
    const count = Math.floor(Math.random() * (WAVE_MAX_COUNT - WAVE_MIN_COUNT + 1)) + WAVE_MIN_COUNT;
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let type: AlienType;
      if (rand < 0.15) {
        type = AlienType.BOSS;
      } else if (rand < 0.4) {
        type = AlienType.ARMORED;
      } else {
        type = AlienType.NORMAL;
      }

      const config = ALIEN_CONFIGS[type];
      const startX = Math.random() * (CANVAS_WIDTH - config.size) + config.size / 2;
      const endX = Math.random() * (CANVAS_WIDTH - config.size) + config.size / 2;
      const path = generateBezierPath(startX, -config.size, endX, CANVAS_HEIGHT + config.size, CANVAS_WIDTH);
      const speedMultiplier = 0.5 + Math.random() * 1;

      const alien: Alien = {
        id: generateId(),
        type,
        x: startX,
        y: -config.size,
        hp: config.hp,
        maxHp: config.hp,
        speed: config.speed * speedMultiplier,
        baseSpeed: config.speed * speedMultiplier,
        size: config.size,
        path,
        pathProgress: 0,
        lastShootTime: now,
      };

      addAlien(alien);
    }
  }, [addAlien]);

  const castSpell = useCallback((runeType: RuneType) => {
    const template = RUNE_TEMPLATES.find((r) => r.type === runeType);
    if (!template) return;

    setSelectedRune(runeType);
    incrementCombo();

    const currentCombo = useGameStore.getState().combo;
    const comboBonus = currentCombo >= COMBO_THRESHOLD ? COMBO_BONUS : 0;

    const effect: MagicEffect = {
      id: generateId(),
      type: runeType,
      x: PLAYER_X,
      y: PLAYER_Y,
      startTime: Date.now(),
      duration: 1000,
      hitAlienIds: [],
    };

    const state = useGameStore.getState();

    switch (runeType) {
      case RuneType.CIRCLE:
        effect.duration = 3000;
        effect.radius = 120;
        activateShield(3000);
        addMagicEffect(effect);
        break;

      case RuneType.TRIANGLE:
        effect.duration = 500;
        effect.radius = 150;
        addMagicEffect(effect);
        state.aliens.forEach((alien) => {
          if (circleCollision(PLAYER_X, PLAYER_Y, 150, alien.x, alien.y, alien.size / 2)) {
            updateAlien(alien.id, { hp: alien.hp - 3 });
          }
        });
        break;

      case RuneType.LIGHTNING: {
        effect.duration = 800;
        const sortedAliens = [...state.aliens].sort((a, b) =>
          getDistance(PLAYER_X, PLAYER_Y, a.x, a.y) - getDistance(PLAYER_X, PLAYER_Y, b.x, b.y)
        );
        const hitAliens = sortedAliens.slice(0, 3);
        effect.hitAlienIds = hitAliens.map((a) => a.id);
        addMagicEffect(effect);
        hitAliens.forEach((alien) => {
          updateAlien(alien.id, { hp: alien.hp - 1 });
        });
        break;
      }

      case RuneType.SPIRAL: {
        effect.duration = 3000;
        effect.radius = 200;
        addMagicEffect(effect);
        state.aliens.forEach((alien) => {
          if (circleCollision(PLAYER_X, PLAYER_Y, 200, alien.x, alien.y, alien.size / 2)) {
            updateAlien(alien.id, { speed: alien.speed * 0.3 });
          }
        });
        break;
      }

      case RuneType.STAR: {
        effect.duration = 600;
        effect.radius = 180;
        addMagicEffect(effect);
        const angles = [0, Math.PI / 2.5, (Math.PI * 2) / 2.5, (Math.PI * 3) / 2.5, (Math.PI * 4) / 2.5];
        angles.forEach((angle) => {
          const bx = PLAYER_X + Math.cos(angle) * 10;
          const by = PLAYER_Y + Math.sin(angle) * 10;
          const bullet: Bullet = {
            id: generateId(),
            x: bx,
            y: by,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            radius: 8,
          };
          addBullet(bullet);
        });
        break;
      }
    }

    addScore(BASE_SCORE + comboBonus);
    setTimeout(() => setSelectedRune(null), 500);
  }, [addMagicEffect, addScore, addBullet, updateAlien, activateShield, incrementCombo, setSelectedRune]);

  const handleDrawingComplete = useCallback(() => {
    const state = useGameStore.getState();
    if (state.trajectory.length < 5) {
      clearTrajectory();
      return;
    }

    if (!consumeEnergy(RUNE_ENERGY_COST)) {
      clearTrajectory();
      return;
    }

    const match = matchRune(state.trajectory);
    if (match) {
      castSpell(match.type);
    } else {
      triggerMatchFail();
      resetCombo();
      triggerComboBreak();
      setTimeout(clearMatchFail, 200);
      setTimeout(clearComboBreak, 300);
    }

    clearTrajectory();
    lastSamplePoint.current = null;
  }, [castSpell, clearTrajectory, consumeEnergy, triggerMatchFail, resetCombo, triggerComboBreak, clearMatchFail, clearComboBreak]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  }, []);

  const isInDrawArea = useCallback((x: number, y: number) => {
    return (
      x >= DRAW_AREA_X &&
      x <= DRAW_AREA_X + DRAW_AREA_WIDTH &&
      y >= DRAW_AREA_Y &&
      y <= DRAW_AREA_Y + DRAW_AREA_HEIGHT
    );
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'playing' || energy < RUNE_ENERGY_COST) return;
    const { x, y } = getCanvasCoords(e);
    if (!isInDrawArea(x, y)) return;

    e.preventDefault();
    setDrawing(true);
    clearTrajectory();
    lastSamplePoint.current = { x, y };
    addTrajectoryPoint({ x, y, timestamp: Date.now() });
  }, [gameState, energy, getCanvasCoords, isInDrawArea, setDrawing, clearTrajectory, addTrajectoryPoint]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCanvasCoords(e);
    if (!isInDrawArea(x, y)) return;

    const lastPoint = lastSamplePoint.current;
    if (lastPoint) {
      const dist = getDistance(lastPoint.x, lastPoint.y, x, y);
      if (dist >= TRAJECTORY_SAMPLE_INTERVAL) {
        addTrajectoryPoint({ x, y, timestamp: Date.now() });
        lastSamplePoint.current = { x, y };
      }
    }
  }, [isDrawing, getCanvasCoords, isInDrawArea, addTrajectoryPoint]);

  const handlePointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    setDrawing(false);
    handleDrawingComplete();
  }, [isDrawing, setDrawing, handleDrawingComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = (now: number) => {
      const state = useGameStore.getState();
      const deltaTime = now - lastFrameTime.current;
      lastFrameTime.current = now;

      if (state.gameState !== 'playing') {
        animationRef.current = requestAnimationFrame(update);
        return;
      }

      if (now - state.lastWaveTime >= WAVE_SPAWN_INTERVAL) {
        spawnWave();
        setLastWaveTime(now);
      }

      if (now - state.lastEnergyRegenTime >= ENERGY_REGEN_INTERVAL) {
        regenerateEnergy();
        setLastEnergyRegenTime(now);
      }

      if (state.shieldActive && now >= state.shieldEndTime) {
        deactivateShield();
      }

      state.aliens.forEach((alien) => {
        const newProgress = alien.pathProgress + alien.speed * 0.0003 * deltaTime;
        const pos = getPointOnPath(alien.path, Math.min(newProgress, 1));

        if (newProgress >= 1) {
          removeAlien(alien.id);
          incrementEscaped();
        } else {
          updateAlien(alien.id, {
            x: pos.x,
            y: pos.y,
            pathProgress: newProgress,
          });
        }

        if (alien.type === AlienType.BOSS && now - alien.lastShootTime >= 3000) {
          const dx = PLAYER_X - alien.x;
          const dy = PLAYER_Y - alien.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const bullet: Bullet = {
            id: generateId(),
            x: alien.x,
            y: alien.y,
            vx: (dx / dist) * 3,
            vy: (dy / dist) * 3,
            radius: 10,
          };
          addBullet(bullet);
          updateAlien(alien.id, { lastShootTime: now });
        }
      });

      const bulletsToRemove: string[] = [];
      state.bullets.forEach((bullet) => {
        const newX = bullet.x + bullet.vx;
        const newY = bullet.y + bullet.vy;

        if (newX < 0 || newX > CANVAS_WIDTH || newY < 0 || newY > CANVAS_HEIGHT) {
          bulletsToRemove.push(bullet.id);
          return;
        }

        updateBullet(bullet.id, { x: newX, y: newY });

        for (const alien of state.aliens) {
          if (circleCollision(newX, newY, bullet.radius, alien.x, alien.y, alien.size / 2)) {
            bulletsToRemove.push(bullet.id);
            updateAlien(alien.id, { hp: alien.hp - 1 });
            break;
          }
        }

        if (state.shieldActive && circleCollision(newX, newY, bullet.radius, PLAYER_X, PLAYER_Y, 120)) {
          bulletsToRemove.push(bullet.id);
        }

        if (circleCollision(newX, newY, bullet.radius, PLAYER_X, PLAYER_Y, 20)) {
          bulletsToRemove.push(bullet.id);
          if (!state.shieldActive) {
            incrementEscaped();
          }
        }
      });

      bulletsToRemove.forEach((id) => removeBullet(id));

      state.aliens.forEach((alien) => {
        if (alien.hp <= 0) {
          removeAlien(alien.id);
          addEnergy(KILL_ENERGY_REWARD);
          addScore(BASE_SCORE);
        }
      });

      state.magicEffects.forEach((effect) => {
        if (now - effect.startTime >= effect.duration) {
          removeMagicEffect(effect.id);
          if (effect.type === RuneType.SPIRAL) {
            state.aliens.forEach((alien) => {
              updateAlien(alien.id, { speed: alien.baseSpeed });
            });
          }
        }
      });

      if (Math.random() < 0.1) {
        updateStarParticles();
      }

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    spawnWave,
    regenerateEnergy,
    deactivateShield,
    setLastWaveTime,
    setLastEnergyRegenTime,
    removeAlien,
    updateAlien,
    addBullet,
    removeBullet,
    updateBullet,
    addEnergy,
    addScore,
    incrementEscaped,
    removeMagicEffect,
    updateStarParticles,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#1A1D2E';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      starParticles.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(Math.floor(star.x), Math.floor(star.y), 1, 1);
      });

      ctx.fillStyle = '#2A2D40';
      ctx.fillRect(0, GAME_AREA_HEIGHT, CANVAS_WIDTH, 2);

      const drawAreaDisabled = energy < RUNE_ENERGY_COST;
      ctx.fillStyle = drawAreaDisabled ? '#888888' : '#D3D3D3';
      ctx.fillRect(DRAW_AREA_X, DRAW_AREA_Y, DRAW_AREA_WIDTH, DRAW_AREA_HEIGHT);

      ctx.strokeStyle = drawAreaDisabled ? '#666666' : '#AAAAAA';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(DRAW_AREA_X + DRAW_AREA_WIDTH / 2, DRAW_AREA_Y);
      ctx.lineTo(DRAW_AREA_X + DRAW_AREA_WIDTH / 2, DRAW_AREA_Y + DRAW_AREA_HEIGHT);
      ctx.moveTo(DRAW_AREA_X, DRAW_AREA_Y + DRAW_AREA_HEIGHT / 2);
      ctx.lineTo(DRAW_AREA_X + DRAW_AREA_WIDTH, DRAW_AREA_Y + DRAW_AREA_HEIGHT / 2);
      ctx.stroke();

      if (matchFailFlash) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      magicEffects.forEach((effect) => {
        const elapsed = Date.now() - effect.startTime;
        const progress = Math.min(elapsed / effect.duration, 1);
        const template = RUNE_TEMPLATES.find((r) => r.type === effect.type);
        if (!template) return;

        ctx.save();
        ctx.globalAlpha = 1 - progress * 0.5;

        switch (effect.type) {
          case RuneType.CIRCLE:
            ctx.strokeStyle = template.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y - 30, 120, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = `${template.color}33`;
            ctx.fill();
            break;

          case RuneType.TRIANGLE: {
            const radius = 150 * (0.5 + progress * 0.5);
            ctx.strokeStyle = template.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
              const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
              const x = effect.x + Math.cos(angle) * radius;
              const y = effect.y - 30 + Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = `${template.color}44`;
            ctx.fill();
            break;
          }

          case RuneType.LIGHTNING: {
            const hitAliens = effect.hitAlienIds || [];
            ctx.strokeStyle = template.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = template.color;
            ctx.shadowBlur = 10;

            let lastX = effect.x;
            let lastY = effect.y - 30;
            hitAliens.forEach((id) => {
              const alien = aliens.find((a) => a.id === id);
              if (alien) {
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                const segments = 5;
                for (let i = 1; i <= segments; i++) {
                  const t = i / segments;
                  const x = lastX + (alien.x - lastX) * t + (Math.random() - 0.5) * 20;
                  const y = lastY + (alien.y - lastY) * t + (Math.random() - 0.5) * 20;
                  ctx.lineTo(x, y);
                }
                ctx.stroke();
                lastX = alien.x;
                lastY = alien.y;
              }
            });
            break;
          }

          case RuneType.SPIRAL: {
            const radius = 200;
            ctx.strokeStyle = template.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i <= 100; i++) {
              const t = i / 100;
              const angle = t * Math.PI * 4 + progress * Math.PI;
              const r = t * radius;
              const x = effect.x + Math.cos(angle) * r;
              const y = effect.y - 30 + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
            break;
          }

          case RuneType.STAR: {
            const outerR = 180;
            const innerR = 72;
            ctx.strokeStyle = template.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
              const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
              const r = i % 2 === 0 ? outerR : innerR;
              const x = effect.x + Math.cos(angle) * r;
              const y = effect.y - 30 + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            break;
          }
        }

        ctx.restore();
      });

      aliens.forEach((alien) => {
        const config = ALIEN_CONFIGS[alien.type];
        const halfSize = alien.size / 2;

        ctx.fillStyle = config.color;
        ctx.fillRect(
          Math.floor(alien.x - halfSize),
          Math.floor(alien.y - halfSize),
          alien.size,
          alien.size
        );

        if (config.borderWidth > 0) {
          ctx.strokeStyle = config.borderColor;
          ctx.lineWidth = config.borderWidth;
          ctx.strokeRect(
            Math.floor(alien.x - halfSize),
            Math.floor(alien.y - halfSize),
            alien.size,
            alien.size
          );
        }

        if (alien.maxHp > 1) {
          const barWidth = alien.size;
          const barHeight = 4;
          const barY = alien.y - halfSize - 8;

          ctx.fillStyle = '#333333';
          ctx.fillRect(alien.x - barWidth / 2, barY, barWidth, barHeight);

          ctx.fillStyle = '#E74C3C';
          ctx.fillRect(
            alien.x - barWidth / 2,
            barY,
            barWidth * (alien.hp / alien.maxHp),
            barHeight
          );
        }

        const eyeSize = Math.max(4, alien.size / 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(alien.x - halfSize * 0.5 - eyeSize / 2, alien.y - eyeSize / 2, eyeSize, eyeSize);
        ctx.fillRect(alien.x + halfSize * 0.5 - eyeSize / 2, alien.y - eyeSize / 2, eyeSize, eyeSize);
        ctx.fillStyle = '#000000';
        ctx.fillRect(alien.x - halfSize * 0.5 - eyeSize / 4, alien.y - eyeSize / 4, eyeSize / 2, eyeSize / 2);
        ctx.fillRect(alien.x + halfSize * 0.5 - eyeSize / 4, alien.y - eyeSize / 4, eyeSize / 2, eyeSize / 2);
      });

      bullets.forEach((bullet) => {
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#C0392B';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      if (trajectory.length > 1) {
        ctx.strokeStyle = '#4A90D9';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(trajectory[0].x, trajectory[0].y);
        for (let i = 1; i < trajectory.length; i++) {
          ctx.lineTo(trajectory[i].x, trajectory[i].y);
        }
        ctx.stroke();
      }

      ctx.fillStyle = '#8E44AD';
      ctx.fillRect(PLAYER_X - 15, PLAYER_Y - 15, 30, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(PLAYER_X - 5, PLAYER_Y - 5, 10, 10);

      if (shieldActive) {
        ctx.strokeStyle = '#4A90D9';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.2;
        ctx.beginPath();
        ctx.arc(PLAYER_X, PLAYER_Y, 120, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      requestAnimationFrame(render);
    };

    const renderLoop = requestAnimationFrame(render);
    return () => cancelAnimationFrame(renderLoop);
  }, [
    aliens,
    bullets,
    magicEffects,
    trajectory,
    starParticles,
    matchFailFlash,
    shieldActive,
    energy,
  ]);

  useEffect(() => {
    if (gameState === 'playing' && lastWaveTime === 0) {
      spawnWave();
      setLastWaveTime(Date.now());
    }
  }, [gameState, lastWaveTime, spawnWave, setLastWaveTime]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      style={{
        display: 'block',
        margin: '0 auto',
        imageRendering: 'pixelated',
        cursor: energy >= RUNE_ENERGY_COST ? 'crosshair' : 'not-allowed',
      }}
    />
  );
};

export default GameCanvas;
