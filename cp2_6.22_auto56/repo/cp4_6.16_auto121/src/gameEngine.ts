export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: BrickColor;
  hits: number;
  maxHits: number;
  alive: boolean;
}

export type BrickColor = 'red' | 'orange' | 'yellow' | 'green';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Glow {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  trail: { x: number; y: number; alpha: number }[];
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  curve: number;
}

export interface GameState {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  bricks: Brick[];
  ball: Ball;
  paddle: Paddle;
  particles: Particle[];
  glows: Glow[];
}

const BRICK_COLORS: Record<BrickColor, string> = {
  red: '#ff4757',
  orange: '#ffa502',
  yellow: '#ffd32a',
  green: '#2ed573'
};

const BRICK_HITS: Record<BrickColor, number> = {
  red: 4,
  orange: 1,
  yellow: 1,
  green: 1
};

const NEXT_COLOR: Record<BrickColor, BrickColor | null> = {
  red: 'orange',
  orange: 'yellow',
  yellow: 'green',
  green: null
};

const GRAVITY = 0.035;
const BRICK_ROWS = 3;
const BRICK_COLS = 8;
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 25;
const BRICK_PADDING = 2;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 60;

const PADDLE_WIDTH = 160;
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 9;

const BALL_RADIUS = 8;
const BALL_SPEED = 7;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

function loadHighScore(): number {
  const stored = localStorage.getItem('brickBreaker_highScore');
  return stored ? parseInt(stored, 10) : 0;
}

function saveHighScore(score: number): void {
  localStorage.setItem('brickBreaker_highScore', score.toString());
}

function getRandomLaunchVelocity(): { vx: number; vy: number } {
  const angle = (Math.random() * 0.6 + 0.2) * Math.PI;
  return {
    vx: Math.cos(angle) * BALL_SPEED,
    vy: -Math.abs(Math.sin(angle)) * BALL_SPEED
  };
}

export function createGameState(level: number = 1): GameState {
  const paddle: Paddle = {
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    curve: 8
  };

  const launchVel = getRandomLaunchVelocity();
  const ball: Ball = {
    x: CANVAS_WIDTH / 2,
    y: paddle.y - BALL_RADIUS - 2,
    vx: launchVel.vx,
    vy: launchVel.vy,
    radius: BALL_RADIUS,
    trail: []
  };

  return {
    score: 0,
    highScore: loadHighScore(),
    lives: 3,
    level,
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    bricks: generateBricks(level),
    ball,
    paddle,
    particles: [],
    glows: []
  };
}

export function generateBricks(level: number): Brick[] {
  const rows = Math.min(BRICK_ROWS + level - 1, 8);
  const bricks: Brick[] = [];
  const colors: BrickColor[] = ['red', 'orange', 'yellow', 'green'];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      let color: BrickColor;
      if (level === 1) {
        color = colors[Math.min(row, 3)];
      } else {
        color = colors[Math.floor(Math.random() * 4)];
      }

      const maxHits = BRICK_HITS[color];
      bricks.push({
        x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        color,
        hits: 0,
        maxHits,
        alive: true
      });
    }
  }

  return bricks;
}

export function loadLevelBricks(levelData: number[][]): Brick[] {
  const bricks: Brick[] = [];
  const colors: BrickColor[] = ['green', 'yellow', 'orange', 'red'];

  for (let row = 0; row < levelData.length; row++) {
    for (let col = 0; col < levelData[row].length; col++) {
      const colorIndex = levelData[row][col];
      if (colorIndex > 0 && colorIndex <= 4) {
        const color = colors[colorIndex - 1];
        const maxHits = BRICK_HITS[color];
        bricks.push({
          x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING),
          y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color,
          hits: 0,
          maxHits,
          alive: true
        });
      }
    }
  }

  return bricks;
}

export function createParticles(x: number, y: number, color: string, count: number = 12): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      color,
      life: 0.5,
      maxLife: 0.5
    });
  }
  return particles;
}

export function createGlow(x: number, y: number, color: string): Glow {
  return {
    x,
    y,
    radius: 5,
    maxRadius: 40,
    color,
    life: 0.4,
    maxLife: 0.4
  };
}

export function checkCircleRectCollision(
  cx: number, cy: number, radius: number,
  rx: number, ry: number, rw: number, rh: number
): { collision: boolean; side: 'top' | 'bottom' | 'left' | 'right' | null } {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));

  const dx = cx - closestX;
  const dy = cy - closestY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < radius) {
    let side: 'top' | 'bottom' | 'left' | 'right' | null = null;

    if (cy < ry) {
      side = 'top';
    } else if (cy > ry + rh) {
      side = 'bottom';
    } else if (cx < rx) {
      side = 'left';
    } else if (cx > rx + rw) {
      side = 'right';
    }

    return { collision: true, side };
  }

  return { collision: false, side: null };
}

