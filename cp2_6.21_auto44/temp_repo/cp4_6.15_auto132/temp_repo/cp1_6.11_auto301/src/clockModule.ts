export interface Bell {
  id: number;
  x: number;
  y: number;
  size: number;
  frequency: number;
  noteName: string;
  layer: 'upper' | 'lower';
  swingAngle: number;
  swingVelocity: number;
  isSwinging: boolean;
  rippleRadius: number;
  rippleAlpha: number;
  hoverScale: number;
  isHovered: boolean;
}

const PENTATONIC_NOTES = [
  { name: '宫', freq: 130.81 },
  { name: '商', freq: 146.83 },
  { name: '角', freq: 164.81 },
  { name: '徵', freq: 196.00 },
  { name: '羽', freq: 220.00 },
  { name: '宫*', freq: 261.63 },
  { name: '商*', freq: 293.66 },
  { name: '角*', freq: 329.63 },
];

const UPPER_NOTES = [
  { name: '徵*', freq: 392.00 },
  { name: '羽*', freq: 440.00 },
  { name: '宫**', freq: 523.25 },
  { name: '商**', freq: 587.33 },
  { name: '角**', freq: 659.25 },
  { name: '徵**', freq: 783.99 },
  { name: '羽**', freq: 880.00 },
  { name: '宫***', freq: 1046.50 },
];

export function initClocks(width: number, height: number): Bell[] {
  const bells: Bell[] = [];
  const rackWidth = width * 0.6;
  const rackLeft = (width - rackWidth) / 2;
  const bellSpacing = rackWidth / 8;

  for (let i = 0; i < 8; i++) {
    const size = 90 - (i * 50 / 7);
    bells.push({
      id: i,
      x: rackLeft + bellSpacing * i + bellSpacing / 2,
      y: height * 0.55,
      size,
      frequency: PENTATONIC_NOTES[i].freq,
      noteName: PENTATONIC_NOTES[i].name,
      layer: 'lower',
      swingAngle: 0,
      swingVelocity: 0,
      isSwinging: false,
      rippleRadius: 0,
      rippleAlpha: 0,
      hoverScale: 1,
      isHovered: false,
    });
  }

  for (let i = 0; i < 8; i++) {
    const size = 40 + (i * 25 / 7);
    bells.push({
      id: 8 + i,
      x: rackLeft + bellSpacing * i + bellSpacing / 2,
      y: height * 0.35,
      size,
      frequency: UPPER_NOTES[i].freq,
      noteName: UPPER_NOTES[i].name,
      layer: 'upper',
      swingAngle: 0,
      swingVelocity: 0,
      isSwinging: false,
      rippleRadius: 0,
      rippleAlpha: 0,
      hoverScale: 1,
      isHovered: false,
    });
  }

  return bells;
}

export function playBell(audioCtx: AudioContext, bell: Bell): void {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(bell.frequency, audioCtx.currentTime);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(bell.frequency * 3, audioCtx.currentTime);
  filter.Q.setValueAtTime(2, audioCtx.currentTime);

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.0);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 2.0);
}

export function triggerBell(bell: Bell): void {
  bell.isSwinging = true;
  bell.swingVelocity = 0.5;
  bell.rippleRadius = bell.size * 0.3;
  bell.rippleAlpha = 0.8;
}

export function updateBellAnimation(bell: Bell, deltaTime: number): void {
  if (bell.isSwinging) {
    const damping = 0.98;
    const spring = 0.1;
    bell.swingVelocity += (-bell.swingAngle * spring - bell.swingVelocity * 0.05) * deltaTime * 60;
    bell.swingAngle += bell.swingVelocity * deltaTime * 60;
    bell.swingVelocity *= damping;

    if (Math.abs(bell.swingAngle) < 0.001 && Math.abs(bell.swingVelocity) < 0.001) {
      bell.swingAngle = 0;
      bell.swingVelocity = 0;
      bell.isSwinging = false;
    }
  }

  if (bell.rippleAlpha > 0) {
    bell.rippleRadius += deltaTime * 200;
    bell.rippleAlpha -= deltaTime * 1.25;
    if (bell.rippleAlpha < 0) bell.rippleAlpha = 0;
  }

  const targetScale = bell.isHovered ? 1.05 : 1;
  bell.hoverScale += (targetScale - bell.hoverScale) * deltaTime * 10;
}

