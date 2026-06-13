import type { CharacterFeatures } from './types';

export class PixelRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number = 10;
  private readonly gridSize: number = 32;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = ctx;
    this.canvas.width = this.gridSize * this.scale;
    this.canvas.height = this.gridSize * this.scale;
    this.ctx.imageSmoothingEnabled = false;
  }

  setScale(scale: number): void {
    this.scale = scale;
    this.canvas.width = this.gridSize * this.scale;
    this.canvas.height = this.gridSize * this.scale;
    this.ctx.imageSmoothingEnabled = false;
  }

  render(features: CharacterFeatures): void {
    this.clear();
    this.drawBackground(features);
    this.drawClothes(features);
    this.drawFace(features);
    this.drawEyes(features);
    this.drawHair(features);
  }

  drawBackground(features: CharacterFeatures): void {
    this.ctx.fillStyle = features.backgroundColor;
    this.ctx.fillRect(0, 0, this.gridSize * this.scale, this.gridSize * this.scale);
  }

  drawFace(features: CharacterFeatures): void {
    const skinColor = features.skinColor;
    const faceX = 10;
    const faceY = 10;
    const faceW = 12;
    const faceH = 13;

    for (let y = 0; y < faceH; y++) {
      for (let x = 0; x < faceW; x++) {
        const py = faceY + y;
        const px = faceX + x;
        if (y === 0 && (x === 0 || x === faceW - 1)) continue;
        if (y === faceH - 1 && (x === 0 || x === faceW - 1)) continue;
        this.drawPixel(px, py, skinColor);
      }
    }

    this.drawPixel(faceX - 1, faceY + 2, skinColor);
    this.drawPixel(faceX + faceW, faceY + 2, skinColor);
    this.drawPixel(faceX - 1, faceY + 3, skinColor);
    this.drawPixel(faceX + faceW, faceY + 3, skinColor);
    this.drawPixel(faceX - 1, faceY + 4, skinColor);
    this.drawPixel(faceX + faceW, faceY + 4, skinColor);
  }

  drawEyes(features: CharacterFeatures): void {
    const eyeColor = features.eyeColor;
    const eyeY = 15;

    this.drawPixel(13, eyeY, eyeColor);
    this.drawPixel(14, eyeY, '#ffffff');
    this.drawPixel(15, eyeY, eyeColor);

    this.drawPixel(17, eyeY, eyeColor);
    this.drawPixel(18, eyeY, '#ffffff');
    this.drawPixel(19, eyeY, eyeColor);

    this.drawPixel(14, eyeY - 1, eyeColor);
    this.drawPixel(18, eyeY - 1, eyeColor);
  }

  drawHair(features: CharacterFeatures): void {
    const hairColor = features.hairColor;
    const style = features.hairStyle;

    switch (style) {
      case 0:
        this.drawHairShort(hairColor);
        break;
      case 1:
        this.drawHairLong(hairColor);
        break;
      case 2:
        this.drawHairPonytail(hairColor);
        break;
      case 3:
        this.drawHairCurly(hairColor);
        break;
      case 4:
        this.drawHairBald();
        break;
      case 5:
        this.drawHairElf(hairColor);
        break;
      default:
        this.drawHairShort(hairColor);
    }
  }

  private drawHairShort(color: string): void {
    for (let x = 9; x <= 22; x++) {
      this.drawPixel(x, 8, color);
      this.drawPixel(x, 9, color);
    }
    for (let x = 10; x <= 21; x++) {
      this.drawPixel(x, 7, color);
    }
    for (let x = 11; x <= 20; x++) {
      this.drawPixel(x, 6, color);
    }
    this.drawPixel(9, 10, color);
    this.drawPixel(22, 10, color);
    this.drawPixel(9, 11, color);
    this.drawPixel(22, 11, color);
  }

  private drawHairLong(color: string): void {
    for (let x = 9; x <= 22; x++) {
      this.drawPixel(x, 8, color);
      this.drawPixel(x, 9, color);
    }
    for (let x = 10; x <= 21; x++) {
      this.drawPixel(x, 7, color);
    }
    for (let x = 11; x <= 20; x++) {
      this.drawPixel(x, 6, color);
    }
    for (let y = 10; y <= 28; y++) {
      this.drawPixel(8, y, color);
      this.drawPixel(23, y, color);
    }
    for (let y = 12; y <= 27; y++) {
      this.drawPixel(9, y, color);
      this.drawPixel(22, y, color);
    }
  }

  private drawHairPonytail(color: string): void {
    for (let x = 9; x <= 22; x++) {
      this.drawPixel(x, 8, color);
      this.drawPixel(x, 9, color);
    }
    for (let x = 10; x <= 21; x++) {
      this.drawPixel(x, 7, color);
    }
    for (let x = 11; x <= 20; x++) {
      this.drawPixel(x, 6, color);
    }
    for (let y = 4; y <= 8; y++) {
      this.drawPixel(15, y, color);
      this.drawPixel(16, y, color);
    }
    for (let y = 2; y <= 4; y++) {
      this.drawPixel(15, y, color);
    }
    this.drawPixel(9, 10, color);
    this.drawPixel(22, 10, color);
  }

  private drawHairCurly(color: string): void {
    for (let x = 8; x <= 23; x++) {
      this.drawPixel(x, 8, color);
      this.drawPixel(x, 9, color);
    }
    for (let x = 9; x <= 22; x++) {
      this.drawPixel(x, 7, color);
    }
    for (let x = 10; x <= 21; x++) {
      this.drawPixel(x, 6, color);
    }
    for (let x = 11; x <= 20; x++) {
      this.drawPixel(x, 5, color);
    }
    this.drawPixel(7, 9, color);
    this.drawPixel(24, 9, color);
    this.drawPixel(7, 10, color);
    this.drawPixel(24, 10, color);
    this.drawPixel(8, 11, color);
    this.drawPixel(23, 11, color);
    this.drawPixel(8, 12, color);
    this.drawPixel(23, 12, color);
    this.drawPixel(7, 11, color);
    this.drawPixel(24, 11, color);
  }

  private drawHairBald(): void {
    // 光头，不绘制头发
  }

  private drawHairElf(color: string): void {
    for (let x = 10; x <= 21; x++) {
      this.drawPixel(x, 8, color);
      this.drawPixel(x, 9, color);
    }
    for (let x = 11; x <= 20; x++) {
      this.drawPixel(x, 7, color);
    }
    for (let x = 12; x <= 19; x++) {
      this.drawPixel(x, 6, color);
    }
    for (let x = 13; x <= 18; x++) {
      this.drawPixel(x, 5, color);
    }
    this.drawPixel(10, 7, color);
    this.drawPixel(21, 7, color);
    this.drawPixel(9, 10, color);
    this.drawPixel(22, 10, color);
    this.drawPixel(9, 11, color);
    this.drawPixel(22, 11, color);
    this.drawPixel(8, 10, '#f5d0a9');
    this.drawPixel(23, 10, '#f5d0a9');
    this.drawPixel(8, 9, '#f5d0a9');
    this.drawPixel(23, 9, '#f5d0a9');
    this.drawPixel(7, 10, '#f5d0a9');
    this.drawPixel(24, 10, '#f5d0a9');
    this.drawPixel(7, 11, '#f5d0a9');
    this.drawPixel(24, 11, '#f5d0a9');
  }

  drawClothes(features: CharacterFeatures): void {
    const clothesColor = features.clothesColor;
    const style = features.clothesStyle;

    switch (style) {
      case 0:
        this.drawClothesTShirt(clothesColor);
        break;
      case 1:
        this.drawClothesArmor(clothesColor);
        break;
      case 2:
        this.drawClothesRobe(clothesColor);
        break;
      case 3:
        this.drawClothesMech(clothesColor);
        break;
      case 4:
        this.drawClothesCloak(clothesColor);
        break;
      default:
        this.drawClothesTShirt(clothesColor);
    }
  }

  private drawClothesTShirt(color: string): void {
    const neckY = 23;
    for (let x = 13; x <= 18; x++) {
      this.drawPixel(x, neckY, color);
    }
    for (let x = 10; x <= 21; x++) {
      this.drawPixel(x, neckY + 1, color);
      this.drawPixel(x, neckY + 2, color);
      this.drawPixel(x, neckY + 3, color);
      this.drawPixel(x, neckY + 4, color);
    }
    for (let x = 8; x <= 23; x++) {
      this.drawPixel(x, neckY + 5, color);
      this.drawPixel(x, neckY + 6, color);
      this.drawPixel(x, neckY + 7, color);
    }
    for (let x = 7; x <= 24; x++) {
      this.drawPixel(x, neckY + 8, color);
    }
  }

  private drawClothesArmor(color: string): void {
    const neckY = 23;
    for (let x = 13; x <= 18; x++) {
      this.drawPixel(x, neckY, color);
    }
    for (let x = 10; x <= 21; x++) {
      this.drawPixel(x, neckY + 1, color);
      this.drawPixel(x, neckY + 2, color);
      this.drawPixel(x, neckY + 3, color);
    }
    for (let x = 9; x <= 22; x++) {
      this.drawPixel(x, neckY + 4, color);
      this.drawPixel(x, neckY + 5, color);
      this.drawPixel(x, neckY + 6, color);
      this.drawPixel(x, neckY + 7, color);
    }
    for (let x = 8; x <= 23; x++) {
      this.drawPixel(x, neckY + 8, color);
    }
    const highlight = '#ffffff';
    const shadow = '#000000';
    this.drawPixel(11, neckY + 2, highlight);
    this.drawPixel(11, neckY + 3, highlight);
    this.drawPixel(20, neckY + 2, shadow);
    this.drawPixel(20, neckY + 3, shadow);
    this.drawPixel(15, neckY + 4, highlight);
    this.drawPixel(16, neckY + 4, highlight);
    this.drawPixel(15, neckY + 5, highlight);
    this.drawPixel(16, neckY + 5, highlight);
  }

  private drawClothesRobe(color: string): void {
    const neckY = 23;
    for (let x = 13; x <= 18; x++) {
      this.drawPixel(x, neckY, color);
    }
    for (let x = 12; x <= 19; x++) {
      this.drawPixel(x, neckY + 1, color);
      this.drawPixel(x, neckY + 2, color);
    }
    for (let x = 11; x <= 20; x++) {
      this.drawPixel(x, neckY + 3, color);
      this.drawPixel(x, neckY + 4, color);
    }
    for (let x = 10; x <= 21; x++) {
      this.drawPixel(x, neckY + 5, color);
      this.drawPixel(x, neckY + 6, color);
      this.drawPixel(x, neckY + 7, color);
      this.drawPixel(x, neckY + 8, color);
    }
    for (let x = 9; x <= 22; x++) {
      this.drawPixel(x, neckY + 9, color);
    }
    const trimColor = '#d4af37';
    this.drawPixel(15, neckY + 1, trimColor);
    this.drawPixel(16, neckY + 1, trimColor);
    this.drawPixel(15, neckY + 2, trimColor);
    this.drawPixel(16, neckY + 2, trimColor);
    this.drawPixel(15, neckY + 3, trimColor);
    this.drawPixel(16, neckY + 3, trimColor);
  }

  private drawClothesMech(color: string): void {
    const neckY = 23;
    for (let x = 13; x <= 18; x++) {
      this.drawPixel(x, neckY, color);
    }
    for (let x = 9; x <= 22; x++) {
      this.drawPixel(x, neckY + 1, color);
      this.drawPixel(x, neckY + 2, color);
    }
    for (let x = 8; x <= 23; x++) {
      this.drawPixel(x, neckY + 3, color);
      this.drawPixel(x, neckY + 4, color);
      this.drawPixel(x, neckY + 5, color);
      this.drawPixel(x, neckY + 6, color);
    }
    for (let x = 7; x <= 24; x++) {
      this.drawPixel(x, neckY + 7, color);
      this.drawPixel(x, neckY + 8, color);
    }
    const glowColor = '#00ffff';
    this.drawPixel(15, neckY + 4, glowColor);
    this.drawPixel(16, neckY + 4, glowColor);
    this.drawPixel(15, neckY + 5, glowColor);
    this.drawPixel(16, neckY + 5, glowColor);
    const panelColor = '#333333';
    this.drawPixel(10, neckY + 3, panelColor);
    this.drawPixel(10, neckY + 4, panelColor);
    this.drawPixel(21, neckY + 3, panelColor);
    this.drawPixel(21, neckY + 4, panelColor);
  }

  private drawClothesCloak(color: string): void {
    const neckY = 23;
    for (let x = 13; x <= 18; x++) {
      this.drawPixel(x, neckY, color);
    }
    for (let x = 11; x <= 20; x++) {
      this.drawPixel(x, neckY + 1, color);
      this.drawPixel(x, neckY + 2, color);
    }
    for (let x = 9; x <= 22; x++) {
      this.drawPixel(x, neckY + 3, color);
      this.drawPixel(x, neckY + 4, color);
    }
    for (let x = 8; x <= 23; x++) {
      this.drawPixel(x, neckY + 5, color);
      this.drawPixel(x, neckY + 6, color);
    }
    for (let x = 7; x <= 24; x++) {
      this.drawPixel(x, neckY + 7, color);
      this.drawPixel(x, neckY + 8, color);
      this.drawPixel(x, neckY + 9, color);
    }
    const shadow = 'rgba(0,0,0,0.3)';
    this.drawPixel(10, neckY + 3, shadow);
    this.drawPixel(10, neckY + 4, shadow);
    this.drawPixel(10, neckY + 5, shadow);
    this.drawPixel(21, neckY + 3, shadow);
    this.drawPixel(21, neckY + 4, shadow);
    this.drawPixel(21, neckY + 5, shadow);
  }

  drawPixel(x: number, y: number, color: string): void {
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
      return;
    }
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.gridSize * this.scale, this.gridSize * this.scale);
  }

  getDataUrl(): string {
    return this.canvas.toDataURL('image/png');
  }
}
