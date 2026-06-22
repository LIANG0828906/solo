export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized: boolean = false;

  private obstacleBuffer: AudioBuffer | null = null;
  private energyBuffer: AudioBuffer | null = null;
  private jumpBuffer: AudioBuffer | null = null;
  private gameOverBuffer: AudioBuffer | null = null;

  private volume: number = 0.3;
  private isMuted: boolean = false;
  private volumeBeforeMute: number = 0.3;

  constructor() {}

  init(): void {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);

      this.generateSounds();
      this.isInitialized = true;
    } catch (e) {
      console.log('Web Audio API not supported:', e);
    }
  }

  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private generateSounds(): void {
    if (!this.audioContext) return;

    this.obstacleBuffer = this.generateObstacleSound();
    this.energyBuffer = this.generateEnergySound();
    this.jumpBuffer = this.generateJumpSound();
    this.gameOverBuffer = this.generateGameOverSound();
  }

  private generateObstacleSound(): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const duration = 0.15;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const frequency = 200;
    const amplitude = 0.8;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.max(0, 1 - t / duration);
      data[i] = amplitude * envelope * Math.sin(2 * Math.PI * frequency * t);
    }

    return buffer;
  }

  private generateEnergySound(): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const duration = 0.2;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const startFreq = 800;
    const endFreq = 1200;
    const amplitude = 0.6;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freq = startFreq + (endFreq - startFreq) * progress;
      const envelope = Math.exp(-progress * 3);
      
      const phase = 2 * Math.PI * (startFreq * t + 0.5 * (endFreq - startFreq) * t * t / duration);
      data[i] = amplitude * envelope * Math.sin(phase);
    }

    return buffer;
  }

  private generateJumpSound(): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const duration = 0.15;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const startFreq = 400;
    const endFreq = 600;
    const amplitude = 0.5;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freq = startFreq + (endFreq - startFreq) * progress;
      const envelope = Math.exp(-progress * 5);
      
      const phase = 2 * Math.PI * (startFreq * t + 0.5 * (endFreq - startFreq) * t * t / duration);
      data[i] = amplitude * envelope * Math.sin(phase);
    }

    return buffer;
  }

  private generateGameOverSound(): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const duration = 0.5;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const startFreq = 500;
    const endFreq = 200;
    const amplitude = 0.6;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freq = startFreq + (endFreq - startFreq) * progress;
      const envelope = Math.max(0, 1 - progress * 0.8);
      
      const phase = 2 * Math.PI * (startFreq * t + 0.5 * (endFreq - startFreq) * t * t / duration);
      data[i] = amplitude * envelope * Math.sin(phase);
    }

    return buffer;
  }

  private playBuffer(buffer: AudioBuffer | null): void {
    if (!this.isInitialized || !this.audioContext || !this.masterGain || !buffer) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start(0);
  }

  playObstacle(): void {
    this.playBuffer(this.obstacleBuffer);
  }

  playEnergy(): void {
    this.playBuffer(this.energyBuffer);
  }

  playJump(): void {
    this.playBuffer(this.jumpBuffer);
  }

  playGameOver(): void {
    this.playBuffer(this.gameOverBuffer);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (!this.isMuted && this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  setMuted(muted: boolean): void {
    if (this.isMuted === muted) return;
    this.isMuted = muted;

    if (!this.masterGain) return;

    if (muted) {
      this.volumeBeforeMute = this.volume;
      this.masterGain.gain.value = 0;
    } else {
      this.masterGain.gain.value = this.volume;
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  getVolume(): number {
    return this.volume;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

export const audioManager = new AudioManager();
