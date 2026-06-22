import {
  Application,
  Container,
  Graphics,
  Texture,
  Sprite,
  Rectangle,
  SCALE_MODES,
  CanvasRenderer,
} from 'pixi.js';
import type { AnimationType, PetStats } from '../data/PetState';

const PET_SIZE = 32;
const SCALE = 6;
const PRIMARY = 0xffa500;
const WHITE = 0xffffff;
const DARK_ORANGE = 0xff8c00;
const EYE_COLOR = 0x333333;
const MOUTH_COLOR = 0xcc3333;

type IdleAnimType = 'yawn' | 'look_around' | 'scratch';

export class PetRenderer {
  private app: Application;
  private petContainer: Container;
  private petSprite: Sprite;
  private petTexture: Graphics;
  private time: number = 0;
  private currentAnimation: AnimationType | null = null;
  private animationStartTime: number = 0;
  private stats: PetStats = { hunger: 50, cleanliness: 50, happiness: 50 };
  private idleCheckTimer: number = 0;
  private idleAnimStartTime: number = 0;
  private currentIdleAnim: IdleAnimType | null = null;
  private lastInteractionTime: number = Date.now();
  private baseY: number = 0;
  private baseX: number = 0;
  private baseRotation: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.app = new Application({
      view: canvas,
      width: canvas.width,
      height: canvas.height,
      backgroundAlpha: 0,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    if (this.app.renderer instanceof CanvasRenderer) {
      this.app.renderer.context.imageSmoothingEnabled = false;
    }
    Texture.SCALE_MODE = SCALE_MODES.NEAREST;

    this.petContainer = new Container();
    this.app.stage.addChild(this.petContainer);

    this.petTexture = this.createPixelPetTexture();
    const tex = this.petTexture.generateTexture();
    tex.baseTexture.scaleMode = SCALE_MODES.NEAREST;
    this.petSprite = new Sprite(tex);

    this.petSprite.scale.set(SCALE);
    this.petSprite.anchor.set(0.5);
    this.petContainer.addChild(this.petSprite);

    this.centerPet();

    this.app.ticker.add(this.tick.bind(this));
  }

  private centerPet(): void {
    this.petContainer.x = this.app.screen.width / 2;
    this.petContainer.y = this.app.screen.height / 2;
    this.baseX = 0;
    this.baseY = 0;
    this.baseRotation = 0;
  }

  private createPixelPetTexture(): Graphics {
    const g = new Graphics();

    for (let y = 0; y < PET_SIZE; y++) {
      for (let x = 0; x < PET_SIZE; x++) {
        const color = this.getPixelColor(x, y);
        if (color !== null) {
          g.beginFill(color);
          g.drawRect(x, y, 1, 1);
          g.endFill();
        }
      }
    }

    return g;
  }

  private getPixelColor(x: number, y: number): number | null {
    const cx = PET_SIZE / 2;
    const cy = PET_SIZE / 2;

    if (y >= 4 && y <= 8 && x >= 8 && x <= 23) {
      if (y === 4 || y === 8) {
        if (x >= 10 && x <= 21) return PRIMARY;
        return null;
      }
      return PRIMARY;
    }

    if (y >= 9 && y <= 10) {
      if (x >= 6 && x <= 25) return PRIMARY;
      return null;
    }

    if (y >= 11 && y <= 20) {
      if (x >= 5 && x <= 26) {
        if (y >= 13 && y <= 18 && x >= 11 && x <= 20) return WHITE;
        return PRIMARY;
      }
      return null;
    }

    if (y >= 21 && y <= 22) {
      if (x >= 7 && x <= 24) return PRIMARY;
      return null;
    }

    if (y >= 23 && y <= 26) {
      if ((x >= 9 && x <= 13) || (x >= 18 && x <= 22)) {
        if (y === 26 && ((x === 9 || x === 13) || (x === 18 || x === 22))) return DARK_ORANGE;
        return PRIMARY;
      }
      return null;
    }

    if (y >= 11 && y <= 14) {
      if (x === 10 || x === 21) return EYE_COLOR;
    }

    if (y >= 16 && y <= 17) {
      if (x >= 14 && x <= 17) return MOUTH_COLOR;
    }

    if (y === 10 && (x === 5 || x === 26)) return DARK_ORANGE;

    return null;
  }

  public setStats(stats: PetStats): void {
    this.stats = { ...stats };
  }

  public setInteractionTime(time: number): void {
    this.lastInteractionTime = time;
  }

  public playAnimation(anim: AnimationType | null): void {
    this.currentAnimation = anim;
    this.animationStartTime = this.time;
    if (anim === null) {
      this.petContainer.x = this.app.screen.width / 2;
      this.petContainer.y = this.app.screen.height / 2;
      this.petSprite.rotation = 0;
      this.baseX = 0;
      this.baseY = 0;
      this.baseRotation = 0;
    }
  }

  private getBreathAmplitude(): number {
    const allHigh =
      this.stats.hunger > 80 && this.stats.cleanliness > 80 && this.stats.happiness > 80;
    const anyHigh =
      this.stats.hunger > 80 || this.stats.cleanliness > 80 || this.stats.happiness > 80;
    if (allHigh) return 3;
    if (anyHigh) return 2;
    return 1.2;
  }

  private isShaking(): boolean {
    return (
      this.stats.hunger < 30 ||
      this.stats.cleanliness < 30 ||
      this.stats.happiness < 30
    );
  }

  private tick(delta: number): void {
    this.time += delta * (1000 / 60);
    this.idleCheckTimer += delta * (1000 / 60);

    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;

    if (this.currentAnimation) {
      this.updateSkillAnimation(centerX, centerY);
    } else if (this.currentIdleAnim) {
      this.updateIdleAnimation(centerX, centerY);
    } else {
      this.updateBreathing(centerX, centerY);
    }

    if (this.idleCheckTimer >= 10000) {
      this.idleCheckTimer = 0;
      if (
        !this.currentAnimation &&
        !this.currentIdleAnim &&
        Date.now() - this.lastInteractionTime >= 30000
      ) {
        const idles: IdleAnimType[] = ['yawn', 'look_around', 'scratch'];
        this.currentIdleAnim = idles[Math.floor(Math.random() * idles.length)];
        this.idleAnimStartTime = this.time;
      }
    }
  }

  private updateBreathing(centerX: number, centerY: number): void {
    const amp = this.getBreathAmplitude();
    const breathY = Math.sin(this.time * 0.004) * amp;

    let offsetX = 0;
    if (this.isShaking()) {
      offsetX = Math.sin(this.time * 0.02) * 2;
    }

    this.petContainer.x = centerX + offsetX;
    this.petContainer.y = centerY + breathY;
    this.petSprite.rotation = 0;
    this.petSprite.scale.set(SCALE);
  }

  private updateSkillAnimation(centerX: number, centerY: number): void {
    const elapsed = this.time - this.animationStartTime;

    switch (this.currentAnimation) {
      case 'dance':
        this.animateDance(elapsed, centerX, centerY);
        break;
      case 'roll':
        this.animateRoll(elapsed, centerX, centerY);
        break;
      case 'sing':
        this.animateSing(elapsed, centerX, centerY);
        break;
      default:
        this.updateBreathing(centerX, centerY);
    }
  }

  private animateDance(elapsed: number, centerX: number, centerY: number): void {
    const duration = 1500;
    const progress = Math.min(elapsed / duration, 1);
    const bounces = 3;
    const bounceProgress = (progress * bounces) % 1;
    const bounceY = Math.abs(Math.sin(bounceProgress * Math.PI)) * -20;
    const rotation = Math.sin(elapsed * 0.01) * 0.3;
    const sideX = Math.sin(elapsed * 0.008) * 15;

    this.petContainer.x = centerX + sideX;
    this.petContainer.y = centerY + bounceY;
    this.petSprite.rotation = rotation;

    if (progress >= 1) {
      this.playAnimation(null);
    }
  }

  private animateRoll(elapsed: number, centerX: number, centerY: number): void {
    const duration = 1200;
    const progress = Math.min(elapsed / duration, 1);
    const rotation = progress * Math.PI * 2;
    const arcHeight = Math.sin(progress * Math.PI) * -25;
    const sideMove = Math.sin(progress * Math.PI * 2) * 30;

    this.petContainer.x = centerX + sideMove;
    this.petContainer.y = centerY + arcHeight;
    this.petSprite.rotation = rotation;

    if (progress >= 1) {
      this.playAnimation(null);
    }
  }

  private animateSing(elapsed: number, centerX: number, centerY: number): void {
    const duration = 1800;
    const progress = Math.min(elapsed / duration, 1);
    const pulse = 1 + Math.sin(elapsed * 0.015) * 0.08;
    const bobY = Math.sin(elapsed * 0.006) * 3;

    this.petContainer.x = centerX;
    this.petContainer.y = centerY + bobY;
    this.petSprite.rotation = 0;
    this.petSprite.scale.set(SCALE * pulse);

    if (progress >= 1) {
      this.playAnimation(null);
    }
  }

  private updateIdleAnimation(centerX: number, centerY: number): void {
    const elapsed = this.time - this.idleAnimStartTime;

    switch (this.currentIdleAnim) {
      case 'yawn':
        this.animateYawn(elapsed, centerX, centerY);
        break;
      case 'look_around':
        this.animateLookAround(elapsed, centerX, centerY);
        break;
      case 'scratch':
        this.animateScratch(elapsed, centerX, centerY);
        break;
    }
  }

  private animateYawn(elapsed: number, centerX: number, centerY: number): void {
    const duration = 1000;
    const progress = Math.min(elapsed / duration, 1);
    const stretch = progress < 0.7 ? Math.sin(progress / 0.7 * Math.PI) : 0;
    const scaleY = 1 + stretch * 0.15;
    const scaleX = 1 - stretch * 0.05;

    this.petContainer.x = centerX;
    this.petContainer.y = centerY;
    this.petSprite.scale.set(SCALE * scaleX, SCALE * scaleY);
    this.petSprite.rotation = 0;

    if (progress >= 1) {
      this.currentIdleAnim = null;
      this.petSprite.scale.set(SCALE);
    }
  }

  private animateLookAround(elapsed: number, centerX: number, centerY: number): void {
    const duration = 1200;
    const progress = Math.min(elapsed / duration, 1);
    const tilt = Math.sin(elapsed * 0.01) * 0.1;
    const shiftX = Math.sin(elapsed * 0.008) * 5;

    this.petContainer.x = centerX + shiftX;
    this.petContainer.y = centerY;
    this.petSprite.rotation = tilt;
    this.petSprite.scale.set(SCALE);

    if (progress >= 1) {
      this.currentIdleAnim = null;
    }
  }

  private animateScratch(elapsed: number, centerX: number, centerY: number): void {
    const duration = 800;
    const progress = Math.min(elapsed / duration, 1);
    const wobble = Math.sin(elapsed * 0.03) * 3;
    const tilt = Math.sin(elapsed * 0.03) * 0.08;

    this.petContainer.x = centerX;
    this.petContainer.y = centerY + wobble;
    this.petSprite.rotation = tilt;
    this.petSprite.scale.set(SCALE);

    if (progress >= 1) {
      this.currentIdleAnim = null;
    }
  }

  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    this.centerPet();
  }

  public destroy(): void {
    this.app.ticker.stop();
    this.app.destroy(true);
  }
}
