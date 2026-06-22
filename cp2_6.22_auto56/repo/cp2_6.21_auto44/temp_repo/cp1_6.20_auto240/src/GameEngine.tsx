import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as PIXI from 'pixi.js';
import { useRafLoop } from 'react-use';
import type { UnitData, Faction, UnitType } from './Unit';
import {
  createUnit,
  UNIT_COLORS,
  getHpColorNum,
  resetUnitIdCounter
} from './Unit';
import {
  findNearestEnemy,
  isInRange,
  performAttack,
  moveTowards,
  clampToArena,
  updateKnockback,
  canAttack,
  computeStats
} from './BattleLogic';

export interface GameEngineHandle {
  start: () => void;
  pause: () => void;
  reset: () => void;
  placeUnit: (faction: Faction, type: UnitType, arenaX: number, arenaY: number) => boolean;
  getUnits: () => UnitData[];
  getStats: () => { blueAlive: number; redAlive: number; totalKills: number; battleDuration: number; winner: Faction | null };
}

interface GameEngineProps {
  onStatsUpdate?: (stats: {
    blueAlive: number;
    redAlive: number;
    totalKills: number;
    battleDuration: number;
    winner: Faction | null;
  }) => void;
  onUnitClick?: (unit: UnitData | null) => void;
  selectedUnitId?: string | null;
  phase: 'placing' | 'fighting' | 'paused' | 'ended';
}

interface Projectile {
  id: number;
  sprite: PIXI.Graphics;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  x: number;
  y: number;
  speed: number;
  type: 'arrow' | 'fireball';
  attackerId: string;
  targetId: string;
  damage: number;
  splashRadius: number;
  alive: boolean;
  trail: PIXI.Graphics[];
}

