export type Direction = "north" | "south" | "east" | "west";
export type LightColor = "red" | "yellow" | "green";
export type TrafficMode = "morning" | "evening" | "night";

export interface TrafficData {
  direction: Direction;
  flow: number;
  light: LightColor;
}

interface Subscriber {
  (data: TrafficData[]): void;
}

const LIGHT_CYCLE = {
  red: 20000,
  yellow: 3000,
  green: 20000
};

const FLOW_RANGES: Record<TrafficMode, { min: number; max: number }> = {
  morning: { min: 60, max: 100 },
  evening: { min: 55, max: 95 },
  night: { min: 5, max: 30 }
};

class TrafficSimulator {
  private mode: TrafficMode = "morning";
  private subscribers: Set<Subscriber> = new Set();
  private data: TrafficData[] = [];
  private lightTimers: Map<Direction, number> = new Map();
  private lightStates: Map<Direction, LightColor> = new Map();
  private animationFrameId: number | null = null;
  private flowUpdateIntervalId: number | null = null;
  private lastUpdateTime: number = 0;

  constructor() {
    this.initializeLights();
    this.initializeData();
  }

  private initializeLights(): void {
    this.lightStates.set("north", "green");
    this.lightStates.set("south", "green");
    this.lightStates.set("east", "red");
    this.lightStates.set("west", "red");
    this.lightTimers.set("north", LIGHT_CYCLE.green);
    this.lightTimers.set("south", LIGHT_CYCLE.green);
    this.lightTimers.set("east", LIGHT_CYCLE.green + LIGHT_CYCLE.yellow);
    this.lightTimers.set("west", LIGHT_CYCLE.green + LIGHT_CYCLE.yellow);
  }

  private initializeData(): void {
    const dirs: Direction[] = ["north", "south", "east", "west"];
    this.data = dirs.map(dir => ({
      direction: dir,
      flow: this.generateFlow(),
      light: this.lightStates.get(dir)!
    }));
  }

  private generateFlow(): number {
    const range = FLOW_RANGES[this.mode];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  private getNextLight(current: LightColor): LightColor {
    if (current === "green") return "yellow";
    if (current === "yellow") return "red";
    return "green";
  }

  private updateLights(deltaTime: number): boolean {
    const dirs: Direction[] = ["north", "south", "east", "west"];
    let changed = false;
    dirs.forEach(dir => {
      const timer = this.lightTimers.get(dir)! - deltaTime;
      if (timer <= 0) {
        const current = this.lightStates.get(dir)!;
        const next = this.getNextLight(current);
        this.lightStates.set(dir, next);
        this.lightTimers.set(dir, LIGHT_CYCLE[next] + timer);
        changed = true;
      } else {
        this.lightTimers.set(dir, timer);
      }
    });
    return changed;
  }

  private updateDataLights(): void {
    this.data = this.data.map(item => ({
      ...item,
      light: this.lightStates.get(item.direction)!
    }));
  }

  private updateFlows(): void {
    this.data = this.data.map(item => ({
      ...item,
      flow: this.generateFlow(),
      light: this.lightStates.get(item.direction)!
    }));
  }

  public start(): void {
    this.lastUpdateTime = performance.now();
    const tick = () => {
      const now = performance.now();
      const delta = now - this.lastUpdateTime;
      this.lastUpdateTime = now;
      const changed = this.updateLights(delta);
      if (changed) {
        this.updateDataLights();
        this.notifySubscribers();
      }
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
    this.flowUpdateIntervalId = window.setInterval(() => {
      this.updateFlows();
      this.notifySubscribers();
    }, 2000);
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.flowUpdateIntervalId !== null) {
      clearInterval(this.flowUpdateIntervalId);
      this.flowUpdateIntervalId = null;
    }
  }

  public setMode(mode: TrafficMode): void {
    this.mode = mode;
    this.updateFlows();
    this.notifySubscribers();
  }

  public getMode(): TrafficMode {
    return this.mode;
  }

  public getData(): TrafficData[] {
    return [...this.data];
  }

  public subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getData());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const data = this.getData();
    this.subscribers.forEach(cb => cb(data));
  }
}

export const trafficSimulator = new TrafficSimulator();
