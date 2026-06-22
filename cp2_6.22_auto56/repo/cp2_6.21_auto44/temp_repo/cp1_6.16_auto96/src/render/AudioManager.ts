import { AudioType } from '../game/PuzzleState';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private gainNodes: Map<AudioType, GainNode> = new Map();
  private sourceNodes: Map<AudioType, AudioBufferSourceNode | OscillatorNode | AudioBufferSourceNode[]> = new Map();
  private masterGain: GainNode | null = null;
  private isInitialized: boolean = false;

  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private ensureInitialized(): boolean {
    if (!this.isInitialized) {
      this.initialize();
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.isInitialized && this.audioContext !== null;
  }

  play(audioType: AudioType): void {
    if (!this.ensureInitialized()) return;

    this.stop(audioType);

    switch (audioType) {
      case 'pendulum':
        this.playPendulum();
        break;
      case 'gears':
        this.playGears();
        break;
      case 'rain':
        this.playRain();
        break;
      case 'merge':
        this.playMerge();
        break;
      case 'error':
        this.playError();
        break;
      case 'singularity':
        this.playSingularity();
        break;
    }
  }

  stop(audioType: AudioType): void {
    const source = this.sourceNodes.get(audioType);
    if (source) {
      if (Array.isArray(source)) {
        source.forEach(s => {
          try { s.stop(); } catch (e) {}
        });
      } else {
        try { source.stop(); } catch (e) {}
      }
      this.sourceNodes.delete(audioType);
    }

    const gain = this.gainNodes.get(audioType);
    if (gain) {
      gain.gain.cancelScheduledValues(0);
    }
  }

  stopAll(): void {
    this.sourceNodes.forEach((_, type) => this.stop(type));
  }

  private createGain(type: AudioType, volume: number): GainNode {
    if (!this.audioContext || !this.masterGain) {
      throw new Error('Audio not initialized');
    }

    const gain = this.audioContext.createGain();
    gain.gain.value = volume;
    gain.connect(this.masterGain);
    this.gainNodes.set(type, gain);
    return gain;
  }

  private playPendulum(): void {
    if (!this.audioContext) return;

    const gain = this.createGain('pendulum', 0.15);
    const sources: AudioBufferSourceNode[] = [];

    const playTick = () => {
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const oscGain = this.audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.1);
      
      oscGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      
      oscillator.connect(oscGain);
      oscGain.connect(gain);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);
      
      sources.push(oscillator as unknown as AudioBufferSourceNode);
    };

    const interval = setInterval(() => {
      if (this.sourceNodes.has('pendulum')) {
        playTick();
      } else {
        clearInterval(interval);
      }
    }, 1000);

    this.sourceNodes.set('pendulum', sources);
    playTick();
  }

  private playGears(): void {
    if (!this.audioContext) return;

    const gain = this.createGain('gears', 0.08);
    
    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    const lfo = this.audioContext.createOscillator();
    lfo.frequency.value = 2;
    
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 300;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    noise.connect(filter);
    filter.connect(gain);
    noise.start();

    this.sourceNodes.set('gears', noise);
  }

  private playRain(): void {
    if (!this.audioContext) return;

    const gain = this.createGain('rain', 0.12);
    
    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    noise.connect(filter);
    filter.connect(gain);
    noise.start();

    this.sourceNodes.set('rain', noise);
  }

  private playMerge(): void {
    if (!this.audioContext) return;

    const gain = this.createGain('merge', 0.2);

    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);

    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    oscGain.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.05);
    oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

    oscillator.connect(oscGain);
    oscGain.connect(gain);
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.4);

    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(660, this.audioContext.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.3);

    const osc2Gain = this.audioContext.createGain();
    osc2Gain.gain.setValueAtTime(0, this.audioContext.currentTime + 0.1);
    osc2Gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.15);
    osc2Gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    osc2.connect(osc2Gain);
    osc2Gain.connect(gain);
    osc2.start(this.audioContext.currentTime + 0.1);
    osc2.stop(this.audioContext.currentTime + 0.5);

    this.sourceNodes.set('merge', oscillator as unknown as AudioBufferSourceNode);
  }

  private playError(): void {
    if (!this.audioContext) return;

    const gain = this.createGain('error', 0.25);

    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(180, this.audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(160, this.audioContext.currentTime + 0.2);

    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

    oscillator.connect(oscGain);
    oscGain.connect(gain);
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.4);

    this.sourceNodes.set('error', oscillator as unknown as AudioBufferSourceNode);
  }

  private playSingularity(): void {
    if (!this.audioContext) return;

    const gain = this.createGain('singularity', 0.3);

    const oscillators: OscillatorNode[] = [];
    const freqs = [110, 220, 330, 440, 550, 660];

    freqs.forEach((freq, i) => {
      if (!this.audioContext) return;

      const osc = this.audioContext.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 4, this.audioContext.currentTime + 1.5);

      const oscGain = this.audioContext.createGain();
      oscGain.gain.setValueAtTime(0, this.audioContext.currentTime + i * 0.1);
      oscGain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + i * 0.1 + 0.2);
      oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);

      osc.connect(oscGain);
      oscGain.connect(gain);
      osc.start(this.audioContext.currentTime + i * 0.1);
      osc.stop(this.audioContext.currentTime + 2);

      oscillators.push(osc);
    });

    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.sin(i / bufferSize * Math.PI) * 0.2;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);

    noise.connect(noiseGain);
    noiseGain.connect(gain);
    noise.start();
    noise.stop(this.audioContext.currentTime + 2);

    this.sourceNodes.set('singularity', oscillators as unknown as AudioBufferSourceNode[]);
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}
