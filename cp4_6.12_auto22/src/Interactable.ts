export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  bold: boolean;
}

export abstract class Interactable {
  public x: number;
  public y: number;
  public radius: number;
  protected pulsePhase: number = 0;
  public interacted: boolean = false;

  constructor(x: number, y: number, radius: number = 48) {
    this.x = x;
    this.y = y;
    this.radius = radius;
  }

  public abstract onInteract(): FloatingText | null;

  public update(deltaTime: number): void {
    this.pulsePhase += deltaTime * 4;
  }

  public isInRange(playerX: number, playerY: number): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  protected getPulseScale(): number {
    return 1.0 + 0.2 * (0.5 + 0.5 * Math.sin(this.pulsePhase));
  }

  public abstract render(ctx: CanvasRenderingContext2D, playerInRange: boolean): void;

  public abstract reset(): void;
}

export class Chest extends Interactable {
  private opened: boolean = false;
  private goldAmount: number = 10;

  constructor(x: number, y: number) {
    super(x, y, 48);
  }

  public onInteract(): FloatingText | null {
    if (this.opened) return null;
    this.opened = true;
    this.interacted = true;
    return {
      id: Date.now() + Math.random(),
      x: this.x,
      y: this.y - 20,
      text: `获得金币+${this.goldAmount}`,
      color: '#F1C40F',
      life: 1.5,
      maxLife: 1.5,
      size: 20,
      bold: true
    };
  }

  public getGoldAmount(): number {
    return this.opened ? 0 : this.goldAmount;
  }

  public isOpened(): boolean {
    return this.opened;
  }

  public render(ctx: CanvasRenderingContext2D, playerInRange: boolean): void {
    const size = 28;
    const halfSize = size / 2;

    if (playerInRange) {
      const scale = this.getPulseScale();
      ctx.save();
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 30 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const bodyColor = this.opened ? '#F1C40F' : '#3498DB';
    const borderColor = '#F1C40F';

    ctx.fillStyle = bodyColor;
    ctx.fillRect(this.x - halfSize, this.y - halfSize, size, size);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x - halfSize, this.y - halfSize, size, size);

    if (!this.opened) {
      ctx.fillStyle = '#F1C40F';
      ctx.fillRect(this.x - 4, this.y - 2, 8, 8);
    } else {
      ctx.fillStyle = '#7D6608';
      ctx.fillRect(this.x - halfSize + 4, this.y - halfSize + 4, size - 8, 6);
    }
  }

  public reset(): void {
    this.opened = false;
    this.interacted = false;
    this.pulsePhase = 0;
  }
}

export class Teleport extends Interactable {
  public targetX: number;
  public targetY: number;

  constructor(x: number, y: number, targetX: number, targetY: number) {
    super(x, y, 48);
    this.targetX = targetX;
    this.targetY = targetY;
  }

  public onInteract(): FloatingText | null {
    this.interacted = true;
    return {
      id: Date.now() + Math.random(),
      x: this.x,
      y: this.y - 20,
      text: '传送!',
      color: '#2ECC71',
      life: 1.0,
      maxLife: 1.0,
      size: 18,
      bold: true
    };
  }

  public render(ctx: CanvasRenderingContext2D, playerInRange: boolean): void {
    const size = 32;
    const halfSize = size / 2;

    if (playerInRange) {
      const scale = this.getPulseScale();
      ctx.save();
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 32 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);

    ctx.fillStyle = '#2ECC71';
    ctx.fillRect(-halfSize, -halfSize, size, size);

    ctx.strokeStyle = '#27AE60';
    ctx.lineWidth = 2;
    ctx.strokeRect(-halfSize, -halfSize, size, size);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-halfSize + 4, -halfSize + 4, size - 16, size - 16);

    ctx.restore();
  }

  public reset(): void {
    this.interacted = false;
    this.pulsePhase = 0;
  }
}
