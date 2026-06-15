export class SoundManager {
  private scene: Phaser.Scene;
  private audioContext!: AudioContext;
  private bpm: number = 120;
  private beatInterval: number = 0;
  private lastBeatTime: number = 0;
  private beatCallbacks: Array<(beat: number) => void> = [];
  private currentBeat: number = 0;
  private isPlaying: boolean = false;
  private musicGain!: GainNode;
  private sfxGain!: GainNode;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(): void {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.musicGain = this.audioContext.createGain();
    this.musicGain.gain.value = 0.3;
    this.musicGain.connect(this.audioContext.destination);
    
    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.audioContext.destination);
    
    this.beatInterval = 60000 / this.bpm;
  }

  startBackgroundMusic(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastBeatTime = this.audioContext.currentTime * 1000;
    this.scheduleMusicLoop();
  }

  stopBackgroundMusic(): void {
    this.isPlaying = false;
  }

  private scheduleMusicLoop(): void {
    if (!this.isPlaying) return;

    const now = this.audioContext.currentTime;
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    const pattern = [0, 2, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 0];
    
    const beatDuration = 60 / this.bpm;
    const startTime = now + 0.1;

    for (let i = 0; i < pattern.length; i++) {
      const noteTime = startTime + i * beatDuration;
      this.playNote(notes[pattern[i] % notes.length], noteTime, beatDuration * 0.8, 'music');
    }

    this.scene.time.delayedCall(pattern.length * this.beatInterval, () => {
      this.currentBeat = 0;
      this.scheduleMusicLoop();
    });
  }

  update(time: number, delta: number): void {
    if (!this.isPlaying) return;

    const now = time;
    while (now >= this.lastBeatTime + this.beatInterval) {
      this.lastBeatTime += this.beatInterval;
      this.currentBeat++;
      this.beatCallbacks.forEach(cb => cb(this.currentBeat));
    }
  }

  onBeat(callback: (beat: number) => void): void {
    this.beatCallbacks.push(callback);
  }

  offBeat(callback: (beat: number) => void): void {
    const index = this.beatCallbacks.indexOf(callback);
    if (index > -1) {
      this.beatCallbacks.splice(index, 1);
    }
  }

  playShootSound(frequency: number): void {
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + 0.1);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playHitSound(): void {
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playChordWaveSound(): void {
    const now = this.audioContext.currentTime;
    const frequencies = [261.63, 329.63, 392.00, 523.25];
    
    frequencies.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      
      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.05 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.8);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.8);
    });
  }

  playDeploySound(): void {
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playMissSound(): void {
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.25);
  }

  private playNote(frequency: number, startTime: number, duration: number, type: 'music' | 'sfx' = 'music'): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(type === 'music' ? this.musicGain : this.sfxGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  getBPM(): number {
    return this.bpm;
  }

  setBPM(bpm: number): void {
    this.bpm = bpm;
    this.beatInterval = 60000 / bpm;
  }

  resume(): void {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
