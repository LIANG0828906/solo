export interface GhostFrame {
  x: number;
  y: number;
  angle: number;
  speed: number;
  timestamp: number;
}

export interface GhostData {
  frames: GhostFrame[];
  totalTime: number;
  lapNumber: number;
}

export type InterpolationMethod = 'linear' | 'spline';

export class GhostRecorder {
  private currentFrames: GhostFrame[] = [];
  private recordedGhosts: GhostData[] = [];
  private startTime: number = 0;
  private isRecording: boolean = false;
  private currentLap: number = 0;
  private sampleInterval: number = 16;
  private lastSampleTime: number = 0;

  startRecording(lapNumber: number): void {
    this.currentFrames = [];
    this.startTime = performance.now();
    this.lastSampleTime = 0;
    this.isRecording = true;
    this.currentLap = lapNumber;
  }

  recordFrame(x: number, y: number, angle: number, speed: number): void {
    if (!this.isRecording) return;
    const now = performance.now();
    const elapsed = now - this.startTime;
    if (elapsed - this.lastSampleTime >= this.sampleInterval) {
      this.currentFrames.push({
        x,
        y,
        angle,
        speed,
        timestamp: elapsed
      });
      this.lastSampleTime = elapsed;
    }
  }

  stopRecording(): GhostData | null {
    if (!this.isRecording || this.currentFrames.length === 0) return null;
    this.isRecording = false;
    const totalTime = this.currentFrames[this.currentFrames.length - 1].timestamp;
    const ghostData: GhostData = {
      frames: [...this.currentFrames],
      totalTime,
      lapNumber: this.currentLap
    };
    this.recordedGhosts.push(ghostData);
    return ghostData;
  }

  getRecordedGhosts(): GhostData[] {
    return [...this.recordedGhosts];
  }

  getBestGhost(): GhostData | null {
    if (this.recordedGhosts.length === 0) return null;
    return this.recordedGhosts.reduce((best, current) =>
      current.totalTime < best.totalTime ? current : best
    );
  }

  clearRecordings(): void {
    this.recordedGhosts = [];
    this.currentFrames = [];
    this.isRecording = false;
  }
}

export class GhostReplay {
  private ghostData: GhostData | null = null;
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private currentFrameIndex: number = 0;
  private trailPoints: { x: number; y: number; alpha: number }[] = [];
  private maxTrailLength: number = 80;
  private lastInterpolatedFrame: GhostFrame | null = null;
  private interpolationMethod: InterpolationMethod = 'linear';

  loadGhost(ghostData: GhostData): void {
    this.ghostData = ghostData;
    this.currentFrameIndex = 0;
    this.trailPoints = [];
    this.lastInterpolatedFrame = null;
  }

  setInterpolationMethod(method: InterpolationMethod): void {
    this.interpolationMethod = method;
  }

  getInterpolationMethod(): InterpolationMethod {
    return this.interpolationMethod;
  }

  startPlayback(): void {
    if (!this.ghostData) return;
    this.startTime = performance.now();
    this.isPlaying = true;
    this.currentFrameIndex = 0;
    this.trailPoints = [];
    this.lastInterpolatedFrame = null;
  }

  stopPlayback(): void {
    this.isPlaying = false;
  }

