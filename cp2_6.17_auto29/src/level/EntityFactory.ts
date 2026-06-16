import type {
  Entity,
  PlatformEntity,
  CrumblingEntity,
  SpikeEntity,
  DroneEntity,
  TurretEntity,
  BulletEntity,
  FragmentEntity,
  ExitEntity,
  LevelData,
} from '../store/gameStore';

const idCounter = { value: 0 };
const nextId = (prefix: string) => `${prefix}_${++idCounter.value}`;

export const GRAVITY = 1400;
export const PLAYER_W = 32;
export const PLAYER_H = 48;
export const MOVE_SPEED = 220;
export const CHRONO_RADIUS = 200;

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  isJumping: boolean;
  onGround: boolean;
  animFrame: number;
  health: number;
  invincible: number;
}

export function createPlatform(x: number, y: number, w: number, h: number): PlatformEntity {
  return {
    id: nextId('plat'),
    type: 'platform',
    x, y, w, h,
    affectedByChrono: false,
  };
}

export function createCrumbling(x: number, y: number, w: number, h: number): CrumblingEntity {
  return {
    id: nextId('crumb'),
    type: 'crumbling',
    x, y, w, h,
    stepped: false,
    stepTimer: 0,
    fadeTimer: 0,
    visible: true,
    respawnTimer: 0,
    affectedByChrono: false,
  };
}

export function createSpike(x: number, y: number, w: number, h: number): SpikeEntity {
  return {
    id: nextId('spike'),
    type: 'spike',
    x, y, w, h,
    cycleTimer: 0,
    phase: 'safe',
    animTimer: 0,
    affectedByChrono: false,
  };
}

export function createDrone(x: number, y: number, patrolStart: number, patrolEnd: number): DroneEntity {
  return {
    id: nextId('drone'),
    type: 'drone',
    x, y, w: 40, h: 28,
    patrolStart,
    patrolEnd,
    direction: 1,
    speed: 60,
    affectedByChrono: true,
    animTimer: 0,
  };
}

export function createTurret(x: number, y: number): TurretEntity {
  return {
    id: nextId('turret'),
    type: 'turret',
    x, y, w: 44, h: 36,
    fireTimer: 0,
    fireInterval: 2000,
    affectedByChrono: false,
  };
}

export function createBullet(x: number, y: number, vx: number, vy: number): BulletEntity {
  return {
    id: nextId('bullet'),
    type: 'bullet',
    x, y, w: 10, h: 6,
    vx, vy,
    life: 4000,
    affectedByChrono: false,
  };
}

export function createFragment(x: number, y: number): FragmentEntity {
  return {
    id: nextId('frag'),
    type: 'fragment',
    x, y, w: 20, h: 20,
    collected: false,
    pulseTimer: Math.random() * Math.PI * 2,
    affectedByChrono: false,
  };
}

export function createExit(x: number, y: number): ExitEntity {
  return {
    id: nextId('exit'),
    type: 'exit',
    x, y, w: 60, h: 80,
    affectedByChrono: false,
  };
}

export function buildDemoLevel(): LevelData {
  idCounter.value = 0;
  const entities: Entity[] = [];
  const LEVEL_W = 2400;
  const LEVEL_H = 800;
  const GROUND_Y = LEVEL_H - 80;

  entities.push(createPlatform(0, GROUND_Y, 500, 80));
  entities.push(createPlatform(580, GROUND_Y, 320, 80));
  entities.push(createPlatform(980, GROUND_Y, 400, 80));
  entities.push(createPlatform(1460, GROUND_Y, 340, 80));
  entities.push(createPlatform(1880, GROUND_Y, 520, 80));

  entities.push(createPlatform(260, 620, 140, 20));
  entities.push(createPlatform(460, 520, 140, 20));
  entities.push(createPlatform(700, 560, 120, 20));
  entities.push(createCrumbling(860, 480, 100, 18));
  entities.push(createPlatform(1040, 520, 120, 20));
  entities.push(createCrumbling(1220, 440, 100, 18));
  entities.push(createPlatform(1380, 520, 140, 20));
  entities.push(createPlatform(1580, 420, 120, 20));
  entities.push(createCrumbling(1760, 380, 100, 18));
  entities.push(createPlatform(1940, 500, 140, 20));
  entities.push(createPlatform(2140, 400, 140, 20));

  entities.push(createSpike(500, GROUND_Y - 18, 80, 18));
  entities.push(createSpike(900, GROUND_Y - 18, 80, 18));
  entities.push(createSpike(1380, GROUND_Y - 18, 80, 18));
  entities.push(createSpike(1800, GROUND_Y - 18, 80, 18));

  entities.push(createDrone(650, 460, 580, 900));
  entities.push(createDrone(1150, 360, 1040, 1380));
  entities.push(createDrone(1700, 300, 1580, 1860));

  entities.push(createTurret(1080, GROUND_Y - 36));
  entities.push(createTurret(2040, GROUND_Y - 36));

  entities.push(createFragment(310, 580));
  entities.push(createFragment(510, 480));
  entities.push(createFragment(900, 440));
  entities.push(createFragment(1270, 400));
  entities.push(createFragment(1630, 380));
  entities.push(createFragment(2190, 360));

  entities.push(createExit(2300, GROUND_Y - 80));

  return {
    id: 0,
    name: '时间试炼',
    width: LEVEL_W,
    height: LEVEL_H,
    entities,
    totalFragments: entities.filter((e) => e.type === 'fragment').length,
    playerStart: { x: 80, y: GROUND_Y - PLAYER_H - 10 },
  };
}

