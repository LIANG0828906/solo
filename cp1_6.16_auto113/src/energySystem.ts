export class EnergyManager {
  totalEnergy: number = 100;
  maxEnergy: number = 100;
  shieldRatio: number = 0.33;
  engineRatio: number = 0.34;
  weaponRatio: number = 0.33;
  shieldEnergy: number = 33;
  engineEnergy: number = 34;
  weaponEnergy: number = 33;
  recoveryTimer: number = 0;
  shieldActive: boolean = false;
  engineActive: boolean = false;
  weaponActive: boolean = false;
  isOverloaded: boolean = false;
  isDepleted: boolean = false;
  pulsePhase: number = 0;

  allocateEnergy(joystickX: number, joystickY: number): void {
    const nx = Math.max(-1, Math.min(1, joystickX / 80));
    const ny = Math.max(-1, Math.min(1, joystickY / 80));

    this.weaponRatio = Math.max(0, -ny);
    const remaining = 1 - this.weaponRatio;

    const shieldBias = Math.max(0.1, -nx + 0.1);
    const engineBias = Math.max(0.1, nx + 0.1);
    const totalBias = shieldBias + engineBias;

    this.shieldRatio = remaining * shieldBias / totalBias;
    this.engineRatio = remaining * engineBias / totalBias;

    this.shieldActive = this.shieldRatio > 0.15;
    this.engineActive = this.engineRatio > 0.15;
    this.weaponActive = this.weaponRatio > 0.15;

    this._distributeEnergy();
  }

  private _distributeEnergy(): void {
    const total = this.totalEnergy;
    this.shieldEnergy = Math.round(total * this.shieldRatio);
    this.engineEnergy = Math.round(total * this.engineRatio);
    this.weaponEnergy = Math.round(total * this.weaponRatio);
  }

  update(deltaTime: number): void {
    this.recoveryTimer += deltaTime;
    if (this.recoveryTimer >= 2) {
      this.recoveryTimer -= 2;
      this.totalEnergy = Math.min(this.maxEnergy, this.totalEnergy + 1);
    }

    if (this.shieldActive) {
      this.totalEnergy -= 2 * deltaTime;
    }
    if (this.engineActive) {
      this.totalEnergy -= 3 * deltaTime;
    }
    if (this.weaponActive) {
      this.totalEnergy -= 4 * deltaTime;
    }

    this.totalEnergy = Math.max(0, this.totalEnergy);
    this.isDepleted = this.totalEnergy <= 0;
    this.isOverloaded = this.totalEnergy < 10 && this.totalEnergy > 0;

    this.pulsePhase += deltaTime * 4;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase -= Math.PI * 2;
    }

    this._distributeEnergy();
  }

  consumeIntercept(): boolean {
    if (this.totalEnergy >= 5) {
      this.totalEnergy -= 5;
      this._distributeEnergy();
      return true;
    }
    return false;
  }

  consumeHit(): void {
    this.totalEnergy = Math.max(0, this.totalEnergy - 10);
    this._distributeEnergy();
  }

  reset(): void {
    this.totalEnergy = this.maxEnergy;
    this.shieldRatio = 0.33;
    this.engineRatio = 0.34;
    this.weaponRatio = 0.33;
    this.recoveryTimer = 0;
    this.shieldActive = false;
    this.engineActive = false;
    this.weaponActive = false;
    this.isOverloaded = false;
    this.isDepleted = false;
    this.pulsePhase = 0;
    this._distributeEnergy();
  }
}
