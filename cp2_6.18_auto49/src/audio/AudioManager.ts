export class AudioManager {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private bpm: number = 320;
  private beatInterval: number = 60000 / 320;
  private totalDuration: number = 24000;
  private onTimeUpdate: ((timeMs: number) => void) | null = null;
  private animationFrameId: number | null = null;
  private scheduledNotes: Set<number> = new Set();

  constructor() {}

  setOnTimeUpdate(callback: (timeMs: number) => void): void {
    this.onTimeUpdate = callback;
  }

  async init(): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    await this.audioContext.resume();
  }

  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized. Call init() first.');
    }
    return this.audioContext;
  }

  play(): void {
    if (this.isPlaying) return;
    
    const ctx = this.ensureContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    this.startTime = ctx.currentTime * 1000 - this.pauseTime;
    this.isPlaying = true;
    this.scheduledNotes.clear();
    
    this.scheduleMusic();
    this.timeUpdateLoop();
  }

  pause(): void {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    this.pauseTime = this.getCurrentTime();
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.scheduledNotes.clear();
  }

  stop(): void {
    this.isPlaying = false;
    this.pauseTime = 0;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.scheduledNotes.clear();
  }

  getCurrentTime(): number {
    if (!this.isPlaying) {
      return this.pauseTime;
    }
    const ctx = this.ensureContext();
    return ctx.currentTime * 1000 - this.startTime;
  }

  getTotalDuration(): number {
    return this.totalDuration;
  }

  private timeUpdateLoop = (): void => {
    if (!this.isPlaying) return;
    
    const currentTime = this.getCurrentTime();
    
    if (currentTime >= this.totalDuration) {
      this.stop();
      return;
    }
    
    if (this.onTimeUpdate) {
      this.onTimeUpdate(currentTime);
    }
    
    this.animationFrameId = requestAnimationFrame(this.timeUpdateLoop);
  };

  private scheduleMusic(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const audioStartTime = this.startTime / 1000;
    
    for (let beat = 0; beat < 128; beat++) {
      const beatTimeMs = beat * this.beatInterval;
      const beatTimeAudio = audioStartTime + beatTimeMs / 1000;
      
      if (beatTimeAudio > now + 2) break;
      
      if (!this.scheduledNotes.has(beat)) {
        this.scheduledNotes.add(beat);
        
        if (beat % 4 === 0) {
          this.scheduleKick(beatTimeAudio);
        }
        
        if (beat % 2 === 1) {
          this.scheduleSnare(beatTimeAudio);
        }
        
        this.scheduleHiHat(beatTimeAudio);
        
        if (beat % 2 === 0) {
          this.scheduleBass(beatTimeAudio, beat);
        }
      }
    }
    
    if (this.isPlaying) {
      setTimeout(() => {
        if (this.isPlaying) {
          this.scheduleMusic();
        }
      }, 500);
    }
  }

  private scheduleKick(time: number): void {
    const ctx = this.ensureContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private scheduleSnare(time: number): void {
    const ctx = this.ensureContext();
    
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(time);
    noise.stop(time + 0.15);
  }

  private scheduleHiHat(time: number): void {
    const ctx = this.ensureContext();
    
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(time);
    noise.stop(time + 0.03);
  }

  private scheduleBass(time: number, beat: number): void {
    const ctx = this.ensureContext();
    
    const notes = [55, 55, 73.42, 55, 65.41, 55, 73.42, 65.41];
    const noteIndex = Math.floor(beat / 8) % notes.length;
    const freq = notes[noteIndex];
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.3);
  }
}
