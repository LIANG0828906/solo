import { useRef, useCallback } from 'react';
import {
  GameState,
  createInitialState,
  createDebris,
  createStars,
} from '../utils/spaceDebrisData';

function updateGameState(state: GameState, dt: number): void {
  const ts = dt / 16.667;
  const dtSec = dt / 1000;
  state.time += dtSec;

  const dx = state.mouseX - state.player.x;
  const dy = state.mouseY - state.player.y;
  state.player.angle = Math.atan2(dy, dx);

  const speedMul = state.boostActive ? 1.3 : 1.0;
  state.player.vx += dx * 0.08 * speedMul * ts;
  state.player.vy += dy * 0.08 * speedMul * ts;
  state.player.vx *= 0.92;
  state.player.vy *= 0.92;
  state.player.x += state.player.vx * ts;
  state.player.y += state.player.vy * ts;

  const pad = 18;
  state.player.x = Math.max(pad, Math.min(state.canvasWidth - pad, state.player.x));
  state.player.y = Math.max(pad, Math.min(state.canvasHeight - pad, state.player.y));

  for (const star of state.stars) {
    star.phase += star.pulseSpeed * dtSec;
  }

  for (const d of state.debris) {
    if (d.beingTractored) {
      const tdx = state.player.x - d.x;
      const tdy = state.player.y - d.y;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (tdist > 1) {
        d.x += (tdx / tdist) * 2 * ts;
        d.y += (tdy / tdist) * 2 * ts;
      }
      d.haloAngle += (Math.PI * 2 / 1.5) * dtSec;
      continue;
    }

    d.x += d.vx * ts;
    d.y += d.vy * ts;

    if (d.x < d.size) { d.vx = Math.abs(d.vx); d.x = d.size; }
    if (d.x > state.canvasWidth - d.size) { d.vx = -Math.abs(d.vx); d.x = state.canvasWidth - d.size; }
    if (d.y < d.size) { d.vy = Math.abs(d.vy); d.y = d.size; }
    if (d.y > state.canvasHeight - d.size) { d.vy = -Math.abs(d.vy); d.y = state.canvasHeight - d.size; }

    if (d.type === 'dangerous') {
      d.dirChangeTimer -= ts;
      if (d.dirChangeTimer <= 0) {
        const newAngle = Math.random() * Math.PI * 2;
        const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
        d.vx = Math.cos(newAngle) * speed;
        d.vy = Math.sin(newAngle) * speed;
        d.dirChangeTimer = 60 + Math.random() * 120;
      }
    }
  }

  if (state.mouseDown && state.energy >= 10) {
    if (state.tractoredDebrisId !== null) {
      const d = state.debris.find(dd => dd.id === state.tractoredDebrisId);
      if (d) {
        state.isTractoring = true;
        state.energy -= 15 * dtSec;
      } else {
        state.tractoredDebrisId = null;
        state.isTractoring = false;
      }
    } else {
      const range = state.boostActive ? 250 : 150;
      let nearestDist = range;
      let nearestId: number | null = null;
      for (const d of state.debris) {
        if (d.type !== 'recyclable' || d.beingTractored) continue;
        const ddx = d.x - state.player.x;
        const ddy = d.y - state.player.y;
        const dd = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dd < nearestDist) {
          nearestDist = dd;
          nearestId = d.id;
        }
      }
      if (nearestId !== null) {
        state.tractoredDebrisId = nearestId;
        const d = state.debris.find(dd => dd.id === nearestId)!;
        d.beingTractored = true;
        state.isTractoring = true;
        state.energy -= 15 * dtSec;
      } else {
        state.isTractoring = false;
      }
    }
    state.energy = Math.max(0, state.energy);
  } else {
    if (state.tractoredDebrisId !== null) {
      const d = state.debris.find(dd => dd.id === state.tractoredDebrisId);
      if (d) d.beingTractored = false;
      state.tractoredDebrisId = null;
    }
    state.isTractoring = false;
    state.energy += 5 * dtSec;
    state.energy = Math.min(100, state.energy);
  }

  if (state.tractoredDebrisId !== null) {
    const d = state.debris.find(dd => dd.id === state.tractoredDebrisId);
    if (d) {
      const rdx = d.x - state.player.x;
      const rdy = d.y - state.player.y;
      const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
      if (rdist < 28) {
        const points = state.boostActive ? 20 : 10;
        state.score += points;
        state.recycledCount++;

        state.floatingTexts.push({
          x: d.x,
          y: d.y,
          text: `+${points}`,
          color: '#45A29E',
          life: 1.0,
          maxLife: 1.0,
        });

        state.debris = state.debris.filter(dd => dd.id !== d.id);
        state.tractoredDebrisId = null;
        state.isTractoring = false;

        if (state.recycledCount % 20 === 0 && !state.boostActive) {
          state.boostActive = true;
          state.boostTimer = 10;
          state.boostCountdown = 10;
        }
      }
    }
  }

  for (let i = state.debris.length - 1; i >= 0; i--) {
    const d = state.debris[i];
    if (d.type !== 'dangerous') continue;
    const cdx = d.x - state.player.x;
    const cdy = d.y - state.player.y;
    const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
    if (cdist < 12 + d.size * 0.3) {
      state.lives--;
      state.flashRed = 0.6;
      state.screenShake.timer = 0.3;
      state.hitAnimTimer = 0.2;
      state.debris.splice(i, 1);

      if (state.lives <= 0) {
        state.lives = 0;
        state.gameOver = true;
      }
      break;
    }
  }

  for (const p of state.particles) {
    if (!p.active) continue;
    p.life -= dtSec;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.x += p.vx * ts;
    p.y += p.vy * ts;
  }

  const shipSpeed = Math.sqrt(state.player.vx * state.player.vx + state.player.vy * state.player.vy);
  if (shipSpeed > 0.8) {
    const count = 3 + Math.floor(Math.random() * 3);
    const backAngle = state.player.angle + Math.PI;
    for (let i = 0; i < count; i++) {
      const p = state.particles.find(pp => !pp.active);
      if (!p) break;
      const spread = (Math.random() - 0.5) * 0.6;
      const speed = 1 + Math.random() * 2;
      p.x = state.player.x + Math.cos(backAngle) * 14;
      p.y = state.player.y + Math.sin(backAngle) * 14;
      p.vx = Math.cos(backAngle + spread) * speed + state.player.vx * 0.2;
      p.vy = Math.sin(backAngle + spread) * speed + state.player.vy * 0.2;
      p.life = 0.4;
      p.maxLife = 0.4;
      p.size = 2 + Math.random() * 3;
      if (state.boostActive) {
        p.r = 255; p.g = 215; p.b = 0;
      } else {
        p.r = 69; p.g = 162; p.b = 158;
      }
      p.active = true;
    }
  }

  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.life -= dtSec;
    ft.y -= 40 * dtSec;
    if (ft.life <= 0) {
      state.floatingTexts.splice(i, 1);
    }
  }

  if (state.screenShake.timer > 0) {
    state.screenShake.timer -= dtSec;
    state.screenShake.x = (Math.random() - 0.5) * 16;
    state.screenShake.y = (Math.random() - 0.5) * 16;
  } else {
    state.screenShake.x = 0;
    state.screenShake.y = 0;
  }

  if (state.flashRed > 0) {
    state.flashRed -= (0.6 / 0.15) * dtSec;
    if (state.flashRed < 0) state.flashRed = 0;
  }

  if (state.hitAnimTimer > 0) {
    state.hitAnimTimer -= dtSec;
    if (state.hitAnimTimer < 0) state.hitAnimTimer = 0;
  }

  state.waveTimer -= dtSec;
  if (state.waveTimer <= 0) {
    state.wave++;
    state.waveTimer = 90;

    const newCount = 20;
    const recyclableRatio = 2 / 3;
    state.dangerousBaseSpeed += 0.5;
    const newDebris = createDebris(
      state.canvasWidth, state.canvasHeight,
      newCount, recyclableRatio,
      state.dangerousBaseSpeed,
      state.debrisIdCounter
    );
    state.debrisIdCounter += newCount;
    state.debris.push(...newDebris);

    state.waveAnnouncement = {
      text: `第 ${state.wave} 波`,
      timer: 0.5,
      maxTimer: 0.5,
    };
  }

  if (state.waveAnnouncement) {
    state.waveAnnouncement.timer -= dtSec;
    if (state.waveAnnouncement.timer <= 0) {
      state.waveAnnouncement = null;
    }
  }

  if (state.boostActive) {
    state.boostTimer -= dtSec;
    state.boostCountdown = Math.ceil(state.boostTimer);
    if (state.boostTimer <= 0) {
      state.boostActive = false;
      state.boostTimer = 0;
      state.boostCountdown = 0;
    }
  }
}

