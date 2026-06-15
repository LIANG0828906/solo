import type { ScoreNote, PerformanceResult } from './scoreModule.js';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface FloatingLantern {
  x: number;
  baseY: number;
  phase: number;
  size: number;
}

let floatingLanterns: FloatingLantern[] = [];

export function initFloatingLanterns(width: number, height: number): void {
  floatingLanterns = [];
  const positions = [
    { x: width * 0.05, y: height * 0.15 },
    { x: width * 0.12, y: height * 0.25 },
    { x: width * 0.88, y: height * 0.15 },
    { x: width * 0.95, y: height * 0.25 },
    { x: width * 0.08, y: height * 0.4 },
    { x: width * 0.92, y: height * 0.4 },
  ];
  positions.forEach((pos, i) => {
    floatingLanterns.push({
      x: pos.x,
      baseY: pos.y,
      phase: i * Math.PI / 3,
      size: 20 + Math.random() * 10,
    });
  });
}

export function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void {
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#1a0a00');
  bgGradient.addColorStop(0.3, '#2d1810');
  bgGradient.addColorStop(0.6, '#3d2817');
  bgGradient.addColorStop(1, '#2a1a0f');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const ceilingGradient = ctx.createLinearGradient(0, 0, 0, height * 0.2);
  ceilingGradient.addColorStop(0, '#2a1a0a');
  ceilingGradient.addColorStop(1, '#3d2817');
  ctx.fillStyle = ceilingGradient;
  ctx.fillRect(0, 0, width, height * 0.2);

  drawFloor(ctx, width, height);
  drawScreen(ctx, width, height);
  drawBronzeDing(ctx, width * 0.1, height * 0.72, 60);
  drawBronzeDing(ctx, width * 0.9, height * 0.72, 60);
  drawFloatingLanterns(ctx, time);
}

