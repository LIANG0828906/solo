import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PosterConfig,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  FONT_OPTIONS,
  TemplateType,
} from '../server/shared';

interface PosterCanvasProps {
  config: PosterConfig;
  fadeKey: number;
  onImageReady?: (imageData: string) => void;
  width?: number;
  height?: number;
}

interface BrushPressureSample {
  x: number;
  pressure: number;
  ink: number;
  fork: number;
  velocity: number;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function generatePressureCurve(
  charCount: number,
  strokeSamples: number,
  intensity: number,
  seed: number
): BrushPressureSample[] {
  const rand = mulberry32(seed);
  const samples: BrushPressureSample[] = [];
  let remainingInk = 1.0;
  let prevX = 0;
  let prevDirection = 1;

  for (let i = 0; i < strokeSamples; i++) {
    const t = i / (strokeSamples - 1);

    const baseCurve = Math.sin(t * Math.PI) * 0.3 + 0.7;
    const microVariation = (rand() - 0.5) * 0.25;
    let pressure = Math.max(0.15, Math.min(1.0, baseCurve + microVariation));

    const velocity = 0.3 + Math.abs(Math.sin(t * Math.PI * 3.7 + rand() * 0.6)) * 0.7;

    const inkConsumption = 0.0012 + velocity * 0.0018 * intensity;
    remainingInk = Math.max(0.08, remainingInk - inkConsumption);
    if (rand() < 0.02 + intensity * 0.04) {
      remainingInk = Math.min(1.0, remainingInk + 0.08 + rand() * 0.12);
    }

    const directionChange = (rand() - 0.5) * 0.4;
    prevDirection = prevDirection * 0.85 + directionChange * 0.15;
    prevX += prevDirection * (2.2 + velocity * 1.8);
    const forkProbability = smoothstep(0.65, 0.95, 1.0 - remainingInk) * intensity * 0.85;
    const fork = rand() < forkProbability ? rand() * 0.8 + 0.2 : 0;

    samples.push({
      x: prevX,
      pressure,
      ink: remainingInk,
      fork,
      velocity,
    });
  }

  return samples;
}

function renderFeibaiText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontCss: string,
  color: string,
  intensity: number,
  spread: number
): void {
  const seed = text.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 42);
  const samples = generatePressureCurve(text.length, Math.max(30, text.length * 25), intensity, seed);

  const offCanvas = document.createElement('canvas');
  offCanvas.width = CANVAS_WIDTH;
  offCanvas.height = CANVAS_HEIGHT;
  const offCtx = offCanvas.getContext('2d')!;
  offCtx.font = `bold ${fontSize}px ${fontCss}`;
  offCtx.fillStyle = color;
  offCtx.textBaseline = 'top';
  offCtx.fillText(text, x, y);

  const imgData = offCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const data = imgData.data;

  const width = CANVAS_WIDTH;
  const height = CANVAS_HEIGHT;

  const rand = mulberry32(seed ^ 0x9e3779b9);

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const idx = (py * width + px) * 4;
      const alpha = data[idx + 3];
      if (alpha === 0) continue;

      const progress = px / width;
      const sampleIdx = Math.min(samples.length - 1, Math.floor(progress * samples.length));
      const sample = samples[sampleIdx];
      const nextSample = samples[Math.min(samples.length - 1, sampleIdx + 1)];
      const localT = (progress * samples.length) - sampleIdx;
      const ink = sample.ink * (1 - localT) + nextSample.ink * localT;
      const fork = sample.fork * (1 - localT) + nextSample.fork * localT;
      const pressure = sample.pressure * (1 - localT) + nextSample.pressure * localT;
      const velocity = sample.velocity * (1 - localT) + nextSample.velocity * localT;

      let featherThreshold = (1 - ink) * intensity * 0.85;

      if (fork > 0) {
        const branchNoise = (px + py) % 7 < fork * 5 ? 1 : 0;
        featherThreshold += fork * 0.4 * intensity;
        if (branchNoise && rand() < fork * 0.6) {
          const gapSize = Math.floor(fork * 4 + 2);
          if ((px + py) % gapSize < gapSize / 2) {
            data[idx + 3] = Math.floor(alpha * (1 - 0.75 * intensity));
          }
        }
      }

      const noiseVal = rand();
      const pressureFactor = 1.2 - pressure * 0.6;
      if (noiseVal < featherThreshold * pressureFactor) {
        const reduction = 1 - Math.pow(noiseVal / (featherThreshold * pressureFactor));
        data[idx + 3] = Math.floor(alpha * reduction * (0.3 + 0.7 * ink));
      }

      const dirNoise = (rand() - 0.5) * velocity * spread * 6;
      if (Math.abs(dirNoise) > 2 && alpha > 200) {
        const dist = Math.abs(dirNoise);
        data[idx + 3] = Math.floor(alpha * Math.max(0, 1 - dist * 0.15));
      }
    }
  }

  if (spread > 0) {
    for (let pass = 0; pass < Math.ceil(spread * 2); pass++) {
      for (let py = 1; py < height - 1; py++) {
        for (let px = 1; px < width - 1; px++) {
          const idx = (py * width + px) * 4;
          if (data[idx + 3] === 0) {
            let sumA = 0;
            let count = 0;
            for (let oy = -1; oy <= 1; oy++) {
              for (let ox = -1; ox <= 1; ox++) {
                const nIdx = ((py + oy) * width + (px + ox)) * 4;
                if (data[nIdx + 3] > 0) {
                  sumA += data[nIdx + 3];
                  count++;
                }
              }
            }
            if (count > 2) {
              data[idx + 3] = Math.floor(sumA / count * spread * 0.5);
              data[idx] = parseInt(color.slice(1, 3), 16);
              data[idx + 1] = parseInt(color.slice(3, 5), 16);
              data[idx + 2] = parseInt(color.slice(5, 7), 16);
            }
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function drawPaperTexture(ctx: CanvasRenderingContext2D, color: string): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);

  const rand = mulberry32(20240613);
  for (let i = 0; i < 18000; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = rand() * 1.5;
    const a = rand() * 0.04 + 0.01;
    ctx.fillStyle = `rgba(139, 111, 71, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = `rgba(139, 111, 71, ${0.03 + rand() * 0.03})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    const startX = rand() * w;
    const startY = rand() * h;
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + (rand() - 0.5) * 200,
      startY + (rand() - 0.5) * 40);
    ctx.stroke();
  }
}

function drawSeal(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  const fontSize = size * 0.35;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  const pad = size * 0.08;
  const innerSize = size - pad * 2;

  const radius = size * 0.12;
  ctx.beginPath();
  ctx.moveTo(pad + radius, pad);
  ctx.lineTo(size - pad - radius, pad);
  ctx.quadraticCurveTo(size - pad, pad, size - pad, pad + radius);
  ctx.lineTo(size - pad, size - pad - radius);
  ctx.quadraticCurveTo(size - pad, size - pad, size - pad - radius, size - pad);
  ctx.lineTo(pad + radius, size - pad);
  ctx.quadraticCurveTo(pad, size - pad, pad, size - pad - radius);
  ctx.lineTo(pad, pad + radius);
  ctx.quadraticCurveTo(pad, pad, pad + radius, pad);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#F5E6C8';
  ctx.fillRect(pad + 4, pad + 4, innerSize - 8, innerSize - 8);

  const chars = text.slice(0, 4);
  const charsToDraw = chars.split('');
  if (charsToDraw.length > 2 && charsToDraw.length <= 4) {
    const grid = charsToDraw.length;
    const cols = grid === 2;
    const rows = Math.ceil(grid / cols);
    const cellW = innerSize / cols;
    const cellH = innerSize / rows;
    for (let i = 0; i < charsToDraw.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = pad + cellW * col + cellW / 2;
      const cy = pad + cellH * row + cellH / 2;
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.floor(fontSize * 0.9)}px "Ma Shan Zheng", "STKaiti, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(charsToDraw[i], cx, cy);
      ctx.restore();
    }
  } else {
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.floor(fontSize)}px "Ma Shan Zheng", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(charsToDraw.join(''), innerSize / 2 + pad, innerSize / 2 + pad);
  }

  ctx.restore();
}

