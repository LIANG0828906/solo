export type BrushType = 'splash' | 'pima' | 'fupi' | 'moss' | 'leaf';

export interface BrushPoint {
  x: number;
  y: number;
  pressure: number;
  angle: number;
  speed: number;
  width: number;
  alpha: number;
  size: number;
}

export interface BrushConfig {
  type: BrushType;
  baseSize: number;
  pressure: number;
  angle: number;
}

export class BrushModel {
  private type: BrushType = 'splash';
  private baseSize: number = 12;

  public setType(type: BrushType): void {
    this.type = type;
  }

  public setBaseSize(size: number): void {
    this.baseSize = Math.max(1, Math.min(80, size));
  }

  public getType(): BrushType {
    return this.type;
  }

  public getBaseSize(): number {
    return this.baseSize;
  }

  public computePoints(
    x: number,
    y: number,
    pressure: number,
    speed: number,
    angle: number
  ): BrushPoint[] {
    const points: BrushPoint[] = [];

    switch (this.type) {
      case 'splash':
        points.push(...this.createSplashBrush(x, y, pressure, speed, angle));
        break;
      case 'pima':
        points.push(...this.createPimaBrush(x, y, pressure, speed, angle));
        break;
      case 'fupi':
        points.push(...this.createFupiBrush(x, y, pressure, speed, angle));
        break;
      case 'moss':
        points.push(...this.createMossBrush(x, y, pressure, speed, angle));
        break;
      case 'leaf':
        points.push(...this.createLeafBrush(x, y, pressure, speed, angle));
        break;
    }

    return points;
  }

  private createSplashBrush(
    x: number,
    y: number,
    pressure: number,
    speed: number,
    angle: number
  ): BrushPoint[] {
    const points: BrushPoint[] = [];
    const size = this.baseSize * (0.5 + pressure * 0.8) * (1 - Math.min(speed * 0.3, 0.6));
    const jitter = size * 0.15;

    for (let i = 0; i < 5; i++) {
      const jitterX = (Math.random() - 0.5) * jitter;
      const jitterY = (Math.random() - 0.5) * jitter;
      const pSize = size * (0.6 + Math.random() * 0.6);
      const alpha = (0.3 + pressure * 0.5) * (0.7 + Math.random() * 0.3);

      points.push({
        x: x + jitterX,
        y: y + jitterY,
        pressure,
        angle,
        speed,
        width: pSize,
        alpha,
        size: pSize
      });
    }

    return points;
  }

  private createPimaBrush(
    x: number,
    y: number,
    pressure: number,
    speed: number,
    angle: number
  ): BrushPoint[] {
    const points: BrushPoint[] = [];
    const width = this.baseSize * (0.3 + pressure * 0.7) * Math.max(0.3, 1 - speed * 0.4);
    const length = width * 2.5;

    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const count = Math.max(3, Math.floor(width / 3));

    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) - 0.5;
      const offsetX = t * length * cos;
      const offsetY = t * length * sin;

      const perpX = -sin;
      const perpY = cos;
      const spread = (Math.random() - 0.5) * width * 0.3;

      const alpha = (0.4 + pressure * 0.5) * (1 - Math.abs(t) * 0.6);
      const pSize = width * 0.4 * (1 - Math.abs(t) * 0.5);

      points.push({
        x: x + offsetX + perpX * spread,
        y: y + offsetY + perpY * spread,
        pressure,
        angle,
        speed,
        width: pSize,
        alpha,
        size: pSize
      });
    }

    return points;
  }

  private createFupiBrush(
    x: number,
    y: number,
    pressure: number,
    speed: number,
    angle: number
  ): BrushPoint[] {
    const points: BrushPoint[] = [];
    const width = this.baseSize * (0.4 + pressure * 0.8) * Math.max(0.4, 1 - speed * 0.3);
    const length = width * 2;

    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const count = Math.max(4, Math.floor(width / 2));

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const offsetX = (t - 0.3) * length * cos;
      const offsetY = (t - 0.3) * length * sin;

      const perpX = -sin;
      const perpY = cos;
      const spread = (0.5 - Math.abs(t - 0.5) * 1.5) * width;

      const alpha = (0.3 + pressure * 0.6) * (0.4 + t * 0.6);
      const pSize = width * 0.3 * (0.5 + t * 0.5);

      points.push({
        x: x + offsetX + perpX * spread,
        y: y + offsetY + perpY * spread,
        pressure,
        angle,
        speed,
        width: pSize,
        alpha,
        size: pSize
      });
    }

    return points;
  }

  private createMossBrush(
    x: number,
    y: number,
    pressure: number,
    _speed: number,
    _angle: number
  ): BrushPoint[] {
    const points: BrushPoint[] = [];
    const baseSize = this.baseSize * (0.4 + pressure * 0.6);
    const count = Math.floor(3 + pressure * 6);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * baseSize * 0.8;
      const pSize = baseSize * (0.3 + Math.random() * 0.5);
      const alpha = (0.5 + pressure * 0.4) * (0.6 + Math.random() * 0.4);

      points.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        pressure,
        angle: 0,
        speed: 0,
        width: pSize,
        alpha,
        size: pSize
      });
    }

    return points;
  }

  private createLeafBrush(
    x: number,
    y: number,
    pressure: number,
    _speed: number,
    angle: number
  ): BrushPoint[] {
    const points: BrushPoint[] = [];
    const size = this.baseSize * (0.5 + pressure * 0.7);

    const leafCount = 3;
    const spreadAngle = 40;

    for (let i = 0; i < leafCount; i++) {
      const leafAngle = angle + (i - (leafCount - 1) / 2) * spreadAngle;
      const rad = (leafAngle * Math.PI) / 180;
      const leafLength = size * 1.2;
      const leafWidth = size * 0.4;

      const leafPoints = 5;
      for (let j = 0; j < leafPoints; j++) {
        const t = j / (leafPoints - 1);
        const lx = x + Math.cos(rad) * t * leafLength - Math.sin(rad) * (t - 0.5) * leafWidth * 0.5;
        const ly = y + Math.sin(rad) * t * leafLength + Math.cos(rad) * (t - 0.5) * leafWidth * 0.5;
        const pSize = leafWidth * (0.5 + Math.sin(t * Math.PI) * 0.5);
        const alpha = (0.4 + pressure * 0.5) * (0.6 + Math.sin(t * Math.PI) * 0.4);

        points.push({
          x: lx,
          y: ly,
          pressure,
          angle: leafAngle,
          speed: 0,
          width: pSize,
          alpha,
          size: pSize
        });
      }
    }

    return points;
  }

  public createSplashParticles(
    x: number,
    y: number,
    direction: number,
    pressure: number
  ): Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number }> {
    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number }> = [];
    const count = Math.floor(5 + Math.random() * 4);
    const rad = (direction * Math.PI) / 180;
    const baseSpeed = 2 + pressure * 4;

    for (let i = 0; i < count; i++) {
      const angleOffset = (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = baseSpeed * (0.5 + Math.random() * 0.8);
      const angle = rad + angleOffset;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 3,
        alpha: 0.6 + Math.random() * 0.4,
        life: 0.4
      });
    }

    return particles;
  }
}
