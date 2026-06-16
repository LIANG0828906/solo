import { useGameStore, Wall, Pulse, Vector2, CANVAS_WIDTH, CANVAS_HEIGHT } from './gameStore';
import { useAudioStore } from '../audio/audioStore';

const keys = new Set<string>();
let pulseIdsForEcho = new Set<number>();
let blindCheckDone = false;

export function setupInputHandlers(canvas: HTMLCanvasElement) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    keys.add(e.key.toLowerCase());

    if (e.key === ' ' && !e.repeat) {
      const state = useGameStore.getState();
      if (state.gameState === 'playing') {
        const emitted = state.emitPulse(false);
        if (emitted) {
          useAudioStore.getState().playPulse('normal');
        }
      }
    }

    if (e.key.toLowerCase() === 'enter' && !e.repeat) {
      const state = useGameStore.getState();
      if (state.gameState === 'menu') {
        state.loadLevel(0);
      } else if (state.gameState === 'gameover') {
        state.loadLevel(state.levelIndex);
      } else if (state.gameState === 'victory') {
        state.resetGame();
      } else if (state.gameState === 'levelComplete') {
        state.loadLevel(state.levelIndex + 1);
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.key.toLowerCase());
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}

export function gameLoop(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let lastTime = performance.now();
  let animationId: number;

  const tick = () => {
    const now = performance.now();
    const dt = Math.min(now - lastTime, 33) / 1000;
    lastTime = now;

    const state = useGameStore.getState();

    if (state.gameState === 'playing') {
      updatePlayer(dt);
      checkCrystalCollection();
      checkExitCollision();
      state.updateEnemies(now);
      state.checkGameOver(now);
      calculateEchoPoints(now);
      checkEnemyBlind(now);
      updateParticles(dt);
    }

    render(ctx, now);
    animationId = requestAnimationFrame(tick);
  };

  animationId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(animationId);
}

function updatePlayer(dt: number) {
  const state = useGameStore.getState();
  if (!state.levelData) return;

  let dx = 0, dy = 0;
  const speed = state.player.speed * dt;

  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx = (dx / len) * speed;
    dy = (dy / len) * speed;
    state.movePlayer(dx, dy);
  }

  if (keys.has('e')) {
    const state = useGameStore.getState();
    if (!state.highFrequencyActive && performance.now() >= state.highFrequencyCooldownEnd) {
      const emitted = state.emitPulse(true);
      if (emitted) {
        blindCheckDone = false;
      }
    }
  }
}

function checkCrystalCollection() {
  const state = useGameStore.getState();
  const { player, crystals } = state;

  for (const crystal of crystals) {
    if (crystal.collected) continue;
    const dx = crystal.x - player.x;
    const dy = crystal.y - player.y;
    if (dx * dx + dy * dy < 400) {
      state.collectCrystal(crystal.id);
      useAudioStore.getState().playCollect();
      if (state.collectedCount + 1 >= state.crystalsRequired) {
        useAudioStore.getState().playExit();
      }
    }
  }
}

function checkExitCollision() {
  const state = useGameStore.getState();
  if (!state.exitOpen) return;

  const dx = state.exit.x - state.player.x;
  const dy = state.exit.y - state.player.y;
  if (dx * dx + dy * dy < 1600) {
    state.advanceLevel();
  }
}

