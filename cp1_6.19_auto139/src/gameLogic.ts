export type ElementType = 'fire' | 'ice' | 'lightning' | 'shield' | 'heal';

export interface Mage {
  id: 'left' | 'right';
  name: string;
  color: string;
  element: ElementType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  shieldActive: boolean;
  shieldEndTime: number;
  state: 'idle' | 'charging' | 'defending' | 'healing';
  lastSpell: ElementType | null;
  spellCooldowns: Record<ElementType, number>;
  castCount: Record<ElementType, number>;
  totalCasts: number;
}

export interface Spell {
  type: ElementType;
  name: string;
  cooldown: number;
  damage: number;
  baseColor: string;
  isProjectile: boolean;
  isMelee: boolean;
  healAmount?: number;
  shieldDuration?: number;
}

export interface Projectile {
  id: number;
  type: ElementType;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  totalDistance: number;
  speed: number;
  color: string;
  ownerId: 'left' | 'right';
  damage: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'trail' | 'explosion';
}

export interface BattleLog {
  timestamp: number;
  message: string;
  type: 'cast' | 'hit' | 'heal' | 'shield' | 'death' | 'system';
}

export interface GameState {
  mages: [Mage, Mage];
  projectiles: Projectile[];
  particles: Particle[];
  logs: BattleLog[];
  isPaused: boolean;
  speedMultiplier: 1 | 2 | 3;
  gameTime: number;
  lastDecisionTime: Record<'left' | 'right', number>;
  winner: 'left' | 'right' | null;
  hitFlash: { side: 'left' | 'right' | null; startTime: number };
  nextId: number;
}

export const ARENA_WIDTH = 600;
export const ARENA_HEIGHT = 400;
export const MAGE_RADIUS = 20;
export const PROJECTILE_RADIUS = 6;
export const PROJECTILE_SPEED = 200;
export const ARC_HEIGHT = 80;
export const EXPLOSION_RADIUS = 30;
export const MAX_PARTICLES = 200;
export const AI_DECISION_INTERVAL = 2;
export const MELEE_DISTANCE = 150;
export const HIT_FLASH_DURATION = 0.3;

export const SPELLS: Record<ElementType, Spell> = {
  fire: {
    type: 'fire',
    name: '火球术',
    cooldown: 2,
    damage: 15,
    baseColor: '#E74C3C',
    isProjectile: true,
    isMelee: false,
  },
  ice: {
    type: 'ice',
    name: '冰霜弹',
    cooldown: 2.5,
    damage: 12,
    baseColor: '#3498DB',
    isProjectile: true,
    isMelee: false,
  },
  lightning: {
    type: 'lightning',
    name: '闪电链',
    cooldown: 4,
    damage: 20,
    baseColor: '#F1C40F',
    isProjectile: true,
    isMelee: true,
  },
  shield: {
    type: 'shield',
    name: '护盾',
    cooldown: 5,
    damage: 0,
    baseColor: '#9B59B6',
    isProjectile: false,
    isMelee: false,
    shieldDuration: 3,
  },
  heal: {
    type: 'heal',
    name: '治疗波',
    cooldown: 5,
    damage: 0,
    baseColor: '#2ECC71',
    isProjectile: false,
    isMelee: false,
    healAmount: 20,
  },
};

export function getElementMultiplier(attackType: ElementType, defenderElement: ElementType, defenderHasShield: boolean): number {
  if (attackType === 'fire' && defenderElement === 'ice') return 1.5;
  if (attackType === 'ice' && defenderElement === 'fire') return 1.5;
  if (attackType === 'lightning' && defenderHasShield) return 2.0;
  if ((attackType === 'fire' || attackType === 'ice') && defenderHasShield) return 0.8;
  return 1.0;
}

