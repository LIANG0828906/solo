import type { Creature } from '../types';
import creaturesData from '../data/creatures.json';

export class FetchService {
  static async getCreatures(): Promise<Creature[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return creaturesData as Creature[];
  }

  static drawGeneMap(
    canvas: HTMLCanvasElement,
    creature: Creature,
    width = 180,
    height = 60
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#1a0033');
    bgGrad.addColorStop(1, '#001a4d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const genes = creature.genes;
    const baseColor = creature.primaryColor;

    genes.forEach((gene, idx) => {
      const yOffset = ((idx + 1) * height) / (genes.length + 1);
      const hueShift = (idx * 360) / genes.length;
      const strokeColor = FetchService.shiftHue(baseColor, hueShift);

      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 6;

      const startX = 10;
      const endX = width - 10;
      const midX = (startX + endX) / 2;
      const waveAmp = 8 + (idx % 3) * 4;
      const cpx1 = startX + (midX - startX) / 2;
      const cpx2 = midX + (endX - midX) / 2;
      const cpy1 = yOffset - waveAmp;
      const cpy2 = yOffset + waveAmp;

      ctx.moveTo(startX, yOffset);
      ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, endX, yOffset);
      ctx.stroke();
    });

    ctx.shadowBlur = 0;
  }

  static drawCreaturePreview(
    canvas: HTMLCanvasElement,
    creature: Creature,
    size = 400
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const bodyR = size * 0.28;

    ctx.save();
    ctx.shadowColor = creature.primaryColor;
    ctx.shadowBlur = 20;

    const bodyGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, bodyR);
    bodyGrad.addColorStop(0, FetchService.lightenColor(creature.primaryColor, 30));
    bodyGrad.addColorStop(0.6, creature.primaryColor);
    bodyGrad.addColorStop(1, creature.secondaryColor);

    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
      const r = bodyR + Math.sin(i * 2.3) * (bodyR * 0.15);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.quadraticCurveTo(cx + Math.cos(angle - 0.2) * r * 1.1, cy + Math.sin(angle - 0.2) * r * 1.1, x, y);
    }
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = FetchService.lightenColor(creature.primaryColor, 50);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    FetchService.drawMorphology(ctx, creature.morphology, cx, cy, bodyR, creature);
    FetchService.drawEyes(ctx, cx, cy, bodyR);
  }

  private static drawMorphology(
    ctx: CanvasRenderingContext2D,
    morphology: string[],
    cx: number,
    cy: number,
    bodyR: number,
    creature: Creature
  ): void {
    morphology.forEach((m, i) => {
      const baseAngle = (i * Math.PI * 2) / Math.max(morphology.length, 4);
      switch (m) {
        case '翅膀':
          FetchService.drawWings(ctx, cx, cy, bodyR, creature.primaryColor, creature.secondaryColor);
          break;
        case '鳞片':
          FetchService.drawScales(ctx, cx, cy, bodyR, creature.primaryColor, creature.secondaryColor);
          break;
        case '触须':
        case '触手':
          FetchService.drawTentacles(ctx, cx, cy, bodyR, baseAngle, creature.primaryColor);
          break;
        case '犄角':
          FetchService.drawHorns(ctx, cx, cy, bodyR, creature.secondaryColor);
          break;
        case '尾巴':
          FetchService.drawTail(ctx, cx, cy, bodyR, creature.primaryColor);
          break;
        case '爪子':
          FetchService.drawClaws(ctx, cx, cy, bodyR, creature.secondaryColor);
          break;
        case '毛皮':
          FetchService.drawFur(ctx, cx, cy, bodyR, creature.primaryColor);
          break;
        case '甲壳':
          FetchService.drawShell(ctx, cx, cy, bodyR, creature.primaryColor, creature.secondaryColor);
          break;
        case '尖刺':
          FetchService.drawSpikes(ctx, cx, cy, bodyR, creature.secondaryColor);
          break;
      }
    });
  }

  private static drawWings(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    c1: string,
    c2: string
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.75;
    const wingGrad = ctx.createLinearGradient(cx - bodyR * 2, cy, cx, cy);
    wingGrad.addColorStop(0, c2);
    wingGrad.addColorStop(1, FetchService.lightenColor(c1, 20));

    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(cx + side * bodyR * 0.4, cy - bodyR * 0.1);
      ctx.bezierCurveTo(
        cx + side * bodyR * 2,
        cy - bodyR * 1.2,
        cx + side * bodyR * 1.8,
        cy + bodyR * 0.3,
        cx + side * bodyR * 0.5,
        cy + bodyR * 0.4
      );
      ctx.quadraticCurveTo(
        cx + side * bodyR * 1.2,
        cy - bodyR * 0.2,
        cx + side * bodyR * 0.4,
        cy - bodyR * 0.1
      );
      ctx.closePath();
      ctx.fillStyle = wingGrad;
      ctx.fill();
      ctx.strokeStyle = FetchService.darkenColor(c1, 20);
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();
  }

  private static drawScales(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    c1: string,
    c2: string
  ): void {
    ctx.save();
    const scaleR = bodyR * 0.12;
    for (let ring = 0; ring < 3; ring++) {
      for (let j = 0; j < 8 + ring * 4; j++) {
        const angle = (j * Math.PI * 2) / (8 + ring * 4) + ring * 0.3;
        const r = bodyR * (0.5 + ring * 0.15);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        ctx.beginPath();
        ctx.arc(x, y, scaleR, 0, Math.PI * 2);
        ctx.fillStyle = (ring + j) % 2 === 0 ? c1 : c2;
        ctx.fill();
        ctx.strokeStyle = FetchService.lightenColor(c1, 40);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private static drawTentacles(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    _baseAngle: number,
    color: string
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    for (let t = 0; t < 4; t++) {
      const startAngle = (t * Math.PI * 2) / 4 + Math.PI / 4;
      const sx = cx + Math.cos(startAngle) * bodyR * 0.8;
      const sy = cy + Math.sin(startAngle) * bodyR * 0.8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const len = bodyR * 1.3;
      const seg1x = sx + Math.cos(startAngle + 0.3) * len * 0.5;
      const seg1y = sy + Math.sin(startAngle + 0.3) * len * 0.5 + Math.sin(t) * 10;
      const seg2x = sx + Math.cos(startAngle - 0.3) * len;
      const seg2y = sy + Math.sin(startAngle - 0.3) * len + Math.cos(t) * 15;
      ctx.bezierCurveTo(seg1x, seg1y, seg1x * 1.1, seg1y, seg2x, seg2y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawHorns(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = FetchService.lightenColor(color, 40);
    ctx.lineWidth = 1;
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      const hx = cx + side * bodyR * 0.3;
      const hy = cy - bodyR * 0.8;
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(cx + side * bodyR * 0.6, cy - bodyR * 1.4, cx + side * bodyR * 0.2, cy - bodyR * 1.6);
      ctx.quadraticCurveTo(cx + side * bodyR * 0.1, cy - bodyR * 1.2, hx, hy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  private static drawTail(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    color: string
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = bodyR * 0.2;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx - bodyR * 0.7, cy + bodyR * 0.5);
    ctx.bezierCurveTo(
      cx - bodyR * 1.8,
      cy + bodyR * 1.2,
      cx - bodyR * 1.5,
      cy - bodyR * 0.3,
      cx - bodyR * 2.2,
      cy - bodyR * 0.8
    );
    ctx.stroke();
    ctx.restore();
  }

  private static drawClaws(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    for (let c = 0; c < 4; c++) {
      const angle = (c * Math.PI) / 2 + Math.PI / 4;
      const baseX = cx + Math.cos(angle) * bodyR * 0.9;
      const baseY = cy + Math.sin(angle) * bodyR * 0.9;
      for (let n = -1; n <= 1; n++) {
        ctx.beginPath();
        const clawAngle = angle + n * 0.2;
        const tipX = baseX + Math.cos(clawAngle) * bodyR * 0.3;
        const tipY = baseY + Math.sin(clawAngle) * bodyR * 0.3;
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private static drawFur(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    color: string
  ): void {
    ctx.save();
    ctx.strokeStyle = FetchService.lightenColor(color, 30);
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (let f = 0; f < 60; f++) {
      const angle = Math.random() * Math.PI * 2;
      const r1 = bodyR * (0.7 + Math.random() * 0.2);
      const r2 = r1 + bodyR * (0.08 + Math.random() * 0.12);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawShell(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    c1: string,
    c2: string
  ): void {
    ctx.save();
    const shellGrad = ctx.createLinearGradient(cx, cy - bodyR, cx, cy + bodyR);
    shellGrad.addColorStop(0, c1);
    shellGrad.addColorStop(1, c2);
    ctx.fillStyle = shellGrad;
    ctx.strokeStyle = FetchService.darkenColor(c1, 30);
    ctx.lineWidth = 2;
    for (let seg = 0; seg < 3; seg++) {
      ctx.beginPath();
      const r = bodyR * (0.6 - seg * 0.15);
      ctx.ellipse(cx, cy - bodyR * 0.1, r, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawSpikes(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = FetchService.lightenColor(color, 40);
    ctx.lineWidth = 1;
    for (let s = 0; s < 12; s++) {
      const angle = (s * Math.PI * 2) / 12;
      const baseX1 = cx + Math.cos(angle - 0.1) * bodyR * 0.95;
      const baseY1 = cy + Math.sin(angle - 0.1) * bodyR * 0.95;
      const baseX2 = cx + Math.cos(angle + 0.1) * bodyR * 0.95;
      const baseY2 = cy + Math.sin(angle + 0.1) * bodyR * 0.95;
      const tipX = cx + Math.cos(angle) * bodyR * 1.3;
      const tipY = cy + Math.sin(angle) * bodyR * 1.3;
      ctx.beginPath();
      ctx.moveTo(baseX1, baseY1);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(baseX2, baseY2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawEyes(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    bodyR: number
  ): void {
    ctx.save();
    const eyeOffset = bodyR * 0.3;
    const eyeY = cy - bodyR * 0.15;
    const eyeR = bodyR * 0.08;

    [-1, 1].forEach((side) => {
      const ex = cx + side * eyeOffset;
      ctx.beginPath();
      ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + side * eyeR * 0.3, eyeY, eyeR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + side * eyeR * 0.15, eyeY - eyeR * 0.2, eyeR * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
    });
    ctx.restore();
  }

  private static shiftHue(hex: string, degrees: number): string {
    const { r, g, b } = FetchService.hexToRgb(hex);
    let { h, s, l } = FetchService.rgbToHsl(r, g, b);
    h = (h + degrees / 360) % 1;
    const { r: nr, g: ng, b: nb } = FetchService.hslToRgb(h, s, l);
    return FetchService.rgbToHex(nr, ng, nb);
  }

  private static lightenColor(hex: string, percent: number): string {
    const { r, g, b } = FetchService.hexToRgb(hex);
    const amt = Math.round(2.55 * percent);
    return FetchService.rgbToHex(
      Math.min(255, r + amt),
      Math.min(255, g + amt),
      Math.min(255, b + amt)
    );
  }

  private static darkenColor(hex: string, percent: number): string {
    const { r, g, b } = FetchService.hexToRgb(hex);
    const amt = Math.round(2.55 * percent);
    return FetchService.rgbToHex(
      Math.max(0, r - amt),
      Math.max(0, g - amt),
      Math.max(0, b - amt)
    );
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  private static rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
  }

  private static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  private static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }
}
