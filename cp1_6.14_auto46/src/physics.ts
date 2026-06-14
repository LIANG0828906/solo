import { GameState, Vec2, Debris, Star, PowerUpType } from './types';

export function updatePhysics(state: GameState, dt: number): void {
  const timeScale = state.timeSlowActive ? 0.3 : 1.0;
  const effectiveDt = dt * timeScale;

  updateShip(state, dt);
  updateDebrisMovement(state, effectiveDt);
  updatePowerUpMovement(state, effectiveDt);
  updateBeam(state, effectiveDt);
  checkCollisions(state);
  updateParticles(state, dt);
  updateTimers(state, dt);
  spawnDebris(state, effectiveDt);
  spawnPowerUps(state, effectiveDt);
}

function updateShip(state: GameState, dt: number): void {
  const ship = state.ship;
  const speedMult = 3 + state.upgrades.speed * 0.5;

  const dx = state.mousePos.x - ship.pos.x;
  const dy = state.mousePos.y - ship.pos.y;

  ship.vel.x += dx * speedMult * dt;
  ship.vel.y += dy * speedMult * dt;

  const friction = 0.88;
  ship.vel.x *= friction;
  ship.vel.y *= friction;

  ship.pos.x += ship.vel.x;
  ship.pos.y += ship.vel.y;

  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 1) {
    ship.angle = Math.atan2(dy, dx);
  }

  const m = ship.radius;
  if (ship.pos.x < m) { ship.pos.x = m; ship.vel.x *= -0.5; }
  if (ship.pos.x > state.width - m) { ship.pos.x = state.width - m; ship.vel.x *= -0.5; }
  if (ship.pos.y < m) { ship.pos.y = m; ship.vel.y *= -0.5; }
  if (ship.pos.y > state.height - m) { ship.pos.y = state.height - m; ship.vel.y *= -0.5; }

  const speed = Math.sqrt(ship.vel.x * ship.vel.x + ship.vel.y * ship.vel.y);
  if (speed > 2) {
    const trailAngle = ship.angle + Math.PI;
    spawnParticle(
      state,
      ship.pos.x + Math.cos(trailAngle) * 15,
      ship.pos.y + Math.sin(trailAngle) * 15,
      Math.cos(trailAngle) * speed * 0.3 + (Math.random() - 0.5) * 20,
      Math.sin(trailAngle) * speed * 0.3 + (Math.random() - 0.5) * 20,
      0.4 + Math.random() * 0.3,
      '#4488ff',
      2 + Math.random() * 2
    );
  }
}

function updateDebrisMovement(state: GameState, dt: number): void {
  for (let i = state.debris.length - 1; i >= 0; i--) {
    const d = state.debris[i];

    if (d.type === 'fueltank' && !d.beingPulled) {
      d.driftTimer! -= dt;
      if (d.driftTimer! <= 0) {
        d.driftTimer = d.driftInterval!;
        const angle = Math.random() * Math.PI * 2;
        const spd = 30 + Math.random() * 40;
        d.vel.x = Math.cos(angle) * spd;
        d.vel.y = Math.sin(angle) * spd;
      }
    }

    if (!d.beingPulled) {
      d.pos.x += d.vel.x * dt;
      d.pos.y += d.vel.y * dt;
    }

    d.rotation += d.rotationSpeed * dt;

    if (d.opacity < 1) {
      d.opacity = Math.min(1, d.opacity + dt * 2);
    }

    if (d.beingPulled) {
      d.radius = d.originalRadius * (1 - d.pullProgress * 0.7);
      if (d.radius < 2) d.radius = 2;
    }

    if (!d.beingPulled) {
      const margin = 100;
      if (d.pos.x < -margin || d.pos.x > state.width + margin ||
          d.pos.y < -margin || d.pos.y > state.height + margin) {
        state.debris.splice(i, 1);
      }
    }
  }
}

function updatePowerUpMovement(state: GameState, dt: number): void {
  for (let i = state.powerUps.length - 1; i >= 0; i--) {
    const p = state.powerUps[i];
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.rotation += p.rotationSpeed * dt;
    p.pulsePhase += dt * 3;
    if (p.opacity < 1) p.opacity = Math.min(1, p.opacity + dt * 2);

    const margin = 80;
    if (p.pos.x < -margin || p.pos.x > state.width + margin ||
        p.pos.y < -margin || p.pos.y > state.height + margin) {
      state.powerUps.splice(i, 1);
    }
  }
}