export function createInitialMage(id: 'left' | 'right'): Mage {
  const isLeft = id === 'left';
  return {
    id,
    name: isLeft ? '炎法师' : '水法师',
    color: isLeft ? '#8E44AD' : '#2980B9',
    element: isLeft ? 'fire' : 'ice',
    x: isLeft ? 80 : ARENA_WIDTH - 80,
    y: ARENA_HEIGHT / 2,
    hp: 100,
    maxHp: 100,
    shieldActive: false,
    shieldEndTime: 0,
    state: 'idle',
    lastSpell: null,
    spellCooldowns: { fire: 0, ice: 0, lightning: 0, shield: 0, heal: 0 },
    castCount: { fire: 0, ice: 0, lightning: 0, shield: 0, heal: 0 },
    totalCasts: 0,
  };
}

export function createInitialState(): GameState {
  return {
    mages: [createInitialMage('left'), createInitialMage('right')],
    projectiles: [],
    particles: [],
    logs: [{ timestamp: 0, message: '⚔️ 战斗开始！', type: 'system' }],
    isPaused: false,
    speedMultiplier: 1,
    gameTime: 0,
    lastDecisionTime: { left: 0, right: 0 },
    winner: null,
    hitFlash: { side: null, startTime: 0 },
    nextId: 1,
  };
}

export function getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function addLog(state: GameState, message: string, type: BattleLog['type']): void {
  state.logs.push({ timestamp: state.gameTime, message, type });
  if (state.logs.length > 50) state.logs.shift();
}

function addParticle(state: GameState, particle: Omit<Particle, 'id'>): void {
  if (state.particles.length >= MAX_PARTICLES) {
    state.particles.shift();
  }
  state.particles.push({ ...particle, id: state.nextId++ });
}

function createExplosion(state: GameState, x: number, y: number, color: string): void {
  const count = 24;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = 40 + Math.random() * 80;
    addParticle(state, {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5,
      maxLife: 0.5,
      size: 3 + Math.random() * 3,
      color,
      type: 'explosion',
    });
  }
}

function createTrailParticle(state: GameState, x: number, y: number, color: string): void {
  addParticle(state, {
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    vx: (Math.random() - 0.5) * 10,
    vy: (Math.random() - 0.5) * 10,
    life: 0.25,
    maxLife: 0.25,
    size: 2,
    color,
    type: 'trail',
  });
}

export function castSpell(state: GameState, casterId: 'left' | 'right', spellType: ElementType): void {
  const casterIndex = casterId === 'left' ? 0 : 1;
  const targetIndex = casterIndex === 0 ? 1 : 0;
  const caster = state.mages[casterIndex];
  const target = state.mages[targetIndex];
  const spell = SPELLS[spellType];

  if (caster.spellCooldowns[spellType] > 0) return;
  if (state.winner) return;

  caster.spellCooldowns[spellType] = spell.cooldown;
  caster.lastSpell = spellType;
  caster.castCount[spellType]++;
  caster.totalCasts++;

  addLog(state, `${caster.name} 释放了 ${spell.name}`, 'cast');

  if (spellType === 'heal') {
    const healAmount = spell.healAmount || 20;
    caster.hp = Math.min(caster.maxHp, caster.hp + healAmount);
    caster.state = 'healing';
    addLog(state, `${caster.name} 恢复了 ${healAmount} 点生命值`, 'heal');
    createExplosion(state, caster.x, caster.y, spell.baseColor);
    setTimeout(() => { if (caster.state === 'healing') caster.state = 'idle'; }, 300);
    return;
  }

  if (spellType === 'shield') {
    caster.shieldActive = true;
    caster.shieldEndTime = state.gameTime + (spell.shieldDuration || 3);
    caster.state = 'defending';
    addLog(state, `${caster.name} 激活了护盾！`, 'shield');
    createExplosion(state, caster.x, caster.y, spell.baseColor);
    setTimeout(() => { if (caster.state === 'defending') caster.state = 'idle'; }, 300);
    return;
  }

  if (spell.isProjectile) {
    caster.state = 'charging';
    const startX = caster.x;
    const startY = caster.y;
    const targetX = target.x + (Math.random() - 0.5) * 30;
    const targetY = target.y + (Math.random() - 0.5) * 30;
    const totalDistance = getDistance({ x: startX, y: startY }, { x: targetX, y: targetY });
    state.projectiles.push({
      id: state.nextId++,
      type: spellType,
      x: startX,
      y: startY,
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      totalDistance,
      speed: PROJECTILE_SPEED,
      color: spell.baseColor,
      ownerId: casterId,
      damage: spell.damage,
    });
    setTimeout(() => { if (caster.state === 'charging') caster.state = 'idle'; }, 250);
  }
}

