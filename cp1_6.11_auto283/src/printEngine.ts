import type { TypeChar, InkParams, PrintResult, CharFont } from './types';

const FONT_MAP: Record<CharFont, string> = {
  songti: '"Noto Serif SC", "SimSun", "宋体", serif',
  kaiti: '"Ma Shan Zheng", "KaiTi", "STKaiti", "楷体", cursive',
  lishu: '"ZCOOL XiaoWei", "LiSu", "隶书", serif'
};

class PerlinNoise {
  private perm: number[];

  constructor(seed: number = Math.random() * 10000) {
    this.perm = this.generatePermutation(seed);
  }

  private generatePermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    let n: number;
    let q: number;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      n = seed % (i + 1);
      q = p[i];
      p[i] = p[n];
      p[n] = q;
    }
    return [...p, ...p];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);
    const aa = this.perm[this.perm[X] + Y];
    const ab = this.perm[this.perm[X] + Y + 1];
    const ba = this.perm[this.perm[X + 1] + Y];
    const bb = this.perm[this.perm[X + 1] + Y + 1];
    const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
    return this.lerp(x1, x2, v);
  }
}

export class PrintEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private noise: PerlinNoise;

  constructor(width: number = 600, height: number = 450) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.noise = new PerlinNoise(42);
  }

  generatePrint(
    characters: TypeChar[],
    inkParams: InkParams,
    isHorizontal: boolean,
    width: number = 600,
    height: number = 450
  ): PrintResult {
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.ctx;

    ctx.fillStyle = '#F5F0E1';
    ctx.fillRect(0, 0, width, height);
    this.addPaperTexture(width, height);

    const fontSize = 28;
    const charW = fontSize + 8;
    const charH = fontSize + 12;
    const startX = 40;
    const startY = 50;
    const charsPerLine = Math.floor((width - 80) / charW);

    let content = '';

    if (isHorizontal) {
      characters.forEach((char, index) => {
        const col = index % charsPerLine;
        const row = Math.floor(index / charsPerLine);
        const x = startX + col * charW;
        const y = startY + row * charH;
        this.drawChar(char.char, x, y, fontSize, char.font, inkParams);
        content += char.char;
        if (col === charsPerLine - 1) content += '\n';
      });
    } else {
      const lines = Math.ceil(characters.length / charsPerLine);
      characters.forEach((char, index) => {
        const col = Math.floor(index / charsPerLine);
        const row = index % charsPerLine;
        const x = width - startX - col * charW - charW / 2;
        const y = startY + row * charH;
        this.drawChar(char.char, x, y, fontSize, char.font, inkParams);
        content += char.char;
        if (row === charsPerLine - 1) content += '\n';
      });
    }

    const imageData = ctx.getImageData(0, 0, width, height);

    return {
      printId: `print_${Date.now()}`,
      content,
      inkQuality: inkParams.inkQuality,
      bleed: inkParams.bleed,
      timestamp: Date.now(),
      imageData,
      dataUrl: this.canvas.toDataURL('image/png')
    };
  }

  private drawChar(
    char: string,
    x: number,
    y: number,
    fontSize: number,
    font: CharFont,
    inkParams: InkParams
  ): void {
    const ctx = this.ctx;
    const inkColor = this.getInkColor(inkParams.inkQuality);
    const blurAmount = this.getBlurAmount(inkParams.inkQuality, inkParams.bleed);

    ctx.save();
    ctx.font = `${fontSize}px ${FONT_MAP[font]}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (blurAmount > 0) {
      ctx.shadowColor = inkColor;
      ctx.shadowBlur = blurAmount;
    }

    ctx.fillStyle = inkColor;
    ctx.globalAlpha = this.getInkOpacity(inkParams);

    ctx.fillText(char, x, y);

    if (inkParams.bleed > 0.5 && inkParams.inkQuality === 'heavy') {
      this.addBleedEffect(char, x, y, fontSize, font, inkParams);
    }

    ctx.restore();
  }

  private addBleedEffect(
    char: string,
    x: number,
    y: number,
    fontSize: number,
    font: CharFont,
    inkParams: InkParams
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.15 * inkParams.bleed;
    ctx.font = `${fontSize * 1.1}px ${FONT_MAP[font]}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const offset = 2 + inkParams.bleed * 3;
      const dx = Math.cos(angle) * offset;
      const dy = Math.sin(angle) * offset;
      ctx.fillText(char, x + dx, y + dy);
    }

    ctx.restore();
  }

  private getInkColor(quality: 'light' | 'medium' | 'heavy'): string {
    switch (quality) {
      case 'light': return '#888888';
      case 'medium': return '#444444';
      case 'heavy': return '#000000';
    }
  }

  private getBlurAmount(quality: 'light' | 'medium' | 'heavy', bleed: number): number {
    switch (quality) {
      case 'light': return 0;
      case 'medium': return 2 + bleed * 2;
      case 'heavy': return 4 + bleed * 4;
    }
  }

  private getInkOpacity(inkParams: InkParams): number {
    const baseOpacity = {
      light: 0.7,
      medium: 0.85,
      heavy: 0.95
    }[inkParams.inkQuality];
    return baseOpacity * (0.5 + inkParams.inkLevel * 0.5);
  }

  private addPaperTexture(width: number, height: number): void {
    const ctx = this.ctx;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const noise = this.noise.noise2D(x * 0.05, y * 0.05);
        const variation = Math.floor(noise * 12);
        data[idx] = Math.min(255, Math.max(0, data[idx] + variation));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + variation));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + variation));
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  generateScrollImage(printResult: PrintResult, targetWidth: number = 280): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !printResult.imageData) return '';

    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = printResult.imageData.width;
    imgCanvas.height = printResult.imageData.height;
    const imgCtx = imgCanvas.getContext('2d');
    if (!imgCtx) return '';
    imgCtx.putImageData(printResult.imageData, 0, 0);

    const aspectRatio = printResult.imageData.height / printResult.imageData.width;
    const targetHeight = Math.floor(targetWidth * aspectRatio);

    canvas.width = targetWidth;
    canvas.height = targetHeight + 40;

    ctx.fillStyle = '#F5F0E1';
    ctx.fillRect(0, 20, targetWidth, targetHeight);

    ctx.drawImage(imgCanvas, 0, 20, targetWidth, targetHeight);

    return canvas.toDataURL('image/png');
  }

  cropPage(printResult: PrintResult, topRatio: number, bottomRatio: number): string {
    if (!printResult.imageData) return '';

    const { width, height } = printResult.imageData;
    const topY = Math.floor(height * topRatio);
    const bottomY = Math.floor(height * bottomRatio);
    const cropHeight = bottomY - topY;

    const canvas = document.createElement('canvas');
    const targetWidth = 128;
    const targetHeight = Math.floor(180 * (cropHeight / width) * (180 / cropHeight));
    canvas.width = targetWidth;
    canvas.height = 180;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = width;
    imgCanvas.height = height;
    const imgCtx = imgCanvas.getContext('2d');
    if (!imgCtx) return '';
    imgCtx.putImageData(printResult.imageData, 0, 0);

    ctx.fillStyle = '#F5F0E1';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.drawImage(
      imgCanvas,
      0, topY, width, cropHeight,
      0, 0, targetWidth, targetHeight
    );

    return canvas.toDataURL('image/png');
  }

  exportHighRes(printResult: PrintResult): string {
    if (!printResult.imageData) return '';

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1200;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#F5F0E1';
    ctx.fillRect(0, 0, 1600, 1200);

    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = printResult.imageData.width;
    imgCanvas.height = printResult.imageData.height;
    const imgCtx = imgCanvas.getContext('2d');
    if (!imgCtx) return '';
    imgCtx.putImageData(printResult.imageData, 0, 0);

    const scale = Math.min(1400 / printResult.imageData.width, 1000 / printResult.imageData.height);
    const drawW = printResult.imageData.width * scale;
    const drawH = printResult.imageData.height * scale;
    const offsetX = (1600 - drawW) / 2;
    const offsetY = (1200 - drawH) / 2;

    ctx.drawImage(imgCanvas, offsetX, offsetY, drawW, drawH);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.strokeRect(offsetX - 10, offsetY - 10, drawW + 20, drawH + 20);

    ctx.font = '48px "Ma Shan Zheng", "KaiTi", serif';
    ctx.fillStyle = '#5C4033';
    ctx.textAlign = 'center';
    ctx.fillText('活字印韵', 800, 1150);

    return canvas.toDataURL('image/png');
  }

  downloadPNG(dataUrl: string, filename: string = 'huozi-print.png'): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
