export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

export class PlatformPool {
  private pool: PlatformData[] = [];
  private maxPoolSize: number;

  constructor(initialSize: number = 50, maxPoolSize: number = 100) {
    this.maxPoolSize = maxPoolSize;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createEmpty());
    }
  }

  private createEmpty(): PlatformData {
    return { x: 0, y: 0, width: 0, height: 12, active: false };
  }

  public acquire(x: number, y: number, width: number): PlatformData {
    let platform = this.pool.find((p) => !p.active);
    if (!platform) {
      if (this.pool.length < this.maxPoolSize) {
        platform = this.createEmpty();
        this.pool.push(platform);
      } else {
        platform = this.pool[0];
      }
    }
    platform.x = x;
    platform.y = y;
    platform.width = width;
    platform.height = 12;
    platform.active = true;
    return platform;
  }

  public release(platform: PlatformData): void {
    platform.active = false;
  }

  public getActive(): PlatformData[] {
    return this.pool.filter((p) => p.active);
  }

  public clear(): void {
    this.pool.forEach((p) => (p.active = false));
  }
}

export class PlatformManager {
  private pool: PlatformPool;
  private platforms: PlatformData[] = [];
  private minWidth: number = 80;
  private maxWidth: number = 120;
  private minGap: number = 80;
  private baseMaxGap: number = 140;
  private difficulty: number = 0;
  private worldWidth: number;
  private worldHeight: number;

  constructor(worldWidth: number, worldHeight: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.pool = new PlatformPool();
  }

  public setDifficulty(level: number): void {
    this.difficulty = level;
  }

  public getMaxGap(): number {
    return this.baseMaxGap + this.difficulty * 15;
  }

  public generateInitial(): void {
    this.clear();

    const startPlatform = this.pool.acquire(
      this.worldWidth / 2 - 60,
      this.worldHeight - 80,
      120
    );
    this.platforms.push(startPlatform);

    let lastY = startPlatform.y;
    let lastX = startPlatform.x;

    while (lastY > -this.worldHeight) {
      const gap = this.minGap + Math.random() * (this.getMaxGap() - this.minGap);
      const newY = lastY - gap;
      const width = this.minWidth + Math.random() * (this.maxWidth - this.minWidth);
      const maxX = this.worldWidth - width - 10;
      let newX = 10 + Math.random() * maxX;

      const minDistFromLast = 40;
      while (Math.abs(newX - lastX) < minDistFromLast && maxX > minDistFromLast * 2) {
        newX = 10 + Math.random() * maxX;
      }

      const platform = this.pool.acquire(newX, newY, width);
      this.platforms.push(platform);
      lastY = newY;
      lastX = newX;
    }
  }

  public update(cameraY: number): void {
    const topThreshold = cameraY - this.worldHeight * 0.5;
    const bottomThreshold = cameraY + this.worldHeight * 1.5;

    this.platforms = this.platforms.filter((p) => {
      if (p.y > bottomThreshold) {
        this.pool.release(p);
        return false;
      }
      return true;
    });

    let topmostY = Infinity;
    let topmostX = 0;
    for (const p of this.platforms) {
      if (p.y < topmostY) {
        topmostY = p.y;
        topmostX = p.x;
      }
    }

    while (topmostY > topThreshold) {
      const gap = this.minGap + Math.random() * (this.getMaxGap() - this.minGap);
      const newY = topmostY - gap;
      const width = this.minWidth + Math.random() * (this.maxWidth - this.minWidth);
      const maxX = this.worldWidth - width - 10;
      let newX = 10 + Math.random() * maxX;

      const minDistFromLast = 40;
      let attempts = 0;
      while (Math.abs(newX - topmostX) < minDistFromLast && maxX > minDistFromLast * 2 && attempts < 5) {
        newX = 10 + Math.random() * maxX;
        attempts++;
      }

      const platform = this.pool.acquire(newX, newY, width);
      this.platforms.push(platform);
      topmostY = newY;
      topmostX = newX;
    }
  }

  public getAll(): PlatformData[] {
    return this.platforms;
  }

  public clear(): void {
    this.pool.clear();
    this.platforms = [];
  }

  public resize(worldWidth: number, worldHeight: number): void {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }
}
