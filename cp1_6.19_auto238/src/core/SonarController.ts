export interface SonarParams {
  frequency: number;
  scanAngle: number;
  pulseWidth: number;
}

export interface EchoPoint {
  id: number;
  x: number;
  z: number;
  depth: number;
  reflectionCoeff: number;
}

export interface EchoData {
  pointId: number;
  intensity: number;
  timeDiff: number;
  depth: number;
  x: number;
  z: number;
}

export interface BeamState {
  progress: number;
  active: boolean;
}

const SOUND_SPEED = 1500;

export class SonarController {
  private params: SonarParams;
  private echoPoints: EchoPoint[] = [];
  private echoData: EchoData[] = [];
  private beamState: BeamState = { progress: 0, active: false };
  private animationId: number | null = null;
  private listeners: Set<(data: EchoData[]) => void> = new Set();
  private beamListeners: Set<(state: BeamState) => void> = new Set();
  private lastPulseTime = 0;
  private pulseInterval = 1000;

  constructor(params: SonarParams) {
    this.params = { ...params };
    this.generateEchoPoints();
    this.calculateEchoData();
    this.startAnimation();
  }

  private generateEchoPoints() {
    const count = 5 + Math.floor(Math.random() * 6);
    this.echoPoints = [];
    const halfAngle = (this.params.scanAngle / 2) * (Math.PI / 180);
    const maxRange = 50;

    for (let i = 0; i < count; i++) {
      const angle = -halfAngle + Math.random() * halfAngle * 2;
      const distance = 10 + Math.random() * (maxRange - 10);
      const x = Math.sin(angle) * distance;
      const z = -Math.cos(angle) * distance;
      const depth = 15 + Math.random() * 25;

      this.echoPoints.push({
        id: i,
        x,
        z,
        depth,
        reflectionCoeff: 0.3 + Math.random() * 0.6,
      });
    }
  }

  private calculateEchoData() {
    const halfAngle = (this.params.scanAngle / 2) * (Math.PI / 180);
    const frequencyFactor = this.params.frequency / 100;
    const pulseFactor = this.params.pulseWidth;

    this.echoData = this.echoPoints
      .filter((point) => {
        const angle = Math.atan2(point.x, -point.z);
        return Math.abs(angle) <= halfAngle;
      })
      .map((point) => {
        const distance = Math.sqrt(point.x ** 2 + point.z ** 2);
        const timeDiff = (2 * distance) / SOUND_SPEED;
        const angle = Math.atan2(point.x, -point.z);
        const angleFactor = 1 - Math.abs(angle) / halfAngle;
        const attenuation = Math.exp(-distance * 0.02 * frequencyFactor);
        const intensity =
          point.reflectionCoeff *
          angleFactor *
          attenuation *
          pulseFactor *
          0.8;

        return {
          pointId: point.id,
          intensity: Math.min(1, Math.max(0, intensity)),
          timeDiff,
          depth: point.depth,
          x: point.x,
          z: point.z,
        };
      });
  }

  private startAnimation() {
    this.pulseInterval = 1000 / (this.params.frequency / 50);
    const animate = (time: number) => {
      if (time - this.lastPulseTime > this.pulseInterval) {
        this.lastPulseTime = time;
        this.beamState = { progress: 0, active: true };
        this.notifyBeamListeners();
      }

      if (this.beamState.active) {
        this.beamState.progress += 0.02;
        if (this.beamState.progress >= 1) {
          this.beamState.active = false;
          this.beamState.progress = 0;
        }
        this.notifyBeamListeners();
      }

      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }

  updateParams(params: Partial<SonarParams>) {
    this.params = { ...this.params, ...params };
    this.calculateEchoData();
    this.notifyListeners();
  }

  getParams(): SonarParams {
    return { ...this.params };
  }

  getEchoData(): EchoData[] {
    return [...this.echoData];
  }

  getEchoPoints(): EchoPoint[] {
    return [...this.echoPoints];
  }

  getBeamState(): BeamState {
    return { ...this.beamState };
  }

  subscribe(callback: (data: EchoData[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  subscribeBeam(callback: (state: BeamState) => void): () => void {
    this.beamListeners.add(callback);
    return () => this.beamListeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.echoData));
  }

  private notifyBeamListeners() {
    this.beamListeners.forEach((cb) => cb(this.beamState));
  }

  dispose() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.listeners.clear();
    this.beamListeners.clear();
  }
}