function drawSignature(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  align: 'left' | 'right' | 'center' = 'right'
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px "Long Cang", "Ma Shan Zheng", cursive`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawClassicalVertical(
  ctx: CanvasRenderingContext2D,
  config: PosterConfig,
  W: number,
  H: number
): void {
  const { text, fontFamily, colors, sealText, signatureText, feibaiIntensity, inkSpread } = config;
  const fontCss = FONT_OPTIONS.find(f => f.value === fontFamily)?.cssFont || 'serif';

  drawPaperTexture(ctx, colors.background);

  ctx.save();
  const marginX = 180;
  const marginY = 140;
  const usableH = H - marginY * 2;
  const chars = text.split('');
  const fontSize = Math.min(Math.floor(usableH / chars.length), 180);
  const startX = W - marginX - fontSize * 0.6;
  const stepY = marginY + (usableH - fontSize * chars.length) / 2;

  const cols = Math.ceil(chars.length / Math.ceil(chars.length / 8));
  const perCol = Math.ceil(chars.length / cols);
  const colStep = fontSize * 1.3;
  const startColX = startX - (cols - 1) * colStep;

  for (let col = 0; col < cols; col++) {
    const colX = startColX + col * colStep;
    for (let i = 0; i < perCol; i++) {
      const char = chars[col * perCol + i];
      if (!char) break;
      const cy = stepY + i * fontSize;
      renderFeibaiText(ctx, char, colX, cy, fontSize, fontCss, colors.text, feibaiIntensity, inkSpread);
    }
  }

  const sealSize = 90;
  drawSeal(ctx, sealText,
    startX + fontSize * 0.3,
    H - marginY - sealSize - 10,
    sealSize,
    colors.accent
  );

  drawSignature(ctx, signatureText,
    startX + fontSize * 0.3,
    H - marginY - sealSize - 130,
    28,
    colors.text
  );

  ctx.strokeStyle = `rgba(139, 111, 71, 0.35)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX - 40, marginY - 40);
  ctx.lineTo(marginX - 40, H - marginY + 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W - marginX + 40, marginY - 40);
  ctx.lineTo(W - marginX + 40, H - marginY + 40);
  ctx.stroke();

  ctx.restore();
}

