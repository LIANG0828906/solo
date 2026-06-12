import { AnimationState, PetType } from '../types/pet';

export interface FrameConfig {
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
}

export interface AnimationFrameResult {
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
  sourceX: number;
  sourceY: number;
  offsetX: number;
  offsetY: number;
}

const FRAMES_PER_SECOND = 8;
const MS_PER_FRAME = 1000 / FRAMES_PER_SECOND;

export const getAnimationFrameCount = (state: AnimationState): number => {
  switch (state) {
    case 'idle':
      return 4;
    case 'walk':
      return 6;
    case 'eat':
      return 4;
    case 'sleep':
      return 2;
    default:
      return 4;
  }
};

export const getCurrentFrameIndex = (
  animationState: AnimationState,
  startTime: number,
  currentTime: number
): number => {
  const elapsed = currentTime - startTime;
  const totalFrames = getAnimationFrameCount(animationState);
  const frameCount = Math.floor(elapsed / MS_PER_FRAME);
  return frameCount % totalFrames;
};

export const getPetBaseColor = (type: PetType): string => {
  switch (type) {
    case 'dragon':
      return '#22c55e';
    case 'unicorn':
      return '#f472b6';
    case 'robot':
      return '#94a3b8';
    default:
      return '#22c55e';
  }
};

export const getPetSecondaryColor = (type: PetType): string => {
  switch (type) {
    case 'dragon':
      return '#15803d';
    case 'unicorn':
      return '#db2777';
    case 'robot':
      return '#64748b';
    default:
      return '#15803d';
  }
};

export const getPetEyeColor = (type: PetType): string => {
  switch (type) {
    case 'dragon':
      return '#fbbf24';
    case 'unicorn':
      return '#3b82f6';
    case 'robot':
      return '#ef4444';
    default:
      return '#fbbf24';
  }
};

export const calculateDrawParameters = (
  canvasWidth: number,
  canvasHeight: number,
  frameIndex: number,
  animationState: AnimationState,
  facingLeft: boolean = false
): AnimationFrameResult => {
  const drawWidth = 128;
  const drawHeight = 128;
  const drawX = (canvasWidth - drawWidth) / 2;
  let drawY = canvasHeight - drawHeight - 20;

  let offsetX = 0;
  let offsetY = 0;

  switch (animationState) {
    case 'idle':
      offsetY = Math.sin(frameIndex * Math.PI / 2) * 2;
      break;
    case 'walk':
      offsetX = Math.sin(frameIndex * Math.PI / 3) * 8;
      offsetY = Math.abs(Math.sin(frameIndex * Math.PI / 3)) * 3;
      break;
    case 'eat':
      offsetY = Math.sin(frameIndex * Math.PI / 2) * 4;
      break;
    case 'sleep':
      drawY = canvasHeight - drawHeight + 30;
      break;
  }

  if (facingLeft) {
    offsetX = -offsetX;
  }

  return {
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    sourceX: 0,
    sourceY: 0,
    offsetX,
    offsetY,
  };
};

export const drawPixelPet = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  type: PetType,
  frameIndex: number,
  animationState: AnimationState,
  isOpponent: boolean = false
): void => {
  const pixelSize = Math.floor(width / 32);
  const baseColor = getPetBaseColor(type);
  const secondaryColor = getPetSecondaryColor(type);
  const eyeColor = getPetEyeColor(type);
  const flip = isOpponent;

  const flipX = (px: number): number => (flip ? width - px * pixelSize - pixelSize : px * pixelSize);

  const drawPixel = (px: number, py: number, color: string, size: number = 1): void => {
    ctx.fillStyle = color;
    ctx.fillRect(
      x + flipX(px),
      y + py * pixelSize,
      pixelSize * size,
      pixelSize * size
    );
  };

  if (animationState === 'sleep') {
    ctx.globalAlpha = 0.9;
  }

  switch (type) {
    case 'dragon':
      drawDragon(ctx, drawPixel, frameIndex, animationState, baseColor, secondaryColor, eyeColor);
      break;
    case 'unicorn':
      drawUnicorn(ctx, drawPixel, frameIndex, animationState, baseColor, secondaryColor, eyeColor);
      break;
    case 'robot':
      drawRobot(ctx, drawPixel, frameIndex, animationState, baseColor, secondaryColor, eyeColor);
      break;
  }

  ctx.globalAlpha = 1;
};