function applyDamage(state: GameState, targetId: 'left' | 'right', damage: number, attackType: ElementType, attackerElement: ElementType): void {
  const targetIndex = targetId === 'left' ? 0 : 1;
  const target = state.mages[targetIndex];
  let multiplier = getElementMultiplier(attackType, target.element, target.shieldActive);
  let finalDamage = damage * multiplier;
  if (target.shieldActive) {
    finalDamage *= 0.5;
  }
  finalDamage = Math.round(finalDamage);
  target.hp = Math.max(0, target.hp - finalDamage);
  const multiplierText = multiplier > 1 ? '克制！' : multiplier < 1 ? '减伤' : '';
  addLog(state, `${target.name} 受到 ${finalDamage} 点${SPELLS[attackType].name}伤害${multiplierText ? '（' + multiplierText + '）' : ''}`, 'hit');
  state.hitFlash = { side: targetId, startTime: state.gameTime };
  createExplosion(state, target.x, target.y, SPELLS[attackType].baseColor);
  if (target.hp <= 0 && !state.winner) {
    state.winner = targetId === 'left' ? 'right' : 'left';
    const winner = state.mages[state.winner === 'left' ? 0 : 1];
    addLog(state, `💀 ${target.name} 被击败！${winner.name} 获得胜利！`, 'death');
  }
}