function calculateEchoPoints(now: number) {
  const state = useGameStore.getState();
  const { pulses, levelData, crystals, enemies } = state;
  if (!levelData) return;

  for (const pulse of pulses) {
    const id = pulse.id;
    if (pulseIdsForEcho.has(id)) continue;

    const elapsed = now - pulse.startTime;
    const progress = Math.min(1, elapsed / (pulse.duration * 0.5));
    if (progress < 0.3) continue;

    pulseIdsForEcho.add(id);

    const fanAngle = Math.PI * 2 / 3;
    const sampleAngles = 24;
    const maxDist = pulse.arcs[pulse.arcs.length - 1].radius;

    for (let i = 0; i <= sampleAngles; i++) {
      const t = i / sampleAngles;
      const rayAngle = pulse.angle - fanAngle / 2 + fanAngle * t;
      const dx = Math.cos(rayAngle);
      const dy = Math.sin(rayAngle);

      const hit = rayCast(pulse.x, pulse.y, dx, dy, maxDist, levelData.walls);
      if (hit) {
        const dist = Math.sqrt((hit.x - pulse.x) ** 2 + (hit.y - pulse.y) ** 2);
        state.addEchoPoint(hit.x, hit.y, dist);
      }
    }

    for (const crystal of crystals) {
      if (crystal.collected) continue;
      const cdx = crystal.x - pulse.x;
      const cdy = crystal.y - pulse.y;
      const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
      if (cdist > maxDist) continue;
      const angleToCrystal = Math.atan2(cdy, cdx);
      let angleDiff = Math.abs(((angleToCrystal - pulse.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (angleDiff <= fanAngle / 2) {
        state.addEchoPoint(crystal.x, crystal.y, cdist);
      }
    }

    for (const enemy of enemies) {
      const edx = enemy.x - pulse.x;
      const edy = enemy.y - pulse.y;
      const edist = Math.sqrt(edx * edx + edy * edy);
      if (edist > maxDist) continue;
      const angleToEnemy = Math.atan2(edy, edx);
      let angleDiff = Math.abs(((angleToEnemy - pulse.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (angleDiff <= fanAngle / 2) {
        state.addEchoPoint(enemy.x, enemy.y, edist);
      }
    }

    const exitDx = state.exit.x - pulse.x;
    const exitDy = state.exit.y - pulse.y;
    const exitDist = Math.sqrt(exitDx * exitDx + exitDy * exitDy);
    if (exitDist <= maxDist) {
      const angleToExit = Math.atan2(exitDy, exitDx);
      let angleDiff = Math.abs(((angleToExit - pulse.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (angleDiff <= fanAngle / 2) {
        state.addEchoPoint(state.exit.x, state.exit.y, exitDist);
      }
    }
  }

  setTimeout(() => {
    pulseIdsForEcho.clear();
  }, 200);
}

function checkEnemyBlind(now: number) {
  const state = useGameStore.getState();
  if (!state.highFrequencyActive || blindCheckDone) return;
  if (now >= state.highFrequencyEndTime) {
    blindCheckDone = true;
    return;
  }

  let anyBlinded = false;
  for (const enemy of state.enemies) {
    if (enemy.blinded) continue;
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 350) {
      anyBlinded = true;
    }
  }
  if (anyBlinded) {
    useAudioStore.getState().playBlind();
    blindCheckDone = true;
  }
}

function rayCast(x: number, y: number, dx: number, dy: number, maxDist: number, walls: Wall[]): Vector2 | null {
  let nearestHit: Vector2 | null = null;
  let nearestDist = maxDist;

  for (const wall of walls) {
    const hit = raySegmentIntersect(x, y, dx, dy, wall.x1, wall.y1, wall.x2, wall.y2);
    if (hit) {
      const dist = Math.sqrt((hit.x - x) ** 2 + (hit.y - y) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestHit = hit;
      }
    }
  }

  return nearestHit;
}

function raySegmentIntersect(px: number, py: number, dx: number, dy: number, x1: number, y1: number, x2: number, y2: number): Vector2 | null {
  const rdx = dx, rdy = dy;
  const sdx = x2 - x1, sdy = y2 - y1;
  const denom = rdx * sdy - rdy * sdx;
  if (Math.abs(denom) < 0.0001) return null;

  const t = ((x1 - px) * sdy - (y1 - py) * sdx) / denom;
  const u = ((x1 - px) * rdy - (y1 - py) * rdx) / denom;

  if (t >= 0 && u >= 0 && u <= 1) {
    return { x: px + t * rdx, y: py + t * rdy };
  }
  return null;
}

function updateParticles(dt: number) {
  const state = useGameStore.getState();
  const now = performance.now();

  const updated = state.particles.map(p => {
    const elapsed = (now - p.startTime) / 1000;
    return {
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vx: p.vx * 0.96,
      vy: p.vy * 0.96
    };
  });

  if (updated.length !== state.particles.length ||
      updated.some((p, i) => p.x !== state.particles[i].x || p.y !== state.particles[i].y)) {
    useGameStore.setState({ particles: updated });
  }
}

function render(ctx: CanvasRenderingContext2D, now: number) {
  const state = useGameStore.getState();
  const { levelData, gameState } = state;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (!levelData) {
    renderMenu(ctx, now);
    return;
  }

  const darkness = levelData.darkness;

  renderWalls(ctx, levelData.walls);

  renderPulses(ctx, state.pulses, now);
  renderEchoPoints(ctx, state.echoPoints, now);
  renderCrystals(ctx, state.crystals, now);
  renderExit(ctx, state.exit, state.exitOpen, now);
  renderEnemies(ctx, state.enemies, now);
  renderParticles(ctx, state.particles, now);
  renderPlayer(ctx, state.player, state.highFrequencyActive && now < state.highFrequencyEndTime);

  applyDarkness(ctx, darkness, state.player, state.pulses, state.echoPoints, now);
  renderHUD(ctx, state, now);

  if (gameState === 'gameover') renderGameOver(ctx, now);
  else if (gameState === 'victory') renderVictory(ctx, now);
  else if (gameState === 'levelComplete') renderLevelComplete(ctx, state.levelIndex, now);
}

function renderWalls(ctx: CanvasRenderingContext2D, walls: Wall[]) {
  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  for (const wall of walls) {
    ctx.moveTo(wall.x1, wall.y1);
    ctx.lineTo(wall.x2, wall.y2);
  }
  ctx.stroke();
}

function renderPulses(ctx: CanvasRenderingContext2D, pulses: Pulse[], now: number) {
  for (const pulse of pulses) {
    const elapsed = now - pulse.startTime;
    const progress = Math.min(1, elapsed / pulse.duration);
    const waveProgress = Math.min(1, progress * 1.5);

    for (let i = 0; i < pulse.arcs.length; i++) {
      const arc = pulse.arcs[i];
      const arcProgress = Math.max(0, Math.min(1, waveProgress * (pulse.arcs.length) - i));
      if (arcProgress <= 0) continue;

      const alpha = arc.alpha * (1 - progress * 0.6);
      ctx.strokeStyle = arc.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2 + i * 0.5;
      ctx.lineCap = 'round';

      ctx.beginPath();
      const numPoints = arc.points.length;
      const visibleStart = 0;
      const visibleEnd = Math.floor(numPoints * arcProgress);

      for (let j = visibleStart; j <= visibleEnd && j < numPoints; j++) {
        const pt = arc.points[j];
        if (j === visibleStart) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function renderEchoPoints(ctx: CanvasRenderingContext2D, echoPoints: any[], now: number) {
  for (const echo of echoPoints) {
    const elapsed = now - echo.startTime;
    const life = 1 - elapsed / echo.duration;
    if (life <= 0) continue;

    const alpha = life * 0.9;
    const flicker = 0.7 + 0.3 * Math.sin(now * 0.02 + echo.id);
    const brightness = echo.brightness * flicker * life;

    const size = 2 + brightness * 3;
    const gradient = ctx.createRadialGradient(echo.x, echo.y, 0, echo.x, echo.y, size * 2.5);
    gradient.addColorStop(0, `rgba(0, 255, 200, ${alpha * brightness})`);
    gradient.addColorStop(0.5, `rgba(0, 200, 255, ${alpha * brightness * 0.5})`);
    gradient.addColorStop(1, `rgba(0, 100, 255, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(echo.x, echo.y, size * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(200, 255, 255, ${alpha * brightness})`;
    ctx.beginPath();
    ctx.arc(echo.x, echo.y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderCrystals(ctx: CanvasRenderingContext2D, crystals: any[], now: number) {
  for (const crystal of crystals) {
    if (crystal.collected) continue;
    const rot = (now / 1000) % 2;
    drawDiamond(ctx, crystal.x, crystal.y, 12, '#FFD700', rot * Math.PI);

    const glow = ctx.createRadialGradient(crystal.x, crystal.y, 0, crystal.x, crystal.y, 30);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(crystal.x, crystal.y, 30, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderExit(ctx: CanvasRenderingContext2D, exit: Vector2, exitOpen: boolean, now: number) {
  if (!exitOpen) {
    ctx.strokeStyle = 'rgba(100, 80, 60, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(exit.x - 20, exit.y + 40);
    ctx.lineTo(exit.x - 8, exit.y - 30);
    ctx.lineTo(exit.x + 12, exit.y + 20);
    ctx.lineTo(exit.x + 20, exit.y - 40);
    ctx.stroke();
    return;
  }

  const t = (now / 1000) % 1.5 / 1.5;
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
  const color1 = '#FF6600';
  const color2 = '#FFAA00';
  const glowRadius = 0 + pulse * 40;

  const glow = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, 40 + glowRadius);
  glow.addColorStop(0, 'rgba(255, 170, 0, 0.6)');
  glow.addColorStop(0.5, 'rgba(255, 102, 0, 0.3)');
  glow.addColorStop(1, 'rgba(255, 102, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(exit.x, exit.y, 40 + glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineCap = 'round';
  ctx.lineWidth = 4 + pulse * 4;
  const col = pulse > 0.5 ? color2 : color1;
  ctx.strokeStyle = col;
  ctx.shadowColor = color2;
  ctx.shadowBlur = 10 + pulse * 15;
  ctx.beginPath();
  ctx.moveTo(exit.x - 20, exit.y + 40);
  ctx.lineTo(exit.x - 8, exit.y - 30);
  ctx.lineTo(exit.x + 12, exit.y + 20);
  ctx.lineTo(exit.x + 20, exit.y - 40);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function renderEnemies(ctx: CanvasRenderingContext2D, enemies: any[], now: number) {
  for (const enemy of enemies) {
    const rotSpeed = enemy.blinded ? 0.25 : (now / 1000 * 4);
    const rotation = enemy.blinded ? enemy.rotation : rotSpeed;
    const color = enemy.blinded ? '#FFFF00' : '#CC2222';

    const glowRadius = enemy.blinded ? 35 : 25;
    const glowColor = enemy.blinded ? 'rgba(255, 255, 0, 0.35)' : 'rgba(200, 30, 30, 0.3)';
    const glow = ctx.createRadialGradient(enemy.x, enemy.y, 0, enemy.x, enemy.y, glowRadius);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    drawDiamond(ctx, enemy.x, enemy.y, 16, color, rotation);

    if (enemy.blinded) {
      const remaining = (enemy.blindEndTime - now) / 3000;
      ctx.fillStyle = `rgba(255, 255, 0, ${0.7 * remaining})`;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', enemy.x, enemy.y - 28);
    }
  }
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: any[], now: number) {
  for (const p of particles) {
    const elapsed = (now - p.startTime) / p.duration;
    if (elapsed >= 1) continue;
    const alpha = 1 - elapsed;
    const r1 = parseInt(p.colorStart.slice(1, 3), 16);
    const g1 = parseInt(p.colorStart.slice(3, 5), 16);
    const b1 = parseInt(p.colorStart.slice(5, 7), 16);
    const r2 = parseInt(p.colorEnd.slice(1, 3), 16);
    const g2 = parseInt(p.colorEnd.slice(3, 5), 16);
    const b2 = parseInt(p.colorEnd.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * elapsed);
    const g = Math.round(g1 + (g2 - g1) * elapsed);
    const b = Math.round(b1 + (b2 - b1) * elapsed);

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderPlayer(ctx: CanvasRenderingContext2D, player: any, highFreq: boolean) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  const glowColor = highFreq ? 'rgba(150, 100, 255, 0.45)' : 'rgba(100, 200, 255, 0.3)';
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 45);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = highFreq ? '#AA88FF' : '#88CCFF';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(4, -3, 2, 0, Math.PI * 2);
  ctx.arc(4, 3, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function applyDarkness(ctx: CanvasRenderingContext2D, darkness: number, player: any, pulses: Pulse[], echoPoints: any[], now: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = CANVAS_WIDTH;
  tempCanvas.height = CANVAS_HEIGHT;
  const tempCtx = tempCanvas.getContext('2d')!;

  tempCtx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
  tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  tempCtx.globalCompositeOperation = 'destination-out';

  const playerGlow = tempCtx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 120);
  playerGlow.addColorStop(0, 'rgba(255,255,255,0.7)');
  playerGlow.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  playerGlow.addColorStop(1, 'rgba(255,255,255,0)');
  tempCtx.fillStyle = playerGlow;
  tempCtx.beginPath();
  tempCtx.arc(player.x, player.y, 120, 0, Math.PI * 2);
  tempCtx.fill();

  for (const pulse of pulses) {
    const elapsed = now - pulse.startTime;
    const progress = Math.min(1, elapsed / pulse.duration);
    const waveProgress = Math.min(1, progress * 1.5);

    for (let i = 0; i < pulse.arcs.length; i++) {
      const arc = pulse.arcs[i];
      const arcProgress = Math.max(0, Math.min(1, waveProgress * (pulse.arcs.length) - i));
      if (arcProgress <= 0) continue;

      const alpha = (1 - progress * 0.5) * arcProgress * 0.6;
      const glowRadius = arc.radius * 0.25;

      for (let j = 0; j <= Math.floor(arc.points.length * arcProgress); j += 2) {
        const pt = arc.points[j];
        const g = tempCtx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowRadius);
        g.addColorStop(0, `rgba(255,255,255,${alpha})`);
        g.addColorStop(1, `rgba(255,255,255,0)`);
        tempCtx.fillStyle = g;
        tempCtx.beginPath();
        tempCtx.arc(pt.x, pt.y, glowRadius, 0, Math.PI * 2);
        tempCtx.fill();
      }
    }
  }

  for (const echo of echoPoints) {
    const elapsed = now - echo.startTime;
    const life = 1 - elapsed / echo.duration;
    if (life <= 0) continue;
    const alpha = life * echo.brightness * 0.5;
    const r = 15 + echo.brightness * 25;
    const g = tempCtx.createRadialGradient(echo.x, echo.y, 0, echo.x, echo.y, r);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, `rgba(255,255,255,0)`);
    tempCtx.fillStyle = g;
    tempCtx.beginPath();
    tempCtx.arc(echo.x, echo.y, r, 0, Math.PI * 2);
    tempCtx.fill();
  }

  ctx.drawImage(tempCanvas, 0, 0);
  ctx.restore();
}

function renderHUD(ctx: CanvasRenderingContext2D, state: any, now: number) {
  ctx.fillStyle = 'rgba(0, 255, 200, 0.85)';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`关卡 ${state.levelIndex + 1}/${state.totalLevels}`, 30, 40);

  const crystalText = `水晶: ${state.collectedCount}/${state.crystalsRequired}`;
  const textColor = state.exitOpen ? '#FFAA00' : '#FFD700';
  ctx.fillStyle = textColor;
  ctx.fillText(crystalText, 30, 72);

  if (state.exitOpen) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 300);
    ctx.fillStyle = `rgba(255, 170, 0, ${0.6 + pulse * 0.4})`;
    ctx.font = 'bold 18px monospace';
    ctx.fillText('★ 出口已开启！', 30, 102);
  }

  if (state.highFrequencyActive && now < state.highFrequencyEndTime) {
    ctx.fillStyle = 'rgba(170, 136, 255, 0.9)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('⚡ 高频脉冲发射中...', 30, CANVAS_HEIGHT - 30);
  } else if (now < state.highFrequencyCooldownEnd) {
    const remaining = (state.highFrequencyCooldownEnd - now) / 1000;
    ctx.fillStyle = 'rgba(120, 120, 180, 0.7)';
    ctx.font = '16px monospace';
    ctx.fillText(`冷却: ${remaining.toFixed(1)}s`, 30, CANVAS_HEIGHT - 30);
  }

  ctx.fillStyle = 'rgba(120, 180, 200, 0.5)';
  ctx.font = '13px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('WASD/方向键:移动 | 空格:声波 | E:致盲脉冲 | 回车:确认', CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
}

function renderMenu(ctx: CanvasRenderingContext2D, now: number) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const t = now / 1000;
  for (let i = 0; i < 6; i++) {
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2 - 50;
    const radius = 80 + i * 50 + (Math.sin(t * 1.5 + i) * 0.5 + 0.5) * 30;
    const alpha = 0.15 - i * 0.02;
    const hue = 160 + i * 15;

    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let a = -Math.PI / 3; a <= Math.PI / 3; a += 0.02) {
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      if (a === -Math.PI / 3) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const titleGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT / 2 - 130, 0, CANVAS_HEIGHT / 2 - 50);
  titleGrad.addColorStop(0, '#00FFAA');
  titleGrad.addColorStop(1, '#0088FF');
  ctx.fillStyle = titleGrad;
  ctx.font = 'bold 88px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00FFAA';
  ctx.shadowBlur = 30 + Math.sin(t * 2) * 10;
  ctx.fillText('ECHO PULSE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(150, 200, 220, 0.8)';
  ctx.font = '20px monospace';
  ctx.fillText('回 声 定 位 潜 行 游 戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

  const blink = 0.5 + 0.5 * Math.sin(t * 3);
  ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + blink * 0.4})`;
  ctx.font = 'bold 26px monospace';
  ctx.fillText('按 [ 回车键 ] 开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);

  ctx.fillStyle = 'rgba(120, 180, 200, 0.6)';
  ctx.font = '15px monospace';
  const instructions = [
    '◆ 在幽暗洞穴中扮演迷路的蝙蝠',
    '◆ 按空格发射扇形声波感知环境',
    '◆ 收集 10 颗回声水晶开启出口',
    '◆ 按 E 发射高频脉冲致盲红色猎手',
    '◆ 小心别被猎手抓到！'
  ];
  instructions.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 150 + i * 28);
  });
}

function renderGameOver(ctx: CanvasRenderingContext2D, now: number) {
  ctx.fillStyle = 'rgba(40, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const t = now / 1000;
  ctx.fillStyle = '#FF3344';
  ctx.font = 'bold 80px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#FF0033';
  ctx.shadowBlur = 25 + Math.sin(t * 4) * 10;
  ctx.fillText('游 戏 结 束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255, 200, 200, 0.85)';
  ctx.font = '22px monospace';
  ctx.fillText('被回声猎手抓住了...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);

  const blink = 0.5 + 0.5 * Math.sin(t * 3);
  ctx.fillStyle = `rgba(255, 220, 100, ${0.6 + blink * 0.4})`;
  ctx.font = 'bold 24px monospace';
  ctx.fillText('按 [ 回车键 ] 重新尝试', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}

function renderVictory(ctx: CanvasRenderingContext2D, now: number) {
  ctx.fillStyle = 'rgba(0, 20, 40, 0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const t = now / 1000;

  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2 + t;
    const r = 150 + Math.sin(t * 2 + i) * 30;
    const x = CANVAS_WIDTH / 2 + Math.cos(angle) * r;
    const y = CANVAS_HEIGHT / 2 - 20 + Math.sin(angle) * r * 0.6;
    const hue = (i * 25 + t * 50) % 360;
    ctx.fillStyle = `hsla(${hue}, 100%, 65%, 0.7)`;
    ctx.beginPath();
    ctx.arc(x, y, 3 + Math.sin(t * 3 + i) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const grad = ctx.createLinearGradient(0, CANVAS_HEIGHT / 2 - 120, 0, CANVAS_HEIGHT / 2 - 30);
  grad.addColorStop(0, '#FFD700');
  grad.addColorStop(1, '#FF6600');
  ctx.fillStyle = grad;
  ctx.font = 'bold 76px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 35 + Math.sin(t * 2) * 15;
  ctx.fillText('★ 通 关 成 功 ★', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(200, 255, 220, 0.9)';
  ctx.font = '22px monospace';
  ctx.fillText('你找到了回家的路！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);

  const blink = 0.5 + 0.5 * Math.sin(t * 3);
  ctx.fillStyle = `rgba(100, 255, 180, ${0.6 + blink * 0.4})`;
  ctx.font = 'bold 24px monospace';
  ctx.fillText('按 [ 回车键 ] 返回主菜单', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}

function renderLevelComplete(ctx: CanvasRenderingContext2D, levelIndex: number, now: number) {
  ctx.fillStyle = 'rgba(0, 30, 20, 0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const t = now / 1000;
  ctx.fillStyle = '#00FFAA';
  ctx.font = 'bold 68px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00FFAA';
  ctx.shadowBlur = 30;
  ctx.fillText(`第 ${levelIndex + 1} 关完成！`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(180, 255, 220, 0.85)';
  ctx.font = '22px monospace';
  ctx.fillText('洞穴深处越来越黑暗了...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);

  const blink = 0.5 + 0.5 * Math.sin(t * 3);
  ctx.fillStyle = `rgba(100, 220, 255, ${0.6 + blink * 0.4})`;
  ctx.font = 'bold 24px monospace';
  ctx.fillText('按 [ 回车键 ] 进入下一关', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.7, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.7, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}
