export type TimeUpdateCallback = (time: number) => void;
export type DurationCallback = (duration: number) => void;
export type PlayStateChangeCallback = (isPlaying: boolean) => void;

export class AudioPlayer {
  private audio: HTMLAudioElement;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private timeUpdateCallbacks: Set<TimeUpdateCallback> = new Set();
  private durationCallbacks: Set<DurationCallback> = new Set();
  private playStateCallbacks: Set<PlayStateChangeCallback> = new Set();
  private throttleTimer: number | null = null;
  private lastThrottledTime: number = 0;
  private readonly THROTTLE_INTERVAL = 100;

  constructor() {
    this.audio = new Audio();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.audio.addEventListener('play', () => this.updatePlayState(true));
    this.audio.addEventListener('pause', () => this.updatePlayState(false));
    this.audio.addEventListener('ended', () => this.updatePlayState(false));
  }

  private handleTimeUpdate = (): void => {
    this.currentTime = this.audio.currentTime;
    
    const now = performance.now();
    if (now - this.lastThrottledTime >= this.THROTTLE_INTERVAL) {
      this.lastThrottledTime = now;
      this.notifyTimeUpdate(this.currentTime);
    }
  };

  private handleLoadedMetadata = (): void => {
    this.duration = this.audio.duration;
    this.notifyDuration(this.duration);
  };

  private updatePlayState(playing: boolean): void {
    this.isPlaying = playing;
    this.playStateCallbacks.forEach(cb => cb(playing));
  }

  private notifyTimeUpdate(time: number): void {
    this.timeUpdateCallbacks.forEach(cb => cb(time));
  }

  private notifyDuration(duration: number): void {
    this.durationCallbacks.forEach(cb => cb(duration));
  }

  async loadAudio(src: string): Promise<void> {
    this.audio.src = src;
    this.currentTime = 0;
    this.isPlaying = false;
    
    return new Promise((resolve, reject) => {
      const handleCanPlay = () => {
        this.audio.removeEventListener('canplay', handleCanPlay);
        this.audio.removeEventListener('error', handleError);
        this.duration = this.audio.duration || 0;
        resolve();
      };
      
      const handleError = () => {
        this.audio.removeEventListener('canplay', handleCanPlay);
        this.audio.removeEventListener('error', handleError);
        reject(new Error('Failed to load audio'));
      };
      
      this.audio.addEventListener('canplay', handleCanPlay);
      this.audio.addEventListener('error', handleError);
      this.audio.load();
    });
  }

  play(): void {
    this.audio.play().catch(() => {});
  }

  pause(): void {
    this.audio.pause();
  }

  togglePlay(): boolean {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return !this.isPlaying;
  }

  seek(time: number): void {
    const clampedTime = Math.max(0, Math.min(time, this.duration));
    this.audio.currentTime = clampedTime;
    this.currentTime = clampedTime;
    this.notifyTimeUpdate(clampedTime);
  }

  skipBackward(seconds: number = 15): void {
    this.seek(this.currentTime - seconds);
  }

  skipForward(seconds: number = 15): void {
    this.seek(this.currentTime + seconds);
  }

  markTimestamp(): number {
    const markTime = this.currentTime;
    this.pause();
    return Math.floor(markTime * 1000) / 1000;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getDuration(): number {
    return this.duration;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getAudioElement(): HTMLAudioElement {
    return this.audio;
  }

  onTimeUpdate(callback: TimeUpdateCallback): () => void {
    this.timeUpdateCallbacks.add(callback);
    return () => this.timeUpdateCallbacks.delete(callback);
  }

  onLoadedMetadata(callback: DurationCallback): () => void {
    this.durationCallbacks.add(callback);
    if (this.duration > 0) {
      callback(this.duration);
    }
    return () => this.durationCallbacks.delete(callback);
  }

  onPlayStateChange(callback: PlayStateChangeCallback): () => void {
    this.playStateCallbacks.add(callback);
    callback(this.isPlaying);
    return () => this.playStateCallbacks.delete(callback);
  }

  destroy(): void {
    this.pause();
    this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.timeUpdateCallbacks.clear();
    this.durationCallbacks.clear();
    this.playStateCallbacks.clear();
    if (this.throttleTimer !== null) {
      cancelAnimationFrame(this.throttleTimer);
    }
    this.audio.src = '';
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
