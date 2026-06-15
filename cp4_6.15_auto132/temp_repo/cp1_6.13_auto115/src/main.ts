import {
  GameState,
  GamePhase,
  TileType,
  ItemType,
  Particle,
  Player,
  MAP_SIZE,
  TILE_SIZE,
  CANVAS_SIZE,
  MOVE_ANIMATION_DURATION,
  ATTACK_ANIMATION_DURATION,
  ALERT_BLINK_INTERVAL
} from './types';
import { generateMap, getTile } from './mapGenerator';
import {
  createPlayer,
  resetPlayer,
  getOtherPlayer,
  getOtherPlayerId,
  updateRevealTimer,
  updatePickupEffectTimer,
  useExtraAction,
  getItemEmoji
} from './playerManager';
import {
  calculateMoveRange,
  movePlayer,
  attackAdjacent,
  createSlashEffect,
  createAlertEffect,
  createPickupEffect,
  createStealthParticle,
  createTrailParticle,
  updatePlayerAnimations,
  updateParticles,
  updateEffects,
  updateTrapEffects,
  checkGameOver,
  endTurn
} from './gameLogic';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let offscreenCanvas: HTMLCanvasElement;
let offscreenCtx: CanvasRenderingContext2D;
let audioContext: AudioContext | null = null;
let alertOscillator: OscillatorNode | null = null;
let alertGain: GainNode | null = null;

let gameState: GameState;
let particlePool: Particle[] = [];
let lastTime = 0;
let hasActedThisTurn = false;
let movedOrAttacked = false;
let toastTimer: number | null = null;
let mapDirty = true;
let gameTime = 0;

const state: {
  selectedHeroForP1: number;
  selectedHeroForP2: number;
} = {
  selectedHeroForP1: 1,
  selectedHeroForP2: 2
};

function initAudio(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
}

function playAlertSound(): void {
  if (!audioContext || alertOscillator) return;

  alertOscillator = audioContext.createOscillator();
  alertGain = audioContext.createGain();

  alertOscillator.type = 'square';
  alertOscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  alertOscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.1);
  alertOscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
  alertOscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.3);

  alertGain.gain.setValueAtTime(0.1, audioContext.currentTime);
  alertGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  alertOscillator.connect(alertGain);
  alertGain.connect(audioContext.destination);

  alertOscillator.start();
  alertOscillator.stop(audioContext.currentTime + 0.5);

  alertOscillator.onended = () => {
    alertOscillator = null;
    alertGain = null;
  };
}

function playAttackSound(): void {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.15);

  gain.gain.setValueAtTime(0.15, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start();
  osc.stop(audioContext.currentTime + 0.15);
}

function playPickupSound(): void {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, audioContext.currentTime);
  osc.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
  osc.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);

  gain.gain.setValueAtTime(0.1, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start();
  osc.stop(audioContext.currentTime + 0.3);
}

function playHitSound(): void {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(150, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.2);

  gain.gain.setValueAtTime(0.2, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start();
  osc.stop(audioContext.currentTime + 0.2);
}

function showToast(message: string): void {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.style.display = 'block';

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    toast.style.display = 'none';
    toastTimer = null;
  }, 2000);
}

function initGameState(): void {
  const map = generateMap();
  const player1 = createPlayer(1, state.selectedHeroForP1 as 1 | 2);
  const player2 = createPlayer(2, state.selectedHeroForP2 as 1 | 2);

  gameState = {
    phase: GamePhase.HERO_SELECT,
    currentPlayer: 1,
    turnCount: 1,
    map,
    players: [player1, player2],
    particles: [],
    effects: [],
    moveRange: [],
    hasActed: false,
    alertSoundPlaying: false,
    selectedHeroes: [state.selectedHeroForP1, state.selectedHeroForP2],
    countdownNumber: 3,
    countdownTimer: 0
  };

  hasActedThisTurn = false;
  movedOrAttacked = false;
  mapDirty = true;
  particlePool = [];
}

function resetGame(): void {
  gameState.map = generateMap();
  resetPlayer(gameState.players[0]);
  resetPlayer(gameState.players[1]);
  gameState.players[0].heroType = state.selectedHeroForP1 as 1 | 2;
  gameState.players[1].heroType = state.selectedHeroForP2 as 1 | 2;
  gameState.currentPlayer = 1;
  gameState.turnCount = 1;
  gameState.particles = [];
  gameState.effects = [];
  gameState.moveRange = [];
  gameState.hasActed = false;
  gameState.alertSoundPlaying = false;
  gameState.selectedHeroes = [state.selectedHeroForP1, state.selectedHeroForP2];
  hasActedThisTurn = false;
  movedOrAttacked = false;
  mapDirty = true;

  updateUI();
}

