import {
  Player,
  Obstacle,
  PowerUpItem,
  PowerUpType,
  Particle,
  FrostZone,
  FireEffect,
  HealEffect,
  CardData,
  CARD_POOL,
  SkillType
} from './objects';

import {
  rectIntersect,
  checkPowerUpPickup,
  isOutOfBounds,
  pointInSector,
  circleIntersect,
  resolvePlayerObstacle,
  resolvePlayerPlayer,
  clampToBounds
} from './physics';

const CANVAS_W = 900;
const CANVAS_H = 600;
const POWERUP_SPAWN_INTERVAL = 5000;

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const overlay = document.getElementById('overlay')!;
const startBtn = document.getElementById('start-btn')!;
const resultText = document.getElementById('result-text') as HTMLDivElement;
const gameTitle = document.getElementById('game-title')!;

let gameRunning = false;
let lastTime = 0;
let powerupTimer = 0;
let frostDamageTimer = 0;

let player1!: Player;
let player2!: Player;
let obstacles: Obstacle[] = [];
let powerups: PowerUpItem[] = [];
let particles: Particle[] = [];
let frostZones: FrostZone[] = [];
let fireEffects: FireEffect[] = [];
let healEffects: HealEffect[] = [];

const keys: Record<string, boolean> = {};

function initObstacles() {
  obstacles = [];
  const w = 120, h = 40;
  const positions = [
    { x: 140, y: 160 },
    { x: 640, y: 160 },
    { x: 390, y: 280 },
    { x: 140, y: 420 },
    { x: 640, y: 420 }
  ];
  for (const p of positions) {
    obstacles.push({ x: p.x, y: p.y, w, h, shakeTime: 0 });
  }
}

function initPlayers() {
  player1 = new Player(1, 180, CANVAS_H / 2, 1, '#8BC34A');
  player2 = new Player(2, CANVAS_W - 180, CANVAS_H / 2, -1, '#E91E63');
}

function spawnPowerup() {
  const types: PowerUpType[] = [
    PowerUpType.SpeedBoost,
    PowerUpType.Shield,
    PowerUpType.DamageUp,
    PowerUpType.SkillCard
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  let x = 0, y = 0;
  let valid = false;
  let attempts = 0;
  while (!valid && attempts < 30) {
    x = 80 + Math.random() * (CANVAS_W - 160);
    y = 80 + Math.random() * (CANVAS_H - 160);
    valid = true;
    for (const o of obstacles) {
      if (rectIntersect({ x: x - 20, y: y - 20, w: 40, h: 40 }, o)) {
        valid = false;
        break;
      }
    }
    attempts++;
  }
  powerups.push({ x, y, type, collected: false, bob: Math.random() * Math.PI * 2 });
}

function spawnParticles(x: number, y: number, color: string, count: number = 6) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 500,
      maxLife: 500,
      color,
      size: 2 + Math.random() * 3
    });
  }
}

function randomCard(): CardData {
  return CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
}

function applyPowerup(p: Player, item: PowerUpItem) {
  switch (item.type) {
    case PowerUpType.SpeedBoost:
      p.speedBoost = 3000;
      p.pickupFlash = { x: p.x, y: p.y, life: 300, color: '#4FC3F7' };
      break;
    case PowerUpType.Shield:
      p.shield = true;
      p.pickupFlash = { x: p.x, y: p.y, life: 300, color: '#FFEB3B' };
      break;
    case PowerUpType.DamageUp:
      p.damageUp = 4000;
      p.pickupFlash = { x: p.x, y: p.y, life: 300, color: '#FF5252' };
      break;
    case PowerUpType.SkillCard:
      if (p.addCard(randomCard())) {
        p.pickupFlash = { x: p.x, y: p.y, life: 300, color: '#B388FF' };
      }
      break;
  }
  spawnParticles(item.x, item.y, powerupColor(item.type), 10);
}

function powerupColor(t: PowerUpType): string {
  switch (t) {
    case PowerUpType.SpeedBoost: return '#4FC3F7';
    case PowerUpType.Shield: return '#FFEB3B';
    case PowerUpType.DamageUp: return '#FF5252';
    case PowerUpType.SkillCard: return '#B388FF';
  }
}

