export interface AudioAnalysis {
  volume: number;
  averageFrequency: number;
  frequencyData: Uint8Array;
  timeDomainData: Float32Array;
}

type NoteName = 'drum' | 'bass' | 'chord' | 'fx';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private frequencyData: Uint8Array;
  private timeDomainData: Float32Array;
  private isInitialized = false;

  constructor() {
    this.frequencyData = new Uint8Array(256);
    this.timeDomainData = new Float32Array(256);
  }

  private async init(): Promise<void> {
    if (this.isInitialized) return;
    
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Float32Array(this.analyser.frequencyBinCount);
    
    this.isInitialized = true;
  }

  async playNote(noteName: NoteName): Promise<void> {
    await this.init();
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    switch (noteName) {
      case 'drum':
        this.playDrum(now);
        break;
      case 'bass':
        this.playBass(now);
        break;
      case 'chord':
        this.playChord(now);
        break;
      case 'fx':
        this.playFX(now);
        break;
    }
  }

  private playDrum(now: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    filter.type = 'lowpass';
    filter.frequency.value = 800;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  private playBass(now: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = 65.41;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  private playChord(now: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const frequencies = [261.63, 329.63, 392.00];
    const gain = this.audioContext.createGain();

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    gain.connect(this.masterGain);

    frequencies.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const oscGain = this.audioContext!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      oscGain.gain.value = 0.33;

      osc.connect(oscGain);
      oscGain.connect(gain);

      osc.start(now + i * 0.02);
      osc.stop(now + 0.8);
    });
  }

  private playFX(now: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * 0.5;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(4000, now + 0.3);
    filter.Q.value = 8;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.5);
  }

  getAnalysis(): AudioAnalysis {
    if (!this.analyser) {
      return {
        volume: 0,
        averageFrequency: 0,
        frequencyData: this.frequencyData,
        timeDomainData: this.timeDomainData
      };
    }

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getFloatTimeDomainData(this.timeDomainData);

    let sum = 0;
    let weightedSum = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      sum += this.frequencyData[i];
      weightedSum += this.frequencyData[i] * i;
    }

    const volume = sum / (this.frequencyData.length * 255);
    const averageFrequency = sum > 0 
      ? (weightedSum / sum) * (this.audioContext?.sampleRate || 44100) / (this.analyser.fftSize)
      : 0;

    return {
      volume,
      averageFrequency,
      frequencyData: this.frequencyData,
      timeDomainData: this.timeDomainData
    };
  }

  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.masterGain = null;
    this.isInitialized = false;
  }
}
