export type FontEffectType = 'neon' | 'pixel' | 'handwritten' | 'relief3d' | 'glitch';

export interface FontEffect {
  draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, time: number): void;
}

const NEON_COLORS = ['#FF6B00', '#FF0066', '#00FFFF', '#FF6B00', '#FF00FF'];

export class NeonEffect implements FontEffect {
  draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, time: number): void {
    const flickerPhase = (time % 1500) / 1500;
    const baseAlpha = 0.85 + 0.15 * Math.sin(flickerPhase * Math.PI * 2);
    const colorIndex = Math.floor((time / 800) % NEON_COLORS.length);
    const nextColorIndex = (colorIndex + 1) % NEON_COLORS.length;
    const currentColor = NEON_COLORS[colorIndex];
    const nextColor = NEON_COLORS[nextColorIndex];

    ctx.save();
    ctx.globalAlpha = baseAlpha;

    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowBlur = 8;
    ctx.shadowColor = currentColor;
    ctx.fillStyle = currentColor;
    ctx.fillText(text, x, y);

    ctx.shadowBlur = 20;
    ctx.shadowColor = nextColor;
    ctx.globalAlpha = baseAlpha * 0.6;
    ctx.fillText(text, x, y);

    ctx.shadowBlur = 40;
    ctx.shadowColor = currentColor;
    ctx.globalAlpha = baseAlpha * 0.3;
    ctx.fillText(text, x, y);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, x, y);

    ctx.restore();
  }
}

export class PixelEffect implements FontEffect {
  draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, _time: number): void {
    const fontSize = 64;
    const pixelSize = 8;
    const borderSize = 1;

    const offscreen = document.createElement('canvas');
    offscreen.width = 800;
    offscreen.height = 400;
    const offCtx = offscreen.getContext('2d')!;

    offCtx.font = `bold ${fontSize}px "Courier New", monospace`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillStyle = '#FFFFFF';
    offCtx.fillText(text, 400, 200);

    const imageData = offCtx.getImageData(0, 0, 800, 400);
    const pixels = imageData.data;

    ctx.save();
    const startX = x - 400;
    const startY = y - 200;

    for (let py = 0; py < 400; py += pixelSize) {
      for (let px = 0; px < 800; px += pixelSize) {
        let hasPixel = false;
        let r = 0, g = 0, b = 0, count = 0;

        for (let dy = 0; dy < pixelSize && py + dy < 400; dy++) {
          for (let dx = 0; dx < pixelSize && px + dx < 800; dx++) {
            const idx = ((py + dy) * 800 + (px + dx)) * 4;
            if (pixels[idx + 3] > 128) {
              hasPixel = true;
              r += pixels[idx];
              g += pixels[idx + 1];
              b += pixels[idx + 2];
              count++;
            }
          }
        }

        if (hasPixel && count > 0) {
          const avgR = Math.min(255, r / count + 40);
          const avgG = Math.min(255, g / count + 120);
          const avgB = Math.min(255, b / count + 200);

          ctx.fillStyle = `rgb(${avgR},${avgG},${avgB})`;
          ctx.fillRect(startX + px, startY + py, pixelSize - borderSize, pixelSize - borderSize);

          ctx.strokeStyle = '#1A1A2E';
          ctx.lineWidth = 1;
          ctx.strokeRect(startX + px, startY + py, pixelSize - borderSize, pixelSize - borderSize);
        }
      }
    }

    ctx.restore();
  }
}

export class HandwrittenEffect implements FontEffect {
  private seed = 42;

  private seededRandom(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, _time: number): void {
    this.seed = 42;

    ctx.save();
    ctx.font = '56px "Comic Sans MS", "Segoe Script", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(text);
    const totalWidth = metrics.width;
    let currentX = x - totalWidth / 2;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charWidth = ctx.measureText(char).width;
      const jitterX = (this.seededRandom() - 0.5) * 3;
      const jitterY = (this.seededRandom() - 0.5) * 4;
      const rotation = (this.seededRandom() - 0.5) * 0.08;
      const thickness = 2 + this.seededRandom() * 3;

      ctx.save();
      ctx.translate(currentX + charWidth / 2 + jitterX, y + jitterY);
      ctx.rotate(rotation);

      ctx.lineWidth = thickness;
      ctx.strokeStyle = '#E8D5B7';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeText(char, 0, 0);

      ctx.fillStyle = '#F5E6D0';
      ctx.fillText(char, 0, 0);

      ctx.restore();
      currentX += charWidth;
    }