function drawModernHorizontal(
  ctx: CanvasRenderingContext2D,
  config: PosterConfig,
  W: number,
  H: number
): void {
  const { text, fontFamily, colors, sealText, signatureText, feibaiIntensity, inkSpread } = config;
  const fontCss = FONT_OPTIONS.find(f => f.value === fontFamily)?.cssFont || 'serif';

  drawPaperTexture(ctx, colors.background);
  ctx.save();

  const marginX = 120;
  const marginY = 180;
  const usableW = W - marginX * 2;
  const fontSize = Math.min(Math.floor(usableW / text.length), 160);
  const startY = H / 2 - fontSize / 2 - 20;
  const totalW = fontSize * text.length * 0.85;
  const startX = (W - totalW) / 2;

  renderFeibaiText(ctx, text, startX, startY, fontSize, fontCss, colors.text, feibaiIntensity, inkSpread);

  ctx.fillStyle = `rgba(26, 26, 26, 0.08)`;
  ctx.fillRect(marginX, H / 2 - 1, W - marginX * 2, 1);
  ctx.fillRect(marginX, H / 2 + fontSize * 0.9, W - marginX * 2, 1);

  const sealSize = 80;
  drawSeal(ctx, sealText,
    W - marginX - sealSize - 40,
    marginY - 30,
    sealSize,
    colors.accent
  );
  drawSignature(ctx, signatureText,
    W - marginX - sealSize - 50,
    marginY + sealSize + 20,
    26,
    colors.text,
    'right'
  );

  ctx.restore();
}

