export type PatternType = '云纹' | '回纹' | '龙纹' | '鹤纹' | '水波纹';
export type PaperType = '宣纸黄' | '麻纸棕';

export interface PatternConfig {
  type: PatternType;
  color: string;
  size: number;
}

export interface PaperConfig {
  type: PaperType;
  color: string;
  noiseIntensity: number;
}

const PATTERN_SIZE = 200;

export function getPatternTypes(): PatternType[] {
  return ['云纹', '回纹', '龙纹', '鹤纹', '水波纹'];
}

export function getPaperConfigs(): PaperConfig[] {
  return [
    { type: '宣纸黄', color: '#F5E6CA', noiseIntensity: 15 },
    { type: '麻纸棕', color: '#E0D2B5', noiseIntensity: 25 },
  ];
}

export function renderPattern(config: PatternConfig): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = config.size;
  canvas.height = config.size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, config.size, config.size);
  ctx.strokeStyle = config.color;
  ctx.fillStyle = config.color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const s = config.size;
  const scale = s / PATTERN_SIZE;

  switch (config.type) {
    case '云纹':
      drawCloudPattern(ctx, scale, config.color);
      break;
    case '回纹':
      drawMeanderPattern(ctx, scale, config.color);
      break;
    case '龙纹':
      drawDragonPattern(ctx, scale, config.color);
      break;
    case '鹤纹':
      drawCranePattern(ctx, scale, config.color);
      break;
    case '水波纹':
      drawWavePattern(ctx, scale, config.color);
      break;
  }

  return canvas;
}

