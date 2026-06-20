import { useGameStore } from '../state/StateManager';
import type { Vector2 } from '../types';
import { clamp } from '../utils/noise';

const MOVE_SPEED = 160;
const GLOW_DURATION = 2000;
const GLOW_COOLDOWN = 3000;
const GLOW_ATTRACTION_RADIUS = 80;
const PARTICLES_PER_FRAME = 15;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_BASE_RADIUS = 16;

export class PlayerController {
  private lastTime: number = 0;

  init() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const store = useGameStore.getState();
    const key = e.key.toLowerCase();
    store.setKey(key, true);

    if (key === ' ' || e.code === 'Space') {
      e.preventDefault();
      this.tryActivateGlow();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const store = useGameStore.getState();
    const key = e.key.toLowerCase();
    store.setKey(key, false);
  };

  tryActivateGlow() {
    const store = useGameStore.getState();
    const now = Date.now();
    if (now < store.player.glowCooldownEnd) return;
    if (store.player.isGlowing) return;

    useGameStore.setState((state) => ({
      player: {
        ...state.player,
        isGlowing: true,
        glowStartTime: now,
        glowCooldownEnd: now + GLOW_DURATION + GLOW_COOLDOWN,
      },
    }));
  }

  update(deltaTime: number, currentTime: number) {
    const store = useGameStore.getState();
    if (store.game.phase !== 'playing') return;

    const keys = store.keys;
    const player = store.player;
    const now = currentTime;

    if (player.isGlowing && now - player.glowStartTime > GLOW_DURATION) {
      useGameStore.setState((state) => ({
        player: { ...state.player, isGlowing: false },
      }));
    }

    if (player.isInvincible && now > player.invincibleEnd) {
      useGameStore.setState((state) => ({
        player: { ...state.player, isInvincible: false },
      }));
    }

    let dx = 0;
    let dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    const speed = MOVE_SPEED * player.size;
    const newX = clamp(
      player.position.x + dx * speed * deltaTime,
      PLAYER_BASE_RADIUS * player.size,
      CANVAS_WIDTH - PLAYER_BASE_RADIUS * player.size
    );
    const newY = clamp(
      player.position.y + dy * speed * deltaTime,
      PLAYER_BASE_RADIUS * player.size,
      CANVAS_HEIGHT - PLAYER_BASE_RADIUS * player.size
    );

    useGameStore.setState((state) => ({
      player: {
        ...state.player,
        position: { x: newX, y: newY },
        velocity: { x: dx * speed, y: dy * speed },
      },
    }));

    if (player.isGlowing) {
      this.spawnGlowParticles();
    }
  }

  private spawnGlowParticles() {
    const store = useGameStore.getState();
    const player = store.player;
    const px = player.position.x;
    const py = player.position.y;

    for (let i = 0; i < PARTICLES_PER_FRAME; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      const r = 2 + Math.random() * 2;
      const colorT = Math.random();
      const color = colorT < 0.5 ? '#00FF88' : '#88FFAA';

      store.addParticle({
        id: 0,
        position: {
          x: px + Math.cos(angle) * 8,
          y: py + Math.sin(angle) * 8,
        },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        radius: r,
        color,
        alpha: 0.6,
        life: 1000,
        maxLife: 1000,
      });
    }
  }

  static getGlowAttractionRadius(): number {
    return GLOW_ATTRACTION_RADIUS;
  }

  static getPlayerRadius(size: number): number {
    return PLAYER_BASE_RADIUS * size;
  }
}