function playerAttack(attacker: Player, defender: Player) {
  const now = performance.now();
  if (now - attacker.lastAttack < attacker.attackCooldown) return;
  attacker.lastAttack = now;
  attacker.attackAnim = 200;

  const attackX = attacker.x + attacker.facing * 40;
  const attackY = attacker.y;
  const dx = defender.x - attackX;
  const dy = defender.y - attackY;
  const dist = Math.hypot(dx, dy);
  if (dist < 55) {
    const damaged = defender.takeDamage(attacker.attackDamage);
    const color = attacker.damageUp > 0 ? '#FF3030' : '#FFFFFF';
    spawnParticles(defender.x, defender.y, color, 6);
    if (damaged) {
      const kdx = defender.x - attacker.x;
      const kdy = defender.y - attacker.y;
      defender.applyKnockback(kdx, kdy, 4, 220);
    } else {
      spawnParticles(defender.x, defender.y, '#FFEB3B', 12);
    }
  }
}

function useSkillCard(p: Player, opponent: Player) {
  const card = p.useCard();
  if (!card) return;

  switch (card.type) {
    case SkillType.FireBlast: {
      const angle = p.facing === 1 ? 0 : Math.PI;
      fireEffects.push({ x: p.x, y: p.y, angle, life: 400, ownerId: p.id });
      for (let i = 0; i < 18; i++) {
        const a = angle + (Math.random() - 0.5) * Math.PI / 3;
        const s = 2 + Math.random() * 4;
        particles.push({
          x: p.x, y: p.y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 450, maxLife: 450,
          color: Math.random() > 0.5 ? '#FF6D00' : '#FFAB00',
          size: 3 + Math.random() * 3
        });
      }
      const hit = pointInSector(p.x, p.y, 160, angle, Math.PI / 3, opponent.x, opponent.y);
      if (hit) {
        const damaged = opponent.takeDamage(12);
        if (damaged) {
          const kdx = opponent.x - p.x;
          const kdy = opponent.y - p.y;
          opponent.applyKnockback(kdx, kdy, 9, 450);
        }
        spawnParticles(opponent.x, opponent.y, '#FF6D00', 10);
      }
      break;
    }
    case SkillType.FrostTrap: {
      frostZones.push({
        x: p.x + p.facing * 50,
        y: p.y,
        radius: 55,
        duration: 5000,
        ownerId: p.id
      });
      break;
    }
    case SkillType.HealWave: {
      p.heal(15);
      healEffects.push({ x: p.x, y: p.y, life: 600 });
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        particles.push({
          x: p.x, y: p.y,
          vx: Math.cos(a) * 1.5,
          vy: Math.sin(a) * 1.5 - 1,
          life: 700, maxLife: 700,
          color: '#69F0AE',
          size: 3
        });
      }
      break;
    }
  }
}

function handleInput(dt: number) {
  if (!gameRunning) return;

  let p1vx = 0, p1vy = 0;
  if (keys['w'] || keys['W']) p1vy -= 1;
  if (keys['s'] || keys['S']) p1vy += 1;
  if (keys['a'] || keys['A']) { p1vx -= 1; player1.facing = -1; }
  if (keys['d'] || keys['D']) { p1vx += 1; player1.facing = 1; }
  if (p1vx !== 0 || p1vy !== 0) {
    const len = Math.hypot(p1vx, p1vy);
    player1.vx = (p1vx / len) * player1.currentSpeed;
    player1.vy = (p1vy / len) * player1.currentSpeed;
  } else {
    player1.vx *= 0.7;
    player1.vy *= 0.7;
  }

  let p2vx = 0, p2vy = 0;
  if (keys['ArrowUp']) p2vy -= 1;
  if (keys['ArrowDown']) p2vy += 1;
  if (keys['ArrowLeft']) { p2vx -= 1; player2.facing = -1; }
  if (keys['ArrowRight']) { p2vx += 1; player2.facing = 1; }
  if (p2vx !== 0 || p2vy !== 0) {
    const len = Math.hypot(p2vx, p2vy);
    player2.vx = (p2vx / len) * player2.currentSpeed;
    player2.vy = (p2vy / len) * player2.currentSpeed;
  } else {
    player2.vx *= 0.7;
    player2.vy *= 0.7;
  }
}