// ---------- Rendering helpers ----------

let noiseCache: HTMLCanvasElement | null = null;
function getNoiseTexture(): HTMLCanvasElement {
  if (noiseCache) return noiseCache;
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 80 + Math.floor(Math.random() * 90);
    img.data[i] = v;
    img.data[i + 1] = v + 10;
    img.data[i + 2] = v + 30;
    img.data[i + 3] = 140;
  }
  ctx.putImageData(img, 0, 0);
  noiseCache = cv;
  return cv;
}

export function drawBackground(ctx: CanvasRenderingContext2D, cameraX: number, W: number, H: number, time: number) {
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#2B0F3A');
  grd.addColorStop(1, '#1A0F2E');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  const parallax1 = -cameraX * 0.1;
  ctx.fillStyle = 'rgba(120,80,180,0.08)';
  for (let i = 0; i < 30; i++) {
    const x = ((i * 173 + parallax1) % (W + 200) + (W + 200)) % (W + 200) - 100;
    const y = 80 + (i * 37) % 360;
    const r = 40 + (i % 5) * 20;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(200,180,255,0.5)';
  for (let i = 0; i < 60; i++) {
    const x = ((i * 211 - cameraX * 0.3) % (W + 200) + (W + 200)) % (W + 200) - 100;
    const y = (i * 73) % (H - 160);
    const sz = (i % 3 === 0) ? 2 : 1;
    ctx.fillRect(x, y, sz, sz);
  }
  ctx.restore();
}

export function drawPlatform(ctx: CanvasRenderingContext2D, p: PlatformEntity) {
  const ntex = getNoiseTexture();
  ctx.save();
  ctx.fillStyle = '#2A1E3D';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  const pat = ctx.createPattern(ntex, 'repeat');
  if (pat) {
    ctx.fillStyle = pat;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(160,140,220,0.5)';
  ctx.fillRect(p.x, p.y, p.w, 2);
  ctx.fillStyle = 'rgba(80,50,120,0.9)';
  ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2);
  ctx.restore();
}

export function drawCrumbling(ctx: CanvasRenderingContext2D, c: CrumblingEntity) {
  if (!c.visible && c.fadeTimer <= 0) return;
  ctx.save();
  let alpha = 1;
  if (c.stepped) {
    if (c.fadeTimer > 0) alpha = c.fadeTimer / 300;
    ctx.globalAlpha = alpha;
  }
  const ntex = getNoiseTexture();
  ctx.fillStyle = c.stepped ? '#5A2030' : '#3A2448';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  const pat = ctx.createPattern(ntex, 'repeat');
  if (pat) {
    ctx.fillStyle = pat;
    ctx.globalAlpha = 0.28 * alpha;
    ctx.fillRect(c.x, c.y, c.w, c.h);
  }
  ctx.globalAlpha = alpha;
  if (c.stepped) {
    ctx.strokeStyle = '#FF5566';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.x + c.w * 0.2, c.y);
    ctx.lineTo(c.x + c.w * 0.5, c.y + c.h * 0.7);
    ctx.lineTo(c.x + c.w * 0.8, c.y + c.h);
    ctx.moveTo(c.x + c.w * 0.6, c.y);
    ctx.lineTo(c.x + c.w * 0.3, c.y + c.h);
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(200,150,100,0.5)';
    ctx.fillRect(c.x, c.y, c.w, 2);
  }
  ctx.restore();
}

