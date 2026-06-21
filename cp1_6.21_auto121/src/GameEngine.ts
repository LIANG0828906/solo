export interface Vec2 {
  x: number;
  y: number;
}

export interface Entity {
  id: number;
  position: Vec2;
  size: number;
  velocity?: Vec2;
}

export interface Player extends Entity {
  type: 'player';
  trailTimer: number;
}

export interface Bullet extends Entity {
  type: 'bullet';
}

export interface Enemy extends Entity {
  type: 'enemy';
  amplitude: number;
  frequency: number;
  phase: number;
  baseX: number;
}

export interface Particle {
  id: number;
  position: Vec2;
  velocity: Vec2;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface TrailParticle extends Particle {
  type: 'trail';
}

export interface ExplosionParticle extends Particle {
  type: 'explosion';
}

export interface GameState {
  running: boolean;
  gameOver: boolean;
  score: number;
  prevScore: number;
  scoreAnimTime: number;
  survivalTime: number;
  enemiesRemaining: number;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  particles: Particle[];
  keys: Set<string>;
  shooting: boolean;
  shootCooldown: number;
  enemySpawnTimer: number;
  nextEnemySpawn: number;
  nextId: number;
  startTime: number;
  canvasWidth: number;
  canvasHeight: number;
}

const PLAYER_SIZE = 30;
const BULLET_SIZE = 4;
const BULLET_SPEED = 8;
const ENEMY_SIZE = 24;
const ENEMY_BASE_SPEED = 2;
const TRAIL_FADE = 0.05;
const MAX_PARTICLES = 300;
const SHOOT_COOLDOWN = 8;
const SCORE_ANIM_DURATION = 9;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r},${g},${b})`;
}

function aabbCollide(
  a: { position: Vec2; size: number },
  b: { position: Vec2; size: number }
): boolean {
  const aHalf = a.size / 2;
  const bHalf = b.size / 2;
  return (
    a.position.x - aHalf < b.position.x + bHalf &&
    a.position.x + aHalf > b.position.x - bHalf &&
    a.position.y - aHalf < b.position.y + bHalf &&
    a.position.y + aHalf > b.position.y - bHalf
  );
}

function createInitialState(width: number, height: number): GameState {
  return {
    running: false,
    gameOver: false,
    score: 0,
    prevScore: 0,
    scoreAnimTime: 0,
    survivalTime: 0,
    enemiesRemaining: 0,
    player: {
      id: 0,
      type: 'player',
      position: { x: width / 2, y: height - 80 },
      size: PLAYER_SIZE,
      trailTimer: 0,
    },
    bullets: [],
    enemies: [],
    particles: [],
    keys: new Set<string>(),
    shooting: false,
    shootCooldown: 0,
    enemySpawnTimer: 0,
    nextEnemySpawn: 60 + Math.random() * 120,
    nextId: 1,
    startTime: 0,
    canvasWidth: width,
    canvasHeight: height,
  };
}

export function initGame(width: number, height: number): GameState {
  return createInitialState(width, height);
}

export function startGame(state: GameState): GameState {
  const s = createInitialState(state.canvasWidth, state.canvasHeight);
  s.running = true;
  s.startTime = performance.now();
  return s;
}

export function setCanvasSize(state: GameState, width: number, height: number): GameState {
  state.canvasWidth = width;
  state.canvasHeight = height;
  return state;
}

export function handleKeyDown(state: GameState, key: string): GameState {
  const k = key.toLowerCase();
  state.keys.add(k);
  if (k === ' ') {
    state.shooting = true;
  }
  return state;
}

export function handleKeyUp(state: GameState, key: string): GameState {
  const k = key.toLowerCase();
  state.keys.delete(k);
  if (k === ' ') {
    state.shooting = false;
  }
  return state;
}

export function setShooting(state: GameState, shooting: boolean): GameState {
  state.shooting = shooting;
  return state;
}

export function update(state: GameState): GameState {
  if (!state.running || state.gameOver) return state;

  state.survivalTime = Math.floor((performance.now() - state.startTime) / 1000);

  if (state.scoreAnimTime > 0) {
    state.scoreAnimTime--;
  }

  const speed = 5;
  const halfPlayer = state.player.size / 2;

  if (state.keys.has('w') || state.keys.has('arrowup')) {
    state.player.position.y = Math.max(40 + halfPlayer, state.player.position.y - speed);
  }
  if (state.keys.has('s') || state.keys.has('arrowdown')) {
    state.player.position.y = Math.min(
      state.canvasHeight - halfPlayer,
      state.player.position.y + speed
    );
  }
  if (state.keys.has('a') || state.keys.has('arrowleft')) {
    state.player.position.x = Math.max(halfPlayer, state.player.position.x - speed);
  }
  if (state.keys.has('d') || state.keys.has('arrowright')) {
    state.player.position.x = Math.min(
      state.canvasWidth - halfPlayer,
      state.player.position.x + speed
    );
  }

  state.player.trailTimer++;
  if (state.player.trailTimer % 2 === 0) {
    state.particles.push({
      id: state.nextId++,
      type: 'trail',
      position: { x: state.player.position.x, y: state.player.position.y + 15 },
      velocity: { x: 0, y: 1 },
      size: 8,
      color: '#00E5FF',
      alpha: 1,
      life: 20,
      maxLife: 20,
    } as TrailParticle);
  }

  if (state.shootCooldown > 0) {
    state.shootCooldown--;
  }
  if (state.shooting && state.shootCooldown <= 0) {
    state.bullets.push({
      id: state.nextId++,
      type: 'bullet',
      position: { x: state.player.position.x, y: state.player.position.y - 20 },
      size: BULLET_SIZE,
      velocity: { x: 0, y: -BULLET_SPEED },
    });
    state.shootCooldown = SHOOT_COOLDOWN;
  }

  state.bullets = state.bullets.filter((b) => {
    b.position.x += b.velocity!.x;
    b.position.y += b.velocity!.y;
    return b.position.y > -10 && b.position.y < state.canvasHeight + 10;
  });

  state.enemySpawnTimer++;
  if (state.enemySpawnTimer >= state.nextEnemySpawn) {
    state.enemySpawnTimer = 0;
    state.nextEnemySpawn = 60 + Math.random() * 120;
    const x = 30 + Math.random() * (state.canvasWidth - 60);
    state.enemies.push({
      id: state.nextId++,
      type: 'enemy',
      position: { x, y: -20 },
      size: ENEMY_SIZE,
      velocity: { x: 0, y: ENEMY_BASE_SPEED + Math.random() * 1.5 },
      amplitude: 20 + Math.random() * 40,
      frequency: 0.02 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
      baseX: x,
    });
  }

  state.enemies = state.enemies.filter((e) => {
    e.position.y += e.velocity!.y;
    e.phase += e.frequency;
    e.position.x = e.baseX + Math.sin(e.phase) * e.amplitude;
    e.baseX = Math.max(20, Math.min(state.canvasWidth - 20, e.baseX));
    return e.position.y < state.canvasHeight + 30;
  });

  state.enemiesRemaining = state.enemies.length;

  const bulletsToRemove = new Set<number>();
  const enemiesToRemove = new Set<number>();

  for (const bullet of state.bullets) {
    for (const enemy of state.enemies) {
      if (aabbCollide(bullet, enemy)) {
        bulletsToRemove.add(bullet.id);
        enemiesToRemove.add(enemy.id);
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
          const speed2 = 2 + Math.random() * 4;
          const t = Math.random();
          state.particles.push({
            id: state.nextId++,
            type: 'explosion',
            position: { x: enemy.position.x, y: enemy.position.y },
            velocity: {
              x: Math.cos(angle) * speed2,
              y: Math.sin(angle) * speed2,
            },
            size: 3 + Math.random() * 3,
            color: lerpColor('#FF5722', '#FFB300', t),
            alpha: 1,
            life: 30,
            maxLife: 30,
          } as ExplosionParticle);
        }
        state.prevScore = state.score;
        state.score += 100;
        state.scoreAnimTime = SCORE_ANIM_DURATION;
        break;
      }
    }
  }

  state.bullets = state.bullets.filter((b) => !bulletsToRemove.has(b.id));
  state.enemies = state.enemies.filter((e) => !enemiesToRemove.has(e.id));

  for (const enemy of state.enemies) {
    if (aabbCollide(state.player, enemy)) {
      state.gameOver = true;
      state.running = false;
      break;
    }
  }

  state.particles = state.particles.filter((p) => {
    p.position.x += p.velocity.x;
    p.position.y += p.velocity.y;
    p.alpha -= TRAIL_FADE;
    p.life--;
    return p.alpha > 0 && p.life > 0;
  });

  while (state.particles.length > MAX_PARTICLES) {
    state.particles.shift();
  }

  return state;
}

export function getState(state: GameState): GameState {
  return state;
}