export function drawBell(ctx: CanvasRenderingContext2D, bell: Bell): void {
  ctx.save();
  ctx.translate(bell.x, bell.y);
  ctx.rotate(bell.swingAngle * 15 * Math.PI / 180);
  ctx.scale(bell.hoverScale, bell.hoverScale);

  const size = bell.size;
  const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
  gradient.addColorStop(0, '#1A3A5C');
  gradient.addColorStop(0.5, '#2E8B57');
  gradient.addColorStop(1, '#1A3A5C');

  ctx.beginPath();
  ctx.ellipse(0, 0, size/2, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = '#4A7C59';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, -size * 0.25, size * 0.35, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2E4A3A';
  ctx.fill();
  ctx.strokeStyle = '#4A7C59';
  ctx.lineWidth = 2;
  ctx.stroke();

  drawPanChiPattern(ctx, size);
  drawSealScript(ctx, bell.noteName, size);

  ctx.beginPath();
  ctx.moveTo(0, -size * 0.55);
  ctx.lineTo(0, -size * 0.7);
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -size * 0.75, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#FFB300';
  ctx.fill();
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();

  if (bell.rippleAlpha > 0) {
    ctx.save();
    const rippleGradient = ctx.createRadialGradient(
      bell.x, bell.y, bell.size * 0.2,
      bell.x, bell.y, bell.rippleRadius
    );
    rippleGradient.addColorStop(0, `rgba(255, 215, 0, 0)`);
    rippleGradient.addColorStop(0.5, `rgba(255, 215, 0, ${bell.rippleAlpha * 0.5})`);
    rippleGradient.addColorStop(1, `rgba(255, 215, 0, 0)`);

    ctx.beginPath();
    ctx.arc(bell.x, bell.y, bell.rippleRadius, 0, Math.PI * 2);
    ctx.fillStyle = rippleGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bell.x, bell.y, bell.rippleRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${bell.rippleAlpha})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}

function drawPanChiPattern(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(74, 124, 89, 0.6)';
  ctx.lineWidth = 1.5;

  for (let i = 0; i < 3; i++) {
    const yOffset = -size * 0.15 + i * size * 0.2;
    ctx.beginPath();
    for (let x = -size * 0.35; x < size * 0.35; x += 8) {
      const y = yOffset + Math.sin((x + size * 0.35) * 0.3) * 3;
      if (x === -size * 0.35) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawSealScript(ctx: CanvasRenderingContext2D, text: string, size: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
  ctx.font = `bold ${size * 0.2}px "STKaiti", "KaiTi", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.15);
  ctx.restore();
}

export function drawLantern(ctx: CanvasRenderingContext2D, bell: Bell, time: number): void {
  const x = bell.x;
  const y = bell.y - bell.size * 0.9 - 20;
  const floatOffset = Math.sin(time * 0.5 + bell.id) * 2;

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x, y - 15);
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.stroke();

  const lanternGradient = ctx.createRadialGradient(x, y + floatOffset, 0, x, y + floatOffset, 15);
  lanternGradient.addColorStop(0, '#FFE066');
  lanternGradient.addColorStop(0.5, '#FFB300');
  lanternGradient.addColorStop(1, '#CC8800');

  ctx.beginPath();
  ctx.ellipse(x, y + floatOffset, 12, 15, 0, 0, Math.PI * 2);
  ctx.fillStyle = lanternGradient;
  ctx.fill();
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 8, y + floatOffset - 15);
  ctx.lineTo(x + 8, y + floatOffset - 15);
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 8, y + floatOffset + 15);
  ctx.lineTo(x + 8, y + floatOffset + 15);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + floatOffset + 18);
  ctx.lineTo(x, y + floatOffset + 25);
  ctx.moveTo(x - 3, y + floatOffset + 20);
  ctx.lineTo(x - 3, y + floatOffset + 28);
  ctx.moveTo(x + 3, y + floatOffset + 20);
  ctx.lineTo(x + 3, y + floatOffset + 28);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

export function drawRack(ctx: CanvasRenderingContext2D, width: number, height: number, bells: Bell[]): void {
  const rackWidth = width * 0.6;
  const rackLeft = (width - rackWidth) / 2;
  const rackTop = height * 0.25;
  const rackBottom = height * 0.7;

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(rackLeft - 30, rackBottom + 20);
  ctx.lineTo(rackLeft - 10, rackTop - 20);
  ctx.lineTo(rackLeft + 10, rackTop - 20);
  ctx.lineTo(rackLeft + 30, rackBottom + 20);
  ctx.closePath();
  const pillarGradient = ctx.createLinearGradient(rackLeft - 30, 0, rackLeft + 30, 0);
  pillarGradient.addColorStop(0, '#8B2500');
  pillarGradient.addColorStop(0.5, '#C41E3A');
  pillarGradient.addColorStop(1, '#8B2500');
  ctx.fillStyle = pillarGradient;
  ctx.fill();
  ctx.strokeStyle = '#4A2C1A';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width - rackLeft - 30, rackBottom + 20);
  ctx.lineTo(width - rackLeft - 10, rackTop - 20);
  ctx.lineTo(width - rackLeft + 10, rackTop - 20);
  ctx.lineTo(width - rackLeft + 30, rackBottom + 20);
  ctx.closePath();
  ctx.fillStyle = pillarGradient;
  ctx.fill();
  ctx.stroke();

  const beamY1 = height * 0.3;
  const beamY2 = height * 0.5;

  [beamY1, beamY2].forEach(beamY => {
    ctx.beginPath();
    ctx.roundRect(rackLeft - 20, beamY - 15, rackWidth + 40, 30, 5);
    const beamGradient = ctx.createLinearGradient(0, beamY - 15, 0, beamY + 15);
    beamGradient.addColorStop(0, '#8B2500');
    beamGradient.addColorStop(0.5, '#C41E3A');
    beamGradient.addColorStop(1, '#8B2500');
    ctx.fillStyle = beamGradient;
    ctx.fill();
    ctx.strokeStyle = '#4A2C1A';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawBracket(ctx, rackLeft - 20, beamY, -1);
    drawBracket(ctx, width - rackLeft + 20, beamY, 1);
  });

  bells.forEach(bell => {
    if (bell.layer === 'upper') {
      ctx.beginPath();
      ctx.moveTo(bell.x, beamY1 + 15);
      ctx.lineTo(bell.x, bell.y - bell.size * 0.7);
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(bell.x, beamY2 + 15);
      ctx.lineTo(bell.x, bell.y - bell.size * 0.7);
      ctx.stroke();
    }
  });

  ctx.restore();
}

function drawBracket(ctx: CanvasRenderingContext2D, x: number, y: number, direction: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  const bracketGradient = ctx.createLinearGradient(0, -20, 0, 20);
  bracketGradient.addColorStop(0, '#2E8B57');
  bracketGradient.addColorStop(0.5, '#3CB371');
  bracketGradient.addColorStop(1, '#2E8B57');

  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(-30, -10);
  ctx.lineTo(-25, 0);
  ctx.lineTo(-40, 0);
  ctx.lineTo(-35, 10);
  ctx.lineTo(-15, 10);
  ctx.lineTo(0, 10);
  ctx.closePath();
  ctx.fillStyle = bracketGradient;
  ctx.fill();
  ctx.strokeStyle = '#1A5C3A';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

export function checkBellHit(bells: Bell[], x: number, y: number): Bell | null {
  for (let i = bells.length - 1; i >= 0; i--) {
    const bell = bells[i];
    const dx = x - bell.x;
    const dy = y - bell.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < bell.size * 0.6 * bell.hoverScale) {
      return bell;
    }
  }
  return null;
}