function drawCloudPattern(ctx: CanvasRenderingContext2D, scale: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5 * scale;

  const drawCloudSpiral = (cx: number, cy: number, r: number, startAngle: number) => {
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 1.8; t += 0.05) {
      const cr = r * (1 - t / (Math.PI * 2.5));
      const x = cx + cr * Math.cos(startAngle + t);
      const y = cy + cr * Math.sin(startAngle + t);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  drawCloudSpiral(60 * scale, 50 * scale, 25 * scale, -Math.PI * 0.5);
  drawCloudSpiral(140 * scale, 50 * scale, 25 * scale, -Math.PI * 0.3);
  drawCloudSpiral(100 * scale, 100 * scale, 30 * scale, -Math.PI * 0.7);
  drawCloudSpiral(50 * scale, 140 * scale, 22 * scale, -Math.PI * 0.1);
  drawCloudSpiral(150 * scale, 150 * scale, 24 * scale, -Math.PI * 0.9);

  ctx.beginPath();
  ctx.arc(80 * scale, 70 * scale, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(130 * scale, 85 * scale, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(70 * scale, 120 * scale, 7 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawMeanderPattern(ctx: CanvasRenderingContext2D, scale: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * scale;

  const drawMeander = (ox: number, oy: number, unit: number) => {
    ctx.beginPath();
    ctx.moveTo(ox, oy + unit);
    ctx.lineTo(ox, oy);
    ctx.lineTo(ox + unit * 3, oy);
    ctx.lineTo(ox + unit * 3, oy + unit * 2);
    ctx.lineTo(ox + unit * 2, oy + unit * 2);
    ctx.lineTo(ox + unit * 2, oy + unit);
    ctx.lineTo(ox + unit, oy + unit);
    ctx.lineTo(ox + unit, oy + unit * 3);
    ctx.lineTo(ox + unit * 4, oy + unit * 3);
    ctx.stroke();
  };

  const unit = 12 * scale;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      drawMeander(10 * scale + col * unit * 4.5, 10 * scale + row * unit * 3.5, unit);
    }
  }
}

function drawDragonPattern(ctx: CanvasRenderingContext2D, scale: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5 * scale;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(100 * scale, 20 * scale);
  ctx.bezierCurveTo(
    130 * scale, 10 * scale,
    160 * scale, 30 * scale,
    170 * scale, 60 * scale
  );
  ctx.bezierCurveTo(
    175 * scale, 80 * scale,
    160 * scale, 100 * scale,
    140 * scale, 110 * scale
  );
  ctx.bezierCurveTo(
    120 * scale, 120 * scale,
    100 * scale, 130 * scale,
    90 * scale, 150 * scale
  );
  ctx.bezierCurveTo(
    80 * scale, 170 * scale,
    60 * scale, 180 * scale,
    40 * scale, 175 * scale
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(150 * scale, 40 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(100 * scale, 20 * scale);
  ctx.bezierCurveTo(
    80 * scale, 15 * scale,
    60 * scale, 20 * scale,
    50 * scale, 35 * scale
  );
  ctx.bezierCurveTo(
    40 * scale, 50 * scale,
    30 * scale, 70 * scale,
    35 * scale, 90 * scale
  );
  ctx.bezierCurveTo(
    40 * scale, 110 * scale,
    50 * scale, 120 * scale,
    70 * scale, 125 * scale
  );
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const fx = 55 * scale + i * 15 * scale;
    const fy = 30 * scale + i * 5 * scale;
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx - 8 * scale, fy - 12 * scale);
    ctx.lineTo(fx + 8 * scale, fy - 8 * scale);
    ctx.closePath();
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(152 * scale, 38 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawCranePattern(ctx: CanvasRenderingContext2D, scale: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * scale;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(120 * scale, 30 * scale);
  ctx.bezierCurveTo(
    130 * scale, 25 * scale,
    150 * scale, 28 * scale,
    155 * scale, 40 * scale
  );
  ctx.bezierCurveTo(
    158 * scale, 48 * scale,
    150 * scale, 55 * scale,
    140 * scale, 55 * scale
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(155 * scale, 33 * scale, 2 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(140 * scale, 55 * scale);
  ctx.bezierCurveTo(
    130 * scale, 70 * scale,
    110 * scale, 90 * scale,
    100 * scale, 110 * scale
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(100 * scale, 110 * scale);
  ctx.lineTo(85 * scale, 170 * scale);
  ctx.moveTo(100 * scale, 110 * scale);
  ctx.lineTo(110 * scale, 175 * scale);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(140 * scale, 55 * scale);
  ctx.lineTo(170 * scale, 80 * scale);
  ctx.moveTo(140 * scale, 55 * scale);
  ctx.lineTo(100 * scale, 70 * scale);
  ctx.moveTo(140 * scale, 50 * scale);
  ctx.lineTo(180 * scale, 60 * scale);
  ctx.moveTo(140 * scale, 50 * scale);
  ctx.lineTo(90 * scale, 55 * scale);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(85 * scale, 170 * scale);
  ctx.lineTo(75 * scale, 180 * scale);
  ctx.lineTo(95 * scale, 180 * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(110 * scale, 175 * scale);
  ctx.lineTo(100 * scale, 185 * scale);
  ctx.lineTo(120 * scale, 185 * scale);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(60 * scale, 140 * scale, 8 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(55 * scale, 145 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.stroke();
}

function drawWavePattern(ctx: CanvasRenderingContext2D, scale: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * scale;

  for (let row = 0; row < 6; row++) {
    const y = 20 * scale + row * 35 * scale;
    ctx.beginPath();
    for (let x = 0; x <= 200 * scale; x += 2) {
      const wave = Math.sin((x / (200 * scale)) * Math.PI * 4 + row * 0.5) * 12 * scale;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  for (let row = 0; row < 6; row++) {
    const y = 35 * scale + row * 35 * scale;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let x = 0; x <= 200 * scale; x += 2) {
      const wave = Math.sin((x / (200 * scale)) * Math.PI * 4 + row * 0.5 + 0.3) * 8 * scale;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export function generatePaperTexture(
  width: number,
  height: number,
  paperConfig: PaperConfig
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = paperConfig.color;
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * paperConfig.noiseIntensity;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }

  for (let i = 0; i < Math.floor(width * height * 0.002); i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const idx = (y * width + x) * 4;
    const fiberLen = Math.floor(Math.random() * 6 + 2);
    const angle = Math.random() * Math.PI;
    for (let j = 0; j < fiberLen; j++) {
      const fx = Math.floor(x + Math.cos(angle) * j);
      const fy = Math.floor(y + Math.sin(angle) * j);
      if (fx >= 0 && fx < width && fy >= 0 && fy < height) {
        const fidx = (fy * width + fx) * 4;
        const shade = (Math.random() - 0.5) * 30;
        data[fidx] = Math.max(0, Math.min(255, data[fidx] + shade));
        data[fidx + 1] = Math.max(0, Math.min(255, data[fidx + 1] + shade));
        data[fidx + 2] = Math.max(0, Math.min(255, data[fidx + 2] + shade));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function generatePatternThumbnail(patternType: PatternType, size: number = 100): HTMLCanvasElement {
  return renderPattern({ type: patternType, color: '#8B3A3A', size });
}