  private linearInterpolate(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private interpolateAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  private catmullRomInterpolate(
    p0: number,
    p1: number,
    p2: number,
    p3: number,
    t: number
  ): number {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  }

  private getSplineInterpolatedFrame(
    frames: GhostFrame[],
    lowerIndex: number,
    t: number
  ): GhostFrame {
    const i0 = Math.max(0, lowerIndex - 1);
    const i1 = lowerIndex;
    const i2 = Math.min(frames.length - 1, lowerIndex + 1);
    const i3 = Math.min(frames.length - 1, lowerIndex + 2);
    const f0 = frames[i0];
    const f1 = frames[i1];
    const f2 = frames[i2];
    const f3 = frames[i3];
    const x = this.catmullRomInterpolate(f0.x, f1.x, f2.x, f3.x, t);
    const y = this.catmullRomInterpolate(f0.y, f1.y, f2.y, f3.y, t);
    const speed = this.catmullRomInterpolate(f0.speed, f1.speed, f2.speed, f3.speed, t);
    const angle = this.interpolateAngle(f1.angle, f2.angle, t);
    const timestamp = this.linearInterpolate(f1.timestamp, f2.timestamp, t);
    return { x, y, angle, speed, timestamp };
  }

  private getLinearInterpolatedFrame(
    frameA: GhostFrame,
    frameB: GhostFrame,
    t: number,
    elapsed: number
  ): GhostFrame {
    return {
      x: this.linearInterpolate(frameA.x, frameB.x, t),
      y: this.linearInterpolate(frameA.y, frameB.y, t),
      angle: this.interpolateAngle(frameA.angle, frameB.angle, t),
      speed: this.linearInterpolate(frameA.speed, frameB.speed, t),
      timestamp: elapsed
    };
  }

  private getInterpolatedFrame(elapsed: number): GhostFrame | null {
    if (!this.ghostData || this.ghostData.frames.length < 2) {
      return this.ghostData?.frames[0] || null;
    }
    const frames = this.ghostData.frames;
    if (elapsed <= frames[0].timestamp) return frames[0];
    if (elapsed >= frames[frames.length - 1].timestamp) return frames[frames.length - 1];
    let lower = 0;
    let upper = frames.length - 1;
    let foundIndex = -1;
    while (lower <= upper) {
      const mid = Math.floor((lower + upper) / 2);
      if (frames[mid].timestamp <= elapsed && mid < frames.length - 1 && frames[mid + 1].timestamp >= elapsed) {
        foundIndex = mid;
        break;
      }
      if (frames[mid].timestamp < elapsed) {
        lower = mid + 1;
      } else {
        upper = mid - 1;
      }
    }
    if (foundIndex === -1) {
      return frames[Math.min(lower, frames.length - 1)];
    }
    const frameA = frames[foundIndex];
    const frameB = frames[foundIndex + 1];
    const duration = frameB.timestamp - frameA.timestamp;
    const t = duration > 0 ? (elapsed - frameA.timestamp) / duration : 0;
    if (this.interpolationMethod === 'spline' && frames.length >= 4) {
      return this.getSplineInterpolatedFrame(frames, foundIndex, t);
    } else {
      return this.getLinearInterpolatedFrame(frameA, frameB, t, elapsed);
    }
  }

  update(): GhostFrame | null {
    if (!this.isPlaying || !this.ghostData || this.ghostData.frames.length === 0) {
      return this.lastInterpolatedFrame;
    }
    const elapsed = performance.now() - this.startTime;
    while (
      this.currentFrameIndex < this.ghostData.frames.length - 1 &&
      this.ghostData.frames[this.currentFrameIndex + 1].timestamp <= elapsed
    ) {
      this.currentFrameIndex++;
    }
    const interpolatedFrame = this.getInterpolatedFrame(elapsed);
    if (interpolatedFrame) {
      this.lastInterpolatedFrame = interpolatedFrame;
      this.trailPoints.push({ x: interpolatedFrame.x, y: interpolatedFrame.y, alpha: 1 });
      if (this.trailPoints.length > this.maxTrailLength) {
        this.trailPoints.shift();
      }
      this.trailPoints.forEach((point, i) => {
        point.alpha = (i + 1) / this.trailPoints.length;
      });
    }
    if (elapsed >= this.ghostData.totalTime) {
      this.isPlaying = false;
    }
    return interpolatedFrame;
  }

  getTrailPoints(): { x: number; y: number; alpha: number }[] {
    return this.trailPoints;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  reset(): void {
    this.currentFrameIndex = 0;
    this.trailPoints = [];
    this.isPlaying = false;
    this.lastInterpolatedFrame = null;
  }
}