function update(dt: number) {
  if (!gameRunning) return;

  player1.update(dt);
  player2.update(dt);

  if (player1.isKnockback) {
    player1.x += player1.knockbackVx;
    player1.y += player1.knockbackVy;
    player1.knockbackVx *= 0.92;
    player1.knockbackVy *= 0.92;
  } else {
    player1.x += player1.vx;
    player1.y += player1.vy;
  }

  if (player2.isKnockback) {
    player2.x += player2.knockbackVx;
    player2.y += player2.knockbackVy;
    player2.knockbackVx *= 0.92;
    player2.knockbackVy *= 0.92;
  } else {
    player2.x += player2.vx;
    player2.y += player2.vy;
  }

  resolvePlayerObstacle(player1, obstacles);
  resolvePlayerObstacle(player2, obstacles);
  resolvePlayerPlayer(player1, player2);
  clampToBounds(player1, CANVAS_W, CANVAS_H);
  clampToBounds(player2, CANVAS_W, CANVAS_H);

  for (const o of obstacles) {
    if (o.shakeTime > 0) o.shakeTime -= dt;
  }

  for (const item of powerups) {
    if (!item.collected) {
      item.bob += dt * 0.005;
      if (checkPowerUpPickup(player1, item)) {
        item.collected = true;
        applyPowerup(player1, item);
      } else if (checkPowerUpPickup(player2, item)) {
        item.collected = true;
        applyPowerup(player2, item);
      }
    }
  }
  powerups = powerups.filter(i => !i.collected);

  powerupTimer += dt;
  if (powerupTimer >= POWERUP_SPAWN_INTERVAL) {
    powerupTimer = 0;
    spawnPowerup();
  }

  for (let i = frostZones.length - 1; i >= 0; i--) {
    const z = frostZones[i];
    z.duration -= dt;
    if (z.duration <= 0) {
      frostZones.splice(i, 1);
      continue;
    }
    for (const p of [player1, player2]) {
      if (p.id === z.ownerId) continue;
      if (circleIntersect(p.x, p.y, 16, z.x, z.y, z.radius)) {
        p.frostSlow = Math.max(p.frostSlow, 600);
      }
    }
  }

  frostDamageTimer += dt;
  if (frostDamageTimer >= 1000) {
    frostDamageTimer = 0;
    for (const z of frostZones) {
      for (const p of [player1, player2]) {
        if (p.id === z.ownerId) continue;
        if (circleIntersect(p.x, p.y, 16, z.x, z.y, z.radius)) {
          p.takeDamage(2);
        }
      }
    }
  }

  for (let i = fireEffects.length - 1; i >= 0; i--) {
    fireEffects[i].life -= dt;
    if (fireEffects[i].life <= 0) fireEffects.splice(i, 1);
  }

  for (let i = healEffects.length - 1; i >= 0; i--) {
    healEffects[i].life -= dt;
    if (healEffects[i].life <= 0) healEffects.splice(i, 1);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vy += 0.08;
    pt.life -= dt;
    if (pt.life <= 0) particles.splice(i, 1);
  }

  if (isOutOfBounds(player1, CANVAS_W, CANVAS_H) || player1.hp <= 0) {
    endGame(2);
  } else if (isOutOfBounds(player2, CANVAS_W, CANVAS_H) || player2.hp <= 0) {
    endGame(1);
  }
}

