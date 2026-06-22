import * as PIXI from 'pixi.js';
import type {
  FrameData,
  RecordingSegment,
  PlayerState,
  RecordingSnapshot,
  TimeRecorderConfig
} from '../../types';
import { GhostPlayer } from './GhostPlayer';

export class TimeRecorder {
  private segments: RecordingSegment[] = [];
  private currentSegment: RecordingSegment | null = null;
  private isRecording: boolean = false;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private isRewinding: boolean = false;

  private globalTime: number = 0;
  private playbackTime: number = 0;
  private timeScale: number = 1;

  private config: TimeRecorderConfig;
  private frameCounter: number = 0;
  private lastSavedState: PlayerState | null = null;

  private undoStack: RecordingSnapshot[] = [];
  private redoStack: RecordingSnapshot[] = [];

  private ghostColors: number[] = [0x00ffff, 0xffa500, 0xff00ff, 0x00ff00];
  private ghostPlayers: Map<string, GhostPlayer> = new Map();

  public onSegmentCreated: ((segment: RecordingSegment) => void) | null = null;
  public onPlaybackComplete: (() => void) | null = null;

  constructor(config?: Partial<TimeRecorderConfig>) {
    this.config = {
      sampleRate: (config?.sampleRate !== undefined) ? Math.max(1, config.sampleRate) : 2,
      positionThreshold: config?.positionThreshold ?? 0.5,
      velocityThreshold: config?.velocityThreshold ?? 5,
      maxUndoSteps: config?.maxUndoSteps ?? 50
    };
  }

