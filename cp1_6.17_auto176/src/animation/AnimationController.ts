import { eventBus, Events } from '../utils/EventBus';
import { drawEngine } from '../draw/DrawEngine';
import { sceneManager } from '../scene/SceneManager';
import { Frame, LightTrace, PlaybackState, generateId } from '../types';

class AnimationController {
  private frames: Frame[] = [];
  private playbackState: PlaybackState = {
    isPlaying: false,
    currentFrameIndex: 0,
    mode: 'once',
    startTime: 0,
    frameDuration: 1000
  };
  private playAnimationFrameId: number | null = null;

  init(): void {
    this.addEmptyFrame();
    
    eventBus.on(Events.DRAW_END, (trace: LightTrace | null) => {
      if (trace) {
        this.updateCurrentFrameThumbnail();
      }
    });
    
    eventBus.on(Events.FRAME_CHANGED, (frameId: string) => {
      this.updateFrameThumbnail(frameId);
    });
  }

  addFrame(traces?: LightTrace[]): Frame {
    const frame: Frame = {
      id: generateId(),
      index: this.frames.length,
      traces: traces ? [...traces] : [],
      createdAt: Date.now()
    };
    
    this.frames.push(frame);
    drawEngine.setCurrentFrameId(frame.id);
    
    eventBus.emit(Events.FRAME_ADDED, frame);
    this.updateFrameIndices();
    
    return frame;
  }

  addEmptyFrame(): Frame {
    return this.addFrame([]);
  }

  addFrameWithCurrentTraces(): Frame {
    const currentTraces = drawEngine.getCurrentFrameTraces();
    return this.addFrame(currentTraces);
  }

  removeFrame(frameId: string): void {
    const index = this.frames.findIndex(f => f.id === frameId);
    if (index > -1 && this.frames.length > 1) {
      this.frames.splice(index, 1);
      this.updateFrameIndices();
      
      if (this.playbackState.currentFrameIndex >= this.frames.length) {
        this.playbackState.currentFrameIndex = this.frames.length - 1;
      }
      
      eventBus.emit(Events.FRAME_REMOVED, frameId);
      this.goToFrame(this.playbackState.currentFrameIndex);
    }
  }

  reorderFrames(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.frames.length) return;
    if (toIndex < 0 || toIndex >= this.frames.length) return;
    if (fromIndex === toIndex) return;
    
    const [removed] = this.frames.splice(fromIndex, 1);
    this.frames.splice(toIndex, 0, removed);
    
    this.updateFrameIndices();
    eventBus.emit(Events.FRAME_REORDERED, { fromIndex, toIndex });
    
