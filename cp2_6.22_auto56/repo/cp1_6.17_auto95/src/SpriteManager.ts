import type { Frame, SpriteData, AnimationClip, SpriteMetadata } from './types';
import { generateSpriteSheet } from './spriteGenerator';

type SpriteType = 'ninja' | 'mage' | 'knight';

interface SpriteMetadataWithType extends SpriteMetadata {
  spriteType?: SpriteType;
}

export class SpriteManager {
  private cache: Map<string, SpriteData> = new Map();

  async loadSprite(metadata: SpriteMetadataWithType): Promise<SpriteData> {
    if (this.cache.has(metadata.id)) {
      return this.cache.get(metadata.id)!;
    }

    let image: HTMLImageElement;

    if (metadata.spriteType) {
      image = await this.loadGeneratedImage(metadata.spriteType);
    } else if (metadata.imageUrl) {
      image = await this.loadImage(metadata.imageUrl);
    } else {
      throw new Error('No image source provided');
    }

    const frames = this.splitSpriteSheet(
      image,
      metadata.frameWidth,
      metadata.frameHeight,
      metadata.columns,
      metadata.rows
    );

    const spriteData: SpriteData = {
      metadata,
      image,
      frames,
    };

    this.cache.set(metadata.id, spriteData);
    return spriteData;
  }

  private loadGeneratedImage(type: SpriteType): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const dataUrl = generateSpriteSheet(type);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load generated sprite: ${type}`));
      img.src = dataUrl;
    });
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  private splitSpriteSheet(
    image: HTMLImageElement,
    frameWidth: number,
    frameHeight: number,
    columns: number,
    rows: number
  ): Frame[] {
    const frames: Frame[] = [];
    let index = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        frames.push({
          index,
          x: col * frameWidth,
          y: row * frameHeight,
          width: frameWidth,
          height: frameHeight,
        });
        index++;
      }
    }

    return frames;
  }

  getFramesFromAnimation(spriteData: SpriteData, animation: AnimationClip): Frame[] {
    return animation.frames.map((af) => {
      const frame = spriteData.frames[af.frameIndex];
      if (!frame) {
        throw new Error(`Frame index ${af.frameIndex} not found`);
      }
      return frame;
    });
  }

  drawFrame(
    ctx: CanvasRenderingContext2D,
    spriteData: SpriteData,
    frameIndex: number,
    dx: number,
    dy: number,
    scale: number = 1
  ): void {
    const frame = spriteData.frames[frameIndex];
    if (!frame) return;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      spriteData.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      dx,
      dy,
      frame.width * scale,
      frame.height * scale
    );
  }

  createThumbnail(spriteData: SpriteData, frameIndex: number, size: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const scale = size / spriteData.metadata.frameWidth;
    this.drawFrame(ctx, spriteData, frameIndex, 0, 0, scale);

    return canvas.toDataURL('image/png');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const spriteManager = new SpriteManager();