function drawBackground() {
  const grd = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grd.addColorStop(0, '#0F0C29');
  grd.addColorStop(0.5, '#302B63');
  grd.addColorStop(1, '#24243E');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#111022';
  const buildings = [
    { x: 0, w: 80, h: 110 },
    { x: 70, w: 60, h: 140 },
    { x: 120, w: 90, h: 90 },
    { x: 200, w: 70, h: 160 },
    { x: 260, w: 50, h: 100 },
    { x: 310, w: 100, h: 180 },
    { x: 400, w: 60, h: 120 },
    { x: 450, w: 80, h: 150 },
    { x: 520, w: 70, h: 95 },
    { x: 580, w: 90, h: 170 },
    { x: 660, w: 60, h: 110 },
    { x: 710, w: 80, h: 140 },
    { x: 780, w: 120, h: 100 }
  ];
  for (const b of buildings) {
    ctx.fillRect(b.x, CANVAS_H - b.h, b.w, b.h);
    ctx.fillStyle = '#3A3570';
    for (let wy = CANVAS_H - b.h + 12; wy < CANVAS_H - 10; wy += 18) {
      for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 14) {
        if (Math.random() > 0.35) ctx.fillRect(wx, wy, 6, 8);
      }
    }
    ctx.fillStyle = '#111022';
  }

  ctx.strokeStyle = 'rgba(120, 100, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= CANVAS_W; gx += 60) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, CANVAS_H);
    ctx.stroke();
  }
  for (let gy = 0; gy <= CANVAS_H; gy += 60) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(CANVAS_W, gy);
    ctx.stroke();
  }
}

function drawObstacles() {
  for (const o of obstacles) {
    ctx.save();
    let sx = 0, sy = 0;
    if (o.shakeTime > 0) {
      sx = (Math.random() - 0.5) * 4;
      sy = (Math.random() - 0.5) * 4;
    }
    ctx.translate(sx, sy);
    ctx.fillStyle = '#444444';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(o.x, o.y, o.w, 4);
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(o.x, o.y + o.h - 4, o.w, 4);
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
    ctx.restore();
  }
}

function drawPowerup(item: PowerUpItem) {
  const bobY = Math.sin(item.bob) * 4;
  ctx.save();
  ctx.translate(item.x, item.y + bobY);

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = powerupColor(item.type);
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  switch (item.type) {
    case PowerUpType.SpeedBoost:
      ctx.fillStyle = '#4FC3F7';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 10);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    case PowerUpType.Shield:
      ctx.fillStyle = 'rgba(255, 235, 59, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFEB3B';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    case PowerUpType.DamageUp:
      ctx.fillStyle = '#FF5252';
      ctx.beginPath();
      ctx.moveTo(-2, -14);
      ctx.lineTo(6, -2);
      ctx.lineTo(0, 0);
      ctx.lineTo(4, 14);
      ctx.lineTo(-6, 2);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    case PowerUpType.SkillCard:
      ctx.fillStyle = '#B388FF';
      ctx.fillRect(-10, -12, 20, 24);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-7, -9, 14, 18);
      ctx.fillStyle = '#B388FF';
      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 0);
      ctx.strokeStyle = '#6A1B9A';
      ctx.lineWidth = 1;
      ctx.strokeRect(-10, -12, 20, 24);
      break;
  }
  ctx.restore();
}

function drawFrostZones() {
  for (const z of frostZones) {
    ctx.save();
    const alpha = Math.min(1, z.duration / 1000);
    ctx.globalAlpha = 0.35 * alpha;
    const grd = ctx.createRadialGradient(z.x, z.y, 5, z.x, z.y, z.radius);
    grd.addColorStop(0, '#80DEEA');
    grd.addColorStop(1, 'rgba(128, 222, 234, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7 * alpha;
    ctx.strokeStyle = '#4DD0E1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + z.duration * 0.002;
      const r = z.radius * 0.65;
      const sx = z.x + Math.cos(a) * r;
      const sy = z.y + Math.sin(a) * r;
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }
    ctx.restore();
  }
}

