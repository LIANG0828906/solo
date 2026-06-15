import type { ExpressionType, SpriteFrame, CharacterSprite, LoadingProgress } from '../types';

const FRAME_GAP = 2;
const FRAMES_PER_EXPRESSION = 2;
const EXPRESSIONS: ExpressionType[] = ['default', 'happy', 'sad', 'angry', 'surprised'];

const CHARACTERS = ['npc_alice', 'npc_bob', 'player'];

function generatePlaceholderSprite(
  width: number,
  height: number,
  color: string,
  expression: ExpressionType
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1e293b');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY - 20, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(centerX - 50, centerY + 80);
  ctx.lineTo(centerX + 50, centerY + 80);
  ctx.lineTo(centerX + 35, centerY + 20);
  ctx.lineTo(centerX - 35, centerY + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX - 15, centerY - 25, 8, 0, Math.PI * 2);
  ctx.arc(centerX + 15, centerY - 25, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  switch (expression) {
    case 'happy':
      ctx.beginPath();
      ctx.arc(centerX - 15, centerY - 25, 4, 0, Math.PI * 2);
      ctx.arc(centerX + 15, centerY - 25, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 5, 15, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      break;
    case 'sad':
      ctx.beginPath();
      ctx.arc(centerX - 15, centerY - 23, 4, 0, Math.PI * 2);
      ctx.arc(centerX + 15, centerY - 23, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY + 5, 15, 1.1 * Math.PI, 1.9 * Math.PI);
      ctx.stroke();
      break;
    case 'angry':
      ctx.beginPath();
      ctx.arc(centerX - 15, centerY - 25, 5, 0, Math.PI * 2);
      ctx.arc(centerX + 15, centerY - 25, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX - 25, centerY - 45);
      ctx.lineTo(centerX - 8, centerY - 38);
      ctx.moveTo(centerX + 25, centerY - 45);
      ctx.lineTo(centerX + 8, centerY - 38);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY - 5);
      ctx.lineTo(centerX + 12, centerY - 5);
      ctx.stroke();
      break;
    case 'surprised':
      ctx.beginPath();
      ctx.arc(centerX - 15, centerY - 25, 6, 0, Math.PI * 2);
      ctx.arc(centerX + 15, centerY - 25, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 2, 10, 0, Math.PI * 2);
      ctx.stroke();
      break;
    default:
      ctx.beginPath();
      ctx.arc(centerX - 15, centerY - 25, 4, 0, Math.PI * 2);
      ctx.arc(centerX + 15, centerY - 25, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY - 5);
      ctx.lineTo(centerX + 12, centerY - 5);
      ctx.stroke();
  }

  const label = expression.charAt(0).toUpperCase() + expression.slice(1);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, centerX, height - 10);

  return canvas;
}

class SpriteManager {
  private static instance: SpriteManager;
  private sprites: Map<string, CharacterSprite> = new Map();
  private progress: LoadingProgress = { total: 0, loaded: 0, percentage: 0, status: 'loading' };
  private progressListeners: Set<(p: LoadingProgress) => void> = new Set();

  private constructor() {}

  static getInstance(): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager();
    }
    return SpriteManager.instance;
  }

  async preloadAll(): Promise<void> {
    this.progress = { total: CHARACTERS.length, loaded: 0, percentage: 0, status: 'loading' };
    this.notifyProgress();

    const frameWidth = 200;
    const frameHeight = 200;
    const totalFrames = EXPRESSIONS.length * FRAMES_PER_EXPRESSION;

    for (const charId of CHARACTERS) {
      try {
        const color = charId.includes('player') ? '#60a5fa' : charId.includes('alice') ? '#f472b6' : '#34d399';

        const spriteSheetCanvas = document.createElement('canvas');
        spriteSheetCanvas.width = (frameWidth + FRAME_GAP) * FRAMES_PER_EXPRESSION;
        spriteSheetCanvas.height = (frameHeight + FRAME_GAP) * EXPRESSIONS.length;
        const sheetCtx = spriteSheetCanvas.getContext('2d')!;

        const frames: Record<ExpressionType, SpriteFrame[]> = {} as Record<ExpressionType, SpriteFrame[]>;

        EXPRESSIONS.forEach((expr, exprIndex) => {
          const frameList: SpriteFrame[] = [];
          const exprCanvas = generatePlaceholderSprite(frameWidth, frameHeight, color, expr);

          for (let i = 0; i < FRAMES_PER_EXPRESSION; i++) {
            const x = i * (frameWidth + FRAME_GAP);
            const y = exprIndex * (frameHeight + FRAME_GAP);
            frameList.push({ x, y, width: frameWidth, height: frameHeight });
            sheetCtx.drawImage(exprCanvas, x, y);
          }
          frames[expr] = frameList;
        });

        const image = new Image();
        image.src = spriteSheetCanvas.toDataURL();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('Failed to load sprite'));
        });

        this.sprites.set(charId, {
          characterId: charId,
          image,
          frames,
          frameWidth,
          frameHeight,
          loaded: true,
          error: false,
        });

        this.progress.loaded++;
        this.progress.percentage = Math.round((this.progress.loaded / this.progress.total) * 100);
        this.notifyProgress();
      } catch (e) {
        this.sprites.set(charId, {
          characterId: charId,
          image: null,
          frames: {} as Record<ExpressionType, SpriteFrame[]>,
          frameWidth: 0,
          frameHeight: 0,
          loaded: false,
          error: true,
        });
        this.progress.status = 'error';
        this.notifyProgress();
      }
    }

    if (this.progress.status !== 'error') {
      this.progress.status = 'success';
      this.progress.percentage = 100;
      this.notifyProgress();
    }
  }

  async retryLoad(): Promise<void> {
    this.sprites.clear();
    await this.preloadAll();
  }

  getSprite(characterId: string): CharacterSprite | undefined {
    return this.sprites.get(characterId);
  }

  getFrame(characterId: string, expression: ExpressionType, frameIndex: number = 0): SpriteFrame | null {
    const sprite = this.sprites.get(characterId);
    if (!sprite || !sprite.loaded || !sprite.image) return null;
    const frames = sprite.frames[expression];
    if (!frames || frames.length === 0) return null;
    return frames[frameIndex % frames.length];
  }

  getProgress(): LoadingProgress {
    return { ...this.progress };
  }

  subscribeToProgress(listener: (p: LoadingProgress) => void): () => void {
    this.progressListeners.add(listener);
    listener(this.progress);
    return () => this.progressListeners.delete(listener);
  }

  private notifyProgress(): void {
    const p = { ...this.progress };
    this.progressListeners.forEach((l) => l(p));
  }

  getCharacterIds(): string[] {
    return CHARACTERS;
  }

  getFrameCount(expression: ExpressionType): number {
    return FRAMES_PER_EXPRESSION;
  }
}

export const spriteManager = SpriteManager.getInstance();
export default SpriteManager;
