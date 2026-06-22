import type { PlayerState, InputState } from './types';

interface FrameData {
  vx: number;
  vy: number;
  jumpPressed: boolean;
}

export interface RewindResult {
  recordedFrames: FrameData[];
  startPlayerState: PlayerState;
}

export class TimelineManager {
  private recording: boolean = false;
  private frames: FrameData[] = [];
  private startPlayerState: PlayerState | null = null;
  private maxFrames: number = 60 * 30;

  startRecording(player: PlayerState): void {
    this.recording = true;
    this.frames = [];
    this.startPlayerState = { ...player };
  }

  recordFrame(input: InputState, player: PlayerState): void {
    if (!this.recording) return;
    if (this.frames.length >= this.maxFrames) {
      this.stopRecording();
      return;
    }
    this.frames.push({
      vx: player.vx,
      vy: player.vy,
      jumpPressed: input.jumpPressed
    });
  }

  stopRecording(): RewindResult | null {
    if (!this.recording || this.frames.length < 2) {
      this.recording = false;
      this.frames = [];
      this.startPlayerState = null;
      return null;
    }
    const result: RewindResult = {
      recordedFrames: [...this.frames],
      startPlayerState: { ...this.startPlayerState! }
    };
    this.recording = false;
    this.frames = [];
    this.startPlayerState = null;
    return result;
  }

  isRecording(): boolean {
    return this.recording;
  }

  getRecordedFrameCount(): number {
    return this.frames.length;
  }
}

export interface ClonePlayer {
  id: number;
  playerState: PlayerState;
  frameData: FrameData[];
  currentFrame: number;
  initialState: PlayerState;
  active: boolean;
}

export class CloneManager {
  private clones: Map<number, ClonePlayer> = new Map();
  private nextId: number = 1;

  createClone(rewindResult: RewindResult): ClonePlayer {
    const clone: ClonePlayer = {
      id: this.nextId++,
      playerState: { ...rewindResult.startPlayerState },
      frameData: rewindResult.recordedFrames,
      currentFrame: 0,
      initialState: { ...rewindResult.startPlayerState },
      active: true
    };
    this.clones.set(clone.id, clone);
    return clone;
  }

  getClone(id: number): ClonePlayer | undefined {
    return this.clones.get(id);
  }

  getAllClones(): ClonePlayer[] {
    return Array.from(this.clones.values()).filter(c => c.active);
  }

  updateClone(id: number, newState: PlayerState): void {
    const clone = this.clones.get(id);
    if (clone) {
      clone.playerState = newState;
      clone.currentFrame++;
      if (clone.currentFrame >= clone.frameData.length) {
        clone.active = false;
      }
    }
  }

  resetClones(): void {
    this.clones.clear();
  }

  getNextFrameData(id: number): FrameData | null {
    const clone = this.clones.get(id);
    if (!clone || !clone.active) return null;
    if (clone.currentFrame >= clone.frameData.length) {
      clone.active = false;
      return null;
    }
    return clone.frameData[clone.currentFrame];
  }
}