export function drawSpike(ctx: CanvasRenderingContext2D, s: SpikeEntity) {
  ctx.save();
  let spikeH = 0;
  let color = '#555566';
  if (s.phase === 'warn') {
    spikeH = s.h * 0.5 * (s.animTimer / 500);
    color = '#AA4444';
  } else if (s.phase === 'danger') {
    spikeH = s.h;
    color = '#FF3344';
  } else if (s.phase === 'retract') {
    spikeH = s.h * (1 - s.animTimer / 500);
    color = '#CC3355';
  }
  ctx.fillStyle = '#22222E';
  ctx.fillRect(s.x, s.y + s.h - 4, s.w, 4);
  if (spikeH > 1) {
    const tipCount = Math.max(1, Math.floor(s.w / 16));
    const tipW = s.w / tipCount;
    ctx.fillStyle = color;
    for (let i = 0; i < tipCount; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + i * tipW, s.y + s.h - 4);
      ctx.lineTo(s.x + i * tipW + tipW / 2, s.y + s.h - spikeH);
      ctx.lineTo(s.x + (i + 1) * tipW, s.y + s.h - 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < tipCount; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + i * tipW + tipW * 0.4, s.y + s.h - 4);
      ctx.lineTo(s.x + i * tipW + tipW / 2, s.y + s.h - spikeH);
      ctx.lineTo(s.x + i * tipW + tipW / 2, s.y + s.h - 4);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawDrone(ctx: CanvasRenderingContext2D, d: DroneEntity, paused: boolean) {
  ctx.save();
  const cx = d.x + d.w / 2;
  const cy = d.y + d.h / 2;
  const hover = Math.sin(d.animTimer / 150) * 2;
  ctx.translate(0, hover);
  ctx.fillStyle = paused ? '#606078' : '#8855AA';
  ctx.beginPath();
  ctx.ellipse(cx, cy, d.w / 2, d.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = paused ? '#303040' : '#221133';
  ctx.fillRect(d.x + 4, cy - 2, d.w - 8, 4);
  const eyeX = cx + d.direction * 6;
  ctx.fillStyle = paused ? '#888899' : '#FF66FF';
  ctx.beginPath();
  ctx.arc(eyeX, cy - 1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = paused ? '#AAAABB' : '#FFFFFF';
  ctx.beginPath();
  ctx.arc(eyeX + d.direction, cy - 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = paused ? '#555566' : '#443366';
  const rotorA = paused ? 0 : (d.animTimer / 30);
  for (let s = -1; s <= 1; s += 2) {
    const rx = cx + s * (d.w / 2 - 2);
    ctx.save();
    ctx.translate(rx, d.y + 4);
    ctx.rotate(rotorA * s);
    ctx.fillRect(-8, -1, 16, 2);
    ctx.restore();
  }
  if (paused) {
    ctx.strokeStyle = 'rgba(255,215,0,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy + hover, d.w / 2 + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTurret(ctx: CanvasRenderingContext2D, t: TurretEntity) {
  ctx.save();
  ctx.fillStyle = '#333344';
  ctx.fillRect(t.x + 2, t.y + t.h - 14, t.w - 4, 14);
  ctx.fillStyle = '#554466';
  ctx.beginPath();
  ctx.arc(t.x + t.w / 2, t.y + t.h - 14, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#221122';
  ctx.fillRect(t.x + t.w / 2 - 2, t.y + 4, 4, t.h - 18);
  const angle = 0;
  ctx.save();
  ctx.translate(t.x + t.w / 2, t.y + t.h - 14);
  ctx.rotate(angle - Math.PI / 2);
  ctx.fillStyle = '#FF4444';
  ctx.fillRect(0, -3, 20, 6);
  ctx.fillStyle = '#FFAA00';
  ctx.fillRect(18, -3, 3, 6);
  ctx.restore();
  const charge = t.fireTimer / t.fireInterval;
  ctx.fillStyle = `rgba(255,${100 + Math.floor(charge * 155)},0,${0.4 + charge * 0.5})`;
  ctx.beginPath();
  ctx.arc(t.x + t.w / 2, t.y + t.h - 14, 4 + charge * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBullet(ctx: CanvasRenderingContext2D, b: BulletEntity) {
  ctx.save();
  const grd = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y);
  grd.addColorStop(0, '#FFAA00');
  grd.addColorStop(0.5, '#FF3333');
  grd.addColorStop(1, '#AA0000');
  ctx.fillStyle = grd;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = 'rgba(255,200,100,0.4)';
  ctx.fillRect(b.x - 6, b.y - 2, 6, b.h + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(b.x + b.w - 3, b.y + 1, 2, b.h - 2);
  ctx.restore();
}

export function drawFragment(ctx: CanvasRenderingContext2D, f: FragmentEntity, time: number) {
  if (f.collected) return;
  ctx.save();
  const pulse = 0.7 + Math.sin(f.pulseTimer + time / 300) * 0.3;
  const cx = f.x + f.w / 2;
  const cy = f.y + f.h / 2 + Math.sin(f.pulseTimer + time / 400) * 3;
  ctx.translate(cx, cy);
  ctx.rotate(time / 600);
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 16 * pulse;
  ctx.fillStyle = `rgba(255,215,0,${0.9 * pulse})`;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const r = i % 2 === 0 ? 10 : 4;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,220,0.9)';
  ctx.beginPath();
  ctx.arc(-2, -2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawExit(ctx: CanvasRenderingContext2D, e: ExitEntity, time: number) {
  ctx.save();
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const grd = ctx.createRadialGradient(cx, cy, 5, cx, cy, e.w / 2 + 20);
  grd.addColorStop(0, 'rgba(100,255,200,0.9)');
  grd.addColorStop(0.5, 'rgba(60,180,255,0.5)');
  grd.addColorStop(1, 'rgba(80,80,200,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, e.w / 2 + 20 + Math.sin(time / 300) * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(100,255,255,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const a = time / 500 + (i * Math.PI) / 2;
    const rx = cx + Math.cos(a) * (e.w / 2 - 6);
    const ry = cy + Math.sin(a) * (e.h / 2 - 6);
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#00FFFF';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', cx, cy + 4);
  ctx.restore();
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerState) {
  ctx.save();
  if (p.invincible > 0 && Math.floor(p.invincible / 80) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  ctx.translate(cx, cy);
  if (p.facing === -1) ctx.scale(-1, 1);
  ctx.translate(-p.w / 2, -p.h / 2);

  // Legs animation
  let legOffset1 = 0, legOffset2 = 0;
  if (!p.onGround) {
    legOffset1 = -4;
    legOffset2 = 4;
  } else if (Math.abs(p.vx) > 10) {
    const phase = Math.floor(p.animFrame / 2) % 4;
    const swings = [0, 3, 0, -3];
    legOffset1 = swings[phase];
    legOffset2 = swings[(phase + 2) % 4];
  }
  ctx.fillStyle = '#D8D8E8';
  ctx.fillRect(6, 34 + legOffset1, 8, 14);
  ctx.fillRect(18, 34 + legOffset2, 8, 14);
  ctx.fillStyle = '#554477';
  ctx.fillRect(6, 46 + legOffset1, 8, 2);
  ctx.fillRect(18, 46 + legOffset2, 8, 2);

  // Body
  ctx.fillStyle = '#E8E8F0';
  ctx.fillRect(4, 18, 24, 20);
  ctx.fillStyle = '#4488CC';
  ctx.fillRect(4, 18, 24, 6);
  ctx.fillStyle = '#3A6FA8';
  ctx.fillRect(4, 22, 24, 2);

  // Backpack
  ctx.fillStyle = '#6677AA';
  ctx.fillRect(0, 22, 5, 14);
  ctx.fillStyle = '#88CCFF';
  ctx.fillRect(1, 25, 3, 3);

  // Arms
  ctx.fillStyle = '#E8E8F0';
  if (!p.onGround) {
    ctx.fillRect(-2, 16, 6, 12);
    ctx.fillRect(28, 14, 6, 12);
  } else if (Math.abs(p.vx) > 10) {
    const phase = Math.floor(p.animFrame / 2) % 4;
    const swings = [0, 4, 0, -4];
    ctx.fillRect(-2, 20 + swings[phase], 6, 12);
    ctx.fillRect(28, 20 - swings[phase], 6, 12);
  } else {
    ctx.fillRect(-2, 22, 6, 12);
    ctx.fillRect(28, 22, 6, 12);
  }

  // Helmet
  ctx.fillStyle = '#F0F0F5';
  ctx.beginPath();
  ctx.arc(16, 13, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E0E0E8';
  ctx.beginPath();
  ctx.arc(16, 13, 12, 0.2, Math.PI - 0.2);
  ctx.fill();

  // Visor
  ctx.fillStyle = '#222244';
  ctx.beginPath();
  ctx.ellipse(18, 13, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#44AAFF';
  ctx.beginPath();
  ctx.ellipse(18, 13, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(20, 11, 2, 1, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Antenna
  ctx.strokeStyle = '#AAAAAA';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, 4);
  ctx.lineTo(9, -3);
  ctx.stroke();
  ctx.fillStyle = '#FF4466';
  ctx.beginPath();
  ctx.arc(9, -4, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawChronoField(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  pulseTime: number,
) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const t = (pulseTime + i * 0.33) % 1;
    const radius = 40 + t * CHRONO_RADIUS;
    const alpha = (0.6 - t * 0.4) * (1 - Math.abs(t - 0.5) * 0.5);
    ctx.strokeStyle = `rgba(255,215,0,${alpha})`;
    ctx.lineWidth = 3 - i * 0.8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  const innerAlpha = 0.15 + Math.sin(pulseTime * Math.PI * 2) * 0.05;
  const grd = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, CHRONO_RADIUS);
  grd.addColorStop(0, `rgba(255,230,100,${innerAlpha + 0.1})`);
  grd.addColorStop(0.6, `rgba(255,215,0,${innerAlpha})`);
  grd.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(centerX, centerY, CHRONO_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
