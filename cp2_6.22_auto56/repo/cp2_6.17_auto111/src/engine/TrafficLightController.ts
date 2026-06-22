import { TrafficLightPhase, TrafficLightState } from './types';

export class TrafficLightController {
  private greenDuration: number;
  private readonly yellowDuration: number = 3;
  private intersections: Map<string, TrafficLightState> = new Map();
  private globalTimer: number = 0;
  private pendingGreenDuration: number | null = null;
  private yellowBlinkTimer: number = 0;
  private yellowBlinkOn: boolean = true;

  constructor(greenDuration: number = 30) {
    this.greenDuration = greenDuration;
  }

  registerIntersection(intersectionId: string, offset: number = 0): void {
    const state = this.calculateState(offset);
    this.intersections.set(intersectionId, state);
  }

  private getPhaseForTime(time: number): { phase: TrafficLightPhase; timeRemaining: number } {
    const cycleDuration = this.greenDuration * 2 + this.yellowDuration * 2;
    const t = ((time % cycleDuration) + cycleDuration) % cycleDuration;

    if (t < this.greenDuration) {
      return { phase: 'GREEN_EW', timeRemaining: this.greenDuration - t };
    } else if (t < this.greenDuration + this.yellowDuration) {
      return { phase: 'YELLOW_EW', timeRemaining: this.greenDuration + this.yellowDuration - t };
    } else if (t < this.greenDuration * 2 + this.yellowDuration) {
      return { phase: 'GREEN_NS', timeRemaining: this.greenDuration * 2 + this.yellowDuration - t };
    } else {
      return { phase: 'YELLOW_NS', timeRemaining: cycleDuration - t };
    }
  }

  private calculateState(timeOffset: number): TrafficLightState {
    const { phase, timeRemaining } = this.getPhaseForTime(this.globalTimer + timeOffset);

    const eastWest = { red: false, yellow: false, green: false };
    const northSouth = { red: false, yellow: false, green: false };

    switch (phase) {
      case 'GREEN_EW':
        eastWest.green = true;
        northSouth.red = true;
        break;
      case 'YELLOW_EW':
        eastWest.yellow = this.yellowBlinkOn;
        northSouth.red = true;
        break;
      case 'GREEN_NS':
        eastWest.red = true;
        northSouth.green = true;
        break;
      case 'YELLOW_NS':
        eastWest.red = true;
        northSouth.yellow = this.yellowBlinkOn;
        break;
    }

    return {
      phase,
      timeRemaining,
      eastWest,
      northSouth,
      yellowBlinkOn: this.yellowBlinkOn
    };
  }

  update(deltaTime: number): void {
    const oldCycleDuration = this.greenDuration * 2 + this.yellowDuration * 2;
    const oldPhase = this.getPhaseForTime(this.globalTimer);

    this.globalTimer += deltaTime;
    this.yellowBlinkTimer += deltaTime;

    if (this.yellowBlinkTimer >= 0.25) {
      this.yellowBlinkTimer = 0;
      this.yellowBlinkOn = !this.yellowBlinkOn;
    }

    if (this.pendingGreenDuration !== null) {
      const newPhase = this.getPhaseForTime(this.globalTimer);
      if (oldPhase.phase !== newPhase.phase) {
        this.greenDuration = this.pendingGreenDuration;
        this.pendingGreenDuration = null;
      }
    }

    const newCycleDuration = this.greenDuration * 2 + this.yellowDuration * 2;
    if (oldCycleDuration !== newCycleDuration) {
      this.globalTimer = this.globalTimer % newCycleDuration;
    }

    this.intersections.forEach((_, id) => {
      this.intersections.set(id, this.calculateState(0));
    });
  }

  getLightState(intersectionId: string): TrafficLightState | undefined {
    return this.intersections.get(intersectionId);
  }

  setGreenDuration(seconds: number): void {
    this.pendingGreenDuration = seconds;
  }

  getGreenDuration(): number {
    return this.greenDuration;
  }

  getAllStates(): Map<string, TrafficLightState> {
    return this.intersections;
  }

  reset(): void {
    this.globalTimer = 0;
    this.pendingGreenDuration = null;
    this.intersections.clear();
  }
}
