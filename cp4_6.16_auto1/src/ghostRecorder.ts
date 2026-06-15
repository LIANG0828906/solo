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

  loadGhost(ghostData: GhostData): void {
    this.ghostData = ghostData;
    this.currentFrameIndex = 0;
    this.trailPoints = [];
    this.lastInterpolatedFrame = null;
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

  private getInterpolatedFrame(elapsed: number): GhostFrame | null {
    if (!this.ghostData || this.ghostData.frames.length < 2) {
      return this.ghostData?.frames[0] || null;
    }
    const frames = this.ghostData.frames;
    if (elapsed <= frames[0].timestamp) return frames[0];
    if (elapsed >= frames[frames.length - 1].timestamp) return frames[frames.length - 1];
    let lower = 0;
    let upper = frames.length - 1;
    while (lower <= upper) {
      const mid = Math.floor((lower + upper) / 2);
      if (frames[mid].timestamp <= elapsed && mid < frames.length - 1 && frames[mid + 1].timestamp >= elapsed) {
        const frameA = frames[mid];
        const frameB = frames[mid + 1];
        const duration = frameB.timestamp - frameA.timestamp;
        const t = duration > 0 ? (elapsed - frameA.timestamp) / duration : 0;
        return {
          x: this.linearInterpolate(frameA.x, frameB.x, t),
          y: this.linearInterpolate(frameA.y, frameB.y, t),
          angle: this.interpolateAngle(frameA.angle, frameB.angle, t),
          speed: this.linearInterpolate(frameA.speed, frameB.speed, t),
          timestamp: elapsed
        };
      }
      if (frames[mid].timestamp < elapsed) {
        lower = mid + 1;
      } else {
        upper = mid - 1;
      }
    }
    return frames[Math.min(lower, frames.length - 1)];
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
