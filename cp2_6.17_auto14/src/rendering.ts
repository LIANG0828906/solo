export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface GroundCrack {
  x: number;
  y: number;
  lines: { angle: number; length: number }[];
  life: number;
  maxLife: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  facingRight: boolean;
  isAttacking: boolean;
  attackFrame: number;
  invincible: boolean;
  invincibleFlash: boolean;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'skeleton' | 'bat';
  hitFlash: boolean;
  facingRight: boolean;
}

export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameState {
  wave: number;
  kills: number;
  currentCombo: number;
  maxCombo: number;
  phase: 'playing' | 'victory';
  playerHealth: number;
  playerMaxHealth: number;
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number
): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1A1A2E');
  gradient.addColorStop(1, '#16213E');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const groundHeight = 80 * scale;
  const groundY = height - groundHeight;
  const brickWidth = 60 * scale;
  const brickHeight = 30 * scale;

  ctx.fillStyle = '#3D3D5C';
  ctx.fillRect(0, groundY, width, groundHeight);

  ctx.strokeStyle = '#2D2D4C';
  ctx.lineWidth = 1 * scale;

  for (let row = 0; row < Math.ceil(groundHeight / brickHeight); row++) {
    const offsetX = (row % 2) * (brickWidth / 2);
    for (let x = -brickWidth + offsetX; x < width + brickWidth; x += brickWidth) {
      const y = groundY + row * brickHeight;
      ctx.strokeRect(x, y, brickWidth, brickHeight);
    }
  }

  const pillarWidth = 40 * scale;
  ctx.fillStyle = '#0A0A14';
  ctx.fillRect(0, 0, pillarWidth, height);
  ctx.fillRect(width - pillarWidth, 0, pillarWidth, height);

  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(pillarWidth - 2 * scale, 0, 2 * scale, height);
  ctx.fillRect(width - pillarWidth, 0, 2 * scale, height);
}

export function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  _height: number,
  currentHealth: number,
  maxHealth: number
): void {
  const barWidth = 200;
  const barHeight = 20;
  const barX = x + (width - barWidth) / 2;
  const barY = y + 10;

  ctx.fillStyle = '#000000';
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const healthPercent = Math.max(0, currentHealth / maxHealth);
  const currentWidth = barWidth * healthPercent;

  let fillColor: string;
  if (healthPercent > 0.5) {
    fillColor = '#22c55e';
  } else if (healthPercent > 0.25) {
    fillColor = '#eab308';
  } else {
    fillColor = '#ef4444';
  }

  const healthGradient = ctx.createLinearGradient(barX, barY, barX + currentWidth, barY);
  healthGradient.addColorStop(0, fillColor);
  healthGradient.addColorStop(1, fillColor);

  ctx.fillStyle = healthGradient;
  ctx.fillRect(barX, barY, currentWidth, barHeight);

  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`血量: ${currentHealth}/${maxHealth}`, barX + barWidth / 2, barY + barHeight / 2);
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void {
  for (const particle of particles) {
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 3, 3);
  }
  ctx.globalAlpha = 1;
}

