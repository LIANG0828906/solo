export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  WIN = 'WIN',
}

export enum PowerUpType {
  WIDER_PADDLE = 'WIDER_PADDLE',
  SPLIT_BALL = 'SPLIT_BALL',
  PIERCING = 'PIERCING',
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
  hp: number;
  maxHp: number;
  color: string;
  lightColor: string;
  flickering: boolean;
  flickerTimer: number;
  alive: boolean;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isPiercing: boolean;
  piercingTimer: number;
  trail: { x: number; y: number; life: number }[];
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  baseWidth: number;
  widenedTimer: number;
  targetX: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  lod: number;
}

export interface BrickFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
  height: number;
  rotation: number;
  rotSpeed: number;
}

export interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
  width: number;
  height: number;
  lightPillarAlpha: number;
}

export interface WinLetter {
  char: string;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  particles: { x: number; y: number; vx: number; vy: number }[];
  alpha: number;
  flickerTimer: number;
}

const ROW_COLORS = [
  { color: '#ff2255', light: '#ff7799' },
  { color: '#ff6622', light: '#ffaa77' },
  { color: '#ffcc00', light: '#ffee77' },
  { color: '#22ff66', light: '#88ffaa' },
  { color: '#2266ff', light: '#77aaff' },
  { color: '#aa22ff', light: '#cc77ff' },
];

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const BRICK_ROWS = 6;
export const BRICK_COLS_BASE = 10;
export const BRICK_HEIGHT = 22;
export const BRICK_PADDING = 4;
export const BRICK_TOP_OFFSET = 80;
export const PADDLE_HEIGHT = 14;
export const PADDLE_BASE_WIDTH = 120;
export const BALL_RADIUS = 7;
export const BALL_BASE_SPEED = 380;
export const MAX_LIVES = 3;

export class GameState {
  phase: GamePhase = GamePhase.MENU;
  score: number = 0;
  lives: number = MAX_LIVES;
  level: number = 1;
  bricks: Brick[] = [];
  balls: Ball[] = [];
  paddle!: Paddle;
  particles: Particle[] = [];
  fragments: BrickFragment[] = [];
  powerUps: PowerUp[] = [];
  winLetters: WinLetter[] = [];
  winAnimationTimer: number = 0;
  titleFloatTimer: number = 0;
  titleColorTimer: number = 0;
  shakeTimer: number = 0;
  shakeIntensity: number = 0;
  flashAlpha: number = 0;

  constructor() {
    this.paddle = this.createPaddle();
  }

  createPaddle(): Paddle {
    return {
      x: GAME_WIDTH / 2 - PADDLE_BASE_WIDTH / 2,
      y: GAME_HEIGHT - 40,
      width: PADDLE_BASE_WIDTH,
      height: PADDLE_HEIGHT,
      baseWidth: PADDLE_BASE_WIDTH,
      widenedTimer: 0,
      targetX: GAME_WIDTH / 2 - PADDLE_BASE_WIDTH / 2,
    };
  }

  createBall(): Ball {
    const speed = BALL_BASE_SPEED * Math.pow(1.1, this.level - 1);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    return {
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y - BALL_RADIUS - 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: BALL_RADIUS,
      isPiercing: false,
      piercingTimer: 0,
      trail: [],
    };
  }

  initLevel(): void {
    this.bricks = [];
    this.balls = [];
    this.powerUps = [];
    this.particles = [];
    this.fragments = [];
    this.winLetters = [];
    this.winAnimationTimer = 0;

    const cols = BRICK_COLS_BASE + Math.floor((this.level - 1) / 2);
    const totalPadding = (cols + 1) * BRICK_PADDING;
    const brickWidth = (GAME_WIDTH - totalPadding) / cols;

    for (let row = 0; row < BRICK_ROWS; row++) {
      let hp: number;
      if (row < 2) hp = 1;
      else if (row < 4) hp = 2;
      else hp = 3;

      const colorInfo = ROW_COLORS[row];

      for (let col = 0; col < cols; col++) {
        this.bricks.push({
          x: BRICK_PADDING + col * (brickWidth + BRICK_PADDING),
          y: BRICK_TOP_OFFSET + row * (BRICK_HEIGHT + BRICK_PADDING),
          width: brickWidth,
          height: BRICK_HEIGHT,
          row,
          col,
          hp,
          maxHp: hp,
          color: colorInfo.color,
          lightColor: colorInfo.light,
          flickering: false,
          flickerTimer: 0,
          alive: true,
        });
      }
    }

    this.paddle = this.createPaddle();
    this.balls.push(this.createBall());
  }

