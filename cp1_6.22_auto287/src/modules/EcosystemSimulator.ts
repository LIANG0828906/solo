import { EventBus, HealthChangedEvent, ResourceChangedEvent } from '../events/EventBus';

export interface ZoneResources {
  wood: number;
  water: number;
  ore: number;
}

export interface ZoneStatus {
  health: number;
  resources: ZoneResources;
}

export interface IslandStatus {
  forest: ZoneStatus;
  desert: ZoneStatus;
  glacier: ZoneStatus;
}

const MAX_RESOURCE = 100;
const MAX_HEALTH = 100;
const HEALTH_THRESHOLD = 30;
const ADJACENCY_DEGRADE = 0.5;
const REGEN_RATE: Record<keyof IslandStatus, Partial<Record<keyof ZoneResources, number>>> = {
  forest: { wood: 2 },
  desert: { ore: 1.5 },
  glacier: { water: 2 },
};

const ADJACENCY: Record<keyof IslandStatus, (keyof IslandStatus)[]> = {
  forest: ['desert', 'glacier'],
  desert: ['forest', 'glacier'],
  glacier: ['forest', 'desert'],
};

export class EcosystemSimulator {
  private status: IslandStatus = {
    forest: { health: 80, resources: { wood: 70, water: 30, ore: 20 } },
    desert: { health: 70, resources: { wood: 10, water: 15, ore: 65 } },
    glacier: { health: 85, resources: { wood: 5, water: 80, ore: 30 } },
  };

  private activeDisasters: Map<string, 'fire' | 'flood' | 'drought'> = new Map();

  getStatus(): IslandStatus {
    return {
      forest: { ...this.status.forest, resources: { ...this.status.forest.resources } },
      desert: { ...this.status.desert, resources: { ...this.status.desert.resources } },
      glacier: { ...this.status.glacier, resources: { ...this.status.glacier.resources } },
    };
  }

  setActiveDisaster(zone: string, type: 'fire' | 'flood' | 'drought' | null): void {
    if (type) {
      this.activeDisasters.set(zone, type);
    } else {
      this.activeDisasters.delete(zone);
    }
  }

  updateResources(deltaSeconds: number): void {
    const zones: (keyof IslandStatus)[] = ['forest', 'desert', 'glacier'];

    for (const zone of zones) {
      const z = this.status[zone];
      const healthFactor = z.health / MAX_HEALTH;
      const isDrought = this.activeDisasters.get(zone) === 'drought';
      const regenSpec = REGEN_RATE[zone];

      for (const res of Object.keys(regenSpec) as (keyof ZoneResources)[]) {
        if (isDrought) continue;
        const rate = regenSpec[res]!;
        const gain = rate * healthFactor * deltaSeconds;
        const prev = z.resources[res];
        z.resources[res] = Math.min(MAX_RESOURCE, z.resources[res] + gain);
        if (Math.abs(z.resources[res] - prev) > 0.01) {
          EventBus.emit('resourceChanged', {
            zone,
            resource: res,
            amount: z.resources[res],
            delta: z.resources[res] - prev,
          } satisfies ResourceChangedEvent);
        }
      }

      if (this.activeDisasters.has(zone)) {
        const decay = 2 * deltaSeconds;
        z.health = Math.max(0, z.health - decay);
        EventBus.emit('healthChanged', {
          zone,
          health: z.health,
          delta: -decay,
        } satisfies HealthChangedEvent);
      }

      if (z.health < HEALTH_THRESHOLD) {
        for (const adj of ADJACENCY[zone]) {
          const adjZ = this.status[adj];
          const adjDecay = ADJACENCY_DEGRADE * deltaSeconds;
          adjZ.health = Math.max(0, adjZ.health - adjDecay);
        }
      }
    }
  }

  consumeResource(zone: keyof IslandStatus, resource: keyof ZoneResources, amount: number): boolean {
    const z = this.status[zone];
    if (z.resources[resource] < amount) return false;
    z.resources[resource] -= amount;
    z.health = Math.max(0, z.health - (amount * 0.3));
    EventBus.emit('resourceChanged', {
      zone,
      resource,
      amount: z.resources[resource],
      delta: -amount,
    } satisfies ResourceChangedEvent);
    EventBus.emit('healthChanged', {
      zone,
      health: z.health,
      delta: -(amount * 0.3),
    } satisfies HealthChangedEvent);
    return true;
  }

  healZone(zone: keyof IslandStatus, amount: number): void {
    const z = this.status[zone];
    const prev = z.health;
    z.health = Math.min(MAX_HEALTH, z.health + amount);
    EventBus.emit('healthChanged', {
      zone,
      health: z.health,
      delta: z.health - prev,
    } satisfies HealthChangedEvent);
  }
}