function drawFloor(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const floorY = height * 0.75;

  ctx.fillStyle = '#5D3A1A';
  ctx.fillRect(0, floorY, width, height - floorY);

  for (let i = 0; i < 20; i++) {
    const y = floorY + i * ((height - floorY) / 20);
    const alpha = 0.1 + (i / 20) * 0.2;
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const carpetLeft = width * 0.2;
  const carpetRight = width * 0.8;
  const carpetGradient = ctx.createLinearGradient(carpetLeft, floorY, carpetRight, floorY);
  carpetGradient.addColorStop(0, '#6B1A00');
  carpetGradient.addColorStop(0.3, '#8B2500');
  carpetGradient.addColorStop(0.7, '#8B2500');
  carpetGradient.addColorStop(1, '#6B1A00');

  ctx.fillStyle = carpetGradient;
  ctx.fillRect(carpetLeft, floorY, carpetRight - carpetLeft, height - floorY);

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.strokeRect(carpetLeft + 10, floorY + 10, carpetRight - carpetLeft - 20, height - floorY - 20);

  for (let i = 0; i < 8; i++) {
    const patternX = carpetLeft + 30 + i * ((carpetRight - carpetLeft - 60) / 7);
    drawCarpetPattern(ctx, patternX, floorY + 30);
    drawCarpetPattern(ctx, patternX, height - 30);
  }
}

function drawCarpetPattern(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const px = Math.cos(angle) * 8;
    const py = Math.sin(angle) * 8;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawScreen(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const screenX = width * 0.25;
  const screenY = height * 0.05;
  const screenW = width * 0.5;
  const screenH = height * 0.3;

  const frameGradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenH);
  frameGradient.addColorStop(0, '#4A2C1A');
  frameGradient.addColorStop(0.5, '#6B4423');
  frameGradient.addColorStop(1, '#4A2C1A');

  ctx.fillStyle = frameGradient;
  ctx.fillRect(screenX - 15, screenY - 15, screenW + 30, screenH + 30);

  ctx.fillStyle = '#D2B48C';
  ctx.fillRect(screenX, screenY, screenW, screenH);

  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 3;
  ctx.strokeRect(screenX, screenY, screenW, screenH);

  drawCloudPattern(ctx, screenX, screenY, screenW, screenH);
}

function drawCloudPattern(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
  ctx.fillStyle = 'rgba(139, 69, 19, 0.15)';
  ctx.lineWidth = 2;

  const cloudPositions = [
    { cx: x + w * 0.2, cy: y + h * 0.3, size: 40 },
    { cx: x + w * 0.5, cy: y + h * 0.5, size: 60 },
    { cx: x + w * 0.8, cy: y + h * 0.7, size: 45 },
    { cx: x + w * 0.3, cy: y + h * 0.75, size: 35 },
    { cx: x + w * 0.7, cy: y + h * 0.25, size: 38 },
  ];

  cloudPositions.forEach(cloud => {
    ctx.beginPath();
    const circles = 5;
    for (let i = 0; i < circles; i++) {
      const angle = (i / circles) * Math.PI * 2;
      const r = cloud.size * (0.4 + Math.sin(i * 1.5) * 0.15);
      const cx = cloud.cx + Math.cos(angle) * cloud.size * 0.3;
      const cy = cloud.cy + Math.sin(angle) * cloud.size * 0.25;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

function drawBronzeDing(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);

  const dingGradient = ctx.createLinearGradient(-size, -size, size, size);
  dingGradient.addColorStop(0, '#2B1B17');
  dingGradient.addColorStop(0.5, '#4A3728');
  dingGradient.addColorStop(1, '#2B1B17');

  ctx.fillStyle = dingGradient;
  ctx.beginPath();
  ctx.moveTo(-size * 0.8, -size * 0.3);
  ctx.lineTo(-size * 0.9, size * 0.4);
  ctx.lineTo(size * 0.9, size * 0.4);
  ctx.lineTo(size * 0.8, -size * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1A1008';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, -size * 0.3, size * 0.85, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-size * 0.5, -size * 0.5);
  ctx.quadraticCurveTo(-size * 0.5, -size * 0.8, -size * 0.2, -size * 0.8);
  ctx.quadraticCurveTo(0, -size * 0.8, 0, -size * 0.5);
  ctx.moveTo(size * 0.5, -size * 0.5);
  ctx.quadraticCurveTo(size * 0.5, -size * 0.8, size * 0.2, -size * 0.8);
  ctx.quadraticCurveTo(0, -size * 0.8, 0, -size * 0.5);
  ctx.strokeStyle = '#2B1B17';
  ctx.lineWidth = 8;
  ctx.stroke();

  drawTaoTiePattern(ctx, 0, 0, size);

  ctx.fillStyle = '#1A1008';
  ctx.fillRect(-size * 0.7, size * 0.4, size * 0.25, size * 0.3);
  ctx.fillRect(size * 0.45, size * 0.4, size * 0.25, size * 0.3);

  ctx.restore();
}

function drawTaoTiePattern(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(-size * 0.3, -size * 0.1);
  ctx.lineTo(-size * 0.15, -size * 0.05);
  ctx.lineTo(-size * 0.1, 0);
  ctx.lineTo(-size * 0.15, size * 0.05);
  ctx.lineTo(-size * 0.3, size * 0.1);
  ctx.moveTo(size * 0.3, -size * 0.1);
  ctx.lineTo(size * 0.15, -size * 0.05);
  ctx.lineTo(size * 0.1, 0);
  ctx.lineTo(size * 0.15, size * 0.05);
  ctx.lineTo(size * 0.3, size * 0.1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-size * 0.2, 0);
  ctx.quadraticCurveTo(0, size * 0.1, size * 0.2, 0);
  ctx.stroke();

  ctx.restore();
}

function drawFloatingLanterns(ctx: CanvasRenderingContext2D, time: number): void {
  floatingLanterns.forEach(lantern => {
    const floatY = lantern.baseY + Math.sin(time * 0.25 + lantern.phase) * 5;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(lantern.x, floatY - lantern.size * 1.5);
    ctx.lineTo(lantern.x, floatY - lantern.size * 0.8);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.stroke();

    const glowGradient = ctx.createRadialGradient(
      lantern.x, floatY, 0,
      lantern.x, floatY, lantern.size * 2
    );
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(lantern.x, floatY, lantern.size * 2, 0, Math.PI * 2);
    ctx.fill();

    const lanternGradient = ctx.createRadialGradient(
      lantern.x, floatY, 0,
      lantern.x, floatY, lantern.size
    );
    lanternGradient.addColorStop(0, '#FFE066');
    lanternGradient.addColorStop(0.6, '#FFD700');
    lanternGradient.addColorStop(1, '#CC8800');

    ctx.beginPath();
    ctx.ellipse(lantern.x, floatY, lantern.size * 0.7, lantern.size, 0, 0, Math.PI * 2);
    ctx.fillStyle = lanternGradient;
    ctx.fill();
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(lantern.x - lantern.size * 0.6, floatY - lantern.size);
    ctx.lineTo(lantern.x + lantern.size * 0.6, floatY - lantern.size);
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(lantern.x - lantern.size * 0.6, floatY + lantern.size);
    ctx.lineTo(lantern.x + lantern.size * 0.6, floatY + lantern.size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(lantern.x, floatY + lantern.size + 5);
    ctx.lineTo(lantern.x, floatY + lantern.size + 15);
    ctx.moveTo(lantern.x - 4, floatY + lantern.size + 8);
    ctx.lineTo(lantern.x - 4, floatY + lantern.size + 18);
    ctx.moveTo(lantern.x + 4, floatY + lantern.size + 8);
    ctx.lineTo(lantern.x + 4, floatY + lantern.size + 18);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  });
}

export function showScore(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  notes: ScoreNote[],
  currentIndex: number,
  time: number
): void {
  const sheetX = width * 0.15;
  const sheetY = height * 0.02;
  const sheetW = width * 0.7;
  const sheetH = height * 0.12;

  drawBambooSlips(ctx, sheetX, sheetY, sheetW, sheetH, notes.length);

  const noteSpacing = sheetW / (notes.length + 2);
  const startX = sheetX + noteSpacing;

  notes.forEach((note, i) => {
    const x = startX + i * noteSpacing;
    const y = sheetY + sheetH / 2;

    let color = '#4A2C1A';
    let scale = 1;

    if (i < currentIndex && note.isHit) {
      color = note.isCorrect ? '#FFD700' : '#8B0000';
      if (note.isCorrect) {
        const pulse = Math.sin(time * 8 + i) * 0.1 + 1;
        scale = pulse;
      }
    } else if (i === currentIndex) {
      color = '#FF6B00';
      scale = 1.2;
      const progress = (time - note.expectedTime + 800) / 1600;
      if (progress > 0 && progress < 1) {
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 107, 0, ${0.5 - Math.abs(progress - 0.5)})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    const bgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
    bgGradient.addColorStop(0, '#F5DEB3');
    bgGradient.addColorStop(1, '#D2B48C');
    ctx.fillStyle = bgGradient;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 22px "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(note.symbol, 0, 0);

    ctx.restore();
  });
}

function drawBambooSlips(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  noteCount: number
): void {
  const slipCount = Math.min(noteCount + 4, 20);
  const slipW = w / slipCount;
  const gap = 2;

  for (let i = 0; i < slipCount; i++) {
    const slipX = x + i * slipW + gap / 2;
    const slipGradient = ctx.createLinearGradient(slipX, y, slipX + slipW - gap, y);
    slipGradient.addColorStop(0, '#C4A57B');
    slipGradient.addColorStop(0.3, '#D2B48C');
    slipGradient.addColorStop(0.7, '#D2B48C');
    slipGradient.addColorStop(1, '#C4A57B');

    ctx.fillStyle = slipGradient;
    ctx.fillRect(slipX, y, slipW - gap, h);

    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1;
    ctx.strokeRect(slipX, y, slipW - gap, h);

    ctx.beginPath();
    ctx.arc(slipX + 10, y + 8, 3, 0, Math.PI * 2);
    ctx.arc(slipX + slipW - gap - 10, y + 8, 3, 0, Math.PI * 2);
    ctx.arc(slipX + 10, y + h - 8, 3, 0, Math.PI * 2);
    ctx.arc(slipX + slipW - gap - 10, y + h - 8, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#8B4513';
    ctx.fill();
  }

  ctx.fillStyle = '#4A2C1A';
  ctx.fillRect(x - 15, y, 15, h);
  ctx.fillRect(x + w, y, 15, h);

  const ropeGradient = ctx.createLinearGradient(x - 15, y + 8, x + w + 15, y + 8);
  ropeGradient.addColorStop(0, '#8B4513');
  ropeGradient.addColorStop(0.5, '#A0522D');
  ropeGradient.addColorStop(1, '#8B4513');
  ctx.fillStyle = ropeGradient;
  ctx.fillRect(x - 15, y + 5, w + 30, 6);
  ctx.fillRect(x - 15, y + h - 11, w + 30, 6);
}

export function showFailure(ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void {
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, width, height);

  drawBrokenString(ctx, centerX, centerY - 50, width * 0.6, time);

  const shake = Math.sin(time * 30) * 3;
  ctx.save();
  ctx.translate(centerX + shake, centerY + 80);
  ctx.rotate(-0.1 + Math.sin(time * 20) * 0.05);

  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.arc(0, 0, 80, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#660000';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#FF0000';
  ctx.font = 'bold 28px "STKaiti", "KaiTi", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('乐师', 0, -25);
  ctx.fillText('失仪', 0, 25);

  ctx.restore();
}

function drawBrokenString(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  time: number
): void {
  const breakPoint = x;
  const leftEnd = x - length / 2;
  const rightEnd = x + length / 2;

  const vibrate = Math.sin(time * 50) * 5;
  const droop = Math.min(time * 50, 80);

  ctx.save();
  ctx.strokeStyle = '#C0C0C0';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(leftEnd, y);
  ctx.quadraticCurveTo(
    (leftEnd + breakPoint) / 2,
    y + droop * 0.5 + vibrate,
    breakPoint - 10,
    y + droop + vibrate
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(breakPoint + 10, y + droop - vibrate);
  ctx.quadraticCurveTo(
    (breakPoint + rightEnd) / 2,
    y + droop * 0.5 - vibrate,
    rightEnd,
    y
  );
  ctx.stroke();

  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    ctx.beginPath();
    ctx.moveTo(breakPoint - 10, y + droop + vibrate);
    ctx.lineTo(
      breakPoint - 10 - 15 * t,
      y + droop + vibrate + 10 * t + Math.sin(time * 40 + i) * 2
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(breakPoint + 10, y + droop - vibrate);
    ctx.lineTo(
      breakPoint + 10 + 15 * t,
      y + droop - vibrate + 10 * t + Math.sin(time * 40 + i + 1) * 2
    );
    ctx.stroke();
  }

  ctx.restore();
}

export function showEdict(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  result: PerformanceResult,
  time: number
): void {
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, width, height);

  const edictW = Math.min(500, width * 0.6);
  const edictH = Math.min(400, height * 0.5);
  const edictX = centerX - edictW / 2;
  const edictY = centerY - edictH / 2;

  const scrollProgress = Math.min(time * 2, 1);
  const currentH = edictH * scrollProgress;

  ctx.save();

  const frameGradient = ctx.createLinearGradient(edictX, edictY, edictX, edictY + edictH);
  frameGradient.addColorStop(0, '#4A2C1A');
  frameGradient.addColorStop(0.5, '#6B4423');
  frameGradient.addColorStop(1, '#4A2C1A');

  ctx.fillStyle = frameGradient;
  ctx.fillRect(edictX - 20, edictY - 10, edictW + 40, currentH + 20);

  const edictGradient = ctx.createLinearGradient(edictX, edictY, edictX, edictY + edictH);
  edictGradient.addColorStop(0, '#FFD700');
  edictGradient.addColorStop(0.5, '#FFE55C');
  edictGradient.addColorStop(1, '#FFD700');

  ctx.fillStyle = edictGradient;
  ctx.fillRect(edictX, edictY, edictW, currentH);

  ctx.strokeStyle = '#4A2C1A';
  ctx.lineWidth = 2;
  ctx.strokeRect(edictX, edictY, edictW, currentH);

  if (scrollProgress > 0.1) {
    const dragonSize = 40;
    drawDragonPattern(ctx, edictX + dragonSize, edictY + 40, dragonSize);
    drawDragonPattern(ctx, edictX + edictW - dragonSize, edictY + 40, dragonSize);
  }

  if (scrollProgress > 0.3) {
    ctx.fillStyle = '#4A2C1A';
    ctx.font = 'bold 32px "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.fillText('圣旨', centerX, edictY + 50);
  }

  if (scrollProgress > 0.5) {
    ctx.font = '20px "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.fillText('奉天承运 皇帝诏曰', centerX, edictY + 100);

    ctx.font = '18px "STKaiti", "KaiTi", serif';
    ctx.fillText(`演奏得分：${result.score}分`, centerX, edictY + 150);
    ctx.fillText(`准确率：${Math.round(result.accuracy * 100)}%`, centerX, edictY + 180);
    ctx.fillText(`节奏偏差：${result.avgRhythmDeviation}ms`, centerX, edictY + 210);

    let gradeColor = '#4A2C1A';
    if (result.grade === '甲') gradeColor = '#DAA520';
    if (result.grade === '乙') gradeColor = '#8B4513';
    ctx.fillStyle = gradeColor;
    ctx.font = 'bold 28px "STKaiti", "KaiTi", serif';
    ctx.fillText(`评定：${result.grade}等`, centerX, edictY + 255);

    ctx.fillStyle = '#8B0000';
    ctx.font = 'bold 26px "STKaiti", "KaiTi", serif';
    ctx.fillText(`御赐封号：${result.title}`, centerX, edictY + 300);
  }

  if (scrollProgress > 0.9) {
    const sealSize = 60;
    ctx.save();
    ctx.translate(edictX + edictW - sealSize - 20, edictY + currentH - sealSize - 20);
    ctx.rotate(-0.15);

    ctx.fillStyle = '#8B0000';
    ctx.fillRect(0, 0, sealSize, sealSize);
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, sealSize, sealSize);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.fillText('皇帝', sealSize / 2, sealSize / 2 - 8);
    ctx.fillText('之宝', sealSize / 2, sealSize / 2 + 12);

    ctx.restore();
  }

  ctx.restore();
}

function drawDragonPattern(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#8B4513';
  ctx.fillStyle = 'rgba(139, 69, 19, 0.2)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = size * (0.5 + Math.sin(i * 2.5) * 0.2);
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r * 0.8;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.quadraticCurveTo(
      Math.cos(angle - 0.2) * r * 1.1,
      Math.sin(angle - 0.2) * r * 0.9,
      px, py
    );
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function createPetalParticles(x: number, y: number, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 80,
      vy: 50 + Math.random() * 60,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 4,
      alpha: 1,
      life: 0,
      maxLife: 1.5,
      size: 15,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles.filter(p => {
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.vy += 50 * deltaTime;
    p.rotation += p.rotationSpeed * deltaTime;
    p.life += deltaTime;
    p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    return p.life < p.maxLife;
  });
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  particles.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha;

    const petalGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size / 2);
    petalGradient.addColorStop(0, '#FFD1DC');
    petalGradient.addColorStop(0.7, '#FFB7C5');
    petalGradient.addColorStop(1, '#FF91A4');

    ctx.fillStyle = petalGradient;
    ctx.beginPath();
    ctx.moveTo(0, -p.size / 2);
    ctx.quadraticCurveTo(p.size / 2, -p.size / 4, p.size / 3, p.size / 3);
    ctx.quadraticCurveTo(0, p.size / 2, -p.size / 3, p.size / 3);
    ctx.quadraticCurveTo(-p.size / 2, -p.size / 4, 0, -p.size / 2);
    ctx.fill();

    ctx.restore();
  });
}