export function useGameLoop(onGameOver: (score: number) => void) {
  const stateRef = useRef<GameState | null>(null);
  const gameOverNotifiedRef = useRef(false);

  const init = useCallback((width: number, height: number) => {
    stateRef.current = createInitialState(width, height);
    gameOverNotifiedRef.current = false;
  }, []);

  const update = useCallback((dt: number) => {
    const state = stateRef.current;
    if (!state || !state.gameStarted || state.gameOver) return;

    updateGameState(state, dt);

    if (state.gameOver && !gameOverNotifiedRef.current) {
      gameOverNotifiedRef.current = true;
      onGameOver(state.score);
    }
  }, [onGameOver]);

  const start = useCallback(() => {
    if (stateRef.current) {
      stateRef.current.gameStarted = true;
    }
  }, []);

  const restart = useCallback((width: number, height: number) => {
    stateRef.current = createInitialState(width, height);
    stateRef.current.gameStarted = true;
    gameOverNotifiedRef.current = false;
  }, []);

  const handleMouseMove = useCallback((x: number, y: number) => {
    if (stateRef.current) {
      stateRef.current.mouseX = x;
      stateRef.current.mouseY = y;
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    if (stateRef.current) {
      stateRef.current.mouseDown = true;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (stateRef.current) {
      stateRef.current.mouseDown = false;
    }
  }, []);

  const resize = useCallback((width: number, height: number) => {
    if (stateRef.current) {
      stateRef.current.canvasWidth = width;
      stateRef.current.canvasHeight = height;
      stateRef.current.stars = createStars(width, height);
    }
  }, []);

  return {
    stateRef,
    init,
    update,
    start,
    restart,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    resize,
  };
}
