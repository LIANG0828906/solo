import type { CreatureData, InteractionType } from '../game/creature';
import type { LabLayout, Particle } from './labRenderer';

interface CreatureParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  shape: 'circle' | 'star' | 'ember' | 'leaf' | 'bubble';
  rotation: number;
  rotSpeed: number;
}

interface InteractionFeedback {
  type: InteractionType;
  timer: number;
  x: number;
  y: number;
}

let creatureParticles: CreatureParticle[] = [];
let interactionFeedbacks: InteractionFeedback[] = [];
let displayHunger = 30;
let displayMood = 30;
let displayBond = 10;
let targetHunger = 30;
let targetMood = 30;
let targetBond = 10;
let celebrationStarted = false;

function drawCreatureBody(ctx: CanvasRenderingContext2D, creature: CreatureData, x: number, y: number, time: number) {
  ctx.save();
  ctx.globalAlpha = creature.opacity;
  const s = creature.size;
  const breathe = Math.sin(time * 0.003) * 2 * s;
  const headBob = Math.sin(time * 0.002) * 3 * s;
  const turnAngle = Math.sin(time * 0.001) * 0.1;
  ctx.translate(x, y);
  ctx.rotate(turnAngle);
  switch (creature.type) {
    case 'dragon':
    case 'ancient_dragon': {
      const isAncient = creature.type === 'ancient_dragon';
      const scale = isAncient ? s * 1.2 : s;
      ctx.fillStyle = creature.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, breathe, 35 * scale, 25 * scale + breathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isAncient ? '#4A2A5A' : '#3A2A4A';
      ctx.beginPath();
      ctx.ellipse(0, breathe, 30 * scale, 20 * scale + breathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = creature.bodyColor;
      ctx.beginPath();
      ctx.ellipse(-30 * scale, -15 * scale + headBob, 18 * scale, 14 * scale, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = creature.eyeColor;
      ctx.beginPath();
      ctx.arc(-35 * scale, -18 * scale + headBob, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-35.5 * scale, -18 * scale + headBob, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = creature.bodyColor;
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(20 * scale, breathe);
      ctx.quadraticCurveTo(40 * scale, breathe - 30 * scale, 55 * scale, breathe - 40 * scale + headBob);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const wingAngle = Math.sin(time * 0.004 + i) * 0.2;
        ctx.save();
        ctx.translate(-5 * scale, -5 * scale + breathe);
        ctx.rotate(-0.8 + wingAngle);
        ctx.fillStyle = isAncient ? 'rgba(100,50,120,0.6)' : 'rgba(60,40,80,0.5)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-40 * scale, -25 * scale);
        ctx.lineTo(-20 * scale, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = creature.eyeColor;
      ctx.lineWidth = 2 * scale;
      for (let i = 0; i < 5; i++) {
        const sx = -30 * scale - i * 2 * scale;
        const sy = -5 * scale + breathe + i * 4 * scale;
        ctx.beginPath();
        ctx.moveTo(25 * scale, sy);
        ctx.lineTo(55 * scale, sy - 5 * scale);
        ctx.stroke();
      }
      break;
    }
    case 'hellhound': {
      ctx.fillStyle = creature.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, breathe, 30 * s, 20 * s + breathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-25 * s, -10 * s + headBob, 15 * s, 12 * s, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = creature.eyeColor;
      ctx.beginPath();
      ctx.arc(-30 * s, -13 * s + headBob, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-30.5 * s, -13 * s + headBob, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2A1A1A';
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      ctx.moveTo(20 * s, breathe);
      ctx.quadraticCurveTo(35 * s, breathe - 10 * s, 30 * s, breathe + 10 * s + headBob);
      ctx.stroke();
      ctx.strokeStyle = '#550000';
      ctx.lineWidth = 2 * s;
      for (let i = 0; i < 3; i++) {
        const fx = -5 * s + i * 8 * s;
        ctx.beginPath();
        ctx.moveTo(fx, -20 * s + breathe);
        ctx.lineTo(fx, -35 * s + breathe + Math.sin(time * 0.01 + i) * 5 * s);
        ctx.stroke();
      }
      break;
    }
    case 'phoenix': {
      ctx.fillStyle = creature.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, breathe, 20 * s, 15 * s + breathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6A3A1A';
      ctx.beginPath();
      ctx.ellipse(0, breathe, 15 * s, 10 * s + breathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = creature.bodyColor;
      ctx.beginPath();
      ctx.ellipse(-15 * s, -8 * s + headBob, 10 * s, 8 * s, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = creature.eyeColor;
      ctx.beginPath();
      ctx.arc(-19 * s, -10 * s + headBob, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
      const wingFlap = Math.sin(time * 0.006) * 0.3;
      ctx.save();
      ctx.translate(0, -5 * s + breathe);
      ctx.rotate(-1.2 + wingFlap);
      ctx.fillStyle = 'rgba(255,100,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 30 * s, 10 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(0, -5 * s + breathe);
      ctx.rotate(1.2 - wingFlap);
      ctx.fillStyle = 'rgba(255,100,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 30 * s, 10 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#FF6600';
      ctx.lineWidth = 2 * s;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 0.6 + Math.PI * 0.2;
        ctx.beginPath();
        ctx.moveTo(10 * s, breathe);
        ctx.lineTo(
          10 * s + Math.cos(angle) * 25 * s,
          breathe + Math.sin(angle) * 25 * s + Math.sin(time * 0.005 + i) * 3 * s
        );
        ctx.stroke();
      }
      break;
    }
    case 'nymph': {
      ctx.fillStyle = creature.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, breathe, 18 * s, 22 * s + breathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2A5A6A';
      ctx.beginPath();
      ctx.ellipse(0, breathe, 12 * s, 15 * s + breathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = creature.bodyColor;
      ctx.beginPath();
      ctx.ellipse(-5 * s, -20 * s + headBob, 10 * s, 10 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = creature.eyeColor;
      ctx.beginPath();
      ctx.arc(-8 * s, -22 * s + headBob, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-8.5 * s, -22 * s + headBob, 1.2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00AACC';
      ctx.lineWidth = 1.5 * s;
      for (let i = 0; i < 4; i++) {
        const flowX = Math.sin(time * 0.003 + i) * 5 * s;
        ctx.beginPath();
        ctx.moveTo(flowX, breathe + 15 * s);
        ctx.quadraticCurveTo(flowX + 10 * s, breathe + 25 * s, flowX - 5 * s, breathe + 35 * s);
        ctx.stroke();
      }
      break;
    }
    case 'unicorn': {
      ctx.fillStyle = creature.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, breathe, 28 * s, 18 * s + breathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4A4A5A';
      ctx.beginPath();
      ctx.ellipse(0, breathe, 22 * s, 13 * s + breathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = creature.bodyColor;
      ctx.beginPath();
      ctx.ellipse(-22 * s, -8 * s + headBob, 14 * s, 11 * s, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = creature.eyeColor;
      ctx.beginPath();
      ctx.arc(-27 * s, -11 * s + headBob, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-27.5 * s, -11 * s + headBob, 1.2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E0D5C1';
      ctx.beginPath();
      ctx.moveTo(-30 * s, -18 * s + headBob);
      ctx.lineTo(-28 * s, -40 * s + headBob);
      ctx.lineTo(-26 * s, -18 * s + headBob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#CCCCDD';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(-22 * s, -18 * s + headBob);
      ctx.quadraticCurveTo(-35 * s, -25 * s + headBob, -38 * s, -15 * s + headBob);
      ctx.stroke();
      break;
    }
    default: {
      ctx.fillStyle = creature.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, breathe, 25 * s, 20 * s + breathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-20 * s, -10 * s + headBob, 12 * s, 10 * s, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = creature.eyeColor;
      ctx.beginPath();
      ctx.arc(-24 * s, -13 * s + headBob, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-24.5 * s, -13 * s + headBob, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = creature.bodyColor;
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(15 * s, breathe);
      ctx.quadraticCurveTo(30 * s, breathe - 5 * s, 25 * s, breathe + 10 * s + headBob);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

function drawCreatureParticle(ctx: CanvasRenderingContext2D, p: CreatureParticle) {
  ctx.save();
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  switch (p.shape) {
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const a2 = a1 + Math.PI / 5;
        ctx.lineTo(Math.cos(a1) * p.size, Math.sin(a1) * p.size);
        ctx.lineTo(Math.cos(a2) * p.size * 0.4, Math.sin(a2) * p.size * 0.4);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'ember': {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,200,50,${p.alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'leaf': {
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.4, p.rotation, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bubble': {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${p.alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function spawnCreatureParticles(creature: CreatureData, cx: number, cy: number, dt: number) {
  if (Math.random() < 0.03 * dt * 0.06 && creatureParticles.length < 50) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 40;
    creatureParticles.push({
      x: cx + Math.cos(angle) * dist * creature.size,
      y: cy + Math.sin(angle) * dist * creature.size,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 1 - 0.3,
      life: 1500 + Math.random() * 1000,
      maxLife: 2500,
      size: 2 + Math.random() * 4,
      color: Math.random() > 0.5 ? creature.particleColor1 : creature.particleColor2,
      alpha: 0.8,
      shape: creature.particleShape,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
    });
  }
}

function updateCreatureParticles(dt: number) {
  creatureParticles = creatureParticles
    .map(p => ({
      ...p,
      x: p.x + p.vx * dt * 0.06,
      y: p.y + p.vy * dt * 0.06,
      life: p.life - dt,
      alpha: Math.max(0, p.life / p.maxLife) * 0.8,
      rotation: p.rotation + p.rotSpeed * dt * 0.06,
    }))
    .filter(p => p.life > 0);
}

function spawnInteractionParticles(type: InteractionType, cx: number, cy: number) {
  const colors: Record<InteractionType, string[]> = {
    pet: ['#FFAACC', '#FF88AA', '#FFCCDD'],
    feed: ['#AACCFF', '#88AAFF', '#CCDDFF'],
    train: ['#FFCC44', '#FFAA22', '#FFEE88'],
  };
  const cs = colors[type];
  for (let i = 0; i < 20; i++) {
    creatureParticles.push({
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 4 - 1,
      life: 800 + Math.random() * 400,
      maxLife: 1200,
      size: 3 + Math.random() * 5,
      color: cs[Math.floor(Math.random() * cs.length)],
      alpha: 1,
      shape: 'star',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
    });
  }
}

function drawStatusBars(ctx: CanvasRenderingContext2D, x: number, y: number, creature: CreatureData, time: number) {
  targetHunger = creature.hunger;
  targetMood = creature.mood;
  targetBond = creature.bond;
  const ease = 0.05;
  displayHunger += (targetHunger - displayHunger) * ease;
  displayMood += (targetMood - displayMood) * ease;
  displayBond += (targetBond - displayBond) * ease;
  const barW = 200;
  const barH = 20;
  const gap = 30;
  const labels = ['饱食度', '心情值', '亲密度'];
  const values = [displayHunger, displayMood, displayBond];
  ctx.save();
  ctx.fillStyle = 'rgba(20,10,35,0.7)';
  ctx.beginPath();
  ctx.roundRect(x - 10, y - 10, barW + 20, gap * 3 + 10, 8);
  ctx.fill();
  ctx.strokeStyle = '#C59B27';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 10, y - 10, barW + 20, gap * 3 + 10, 8);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const by = y + i * gap;
    ctx.fillStyle = '#E0D5C1';
    ctx.font = '12px serif';
    ctx.textAlign = 'left';
    ctx.fillText(labels[i], x, by - 3);
    ctx.fillStyle = '#1A0A2E';
    ctx.beginPath();
    ctx.roundRect(x, by, barW, barH, 4);
    ctx.fill();
    const val = values[i];
    const fillW = Math.max(0, (val / 100) * barW);
    const grad = ctx.createLinearGradient(x, by, x + barW, by);
    if (val < 33) {
      grad.addColorStop(0, '#CC2222');
      grad.addColorStop(1, '#FF6644');
    } else if (val < 66) {
      grad.addColorStop(0, '#CC8822');
      grad.addColorStop(1, '#FFCC44');
    } else {
      grad.addColorStop(0, '#44AA22');
      grad.addColorStop(1, '#88FF44');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, by, fillW, barH, 4);
    ctx.fill();
    if (Math.abs(val - Math.round(val)) < 5) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.roundRect(x, by, fillW, barH / 2, [4, 4, 0, 0]);
      ctx.fill();
    }
    ctx.fillStyle = '#E0D5C1';
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(val)}`, x + barW - 4, by + 14);
    const sparkleChance = Math.abs(val - displayHunger) > 1 || Math.abs(val - displayMood) > 1 || Math.abs(val - displayBond) > 1;
    if (sparkleChance && Math.random() < 0.1) {
      ctx.fillStyle = `rgba(255,255,200,${0.5 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x + fillW, by + barH / 2, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#C59B27';
  ctx.font = 'bold 14px serif';
  ctx.textAlign = 'left';
  ctx.fillText(creature.name, x, y - 25);
  ctx.restore();
}

function drawCelebration(ctx: CanvasRenderingContext2D, w: number, h: number, timer: number) {
  if (timer <= 0) return;
  const progress = 1 - timer / 3000;
  const alpha = progress < 0.8 ? 1 : (1 - (progress - 0.8) / 0.2);
  ctx.save();
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = '#2A0A3A';
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFD700';
  ctx.font = `bold ${48 + Math.sin(progress * Math.PI * 4) * 8}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const bounceY = Math.abs(Math.sin(progress * Math.PI * 3)) * 30;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 20;
  ctx.fillText('羁绊大成！', w / 2, h / 2 - bounceY);
  ctx.shadowBlur = 0;
  const colors = ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF'];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + progress * 2;
    const dist = 80 + progress * 100;
    const px = w / 2 + Math.cos(angle) * dist;
    const py = h / 2 - bounceY + Math.sin(angle) * dist * 0.4;
    ctx.fillStyle = colors[i % colors.length];
    ctx.font = 'bold 24px serif';
    ctx.fillText('✦', px, py);
  }
  ctx.restore();
}

function drawInteractionFeedback(ctx: CanvasRenderingContext2D, dt: number) {
  interactionFeedbacks = interactionFeedbacks
    .map(f => ({ ...f, timer: f.timer - dt }))
    .filter(f => f.timer > 0);
  for (const f of interactionFeedbacks) {
    const alpha = f.timer / 600;
    const offsetY = (1 - alpha) * 40;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#E0D5C1';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    const labels: Record<InteractionType, string> = {
      pet: '💕 抚摸',
      feed: '🍖 喂食',
      train: '⚔ 训练',
    };
    ctx.fillText(labels[f.type], f.x, f.y - offsetY);
    ctx.restore();
  }
}

export function drawCreature(
  ctx: CanvasRenderingContext2D,
  creature: CreatureData,
  layout: LabLayout,
  time: number,
  dt: number,
) {
  const cx = layout.cauldronX;
  const cy = layout.cauldronY - 60;
  spawnCreatureParticles(creature, cx, cy, dt);
  updateCreatureParticles(dt);
  for (const p of creatureParticles) {
    drawCreatureParticle(ctx, p);
  }
  drawCreatureBody(ctx, creature, cx, cy, time);
  drawStatusBars(ctx, layout.statusX, layout.statusY, creature, time);
  if (creature.celebrationTimer > 0) {
    if (!celebrationStarted) {
      celebrationStarted = true;
      try {
        const confetti = (window as any).__canvasConfetti;
        if (confetti) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } catch (_) { /* ignore */ }
    }
    drawCelebration(ctx, layout.canvasW, layout.canvasH, creature.celebrationTimer);
  } else {
    celebrationStarted = false;
  }
  drawInteractionFeedback(ctx, dt);
}

export function triggerInteractionFeedback(type: InteractionType, x: number, y: number) {
  interactionFeedbacks.push({ type, timer: 600, x, y });
  spawnInteractionParticles(type, x, y);
}

export function resetDisplayValues() {
  displayHunger = 30;
  displayMood = 30;
  displayBond = 10;
  targetHunger = 30;
  targetMood = 30;
  targetBond = 10;
  creatureParticles = [];
  celebrationStarted = false;
}

export function getCreatureParticles(): CreatureParticle[] {
  return creatureParticles;
}
