import * as PIXI from 'pixi.js';
import type { Particle } from '../types';

export class ParticleRenderer {
  private container: PIXI.Container;
  private particleContainer: PIXI.ParticleContainer;
  private baseTexture: PIXI.Texture;
  private sprites: PIXI.Sprite[] = [];
  private spritePool: PIXI.Sprite[] = [];
  private width: number;
  private height: number;

  constructor(container: PIXI.Container, width: number, height: number) {
    this.container = container;
    this.width = width;
    this.height = height;

    this.baseTexture = this.createGlowTexture();

    this.particleContainer = new PIXI.ParticleContainer(8000, {
      position: true,
      rotation: false,
      scale: true,
      uvs: false,
      alpha: true,
      tint: true
    });

    this.particleContainer.setProperties({
      position: true,
      scale: true,
      alpha: true,
      tint: true
    });

    this.container.addChild(this.particleContainer);
  }

  private createGlowTexture(): PIXI.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    return PIXI.Texture.from(canvas);
  }

  private getSprite(): PIXI.Sprite {
    if (this.spritePool.length > 0) {
      return this.spritePool.pop()!;
    }
    const sprite = new PIXI.Sprite(this.baseTexture);
    sprite.anchor.set(0.5);
    return sprite;
  }

  private returnSprite(sprite: PIXI.Sprite): void {
    this.spritePool.push(sprite);
  }

  public render(particles: Particle[]): void {
    while (this.sprites.length > particles.length) {
      const sprite = this.sprites.pop()!;
      this.particleContainer.removeChild(sprite);
      this.returnSprite(sprite);
    }

    while (this.sprites.length < particles.length) {
      const sprite = this.getSprite();
      this.particleContainer.addChild(sprite);
      this.sprites.push(sprite);
    }

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const sprite = this.sprites[i];

      if (!particle.active) {
        sprite.visible = false;
        continue;
      }

      sprite.visible = true;
      sprite.x = particle.x;
      sprite.y = particle.y;

      const sizeRatio = particle.size / 32;
      sprite.scale.set(sizeRatio);

      sprite.alpha = particle.alpha;

      const lifeRatio = particle.life / particle.maxLife;
      const r = Math.floor(particle.startColor.r + (particle.endColor.r - particle.startColor.r) * (1 - lifeRatio));
      const g = Math.floor(particle.startColor.g + (particle.endColor.g - particle.startColor.g) * (1 - lifeRatio));
      const b = Math.floor(particle.startColor.b + (particle.endColor.b - particle.startColor.b) * (1 - lifeRatio));
      sprite.tint = (r << 16) | (g << 8) | b;
    }
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public destroy(): void {
    for (const sprite of this.sprites) {
      sprite.destroy();
    }
    for (const sprite of this.spritePool) {
      sprite.destroy();
    }
    this.sprites = [];
    this.spritePool = [];
    this.particleContainer.destroy();
    this.baseTexture.destroy();
  }
}
