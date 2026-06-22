import { v4 as uuidv4 } from 'uuid';
import { TowerData, TowerType, Vector2, BeamSegment, MirrorData } from './types';
import { calculateBeamPath, MirrorObject } from './LightPhysics';
import { eventBus } from './EventBus';

const TOWER_COLORS: Record<TowerType, string> = {
  red: '#ff4444',
  blue: '#4488ff',
  yellow: '#ffdd44',
};

const TOWER_DAMAGE: Record<TowerType, number> = {
  red: 10,
  blue: 5,
  yellow: 0,
};

export class TowerManager {
  private towers: Map<string, TowerData> = new Map();
  private mirrors: Map<string, MirrorData> = new Map();
  private beamCache: Map<string, BeamSegment[]> = new Map();

  addTower(positionId: string, type: TowerType, position: Vector2): TowerData {
    const tower: TowerData = {
      id: uuidv4(),
      positionId,
      type,
      level: 1,
      position,
      rotation: 0,
    };

    this.towers.set(tower.id, tower);
    this.invalidateBeamCache();
    eventBus.emit('tower:placed', { tower });

    return tower;
  }

  addMirror(id: string, position: Vector2, rotation: number = 0): MirrorData {
    const mirror: MirrorData = { id, position, rotation };
    this.mirrors.set(id, mirror);
    return mirror;
  }

  rotateMirror(mirrorId: string, delta: number): void {
    const mirror = this.mirrors.get(mirrorId);
    if (mirror) {
      mirror.rotation += delta;
      this.invalidateBeamCache();
      eventBus.emit('mirror:rotate', { mirrorId, rotation: mirror.rotation });
    }
  }

  getMirror(mirrorId: string): MirrorData | undefined {
    return this.mirrors.get(mirrorId);
  }

  getMirrors(): MirrorData[] {
    return Array.from(this.mirrors.values());
  }

  upgradeTower(towerId: string): boolean {
    const tower = this.towers.get(towerId);
    if (!tower) return false;

    tower.level += 1;
    this.invalidateBeamCache();
    eventBus.emit('tower:upgraded', { towerId, level: tower.level });

    return true;
  }

  removeTower(towerId: string): boolean {
    const result = this.towers.delete(towerId);
    if (result) this.invalidateBeamCache();
    return result;
  }

  getTower(towerId: string): TowerData | undefined {
    return this.towers.get(towerId);
  }

  getTowers(): TowerData[] {
    return Array.from(this.towers.values());
  }

  getDamage(tower: TowerData): number {
    return TOWER_DAMAGE[tower.type] * (1 + (tower.level - 1) * 0.5);
  }

  getBeamSegments(): BeamSegment[] {
    if (this.beamCache.size > 0) {
      return Array.from(this.beamCache.values()).flat();
    }

    const mirrorObjects: MirrorObject[] = Array.from(this.mirrors.values()).map((m) => ({
      id: m.id,
      position: m.position,
      rotation: m.rotation,
      length: 1.5,
    }));

    const allSegments: BeamSegment[] = [];
    const yellowTowers = this.getTowers().filter((t) => t.type === 'yellow');

    for (const tower of this.towers.values()) {
      if (tower.type === 'yellow') continue;

      const directions = this.getBeamDirections(tower);
      const color = TOWER_COLORS[tower.type];

      for (const dir of directions) {
        const segments = calculateBeamPath(
          { x: tower.position.x, y: tower.position.y + 0.5 },
          dir,
          color,
          tower.type,
          mirrorObjects,
          [],
          1 + (tower.level - 1) * 0.3
        );

        let amplified = false;
        for (const yt of yellowTowers) {
          const dist = this.getMinDistanceToTower(segments, yt.position);
          if (dist < 2) {
            amplified = true;
            break;
          }
        }

        if (amplified) {
          segments.forEach((s) => {
            s.intensity *= 1.5;
          });
        }

        allSegments.push(...segments);
      }

      this.beamCache.set(tower.id, allSegments.slice(-allSegments.length));
    }

    return allSegments;
  }

  private getBeamDirections(tower: TowerData): Vector2[] {
    if (tower.type === 'red') {
      return [
        { x: Math.cos(tower.rotation), y: Math.sin(tower.rotation) },
        { x: Math.cos(tower.rotation + 0.2), y: Math.sin(tower.rotation + 0.2) },
        { x: Math.cos(tower.rotation - 0.2), y: Math.sin(tower.rotation - 0.2) },
      ];
    }

    return [{ x: Math.cos(tower.rotation), y: Math.sin(tower.rotation) }];
  }

  private getMinDistanceToTower(segments: BeamSegment[], point: Vector2): number {
    let minDist = Infinity;

    for (const seg of segments) {
      const dx = seg.end.x - seg.start.x;
      const dy = seg.end.y - seg.start.y;
      const lenSq = dx * dx + dy * dy;

      if (lenSq === 0) continue;

      let t = ((point.x - seg.start.x) * dx + (point.y - seg.start.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = seg.start.x + t * dx;
      const projY = seg.start.y + t * dy;

      const dist = Math.sqrt(Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2));
      minDist = Math.min(minDist, dist);
    }

    return minDist;
  }

  private invalidateBeamCache(): void {
    this.beamCache.clear();
  }

  setTowerRotation(towerId: string, rotation: number): void {
    const tower = this.towers.get(towerId);
    if (tower) {
      tower.rotation = rotation;
      this.invalidateBeamCache();
    }
  }

  update(deltaTime: number): void {
    this.invalidateBeamCache();
  }
}

export default TowerManager;