function renderMap(): void {
  if (!mapDirty) return;

  offscreenCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const gradient = offscreenCtx.createRadialGradient(
    CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.1,
    CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.7
  );
  gradient.addColorStop(0, '#16162a');
  gradient.addColorStop(0.4, '#0d0d1a');
  gradient.addColorStop(0.7, '#080812');
  gradient.addColorStop(1, '#04040a');
  offscreenCtx.fillStyle = gradient;
  offscreenCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  offscreenCtx.strokeStyle = 'rgba(80, 60, 120, 0.04)';
  offscreenCtx.lineWidth = 1;
  for (let i = 0; i < CANVAS_SIZE; i += 40) {
    offscreenCtx.beginPath();
    offscreenCtx.moveTo(0, i);
    offscreenCtx.lineTo(CANVAS_SIZE, i);
    offscreenCtx.stroke();
    offscreenCtx.beginPath();
    offscreenCtx.moveTo(i, 0);
    offscreenCtx.lineTo(i, CANVAS_SIZE);
    offscreenCtx.stroke();
  }

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const tile = gameState.map[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (!tile.revealed) {
        offscreenCtx.fillStyle = 'rgba(5, 5, 10, 0.95)';
        offscreenCtx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        offscreenCtx.strokeStyle = 'rgba(74, 144, 217, 0.05)';
        offscreenCtx.lineWidth = 1;
        offscreenCtx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        continue;
      }

      offscreenCtx.fillStyle = 'rgba(20, 20, 35, 0.5)';
      offscreenCtx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      offscreenCtx.strokeStyle = 'rgba(74, 144, 217, 0.1)';
      offscreenCtx.lineWidth = 1;
      offscreenCtx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

      switch (tile.type) {
        case TileType.OBSTACLE:
          drawObstacle(offscreenCtx, px, py);
          break;
        case TileType.COVER:
          drawCover(offscreenCtx, px, py);
          break;
        case TileType.TRAP:
          if (!tile.trapTriggered) {
            drawTrap(offscreenCtx, px, py);
          }
          break;
        case TileType.CHEST:
          if (!tile.chestCollected) {
            drawChest(offscreenCtx, px, py);
          }
          break;
      }
    }
  }

  const edgeGradient = offscreenCtx.createRadialGradient(
    CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.2,
    CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.6
  );
  edgeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  edgeGradient.addColorStop(0.5, 'rgba(10, 5, 20, 0.5)');
  edgeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
  offscreenCtx.fillStyle = edgeGradient;
  offscreenCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  mapDirty = false;
}

function drawObstacle(c: CanvasRenderingContext2D, x: number, y: number): void {
  const padding = 4;
  const size = TILE_SIZE - padding * 2;
  const bx = x + padding;
  const by = y + padding;

  const gradient = c.createLinearGradient(x, y, x + TILE_SIZE, y + TILE_SIZE);
  gradient.addColorStop(0, '#0d1f15');
  gradient.addColorStop(0.5, '#163325');
  gradient.addColorStop(1, '#1a3a2a');
  c.fillStyle = gradient;
  c.fillRect(bx, by, size, size);

  c.save();
  c.beginPath();
  c.rect(bx, by, size, size);
  c.clip();

  c.strokeStyle = 'rgba(10, 30, 20, 0.6)';
  c.lineWidth = 1.5;
  for (let i = -size; i < size * 2; i += 10) {
    c.beginPath();
    c.moveTo(bx + i, by);
    c.lineTo(bx + i + size, by + size);
    c.stroke();
  }

  c.strokeStyle = 'rgba(42, 90, 74, 0.35)';
  c.lineWidth = 1;
  const cx = bx + size / 2;
  const cy = by + size / 2;
  const r = size * 0.28;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.stroke();

  c.fillStyle = 'rgba(42, 90, 74, 0.4)';
  c.beginPath();
  c.arc(cx, cy, 3, 0, Math.PI * 2);
  c.fill();

  c.restore();

  c.strokeStyle = '#1f4a38';
  c.lineWidth = 2.5;
  c.strokeRect(bx, by, size, size);

  c.fillStyle = '#2d6a54';
  const cornerSize = 5;
  c.fillRect(bx, by, cornerSize, cornerSize);
  c.fillRect(bx + size - cornerSize, by, cornerSize, cornerSize);
  c.fillRect(bx, by + size - cornerSize, cornerSize, cornerSize);
  c.fillRect(bx + size - cornerSize, by + size - cornerSize, cornerSize, cornerSize);
}

