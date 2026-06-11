import { Star, STAR_MAP_CENTER_X, STAR_MAP_CENTER_Y, STAR_MAP_RADIUS, getRotatedStarPos } from './starMap';

export interface NavigationRecord {
  id: number;
  direction: string;
  targetName: string;
  time: number;
}

export const COMPASS_DIRECTIONS = [
  '北', '北东北', '东北', '东东北',
  '东', '东东南', '东南', '南东南',
  '南', '南西南', '西南', '西西南',
  '西', '西西北', '西北', '北西北'
];

export function getCompassDirection(angleDeg: number): string {
  let normalized = ((angleDeg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_DIRECTIONS[index];
}

export function calculateNavigationAngle(star: Star, rotationDeg: number): number {
  const pos = getRotatedStarPos(star, rotationDeg);
  const dx = pos.x - STAR_MAP_CENTER_X;
  const dy = pos.y - STAR_MAP_CENTER_Y;
  const angleRad = Math.atan2(dy, dx);
  let angleDeg = (angleRad * 180) / Math.PI;
  let compassDeg = 90 - angleDeg;
  if (compassDeg < 0) compassDeg += 360;
  return compassDeg;
}

export function calculateHorizonPoint(star: Star, rotationDeg: number): { x: number; y: number } {
  const pos = getRotatedStarPos(star, rotationDeg);
  const dx = pos.x - STAR_MAP_CENTER_X;
  const dy = pos.y - STAR_MAP_CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: STAR_MAP_CENTER_X, y: STAR_MAP_CENTER_Y + STAR_MAP_RADIUS };
  const nx = dx / dist;
  const ny = dy / dist;
  const horizonR = STAR_MAP_RADIUS + 20;
  return {
    x: STAR_MAP_CENTER_X + nx * horizonR,
    y: STAR_MAP_CENTER_Y + ny * horizonR,
  };
}

export function getTimeFromHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export function formatRecord(index: number, direction: string, targetName: string): string {
  return `第${index}次转向：${direction}方位（目标：星宿${targetName}）`;
}

export class NavigationState {
  public records: NavigationRecord[] = [];
  public selectedStar: Star | null = null;
  public currentTime: number = 0;
  public currentRotation: number = 0;
  private recordCounter: number = 0;
  private maxRecords: number = 20;

  public setSelectedStar(star: Star): boolean {
    if (this.selectedStar && this.selectedStar.id === star.id) return false;
    this.selectedStar = star;
    this.recordCounter++;
    const direction = getCompassDirection(calculateNavigationAngle(star, this.currentRotation));
    this.records.push({
      id: this.recordCounter,
      direction,
      targetName: star.name,
      time: this.currentTime,
    });
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
    return true;
  }

  public updateTime(hours: number): void {
    this.currentTime = hours;
    this.currentRotation = hours * 15;
  }

  public getCurrentDirection(): string {
    if (!this.selectedStar) return '北';
    return getCompassDirection(calculateNavigationAngle(this.selectedStar, this.currentRotation));
  }

  public clearRecords(): void {
    this.records = [];
    this.recordCounter = 0;
  }

  public getCompassAngle(): number {
    if (!this.selectedStar) return 0;
    return calculateNavigationAngle(this.selectedStar, this.currentRotation);
  }

  public reset(): void {
    this.records = [];
    this.selectedStar = null;
    this.currentTime = 0;
    this.currentRotation = 0;
    this.recordCounter = 0;
  }
}