function drawInkBlank(
  ctx: CanvasRenderingContext2D,
  config: PosterConfig,
  W: number,
  H: number
): void {
  const { text, fontFamily, colors, sealText, signatureText, feibaiIntensity, inkSpread } = config;
  const fontCss = FONT_OPTIONS.find(f => f.value === fontFamily)?.cssFont || 'serif';

  drawPaperTexture(ctx, colors.background);
  ctx.save();

  const chars = text.split('');
  const isLong = chars.length > 4;
  const marginX = 180;
  const marginY = 200;

  if (isLong) {
    const fontSize = Math.min(Math.floor((W - marginX * 2) / chars.length), 120);
    const totalW = fontSize * chars.length * 0.9;
    const startX = (W - totalW) / 2;
    const startY = H / 2 - fontSize / 2;
    renderFeibaiText(ctx, text, startX, startY, fontSize, fontCss, colors.text, feibaiIntensity, inkSpread);
  } else {
    const fontSize = Math.min(W * 0.22, 340);
    const totalW = fontSize * chars.length * 0.85;
    const startX = (W - totalW) / 2;
    const startY = H / 2 - fontSize / 2 - 40;
    renderFeibaiText(ctx, text, startX, startY, fontSize, fontCss, colors.text, feibaiIntensity, inkSpread);
  }

  const sealSize = 100;
  drawSeal(ctx, sealText,
    W - marginX - sealSize,
    H - marginY - sealSize,
    sealSize,
    colors.accent
  );

  drawSignature(ctx, signatureText,
    marginX + 40,
    marginY + 40,
    30,
    colors.text,
    'left'
  );

  ctx.restore();
}