function drawCover(c: CanvasRenderingContext2D, x: number, y: number): void {
  const padding = 5;
  const size = TILE_SIZE - padding * 2;
  const bx = x + padding;
  const by = y + padding;

  const gradient = c.createLinearGradient(bx, by, bx, by + size);
  gradient.addColorStop(0, '#52616e');
  gradient.addColorStop(0.5, '#404d59');
  gradient.addColorStop(1, '#2e3944');
  c.fillStyle = gradient;
  c.fillRect(bx, by, size, size);

  c.save();
  c.beginPath();
  c.rect(bx, by, size, size);
  c.clip();

  c.strokeStyle = 'rgba(90, 110, 130, 0.7)';
  c.lineWidth = 1.2;
  for (let i = -size; i < size * 2; i += 5) {
    c.beginPath();
    c.moveTo(bx + i, by);
    c.lineTo(bx + i + size, by + size);
    c.stroke();
  }

  c.strokeStyle = 'rgba(30, 40, 55, 0.75)';
  c.lineWidth = 1.2;
  for (let i = 0; i < size * 3; i += 5) {
    c.beginPath();
    c.moveTo(bx + i, by);
    c.lineTo(bx + i - size, by + size);
    c.stroke();
  }

  c.fillStyle = 'rgba(20, 28, 38, 0.35)';
  const blockH = size / 3;
  const offsets = [0, blockH * 0.5, 0];
  for (let row = 0; row < 3; row++) {
    const rowY = by + row * blockH;
    const offset = offsets[row];
    c.beginPath();
    c.moveTo(bx + offset + size * 0.3, rowY);
    c.lineTo(bx + offset + size * 0.3, rowY + blockH);
    c.stroke();
    c.beginPath();
    c.moveTo(bx + offset + size * 0.65, rowY);
    c.lineTo(bx + offset + size * 0.65, rowY + blockH);
    c.stroke();
  }

  c.restore();

  c.strokeStyle = '#6a7a8a';
  c.lineWidth = 2.5;
  c.strokeRect(bx, by, size, size);

  c.fillStyle = '#7a8b9a';
  const cornerSize = 4;
  c.fillRect(bx, by, cornerSize, cornerSize);
  c.fillRect(bx + size - cornerSize, by, cornerSize, cornerSize);
  c.fillRect(bx, by + size - cornerSize, cornerSize, cornerSize);
  c.fillRect(bx + size - cornerSize, by + size - cornerSize, cornerSize, cornerSize);

  c.strokeStyle = 'rgba(25, 35, 48, 0.6)';
  c.lineWidth = 1;
  c.strokeRect(bx + 3, by + 3, size - 6, size - 6);
}

