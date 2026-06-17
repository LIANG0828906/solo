type EventCallback = (...args: any[]) => void;

type EventMap = {
  'data-loaded': CountryEnergyData[];
  'year-changed': number;
  'country-selected': CountryEnergyData | null;
};

export class EventBus {
  private events: Map<keyof EventMap, EventCallback[]> = new Map();
  private static instance: EventBus | null = null;

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback as EventCallback);
  }

  public emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  public off<K extends keyof EventMap>(event: K, callback?: (data: EventMap[K]) => void): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      if (callback) {
        this.events.set(
          event,
          callbacks.filter((cb) => cb !== callback)
        );
      } else {
        this.events.delete(event);
      }
    }
  }
}

export interface YearlyData {
  year: number;
  renewable: number;
  fossil: number;
  nuclear: number;
  totalConsumption: number;
}

export interface CountryEnergyData {
  name: string;
  code: string;
  primaryEnergy: 'renewable' | 'fossil' | 'nuclear';
  yearlyData: YearlyData[];
}