  startGame(): void {
    this.phase = GamePhase.PLAYING;
    this.score = 0;
    this.lives = MAX_LIVES;
    this.level = 1;
    this.initLevel();
  }

  nextLevel(): void {
    this.level++;
    this.initLevel();
  }

  addScore(points: number): void {
    this.score += points;
  }

  loseLife(): void {
    this.lives--;
    this.shakeTimer = 0.3;
    this.shakeIntensity = 6;
    if (this.lives <= 0) {
      this.phase = GamePhase.GAME_OVER;
    } else {
      this.balls = [this.createBall()];
    }
  }

  allBricksDestroyed(): boolean {
    return this.bricks.every((b) => !b.alive);
  }

  triggerWin(): void {
    this.phase = GamePhase.WIN;
    this.winAnimationTimer = 0;
    this.winLetters = [];
    const text = 'YOU WIN!';
    const spacing = 50;
    const startX = GAME_WIDTH / 2 - (text.length * spacing) / 2;
    for (let i = 0; i < text.length; i++) {
      this.winLetters.push({
        char: text[i],
        targetX: startX + i * spacing,
        targetY: GAME_HEIGHT / 2 - 20,
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
        particles: [],
        alpha: 0,
        flickerTimer: 0,
      });
    }
  }

  update(dt: number): void {
    this.titleFloatTimer += dt;
    this.titleColorTimer += dt;

    if (this.shakeTimer > 0) this.shakeTimer -= dt;
    if (this.flashAlpha > 0) this.flashAlpha -= dt * 3;

    if (this.paddle.widenedTimer > 0) {
      this.paddle.widenedTimer -= dt;
      if (this.paddle.widenedTimer <= 0) {
        this.paddle.width = this.paddle.baseWidth;
      }
    }

    for (const brick of this.bricks) {
      if (brick.flickering) {
        brick.flickerTimer -= dt;
        if (brick.flickerTimer <= 0) {
          brick.flickering = false;
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vy += 300 * dt;
      f.rotation += f.rotSpeed * dt;
      f.life -= dt;
      if (f.life <= 0) {
        this.fragments.splice(i, 1);
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.y += pu.vy * dt;
      pu.lightPillarAlpha = 0.3 + 0.15 * Math.sin(Date.now() * 0.005);
      if (pu.y > GAME_HEIGHT + 40) {
        this.powerUps.splice(i, 1);
      }
    }

    for (const ball of this.balls) {
      if (ball.piercingTimer > 0) {
        ball.piercingTimer -= dt;
        if (ball.piercingTimer <= 0) {
          ball.isPiercing = false;
        }
      }
      ball.trail.unshift({ x: ball.x, y: ball.y, life: 0.25 });
      for (let i = ball.trail.length - 1; i >= 0; i--) {
        ball.trail[i].life -= dt;
        if (ball.trail[i].life <= 0) {
          ball.trail.splice(i, 1);
        }
      }
      if (ball.trail.length > 15) {
        ball.trail.length = 15;
      }
    }

    if (this.phase === GamePhase.WIN) {
      this.winAnimationTimer += dt;
      for (const letter of this.winLetters) {
        const t = Math.min(1, this.winAnimationTimer * 0.8);
        letter.x = letter.x + (letter.targetX - letter.x) * (1 - Math.pow(1 - t, 3)) * 0.05;
        letter.y = letter.y + (letter.targetY - letter.y) * (1 - Math.pow(1 - t, 3)) * 0.05;
        letter.alpha = Math.min(1, this.winAnimationTimer * 1.5);
        letter.flickerTimer += dt;
      }
    }

    if (this.particles.length > 200) {
      for (const p of this.particles) {
        if (p.lod === 0) {
          p.lod = 1;
        }
      }
    } else {
      for (const p of this.particles) {
        p.lod = 0;
      }
    }
  }
}
