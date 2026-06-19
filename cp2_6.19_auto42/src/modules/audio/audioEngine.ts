export type SoundSourceType = 'rain' | 'wind' | 'traffic' | 'birds' | 'hum';

export interface TrackNode {
  source: AudioNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  pan: StereoPannerNode;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private tracks: Map<SoundSourceType, TrackNode> = new Map();

  public init(): void {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  private createWhiteNoise(): AudioBufferSourceNode {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  private createPinkNoise(): AudioBufferSourceNode {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  private createBrownNoise(): AudioBufferSourceNode {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  private createBirdOscillators(): { nodes: OscillatorNode[]; gain: GainNode } {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const nodes: OscillatorNode[] = [];
    const gain = this.audioContext.createGain();
    gain.gain.value = 0;

    const oscillatorCount = 3;
    for (let i = 0; i < oscillatorCount; i++) {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 1000 + Math.random() * 2000;

      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.value = 2 + Math.random() * 4;
      lfoGain.gain.value = 500 + Math.random() * 1000;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(gain);
      osc.start();
      nodes.push(osc);
    }

    return { nodes, gain };
  }

  private createHumOscillators(): { nodes: OscillatorNode[]; gain: GainNode } {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const nodes: OscillatorNode[] = [];
    const gain = this.audioContext.createGain();
    gain.gain.value = 0;

    const frequencies = [50, 60, 100, 120];
    for (const freq of frequencies) {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const oscGain = this.audioContext.createGain();
      oscGain.gain.value = 0.25;
      osc.connect(oscGain);
      oscGain.connect(gain);
      osc.start();
      nodes.push(osc);
    }

    return { nodes, gain };
  }

  public createTrack(type: SoundSourceType, index: number): void {
    if (!this.audioContext || !this.masterGain) {
      throw new Error('AudioContext not initialized');
    }

    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    const pan = this.audioContext.createStereoPanner();

    gain.gain.value = 0;
    const panValue = index === 0 ? 0 : (index / (Math.max(index, 1))) * 1.2 - 0.6;
    pan.pan.value = Math.max(-0.6, Math.min(0.6, panValue));

    let source: AudioNode;

    switch (type) {
      case 'rain':
        source = this.createPinkNoise();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        break;
      case 'wind':
        source = this.createBrownNoise();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.5;
        break;
      case 'traffic':
        source = this.createWhiteNoise();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        break;
      case 'birds': {
        const birdResult = this.createBirdOscillators();
        source = birdResult.gain;
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;
        break;
      }
      case 'hum': {
        const humResult = this.createHumOscillators();
        source = humResult.gain;
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        break;
      }
      default:
        source = this.createWhiteNoise();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
    }

    source.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(this.masterGain);

    this.tracks.set(type, { source, filter, gain, pan });
  }

  public setVolume(type: SoundSourceType, volume: number): void {
    const track = this.tracks.get(type);
    if (!track || !this.audioContext) return;

    const normalizedVolume = Math.max(0, Math.min(100, volume)) / 100;
    track.gain.gain.setTargetAtTime(normalizedVolume, this.audioContext.currentTime, 0.1);
  }

  public setPan(type: SoundSourceType, pan: number): void {
    const track = this.tracks.get(type);
    if (!track) return;

    const clampedPan = Math.max(-1, Math.min(1, pan));
    track.pan.pan.value = clampedPan;
  }

  public async start(): Promise<void> {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    for (const [, track] of this.tracks) {
      if (track.source instanceof AudioBufferSourceNode) {
        try {
          track.source.start();
        } catch {
        }
      }
    }
  }

  public stop(): void {
    for (const [, track] of this.tracks) {
      if (track.source instanceof AudioBufferSourceNode) {
        try {
          track.source.stop();
        } catch {
        }
      }
      track.source.disconnect();
      track.filter.disconnect();
      track.gain.disconnect();
      track.pan.disconnect();
    }

    this.tracks.clear();

    if (this.masterGain) {
      this.masterGain.disconnect();
    }
    if (this.analyser) {
      this.analyser.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.masterGain = null;
    this.analyser = null;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public isInitialized(): boolean {
    return this.audioContext !== null;
  }
}
