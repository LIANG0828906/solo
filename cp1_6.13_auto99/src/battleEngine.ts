import type { Ship, GameStateData, Slot, Explosion, Particle, LaserBeam, Faction } from './gameState';
import { getSlotsForFaction, checkGameOver } from './gameState';

export function calculateDamage(
  attacker: Ship,
  target: Ship,
  state: GameStateData
): number {
  const targetSlots = getSlotsForFaction(state, target.faction);
  const attackerSlots = getSlotsForFaction(state, attacker.faction);

  const targetSlot = targetSlots.find(s => s.index === target.slotIndex);
  const attackerSlot = attackerSlots.find(s => s.index === attacker.slotIndex);

  if (!targetSlot || !attackerSlot) return 0;

  let baseDamage = attacker.attack;

  if (attackerSlot.row === 'front') {
    baseDamage *= 1.0;
  } else {
    baseDamage *= 0.7;
  }

  baseDamage *= 1.3;

  let targetDefense = target.defense;
  if (targetSlot.row === 'front') {
    targetDefense *= 0.5;
  }

  const defenseReduction = targetDefense / (targetDefense + 50);
  let finalDamage = baseDamage * (1 - defenseReduction);

  if (targetSlot.row === 'front') {
    finalDamage *= 1.2;
  }

  return Math.floor(Math.max(1, finalDamage));
}

export function getShipMainColor(ship: Ship): string {
  if (ship.faction === 'blue') {
    switch (ship.type) {
      case 'attack': return '#4a90d9';
      case 'defense': return '#6a8ad9';
      case 'speed': return '#5ab4ff';
    }
  } else {
    switch (ship.type) {
      case 'attack': return '#d94a4a';
      case 'defense': return '#d96a6a';
      case 'speed': return '#ff6a6a';
    }
  }
}

export function createExplosion(x: number, y: number, color: string): Explosion {
  const particles: Particle[] = [];
  const particleCount = 30;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 1,
      maxLife: 1,
      size: 3 + Math.random() * 4,
    });
  }

  return {
    x,
    y,
    particles,
    duration: 800,
    elapsed: 0,
  };
}

export function createLaserBeam(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string
): LaserBeam {
  return {
    startX,
    startY,
    endX,
    endY,
    color,
    progress: 0,
    duration: 500,
  };
}

export function performAttack(
  attacker: Ship,
  target: Ship,
  state: GameStateData
): { damage: number; killed: boolean } {
  const damage = calculateDamage(attacker, target, state);

  target.hp = Math.max(0, target.hp - damage);
  attacker.hasAttacked = true;

  state.stats.totalDamage[attacker.faction] += damage;

  target.flashTimer = 300;
  target.shakeTimer = 300;

  const killed = target.hp <= 0;
  if (killed) {
    target.isAlive = false;
  }

  const winner = checkGameOver(state);
  if (winner) {
    state.winner = winner;
    state.phase = 'gameOver';
    state.stats.turnsPlayed = state.turn;
  }

  return { damage, killed };
}

export function canAllShipsAttacked(state: GameStateData, faction: Faction): boolean {
  const ships = faction === 'blue' ? state.blueShips : state.redShips;
  const aliveShips = ships.filter(s => s.isAlive && s.slotIndex !== null);
  return aliveShips.every(s => s.hasAttacked);
}

export function getValidTargets(attacker: Ship, state: GameStateData): Ship[] {
  const enemyFaction: Faction = attacker.faction === 'blue' ? 'red' : 'blue';
  const enemySlots = getSlotsForFaction(state, enemyFaction);
  const targets: Ship[] = [];

  const frontRowAlive = enemySlots
    .filter(s => s.row === 'front' && s.ship && s.ship.isAlive);

  if (frontRowAlive.length > 0) {
    frontRowAlive.forEach(s => {
      if (s.ship) targets.push(s.ship);
    });
  } else {
    enemySlots
      .filter(s => s.row === 'back' && s.ship && s.ship.isAlive)
      .forEach(s => {
        if (s.ship) targets.push(s.ship);
      });
  }

  return targets;
}

export function updateExplosions(explosions: Explosion[], deltaTime: number): void {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    exp.elapsed += deltaTime;

    const lifeRatio = 1 - exp.elapsed / exp.duration;

    exp.particles.forEach(p => {
      p.x += p.vx * (deltaTime / 16);
      p.y += p.vy * (deltaTime / 16);
      p.vy += 0.05 * (deltaTime / 16);
      p.life = lifeRatio;
    });

    if (exp.elapsed >= exp.duration) {
      explosions.splice(i, 1);
    }
  }
}

export function updateLaserBeams(beams: LaserBeam[], deltaTime: number): void {
  for (let i = beams.length - 1; i >= 0; i--) {
    const beam = beams[i];
    beam.progress += deltaTime / beam.duration;

    if (beam.progress >= 1) {
      beams.splice(i, 1);
    }
  }
}

export function updateShipEffects(ships: Ship[], deltaTime: number): void {
  ships.forEach(ship => {
    if (ship.flashTimer > 0) {
      ship.flashTimer = Math.max(0, ship.flashTimer - deltaTime);
    }
    if (ship.shakeTimer > 0) {
      ship.shakeTimer = Math.max(0, ship.shakeTimer - deltaTime);
      const shakePhase = (ship.shakeTimer / 150) * Math.PI * 2;
      ship.shakeOffset = Math.sin(shakePhase) * 3;
    } else {
      ship.shakeOffset = 0;
    }
  });
}

export function updateSlotScales(slots: Slot[], deltaTime: number): void {
  slots.forEach(slot => {
    const diff = slot.targetScale - slot.scale;
    slot.scale += diff * (deltaTime / 200);
    if (Math.abs(diff) < 0.001) {
      slot.scale = slot.targetScale;
    }
  });
}
