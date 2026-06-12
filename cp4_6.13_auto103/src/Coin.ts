import { PlatformData } from './Platform';

export interface CoinData {
  x: number;
  y: number;
  collected: boolean;
  active: boolean;
  animPhase: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  alpha: number;
  vy: number;
  active: boolean;
}

export class CoinPool {
  private pool: CoinData[] = [];
  private maxPoolSize: number;

  constructor(platformPoolSize: number) {
    this.maxPoolSize = Math.max(15, Math.floor(platformPoolSize * 1.2));
    const initialSize = Math.max(8, Math.floor(this.maxPoolSize * 0.6));
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createEmpty());
    }
  }

  private createEmpty(): CoinData {
    return { x: 0, y: 0, collected: false, active: false, animPhase: 0 };
  }

  public acquire(x: number, y: number): CoinData {
    let coin = this.pool.find((c) => !c.active);
    if (!coin) {
      if (this.pool.length < this.maxPoolSize) {
        coin = this.createEmpty();
        this.pool.push(coin);
      } else {
        coin = this.pool.find((c) => !c.active) || this.pool[0];
      }
    }
    coin.x = x;
    coin.y = y;
    coin.collected = false;
    coin.active = true;
    coin.animPhase = Math.random() * Math.PI * 2;
    return coin;
  }

  public release(coin: CoinData): void {
    coin.active = false;
    coin.collected = false;
  }

  public clear(): void {
    this.pool.forEach((c) => {
      c.active = false;
      c.collected = false;
    });
  }
}

export class FloatingTextPool {
  private pool: FloatingText[] = [];
  private maxPoolSize: number;

  constructor() {
    this.maxPoolSize = 20;
    for (let i = 0; i < 12; i++) {
      this.pool.push(this.createEmpty());
    }
  }

  private createEmpty(): FloatingText {
    return { x: 0, y: 0, text: '', alpha: 0, vy: 0, active: false };
  }

  public acquire(x: number, y: number, text: string): FloatingText {
    let ft = this.pool.find((f) => !f.active);
    if (!ft) {
      if (this.pool.length < this.maxPoolSize) {
        ft = this.createEmpty();
        this.pool.push(ft);
      } else {
        ft = this.pool[0];
      }
    }
    ft.x = x;
    ft.y = y;
    ft.text = text;
    ft.alpha = 1;
    ft.vy = -1.5;
    ft.active = true;
    return ft;
  }

  public getActive(): FloatingText[] {
    return this.pool.filter((f) => f.active);
  }

  public update(): void {
    for (const ft of this.pool) {
      if (!ft.active) continue;
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        ft.active = false;
        ft.alpha = 0;
      }
    }
  }

  public clear(): void {
    this.pool.forEach((f) => (f.active = false));
  }
}

export class CoinManager {
  private coinPool: CoinPool;
  private coins: CoinData[] = [];
  private floatingTextPool: FloatingTextPool;
  private audioContext: AudioContext | null = null;
  private baseCoinChance: number = 0.4;
  private currentScore: number = 0;
  private worldHeight: number;

  constructor(worldWidth: number, worldHeight: number, platformPoolCap: number = 30) {
    this.worldHeight = worldHeight;
    this.coinPool = new CoinPool(platformPoolCap);
    this.floatingTextPool = new FloatingTextPool();
    void worldWidth;
  }

  private initAudio(): void {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch (_e) {
        this.audioContext = null;
      }
    }
  }

  public playCoinSound(): void {
    this.initAudio();
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public setScore(score: number): void {
    this.currentScore = score;
  }

  private getCoinChance(): number {
    const ramp = Math.min(this.currentScore * 0.005, 0.5);
    return this.baseCoinChance + ramp;
  }

  public generateForPlatforms(platforms: PlatformData[]): void {
    const chance = this.getCoinChance();
    const existingSet = new Set(this.coins.filter(c => c.active).map(c => `${c.x.toFixed(1)}_${c.y.toFixed(1)}`));
    for (const plat of platforms) {
      if (Math.random() < chance) {
        const cx = plat.x + plat.width / 2;
        const cy = plat.y - 24;
        const key = `${cx.toFixed(1)}_${cy.toFixed(1)}`;
        if (!existingSet.has(key)) {
          const coin = this.coinPool.acquire(cx, cy);
          this.coins.push(coin);
          existingSet.add(key);
        }
      }
    }
  }

  public update(cameraY: number, playerBounds: { left: number; right: number; top: number; bottom: number }): number {
    const bottomThreshold = cameraY + this.worldHeight * 1.5;
    const playerCX = (playerBounds.left + playerBounds.right) / 2;
    const playerCY = (playerBounds.top + playerBounds.bottom) / 2;
    const collectRadiusX = (playerBounds.right - playerBounds.left) / 2 + 10;
    const collectRadiusY = (playerBounds.bottom - playerBounds.top) / 2 + 10;

    let scoreGained = 0;

    this.coins = this.coins.filter((c) => {
      if (!c.active) return false;
      if (c.y > bottomThreshold) {
        this.coinPool.release(c);
        return false;
      }
      c.animPhase += 0.12;
      if (!c.collected) {
        const dx = Math.abs(c.x - playerCX);
        const dy = Math.abs(c.y - playerCY);
        if (dx < collectRadiusX && dy < collectRadiusY) {
          c.collected = true;
          scoreGained += 1;
          this.floatingTextPool.acquire(c.x, c.y, '+1');
          this.playCoinSound();
          c.active = false;
          return false;
        }
      }
      return true;
    });

    this.floatingTextPool.update();
    return scoreGained;
  }

  public getCoins(): CoinData[] {
    return this.coins.filter((c) => c.active);
  }

  public getFloatingTexts(): FloatingText[] {
    return this.floatingTextPool.getActive();
  }

  public clear(): void {
    this.coinPool.clear();
    this.coins = [];
    this.floatingTextPool.clear();
  }

  public resize(_worldWidth: number, worldHeight: number): void {
    this.worldHeight = worldHeight;
  }
}