interface Particle {
  sprite: PIXI.Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

interface SplashRing {
  sprite: PIXI.Graphics;
  startTime: number;
  duration: number;
  radius: number;
}

const UNIT_RADIUS = 12;
const INTERPOLATION_TIME = 0.15;
const LOGIC_DT = 0.02;
const MAX_UNITS_PER_FACTION = 25;

const GameEngine = forwardRef<GameEngineHandle, GameEngineProps>((props, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const unitsRef = useRef<UnitData[]>([]);
  const unitSpritesRef = useRef<Map<string, {
    container: PIXI.Container;
    circle: PIXI.Graphics;
    ring: PIXI.Graphics;
    hpBar: PIXI.Graphics;
    hpBarBg: PIXI.Graphics;
    damageTexts: PIXI.Text[];
    spawnProgress: number;
  }>>(new Map());
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const splashRingsRef = useRef<SplashRing[]>([]);
  const projectileIdRef = useRef(0);
  const phaseRef = useRef<'placing' | 'fighting' | 'paused' | 'ended'>('placing');
  const battleStartTimeRef = useRef(0);
  const battleDurationRef = useRef(0);
  const winnerRef = useRef<Faction | null>(null);
  const logicAccumulatorRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const arenaRadiusRef = useRef(200);

  const particlePoolRef = useRef<Particle[]>([]);
  const projectilePoolRef = useRef<Projectile[]>([]);

  useEffect(() => {
    phaseRef.current = props.phase;
  }, [props.phase]);

  useImperativeHandle(ref, () => ({
    start: () => {
      if (unitsRef.current.filter(u => u.hp > 0 && u.faction === 'blue').length === 0) return;
      if (unitsRef.current.filter(u => u.hp > 0 && u.faction === 'red').length === 0) return;
      phaseRef.current = 'fighting';
      battleStartTimeRef.current = performance.now();
      battleDurationRef.current = 0;
      winnerRef.current = null;
    },
    pause: () => {
      if (phaseRef.current === 'fighting') {
        phaseRef.current = 'paused';
      } else if (phaseRef.current === 'paused') {
        phaseRef.current = 'fighting';
      }
    },
    reset: () => {
      phaseRef.current = 'placing';
      battleDurationRef.current = 0;
      winnerRef.current = null;
      resetUnitIdCounter();

      for (const u of unitsRef.current) {
        const spriteEntry = unitSpritesRef.current.get(u.id);
        if (spriteEntry && appRef.current) {
          appRef.current.stage.removeChild(spriteEntry.container);
        }
      }
      unitSpritesRef.current.clear();

      for (const p of projectilesRef.current) {
        if (appRef.current) {
          appRef.current.stage.removeChild(p.sprite);
          for (const t of p.trail) appRef.current.stage.removeChild(t);
        }
      }
      projectilesRef.current = [];

      for (const pt of particlesRef.current) {
        if (appRef.current) appRef.current.stage.removeChild(pt.sprite);
      }
      particlesRef.current = [];

      for (const s of splashRingsRef.current) {
        if (appRef.current) appRef.current.stage.removeChild(s.sprite);
      }
      splashRingsRef.current = [];

      unitsRef.current = [];
      emitStats();
    },
    placeUnit: (faction: Faction, type: UnitType, arenaX: number, arenaY: number) => {
      const count = unitsRef.current.filter(u => u.faction === faction).length;
      if (count >= MAX_UNITS_PER_FACTION) return false;
      if (phaseRef.current !== 'placing') return false;

      const r = Math.sqrt(arenaX * arenaX + arenaY * arenaY);
      if (r > arenaRadiusRef.current - 25) return false;

      const unit = createUnit(faction, type, arenaX, arenaY);
      unitsRef.current.push(unit);
      createUnitSprite(unit);
      emitStats();
      return true;
    },
    getUnits: () => unitsRef.current,
    getStats: () => {
      const stats = computeStats(unitsRef.current);
      return {
        ...stats,
        battleDuration: battleDurationRef.current,
        winner: winnerRef.current
      };
    }
  }));

  function emitStats() {
    if (props.onStatsUpdate) {
      const stats = computeStats(unitsRef.current);
      props.onStatsUpdate({
        ...stats,
        battleDuration: battleDurationRef.current,
        winner: winnerRef.current
      });
    }
  }

  function createUnitSprite(unit: UnitData) {
    if (!appRef.current) return;
    const container = new PIXI.Container();

    const ring = new PIXI.Graphics();
    ring.lineStyle(2, unit.faction === 'blue' ? 0x42a5f5 : 0xef5350, 0.8);
    ring.drawCircle(0, 0, UNIT_RADIUS + 2);
    ring.alpha = 0.6;
    container.addChild(ring);

    const circle = new PIXI.Graphics();
    circle.beginFill(UNIT_COLORS[unit.type]);
    circle.drawCircle(0, 0, UNIT_RADIUS);
    circle.endFill();
    container.addChild(circle);

    const hpBarBg = new PIXI.Graphics();
    hpBarBg.beginFill(0x000000, 0.6);
    hpBarBg.drawRect(-UNIT_RADIUS, -UNIT_RADIUS - 9, UNIT_RADIUS * 2, 4);
    hpBarBg.endFill();
    container.addChild(hpBarBg);

    const hpBar = new PIXI.Graphics();
    hpBar.beginFill(getHpColorNum(unit.hp, unit.stats.maxHp));
    hpBar.drawRect(-UNIT_RADIUS, -UNIT_RADIUS - 9, UNIT_RADIUS * 2, 4);
    hpBar.endFill();
    container.addChild(hpBar);

    container.x = toScreenX(unit.x);
    container.y = toScreenY(unit.y);
    container.scale.set(0);
    container.interactive = true;
    container.cursor = 'pointer';
    container.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      e.stopPropagation();
      if (props.onUnitClick) props.onUnitClick(unit);
    });

    appRef.current.stage.addChild(container);
    unitSpritesRef.current.set(unit.id, {
      container,
      circle,
      ring,
      hpBar,
      hpBarBg,
      damageTexts: [],
      spawnProgress: 0
    });
  }

