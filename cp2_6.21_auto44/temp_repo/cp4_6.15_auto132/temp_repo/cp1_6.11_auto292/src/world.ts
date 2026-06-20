export enum SceneryType {
  VILLAGE = 'village',
  RELAY = 'relay',
  TEA_SHED = 'tea_shed',
  FOREST = 'forest'
}

export interface SceneryObject {
  x: number;
  type: SceneryType;
  width: number;
  height: number;
  treeCount?: number;
}

export interface RoadEvent {
  type: 'bandit' | 'milestone';
  triggerDistance: number;
  triggered: boolean;
  segmentIndex: number;
}

export const SEGMENT_LENGTH = 3000;
export const TOTAL_SEGMENTS = 3;
export const TOTAL_DISTANCE = SEGMENT_LENGTH * TOTAL_SEGMENTS;
export const SEGMENT_NAMES = ['长安', '华阴', '函谷关', '洛阳'];

export class World {
  cameraX: number = 0;
  distance: number = 0;
  speed: number = 1.5;
  scenery: SceneryObject[] = [];
  currentSegment: number = 0;
  events: RoadEvent[] = [];
  isMoving: boolean = false;
  roadY: number = 0;
  private seed: number = 42;

  constructor() {
    this.generateScenery();
    this.generateEvents();
  }

  private seededRandom(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  private generateScenery(): void {
    this.scenery = [];

    for (let seg = 0; seg < TOTAL_SEGMENTS; seg++) {
      const segStart = seg * SEGMENT_LENGTH;
      const segEnd = segStart + SEGMENT_LENGTH;

      for (let x = segStart + 200; x < segEnd - 200; x += 150 + this.seededRandom() * 350) {
        const rand = this.seededRandom();
        let type: SceneryType;
        if (rand < 0.4) {
          type = SceneryType.FOREST;
        } else if (rand < 0.65) {
          type = SceneryType.VILLAGE;
        } else if (rand < 0.85) {
          type = SceneryType.TEA_SHED;
        } else {
          type = SceneryType.FOREST;
        }

        let width: number, height: number, treeCount: number | undefined;
        switch (type) {
          case SceneryType.VILLAGE:
            width = 120 + this.seededRandom() * 80;
            height = 55 + this.seededRandom() * 25;
            break;
          case SceneryType.TEA_SHED:
            width = 80 + this.seededRandom() * 30;
            height = 45 + this.seededRandom() * 15;
            break;
          case SceneryType.FOREST:
            width = 120 + this.seededRandom() * 120;
            height = 70 + this.seededRandom() * 30;
            treeCount = 3 + Math.floor(this.seededRandom() * 4);
            break;
          default:
            width = 100;
            height = 60;
        }

        const yOffset = this.seededRandom() * 0.08;
        this.scenery.push({
          x,
          type,
          width,
          height,
          treeCount
        });
      }
    }

    for (let i = 1; i <= TOTAL_SEGMENTS; i++) {
      const relayX = i * SEGMENT_LENGTH;
      this.scenery.push({
        x: relayX - 75,
        type: SceneryType.RELAY,
        width: 150,
        height: 65
      });
    }
  }

  private generateEvents(): void {
    this.events = [];

    for (let seg = 0; seg < TOTAL_SEGMENTS; seg++) {
      const segStart = seg * SEGMENT_LENGTH;
      const segEnd = segStart + SEGMENT_LENGTH;

      let x = segStart + 600 + Math.random() * 400;
      while (x < segEnd - 400) {
        this.events.push({
          type: 'bandit',
          triggerDistance: x,
          triggered: false,
          segmentIndex: seg
        });
        x += 500 + Math.random() * 700;
      }

      this.events.push({
        type: 'milestone',
        triggerDistance: (seg + 1) * SEGMENT_LENGTH,
        triggered: false,
        segmentIndex: seg + 1
      });
    }
  }

  update(canvasHeight: number): void {
    if (!this.isMoving) return;

    this.distance += this.speed;
    this.cameraX = this.distance;
    this.roadY = canvasHeight * 0.72;
    this.currentSegment = Math.min(
      Math.floor(this.distance / SEGMENT_LENGTH),
      TOTAL_SEGMENTS
    );
  }

  checkEvents(): RoadEvent | null {
    for (const evt of this.events) {
      if (!evt.triggered && this.distance >= evt.triggerDistance - 5) {
        evt.triggered = true;
        return evt;
      }
    }
    return null;
  }

  hasReachedEnd(): boolean {
    return this.distance >= TOTAL_DISTANCE;
  }

  getProgress(): number {
    return Math.min(this.distance / TOTAL_DISTANCE, 1);
  }

  getSegmentProgress(): number[] {
    const progresses: number[] = [];
    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      const segStart = i * SEGMENT_LENGTH;
      const segEnd = segStart + SEGMENT_LENGTH;
      if (this.distance >= segEnd) {
        progresses.push(1);
      } else if (this.distance > segStart) {
        progresses.push((this.distance - segStart) / SEGMENT_LENGTH);
      } else {
        progresses.push(0);
      }
    }
    return progresses;
  }

  reset(): void {
    this.distance = 0;
    this.cameraX = 0;
    this.currentSegment = 0;
    this.isMoving = false;
    this.scenery = [];
    this.events = [];
    this.seed = 42;
    this.generateScenery();
    this.generateEvents();
  }
}