function drawTrap(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const outerR = TILE_SIZE * 0.38;
  const innerR = TILE_SIZE * 0.22;

  c.save();
  c.fillStyle = 'rgba(80, 15, 15, 0.35)';
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 8;
    const r = i % 2 === 0 ? outerR : outerR * 0.72;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();

  c.strokeStyle = '#8b1a1a';
  c.lineWidth = 2.5;
  c.stroke();

  c.fillStyle = 'rgba(139, 26, 26, 0.5)';
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? innerR : innerR * 0.65;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();

  c.strokeStyle = '#c42a2a';
  c.lineWidth = 1.5;
  c.stroke();

  c.shadowColor = '#ff3333';
  c.shadowBlur = 10;
  c.fillStyle = '#e63030';
  c.font = 'bold 22px serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('☠', cx, cy + 1);
  c.shadowBlur = 0;

  c.fillStyle = 'rgba(200, 50, 50, 0.8)';
  c.beginPath();
  c.arc(cx, cy - innerR - 4, 2.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(cx, cy + innerR + 4, 2.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(cx - innerR - 4, cy, 2.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(cx + innerR + 4, cy, 2.5, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

function drawChest(c: CanvasRenderingContext2D, x: number, y: number): void {
  const padding = 10;
  const w = TILE_SIZE - padding * 2;
  const h = TILE_SIZE - padding * 2 - 6;
  const bx = x + padding;
  const by = y + padding;
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;

  c.save();

  c.shadowColor = '#ffd700';
  c.shadowBlur = 18;
  c.fillStyle = 'rgba(255, 215, 0, 0.18)';
  c.beginPath();
  c.arc(cx, cy, TILE_SIZE * 0.44, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;

  const bodyGradient = c.createLinearGradient(bx, by + 10, bx, by + 10 + h);
  bodyGradient.addColorStop(0, '#d4a853');
  bodyGradient.addColorStop(0.4, '#c99438');
  bodyGradient.addColorStop(1, '#b8860b');
  c.fillStyle = bodyGradient;
  c.fillRect(bx, by + 10, w, h);

  const lidGradient = c.createLinearGradient(bx - 2, by, bx - 2, by + 12);
  lidGradient.addColorStop(0, '#e8bc63');
  lidGradient.addColorStop(0.5, '#d4a853');
  lidGradient.addColorStop(1, '#b8902a');
  c.fillStyle = lidGradient;
  c.fillRect(bx - 2, by, w + 4, 12);

  c.strokeStyle = '#ffd700';
  c.lineWidth = 2.5;
  c.strokeRect(bx, by + 10, w, h);
  c.strokeRect(bx - 2, by, w + 4, 12);

  c.fillStyle = '#ffd700';
  c.fillRect(bx + 5, by + 10, 3, h);
  c.fillRect(bx + w - 8, by + 10, 3, h);

  c.fillStyle = '#d4a853';
  c.fillRect(bx + 5, by + 10 + h / 2 - 4, 3, 8);
  c.fillRect(bx + w - 8, by + 10 + h / 2 - 4, 3, 8);

  c.fillStyle = '#ffd700';
  c.shadowColor = '#ffd700';
  c.shadowBlur = 8;
  c.fillRect(cx - 5, by + 10 + h / 2 - 6, 10, 12);
  c.fillStyle = '#b8860b';
  c.fillRect(cx - 2, by + 10 + h / 2 - 2, 4, 5);
  c.shadowBlur = 0;

  c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(bx + 4, by + 12);
  c.lineTo(bx + 4, by + 8 + h);
  c.stroke();

  c.strokeStyle = 'rgba(80, 50, 10, 0.5)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(bx + w - 4, by + 12);
  c.lineTo(bx + w - 4, by + 8 + h);
  c.stroke();

  c.restore();
}

function drawMoveRange(): void {
  ctx.fillStyle = 'rgba(74, 144, 217, 0.2)';
  ctx.strokeStyle = 'rgba(74, 144, 217, 0.5)';
  ctx.lineWidth = 2;

  for (const pos of gameState.moveRange) {
    const px = pos.x * TILE_SIZE;
    const py = pos.y * TILE_SIZE;
    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  }
}

function drawPlayer(player: Player): void {
  const cx = player.renderX * TILE_SIZE + TILE_SIZE / 2;
  const cy = player.renderY * TILE_SIZE + TILE_SIZE / 2;

  let offsetX = 0;
  let offsetY = 0;
  if (player.isAttacking) {
    const progress = player.attackProgress / ATTACK_ANIMATION_DURATION;
    const lunge = Math.sin(progress * Math.PI) * 15;
    offsetX = player.attackDirection.x * lunge;
    offsetY = player.attackDirection.y * lunge;
  }

  const drawX = cx + offsetX;
  const drawY = cy + offsetY;

  ctx.save();

  if (player.stealth) {
    ctx.globalAlpha = 0.45 + Math.sin(gameTime / 180) * 0.18;
  }

  if (player.revealed && player.revealTimer > 0) {
    const blink = Math.floor(gameTime / ALERT_BLINK_INTERVAL) % 2;
    if (blink) {
      ctx.shadowColor = '#FF3333';
      ctx.shadowBlur = 25;
    }
  }

  const size = TILE_SIZE * 0.35;
  const capeR = size * 1.35;

  ctx.fillStyle = player.color === '#4A90D9' ? 'rgba(30, 50, 90, 0.75)' : 'rgba(90, 30, 30, 0.75)';
  ctx.beginPath();
  ctx.moveTo(drawX, drawY + size * 0.2);
  ctx.quadraticCurveTo(drawX - capeR * 0.9, drawY + capeR * 0.3, drawX - capeR * 0.5, drawY + capeR * 1.05);
  ctx.quadraticCurveTo(drawX, drawY + capeR * 0.75, drawX + capeR * 0.5, drawY + capeR * 1.05);
  ctx.quadraticCurveTo(drawX + capeR * 0.9, drawY + capeR * 0.3, drawX, drawY + size * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = player.color === '#4A90D9' ? 'rgba(80, 120, 180, 0.6)' : 'rgba(180, 80, 80, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(drawX, drawY, size, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(drawX, drawY, size, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const icon = player.heroType === 1 ? '🗡️' : '⚔️';
  ctx.fillText(icon, drawX, drawY);

  ctx.shadowBlur = 0;

  if (player.pickupEffect !== null) {
    const effectColor = player.pickupEffect === ItemType.HEAL ? '#4CAF50' :
                        player.pickupEffect === ItemType.ATTACK_BOOST ? '#F44336' : '#FFC107';
    const pulse = 1 + Math.sin(gameTime / 100) * 0.2;

    ctx.strokeStyle = effectColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(drawX, drawY, size * 1.5 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  if (player.revealed && player.revealTimer > 0) {
    const blink = Math.floor(gameTime / ALERT_BLINK_INTERVAL) % 2;
    if (blink) {
      ctx.strokeStyle = '#FF4444';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.arc(drawX, drawY, TILE_SIZE * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  if (player.stealth) {
    const starColor1 = '#9C27B0';
    const starColor2 = '#6A1B9A';
    const starColor3 = '#E040FB';
    for (let i = 0; i < 7; i++) {
      const angle = (gameTime / 400 + i * 0.9) % (Math.PI * 2);
      const radius = size * (1.15 + (i % 3) * 0.25) + Math.sin(gameTime / 250 + i * 1.3) * 4;
      const sx = drawX + Math.cos(angle) * radius;
      const sy = drawY + Math.sin(angle) * radius;

      const colors = [starColor1, starColor2, starColor3];
      ctx.fillStyle = colors[i % 3];
      ctx.globalAlpha = 0.55 + Math.sin(gameTime / 150 + i * 0.8) * 0.45;
      const starSize = 3 + (i % 2) * 2;
      drawStar(ctx, sx, sy, starSize, starSize * 0.55, 5);
    }
    ctx.globalAlpha = 1;
  }
}

function drawStar(c: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, points: number): void {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) {
      c.moveTo(x, y);
    } else {
      c.lineTo(x, y);
    }
  }
  c.closePath();
  c.fill();
}

function drawParticles(): void {
  for (const p of gameState.particles) {
    if (!p.active) continue;

    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(
      p.x * TILE_SIZE + TILE_SIZE / 2,
      p.y * TILE_SIZE + TILE_SIZE / 2,
      p.size * alpha,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawEffects(): void {
  for (const effect of gameState.effects) {
    const progress = effect.elapsed / effect.duration;
    const px = effect.x * TILE_SIZE + TILE_SIZE / 2;
    const py = effect.y * TILE_SIZE + TILE_SIZE / 2;

    switch (effect.type) {
      case 'alert':
        const alertPulse = 1 + Math.sin(effect.elapsed / 100) * 0.3;
        const alertAlpha = 1 - progress * 0.5;
        ctx.globalAlpha = alertAlpha;
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(px, py, TILE_SIZE * 1.5 * alertPulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 68, 68, 0.2)';
        ctx.beginPath();
        ctx.arc(px, py, TILE_SIZE * 1.2 * alertPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;

      case 'slash':
        if (effect.data?.direction) {
          const dir = effect.data.direction;
          const slashProgress = Math.sin(progress * Math.PI);
          const length = TILE_SIZE * 0.8 * slashProgress;
          const width = 12 * (1 - progress);

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(Math.atan2(dir.y, dir.x));

          const slashGradient = ctx.createLinearGradient(-length / 2, 0, length / 2, 0);
          slashGradient.addColorStop(0, 'transparent');
          slashGradient.addColorStop(0.5, effect.data.color || '#ffffff');
          slashGradient.addColorStop(1, 'transparent');

          ctx.globalAlpha = slashProgress;
          ctx.fillStyle = slashGradient;
          ctx.shadowColor = effect.data.color || '#ffffff';
          ctx.shadowBlur = 20;

          ctx.beginPath();
          ctx.ellipse(0, 0, length, width, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-length * 0.8, 0);
          ctx.lineTo(length * 0.8, 0);
          ctx.stroke();

          ctx.restore();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
        break;

      case 'pickup':
        if (effect.data?.itemType) {
          const color = effect.data.itemType === ItemType.HEAL ? '#4CAF50' :
                        effect.data.itemType === ItemType.ATTACK_BOOST ? '#F44336' : '#FFC107';
          const floatY = -progress * 40;
          const scale = 1 + progress * 0.5;

          ctx.save();
          ctx.translate(px, py + floatY);
          ctx.scale(scale, scale);
          ctx.globalAlpha = 1 - progress;

          ctx.fillStyle = color;
          ctx.font = 'bold 32px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
          ctx.fillText('+' + (effect.data.itemType === ItemType.HEAL ? '20' :
                               effect.data.itemType === ItemType.ATTACK_BOOST ? '5' : '1'), 0, 0);

          ctx.restore();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
        break;
    }
  }
}

function render(): void {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  renderMap();
  ctx.drawImage(offscreenCanvas, 0, 0);

  if (gameState.phase === GamePhase.PLAYING) {
    drawMoveRange();
    drawEffects();

    const p1Visible = gameState.players[0].revealed ||
                      gameState.map[gameState.players[0].y][gameState.players[0].x].revealed;
    const p2Visible = gameState.players[1].revealed ||
                      gameState.map[gameState.players[1].y][gameState.players[1].x].revealed;

    if (p1Visible) drawPlayer(gameState.players[0]);
    if (p2Visible) drawPlayer(gameState.players[1]);

    drawParticles();
  }

  if (gameState.phase === GamePhase.COUNTDOWN) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
}

function update(deltaTime: number): void {
  gameTime += deltaTime;

  if (gameState.phase !== GamePhase.PLAYING) return;

  for (const player of gameState.players) {
    const wasMoving = player.isMoving;
    const wasX = player.renderX;
    const wasY = player.renderY;

    updatePlayerAnimations(player, deltaTime);

    if (wasMoving && !player.isMoving) {
      player.x = player.targetX;
      player.y = player.targetY;
      player.renderX = player.x;
      player.renderY = player.y;
      mapDirty = true;
    }

    if (player.isMoving) {
      const progress = Math.min(1, player.moveProgress / MOVE_ANIMATION_DURATION);
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      player.renderX = wasX + (player.targetX - wasX) * easeProgress;
      player.renderY = wasY + (player.targetY - wasY) * easeProgress;

      if (Math.random() < 0.3) {
        createTrailParticle(
          player.renderX,
          player.renderY,
          player.color,
          gameState.particles,
          particlePool
        );
      }
    }

    if (player.stealth && Math.random() < 0.05) {
      createStealthParticle(
        player.x,
        player.y,
        '#9C27B0',
        gameState.particles,
        particlePool
      );
    }

    updateRevealTimer(player, deltaTime);
    updatePickupEffectTimer(player, deltaTime);
  }

  updateParticles(gameState.particles, deltaTime);
  updateEffects(gameState.effects, deltaTime);
  updateTrapEffects(gameState.map, deltaTime);

  const winner = checkGameOver(gameState.players);
  if (winner) {
    showGameOver(winner);
  }

  updateUI();
}

function updateCountdown(deltaTime: number): void {
  gameState.countdownTimer += deltaTime;

  if (gameState.countdownTimer >= 500) {
    gameState.countdownTimer = 0;
    gameState.countdownNumber--;

    const countdownEl = document.getElementById('countdown-number');
    if (countdownEl) {
      if (gameState.countdownNumber > 0) {
        countdownEl.textContent = gameState.countdownNumber.toString();
        countdownEl.style.animation = 'none';
        void countdownEl.offsetWidth;
        countdownEl.style.animation = 'countdownAnim 0.5s ease-out forwards';
      } else if (gameState.countdownNumber === 0) {
        countdownEl.textContent = '开始!';
        countdownEl.style.animation = 'none';
        void countdownEl.offsetWidth;
        countdownEl.style.animation = 'countdownAnim 0.5s ease-out forwards';
      } else {
        gameState.phase = GamePhase.PLAYING;
        const countdownDiv = document.getElementById('countdown');
        if (countdownDiv) countdownDiv.style.display = 'none';
        gameState.moveRange = calculateMoveRange(
          gameState.map,
          gameState.players[gameState.currentPlayer - 1].x,
          gameState.players[gameState.currentPlayer - 1].y,
          gameState.players
        );
        updateUI();
      }
    }
  }
}

function gameLoop(timestamp: number): void {
  const deltaTime = lastTime ? timestamp - lastTime : 16;
  lastTime = timestamp;

  if (gameState.phase === GamePhase.COUNTDOWN) {
    updateCountdown(deltaTime);
  } else {
    update(deltaTime);
  }

  render();

  requestAnimationFrame(gameLoop);
}

function updateUI(): void {
  for (let i = 1; i <= 2; i++) {
    const player = gameState.players[i - 1];
    const prefix = `p${i}`;

    const hpEl = document.getElementById(`${prefix}-hp`);
    const hpFill = document.getElementById(`${prefix}-hp-fill`);
    const attackEl = document.getElementById(`${prefix}-attack`);
    const stealthIcon = document.getElementById(`${prefix}-stealth-icon`);
    const stealthText = document.getElementById(`${prefix}-stealth-text`);
    const revealIcon = document.getElementById(`${prefix}-reveal-icon`);
    const revealText = document.getElementById(`${prefix}-reveal-text`);
    const movesEl = document.getElementById(`${prefix}-moves`);
    const attacksEl = document.getElementById(`${prefix}-attacks`);
    const chestsEl = document.getElementById(`${prefix}-chests`);
    const inventoryEl = document.getElementById(`${prefix}-inventory`);

    if (hpEl) hpEl.textContent = player.hp.toString();
    if (hpFill) hpFill.style.width = `${(player.hp / player.maxHp) * 100}%`;
    if (attackEl) attackEl.textContent = player.attack.toString();
    if (movesEl) movesEl.textContent = player.stats.totalMoves.toString();
    if (attacksEl) attacksEl.textContent = player.stats.totalAttacks.toString();
    if (chestsEl) chestsEl.textContent = player.stats.chestsCollected.toString();

    if (stealthIcon) stealthIcon.style.display = player.stealth ? 'inline-block' : 'none';
    if (stealthText) stealthText.textContent = `潜行状态: ${player.stealth ? '潜行中' : '未潜行'}`;

    if (revealIcon) revealIcon.style.display = player.revealed ? 'inline-block' : 'none';
    if (revealText) revealText.textContent = `位置: ${player.revealed ? '暴露' : '隐藏'}`;

    if (inventoryEl) {
      inventoryEl.innerHTML = '';
      for (const item of player.inventory) {
        const slot = document.createElement('div');
        slot.className = `inventory-slot item-${item.type}`;
        slot.textContent = getItemEmoji(item.type);
        slot.title = item.name;
        inventoryEl.appendChild(slot);
      }
    }
  }

  const turnIndicator = document.getElementById('turn-indicator');
  if (turnIndicator) {
    turnIndicator.textContent = `玩家 ${gameState.currentPlayer} 回合`;
    turnIndicator.className = `turn-indicator player${gameState.currentPlayer}-color`;
  }

  const alertBtn = document.getElementById('alert-action-btn');
  if (alertBtn) {
    const currentPlayer = gameState.players[gameState.currentPlayer - 1];
    alertBtn.style.display = currentPlayer.alertAction ? 'inline-block' : 'none';
  }
}

function showGameOver(winner: Player): void {
  gameState.phase = GamePhase.GAME_OVER;

  const gameOverEl = document.getElementById('game-over');
  const victoryText = document.getElementById('victory-text');

  if (victoryText) {
    victoryText.textContent = `玩家 ${winner.id} 获胜!`;
    victoryText.className = `victory-text player${winner.id}-color`;
  }

  const p1 = gameState.players[0];
  const p2 = gameState.players[1];

  const setValue = (id: string, value: string | number, playerId?: 1 | 2) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value.toString();
      if (playerId) {
        el.className = `stat-value player${playerId}`;
      }
    }
  };

  setValue('final-p1-moves', p1.stats.totalMoves);
  setValue('final-p2-moves', p2.stats.totalMoves);
  setValue('final-p1-attacks', p1.stats.totalAttacks);
  setValue('final-p2-attacks', p2.stats.totalAttacks);
  setValue('final-p1-chests', p1.stats.chestsCollected);
  setValue('final-p2-chests', p2.stats.chestsCollected);
  setValue('final-turns', gameState.turnCount);

  if (gameOverEl) {
    gameOverEl.style.display = 'flex';
    requestAnimationFrame(() => {
      gameOverEl.classList.add('visible');
    });
  }
}

function switchTurn(): void {
  const currentPlayer = gameState.players[gameState.currentPlayer - 1];
  const otherPlayer = getOtherPlayer(gameState.players, gameState.currentPlayer);

  endTurn(currentPlayer, otherPlayer, movedOrAttacked);

  gameState.currentPlayer = getOtherPlayerId(gameState.currentPlayer);
  gameState.turnCount++;
  hasActedThisTurn = false;
  movedOrAttacked = false;

  const newCurrentPlayer = gameState.players[gameState.currentPlayer - 1];
  gameState.moveRange = calculateMoveRange(
    gameState.map,
    newCurrentPlayer.x,
    newCurrentPlayer.y,
    gameState.players
  );

  if (newCurrentPlayer.alertAction) {
    showToast('警报行动可用! 点击按钮获得额外行动');
  }

  updateUI();
}

function handleKeyDown(e: KeyboardEvent): void {
  if (gameState.phase !== GamePhase.PLAYING) return;

  const currentPlayer = gameState.players[gameState.currentPlayer - 1];

  let direction: { x: number; y: number } | null = null;
  let isPlayer1 = gameState.currentPlayer === 1;

  if (isPlayer1) {
    switch (e.key.toLowerCase()) {
      case 'w': direction = { x: 0, y: -1 }; break;
      case 's': direction = { x: 0, y: 1 }; break;
      case 'a': direction = { x: -1, y: 0 }; break;
      case 'd': direction = { x: 1, y: 0 }; break;
    }
  } else {
    switch (e.key) {
      case 'ArrowUp': direction = { x: 0, y: -1 }; break;
      case 'ArrowDown': direction = { x: 0, y: 1 }; break;
      case 'ArrowLeft': direction = { x: -1, y: 0 }; break;
      case 'ArrowRight': direction = { x: 1, y: 0 }; break;
    }
  }

  if (direction) {
    e.preventDefault();
    handleMove(direction);
    return;
  }

  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    handleAttack();
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    if (!hasActedThisTurn || currentPlayer.extraAction || currentPlayer.alertAction) {
      switchTurn();
    }
  }
}

function handleMove(direction: { x: number; y: number }): void {
  const currentPlayer = gameState.players[gameState.currentPlayer - 1];

  if (currentPlayer.isMoving || currentPlayer.isAttacking) return;

  const targetX = currentPlayer.x + direction.x;
  const targetY = currentPlayer.y + direction.y;

  const result = movePlayer(
    currentPlayer,
    targetX,
    targetY,
    gameState.map,
    gameState.players,
    hasActedThisTurn
  );

  if (result.success) {
    currentPlayer.targetX = targetX;
    currentPlayer.targetY = targetY;
    movedOrAttacked = true;

    if (hasActedThisTurn) {
      useExtraAction(currentPlayer);
    }
    hasActedThisTurn = true;

    if (result.trapTriggered) {
      createAlertEffect(targetX, targetY, currentPlayer.id, gameState.effects);
      playAlertSound();
      showToast('触发警报陷阱! 位置暴露10秒');
    }

    if (result.chestCollected) {
      createPickupEffect(currentPlayer, result.chestCollected.type, gameState.effects);
      playPickupSound();
      showToast(`获得 ${result.chestCollected.name}!`);
    }

    setTimeout(() => {
      gameState.moveRange = calculateMoveRange(
        gameState.map,
        currentPlayer.x,
        currentPlayer.y,
        gameState.players
      );
      mapDirty = true;
      updateUI();
    }, MOVE_ANIMATION_DURATION + 10);
  }
}

function handleAttack(): void {
  const currentPlayer = gameState.players[gameState.currentPlayer - 1];
  const otherPlayer = getOtherPlayer(gameState.players, gameState.currentPlayer);

  if (currentPlayer.isMoving || currentPlayer.isAttacking) return;

  const dx = otherPlayer.x - currentPlayer.x;
  const dy = otherPlayer.y - currentPlayer.y;

  let direction: { x: number; y: number } | null = null;

  if (Math.abs(dx) + Math.abs(dy) === 1) {
    direction = { x: Math.sign(dx), y: Math.sign(dy) };
  } else {
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];
    for (const dir of directions) {
      const tx = currentPlayer.x + dir.x;
      const ty = currentPlayer.y + dir.y;
      const tile = getTile(gameState.map, tx, ty);
      if (tile && tile.type !== TileType.OBSTACLE) {
        direction = dir;
        break;
      }
    }
  }

  if (!direction) return;

  const result = attackAdjacent(
    currentPlayer,
    direction,
    gameState.map,
    gameState.players,
    hasActedThisTurn
  );

  if (result.success) {
    movedOrAttacked = true;

    if (hasActedThisTurn) {
      useExtraAction(currentPlayer);
    }
    hasActedThisTurn = true;

    createSlashEffect(currentPlayer, direction, gameState.effects);
    playAttackSound();

    if (result.hit && result.damage !== undefined) {
      playHitSound();
      showToast(`造成 ${result.damage} 点伤害!`);
    }

    gameState.moveRange = calculateMoveRange(
      gameState.map,
      currentPlayer.x,
      currentPlayer.y,
      gameState.players
    );
    updateUI();
  }
}

function handleHeroSelect(): void {
  const heroCards = document.querySelectorAll('.hero-card');
  heroCards.forEach(card => {
    card.addEventListener('click', () => {
      const heroId = parseInt(card.getAttribute('data-hero') || '1');
      if (state.selectedHeroForP1 === 1) {
        state.selectedHeroForP1 = heroId;
        state.selectedHeroForP2 = heroId === 1 ? 2 : 1;
      }

      heroCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      initAudio();
      startCountdown();
    });
  }
}

function startCountdown(): void {
  const heroSelect = document.getElementById('hero-select');
  const countdown = document.getElementById('countdown');

  if (heroSelect) heroSelect.style.display = 'none';
  if (countdown) {
    countdown.style.display = 'flex';
  }

  gameState.phase = GamePhase.COUNTDOWN;
  gameState.countdownNumber = 3;
  gameState.countdownTimer = 0;

  const countdownEl = document.getElementById('countdown-number');
  if (countdownEl) {
    countdownEl.textContent = '3';
    countdownEl.style.animation = 'countdownAnim 0.5s ease-out forwards';
  }
}

function handleEndTurn(): void {
  if (gameState.phase !== GamePhase.PLAYING) return;

  const currentPlayer = gameState.players[gameState.currentPlayer - 1];
  if (currentPlayer.isMoving || currentPlayer.isAttacking) return;

  switchTurn();
}

function handleAlertAction(): void {
  if (gameState.phase !== GamePhase.PLAYING) return;

  const currentPlayer = gameState.players[gameState.currentPlayer - 1];
  if (!currentPlayer.alertAction) return;

  hasActedThisTurn = false;
  gameState.moveRange = calculateMoveRange(
    gameState.map,
    currentPlayer.x,
    currentPlayer.y,
    gameState.players
  );
  showToast('警报行动激活! 可额外移动或攻击一次');
  updateUI();
}

function handleRestart(): void {
  const gameOverEl = document.getElementById('game-over');
  const heroSelect = document.getElementById('hero-select');

  if (gameOverEl) {
    gameOverEl.classList.remove('visible');
    gameOverEl.style.display = 'none';
  }
  if (heroSelect) heroSelect.style.display = 'flex';

  resetGame();
  gameState.phase = GamePhase.HERO_SELECT;
}

function resizeCanvas(): void {
  const container = document.getElementById('game-container');
  if (!container) return;

  const maxWidth = Math.min(window.innerWidth - 480, window.innerHeight - 200);
  const scale = maxWidth / CANVAS_SIZE;

  canvas.style.width = `${CANVAS_SIZE * scale}px`;
  canvas.style.height = `${CANVAS_SIZE * scale}px`;
}

function init(): void {
  canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;

  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = CANVAS_SIZE;
  offscreenCanvas.height = CANVAS_SIZE;
  offscreenCtx = offscreenCanvas.getContext('2d')!;

  initGameState();
  handleHeroSelect();

  document.addEventListener('keydown', handleKeyDown);

  const endTurnBtn = document.getElementById('end-turn-btn');
  if (endTurnBtn) {
    endTurnBtn.addEventListener('click', handleEndTurn);
  }

  const alertActionBtn = document.getElementById('alert-action-btn');
  if (alertActionBtn) {
    alertActionBtn.addEventListener('click', handleAlertAction);
  }

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', handleRestart);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', init);
