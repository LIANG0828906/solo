import { GameState, Debris, PowerUp } from './types';

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { width, height } = state;

  ctx.clearRect(0, 0, width, height);

  drawBackground(ctx, width, height);
  drawStars(ctx, state);
  drawPowerUps(ctx, state);
  drawDebrisAll(ctx, state);
  drawBeam(ctx, state);
  drawShip(ctx, state);
  drawParticles(ctx, state);
  drawScreenFlash(ctx, state);
  drawTimeSlowOverlay(ctx, state);
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
  grad.addColorStop(0, '#0a0a2e');
  grad.addColorStop(0.5, '#0d0b3a');
  grad.addColorStop(1, '#1a0a3e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const nebula1 = ctx.createRadialGradient(w * 0.2, h * 0.3, 0, w * 0.2, h * 0.3, w * 0.4);
  nebula1.addColorStop(0, 'rgba(30, 10, 60, 0.3)');
  nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, w, h);

  const nebula2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 0, w * 0.8, h * 0.7, w * 0.35);
  nebula2.addColorStop(0, 'rgba(10, 20, 50, 0.25)');
  nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = nebula2;
  ctx.fillRect(0, 0, w, h);
}

function drawStars(ctx: CanvasRenderingContext2D, state: GameState): void {
  const t = state.gameTime;
  for (const star of state.stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinklePhase);
    const alpha = star.brightness * twinkle;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
    ctx.fill();

    if (star.size > 1.5 && twinkle > 0.7) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 200, 255, ${alpha * 0.15})`;
      ctx.fill();
    }
  }
}

function drawShip(ctx: CanvasRenderingContext2D, state: GameState): void {
  const ship = state.ship;
  ctx.save();
  ctx.translate(ship.pos.x, ship.pos.y);
  ctx.rotate(ship.angle);

  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(-14, -11);
  ctx.lineTo(-8, -3);
  ctx.lineTo(-8, 3);
  ctx.lineTo(-14, 11);
  ctx.closePath();

  const bodyGrad = ctx.createLinearGradient(-14, 0, 24, 0);
  bodyGrad.addColorStop(0, '#3a5a8a');
  bodyGrad.addColorStop(0.5, '#5a8abf');
  bodyGrad.addColorStop(1, '#7fdbff');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(127, 219, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(6, -4);
  ctx.lineTo(6, 4);
  ctx.closePath();
  ctx.fillStyle = '#7fdbff';
  ctx.fill();

  if (state.shieldBoostActive) {
    ctx.beginPath();
    ctx.arc(0, 0, ship.radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(68, 136, 255, ${0.4 + 0.3 * Math.sin(state.gameTime * 5)})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, ship.radius + 12, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(68, 136, 255, ${0.08 + 0.05 * Math.sin(state.gameTime * 5)})`;
    ctx.fill();
  }

  ctx.restore();
}

function drawBeam(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.beamActive) return;

  const ship = state.ship;
  const frontX = ship.pos.x + Math.cos(ship.angle) * ship.radius;
  const frontY = ship.pos.y + Math.sin(ship.angle) * ship.radius;
  const targetX = state.mousePos.x;
  const targetY = state.mousePos.y;

  const pulse = 0.7 + 0.3 * Math.sin(state.gameTime * 8);

  ctx.save();

  for (let layer = 3; layer >= 0; layer--) {
    const width = (layer + 1) * 4;
    const alpha = (0.08 + (3 - layer) * 0.08) * pulse;

    ctx.beginPath();
    ctx.moveTo(frontX, frontY);
    ctx.lineTo(targetX, targetY);
    ctx.strokeStyle = `rgba(127, 219, 255, ${alpha})`;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(frontX, frontY);
  ctx.lineTo(targetX, targetY);
  ctx.strokeStyle = `rgba(200, 240, 255, ${0.6 * pulse})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (!state.isTouchDevice) {
    ctx.beginPath();
    ctx.arc(targetX, targetY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(127, 219, 255, ${0.5 * pulse})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const dist = Math.sqrt((targetX - frontX) ** 2 + (targetY - frontY) ** 2);
  const sparkCount = Math.floor(dist / 80);
  for (let i = 1; i <= sparkCount; i++) {
    const t = i / (sparkCount + 1);
    const sx = frontX + (targetX - frontX) * t + (Math.random() - 0.5) * 10;
    const sy = frontY + (targetY - frontY) * t + (Math.random() - 0.5) * 10;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 240, 255, ${0.5 * pulse})`;
    ctx.fill();
  }

  ctx.restore();
}

function drawDebrisAll(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const d of state.debris) {
    drawSingleDebris(ctx, d, state.gameTime);
  }
}

