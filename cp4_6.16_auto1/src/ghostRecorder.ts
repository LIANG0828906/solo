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

  startRecording(lapNumber: number): void {
    this.currentFrames = [];
    this.startTime = performance.now();
    this.isRecording = true;
    this.currentLap = lapNumber;
  }

  recordFrame(x: number, y: number, angle: number, speed: number): void {
    if (!this.isRecording) return;
    const now = performance.now();
    this.currentFrames.push({
      x,
      y,
      angle,
      speed,
      timestamp: now - this.startTime
    });
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
  private maxTrailLength: number = 60;

  loadGhost(ghostData: GhostData): void {
    this.ghostData = ghostData;
    this.currentFrameIndex = 0;
    this.trailPoints = [];
  }

  startPlayback(): void {
    if (!this.ghostData) return;
    this.startTime = performance.now();
    this.isPlaying = true;
    this.currentFrameIndex = 0;
    this.trailPoints = [];
  }

  stopPlayback(): void {
    this.isPlaying = false;
  }

  update(): GhostFrame | null {
    if (!this.isPlaying || !this.ghostData || this.ghostData.frames.length === 0) {
      return null;
    }
    const elapsed = performance.now() - this.startTime;
    while (
      this.currentFrameIndex < this.ghostData.frames.length - 1 &&
      this.ghostData.frames[this.currentFrameIndex + 1].timestamp <= elapsed
    ) {
      this.currentFrameIndex++;
    }
    const frame = this.ghostData.frames[this.currentFrameIndex];
    if (frame) {
      this.trailPoints.push({ x: frame.x, y: frame.y, alpha: 1 });
      if (this.trailPoints.length > this.maxTrailLength) {
        this.trailPoints.shift();
      }
      this.trailPoints.forEach((point, i) => {
        point.alpha = (i + 1) / this.trailPoints.length;
      });
    }
    if (this.currentFrameIndex >= this.ghostData.frames.length - 1) {
      this.isPlaying = false;
    }
    return frame;
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
  }
}
