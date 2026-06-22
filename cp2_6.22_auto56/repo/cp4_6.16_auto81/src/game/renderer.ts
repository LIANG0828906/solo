import { TileType, MapData, Room } from '../map/types';
import { Player } from './player';
import { Monster } from './monster';
import { Item, ItemEvent } from './item';

const COLORS = {
  wall: '#3a3a3a',
  wallDark: '#2a2a2a',
  wallLight: '#4a4a4a',
  floor: '#d4c8a8',
  floorDark: '#c4b898',
  corridor: '#b8a888',
  player: '#4a90d9',
  playerDark: '#3a7ac9',
  playerSkin: '#ffcc99',
  slime: '#6ab04c',
  slimeDark: '#4a902c',
  skeleton: '#e0e0e0',
  skeletonDark: '#c0c0c0',
  bat: '#7c3aed',
  batDark: '#5c1acd',
  potion: '#e74c3c',
  potionGlow: '#ff6b5b',
  gold: '#d4af37',
  goldLight: '#f4cf57',
  chest: '#8b4513',
  chestLight: '#a0522d',
  exit: '#2ecc71',
  hpGreen: '#2ecc71',
  hpYellow: '#f1c40f',
  hpRed: '#e74c3c',
  uiBorder: '#d4af37',
  uiBg: 'rgba(0, 0, 0, 0.7)',
  minimapVisited: '#d4c8a8',
  minimapUnvisited: '#3a3a3a',
  minimapCurrent: '#ffffff',
};

export interface RenderState {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  tileSize: number;
  cameraX: number;
  cameraY: number;
  viewWidth: number;
  viewHeight: number;
  fadeAlpha: number;
  fadeDirection: 'in' | 'out' | 'none';
  screenShake: number;
  hurtFlash: number;
  potionEffect: number;
  goldCollectAnim: { x: number; y: number; targetX: number; targetY: number; progress: number; value: number } | null;
}

export function createRenderer(canvas: HTMLCanvasElement, tileSize: number): RenderState {
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  return {
    ctx,
    canvas,
    tileSize,
    cameraX: 0,
    cameraY: 0,
    viewWidth: canvas.width,
    viewHeight: canvas.height,
    fadeAlpha: 0,
    fadeDirection: 'none',
    screenShake: 0,
    hurtFlash: 0,
    potionEffect: 0,
    goldCollectAnim: null,
  };
}

export function updateRenderer(renderer: RenderState, deltaTime: number): void {
  if (renderer.fadeDirection === 'out') {
    renderer.fadeAlpha = Math.min(1, renderer.fadeAlpha + deltaTime * 2);
    if (renderer.fadeAlpha >= 1) {
      renderer.fadeDirection = 'in';
    }
  } else if (renderer.fadeDirection === 'in') {
    renderer.fadeAlpha = Math.max(0, renderer.fadeAlpha - deltaTime * 2);
    if (renderer.fadeAlpha <= 0) {
      renderer.fadeDirection = 'none';
    }
  }

  if (renderer.screenShake > 0) {
    renderer.screenShake = Math.max(0, renderer.screenShake - deltaTime * 5);
  }

  if (renderer.hurtFlash > 0) {
    renderer.hurtFlash = Math.max(0, renderer.hurtFlash - deltaTime * 2);
  }

  if (renderer.potionEffect > 0) {
    renderer.potionEffect = Math.max(0, renderer.potionEffect - deltaTime * 1.5);
  }

  if (renderer.goldCollectAnim) {
    renderer.goldCollectAnim.progress += deltaTime * 2;
    if (renderer.goldCollectAnim.progress >= 1) {
      renderer.goldCollectAnim = null;
    }
  }
}

export function startRoomTransition(renderer: RenderState): void {
  renderer.fadeDirection = 'out';
  renderer.fadeAlpha = 0;
}

export function isTransitioning(renderer: RenderState): boolean {
  return renderer.fadeDirection !== 'none';
}

