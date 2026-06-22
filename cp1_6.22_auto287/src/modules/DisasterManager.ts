import { EventBus, DisasterOccurredEvent } from '../events/EventBus';
import { EcosystemSimulator } from './EcosystemSimulator';

export type DisasterType = 'fire' | 'flood' | 'drought';

export interface DisasterLogEntry {
  id: string;
  type: DisasterType;
  zone: 'forest' | 'desert' | 'glacier';
  timestamp: number;
  relieved: boolean;
}

const DISASTER_EFFECTS: Record<DisasterType, { zone: 'forest' | 'desert' | 'glacier'; resource: 'wood' | 'water' | 'ore'; amount: number }> = {
  fire: { zone: 'forest', resource: 'wood', amount: 30 },
  flood: { zone: 'glacier', resource: 'water', amount: 40 },
  drought: { zone: 'desert', resource: 'water', amount: 0 },
};

const RELIEF_COSTS: Record<DisasterType, { resource: 'wood' | 'water' | 'ore'; amount: number }> = {
  fire: { resource: 'wood', amount: 10 },
  flood: { resource: 'ore', amount: 15 },
  drought: { resource: 'water', amount: 20 },
};

const RELIEF_HEAL = 15;

let idCounter = 0;

export class DisasterManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private eco: EcosystemSimulator;
  private _logs: DisasterLogEntry[] = [];
  private onLogUpdate: ((logs: DisasterLogEntry[]) => void) | null = null;

  constructor(eco: EcosystemSimulator) {
    this.eco = eco;
  }

  setLogUpdateCallback(cb: (logs: DisasterLogEntry[]) => void): void {
    this.onLogUpdate = cb;
  }

  get logs(): DisasterLogEntry[] {
    return this._logs;
  }

  startDisasterLoop(): void {
    this.scheduleNext();
  }

  stopDisasterLoop(): void {
    if (this.intervalId !== null) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  private scheduleNext(): void {
    const delay = 30000 + Math.random() * 30000;
    this.intervalId = setTimeout(() => {
      this.triggerDisaster();
      this.scheduleNext();
    }, delay);
  }

  triggerDisaster(type?: DisasterType): DisasterLogEntry | null {
    const types: DisasterType[] = ['fire', 'flood', 'drought'];
    const disasterType = type ?? types[Math.floor(Math.random() * types.length)];
    const effect = DISASTER_EFFECTS[disasterType];
    const zone = effect.zone;

    if (disasterType !== 'drought' && effect.amount > 0) {
      this.eco.consumeResource(zone, effect.resource, effect.amount);
    }

    this.eco.setActiveDisaster(zone, disasterType);

    const entry: DisasterLogEntry = {
      id: `disaster-${++idCounter}`,
      type: disasterType,
      zone,
      timestamp: Date.now(),
      relieved: false,
    };

    this._logs = [entry, ...this._logs].slice(0, 50);
    if (this.onLogUpdate) this.onLogUpdate([...this._logs]);

    EventBus.emit('disasterOccurred', {
      type: disasterType,
      zone,
    } satisfies DisasterOccurredEvent);

    return entry;
  }

  handleRelief(disasterType: DisasterType): boolean {
    const cost = RELIEF_COSTS[disasterType];
    const effect = DISASTER_EFFECTS[disasterType];
    const zone = effect.zone;

    const status = this.eco.getStatus();
    const available = status[zone].resources[cost.resource];
    if (available < cost.amount) return false;

    this.eco.consumeResource(zone, cost.resource, cost.amount);
    this.eco.healZone(zone, RELIEF_HEAL);
    this.eco.setActiveDisaster(zone, null);

    const logIdx = this._logs.findIndex(
      (l) => l.type === disasterType && l.zone === zone && !l.relieved
    );
    if (logIdx !== -1) {
      this._logs[logIdx] = { ...this._logs[logIdx], relieved: true };
      if (this.onLogUpdate) this.onLogUpdate([...this._logs]);
    }

    return true;
  }

  getReliefCost(type: DisasterType): { resource: 'wood' | 'water' | 'ore'; amount: number } {
    return RELIEF_COSTS[type];
  }
}