function updateBeam(state: GameState, dt: number): void {
  if (!state.beamActive) {
    for (const d of state.debris) {
      d.beingPulled = false;
      d.pullProgress = 0;
    }
    return;
  }

  state.ship.energy -= state.beamEnergyCost * dt;
  if (state.ship.energy <= 0) {
    state.ship.energy = 0;
    state.beamActive = false;
    for (const d of state.debris) {
      d.beingPulled = false;
      d.pullProgress = 0;
    }
    return;
  }

  const ship = state.ship;
  const frontX = ship.pos.x + Math.cos(ship.angle) * ship.radius;
  const frontY = ship.pos.y + Math.sin(ship.angle) * ship.radius;
  const beamStart: Vec2 = { x: frontX, y: frontY };
  const beamEnd = state.mousePos;
  const beamRange = 200 + state.upgrades.beamRange * 40;

  for (let i = state.debris.length - 1; i >= 0; i--) {
    const d = state.debris[i];

    if (d.beingPulled) {
      const tdx = ship.pos.x - d.pos.x;
      const tdy = ship.pos.y - d.pos.y;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

      if (tdist < ship.radius + d.radius + 5) {
        collectDebris(state, d, i);
        continue;
      }

      const pullSpeed = 250 + d.pullProgress * 100;
      d.vel.x = (tdx / tdist) * pullSpeed;
      d.vel.y = (tdy / tdist) * pullSpeed;
      d.pos.x += d.vel.x * dt;
      d.pos.y += d.vel.y * dt;
      d.pullProgress += dt * 1.5;

      if (Math.random() < 0.3) {
        spawnParticle(
          state,
          d.pos.x, d.pos.y,
          (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60,
          0.3, '#7fdbff', 2
        );
      }
    } else {
      const distToBeam = pointToSegmentDist(d.pos, beamStart, beamEnd);
      const distToShip = vecDist(d.pos, ship.pos);

      if (distToBeam < 35 && distToShip < beamRange && distToShip > ship.radius) {
        d.beingPulled = true;
        d.pullProgress = 0;
      }
    }
  }
}

function collectDebris(state: GameState, d: Debris, index: number): void {
  const cx = d.pos.x;
  const cy = d.pos.y;

  for (let j = 0; j < 12; j++) {
    const angle = (Math.PI * 2 * j) / 12;
    const spd = 80 + Math.random() * 120;
    spawnParticle(
      state,
      cx, cy,
      Math.cos(angle) * spd, Math.sin(angle) * spd,
      0.5 + Math.random() * 0.3,
      '#ffffff',
      2 + Math.random() * 3
    );
  }

  for (let j = 0; j < 6; j++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 60;
    spawnParticle(
      state,
      cx, cy,
      Math.cos(angle) * spd, Math.sin(angle) * spd,
      0.4 + Math.random() * 0.2,
      '#7fdbff',
      1.5 + Math.random() * 2
    );
  }

  state.debris.splice(index, 1);
  state.collectedCount++;
  state.score += d.type === 'satellite' ? 30 : d.type === 'fueltank' ? 20 : 10;
  state.ship.energy = Math.min(state.ship.maxEnergy, state.ship.energy + 8);
  state.screenFlash = 0.15;
  state.screenFlashColor = '#7fdbff';

  if (state.collectedCount >= state.targetCount) {
    state.phase = 'levelcomplete';
    state.upgradePoints += 2 + state.level;
  }
}

function checkCollisions(state: GameState): void {
  const ship = state.ship;

  for (let i = state.debris.length - 1; i >= 0; i--) {
    const d = state.debris[i];
    if (d.beingPulled) continue;

    const dist = vecDist(ship.pos, d.pos);
    if (dist < ship.radius + d.radius) {
      if (state.shieldBoostActive) {
        state.debris.splice(i, 1);
        spawnCollectionBurst(state, d.pos.x, d.pos.y, '#4488ff');
        continue;
      }

      const damage = d.type === 'satellite' ? 25 : d.type === 'fueltank' ? 15 : 10;

      if (ship.shield > 0) {
        const shieldAbsorb = Math.min(ship.shield, damage * 0.7);
        ship.shield -= shieldAbsorb;
        ship.health -= damage - shieldAbsorb;
      } else {
        ship.health -= damage;
      }

      const pushDx = d.pos.x - ship.pos.x;
      const pushDy = d.pos.y - ship.pos.y;
      const pushDist = Math.sqrt(pushDx * pushDx + pushDy * pushDy) || 1;
      ship.vel.x -= (pushDx / pushDist) * 8;
      ship.vel.y -= (pushDy / pushDist) * 8;

      state.debris.splice(i, 1);
      spawnCollectionBurst(state, d.pos.x, d.pos.y, '#ff4444');
      state.screenFlash = 0.2;
      state.screenFlashColor = '#ff4444';

      if (ship.health <= 0) {
        ship.health = 0;
        state.phase = 'gameover';
      }
    }
  }

  for (let i = state.powerUps.length - 1; i >= 0; i--) {
    const p = state.powerUps[i];
    const dist = vecDist(ship.pos, p.pos);
    if (dist < ship.radius + p.radius) {
      applyPowerUp(state, p);
      state.powerUps.splice(i, 1);

      for (let j = 0; j < 8; j++) {
        const angle = (Math.PI * 2 * j) / 8;
        spawnParticle(
          state,
          p.pos.x, p.pos.y,
          Math.cos(angle) * 80, Math.sin(angle) * 80,
          0.5,
          powerUpColor(p.type),
          3
        );
      }

      state.screenFlash = 0.15;
      state.screenFlashColor = powerUpColor(p.type);
    }
  }
}

function applyPowerUp(state: GameState, p: PowerUp): void {
  switch (p.type) {
    case 'shield':
      state.shieldBoostActive = true;
      state.shieldBoostTimer = 6;
      state.ship.shield = state.ship.maxShield;
      break;
    case 'energy':
      state.ship.energy = Math.min(state.ship.maxEnergy, state.ship.energy + 40);
      break;
    case 'timeslow':
      state.timeSlowActive = true;
      state.timeSlowTimer = 5;
      break;
  }
}

function powerUpColor(type: string): string {
  switch (type) {
    case 'shield': return '#4488ff';
    case 'energy': return '#ffdd44';
    case 'timeslow': return '#cc44ff';
    default: return '#ffffff';
  }
}

function updateParticles(state: GameState, dt: number): void {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.vel.x *= 0.97;
    p.vel.y *= 0.97;
    p.life -= dt;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function updateTimers(state: GameState, dt: number): void {
  if (state.timeSlowActive) {
    state.timeSlowTimer -= dt;
    if (state.timeSlowTimer <= 0) {
      state.timeSlowActive = false;
      state.timeSlowTimer = 0;
    }
  }

  if (state.shieldBoostActive) {
    state.shieldBoostTimer -= dt;
    if (state.shieldBoostTimer <= 0) {
      state.shieldBoostActive = false;
      state.shieldBoostTimer = 0;
    }
  }

  if (state.screenFlash > 0) {
    state.screenFlash -= dt * 3;
    if (state.screenFlash < 0) state.screenFlash = 0;
  }

  const shieldRegenRate = 2 + state.upgrades.shieldStrength * 1;
  if (state.ship.shield < state.ship.maxShield && !state.shieldBoostActive) {
    state.ship.shield = Math.min(state.ship.maxShield, state.ship.shield + shieldRegenRate * dt);
  }

  if (!state.beamActive && state.ship.energy < state.ship.maxEnergy) {
    state.ship.energy = Math.min(state.ship.maxEnergy, state.ship.energy + 5 * dt);
  }

  state.gameTime += dt;
}

function spawnDebris(state: GameState, dt: number): void {
  const maxDebris = Math.min(20 + (state.level - 1) * 5, 80);
  state.spawnTimer += dt;

  const interval = 1.0 / state.debrisSpawnRate;

  while (state.spawnTimer >= interval && state.debris.length < maxDebris) {
    state.spawnTimer -= interval;
    createDebrisFromEdge(state);
  }
}

function createDebrisFromEdge(state: GameState): void {
  const rand = Math.random();
  let type: DebrisType;
  if (rand < 0.5) type = 'metal';
  else if (rand < 0.8) type = 'fueltank';
  else type = 'satellite';

  const edge = Math.floor(Math.random() * 4);
  let x: number, y: number, vx: number, vy: number;

  const speedMult = 1 + (state.level - 1) * 0.15;

  switch (edge) {
    case 0:
      x = Math.random() * state.width; y = -30;
      vx = (Math.random() - 0.5) * 80; vy = 40 + Math.random() * 60;
      break;
    case 1:
      x = state.width + 30; y = Math.random() * state.height;
      vx = -(40 + Math.random() * 60); vy = (Math.random() - 0.5) * 80;
      break;
    case 2:
      x = Math.random() * state.width; y = state.height + 30;
      vx = (Math.random() - 0.5) * 80; vy = -(40 + Math.random() * 60);
      break;
    default:
      x = -30; y = Math.random() * state.height;
      vx = 40 + Math.random() * 60; vy = (Math.random() - 0.5) * 80;
      break;
  }

  vx *= speedMult;
  vy *= speedMult;

  let radius: number, rotSpeed: number;
  switch (type) {
    case 'metal':
      radius = 6 + Math.random() * 6;
      rotSpeed = (Math.random() - 0.5) * 6;
      break;
    case 'satellite':
      radius = 22 + Math.random() * 12;
      rotSpeed = (Math.random() - 0.5) * 1.5;
      vx *= 0.4; vy *= 0.4;
      break;
    case 'fueltank':
      radius = 12 + Math.random() * 6;
      rotSpeed = (Math.random() - 0.5) * 3;
      vx *= 0.6; vy *= 0.6;
      break;
  }

  const vertexCount = type === 'metal' ? 4 + Math.floor(Math.random() * 3) : 0;
  const vertices: Vec2[] = [];
  if (vertexCount > 0) {
    for (let i = 0; i < vertexCount; i++) {
      const a = (Math.PI * 2 * i) / vertexCount;
      const r = radius * (0.7 + Math.random() * 0.6);
      vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
  }

  state.debris.push({
    id: state.nextDebrisId++,
    type,
    pos: { x, y },
    vel: { x: vx, y: vy },
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: rotSpeed,
    radius,
    opacity: 0,
    beingPulled: false,
    pullProgress: 0,
    originalRadius: radius,
    vertices: vertexCount > 0 ? vertices : undefined,
    driftTimer: 1 + Math.random() * 2,
    driftInterval: 1 + Math.random() * 2,
  });
}

function spawnPowerUps(state: GameState, dt: number): void {
  state.powerUpSpawnTimer += dt;
  const interval = 8 - Math.min(state.level * 0.5, 3);

  if (state.powerUpSpawnTimer >= interval && state.powerUps.length < 3) {
    state.powerUpSpawnTimer = 0;

    const types: PowerUpType[] = ['shield', 'energy', 'timeslow'];
    const type = types[Math.floor(Math.random() * types.length)];

    const margin = 100;
    const x = margin + Math.random() * (state.width - margin * 2);
    const y = margin + Math.random() * (state.height - margin * 2);

    const angle = Math.random() * Math.PI * 2;
    const spd = 15 + Math.random() * 20;

    state.powerUps.push({
      id: state.nextPowerUpId++,
      type,
      pos: { x, y },
      vel: { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd },
      rotation: 0,
      rotationSpeed: 1.5 + Math.random(),
      radius: 18,
      opacity: 0,
      pulsePhase: 0,
    });
  }
}

function spawnParticle(
  state: GameState, x: number, y: number,
  vx: number, vy: number,
  life: number, color: string, size: number
): void {
  if (state.particles.length > 300) return;
  state.particles.push({
    pos: { x, y },
    vel: { x: vx, y: vy },
    life,
    maxLife: life,
    color,
    size,
  });
}

function spawnCollectionBurst(state: GameState, x: number, y: number, color: string): void {
  for (let j = 0; j < 10; j++) {
    const angle = (Math.PI * 2 * j) / 10;
    const spd = 60 + Math.random() * 100;
    spawnParticle(state, x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, 0.4, color, 2 + Math.random() * 2);
  }
}

export function generateStars(width: number, height: number, count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.5 + Math.random() * 2,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

function pointToSegmentDist(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) return vecDist(p, a);
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  const cx = a.x + t * abx;
  const cy = a.y + t * aby;
  const dx = p.x - cx;
  const dy = p.y - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function vecDist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}