function drawFanShaped(
  ctx: CanvasRenderingContext2D,
  config: PosterConfig,
  W: number,
  H: number
): void {
  const { text, fontFamily, colors, sealText, signatureText, feibaiIntensity, inkSpread } = config;
  const fontCss = FONT_OPTIONS.find(f => f.value === fontFamily)?.cssFont || 'serif';

  drawPaperTexture(ctx, colors.background);
  ctx.save();

  const cx = W / 2;
  const cy = H * 0.55;
  const outerR = Math.min(W, H) * 0.42;
  const innerR = outerR * 0.62;
  const startAngle = -Math.PI * 0.72;
  const endAngle = -Math.PI * 0.28;
  const totalAngle = endAngle - startAngle;

  ctx.strokeStyle = `rgba(139, 111, 71, 0.5)`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, startAngle, endAngle);
  ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = `rgba(139, 111, 71, 0.15)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, (outerR + innerR) / 2, startAngle, endAngle);
  ctx.stroke();

  const chars = text.split('');
  const fontSize = Math.min(Math.floor((outerR - innerR) * 0.75), 90);
  const charAngle = totalAngle / (chars.length + 1);
  const textR = (outerR + innerR) / 2 - fontSize * 0.1;

  for (let i = 0; i < chars.length; i++) {
    const angle = startAngle + charAngle * (i + 1);
    const px = cx + Math.cos(angle) * textR;
    const py = cy + Math.sin(angle) * textR;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + Math.PI / 2);
    renderFeibaiText(
      ctx,
      chars[i],
      -fontSize * 0.5,
      -fontSize * 0.5,
      fontSize,
      fontCss,
      colors.text,
      feibaiIntensity,
      inkSpread
    );
    ctx.restore();
  }

  const sealSize = 70;
  drawSeal(ctx, sealText,
    cx - sealSize / 2,
    cy + innerR * 0.65,
    sealSize,
    colors.accent
  );

  drawSignature(ctx, signatureText,
    cx,
    cy + innerR * 0.65 + sealSize + 10,
    24,
    colors.text,
    'center'
  );

  ctx.restore();
}

function drawScroll(
  ctx: CanvasRenderingContext2D,
  config: PosterConfig,
  W: number,
  H: number
): void {
  const { text, fontFamily, colors, sealText, signatureText, feibaiIntensity, inkSpread } = config;
  const fontCss = FONT_OPTIONS.find(f => f.value === fontFamily)?.cssFont || 'serif';

  drawPaperTexture(ctx, colors.background);
  ctx.save();

  const rollerR = 35;
  const rollerGrad = ctx.createLinearGradient(0, 0, 0, rollerR * 2);
  rollerGrad.addColorStop(0, '#8B6914');
  rollerGrad.addColorStop(0.5, '#DAA520');
  rollerGrad.addColorStop(1, '#8B6914');
  ctx.fillStyle = rollerGrad;
  ctx.beginPath();
  ctx.ellipse(W / 2, rollerR + 10, W / 2 - 40, rollerR, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(W / 2, H - rollerR - 10, W / 2 - 40, rollerR, 0, 0, Math.PI * 2);
  ctx.fill();

  const topY = rollerR + 25;
  const bottomY = H - rollerR - 25;
  const contentH = bottomY - topY;
  const marginX = 100;

  ctx.fillStyle = `rgba(255, 250, 240, 0.85)`;
  ctx.fillRect(marginX - 30, topY - 20, W - (marginX - 30) * 2, contentH + 40);

  ctx.strokeStyle = `rgba(139, 111, 71, 0.4)`;
  ctx.lineWidth = 2;
  ctx.strokeRect(marginX - 30, topY - 20, W - (marginX - 30) * 2, contentH + 40);

  const chars = text.split('');
  const isVertical = chars.length <= 6;
  const usableH = contentH - 120;
  const usableW = W - marginX * 2;

  if (isVertical) {
    const fontSize = Math.min(Math.floor(usableH / chars.length), 150);
    const stepY = topY + 60 + (usableH - fontSize * chars.length) / 2;
    const colX = W / 2 - fontSize * 0.4;
    for (let i = 0; i < chars.length; i++) {
      renderFeibaiText(ctx, chars[i], colX, stepY + i * fontSize, fontSize, fontCss, colors.text, feibaiIntensity, inkSpread);
    }
  } else {
    const fontSize = Math.min(Math.floor(usableW / chars.length), 130);
    const totalW = fontSize * chars.length * 0.88;
    const startX = (W - totalW) / 2;
    const startY = topY + contentH / 2 - fontSize / 2 - 10;
    renderFeibaiText(ctx, text, startX, startY, fontSize, fontCss, colors.text, feibaiIntensity, inkSpread);
  }

  const sealSize = 80;
  drawSeal(ctx, sealText,
    W - marginX - sealSize - 30,
    bottomY - sealSize - 80,
    sealSize,
    colors.accent
  );

  drawSignature(ctx, signatureText,
    W - marginX - sealSize - 40,
    bottomY - sealSize - 120,
    26,
    colors.text,
    'right'
  );

  ctx.restore();
}

const PosterCanvas: React.FC<PosterCanvasProps> = ({
  config,
  fadeKey,
  onImageReady,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTimerRef = useRef<number | null>(null);

  const W = width;
  const H = height;

  const templateRenderers: Record<TemplateType, (ctx: CanvasRenderingContext2D, cfg: PosterConfig, w: number, h: number) => void> = {
    'classical-vertical': drawClassicalVertical,
    'modern-horizontal': drawModernHorizontal,
    'ink-blank': drawInkBlank,
    'fan-shaped': drawFanShaped,
    'scroll': drawScroll,
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (renderTimerRef.current) {
      cancelAnimationFrame(renderTimerRef.current);
    }

    const startTime = performance.now();

    renderTimerRef.current = requestAnimationFrame(() => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = W;
        canvas.height = H;

        ctx.clearRect(0, 0, W, H);

        const renderer = templateRenderers[config.template];
        if (renderer) {
          renderer(ctx, config, W, H);
        }

        const dataUrl = canvas.toDataURL('image/png');
        onImageReady?.(dataUrl);

        const elapsed = performance.now() - startTime;
        console.log(`[PosterCanvas] Rendered in ${elapsed.toFixed(1)}ms (${(W}x${H})`);
      } catch (err) {
        console.error('[PosterCanvas] Render error:', err);
      }
    });
  }, [config, W, H, onImageReady]);

  useEffect(() => {
    render();
    return () => {
      if (renderTimerRef.current) {
        cancelAnimationFrame(renderTimerRef.current);
      }
    };
  }, [render]);

  const getImageData = useCallback((): string | null => {
    const canvas = canvasRef.current;
    return canvas ? canvas.toDataURL('image/png') : null;
  }, []);

  useEffect(() => {
    (window as any).__getPosterImageData = getImageData;
    return () => {
      delete (window as any).__getPosterImageData;
    };
  }, [getImageData]);

  return (
    <div className={`canvas-wrap`} key={fadeKey}>
      <canvas
        ref={canvasRef}
        className={`poster-canvas canvas-fade`}
        width={W}
        height={H}
      />
    </div>
  );
};

export default PosterCanvas;
