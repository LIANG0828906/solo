export class WindSystem {
  private currentDirection: number = Math.random() * 360;
  private currentStrength: number = 1 + Math.random() * 2;
  private targetDirection: number = this.currentDirection;
  private targetStrength: number = this.currentStrength;
  private lastChangeTime: number = Date.now();
  private changeInterval: number = 8000;
  private lerpSpeed: number = 0.02;

  update(): void {
    const now = Date.now();
    if (now - this.lastChangeTime >= this.changeInterval) {
      this.targetDirection = Math.random() * 360;
      this.targetStrength = Math.random() * 5;
      this.lastChangeTime = now;
    }

    this.currentDirection = this.lerpAngle(
      this.currentDirection,
      this.targetDirection,
      this.lerpSpeed
    );
    this.currentStrength = this.lerp(
      this.currentStrength,
      this.targetStrength,
      this.lerpSpeed
    );
  }

  private lerpAngle(current: number, target: number, t: number): number {
    let diff = target - current;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return current + diff * t;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  getDirection(): number {
    return this.currentDirection;
  }

  getStrength(): number {
    return this.currentStrength;
  }

  getTargetDirection(): number {
    return this.targetDirection;
  }

  getTargetStrength(): number {
    return this.targetStrength;
  }
}