  public getConfig(): TimeRecorderConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<TimeRecorderConfig>): void {
    this.config = {
      ...this.config,
      ...updates
    };
    if (updates.sampleRate !== undefined) {
      this.config.sampleRate = Math.max(1, this.config.sampleRate);
    }
  }

  public getSampleRate(): number {
    return this.config.sampleRate;
  }

  public setSampleRate(rate: number): void {
    this.config.sampleRate = Math.max(1, rate);
  }

  public getSegments(): RecordingSegment[] {
    return this.segments.map(s => ({
      ...s,
      keyframes: [...s.keyframes]
    }));
  }

  public getCurrentSegment(): RecordingSegment | null {
    return this.currentSegment;
  }

  public getGlobalTime(): number {
    return this.globalTime;
  }

  public getPlaybackTime(): number {
    return this.playbackTime;
  }

  public setPlaybackTime(time: number): void {
    this.playbackTime = Math.max(0, Math.min(time, this.getMaxDuration()));
    this.updateAllGhosts(this.playbackTime);
  }

  public getTimeScale(): number {
    return this.timeScale;
  }

  public setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.1, Math.min(10, scale));
  }

  public getMaxDuration(): number {
    if (this.segments.length === 0) return 0;
    return Math.max(...this.segments.map(s => s.endTime));
  }

  public getRecordingState(): boolean {
    return this.isRecording;
  }

  public getPlayingState(): boolean {
    return this.isPlaying;
  }

  public getPausedState(): boolean {
    return this.isPaused;
  }

  public getRewindingState(): boolean {
    return this.isRewinding;
  }

  public getGhostPlayers(): Map<string, GhostPlayer> {
    return this.ghostPlayers;
  }

  public startRecording(_container: PIXI.Container): void {
    if (this.isRecording) return;

    this.saveSnapshot();

    this.isRecording = true;
    this.frameCounter = 0;
    this.lastSavedState = null;

    const colorIndex = this.segments.length % this.ghostColors.length;
    this.currentSegment = {
      id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: this.globalTime,
      endTime: this.globalTime,
      color: this.ghostColors[colorIndex],
      keyframes: [],
      loop: true,
      name: `录制 ${this.segments.length + 1}`
    };
  }

  public recordFrame(state: PlayerState): void {
    if (!this.isRecording || !this.currentSegment) return;

    this.frameCounter++;

    const shouldSample = this.frameCounter % this.config.sampleRate === 0;
    const hasChanges = this.hasSignificantChange(state);

    if (!shouldSample && this.currentSegment.keyframes.length > 0 && !hasChanges) {
      return;
    }

    const frameData: FrameData = {
      timestamp: this.globalTime
    };

    const lastFrame = this.currentSegment.keyframes[this.currentSegment.keyframes.length - 1];

    if (this.currentSegment.keyframes.length === 0 || !lastFrame) {
      frameData.position = { ...state.position };
      frameData.velocity = { ...state.velocity };
      frameData.isGrounded = state.isGrounded;
      frameData.facing = state.facing;
      frameData.isJumping = state.isJumping;
      frameData.isDead = state.isDead;
      frameData.actionState = state.actionState;
    } else {
      if (!lastFrame.position || this.hasPositionChanged(state.position, lastFrame.position)) {
        frameData.position = { ...state.position };
      }
      if (!lastFrame.velocity || this.hasVelocityChanged(state.velocity, lastFrame.velocity)) {
        frameData.velocity = { ...state.velocity };
      }
      if (state.isGrounded !== lastFrame.isGrounded) {
        frameData.isGrounded = state.isGrounded;
      }
      if (state.facing !== lastFrame.facing) {
        frameData.facing = state.facing;
      }
      if (state.isJumping !== lastFrame.isJumping) {
        frameData.isJumping = state.isJumping;
      }
      if (state.isDead !== lastFrame.isDead) {
        frameData.isDead = state.isDead;
      }
      if (state.actionState !== lastFrame.actionState) {
        frameData.actionState = state.actionState;
      }
    }

    const hasAnyField =
      frameData.position !== undefined ||
      frameData.velocity !== undefined ||
      frameData.isGrounded !== undefined ||
      frameData.facing !== undefined ||
      frameData.isJumping !== undefined ||
      frameData.isDead !== undefined ||
      frameData.actionState !== undefined;

    if (hasAnyField) {
      this.currentSegment.keyframes.push(frameData);
    }

    this.currentSegment.endTime = this.globalTime;
    this.lastSavedState = { ...state };
  }

  private hasSignificantChange(state: PlayerState): boolean {
    if (!this.lastSavedState) return true;

    if (this.hasPositionChanged(state.position, this.lastSavedState.position)) return true;
    if (this.hasVelocityChanged(state.velocity, this.lastSavedState.velocity)) return true;
    if (state.isGrounded !== this.lastSavedState.isGrounded) return true;
    if (state.facing !== this.lastSavedState.facing) return true;
    if (state.isJumping !== this.lastSavedState.isJumping) return true;
    if (state.isDead !== this.lastSavedState.isDead) return true;
    if (state.actionState !== this.lastSavedState.actionState) return true;

    return false;
  }

  private hasPositionChanged(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
    return (
      Math.abs(a.x - b.x) > this.config.positionThreshold ||
      Math.abs(a.y - b.y) > this.config.positionThreshold
    );
  }

  private hasVelocityChanged(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
    return (
      Math.abs(a.x - b.x) > this.config.velocityThreshold ||
      Math.abs(a.y - b.y) > this.config.velocityThreshold
    );
  }

  public stopRecording(container: PIXI.Container): RecordingSegment | null {
    if (!this.isRecording || !this.currentSegment) return null;

    this.isRecording = false;

    if (this.currentSegment.keyframes.length > 0) {
      this.segments.push(this.currentSegment);
      this.createGhostPlayer(this.currentSegment, container);

      if (this.onSegmentCreated) {
        this.onSegmentCreated({ ...this.currentSegment });
      }

      const result = { ...this.currentSegment };
      this.currentSegment = null;
      return result;
    }

    this.currentSegment = null;
    return null;
  }

  private createGhostPlayer(segment: RecordingSegment, container: PIXI.Container): void {
    const ghost = new GhostPlayer(segment);
    this.ghostPlayers.set(segment.id, ghost);
    container.addChild(ghost.sprite);
    ghost.updateForTime(segment.startTime);
  }

  public startPlayback(): void {
    if (this.segments.length === 0) return;
    this.isPlaying = true;
    this.isPaused = false;
    this.isRewinding = false;
  }

  public startRewind(): void {
    if (this.segments.length === 0) return;
    this.isPlaying = true;
    this.isPaused = false;
    this.isRewinding = true;
  }

  public pausePlayback(): void {
    this.isPaused = true;
  }

  public resumePlayback(): void {
    this.isPaused = false;
  }

  public stopPlayback(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.isRewinding = false;
    if (this.onPlaybackComplete) {
      this.onPlaybackComplete();
    }
  }

  public update(deltaTime: number, playerState: PlayerState): void {
    this.globalTime += deltaTime * 1000;

    if (this.isRecording) {
      this.recordFrame(playerState);
    }

    if (this.isPlaying && !this.isPaused) {
      const direction = this.isRewinding ? -1 : 1;
      this.playbackTime += deltaTime * 1000 * this.timeScale * direction;

      const maxDuration = this.getMaxDuration();
      if (this.playbackTime >= maxDuration) {
        this.playbackTime = maxDuration;
        if (!this.isRewinding) {
          this.stopPlayback();
        }
      } else if (this.playbackTime <= 0) {
        this.playbackTime = 0;
        if (this.isRewinding) {
          this.stopPlayback();
        }
      }

      this.updateAllGhosts(this.playbackTime);
    }
  }

  private updateAllGhosts(time: number): void {
    for (const ghost of this.ghostPlayers.values()) {
      ghost.updateForTime(time);
    }
  }

  public interpolateFrame(segment: RecordingSegment, time: number): PlayerState | null {
    if (segment.keyframes.length === 0) return null;

    const segmentDuration = segment.endTime - segment.startTime;
    if (segmentDuration <= 0) {
      return this.expandFrame(segment.keyframes[0], null);
    }

    let localTime = time - segment.startTime;

    if (segment.loop) {
      localTime = ((localTime % segmentDuration) + segmentDuration) % segmentDuration;
    } else {
      localTime = Math.max(0, Math.min(localTime, segmentDuration));
    }

    const absoluteTime = segment.startTime + localTime;

    const { prevIndex, nextIndex } = this.binarySearchKeyframes(segment.keyframes, absoluteTime);

    if (prevIndex === -1) {
      return this.expandFrame(segment.keyframes[0], null);
    }

    if (nextIndex === -1 || prevIndex === nextIndex) {
      return this.expandFrame(segment.keyframes[prevIndex], null);
    }

    const prevFrame = segment.keyframes[prevIndex];
    const nextFrame = segment.keyframes[nextIndex];
    const timeDiff = nextFrame.timestamp - prevFrame.timestamp;

    if (timeDiff === 0) {
      return this.expandFrame(prevFrame, null);
    }

    const t = Math.max(0, Math.min(1, (absoluteTime - prevFrame.timestamp) / timeDiff));
    return this.interpolateBetweenFrames(prevFrame, nextFrame, t);
  }

  private binarySearchKeyframes(
    keyframes: FrameData[],
    time: number
  ): { prevIndex: number; nextIndex: number } {
    if (keyframes.length === 0) return { prevIndex: -1, nextIndex: -1 };
    if (keyframes.length === 1) return { prevIndex: 0, nextIndex: -1 };

    if (time <= keyframes[0].timestamp) {
      return { prevIndex: 0, nextIndex: 1 };
    }
    if (time >= keyframes[keyframes.length - 1].timestamp) {
      return { prevIndex: keyframes.length - 1, nextIndex: -1 };
    }

    let low = 0;
    let high = keyframes.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midTime = keyframes[mid].timestamp;

      if (midTime === time) {
        return { prevIndex: mid, nextIndex: mid + 1 < keyframes.length ? mid + 1 : -1 };
      }

      if (midTime < time) {
        if (mid + 1 < keyframes.length && keyframes[mid + 1].timestamp > time) {
          return { prevIndex: mid, nextIndex: mid + 1 };
        }
        low = mid + 1;
      } else {
        if (mid - 1 >= 0 && keyframes[mid - 1].timestamp <= time) {
          return { prevIndex: mid - 1, nextIndex: mid };
        }
        high = mid - 1;
      }
    }

    return { prevIndex: 0, nextIndex: 1 };
  }

  private expandFrame(frame: FrameData, baseState: PlayerState | null): PlayerState {
    const result: PlayerState = baseState
      ? {
          ...baseState,
          position: { ...baseState.position },
          velocity: { ...baseState.velocity }
        }
      : {
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          isGrounded: false,
          facing: 1,
          isJumping: false,
          isDead: false,
          actionState: 0
        };

    if (frame.position) result.position = { ...frame.position };
    if (frame.velocity) result.velocity = { ...frame.velocity };
    if (frame.isGrounded !== undefined) result.isGrounded = frame.isGrounded;
    if (frame.facing !== undefined) result.facing = frame.facing;
    if (frame.isJumping !== undefined) result.isJumping = frame.isJumping;
    if (frame.isDead !== undefined) result.isDead = frame.isDead;
    if (frame.actionState !== undefined) result.actionState = frame.actionState;

    return result;
  }

  private interpolateBetweenFrames(prev: FrameData, next: FrameData, t: number): PlayerState {
    const expandedPrev = this.expandFrame(prev, null);
    const expandedNext = this.expandFrame(next, expandedPrev);

    const smoothT = t * t * (3 - 2 * t);

    return {
      position: {
        x: this.lerp(expandedPrev.position.x, expandedNext.position.x, smoothT),
        y: this.lerp(expandedPrev.position.y, expandedNext.position.y, smoothT)
      },
      velocity: {
        x: this.lerp(expandedPrev.velocity.x, expandedNext.velocity.x, t),
        y: this.lerp(expandedPrev.velocity.y, expandedNext.velocity.y, t)
      },
      isGrounded: t < 0.5 ? expandedPrev.isGrounded : expandedNext.isGrounded,
      facing: t < 0.5 ? expandedPrev.facing : expandedNext.facing,
      isJumping: t < 0.5 ? expandedPrev.isJumping : expandedNext.isJumping,
      isDead: t < 0.5 ? expandedPrev.isDead : expandedNext.isDead,
      actionState: t < 0.5 ? expandedPrev.actionState : expandedNext.actionState
    };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  public deleteSegment(segmentId: string, container: PIXI.Container): void {
    this.saveSnapshot();

    const index = this.segments.findIndex(s => s.id === segmentId);
    if (index !== -1) {
      const ghost = this.ghostPlayers.get(segmentId);
      if (ghost) {
        container.removeChild(ghost.sprite);
        this.ghostPlayers.delete(segmentId);
      }
      this.segments.splice(index, 1);
    }
  }

  public clearAllRecordings(container: PIXI.Container): void {
    this.saveSnapshot();

    for (const ghost of this.ghostPlayers.values()) {
      container.removeChild(ghost.sprite);
    }
    this.ghostPlayers.clear();
    this.segments = [];
    this.currentSegment = null;
    this.isRecording = false;
    this.playbackTime = 0;
  }

  private saveSnapshot(): void {
    const snapshot: RecordingSnapshot = {
      timestamp: Date.now(),
      segments: this.segments.map(s => ({
        ...s,
        keyframes: s.keyframes.map(k => ({
          ...k,
          position: k.position ? { ...k.position } : undefined,
          velocity: k.velocity ? { ...k.velocity } : undefined
        }))
      })),
      playerState: this.lastSavedState || {
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        isGrounded: false,
        facing: 1,
        isJumping: false,
        isDead: false,
        actionState: 0
      }
    };

    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.config.maxUndoSteps) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  public undo(container: PIXI.Container): boolean {
    if (this.undoStack.length === 0) return false;

    const currentSnapshot: RecordingSnapshot = {
      timestamp: Date.now(),
      segments: this.segments.map(s => ({
        ...s,
        keyframes: s.keyframes.map(k => ({
          ...k,
          position: k.position ? { ...k.position } : undefined,
          velocity: k.velocity ? { ...k.velocity } : undefined
        }))
      })),
      playerState: this.lastSavedState || {
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        isGrounded: false,
        facing: 1,
        isJumping: false,
        isDead: false,
        actionState: 0
      }
    };
    this.redoStack.push(currentSnapshot);

    const previous = this.undoStack.pop()!;
    this.restoreSnapshot(previous, container);
    return true;
  }

  public redo(container: PIXI.Container): boolean {
    if (this.redoStack.length === 0) return false;

    const currentSnapshot: RecordingSnapshot = {
      timestamp: Date.now(),
      segments: this.segments.map(s => ({
        ...s,
        keyframes: s.keyframes.map(k => ({
          ...k,
          position: k.position ? { ...k.position } : undefined,
          velocity: k.velocity ? { ...k.velocity } : undefined
        }))
      })),
      playerState: this.lastSavedState || {
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        isGrounded: false,
        facing: 1,
        isJumping: false,
        isDead: false,
        actionState: 0
      }
    };
    this.undoStack.push(currentSnapshot);

    const next = this.redoStack.pop()!;
    this.restoreSnapshot(next, container);
    return true;
  }

  private restoreSnapshot(snapshot: RecordingSnapshot, container: PIXI.Container): void {
    for (const ghost of this.ghostPlayers.values()) {
      container.removeChild(ghost.sprite);
    }
    this.ghostPlayers.clear();

    this.segments = snapshot.segments.map(s => ({
      ...s,
      keyframes: s.keyframes.map(k => ({
        ...k,
        position: k.position ? { ...k.position } : undefined,
        velocity: k.velocity ? { ...k.velocity } : undefined
      }))
    }));

    for (const segment of this.segments) {
      this.createGhostPlayer(segment, container);
    }

    this.lastSavedState = snapshot.playerState
      ? {
          ...snapshot.playerState,
          position: { ...snapshot.playerState.position },
          velocity: { ...snapshot.playerState.velocity }
        }
      : null;
  }

  public getUndoCount(): number {
    return this.undoStack.length;
  }

  public getRedoCount(): number {
    return this.redoStack.length;
  }

  public getMemoryUsage(): number {
    let totalFrames = 0;
    for (const segment of this.segments) {
      totalFrames += segment.keyframes.length;
    }
    return totalFrames * 80;
  }

  public getTotalFrames(): number {
    let total = 0;
    for (const segment of this.segments) {
      total += segment.keyframes.length;
    }
    return total;
  }
}