    ctx.restore();
  }
}

export class Relief3DEffect implements FontEffect {
  draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, _time: number): void {
    ctx.save();
    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 5; i >= 1; i--) {
      ctx.fillStyle = `rgba(0,0,0,${0.15 * i})`;
      ctx.fillText(text, x + i * 0.6, y + i * 0.6);
    }

    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#8B8B8B';
    ctx.fillText(text, x, y);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = '#C0C0C0';
    ctx.fillText(text, x - 1, y - 1);

    const gradient = ctx.createLinearGradient(x - 200, y - 30, x + 200, y + 30);
    gradient.addColorStop(0, '#E8E8E8');
    gradient.addColorStop(0.3, '#FFFFFF');
    gradient.addColorStop(0.5, '#C8C8C8');
    gradient.addColorStop(0.7, '#FFFFFF');
    gradient.addColorStop(1, '#D0D0D0');
    ctx.fillStyle = gradient;
    ctx.fillText(text, x - 1, y - 1);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(text, x - 2, y - 2);

    ctx.restore();
  }
}

export class GlitchEffect implements FontEffect {
  draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, time: number): void {
    ctx.save();
    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const glitchIntensity = Math.sin(time / 200) > 0.7 ? 1 : 0.3;

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,0,0,0.7)';
    ctx.fillText(text, x - 2 * glitchIntensity, y);

    ctx.fillStyle = 'rgba(0,255,0,0.7)';
    ctx.fillText(text, x, y - 1 * glitchIntensity);

    ctx.fillStyle = 'rgba(0,0,255,0.7)';
    ctx.fillText(text, x + 2 * glitchIntensity, y);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#E0E0E0';
    ctx.fillText(text, x, y);

    if (glitchIntensity > 0.5) {
      const numNoiseBlocks = 8 + Math.floor(Math.random() * 12);
      for (let i = 0; i < numNoiseBlocks; i++) {
        const bx = x - 300 + Math.random() * 600;
        const by = y - 40 + Math.random() * 80;
        const bw = 10 + Math.random() * 40;
        const bh = 2 + Math.random() * 6;
        const colors = ['rgba(255,0,0,0.5)', 'rgba(0,255,0,0.5)', 'rgba(0,0,255,0.5)', 'rgba(255,107,0,0.5)'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(bx, by, bw, bh);
      }
    }

    const scanLineCount = 3;
    for (let i = 0; i < scanLineCount; i++) {
      const lineY = y - 40 + Math.random() * 80;
      const sliceShift = (Math.random() - 0.5) * 10 * glitchIntensity;
      ctx.fillStyle = 'rgba(255,107,0,0.15)';
      ctx.fillRect(x - 300, lineY, 600, 2);
      if (glitchIntensity > 0.5) {
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(x - 300 + sliceShift, lineY, 600, 1);
      }
    }

    ctx.restore();
  }
}

export const fontEffectMap: Record<FontEffectType, FontEffect> = {
  neon: new NeonEffect(),
  pixel: new PixelEffect(),
  handwritten: new HandwrittenEffect(),
  relief3d: new Relief3DEffect(),
  glitch: new GlitchEffect(),
};

export const fontEffectLabels: Record<FontEffectType, string> = {
  neon: '霓虹灯',
  pixel: '像素风',
  handwritten: '手写体',
  relief3d: '3D浮雕',
  glitch: '故障艺术',
};

export const fontEffectPreviewText: Record<FontEffectType, string> = {
  neon: 'Aa',
  pixel: 'Aa',
  handwritten: 'Aa',
  relief3d: 'Aa',
  glitch: 'Aa',
};
