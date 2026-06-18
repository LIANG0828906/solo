export interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  pulseSpeed: number;
  phase: number;
}

export interface Debris {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'recyclable' | 'dangerous';
  size: number;
  angle: number;
  beingTractored: boolean;
  haloAngle: number;
  dirChangeTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  active: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface WaveAnnouncement {
  text: string;
  timer: number;
  maxTimer: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
}

export interface ScreenShake {
  x: number;
  y: number;
  timer: number;
}

export interface GameState {
  player: PlayerState;
  debris: Debris[];
  particles: Particle[];
  stars: Star[];
  score: number;
  lives: number;
  maxLives: number;
  energy: number;
  isTractoring: boolean;
  tractoredDebrisId: number | null;
  gameOver: boolean;
  gameStarted: boolean;
  wave: number;
  waveTimer: number;
  waveAnnouncement: WaveAnnouncement | null;
  boostActive: boolean;
  boostTimer: number;
  boostCountdown: number;
  recycledCount: number;
  screenShake: ScreenShake;
  flashRed: number;
  floatingTexts: FloatingText[];
  hitAnimTimer: number;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  canvasWidth: number;
  canvasHeight: number;
  debrisIdCounter: number;
  dangerousBaseSpeed: number;
  time: number;
}

export function createStars(width: number, height: number, count: number = 200): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.5 + Math.random() * 2,
      baseAlpha: 0.3 + Math.random() * 0.7,
      pulseSpeed: (Math.PI * 2) / (1 + Math.random() * 2),
      phase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export function createDebris(
  width: number,
  height: number,
  count: number,
  recyclableRatio: number,
  baseDangerSpeed: number,
  startId: number = 0
): Debris[] {
  const debris: Debris[] = [];
  const recyclableCount = Math.floor(count * recyclableRatio);
  let id = startId;

  for (let i = 0; i < count; i++) {
    const isRecyclable = i < recyclableCount;
    const type = isRecyclable ? 'recyclable' : 'dangerous';
    const size = isRecyclable
      ? 8 + Math.random() * 8
      : 6 + Math.random() * 6;
    const speed = isRecyclable
      ? 0.5 + Math.random() * 1.0
      : baseDangerSpeed + Math.random() * (5 - baseDangerSpeed);
    const angle = Math.random() * Math.PI * 2;

    const margin = 60;
    debris.push({
      id: id++,
      x: margin + Math.random() * (width - margin * 2),
      y: margin + Math.random() * (height - margin * 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      type,
      size,
      angle: Math.random() * Math.PI * 2,
      beingTractored: false,
      haloAngle: 0,
      dirChangeTimer: 60 + Math.random() * 120,
    });
  }

  return debris;
}

export function createParticlePool(poolSize: number = 400): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < poolSize; i++) {
    particles.push({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 2,
      r: 69,
      g: 162,
      b: 158,
      active: false,
    });
  }
  return particles;
}

export function createInitialState(width: number, height: number): GameState {
  const recyclableRatio = 3 / 4;
  const initialDebrisCount = 40;
  const baseDangerSpeed = 2;

  return {
    player: {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      angle: 0,
    },
    debris: createDebris(width, height, initialDebrisCount, recyclableRatio, baseDangerSpeed),
    particles: createParticlePool(400),
    stars: createStars(width, height),
    score: 0,
    lives: 5,
    maxLives: 5,
    energy: 100,
    isTractoring: false,
    tractoredDebrisId: null,
    gameOver: false,
    gameStarted: false,
    wave: 1,
    waveTimer: 90,
    waveAnnouncement: { text: '第 1 波', timer: 0.5, maxTimer: 0.5 },
    boostActive: false,
    boostTimer: 0,
    boostCountdown: 0,
    recycledCount: 0,
    screenShake: { x: 0, y: 0, timer: 0 },
    flashRed: 0,
    floatingTexts: [],
    hitAnimTimer: 0,
    mouseX: width / 2,
    mouseY: height / 2,
    mouseDown: false,
    canvasWidth: width,
    canvasHeight: height,
    debrisIdCounter: initialDebrisCount,
    dangerousBaseSpeed: baseDangerSpeed,
    time: 0,
  };
}