export function aiDecision(state: GameState, mageId: 'left' | 'right'): void {
  const mageIndex = mageId === 'left' ? 0 : 1;
  const enemyIndex = mageIndex === 0 ? 1 : 0;
  const mage = state.mages[mageIndex];
  const enemy = state.mages[enemyIndex];
  const distance = getDistance(mage, enemy);

  const available: ElementType[] = (['fire', 'ice', 'lightning', 'shield', 'heal'] as ElementType[])
    .filter(t => mage.spellCooldowns[t] <= 0);

  if (available.length === 0) {
    mage.state = 'idle';
    return;
  }

  if (mage.hp < 30 && available.includes('heal')) {
    castSpell(state, mageId, 'heal');
    return;
  }

  if (mage.hp < 50 && available.includes('shield') && !mage.shieldActive) {
    castSpell(state, mageId, 'shield');
    return;
  }

  let candidates = available.filter(t => t !== mage.lastSpell);
  if (candidates.length === 0) candidates = available;

  let chosen: ElementType;
  if (distance < MELEE_DISTANCE && candidates.includes('lightning')) {
    chosen = 'lightning';
  } else {
    const ranged = candidates.filter(t => SPELLS[t].isProjectile);
    if (ranged.length > 0) {
      const countered = ranged.find(t => {
        if (t === 'fire' && enemy.element === 'ice') return true;
        if (t === 'ice' && enemy.element === 'fire') return true;
        if (t === 'lightning' && enemy.shieldActive) return true;
        return false;
      });
      chosen = countered || ranged[Math.floor(Math.random() * ranged.length)];
    } else {
      chosen = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  castSpell(state, mageId, chosen);
}

export function updateGame(state: GameState, rawDelta: number): void {
  if (state.isPaused || state.winner) return;
  const dt = rawDelta * state.speedMultiplier;
  state.gameTime += dt;

  for (const mage of state.mages) {
    for (const t of Object.keys(mage.spellCooldowns) as ElementType[]) {
      mage.spellCooldowns[t] = Math.max(0, mage.spellCooldowns[t] - dt);
    }
    if (mage.shieldActive && state.gameTime >= mage.shieldEndTime) {
      mage.shieldActive = false;
    }
  }

  for (const side of ['left', 'right'] as const) {
    if (state.gameTime - state.lastDecisionTime[side] >= AI_DECISION_INTERVAL) {
      state.lastDecisionTime[side] = state.gameTime;
      aiDecision(state, side);
    }
  }

  const remainingProjectiles: Projectile[] = [];
  for (const p of state.projectiles) {
    const progressStep = (p.speed * dt) / Math.max(p.totalDistance, 1);
    p.progress += progressStep;
    const t = Math.min(p.progress, 1);
    const height = -4 * ARC_HEIGHT * t * (t - 1);
    p.x = p.startX + (p.targetX - p.startX) * t;
    p.y = p.startY + (p.targetY - p.startY) * t - height;

    if (Math.random() < 0.6) {
      createTrailParticle(state, p.x, p.y, p.color);
    }

    const targetIndex = p.ownerId === 'left' ? 1 : 0;
    const target = state.mages[targetIndex];
    const dist = getDistance(p, target);
    const hitRadius = MAGE_RADIUS + PROJECTILE_RADIUS;

    if (dist <= hitRadius) {
      const ownerIndex = p.ownerId === 'left' ? 0 : 1;
      const owner = state.mages[ownerIndex];
      applyDamage(state, target.id, p.damage, p.type, owner.element);
      continue;
    }

    if (p.progress >= 1) {
      createExplosion(state, p.x, p.y, p.color);
      continue;
    }

    if (p.x < -50 || p.x > ARENA_WIDTH + 50 || p.y < -50 || p.y > ARENA_HEIGHT + 50) {
      continue;
    }

    remainingProjectiles.push(p);
  }
  state.projectiles = remainingProjectiles;

  const remainingParticles: Particle[] = [];
  for (const particle of state.particles) {
    particle.life -= dt;
    if (particle.life <= 0) continue;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    if (particle.type === 'explosion') {
      particle.vx *= 0.92;
      particle.vy *= 0.92;
    }
    remainingParticles.push(particle);
  }
  state.particles = remainingParticles;

  if (state.hitFlash.side && state.gameTime - state.hitFlash.startTime >= HIT_FLASH_DURATION) {
    state.hitFlash.side = null;
  }
}

export function renderArena(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  ctx.fillStyle = '#2D2D44';
  roundRect(ctx, 0, 0, ARENA_WIDTH, ARENA_HEIGHT, 12);
  ctx.fill();

  ctx.strokeStyle = '#8E44AD';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#8E44AD';
  ctx.shadowBlur = 15;
  roundRect(ctx, 1, 1, ARENA_WIDTH - 2, ARENA_HEIGHT - 2, 12);
  ctx.stroke();
  ctx.shadowBlur = 0;

  for (const particle of state.particles) {
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const mage of state.mages) {
    if (mage.shieldActive) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(155, 89, 182, 0.7)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#9B59B6';
      ctx.shadowBlur = 15;
      ctx.arc(mage.x, mage.y, MAGE_RADIUS + 8 + Math.sin(state.gameTime * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = mage.color;
    ctx.shadowColor = mage.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(mage.x, mage.y, MAGE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mage.id === 'left' ? '火' : '水', mage.x, mage.y);

    const barWidth = 40;
    const barHeight = 5;
    const barX = mage.x - barWidth / 2;
    const barY = mage.y - MAGE_RADIUS - 14;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const hpRatio = Math.max(0, mage.hp / mage.maxHp);
    const hpColor = hpRatio > 0.5 ? '#2ECC71' : hpRatio > 0.25 ? '#F1C40F' : '#E74C3C';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  for (const p of state.projectiles) {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PROJECTILE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(p.x - 2, p.y - 2, PROJECTILE_RADIUS * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function resetGame(state: GameState): void {
  const fresh = createInitialState();
  Object.assign(state, fresh);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