const drawDragon = (
  ctx: CanvasRenderingContext2D,
  drawPixel: (px: number, py: number, color: string, size?: number) => void,
  frameIndex: number,
  animationState: AnimationState,
  baseColor: string,
  secondaryColor: string,
  eyeColor: string
): void => {
  const legOffset = animationState === 'walk' ? (frameIndex % 2 === 0 ? 0 : 1) : 0;
  const isEating = animationState === 'eat';
  const isSleeping = animationState === 'sleep';

  // Head
  for (let py = 4; py <= 10; py++) {
    for (let px = 8; px <= 18; px++) {
      drawPixel(px, py, baseColor);
    }
  }
  // Head outline
  for (let px = 8; px <= 18; px++) {
    drawPixel(px, 4, secondaryColor);
    drawPixel(px, 10, secondaryColor);
  }
  for (let py = 4; py <= 10; py++) {
    drawPixel(8, py, secondaryColor);
    drawPixel(18, py, secondaryColor);
  }

  // Horns
  drawPixel(10, 2, '#fbbf24');
  drawPixel(10, 3, '#fbbf24');
  drawPixel(16, 2, '#fbbf24');
  drawPixel(16, 3, '#fbbf24');

  // Eyes
  if (!isSleeping) {
    drawPixel(11, 6, eyeColor);
    drawPixel(15, 6, eyeColor);
    drawPixel(11, 7, '#ffffff');
    drawPixel(15, 7, '#ffffff');
  } else {
    drawPixel(11, 6, '#1f2937');
    drawPixel(15, 6, '#1f2937');
  }

  // Nose/Mouth
  if (isEating) {
    drawPixel(12, 8, '#dc2626');
    drawPixel(13, 8, '#dc2626');
    drawPixel(14, 8, '#dc2626');
  } else if (isSleeping) {
    drawPixel(13, 8, '#1f2937');
  } else {
    drawPixel(13, 8, '#1f2937');
  }

  // Body
  for (let py = 11; py <= 18; py++) {
    for (let px = 10; px <= 16; px++) {
      drawPixel(px, py, baseColor);
    }
  }
  // Body outline
  for (let px = 10; px <= 16; px++) {
    drawPixel(px, 18, secondaryColor);
  }
  for (let py = 11; py <= 18; py++) {
    drawPixel(10, py, secondaryColor);
    drawPixel(16, py, secondaryColor);
  }

  // Belly
  for (let py = 13; py <= 17; py++) {
    for (let px = 12; px <= 14; px++) {
      drawPixel(px, py, '#bbf7d0');
    }
  }

  // Wings
  if (!isSleeping) {
    const wingFlap = animationState === 'idle' ? Math.sin(frameIndex * Math.PI / 2) * 2 : 0;
    for (let py = 11 + wingFlap; py <= 15; py++) {
      drawPixel(6, py, secondaryColor);
      drawPixel(7, py, baseColor);
      drawPixel(19, py, secondaryColor);
      drawPixel(20, py, baseColor);
    }
    drawPixel(5, 13 + wingFlap, secondaryColor);
    drawPixel(21, 13 + wingFlap, secondaryColor);
  }

  // Legs
  drawPixel(11, 19 + legOffset, secondaryColor);
  drawPixel(11, 20 + legOffset, secondaryColor);
  drawPixel(12, 19 + legOffset, baseColor);
  drawPixel(12, 20 + legOffset, baseColor);

  drawPixel(14, 19 - legOffset, secondaryColor);
  drawPixel(14, 20 - legOffset, secondaryColor);
  drawPixel(15, 19 - legOffset, baseColor);
  drawPixel(15, 20 - legOffset, baseColor);

  // Tail
  const tailWag = animationState === 'walk' ? (frameIndex % 2 === 0 ? 0 : 1) : 0;
  drawPixel(17, 14, secondaryColor);
  drawPixel(18, 15 + tailWag, secondaryColor);
  drawPixel(19, 16, baseColor);
  drawPixel(20, 17 + tailWag, baseColor);

  // Z for sleeping
  if (isSleeping) {
    const zY = 4 - (frameIndex % 2);
    ctx.font = `${10}px monospace`;
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('Z', x + 280, y + zY * 12);
  }
};

