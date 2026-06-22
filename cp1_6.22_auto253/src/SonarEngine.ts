import {
  EventBus,
  EventType,
  SonarPulse,
  EchoLine,
  WallHighlight,
  LevelData,
  Position,
  PoisonMushroom,
  WanderingBat,
} from './types';

const SONAR_MAX_RADIUS = 300;
const SONAR_DURATION = 600;
const ECHO_DURATION = 300;
const HIGHLIGHT_DURATION = 500;
const STUN_DURATION = 1500;
const KNOCKBACK_CELLS = 2;
const SONAR_MIN_RADIUS = 20;

export class SonarEngine {
  private eventBus: EventBus;
  private pulses: SonarPulse[] = [];
  private echoes: EchoLine[] = [];
  private highlights: WallHighlight[] = [];
  private levelData: LevelData | null = null;
  private pulseIdCounter = 0;
  private echoIdCounter = 0;
  private highlightIdCounter = 0;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    this.eventBus.on('level:ready', (e) => {
      this.levelData = e.payload?.levelData as LevelData;
    });
  }

  public emitSonar(origin: Position): void {
    const pulse: SonarPulse = {
      id: ++this.pulseIdCounter,
      x: origin.x,
      y: origin.y,
      radius: SONAR_MIN_RADIUS,
      maxRadius: SONAR_MAX_RADIUS,
      startTime: performance.now(),
      duration: SONAR_DURATION,
      active: true,
    };
    this.pulses.push(pulse);
    this.eventBus.emit({
      type: 'sonar:emit',
      payload: { pulse },
    });
  }

  public update(
    now: number,
    mushrooms: PoisonMushroom[],
    wanderingBats: WanderingBat[]
  ): {
    stunnedMushroomIds: Set<number>;
    stunnedBatIds: Set<number>;
    revealedCells: Position[];
  } {
    const stunnedMushroomIds = new Set<number>();
    const stunnedBatIds = new Set<number>();
    const revealedCells: Position[] = [];

    this.updatePulses(now, mushrooms, wanderingBats, stunnedMushroomIds, stunnedBatIds, revealedCells);
    this.updateEchoes(now);
    this.updateHighlights(now);

    return { stunnedMushroomIds, stunnedBatIds, revealedCells };
  }

  private updatePulses(
    now: number,
    mushrooms: PoisonMushroom[],
    wanderingBats: WanderingBat[],
    stunnedMushroomIds: Set<number>,
    stunnedBatIds: Set<number>,
    revealedCells: Position[]
  ): void {
    if (!this.levelData) return;

    const { cellSize, grid, width, height } = this.levelData;
    const prevRadii = new Map<number, number>();

    for (const pulse of this.pulses) {
      if (!pulse.active) continue;

      prevRadii.set(pulse.id, pulse.radius);

      const elapsed = now - pulse.startTime;
      const progress = Math.min(elapsed / pulse.duration, 1);
      pulse.radius = SONAR_MIN_RADIUS + (pulse.maxRadius - SONAR_MIN_RADIUS) * progress;

      if (progress >= 1) {
        pulse.active = false;
        continue;
      }

      const prevR = prevRadii.get(pulse.id) ?? pulse.radius;
      const originGridX = Math.floor(pulse.x / cellSize);
      const originGridY = Math.floor(pulse.y / cellSize);
      const maxGridDist = Math.ceil(pulse.radius / cellSize) + 1;

      for (let dy = -maxGridDist; dy <= maxGridDist; dy++) {
        for (let dx = -maxGridDist; dx <= maxGridDist; dx++) {
          const gx = originGridX + dx;
          const gy = originGridY + dy;
          if (gx < 0 || gx >= width || gy < 0 || gy >= height) continue;

          const cellCenterX = gx * cellSize + cellSize / 2;
          const cellCenterY = gy * cellSize + cellSize / 2;
          const dist = Math.hypot(cellCenterX - pulse.x, cellCenterY - pulse.y);

          if (dist <= pulse.radius && dist >= prevR - cellSize * 0.7) {
            revealedCells.push({ x: gx, y: gy });

            if (grid[gy][gx].type === 'wall') {
              this.createEcho(pulse, cellCenterX, cellCenterY, now);
              this.createHighlight(gx, gy, now);
            }
          }
        }
      }

      for (const m of mushrooms) {
        const mx = m.gridX * cellSize + cellSize / 2;
        const my = m.gridY * cellSize + cellSize / 2;
        const dist = Math.hypot(mx - pulse.x, my - pulse.y);
        if (dist >= prevR && dist <= pulse.radius && !m.stunned) {
          stunnedMushroomIds.add(m.id);
          const dirX = mx - pulse.x;
          const dirY = my - pulse.y;
          const len = Math.hypot(dirX, dirY) || 1;
          const knockCellsX = Math.round((dirX / len) * KNOCKBACK_CELLS);
          const knockCellsY = Math.round((dirY / len) * KNOCKBACK_CELLS);
          m.knockbackDir = { x: knockCellsX, y: knockCellsY };
          m.stunned = true;
          m.stunEndTime = now + STUN_DURATION;
          this.eventBus.emit({
            type: 'enemy:stunned',
            payload: { enemyId: m.id, kind: 'mushroom' },
          });
        }
      }

      for (const b of wanderingBats) {
        const bx = b.gridX * cellSize + cellSize / 2;
        const by = b.gridY * cellSize + cellSize / 2;
        const dist = Math.hypot(bx - pulse.x, by - pulse.y);
        if (dist >= prevR && dist <= pulse.radius && !b.stunned) {
          stunnedBatIds.add(b.id);
          b.stunned = true;
          b.stunEndTime = now + STUN_DURATION;
          this.eventBus.emit({
            type: 'enemy:stunned',
            payload: { enemyId: b.id, kind: 'wanderingBat' },
          });
        }
      }
    }

    this.pulses = this.pulses.filter((p) => p.active);
  }

  private createEcho(pulse: SonarPulse, cx: number, cy: number, now: number): void {
    const dx = cx - pulse.x;
    const dy = cy - pulse.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const echoStartX = pulse.x + nx * pulse.radius;
    const echoStartY = pulse.y + ny * pulse.radius;

    const echo: EchoLine = {
      id: ++this.echoIdCounter,
      x1: echoStartX,
      y1: echoStartY,
      x2: cx,
      y2: cy,
      startTime: now,
      duration: ECHO_DURATION,
    };
    this.echoes.push(echo);
    this.eventBus.emit({
      type: 'sonar:echo',
      payload: { echo },
    });
  }

  private createHighlight(gx: number, gy: number, now: number): void {
    const highlight: WallHighlight = {
      id: ++this.highlightIdCounter,
      gridX: gx,
      gridY: gy,
      startTime: now,
      duration: HIGHLIGHT_DURATION,
    };
    this.highlights.push(highlight);
    this.eventBus.emit({
      type: 'sonar:wallHit',
      payload: { highlight },
    });
  }

  private updateEchoes(now: number): void {
    this.echoes = this.echoes.filter((e) => now - e.startTime < e.duration);
  }

  private updateHighlights(now: number): void {
    this.highlights = this.highlights.filter((h) => now - h.startTime < h.duration);
  }

  public getPulses(): SonarPulse[] {
    return this.pulses;
  }

  public getEchoes(now: number): Array<EchoLine & { alpha: number }> {
    return this.echoes.map((e) => ({
      ...e,
      alpha: 1 - (now - e.startTime) / e.duration,
    }));
  }

  public getHighlights(now: number): Array<WallHighlight & { alpha: number }> {
    return this.highlights.map((h) => {
      const t = (now - h.startTime) / h.duration;
      const blink = 0.5 + 0.5 * Math.sin(t * Math.PI * 8);
      return { ...h, alpha: (1 - t) * blink };
    });
  }

  public reset(): void {
    this.pulses = [];
    this.echoes = [];
    this.highlights = [];
  }

  public getPulseAlpha(pulse: SonarPulse, now: number): number {
    const progress = (now - pulse.startTime) / pulse.duration;
    return Math.max(0, 1 - progress) * 0.7;
  }
}