export function updateGame(
  state: GameState,
  deltaTime: number,
  input: { left: boolean; right: boolean }
): GameState {
  if (!state.isPlaying || state.isGameOver || state.isPaused) {
    return state;
  }

  const newState = { ...state };
  const dt = deltaTime / 16.67;

  if (input.left) {
    newState.paddle = {
      ...newState.paddle,
      x: Math.max(0, newState.paddle.x - PADDLE_SPEED * dt)
    };
  }
  if (input.right) {
    newState.paddle = {
      ...newState.paddle,
      x: Math.min(CANVAS_WIDTH - newState.paddle.width, newState.paddle.x + PADDLE_SPEED * dt)
    };
  }

  newState.ball = { ...newState.ball };
  newState.ball.trail = [...newState.ball.trail];

  newState.ball.trail.unshift({ x: newState.ball.x, y: newState.ball.y, alpha: 0.6 });
  if (newState.ball.trail.length > 10) {
    newState.ball.trail.pop();
  }
  newState.ball.trail.forEach((t, i) => {
    t.alpha = 0.6 * (1 - i / newState.ball.trail.length);
  });

  newState.ball.vy += GRAVITY * dt;
  newState.ball.x += newState.ball.vx * dt;
  newState.ball.y += newState.ball.vy * dt;

  if (newState.ball.x - newState.ball.radius < 0) {
    newState.ball.x = newState.ball.radius;
    newState.ball.vx = Math.abs(newState.ball.vx);
  }
  if (newState.ball.x + newState.ball.radius > CANVAS_WIDTH) {
    newState.ball.x = CANVAS_WIDTH - newState.ball.radius;
    newState.ball.vx = -Math.abs(newState.ball.vx);
  }
  if (newState.ball.y - newState.ball.radius < 0) {
    newState.ball.y = newState.ball.radius;
    newState.ball.vy = Math.abs(newState.ball.vy);
  }

  const paddleCollision = checkCircleRectCollision(
    newState.ball.x, newState.ball.y, newState.ball.radius,
    newState.paddle.x, newState.paddle.y,
    newState.paddle.width, newState.paddle.height
  );

  if (paddleCollision.collision && paddleCollision.side === 'top' && newState.ball.vy > 0) {
    newState.ball.y = newState.paddle.y - newState.ball.radius;
    const hitPoint = (newState.ball.x - newState.paddle.x) / newState.paddle.width;
    const angle = (hitPoint - 0.5) * Math.PI * 0.7;
    const speed = Math.sqrt(newState.ball.vx ** 2 + newState.ball.vy ** 2);
    newState.ball.vx = Math.sin(angle) * speed;
    newState.ball.vy = -Math.abs(Math.cos(angle) * speed);
  }

  if (newState.ball.y + newState.ball.radius > CANVAS_HEIGHT) {
    newState.lives -= 1;
    if (newState.lives <= 0) {
      newState.isGameOver = true;
      newState.isPlaying = false;
      if (newState.score > newState.highScore) {
        newState.highScore = newState.score;
        saveHighScore(newState.highScore);
      }
    } else {
      newState.ball.x = newState.paddle.x + newState.paddle.width / 2;
      newState.ball.y = newState.paddle.y - newState.ball.radius - 2;
      const launchVel = getRandomLaunchVelocity();
      newState.ball.vx = launchVel.vx;
      newState.ball.vy = launchVel.vy;
      newState.ball.trail = [];
    }
  }

  newState.bricks = newState.bricks.map(brick => {
    if (!brick.alive) return brick;

    const collision = checkCircleRectCollision(
      newState.ball.x, newState.ball.y, newState.ball.radius,
      brick.x, brick.y, brick.width, brick.height
    );

    if (collision.collision) {
      const newBrick = { ...brick, hits: brick.hits + 1 };

      if (collision.side === 'top' || collision.side === 'bottom') {
        newState.ball.vy = -newState.ball.vy;
      } else {
        newState.ball.vx = -newState.ball.vx;
      }

      if (newBrick.hits >= newBrick.maxHits) {
        newBrick.alive = false;
        newState.score += 10 * newBrick.maxHits;
        newState.particles = [
          ...newState.particles,
          ...createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, BRICK_COLORS[brick.color])
        ];
      } else {
        const nextColor = NEXT_COLOR[newBrick.color];
        if (nextColor) {
          newBrick.color = nextColor;
          newBrick.maxHits = BRICK_HITS[nextColor];
          newBrick.hits = 0;
        }
      }

      newState.glows = [
        ...newState.glows,
        createGlow(brick.x + brick.width / 2, brick.y + brick.height / 2, BRICK_COLORS[brick.color])
      ];

      return newBrick;
    }

    return brick;
  });

  const aliveBricks = newState.bricks.filter(b => b.alive);
  if (aliveBricks.length === 0 && !newState.isGameOver) {
    newState.level += 1;
    newState.bricks = generateBricks(newState.level);
    newState.ball.x = newState.paddle.x + newState.paddle.width / 2;
    newState.ball.y = newState.paddle.y - newState.ball.radius - 2;
    const launchVel = getRandomLaunchVelocity();
    newState.ball.vx = launchVel.vx;
    newState.ball.vy = launchVel.vy;
    newState.ball.trail = [];
    newState.isPaused = true;
  }

  newState.particles = newState.particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + GRAVITY * 0.3 * dt,
      life: p.life - deltaTime / 1000
    }))
    .filter(p => p.life > 0);

  newState.glows = newState.glows
    .map(g => ({
      ...g,
      radius: g.radius + (g.maxRadius - g.radius) * 0.15 * dt,
      life: g.life - deltaTime / 1000
    }))
    .filter(g => g.life > 0);

  return newState;
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  state.glows.forEach(glow => {
    const alpha = glow.life / glow.maxLife;
    const glowGradient = ctx.createRadialGradient(
      glow.x, glow.y, 0,
      glow.x, glow.y, glow.radius
    );
    glowGradient.addColorStop(0, glow.color + Math.floor(alpha * 100).toString(16).padStart(2, '0'));
    glowGradient.addColorStop(1, glow.color + '00');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(glow.x, glow.y, glow.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  state.bricks.forEach(brick => {
    if (!brick.alive) return;

    const color = BRICK_COLORS[brick.color];
    const brickGradient = ctx.createLinearGradient(
      brick.x, brick.y, brick.x, brick.y + brick.height
    );
    brickGradient.addColorStop(0, lightenColor(color, 30));
    brickGradient.addColorStop(1, color);

    ctx.fillStyle = brickGradient;
    roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 4);
    ctx.fill();

    ctx.strokeStyle = lightenColor(color, 50);
    ctx.lineWidth = 1;
    roundRect(ctx, brick.x + 0.5, brick.y + 0.5, brick.width - 1, brick.height - 1, 4);
    ctx.stroke();
  });

  state.particles.forEach(particle => {
    const alpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.fillRect(
      particle.x - particle.size / 2,
      particle.y - particle.size / 2,
      particle.size,
      particle.size
    );
  });

  state.ball.trail.forEach((t, i) => {
    const radius = state.ball.radius * (1 - i * 0.07);
    ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  const ballGradient = ctx.createRadialGradient(
    state.ball.x - 2, state.ball.y - 2, 0,
    state.ball.x, state.ball.y, state.ball.radius
  );
  ballGradient.addColorStop(0, '#ffffff');
  ballGradient.addColorStop(1, '#a0d8ef');
  ctx.fillStyle = ballGradient;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fill();

  const paddleGradient = ctx.createLinearGradient(
    state.paddle.x, state.paddle.y,
    state.paddle.x, state.paddle.y + state.paddle.height
  );
  paddleGradient.addColorStop(0, '#e8f4f8');
  paddleGradient.addColorStop(0.5, '#b8d4e3');
  paddleGradient.addColorStop(1, '#8ab6c7');

  ctx.fillStyle = paddleGradient;
  roundRect(ctx, state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height, state.paddle.curve);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, state.paddle.x + 0.5, state.paddle.y + 0.5, state.paddle.width - 1, state.paddle.height - 1, state.paddle.curve);
  ctx.stroke();

  drawHUD(ctx, state);
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px Orbitron, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`得分: ${state.score}`, 20, 30);

  ctx.textAlign = 'center';
  ctx.fillText(`第 ${state.level} 关`, CANVAS_WIDTH / 2, 30);

  ctx.textAlign = 'right';
  ctx.fillText('生命:', CANVAS_WIDTH - 110, 30);

  for (let i = 0; i < state.lives; i++) {
    drawHeart(ctx, CANVAS_WIDTH - 90 + i * 28, 22, 10, '#ff6b6b');
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
  ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size);
  ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number, height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export { CANVAS_WIDTH, CANVAS_HEIGHT, BRICK_WIDTH, BRICK_HEIGHT, BRICK_PADDING, BRICK_OFFSET_TOP, BRICK_OFFSET_LEFT, BRICK_COLS, BRICK_ROWS, BRICK_COLORS };