const drawUnicorn = (
  ctx: CanvasRenderingContext2D,
  drawPixel: (px: number, py: number, color: string, size?: number) => void,
  frameIndex: number,
  animationState: AnimationState,
  baseColor: string,
  secondaryColor: string,
  eyeColor: string
): void => {
  const legOffset = animationState === 'walk' ? (frameIndex % 2 === 0 ? 0 : 1) : 0;
  const isEating = animationState === 'eat';
  const isSleeping = animationState === 'sleep';

  // Horn
  drawPixel(13, 1, '#fde047');
  drawPixel(13, 2, '#facc15');
  drawPixel(13, 3, '#eab308');
  drawPixel(12, 3, '#fde047');
  drawPixel(14, 3, '#fde047');

  // Head
  for (let py = 4; py <= 9; py++) {
    for (let px = 9; px <= 17; px++) {
      drawPixel(px, py, baseColor);
    }
  }
  // Head outline
  for (let px = 9; px <= 17; px++) {
    drawPixel(px, 4, secondaryColor);
    drawPixel(px, 9, secondaryColor);
  }
  for (let py = 4; py <= 9; py++) {
    drawPixel(9, py, secondaryColor);
    drawPixel(17, py, secondaryColor);
  }

  // Mane
  const maneColors = ['#f472b6', '#c084fc', '#60a5fa', '#34d399'];
  for (let py = 4; py <= 8; py++) {
    const color = maneColors[(py - 4) % maneColors.length];
    drawPixel(8, py, color);
    if (py % 2 === 0) {
      drawPixel(7, py, color);
    }
  }

  // Ears
  drawPixel(10, 3, secondaryColor);
  drawPixel(16, 3, secondaryColor);
  drawPixel(10, 2, baseColor);
  drawPixel(16, 2, baseColor);

  // Eyes
  if (!isSleeping) {
    drawPixel(11, 6, eyeColor);
    drawPixel(15, 6, eyeColor);
    drawPixel(11, 5, '#ffffff');
    drawPixel(15, 5, '#ffffff');
  } else {
    drawPixel(11, 6, '#1f2937');
    drawPixel(15, 6, '#1f2937');
  }

  // Nose
  if (isEating) {
    drawPixel(12, 8, '#dc2626');
    drawPixel(13, 8, '#fb7185');
    drawPixel(14, 8, '#dc2626');
  } else {
    drawPixel(13, 8, '#fb7185');
  }

  // Body
  for (let py = 10; py <= 18; py++) {
    for (let px = 9; px <= 17; px++) {
      drawPixel(px, py, baseColor);
    }
  }
  // Body outline
  for (let px = 9; px <= 17; px++) {
    drawPixel(px, 18, secondaryColor);
  }
  for (let py = 10; py <= 18; py++) {
    drawPixel(9, py, secondaryColor);
    drawPixel(17, py, secondaryColor);
  }

  // Body mane extension
  for (let py = 10; py <= 14; py++) {
    drawPixel(8, py, maneColors[(py - 4) % maneColors.length]);
  }

  // Legs
  for (let i = 0; i < 2; i++) {
    drawPixel(10 + i, 19 + legOffset, secondaryColor);
    drawPixel(10 + i, 20 + legOffset, secondaryColor);
    drawPixel(10 + i, 21 + legOffset, '#fef3c7');
    drawPixel(15 + i, 19 - legOffset, secondaryColor);
    drawPixel(15 + i, 20 - legOffset, secondaryColor);
    drawPixel(15 + i, 21 - legOffset, '#fef3c7');
  }

  // Tail
  const tailWag = animationState === 'walk' ? (frameIndex % 2 === 0 ? 0 : 1) : 0;
  drawPixel(18, 14, secondaryColor);
  drawPixel(19, 15 + tailWag, maneColors[0]);
  drawPixel(20, 16, maneColors[1]);
  drawPixel(21, 17 + tailWag, maneColors[2]);

  // Sparkle
  if (animationState === 'idle' && frameIndex % 2 === 0) {
    ctx.fillStyle = '#fde047';
    ctx.fillText('✨', x + 100, y + 20);
  }

  // Z for sleeping
  if (isSleeping) {
    const zY = 4 - (frameIndex % 2);
    ctx.font = `${10}px monospace`;
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('Z', x + 280, y + zY * 12);
  }
};

