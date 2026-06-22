export class Player {
  name: string = '铁面镖师';
  hp: number = 100;
  maxHp: number = 100;
  level: number = 1;
  xp: number = 0;
  xpToLevel: number = 100;
  silver: number = 50;
  weaponLevel: number = 1;
  food: number = 3;
  isUpgrading: boolean = false;
  upgradeTimer: number = 0;
  private upgradeDuration: number = 90;
  swingAngle: number = 0;
  isSwinging: boolean = false;
  swingTimer: number = 0;

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addXp(amount: number): boolean {
    this.xp += amount;
    if (this.xp >= this.xpToLevel) {
      this.levelUp();
      return true;
    }
    return false;
  }

  levelUp(): void {
    this.level++;
    this.xp -= this.xpToLevel;
    this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
    this.maxHp += 10;
    this.hp = this.maxHp;
    this.isUpgrading = true;
    this.upgradeTimer = this.upgradeDuration;
  }

  startSwing(): void {
    this.isSwinging = true;
    this.swingTimer = 12;
  }

  update(): void {
    if (this.isUpgrading) {
      this.upgradeTimer--;
      if (this.upgradeTimer <= 0) {
        this.isUpgrading = false;
      }
    }
    if (this.isSwinging) {
      this.swingTimer--;
      this.swingAngle = (12 - this.swingTimer) / 12 * Math.PI * 0.8;
      if (this.swingTimer <= 0) {
        this.isSwinging = false;
        this.swingAngle = 0;
      }
    }
  }

  addSilver(amount: number): void {
    this.silver += amount;
  }

  spendSilver(amount: number): boolean {
    if (this.silver >= amount) {
      this.silver -= amount;
      return true;
    }
    return false;
  }

  buyFood(): boolean {
    const cost = 20;
    if (this.spendSilver(cost)) {
      this.food++;
      return true;
    }
    return false;
  }

  useFood(): boolean {
    if (this.food > 0) {
      this.food--;
      this.heal(30);
      return true;
    }
    return false;
  }

  upgradeWeapon(): boolean {
    const cost = 30 * this.weaponLevel;
    if (this.spendSilver(cost)) {
      this.weaponLevel++;
      return true;
    }
    return false;
  }

  getAttackRange(): number {
    return 30 + this.weaponLevel * 10;
  }

  getHpRatio(): number {
    return this.hp / this.maxHp;
  }

  getXpRatio(): number {
    return this.xp / this.xpToLevel;
  }
}
