export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isNew: boolean;
  spawnTime: number;
  fadeOut: boolean;
  fadeOutStartTime: number;
}

const PLATFORM_COLORS = ['#22c55e', '#3b82f6', '#a855f7'];
const MIN_PLATFORM_WIDTH = 40;
const MAX_PLATFORM_WIDTH = 120;
const PLATFORM_HEIGHT = 16;
const MIN_GAP_HORIZONTAL = 30;
const MAX_GAP_HORIZONTAL = 80;
const MAX_GAP_VERTICAL = 80;
const GROUND_HEIGHT = 40;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export class LevelGenerator {
  private platforms: Platform[] = [];
  private nextId: number = 1;
  private levelNumber: number = 1;
  private difficultyHistory: { avgGap: number; avgHeightDiff: number }[] = [];

  generateInitialLevel(): Platform[] {
    this.platforms = [];
    this.nextId = 1;

    let currentX = 50;
    let currentY = CANVAS_HEIGHT - GROUND_HEIGHT - 80;

    for (let i = 0; i < 16; i++) {
      const width = this.randomRange(MIN_PLATFORM_WIDTH, MAX_PLATFORM_WIDTH);
      const color = PLATFORM_COLORS[Math.floor(Math.random() * PLATFORM_COLORS.length)];

      this.platforms.push({
        id: this.nextId++,
        x: currentX,
        y: currentY,
        width,
        height: PLATFORM_HEIGHT,
        color,
        isNew: false,
        spawnTime: 0,
        fadeOut: false,
        fadeOutStartTime: 0,
      });

      const gapX = this.randomRange(MIN_GAP_HORIZONTAL, MAX_GAP_HORIZONTAL);
      const gapY = this.randomRange(-MAX_GAP_VERTICAL, MAX_GAP_VERTICAL);

      currentX += width + gapX;
      currentY = Math.max(100, Math.min(CANVAS_HEIGHT - GROUND_HEIGHT - 40, currentY + gapY));

      if (currentX + width > CANVAS_WIDTH - 50) {
        currentX = 50;
        currentY -= 80;
      }
    }

    this.updateDifficultyHistory();
    return this.platforms;
  }

  addPlatform(playerX: number, playerY: number, currentTime: number): Platform {
    const nearestPlatform = this.findNearestPlatform(playerX, playerY);

    let newX: number;
    let newY: number;

    if (nearestPlatform) {
      const gap = this.randomRange(20, 80);
      const side = Math.random() > 0.5 ? 1 : -1;
      newX = nearestPlatform.x + (side > 0 ? nearestPlatform.width + gap : -gap - 60);
      const heightDiff = this.randomRange(-40, 40);
      newY = Math.max(80, Math.min(CANVAS_HEIGHT - GROUND_HEIGHT - 40, nearestPlatform.y + heightDiff));
    } else {
      newX = CANVAS_WIDTH + 20;
      newY = CANVAS_HEIGHT - GROUND_HEIGHT - 100;
    }

    newX = Math.max(20, Math.min(CANVAS_WIDTH - 100, newX));

    const width = this.randomRange(MIN_PLATFORM_WIDTH, MAX_PLATFORM_WIDTH);
    const color = PLATFORM_COLORS[Math.floor(Math.random() * PLATFORM_COLORS.length)];

    const newPlatform: Platform = {
      id: this.nextId++,
      x: CANVAS_WIDTH + 10,
      y: newY,
      width,
      height: PLATFORM_HEIGHT,
      color,
      isNew: true,
      spawnTime: currentTime,
      fadeOut: false,
      fadeOutStartTime: 0,
    };

    newPlatform.x = newX;

    this.platforms.push(newPlatform);
    this.levelNumber++;
    this.updateDifficultyHistory();

    return newPlatform;
  }

  removeOldestPlatform(currentTime: number): void {
    const activePlatforms = this.platforms.filter(p => !p.fadeOut && p.spawnTime <= currentTime - 300);
    if (activePlatforms.length > 0) {
      const oldest = activePlatforms.reduce((a, b) => a.spawnTime < b.spawnTime ? a : b);
      oldest.fadeOut = true;
      oldest.fadeOutStartTime = currentTime;
    }
  }

  updatePlatforms(currentTime: number): void {
    const slideDuration = 500;
    const fadeDuration = 300;

    this.platforms = this.platforms.filter(platform => {
      if (platform.fadeOut) {
        const elapsed = currentTime - platform.fadeOutStartTime;
        if (elapsed >= fadeDuration) {
          return false;
        }
      }
      return true;
    });

    for (const platform of this.platforms) {
      if (platform.isNew) {
        const elapsed = currentTime - platform.spawnTime;
        if (elapsed >= slideDuration) {
          platform.isNew = false;
        }
      }
    }
  }

  getPlatformSlideProgress(platform: Platform, currentTime: number): number {
    if (!platform.isNew) return 1;
    const elapsed = currentTime - platform.spawnTime;
    const progress = Math.min(1, elapsed / 500);
    return this.easeOut(progress);
  }

  getPlatformFadeOpacity(platform: Platform, currentTime: number): number {
    if (!platform.fadeOut) return 1;
    const elapsed = currentTime - platform.fadeOutStartTime;
    return Math.max(0, 1 - elapsed / 300);
  }

  getPlatforms(): Platform[] {
    return this.platforms;
  }

  getLevelNumber(): number {
    return this.levelNumber;
  }

  getActivePlatformCount(): number {
    return this.platforms.filter(p => !p.fadeOut).length;
  }

  getDifficultyHistory(): { avgGap: number; avgHeightDiff: number }[] {
    return this.difficultyHistory.slice(-10);
  }

  reset(): void {
    this.levelNumber = 1;
    this.difficultyHistory = [];
    this.generateInitialLevel();
  }

  private findNearestPlatform(x: number, y: number): Platform | null {
    let nearest: Platform | null = null;
    let minDist = Infinity;

    for (const platform of this.platforms) {
      if (platform.fadeOut) continue;
      const dist = Math.hypot(platform.x + platform.width / 2 - x, platform.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = platform;
      }
    }

    return nearest;
  }

  private updateDifficultyHistory(): void {
    if (this.platforms.length < 2) return;

    const activePlatforms = this.platforms.filter(p => !p.fadeOut);
    if (activePlatforms.length < 2) return;

    let totalGap = 0;
    let totalHeightDiff = 0;
    let count = 0;

    for (let i = 0; i < activePlatforms.length - 1; i++) {
      const a = activePlatforms[i];
      const b = activePlatforms[i + 1];
      const gap = Math.abs(b.x - (a.x + a.width));
      const heightDiff = Math.abs(b.y - a.y);
      totalGap += gap;
      totalHeightDiff += heightDiff;
      count++;
    }

    if (count > 0) {
      this.difficultyHistory.push({
        avgGap: totalGap / count,
        avgHeightDiff: totalHeightDiff / count,
      });
    }
  }

  private randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