const drawRobot = (
  ctx: CanvasRenderingContext2D,
  drawPixel: (px: number, py: number, color: string, size?: number) => void,
  frameIndex: number,
  animationState: AnimationState,
  baseColor: string,
  secondaryColor: string,
  eyeColor: string
): void => {
  const legOffset = animationState === 'walk' ? (frameIndex % 2 === 0 ? 0 : 1) : 0;
  const isEating = animationState === 'eat';
  const isSleeping = animationState === 'sleep';

  // Antenna
  drawPixel(13, 1, eyeColor);
  drawPixel(13, 2, '#1e293b');
  drawPixel(13, 3, '#1e293b');

  // Head (rectangular)
  for (let py = 4; py <= 10; py++) {
    for (let px = 7; px <= 19; px++) {
      drawPixel(px, py, baseColor);
    }
  }
  // Head outline
  for (let px = 7; px <= 19; px++) {
    drawPixel(px, 4, secondaryColor);
    drawPixel(px, 10, secondaryColor);
  }
  for (let py = 4; py <= 10; py++) {
    drawPixel(7, py, secondaryColor);
    drawPixel(19, py, secondaryColor);
  }

  // Visor/Eyes
  if (!isSleeping) {
    for (let px = 9; px <= 17; px++) {
      drawPixel(px, 6, '#0f172a');
      drawPixel(px, 7, '#0f172a');
    }
    // Glowing eyes
    const glowIntensity = frameIndex % 2 === 0 ? eyeColor : '#fca5a5';
    drawPixel(10, 6, glowIntensity);
    drawPixel(10, 7, glowIntensity);
    drawPixel(16, 6, glowIntensity);
    drawPixel(16, 7, glowIntensity);
    drawPixel(11, 6, '#ffffff');
    drawPixel(16, 6, '#ffffff');
  } else {
    for (let px = 9; px <= 17; px++) {
      drawPixel(px, 6, '#374151');
      drawPixel(px, 7, '#374151');
    }
    drawPixel(10, 6, '#1f2937');
    drawPixel(16, 6, '#1f2937');
  }

  // Mouth
  if (isEating) {
    for (let px = 11; px <= 15; px++) {
      drawPixel(px, 9, '#dc2626');
    }
  } else {
    for (let px = 12; px <= 14; px++) {
      drawPixel(px, 9, '#1f2937');
    }
  }

  // Neck
  drawPixel(12, 11, secondaryColor);
  drawPixel(13, 11, secondaryColor);
  drawPixel(14, 11, secondaryColor);

  // Body
  for (let py = 12; py <= 20; py++) {
    for (let px = 8; px <= 18; px++) {
      drawPixel(px, py, baseColor);
    }
  }
  // Body outline
  for (let px = 8; px <= 18; px++) {
    drawPixel(px, 20, secondaryColor);
  }
  for (let py = 12; py <= 20; py++) {
    drawPixel(8, py, secondaryColor);
    drawPixel(18, py, secondaryColor);
  }

  // Chest plate details
  for (let py = 14; py <= 18; py++) {
    for (let px = 11; px <= 15; px++) {
      drawPixel(px, py, '#cbd5e1');
    }
  }
  // Power core
  const coreColor = animationState === 'idle' && frameIndex % 2 === 0 ? '#3b82f6' : '#60a5fa';
  drawPixel(13, 15, coreColor);
  drawPixel(13, 16, coreColor);
  drawPixel(12, 16, '#93c5fd');
  drawPixel(14, 16, '#93c5fd');

  // Arms
  const armSwing = animationState === 'walk' ? (frameIndex % 2 === 0 ? 0 : 1) : 0;
  // Left arm
  for (let py = 13 + armSwing; py <= 17 + armSwing; py++) {
    drawPixel(5, py, secondaryColor);
    drawPixel(6, py, baseColor);
    drawPixel(7, py, baseColor);
  }
  // Right arm
  for (let py = 13 - armSwing; py <= 17 - armSwing; py++) {
    drawPixel(19, py, baseColor);
    drawPixel(20, py, baseColor);
    drawPixel(21, py, secondaryColor);
  }

  // Legs
  for (let i = 0; i < 2; i++) {
    drawPixel(10 + i, 21 + legOffset, secondaryColor);
    drawPixel(10 + i, 22 + legOffset, secondaryColor);
    drawPixel(10 + i, 23 + legOffset, '#1e293b');
    drawPixel(16 + i, 21 - legOffset, secondaryColor);
    drawPixel(16 + i, 22 - legOffset, secondaryColor);
    drawPixel(16 + i, 23 - legOffset, '#1e293b');
  }

  // Power indicator lights
  if (animationState === 'idle') {
    drawPixel(11, 20, frameIndex % 2 === 0 ? '#22c55e' : '#86efac');
    drawPixel(15, 20, frameIndex % 2 === 0 ? '#f97316' : '#fdba74');
  }

  // Z for sleeping
  if (isSleeping) {
    const zY = 4 - (frameIndex % 2);
    ctx.font = `${10}px monospace`;
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('Z', x + 280, y + zY * 12);
  }
};

export const drawBattleParticle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number
): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `rgb(${r}, ${g}, ${b})`;
};
