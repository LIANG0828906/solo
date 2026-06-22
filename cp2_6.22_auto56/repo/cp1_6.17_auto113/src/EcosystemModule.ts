import {
  Microbe,
  MicrobeType,
  EventType,
  StatsPoint,
  PHAGOCYTOSIS_PROBABILITY,
  REPRODUCTION_PROBABILITY,
  DENSITY_THRESHOLD,
  DENSITY_AREA,
  STATS_UPDATE_INTERVAL_MS,
  MAX_MICROBES,
  REPRODUCTION_INTERVAL_MS,
} from './types';
import { eventBus } from './EventBus';
import { useEcosystemStore } from './store/ecosystemStore';

class EcosystemModule {
  private lastReproductionTime: number;
  private lastStatsUpdateTime: number;
  private startTime: number;
  private reproductionSuppressed: Map<string, boolean>;

  constructor() {
    this.lastReproductionTime = 0;
    this.lastStatsUpdateTime = 0;
    this.startTime = performance.now();
    this.reproductionSuppressed = new Map();

    eventBus.on(EventType.FRAME_POSITIONS, (data) => {
      this.handleFramePositions(data as Microbe[]);
    });

    eventBus.on(EventType.RESET_SIMULATION, () => {
      this.reset();
    });
  }

  private reset(): void {
    this.lastReproductionTime = 0;
    this.lastStatsUpdateTime = 0;
    this.startTime = performance.now();
    this.reproductionSuppressed.clear();
  }

  processCollisions(microbes: Microbe[]): Microbe[] {
    const toRemove: Set<string> = new Set();
    const updatedMicrobes: Map<string, Partial<Microbe>> = new Map();
    this.reproductionSuppressed.clear();

    for (let i = 0; i < microbes.length; i++) {
      for (let j = i + 1; j < microbes.length; j++) {
        const a = microbes[i];
        const b = microbes[j];

        if (toRemove.has(a.id) || toRemove.has(b.id)) {
          continue;
        }

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = a.radius + b.radius;

        if (distance < minDistance) {
          if (a.type !== b.type) {
            const larger = a.radius >= b.radius ? a : b;
            const smaller = a.radius >= b.radius ? b : a;

            if (Math.random() < PHAGOCYTOSIS_PROBABILITY) {
              toRemove.add(smaller.id);

              const existingUpdate = updatedMicrobes.get(larger.id) || {};
              const currentRadius = (existingUpdate.radius as number) ?? larger.radius;
              updatedMicrobes.set(larger.id, {
                ...existingUpdate,
                radius: currentRadius * 1.05,
                flashing: true,
                flashTimer: 18,
              });

              eventBus.emit(EventType.MICROBE_PHAGOCYTOSED, {
                predatorId: larger.id,
                preyId: smaller.id,
                predatorType: larger.type,
                preyType: smaller.type,
              });
            }
          } else {
            const density = this.calculateDensity(microbes, a.type, a.x, a.y);
            if (density > DENSITY_THRESHOLD) {
              this.reproductionSuppressed.set(a.id, true);
              this.reproductionSuppressed.set(b.id, true);
            }
          }
        }
      }
    }

    const result = microbes
      .filter((m) => !toRemove.has(m.id))
      .map((m) => {
        const updates = updatedMicrobes.get(m.id);
        if (updates) {
          return { ...m, ...updates };
        }
        return m;
      });

    return result;
  }

  processReproduction(microbes: Microbe[]): Microbe[] {
    const now = performance.now();

    if (now - this.lastReproductionTime < REPRODUCTION_INTERVAL_MS) {
      return microbes;
    }

    this.lastReproductionTime = now;

    const newMicrobes: Microbe[] = [];
    const currentCount = microbes.length;

    for (const microbe of microbes) {
      if (newMicrobes.length + currentCount >= MAX_MICROBES) {
        break;
      }

      if (this.reproductionSuppressed.get(microbe.id)) {
        continue;
      }

      if (Math.random() < REPRODUCTION_PROBABILITY) {
        const angle = Math.random() * Math.PI * 2;
        const offset = Math.random() * 10;
        const child: Microbe = {
          id: `${microbe.id}_child_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          type: microbe.type,
          x: microbe.x + Math.cos(angle) * offset,
          y: microbe.y + Math.sin(angle) * offset,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: microbe.radius * 0.8,
          age: 0,
          flashing: false,
          flashTimer: 0,
        };

        newMicrobes.push(child);

        eventBus.emit(EventType.MICROBE_REPRODUCED, {
          parentId: microbe.id,
          childId: child.id,
          type: microbe.type,
        });
      }
    }

    return [...microbes, ...newMicrobes];
  }

  calculateDensity(microbes: Microbe[], type: MicrobeType, cx: number, cy: number): number {
    const halfArea = Math.sqrt(DENSITY_AREA) / 2;
    let count = 0;

    for (const m of microbes) {
      if (m.type !== type) {
        continue;
      }

      if (
        m.x >= cx - halfArea &&
        m.x <= cx + halfArea &&
        m.y >= cy - halfArea &&
        m.y <= cy + halfArea
      ) {
        count++;
      }
    }

    return count * (100 / DENSITY_AREA);
  }

  handleFramePositions(data: Microbe[]): void {
    let microbes = this.processCollisions(data);
    microbes = this.processReproduction(microbes);

    useEcosystemStore.getState().setMicrobes(microbes);

    const now = performance.now();
    if (now - this.lastStatsUpdateTime >= STATS_UPDATE_INTERVAL_MS) {
      this.lastStatsUpdateTime = now;

      const elapsed = (now - this.startTime) / 1000;
      const counts: Record<MicrobeType, number> = {
        [MicrobeType.COCCUS]: 0,
        [MicrobeType.BACILLUS]: 0,
        [MicrobeType.SPIRILLUM]: 0,
      };

      for (const m of microbes) {
        counts[m.type]++;
      }

      const statsPoint: StatsPoint = {
        time: elapsed,
        coccus: counts[MicrobeType.COCCUS],
        bacillus: counts[MicrobeType.BACILLUS],
        spirillum: counts[MicrobeType.SPIRILLUM],
      };

      useEcosystemStore.getState().addStatsPoint(statsPoint);
    }

    eventBus.emit(EventType.ECOSYSTEM_TICK, {
      microbeCount: microbes.length,
      timestamp: now,
    });
  }
}

export const ecosystemModule = new EcosystemModule();