function drawFireEffects() {
  for (const f of fireEffects) {
    ctx.save();
    const t = f.life / 400;
    ctx.globalAlpha = t;
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 160);
    grd.addColorStop(0, 'rgba(255, 171, 0, 0.9)');
    grd.addColorStop(0.5, 'rgba(255, 109, 0, 0.5)');
    grd.addColorStop(1, 'rgba(255, 109, 0, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 160, -Math.PI / 6, Math.PI / 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawHealEffects() {
  for (const h of healEffects) {
    ctx.save();
    const t = h.life / 600;
    ctx.globalAlpha = t;
    ctx.strokeStyle = '#69F0AE';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 60 * (1 - t) + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.restore();
  }
}

function drawSkillBar() {
  const drawPlayerCards = (p: Player, rightAlign: boolean) => {
    const baseX = rightAlign ? CANVAS_W - 16 : 16;
    const dir = rightAlign ? -1 : 1;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    const totalW = 56 * 2 + 12;
    const boxX = rightAlign ? baseX - totalW : baseX;
    ctx.fillRect(boxX, 12, totalW, 72);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 0.5, 12.5, totalW - 1, 71);
    ctx.fillStyle = '#EEEEEE';
    ctx.font = '11px Courier New';
    ctx.textAlign = rightAlign ? 'right' : 'left';
    ctx.fillText(`[P${p.id}] 技能`, rightAlign ? baseX - 4 : baseX + 4, 28);
    for (let i = 0; i < p.maxCards; i++) {
      const cx = rightAlign ? baseX - 8 - i * 56 : baseX + 8 + i * 56;
      const card = p.cards[i];
      ctx.strokeStyle = '#AAAAAA';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 0.5, 36.5, 44, 44);
      if (card) drawCardIcon(cx, 36, card, rightAlign);
      else {
        ctx.fillStyle = '#333333';
        ctx.fillRect(cx + 1, 37, 42, 42);
      }
    }
    ctx.restore();
  };
  drawPlayerCards(player1, false);
  drawPlayerCards(player2, true);
}

function drawCardIcon(x: number, y: number, card: CardData, rightAlign: boolean) {
  ctx.save();
  let bg = '#B388FF';
  let fg = '#FFFFFF';
  if (card.type === SkillType.FireBlast) bg = '#FF6D00';
  if (card.type === SkillType.FrostTrap) bg = '#00BCD4';
  if (card.type === SkillType.HealWave) bg = '#00C853';
  ctx.fillStyle = bg;
  ctx.fillRect(x + 1, y + 1, 42, 42);
  ctx.fillStyle = fg;
  ctx.font = 'bold 18px Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let sym = '?';
  if (card.type === SkillType.FireBlast) sym = '火';
  if (card.type === SkillType.FrostTrap) sym = '冰';
  if (card.type === SkillType.HealWave) sym = '治';
  ctx.fillText(sym, x + 22, y + 22);
  ctx.font = '8px Courier New';
  ctx.textAlign = rightAlign ? 'right' : 'left';
  ctx.fillText(card.name, x + (rightAlign ? 42 : 2), y + 62);
  ctx.restore();
}

function render() {
  drawBackground();
  drawFrostZones();
  drawObstacles();
  for (const item of powerups) drawPowerup(item);
  drawFireEffects();
  drawHealEffects();
  player1.draw(ctx);
  player2.draw(ctx);
  drawParticles();
  drawSkillBar();
}

function gameLoop(timestamp: number) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min(33, timestamp - lastTime);
  lastTime = timestamp;

  handleInput(dt);
  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

function startGame() {
  initPlayers();
  initObstacles();
  powerups = [];
  particles = [];
  frostZones = [];
  fireEffects = [];
  healEffects = [];
  powerupTimer = 0;
  frostDamageTimer = 0;
  gameRunning = true;
  overlay.classList.add('hidden');
  resultText.style.display = 'none';
  gameTitle.style.display = 'block';
  setTimeout(() => spawnPowerup(), 1500);
}

function endGame(winner: number) {
  gameRunning = false;
  resultText.style.display = 'block';
  resultText.textContent = `玩家 ${winner} 获胜！`;
  gameTitle.style.display = 'none';
  startBtn.textContent = '再来一局';
  setTimeout(() => overlay.classList.remove('hidden'), 600);
}

function setupInput() {
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.code)) {
      e.preventDefault();
    }
    if (!gameRunning) return;
    if (e.code === 'Space') playerAttack(player1, player2);
    if (e.code === 'Enter') playerAttack(player2, player1);
    if (e.key === 'e' || e.key === 'E') useSkillCard(player1, player2);
    if (e.key === '1') useSkillCard(player2, player1);
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });
}

startBtn.addEventListener('click', startGame);
setupInput();
requestAnimationFrame(gameLoop);
