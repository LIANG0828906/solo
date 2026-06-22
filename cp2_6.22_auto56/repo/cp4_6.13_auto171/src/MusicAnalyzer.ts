export interface BeatInfo {
  bpm: number;
  beatPhase: number;
  beatIndex: number;
  nearestBeatTime: number;
  timeSinceLastBeat: number;
  timeToNextBeat: number;
  isBeat: boolean;
}

export interface LevelTrack {
  name: string;
  bpm: number;
  duration: number;
  id: number;
}

export const LEVEL_TRACKS: LevelTrack[] = [
  { id: 0, name: 'Neon Pulse', bpm: 120, duration: 90 },
  { id: 1, name: 'Cyber Drift', bpm: 140, duration: 90 },
  { id: 2, name: 'Quantum Rush', bpm: 170, duration: 90 }
];

export class MusicAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private currentTrack: LevelTrack = LEVEL_TRACKS[0];
  private beatTimes: number[] = [];
  private lastBeatIndex: number = -1;
  private beatCallback: (() => void) | null = null;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;

  private oscillators: OscillatorNode[] = [];
  private sfxGain: GainNode | null = null;

  constructor() {}

  async init(): Promise<void> {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.musicVolume;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.5;
    this.gainNode.connect(this.masterGain);

    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.audioContext.destination);
  }

  private generateBeatTimes(): void {
    this.beatTimes = [];
    const beatDuration = 60 / this.currentTrack.bpm;
    const totalBeats = Math.floor(this.currentTrack.duration / beatDuration);
    
    for (let i = 0; i < totalBeats; i++) {
      this.beatTimes.push(i * beatDuration);
    }
  }

  async loadTrack(trackId: number): Promise<void> {
    const track = LEVEL_TRACKS.find(t => t.id === trackId);
    if (!track) return;
    
    this.currentTrack = track;
    this.generateBeatTimes();
    this.lastBeatIndex = -1;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = volume;
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = volume;
    if (this.sfxGain) {
      this.sfxGain.gain.value = volume;
    }
  }

  async start(): Promise<void> {
    if (!this.audioContext) {
      await this.init();
    }
    
    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume();
    }
    
    this.startTime = this.audioContext!.currentTime;
    this.isPlaying = true;
    this.lastBeatIndex = -1;
    
    this.playGeneratedMusic();
  }

  stop(): void {
    this.isPlaying = false;
    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.oscillators = [];
  }

  private playGeneratedMusic(): void {
    if (!this.audioContext || !this.gainNode) return;
    
    const ctx = this.audioContext;
    const bpm = this.currentTrack.bpm;
    const beatDuration = 60 / bpm;
    
    const baseFreq = this.getBaseFreqForTrack(this.currentTrack.id);
    
    const pattern = this.getPatternForTrack(this.currentTrack.id);
    
    this.playBassLine(baseFreq, beatDuration, pattern);
    this.playLeadMelody(baseFreq * 2, beatDuration, pattern);
    this.playDrums(beatDuration);
    this.playPad(baseFreq * 0.5, beatDuration);
  }

  private getBaseFreqForTrack(trackId: number): number {
    switch (trackId) {
      case 0: return 110;
      case 1: return 130.81;
      case 2: return 146.83;
      default: return 110;
    }
  }

  private getPatternForTrack(trackId: number): number[] {
    switch (trackId) {
      case 0:
        return [0, 3, 5, 7, 5, 3, 0, -2];
      case 1:
        return [0, 4, 7, 12, 7, 4, 0, -5];
      case 2:
        return [0, 5, 7, 10, 12, 10, 7, 5];
      default:
        return [0, 3, 5, 7, 5, 3, 0, -2];
    }
  }

  private playBassLine(baseFreq: number, beatDuration: number, pattern: number[]): void {
    if (!this.audioContext || !this.gainNode) return;
    
    const ctx = this.audioContext;
    const totalBeats = pattern.length * Math.ceil(this.currentTrack.duration / (beatDuration * pattern.length));
    
    for (let i = 0; i < totalBeats; i++) {
      const noteOffset = pattern[i % pattern.length];
      const freq = baseFreq * Math.pow(2, noteOffset / 12);
      
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      const gain = ctx.createGain();
      gain.gain.value = 0;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.gainNode);
      
      const startTime = this.startTime + i * beatDuration;
      const endTime = startTime + beatDuration * 0.9;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, endTime);
      
      osc.start(startTime);
      osc.stop(endTime + 0.05);
      
      this.oscillators.push(osc);
    }
  }

  private playLeadMelody(baseFreq: number, beatDuration: number, pattern: number[]): void {
    if (!this.audioContext || !this.gainNode) return;
    
    const ctx = this.audioContext;
    const noteDuration = beatDuration / 2;
    const totalNotes = Math.floor(this.currentTrack.duration / noteDuration);
    
    const melodyPattern = [...pattern, ...pattern.map(n => n + 2)];
    
    for (let i = 0; i < totalNotes; i++) {
      if (i % 2 === 1 && Math.random() > 0.5) continue;
      
      const noteOffset = melodyPattern[i % melodyPattern.length];
      const freq = baseFreq * Math.pow(2, noteOffset / 12);
      
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const gain = ctx.createGain();
      gain.gain.value = 0;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.gainNode);
      
      const startTime = this.startTime + i * noteDuration;
      const endTime = startTime + noteDuration * 0.8;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.01, endTime);
      
      osc.start(startTime);
      osc.stop(endTime + 0.05);
      
      this.oscillators.push(osc);
    }
  }

  private playDrums(beatDuration: number): void {
    if (!this.audioContext || !this.gainNode) return;
    
    const ctx = this.audioContext;
    const totalBeats = Math.floor(this.currentTrack.duration / beatDuration);
    
    for (let i = 0; i < totalBeats; i++) {
      const startTime = this.startTime + i * beatDuration;
      
      if (i % 2 === 0) {
        this.playKick(startTime);
      }
      
      if (i % 2 === 1) {
        this.playSnare(startTime);
      }
      
      this.playHiHat(startTime + beatDuration * 0.25);
      this.playHiHat(startTime + beatDuration * 0.5);
      this.playHiHat(startTime + beatDuration * 0.75);
    }
  }

  private playKick(startTime: number): void {
    if (!this.audioContext || !this.gainNode) return;
    
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.15);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.6, startTime + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.gainNode);
    
    osc.start(startTime);
    osc.stop(startTime + 0.25);
    
    this.oscillators.push(osc);
  }

  private playSnare(startTime: number): void {
    if (!this.audioContext || !this.gainNode) return;
    
    const ctx = this.audioContext;
    
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    
    noise.start(startTime);
    noise.stop(startTime + 0.2);
  }

  private playHiHat(startTime: number): void {
    if (!this.audioContext || !this.gainNode) return;
    
    const ctx = this.audioContext;
    
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.1, startTime + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    
    noise.start(startTime);
    noise.stop(startTime + 0.06);
  }

  private playPad(baseFreq: number, beatDuration: number): void {
    if (!this.audioContext || !this.gainNode) return;
    
    const ctx = this.audioContext;
    const chordFreqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    
    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = ctx.createGain();
      gain.gain.value = 0;
      
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + idx * 0.05;
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.05;
      
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      
      osc.connect(gain);
      gain.connect(this.gainNode);
      
      gain.gain.setValueAtTime(0.05, this.startTime);
      
      osc.start(this.startTime);
      lfo.start(this.startTime);
      
      osc.stop(this.startTime + this.currentTrack.duration);
      lfo.stop(this.startTime + this.currentTrack.duration);
      
      this.oscillators.push(osc);
      this.oscillators.push(lfo);
    });
  }

  playShootSound(perfect: boolean): void {
    if (!this.audioContext || !this.sfxGain) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = perfect ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(perfect ? 800 : 500, now);
    osc.frequency.exponentialRampToValueAtTime(perfect ? 400 : 200, now + 0.1);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(perfect ? 0.3 : 0.2, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playExplosionSound(): void {
    if (!this.audioContext || !this.sfxGain) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    noise.start(now);
    noise.stop(now + 0.35);
  }

  playVictorySound(): void {
    if (!this.audioContext || !this.sfxGain) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = ctx.createGain();
      const startTime = now + i * 0.15;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  getBeatInfo(currentTime: number): BeatInfo {
    if (!this.isPlaying || this.beatTimes.length === 0) {
      return {
        bpm: this.currentTrack.bpm,
        beatPhase: 0,
        beatIndex: 0,
        nearestBeatTime: 0,
        timeSinceLastBeat: 0,
        timeToNextBeat: 0,
        isBeat: false
      };
    }
    
    const elapsed = currentTime - this.startTime;
    const beatDuration = 60 / this.currentTrack.bpm;
    
    const currentBeatIndex = Math.floor(elapsed / beatDuration);
    const beatPhase = (elapsed % beatDuration) / beatDuration;
    
    let nearestBeatIndex = currentBeatIndex;
    if (beatPhase > 0.5) {
      nearestBeatIndex = currentBeatIndex + 1;
    }
    
    const nearestBeatTime = nearestBeatIndex * beatDuration;
    const timeSinceLastBeat = elapsed - currentBeatIndex * beatDuration;
    const timeToNextBeat = (currentBeatIndex + 1) * beatDuration - elapsed;
    
    const isBeat = this.checkBeat(elapsed);
    
    return {
      bpm: this.currentTrack.bpm,
      beatPhase,
      beatIndex: currentBeatIndex,
      nearestBeatTime,
      timeSinceLastBeat,
      timeToNextBeat,
      isBeat
    };
  }

  private checkBeat(elapsed: number): boolean {
    const beatDuration = 60 / this.currentTrack.bpm;
    const currentBeatIndex = Math.floor(elapsed / beatDuration);
    
    if (currentBeatIndex > this.lastBeatIndex && currentBeatIndex < this.beatTimes.length) {
      this.lastBeatIndex = currentBeatIndex;
      if (this.beatCallback) {
        this.beatCallback();
      }
      return true;
    }
    return false;
  }

  onBeat(callback: () => void): void {
    this.beatCallback = callback;
  }

  getCurrentBpm(): number {
    return this.currentTrack.bpm;
  }

  getCurrentTrack(): LevelTrack {
    return this.currentTrack;
  }

  getTracks(): LevelTrack[] {
    return LEVEL_TRACKS;
  }

  getElapsedTime(currentTime: number): number {
    if (!this.isPlaying) return 0;
    return currentTime - this.startTime;
  }

  getDuration(): number {
    return this.currentTrack.duration;
  }

  isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  getBeatTimes(): number[] {
    return this.beatTimes;
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(0);
    }
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}