  function toScreenX(arenaX: number): number {
    if (!appRef.current) return 0;
    return appRef.current.screen.width / 2 + arenaX;
  }

  function toScreenY(arenaY: number): number {
    if (!appRef.current) return 0;
    return appRef.current.screen.height / 2 + arenaY;
  }

  function acquireParticle(): Particle {
    if (!appRef.current) {
      return { sprite: new PIXI.Graphics(), vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: 0 };
    }
    if (particlePoolRef.current.length > 0) {
      const p = particlePoolRef.current.pop()!;
      p.sprite.visible = true;
      return p;
    }
    const sprite = new PIXI.Graphics();
    appRef.current.stage.addChild(sprite);
    return { sprite, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: 0 };
  }

  function releaseParticle(p: Particle) {
    p.sprite.visible = false;
    particlePoolRef.current.push(p);
  }

  function spawnParticle(x: number, y: number, color: number, speed: number, size: number, life: number) {
    if (particlesRef.current.length > 150) return;
    const p = acquireParticle();
    const angle = Math.random() * Math.PI * 2;
    const s = speed * (0.5 + Math.random() * 0.8);
    p.vx = Math.cos(angle) * s;
    p.vy = Math.sin(angle) * s;
    p.size = size;
    p.color = color;
    p.life = life;
    p.maxLife = life;
    p.sprite.x = toScreenX(x);
    p.sprite.y = toScreenY(y);
    p.sprite.visible = true;
    particlesRef.current.push(p);
  }

  function spawnHitParticles(x: number, y: number) {
    const count = unitsRef.current.length > 40 ? 3 : 6;
    for (let i = 0; i < count; i++) {
      spawnParticle(x, y, 0xffffff, 40, 2, 0.3);
    }
  }