    if (this.playbackState.currentFrameIndex === fromIndex) {
      this.playbackState.currentFrameIndex = toIndex;
    } else if (fromIndex < this.playbackState.currentFrameIndex && toIndex >= this.playbackState.currentFrameIndex) {
      this.playbackState.currentFrameIndex--;
    } else if (fromIndex > this.playbackState.currentFrameIndex && toIndex <= this.playbackState.currentFrameIndex) {
      this.playbackState.currentFrameIndex++;
    }
  }

  private updateFrameIndices(): void {
    this.frames.forEach((frame, index) => {
      frame.index = index;
    });
  }

  goToFrame(index: number): void {
    if (index < 0 || index >= this.frames.length) return;
    
    this.playbackState.currentFrameIndex = index;
    const frame = this.frames[index];
    
    drawEngine.loadFrame(frame.id, frame.traces, false, false);
    
    eventBus.emit(Events.FRAME_CHANGED, frame.id);
  }

  nextFrame(): void {
    if (this.frames.length === 0) return;
    
    const nextIndex = (this.playbackState.currentFrameIndex + 1) % this.frames.length;
    this.goToFrame(nextIndex);
  }

  prevFrame(): void {
    if (this.frames.length === 0) return;
    
    const prevIndex = (this.playbackState.currentFrameIndex - 1 + this.frames.length) % this.frames.length;
    this.goToFrame(prevIndex);
  }

  play(mode: 'loop' | 'once' = 'once'): void {
    if (this.frames.length < 2) return;
    
    this.stopPlaybackAnimation();
    
    this.playbackState.isPlaying = true;
    this.playbackState.mode = mode;
    this.playbackState.startTime = Date.now();
    
    if (this.playbackState.currentFrameIndex >= this.frames.length - 1) {
      this.playbackState.currentFrameIndex = 0;
    }
    
    this.playbackLoop();
    
    eventBus.emit(Events.PLAY_START, mode);
  }

  private playbackLoop(): void {
    if (!this.playbackState.isPlaying) return;
    
    const elapsed = Date.now() - this.playbackState.startTime;
    const expectedFrame = Math.floor(elapsed / this.playbackState.frameDuration);
    
    const targetIndex = this.playbackState.mode === 'loop'
      ? (this.playbackState.currentFrameIndex + 1) % this.frames.length
      : this.playbackState.currentFrameIndex + 1;
    
    if (this.playbackState.mode === 'once' && targetIndex >= this.frames.length) {
      this.stop();
      return;
    }
    
    const currentActualIndex = this.playbackState.mode === 'loop'
      ? expectedFrame % this.frames.length
      : Math.min(expectedFrame, this.frames.length - 1);
    
    if (currentActualIndex !== this.playbackState.currentFrameIndex) {
      this.loadFrameWithAnimation(currentActualIndex);
    }
    
    this.playAnimationFrameId = requestAnimationFrame(() => this.playbackLoop());
  }

  private loadFrameWithAnimation(targetIndex: number): void {
    drawEngine.clearDisplayObjects();
    
    for (let i = 0; i <= targetIndex; i++) {
      const frame = this.frames[i];
      const isNew = i === targetIndex;
      drawEngine.loadFrame(frame.id, frame.traces, isNew, i > 0);
    }
    
    this.playbackState.currentFrameIndex = targetIndex;
    eventBus.emit(Events.FRAME_CHANGED, this.frames[targetIndex].id);
  }

  pause(): void {
    this.playbackState.isPlaying = false;
    this.stopPlaybackAnimation();
    eventBus.emit(Events.PLAY_PAUSE);
  }

  stop(): void {
    this.playbackState.isPlaying = false;
    this.stopPlaybackAnimation();
    this.goToFrame(0);
    eventBus.emit(Events.PLAY_STOP);
  }

  private stopPlaybackAnimation(): void {
    if (this.playAnimationFrameId) {
      cancelAnimationFrame(this.playAnimationFrameId);
      this.playAnimationFrameId = null;
    }
  }

  getCurrentFrame(): Frame | null {
    if (this.frames.length === 0) return null;
    return this.frames[this.playbackState.currentFrameIndex] || null;
  }

  getFrames(): Frame[] {
    return [...this.frames];
  }

  getCurrentFrameIndex(): number {
    return this.playbackState.currentFrameIndex;
  }

  isPlaying(): boolean {
    return this.playbackState.isPlaying;
  }

  setFrameDuration(duration: number): void {
    this.playbackState.frameDuration = duration;
  }

  getFrameDuration(): number {
    return this.playbackState.frameDuration;
  }

  updateFrameThumbnail(frameId: string): void {
    const frame = this.frames.find(f => f.id === frameId);
    if (!frame) return;
    
    drawEngine.loadFrame(frame.id, frame.traces, false, false);
    
    setTimeout(() => {
      frame.thumbnail = sceneManager.captureThumbnail(160, 100);
    }, 50);
  }

  updateCurrentFrameThumbnail(): void {
    const currentFrame = this.getCurrentFrame();
    if (currentFrame) {
      this.updateFrameThumbnail(currentFrame.id);
    }
  }

  clearAll(): void {
    this.stop();
    this.frames = [];
    this.playbackState.currentFrameIndex = 0;
    eventBus.emit(Events.SCENE_CLEAR);
    this.addEmptyFrame();
  }
}

export const animationController = new AnimationController();