export function triggerHurtFlash(renderer: RenderState): void {
  renderer.hurtFlash = 1;
  renderer.screenShake = 1;
}

export function triggerPotionEffect(renderer: RenderState): void {
  renderer.potionEffect = 1;
}

export function triggerGoldCollect(renderer: RenderState, x: number, y: number, targetX: number, targetY: number, value: number): void {
  renderer.goldCollectAnim = { x, y, targetX, targetY, progress: 0, value };
}

export function updateCamera(renderer: RenderState, player: Player, mapData: MapData): void {
  const targetX = player.x + renderer.tileSize / 2 - renderer.viewWidth / 2;
  const targetY = player.y + renderer.tileSize / 2 - renderer.viewHeight / 2;

  const maxX = mapData.width * renderer.tileSize - renderer.viewWidth;
  const maxY = mapData.height * renderer.tileSize - renderer.viewHeight;

  renderer.cameraX = Math.max(0, Math.min(maxX, targetX));
  renderer.cameraY = Math.max(0, Math.min(maxY, targetY));
}

export function render(
  renderer: RenderState,
  mapData: MapData,
  player: Player,
  monsters: Monster[],
  items: Item[],
  currentRoom: Room | undefined
): void {
  const { ctx, canvas, tileSize } = renderer;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let shakeX = 0;
  let shakeY = 0;
  if (renderer.screenShake > 0) {
    shakeX = (Math.random() - 0.5) * 6 * renderer.screenShake;
    shakeY = (Math.random() - 0.5) * 6 * renderer.screenShake;
  }

  ctx.save();
  ctx.translate(-renderer.cameraX + shakeX, -renderer.cameraY + shakeY);

  renderMap(renderer, mapData);
  renderItems(renderer, items);
  renderMonsters(renderer, monsters);
  renderPlayer(renderer, player);

  ctx.restore();

  if (renderer.potionEffect > 0) {
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, `rgba(231, 76, 60, ${renderer.potionEffect * 0.5})`);
    gradient.addColorStop(0.5, `rgba(231, 76, 60, ${renderer.potionEffect * 0.3})`);
    gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (renderer.hurtFlash > 0) {
    ctx.fillStyle = `rgba(231, 76, 60, ${renderer.hurtFlash * 0.4})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = `rgba(231, 76, 60, ${renderer.hurtFlash * 0.8})`;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  }

  renderUI(renderer, player, mapData);
  renderMinimap(renderer, mapData, player);

  if (renderer.goldCollectAnim) {
    const anim = renderer.goldCollectAnim;
    const t = anim.progress;
    const easeT = t * t * (3 - 2 * t);
    const x = anim.x + (anim.targetX - anim.x) * easeT - renderer.cameraX;
    const y = anim.y + (anim.targetY - anim.y) * easeT - renderer.cameraY - Math.sin(t * Math.PI) * 50;
    const scale = 1 + Math.sin(t * Math.PI) * 0.5;
    const rotation = t * Math.PI * 4;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    const size = tileSize * 0.5;
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.goldLight;
    ctx.beginPath();
    ctx.arc(-size * 0.2, -size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (t > 0.7) {
      ctx.fillStyle = COLORS.gold;
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.globalAlpha = (t - 0.7) / 0.3;
      ctx.fillText(`+${anim.value}`, anim.targetX - renderer.cameraX + 20, anim.targetY - renderer.cameraY + 4);
      ctx.globalAlpha = 1;
    }
  }

  if (renderer.fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${renderer.fadeAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function renderMap(renderer: RenderState, mapData: MapData): void {
  const { ctx, tileSize, cameraX, cameraY, viewWidth, viewHeight } = renderer;

  const startTileX = Math.floor(cameraX / tileSize);
  const startTileY = Math.floor(cameraY / tileSize);
  const endTileX = Math.ceil((cameraX + viewWidth) / tileSize);
  const endTileY = Math.ceil((cameraY + viewHeight) / tileSize);

  for (let y = startTileY; y <= endTileY; y++) {
    for (let x = startTileX; x <= endTileX; x++) {
      if (y < 0 || y >= mapData.height || x < 0 || x >= mapData.width) continue;

      const tile = mapData.tiles[y][x];
      const px = x * tileSize;
      const py = y * tileSize;

      if (tile === TileType.WALL) {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, tileSize, tileSize);

        ctx.fillStyle = COLORS.wallLight;
        ctx.fillRect(px, py, tileSize, 4);
        ctx.fillRect(px, py, 4, tileSize);

        ctx.fillStyle = COLORS.wallDark;
        ctx.fillRect(px, py + tileSize - 4, tileSize, 4);
        ctx.fillRect(px + tileSize - 4, py, 4, tileSize);
      } else if (tile === TileType.FLOOR) {
        ctx.fillStyle = COLORS.floor;
        ctx.fillRect(px, py, tileSize, tileSize);

        if ((x + y) % 2 === 0) {
          ctx.fillStyle = COLORS.floorDark;
          ctx.fillRect(px, py, tileSize, 2);
        }
      } else if (tile === TileType.CORRIDOR) {
        ctx.fillStyle = COLORS.corridor;
        ctx.fillRect(px, py, tileSize, tileSize);
      }
    }
  }

  for (const room of mapData.rooms) {
    if (room.type === 'exit' && room.visited) {
      const px = (room.gridX + Math.floor(room.width / 2)) * tileSize;
      const py = (room.gridY + Math.floor(room.height / 2)) * tileSize;
      const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;

      ctx.fillStyle = `rgba(46, 204, 113, ${pulse})`;
      ctx.fillRect(px - tileSize / 2, py - tileSize / 2, tileSize, tileSize);

      ctx.fillStyle = '#fff';
      ctx.font = `${tileSize * 0.6}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', px, py);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }
}

function renderPlayer(renderer: RenderState, player: Player): void {
  const { ctx, tileSize } = renderer;
  const x = player.x;
  const y = player.y;
  const size = tileSize;

  if (player.hurtTimer > 0 && Math.floor(player.hurtTimer * 10) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);

  if (player.isAttacking) {
    const shake = Math.sin(Date.now() * 0.05) * 2;
    ctx.translate(shake, 0);
  }

  ctx.fillStyle = COLORS.player;
  ctx.fillRect(-size * 0.3, -size * 0.1, size * 0.6, size * 0.5);

  ctx.fillStyle = COLORS.playerSkin;
  ctx.fillRect(-size * 0.25, -size * 0.4, size * 0.5, size * 0.35);

  ctx.fillStyle = '#000';
  const eyeOffset = player.direction === 'left' ? -2 : player.direction === 'right' ? 2 : 0;
  ctx.fillRect(-size * 0.15 + eyeOffset, -size * 0.3, size * 0.08, size * 0.08);
  ctx.fillRect(size * 0.07 + eyeOffset, -size * 0.3, size * 0.08, size * 0.08);

  const legOffset = player.isMoving ? (player.animFrame === 0 ? -3 : 3) : 0;
  ctx.fillStyle = COLORS.playerDark;
  ctx.fillRect(-size * 0.25, size * 0.4, size * 0.2, size * 0.2);
  ctx.fillRect(size * 0.05 + legOffset * 0.5, size * 0.4, size * 0.2, size * 0.2);

  ctx.fillStyle = COLORS.playerSkin;
  if (player.direction === 'up') {
    ctx.fillRect(-size * 0.3, 0, size * 0.15, size * 0.3);
    ctx.fillRect(size * 0.15, 0, size * 0.15, size * 0.3);
  } else if (player.direction === 'down') {
    ctx.fillRect(-size * 0.3, size * 0.05, size * 0.15, size * 0.25);
    ctx.fillRect(size * 0.15, size * 0.05, size * 0.15, size * 0.25);
  } else if (player.direction === 'left') {
    ctx.fillRect(-size * 0.35, size * 0.05, size * 0.2, size * 0.15);
    ctx.fillRect(size * 0.15, size * 0.05, size * 0.15, size * 0.15);
  } else {
    ctx.fillRect(-size * 0.3, size * 0.05, size * 0.15, size * 0.15);
    ctx.fillRect(size * 0.2, size * 0.05, size * 0.2, size * 0.15);
  }

  ctx.restore();

  if (player.damageTextTimer > 0) {
    ctx.fillStyle = COLORS.hpRed;
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const floatY = y - (1 - player.damageTextTimer / 0.8) * 30;
    ctx.fillText(`-${player.damageText}`, x + size / 2, floatY);
    ctx.textAlign = 'left';
  }
}

function renderMonsters(renderer: RenderState, monsters: Monster[]): void {
  const { ctx, tileSize } = renderer;

  for (const monster of monsters) {
    const x = monster.x;
    const y = monster.y;
    const size = tileSize;
    const isDead = monster.state === 'dead';

    if (isDead) {
      ctx.globalAlpha = monster.deathTimer / 2;
      ctx.fillStyle = '#555';
      ctx.fillRect(x + size * 0.1, y + size * 0.6, size * 0.8, size * 0.3);
      ctx.globalAlpha = 1;
      continue;
    }

    if (monster.hurtTimer > 0 && Math.floor(monster.hurtTimer * 10) % 2 === 0) {
      continue;
    }

    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    const legAnim = monster.animFrame === 0 ? -2 : 2;

    switch (monster.type) {
      case 'slime':
        const squash = Math.sin(Date.now() * 0.008) * 0.1 + 1;
        ctx.scale(1, squash);
        ctx.fillStyle = COLORS.slime;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.1, size * 0.35, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.slimeDark;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.2, size * 0.3, size * 0.15, 0, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-size * 0.12, 0, size * 0.08, 0, Math.PI * 2);
        ctx.arc(size * 0.12, 0, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-size * 0.1, 0, size * 0.04, 0, Math.PI * 2);
        ctx.arc(size * 0.14, 0, size * 0.04, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'skeleton':
        ctx.fillStyle = COLORS.skeleton;
        ctx.fillRect(-size * 0.2, -size * 0.35, size * 0.4, size * 0.4);

        ctx.fillStyle = '#000';
        ctx.fillRect(-size * 0.12, -size * 0.25, size * 0.08, size * 0.1);
        ctx.fillRect(size * 0.04, -size * 0.25, size * 0.08, size * 0.1);

        ctx.fillStyle = COLORS.skeletonDark;
        ctx.fillRect(-size * 0.15, size * 0.05, size * 0.3, size * 0.4);

        ctx.fillStyle = COLORS.skeleton;
        ctx.fillRect(-size * 0.2, size * 0.45 + legAnim, size * 0.15, size * 0.2);
        ctx.fillRect(size * 0.05, size * 0.45 - legAnim, size * 0.15, size * 0.2);
        break;

      case 'bat':
        const wingFlap = Math.sin(Date.now() * 0.02) * size * 0.2;

        ctx.fillStyle = COLORS.bat;
        ctx.beginPath();
        ctx.moveTo(-size * 0.1, 0);
        ctx.lineTo(-size * 0.4, -size * 0.2 + wingFlap);
        ctx.lineTo(-size * 0.3, size * 0.1);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(size * 0.1, 0);
        ctx.lineTo(size * 0.4, -size * 0.2 + wingFlap);
        ctx.lineTo(size * 0.3, size * 0.1);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = COLORS.batDark;
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.15, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(-size * 0.06, -size * 0.02, size * 0.03, 0, Math.PI * 2);
        ctx.arc(size * 0.06, -size * 0.02, size * 0.03, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();

    if (monster.damageTextTimer > 0) {
      ctx.fillStyle = COLORS.hpRed;
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      const floatY = y - (1 - monster.damageTextTimer / 0.8) * 30;
      ctx.fillText(`-${monster.damageText}`, x + size / 2, floatY);
      ctx.textAlign = 'left';
    }

    if (monster.hp < monster.maxHp && !isDead) {
      const barWidth = size * 0.8;
      const barHeight = 4;
      const barX = x + size * 0.1;
      const barY = y - 8;
      const hpPercent = monster.hp / monster.maxHp;

      ctx.fillStyle = '#000';
      ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = hpPercent > 0.5 ? COLORS.hpGreen : hpPercent > 0.25 ? COLORS.hpYellow : COLORS.hpRed;
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
  }
}

function renderItems(renderer: RenderState, items: Item[]): void {
  const { ctx, tileSize } = renderer;

  for (const item of items) {
    if (item.collected) continue;

    const x = item.x;
    const y = item.y + item.animOffset;
    const size = tileSize;

    switch (item.type) {
      case 'potion':
        ctx.fillStyle = COLORS.potion;
        ctx.fillRect(x + size * 0.3, y + size * 0.25, size * 0.4, size * 0.5);

        ctx.fillStyle = '#8b0000';
        ctx.fillRect(x + size * 0.35, y + size * 0.15, size * 0.3, size * 0.15);

        const glowPulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 107, 91, ${glowPulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.potionGlow;
        ctx.fillRect(x + size * 0.35, y + size * 0.3, size * 0.1, size * 0.15);
        break;

      case 'gold':
        const pulse = Math.sin(Date.now() * 0.008 + item.gridX) * 0.2 + 0.8;
        ctx.fillStyle = COLORS.gold;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size * 0.25 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.goldLight;
        ctx.beginPath();
        ctx.arc(x + size * 0.4, y + size * 0.4, size * 0.1 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#b8860b';
        ctx.font = `${size * 0.3}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', x + size / 2, y + size / 2 + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        break;

      case 'chest':
        ctx.fillStyle = COLORS.chest;
        ctx.fillRect(x + size * 0.15, y + size * 0.3, size * 0.7, size * 0.5);

        ctx.fillStyle = COLORS.chestLight;
        ctx.fillRect(x + size * 0.15, y + size * 0.25, size * 0.7, size * 0.15);

        ctx.fillStyle = COLORS.gold;
        ctx.fillRect(x + size * 0.45, y + size * 0.45, size * 0.1, size * 0.15);

        ctx.fillStyle = '#000';
        ctx.fillRect(x + size * 0.47, y + size * 0.5, size * 0.06, size * 0.05);
        break;
    }
  }
}

function renderUI(renderer: RenderState, player: Player, mapData: MapData): void {
  const { ctx, canvas } = renderer;

  ctx.fillStyle = COLORS.uiBg;
  ctx.fillRect(10, 10, 180, 40);
  ctx.strokeStyle = COLORS.uiBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 180, 40);

  ctx.fillStyle = '#fff';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText('HP', 20, 28);

  const hpBarWidth = 120;
  const hpBarHeight = 12;
  const hpBarX = 50;
  const hpBarY = 20;
  const hpPercent = player.hp / player.maxHp;

  ctx.fillStyle = '#000';
  ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarWidth + 2, hpBarHeight + 2);
  ctx.fillStyle = '#333';
  ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

  let hpColor: string;
  if (hpPercent > 0.6) {
    hpColor = COLORS.hpGreen;
  } else if (hpPercent > 0.3) {
    const r = Math.floor(46 + (241 - 46) * (1 - (hpPercent - 0.3) / 0.3));
    const g = Math.floor(204 + (196 - 204) * (1 - (hpPercent - 0.3) / 0.3));
    const b = Math.floor(113 + (15 - 113) * (1 - (hpPercent - 0.3) / 0.3));
    hpColor = `rgb(${r}, ${g}, ${b})`;
  } else {
    const r = Math.floor(241 + (231 - 241) * (1 - hpPercent / 0.3));
    const g = Math.floor(196 + (76 - 196) * (1 - hpPercent / 0.3));
    const b = Math.floor(15 + (60 - 15) * (1 - hpPercent / 0.3));
    hpColor = `rgb(${r}, ${g}, ${b})`;
  }

  ctx.fillStyle = hpColor;
  ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);

  ctx.fillStyle = '#fff';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${player.hp}/${player.maxHp}`, hpBarX + hpBarWidth / 2, hpBarY + hpBarHeight - 2);
  ctx.textAlign = 'left';

  ctx.fillStyle = COLORS.uiBg;
  ctx.fillRect(canvas.width - 130, 10, 120, 35);
  ctx.strokeStyle = COLORS.uiBorder;
  ctx.strokeRect(canvas.width - 130, 10, 120, 35);

  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(canvas.width - 110, 28, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b8860b';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('$', canvas.width - 110, 32);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#fff';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.fillText(`${player.gold}`, canvas.width - 85, 33);

  ctx.fillStyle = COLORS.uiBg;
  ctx.fillRect(10, canvas.height - 35, 100, 25);
  ctx.strokeStyle = COLORS.uiBorder;
  ctx.strokeRect(10, canvas.height - 35, 100, 25);

  ctx.fillStyle = '#fff';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`[${player.roomX},${player.roomY}]`, 20, canvas.height - 18);
}

function renderMinimap(renderer: RenderState, mapData: MapData, player: Player): void {
  const { ctx, canvas } = renderer;
  const minimapSize = 12;
  const padding = 4;
  const minimapX = canvas.width - mapData.gridSize * (minimapSize + padding) - 15;
  const minimapY = canvas.height - mapData.gridSize * (minimapSize + padding) - 15;

  ctx.fillStyle = COLORS.uiBg;
  ctx.fillRect(minimapX - 5, minimapY - 5, mapData.gridSize * (minimapSize + padding) + 10, mapData.gridSize * (minimapSize + padding) + 10);
  ctx.strokeStyle = COLORS.uiBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(minimapX - 5, minimapY - 5, mapData.gridSize * (minimapSize + padding) + 10, mapData.gridSize * (minimapSize + padding) + 10);

  for (const room of mapData.rooms) {
    const x = minimapX + room.x * (minimapSize + padding);
    const y = minimapY + room.y * (minimapSize + padding);

    if (room.visited) {
      if (room.type === 'exit') {
        ctx.fillStyle = COLORS.exit;
      } else if (room.type === 'chest') {
        ctx.fillStyle = COLORS.gold;
      } else if (room.type === 'start') {
        ctx.fillStyle = COLORS.player;
      } else {
        ctx.fillStyle = COLORS.minimapVisited;
      }
    } else {
      ctx.fillStyle = COLORS.minimapUnvisited;
    }

    ctx.fillRect(x, y, minimapSize, minimapSize);

    if (player.roomX === room.x && player.roomY === room.y) {
      const blink = Math.sin(Date.now() * 0.01) > 0;
      ctx.strokeStyle = blink ? '#fff' : COLORS.uiBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, minimapSize + 2, minimapSize + 2);
    }
  }
}

export function handleItemEvent(renderer: RenderState, event: ItemEvent, player: Player, canvas: HTMLCanvasElement): void {
  if (event.type === 'potion_used') {
    triggerPotionEffect(renderer);
  } else if (event.type === 'item_collected' && event.item.type === 'gold') {
    const targetX = canvas.width - 80;
    const targetY = 30;
    triggerGoldCollect(renderer, event.item.x, event.item.y, targetX + renderer.cameraX, targetY + renderer.cameraY, event.item.value);
  }
}