  function spawnVictoryParticles(color: number) {
    if (!appRef.current) return;
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const p = acquireParticle();
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 3 + Math.random() * 4;
      p.color = color;
      p.life = 1.5 + Math.random() * 0.5;
      p.maxLife = p.life;
      p.sprite.x = appRef.current.screen.width / 2;
      p.sprite.y = appRef.current.screen.height / 2;
      p.sprite.visible = true;
      particlesRef.current.push(p);
    }
  }

  function spawnSplashRing(x: number, y: number, radius: number) {
    if (!appRef.current) return;
    const sprite = new PIXI.Graphics();
    sprite.beginFill(0xf44336, 0.25);
    sprite.lineStyle(2, 0xf44336, 0.6);
    sprite.drawCircle(0, 0, radius);
    sprite.endFill();
    sprite.x = toScreenX(x);
    sprite.y = toScreenY(y);
    appRef.current.stage.addChild(sprite);
    splashRingsRef.current.push({
      sprite,
      startTime: performance.now(),
      duration: 300,
      radius
    });
  }

  function spawnProjectile(
    attacker: UnitData,
    target: UnitData,
    damage: number
  ) {
    if (!appRef.current) return;
    const isFireball = attacker.type === 'mage';
    const color = isFireball ? 0xff6d00 : 0xe0e0e0;
    const size = isFireball ? 6 : 3;

    const sprite = new PIXI.Graphics();
    sprite.beginFill(color);
    sprite.drawCircle(0, 0, size);
    sprite.endFill();
    sprite.x = toScreenX(attacker.x);
    sprite.y = toScreenY(attacker.y);
    appRef.current.stage.addChild(sprite);

    const trail: PIXI.Graphics[] = [];
    if (unitsRef.current.length <= 40) {
      for (let i = 0; i < 3; i++) {
        const t = new PIXI.Graphics();
        t.beginFill(color, 0.5 - i * 0.15);
        t.drawCircle(0, 0, Math.max(1, size - i));
        t.endFill();
        t.visible = false;
        appRef.current.stage.addChild(t);
        trail.push(t);
      }
    }

    projectileIdRef.current += 1;
    const proj: Projectile = {
      id: projectileIdRef.current,
      sprite,
      fromX: attacker.x,
      fromY: attacker.y,
      toX: target.x,
      toY: target.y,
      x: attacker.x,
      y: attacker.y,
      speed: isFireball ? 280 : 380,
      type: isFireball ? 'fireball' : 'arrow',
      attackerId: attacker.id,
      targetId: target.id,
      damage,
      splashRadius: attacker.stats.splashRadius,
      alive: true,
      trail
    };
    projectilesRef.current.push(proj);
  }

  function logicStep(dt: number) {
    const now = performance.now();
    const aliveUnits = unitsRef.current.filter(u => u.hp > 0);

    for (const unit of aliveUnits) {
      updateKnockback(unit, dt, now);

      let target = unit.targetId ? aliveUnits.find(u => u.id === unit.targetId && u.hp > 0) : null;
      if (!target) {
        target = findNearestEnemy(unit, aliveUnits);
        unit.targetId = target ? target.id : null;
      }

      if (!target) continue;

      if (isInRange(unit, target)) {
        if (canAttack(unit, now)) {
          unit.lastAttackTime = now;
          if (unit.type === 'archer' || unit.type === 'mage') {
            const damage = Math.max(1, unit.stats.attack - target.stats.defense * 0.5);
            spawnProjectile(unit, target, damage);
          } else {
            const result = performAttack(unit, target, unitsRef.current, now);
            spawnHitParticles(target.x, target.y);
            if (unit.stats.splashRadius > 0) {
              spawnSplashRing(target.x, target.y, unit.stats.splashRadius);
            }
          }
        }
      } else {
        moveTowards(unit, target.x, target.y, dt);
        clampToArena(unit, arenaRadiusRef.current);
      }
    }
  }

  function updateProjectiles(dt: number) {
    const now = performance.now();
    for (const p of projectilesRef.current) {
      if (!p.alive) continue;

      const target = unitsRef.current.find(u => u.id === p.targetId);
      if (target && target.hp > 0) {
        p.toX = target.x;
        p.toY = target.y;
      }

      const dx = p.toX - p.x;
      const dy = p.toY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 6) {
        p.alive = false;
        if (target && target.hp > 0) {
          const attacker = unitsRef.current.find(u => u.id === p.attackerId);
          if (attacker) {
            const result = performAttack(attacker, target, unitsRef.current, now);
            spawnHitParticles(target.x, target.y);
            if (p.splashRadius > 0) {
              spawnSplashRing(target.x, target.y, p.splashRadius);
            }
          }
        }
        if (appRef.current) {
          appRef.current.stage.removeChild(p.sprite);
          for (const t of p.trail) appRef.current.stage.removeChild(t);
        }
        continue;
      }

      const step = p.speed * dt;
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
      p.sprite.x = toScreenX(p.x);
      p.sprite.y = toScreenY(p.y);

      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const trailFade = (i + 1) / (p.trail.length + 2);
        t.visible = true;
        t.x = p.sprite.x - (dx / dist) * (i + 1) * 5;
        t.y = p.sprite.y - (dy / dist) * (i + 1) * 5;
        t.alpha = trailFade * 0.7;
      }
    }
    projectilesRef.current = projectilesRef.current.filter(p => p.alive);
  }

  function updateParticles(dt: number) {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.life -= dt;
      if (p.life <= 0) {
        releaseParticle(p);
        particlesRef.current.splice(i, 1);
        continue;
      }
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      const lifeRatio = p.life / p.maxLife;
      p.sprite.clear();
      p.sprite.beginFill(p.color, lifeRatio);
      p.sprite.drawCircle(0, 0, p.size * lifeRatio);
      p.sprite.endFill();
    }
  }

  function updateSplashRings() {
    const now = performance.now();
    for (let i = splashRingsRef.current.length - 1; i >= 0; i--) {
      const s = splashRingsRef.current[i];
      const elapsed = now - s.startTime;
      if (elapsed >= s.duration) {
        if (appRef.current) appRef.current.stage.removeChild(s.sprite);
        splashRingsRef.current.splice(i, 1);
        continue;
      }
      const ratio = elapsed / s.duration;
      s.sprite.alpha = 1 - ratio;
    }
  }

  function updateUnitSprites(dt: number, now: number) {
    if (!appRef.current) return;
    for (const unit of unitsRef.current) {
      const entry = unitSpritesRef.current.get(unit.id);
      if (!entry) continue;

      if (entry.spawnProgress < 1) {
        entry.spawnProgress = Math.min(1, entry.spawnProgress + dt * 4);
        const p = entry.spawnProgress;
        const bounce = p < 0.5 ? p * 2 : (1 - p) * 2;
        const scale = 0.3 + p * 0.7 + bounce * 0.15;
        entry.container.scale.set(scale);
        entry.container.alpha = p;
      } else {
        entry.container.scale.set(1);
        entry.container.alpha = unit.hp <= 0 ? Math.max(0, entry.container.alpha - dt * 2) : 1;
      }

      const targetX = toScreenX(unit.x);
      const targetY = toScreenY(unit.y);
      const interpSpeed = 1 / INTERPOLATION_TIME;
      unit.renderX += (unit.x - unit.renderX) * Math.min(1, dt * interpSpeed);
      unit.renderY += (unit.y - unit.renderY) * Math.min(1, dt * interpSpeed);
      entry.container.x = toScreenX(unit.renderX);
      entry.container.y = toScreenY(unit.renderY);

      if (now < unit.flashUntil) {
        entry.circle.tint = 0xffffff;
      } else {
        entry.circle.tint = 0xffffff;
        entry.circle.clear();
        entry.circle.beginFill(UNIT_COLORS[unit.type]);
        entry.circle.drawCircle(0, 0, UNIT_RADIUS);
        entry.circle.endFill();
      }

      if (now < unit.flashUntil) {
        entry.circle.clear();
        entry.circle.beginFill(0xffffff);
        entry.circle.drawCircle(0, 0, UNIT_RADIUS);
        entry.circle.endFill();
      }

      const hpRatio = Math.max(0, unit.hp / unit.stats.maxHp);
      entry.hpBar.clear();
      entry.hpBar.beginFill(getHpColorNum(unit.hp, unit.stats.maxHp));
      entry.hpBar.drawRect(-UNIT_RADIUS, -UNIT_RADIUS - 9, UNIT_RADIUS * 2 * hpRatio, 4);
      entry.hpBar.endFill();

      if (props.selectedUnitId === unit.id) {
        entry.ring.lineStyle(3, 0xffd54f, 1);
      } else {
        entry.ring.lineStyle(2, unit.faction === 'blue' ? 0x42a5f5 : 0xef5350, 0.8);
      }

      for (let i = unit.damageNumbers.length - 1; i >= 0; i--) {
        const dn = unit.damageNumbers[i];
        const age = (now - dn.time) / 1000;
        if (age > 0.8) {
          unit.damageNumbers.splice(i, 1);
          if (entry.damageTexts[i]) {
            entry.container.removeChild(entry.damageTexts[i]);
            entry.damageTexts.splice(i, 1);
          }
          continue;
        }
        let text = entry.damageTexts[i];
        if (!text) {
          text = new PIXI.Text(`-${dn.value}`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xff5252,
            stroke: 0x000000,
            strokeThickness: 3
          });
          text.anchor.set(0.5);
          entry.container.addChild(text);
          entry.damageTexts[i] = text;
        }
        text.y = -UNIT_RADIUS - 18 - age * 30;
        text.alpha = 1 - age / 0.8;
        text.scale.set(1 - age * 0.3);
      }
    }
  }

  function checkBattleEnd() {
    const aliveBlue = unitsRef.current.filter(u => u.hp > 0 && u.faction === 'blue').length;
    const aliveRed = unitsRef.current.filter(u => u.hp > 0 && u.faction === 'red').length;

    if (phaseRef.current === 'fighting') {
      if (aliveBlue === 0 && aliveRed > 0) {
        winnerRef.current = 'red';
        phaseRef.current = 'ended';
        spawnVictoryParticles(0xef5350);
      } else if (aliveRed === 0 && aliveBlue > 0) {
        winnerRef.current = 'blue';
        phaseRef.current = 'ended';
        spawnVictoryParticles(0x42a5f5);
      }
    }
  }

  useEffect(() => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    arenaRadiusRef.current = size / 2 - 10;

    const app = new PIXI.Application({
      width: size,
      height: size,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    });
    canvasRef.current.appendChild(app.view as unknown as Node);
    appRef.current = app;

    const drawArenaBg = () => {
      const bg = new PIXI.Graphics();
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2;

      bg.beginFill(0x3e2723);
      bg.drawCircle(cx, cy, r);
      bg.endFill();

      const tileSize = 30;
      for (let x = -r; x < r; x += tileSize) {
        for (let y = -r; y < r; y += tileSize) {
          const dist = Math.sqrt((x + tileSize / 2) ** 2 + (y + tileSize / 2) ** 2);
          if (dist < r - 5) {
            const shade = ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0) ? 0x4a3020 : 0x352015;
            bg.beginFill(shade, 0.5);
            bg.drawRect(cx + x, cy + y, tileSize - 1, tileSize - 1);
            bg.endFill();
          }
        }
      }

      bg.beginFill(0x000000, 0.25);
      bg.drawCircle(cx, cy, r);
      bg.endFill();
      bg.beginFill(0x3e2723, 1);
      bg.drawCircle(cx, cy, r - 8);
      bg.endFill();

      app.stage.addChild(bg);
    };
    drawArenaBg();

    const handleStageClick = (e: PIXI.FederatedPointerEvent) => {
      if (props.onUnitClick) props.onUnitClick(null);
    };
    app.stage.interactive = true;
    app.stage.hitArea = new PIXI.Rectangle(0, 0, size, size);
    app.stage.on('pointerdown', handleStageClick);

    const handleResize = () => {
      if (!canvasRef.current || !appRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const sz = Math.min(rect.width, rect.height);
      arenaRadiusRef.current = sz / 2 - 10;
      appRef.current.renderer.resize(sz, sz);
    };
    window.addEventListener('resize', handleResize);

    lastFrameTimeRef.current = performance.now();

    return () => {
      window.removeEventListener('resize', handleResize);
      app.destroy(true);
      appRef.current = null;
    };
  }, []);

  useRafLoop(() => {
    if (!appRef.current) return;
    const now = performance.now();
    let dt = (now - lastFrameTimeRef.current) / 1000;
    dt = Math.min(dt, 0.1);
    lastFrameTimeRef.current = now;

    if (phaseRef.current === 'fighting') {
      battleDurationRef.current += dt;
      logicAccumulatorRef.current += dt;
      while (logicAccumulatorRef.current >= LOGIC_DT) {
        logicStep(LOGIC_DT);
        logicAccumulatorRef.current -= LOGIC_DT;
      }
    }

    updateProjectiles(dt);
    updateParticles(dt);
    updateSplashRings();
    updateUnitSprites(dt, now);

    if (phaseRef.current === 'fighting') {
      checkBattleEnd();
      emitStats();
    }
  }, true);

  return (
    <div
      ref={canvasRef}
      className="arena-canvas"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
});

GameEngine.displayName = 'GameEngine';

export default GameEngine;