export function drawGroundCracks(
  ctx: CanvasRenderingContext2D,
  cracks: GroundCrack[],
  scale: number
): void {
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';
  for (const crack of cracks) {
    const alpha = crack.life / crack.maxLife;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    for (const line of crack.lines) {
      ctx.beginPath();
      ctx.moveTo(crack.x, crack.y);
      const endX = crack.x + Math.cos(line.angle) * line.length;
      const endY = crack.y + Math.sin(line.angle) * line.length;
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

export function drawDamageFlash(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: number
): void {
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}

export function drawUI(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  scale: number
): void {
  const canvas = ctx.canvas;
  const x = canvas.width - 20 * scale;
  let y = 20 * scale;
  const fontSize = 18 * scale;

  ctx.font = `bold ${fontSize}px 'Times New Roman', serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  const textShadowOffset = 2 * scale;

  ctx.fillStyle = '#000000';
  ctx.fillText(`波次: ${gameState.wave}`, x + textShadowOffset, y + textShadowOffset);
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`波次: ${gameState.wave}`, x, y);

  y += fontSize + 5 * scale;

  ctx.fillStyle = '#000000';
  ctx.fillText(`击杀: ${gameState.kills}`, x + textShadowOffset, y + textShadowOffset);
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`击杀: ${gameState.kills}`, x, y);

  y += fontSize + 5 * scale;

  ctx.fillStyle = '#000000';
  ctx.fillText(`连击: ${gameState.currentCombo} (最高: ${gameState.maxCombo})`, x + textShadowOffset, y + textShadowOffset);
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`连击: ${gameState.currentCombo} (最高: ${gameState.maxCombo})`, x, y);
}

export function drawVictory(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: Particle[],
  time: number
): void {
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  const fontSize = 80;
  ctx.font = `bold ${fontSize}px 'Times New Roman', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textY = height / 2 - 50 + Math.sin(time * 0.003) * 10;

  ctx.fillStyle = '#000000';
  ctx.fillText('Victory!', width / 2 + 4, textY + 4);

  const gradient = ctx.createLinearGradient(width / 2 - 200, textY, width / 2 + 200, textY);
  gradient.addColorStop(0, '#FFD700');
  gradient.addColorStop(0.5, '#FFA500');
  gradient.addColorStop(1, '#FFD700');
  ctx.fillStyle = gradient;
  ctx.fillText('Victory!', width / 2, textY);

  for (const particle of particles) {
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    const hue = (time * 0.1 + particle.x * 0.5) % 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
    ctx.fillRect(particle.x, particle.y, 4, 4);
  }
  ctx.globalAlpha = 1;
}

export function drawControlsHint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#888888';
  ctx.fillText('WASD移动，J攻击，R重置', x, y);
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  scale: number
): void {
  if (player.invincible && player.invincibleFlash) {
    return;
  }

  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

  if (!player.facingRight) {
    ctx.scale(-1, 1);
  }

  const w = player.width;
  const h = player.height;

  ctx.fillStyle = '#1E40AF';
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2 + 10 * scale);
  ctx.lineTo(-w / 2 - 5 * scale, h / 2);
  ctx.lineTo(w / 2 + 5 * scale, h / 2);
  ctx.lineTo(w / 2, -h / 2 + 10 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(-w / 2 + 3 * scale, -h / 2 + 12 * scale, w - 6 * scale, h - 20 * scale);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1 * scale;
  ctx.strokeRect(-w / 2 + 3 * scale, -h / 2 + 12 * scale, w - 6 * scale, h - 20 * scale);

  ctx.fillStyle = '#C0C0C0';
  ctx.beginPath();
  ctx.arc(0, -h / 2 + 8 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.fillRect(3 * scale, -h / 2 + 5 * scale, 4 * scale, 4 * scale);

  ctx.fillStyle = '#808080';
  ctx.fillRect(-w / 2 + 2 * scale, h / 2 - 8 * scale, 8 * scale, 8 * scale);
  ctx.fillRect(w / 2 - 10 * scale, h / 2 - 8 * scale, 8 * scale, 8 * scale);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1 * scale;
  ctx.strokeRect(-w / 2 + 2 * scale, h / 2 - 8 * scale, 8 * scale, 8 * scale);
  ctx.strokeRect(w / 2 - 10 * scale, h / 2 - 8 * scale, 8 * scale, 8 * scale);

  if (player.isAttacking) {
    const swordAngle = (player.attackFrame / 10) * Math.PI * 0.8 - Math.PI * 0.4;
    ctx.save();
    ctx.translate(w / 2 - 5 * scale, 0);
    ctx.rotate(swordAngle);

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2 * scale, -3 * scale, 15 * scale, 6 * scale);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(-2 * scale, -3 * scale, 15 * scale, 6 * scale);

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(13 * scale, -5 * scale, 6 * scale, 10 * scale);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(13 * scale, -5 * scale, 6 * scale, 10 * scale);

    ctx.fillStyle = '#E8E8E8';
    ctx.beginPath();
    ctx.moveTo(19 * scale, -2 * scale);
    ctx.lineTo(50 * scale, 0);
    ctx.lineTo(19 * scale, 2 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  scale: number
): void {
  ctx.save();
  ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

  if (!enemy.facingRight) {
    ctx.scale(-1, 1);
  }

  const w = enemy.width;
  const h = enemy.height;

  if (enemy.type === 'skeleton') {
    ctx.fillStyle = enemy.hitFlash ? '#ffffff' : '#E8E8E8';
    ctx.fillRect(-w / 2 + 4 * scale, -h / 2 + 12 * scale, w - 8 * scale, h - 16 * scale);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(-w / 2 + 4 * scale, -h / 2 + 12 * scale, w - 8 * scale, h - 16 * scale);

    ctx.fillStyle = enemy.hitFlash ? '#ffffff' : '#F0F0F0';
    ctx.beginPath();
    ctx.arc(0, -h / 2 + 8 * scale, 10 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-4 * scale, -h / 2 + 7 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.arc(4 * scale, -h / 2 + 7 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.hitFlash ? '#ffffff' : '#E0E0E0';
    ctx.fillRect(-w / 2 + 3 * scale, h / 2 - 4 * scale, 6 * scale, 4 * scale);
    ctx.fillRect(w / 2 - 9 * scale, h / 2 - 4 * scale, 6 * scale, 4 * scale);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(-w / 2 + 3 * scale, h / 2 - 4 * scale, 6 * scale, 4 * scale);
    ctx.strokeRect(w / 2 - 9 * scale, h / 2 - 4 * scale, 6 * scale, 4 * scale);
  } else {
    const wingFlap = Math.sin(Date.now() * 0.02) * 0.3;

    ctx.fillStyle = enemy.hitFlash ? '#ffffff' : '#4B0082';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-w / 2 - 10 * scale, -h / 2 + wingFlap * 10 * scale);
    ctx.lineTo(-w / 2, 0);
    ctx.lineTo(-w / 2 - 10 * scale, h / 2 - wingFlap * 10 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    ctx.fillStyle = enemy.hitFlash ? '#ffffff' : '#4B0082';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w / 2 + 10 * scale, -h / 2 + wingFlap * 10 * scale);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w / 2 + 10 * scale, h / 2 - wingFlap * 10 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    ctx.fillStyle = enemy.hitFlash ? '#ffffff' : '#6B238E';
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2 - 2 * scale, h / 2 - 2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(-5 * scale, -3 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.arc(5 * scale, -3 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawAttackHitbox(
  ctx: CanvasRenderingContext2D,
  hitbox: Hitbox,
  alpha: number
): void {
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
  ctx.globalAlpha = 1;
}