function drawSingleDebris(ctx: CanvasRenderingContext2D, d: Debris, time: number): void {
  ctx.save();
  ctx.globalAlpha = d.opacity;
  ctx.translate(d.pos.x, d.pos.y);
  ctx.rotate(d.rotation);

  switch (d.type) {
    case 'metal':
      drawMetalDebris(ctx, d);
      break;
    case 'satellite':
      drawSatelliteDebris(ctx, d, time);
      break;
    case 'fueltank':
      drawFuelTankDebris(ctx, d);
      break;
  }

  if (d.beingPulled) {
    ctx.beginPath();
    ctx.arc(0, 0, d.radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(127, 219, 255, ${0.5 * (1 - d.pullProgress)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

function drawMetalDebris(ctx: CanvasRenderingContext2D, d: Debris): void {
  if (d.vertices && d.vertices.length > 0) {
    ctx.beginPath();
    ctx.moveTo(d.vertices[0].x, d.vertices[0].y);
    for (let i = 1; i < d.vertices.length; i++) {
      ctx.lineTo(d.vertices[i].x, d.vertices[i].y);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, d.radius);
    grad.addColorStop(0, '#b0b8c8');
    grad.addColorStop(1, '#6a7080');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 190, 210, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawSatelliteDebris(ctx: CanvasRenderingContext2D, d: Debris, time: number): void {
  const w = d.radius * 0.6;
  const h = d.radius * 0.4;

  ctx.fillStyle = '#5a6270';
  ctx.fillRect(-w, -h, w * 2, h * 2);
  ctx.strokeStyle = 'rgba(140, 150, 170, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-w, -h, w * 2, h * 2);

  ctx.fillStyle = '#2a3a5a';
  ctx.fillRect(-d.radius, -h * 0.8, d.radius * 0.4, h * 1.6);
  ctx.fillRect(w * 0.6, -h * 0.8, d.radius * 0.4, h * 1.6);

  ctx.fillStyle = `rgba(40, 80, 140, ${0.6 + 0.2 * Math.sin(time * 2)})`;
  ctx.fillRect(-d.radius, -h * 0.6, d.radius * 0.4, h * 1.2);
  ctx.fillRect(w * 0.6, -h * 0.6, d.radius * 0.4, h * 1.2);

  ctx.strokeStyle = 'rgba(127, 219, 255, 0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.lineTo(w, 0);
  ctx.moveTo(0, -h);
  ctx.lineTo(0, h);
  ctx.stroke();
}

function drawFuelTankDebris(ctx: CanvasRenderingContext2D, d: Debris): void {
  const w = d.radius * 0.5;
  const h = d.radius * 0.8;

  ctx.beginPath();
  ctx.moveTo(-w, -h + w);
  ctx.arcTo(-w, -h, 0, -h, w);
  ctx.arcTo(w, -h, w, -h + w, w);
  ctx.lineTo(w, h - w);
  ctx.arcTo(w, h, 0, h, w);
  ctx.arcTo(-w, h, -w, h - w, w);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-w, 0, w, 0);
  grad.addColorStop(0, '#8a6a30');
  grad.addColorStop(0.5, '#c8a040');
  grad.addColorStop(1, '#8a6a30');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(200, 160, 64, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 200, 80, 0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, -h * 0.6);
  ctx.lineTo(-w * 0.5, h * 0.6);
  ctx.moveTo(w * 0.5, -h * 0.6);
  ctx.lineTo(w * 0.5, h * 0.6);
  ctx.stroke();
}

function drawPowerUps(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const p of state.powerUps) {
    drawSinglePowerUp(ctx, p, state.gameTime);
  }
}

function drawSinglePowerUp(ctx: CanvasRenderingContext2D, p: PowerUp, time: number): void {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.translate(p.pos.x, p.pos.y);
  ctx.rotate(p.rotation);

  const pulse = 1 + 0.15 * Math.sin(p.pulsePhase);
  ctx.scale(pulse, pulse);

  const color = powerUpColor(p.type);
  const glowColor = powerUpGlowColor(p.type);

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const r = p.radius;
    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();

  ctx.fillStyle = glowColor;
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const r = p.radius + 8;
    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.strokeStyle = colorWithAlpha(color, 0.2);
  ctx.lineWidth = 1;
  ctx.stroke();

  drawPowerUpIcon(ctx, p.type, p.radius * 0.5);

  ctx.restore();
}

function drawPowerUpIcon(ctx: CanvasRenderingContext2D, type: string, size: number): void {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;

  switch (type) {
    case 'shield':
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.8, -size * 0.3);
      ctx.lineTo(size * 0.8, size * 0.3);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.8, size * 0.3);
      ctx.lineTo(-size * 0.8, -size * 0.3);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'energy':
      ctx.beginPath();
      ctx.moveTo(-size * 0.3, -size);
      ctx.lineTo(size * 0.5, -size * 0.1);
      ctx.lineTo(-size * 0.1, -size * 0.1);
      ctx.lineTo(size * 0.3, size);
      ctx.lineTo(-size * 0.5, size * 0.1);
      ctx.lineTo(size * 0.1, size * 0.1);
      ctx.closePath();
      ctx.fill();
      break;
    case 'timeslow':
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -size * 0.5);
      ctx.moveTo(0, 0);
      ctx.lineTo(size * 0.35, size * 0.1);
      ctx.stroke();
      break;
  }
}

function powerUpColor(type: string): string {
  switch (type) {
    case 'shield': return 'rgba(68, 136, 255, 1)';
    case 'energy': return 'rgba(255, 221, 68, 1)';
    case 'timeslow': return 'rgba(204, 68, 255, 1)';
    default: return 'rgba(255, 255, 255, 1)';
  }
}

function powerUpGlowColor(type: string): string {
  switch (type) {
    case 'shield': return 'rgba(68, 136, 255, 0.25)';
    case 'energy': return 'rgba(255, 221, 68, 0.25)';
    case 'timeslow': return 'rgba(204, 68, 255, 0.25)';
    default: return 'rgba(255, 255, 255, 0.25)';
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const p of state.particles) {
    const alpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fillStyle = colorWithAlpha(p.color, alpha);
    ctx.fill();
  }
}

function colorWithAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${alpha})`);
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }
  return color;
}

function drawScreenFlash(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.screenFlash <= 0) return;
  ctx.fillStyle = state.screenFlashColor;
  ctx.globalAlpha = state.screenFlash * 0.3;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.globalAlpha = 1;
}

function drawTimeSlowOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.timeSlowActive) return;
  const grad = ctx.createRadialGradient(
    state.width / 2, state.height / 2, state.width * 0.2,
    state.width / 2, state.height / 2, state.width * 0.7
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(100, 40, 180, 0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, state.width, state.height);
}
