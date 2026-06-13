import { getBuildingById, BuildingFunction } from '../data/buildingData';

interface SoundInstance {
  gainNode: GainNode;
  oscillator?: OscillatorNode;
  noiseNode?: AudioBufferSourceNode;
  filterNode?: BiquadFilterNode;
  playing: boolean;
  targetVolume: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sounds: Map<string, SoundInstance> = new Map();
  private masterVolume: number = 0.5;
  private initialized: boolean = false;

  constructor() {}

  init(): void {
    if (this.initialized) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.masterGain.connect(this.audioContext.destination);
    this.initialized = true;
  }

  private ensureContext(): void {
    if (!this.initialized) {
      this.init();
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private createNoiseBuffer(duration: number = 2): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }

  private createSoundForFunction(func: BuildingFunction): { 
    source: AudioNode; 
    gain: GainNode;
    filter?: BiquadFilterNode;
    oscillator?: OscillatorNode;
    noiseSource?: AudioBufferSourceNode;
  } {
    if (!this.audioContext || !this.masterGain) {
      throw new Error('AudioContext not initialized');
    }

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(this.masterGain);

    let source: AudioNode;
    let filterNode: BiquadFilterNode | undefined;
    let oscillator: OscillatorNode | undefined;
    let noiseSource: AudioBufferSourceNode | undefined;

    switch (func) {
      case 'residential': {
        const noise = this.createNoiseBuffer(3);
        noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noise;
        noiseSource.loop = true;
        
        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 800;
        filterNode.Q.value = 0.5;
        
        noiseSource.connect(filterNode);
        filterNode.connect(gainNode);
        noiseSource.start();
        source = noiseSource;
        break;
      }
      case 'commercial': {
        oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 220 + Math.random() * 100;
        
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = 2 + Math.random() * 2;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 30;
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        lfo.start();
        
        const noise = this.createNoiseBuffer(2);
        noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noise;
        noiseSource.loop = true;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.value = 0.3;
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1500;
        noiseFilter.Q.value = 2;
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(gainNode);
        noiseSource.start();
        
        oscillator.connect(gainNode);
        oscillator.start();
        source = oscillator;
        break;
      }
      case 'leisure': {
        oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 1200 + Math.random() * 800;
        
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = 5 + Math.random() * 3;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 200;
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        lfo.start();
        
        const envGain = this.audioContext.createGain();
        envGain.gain.value = 0.1;
        
        const envLfo = this.audioContext.createOscillator();
        envLfo.frequency.value = 0.5 + Math.random() * 1.5;
        const envLfoGain = this.audioContext.createGain();
        envLfoGain.gain.value = 0.08;
        envLfo.connect(envLfoGain);
        envLfoGain.connect(envGain.gain);
        envLfo.start();
        
        oscillator.connect(envGain);
        envGain.connect(gainNode);
        oscillator.start();
        source = oscillator;
        break;
      }
      case 'transport': {
        const noise = this.createNoiseBuffer(4);
        noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noise;
        noiseSource.loop = true;
        
        filterNode = this.audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 200;
        filterNode.Q.value = 3;
        
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = 0.3;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 80;
        lfo.connect(lfoGain);
        lfoGain.connect(filterNode.frequency);
        lfo.start();
        
        noiseSource.connect(filterNode);
        filterNode.connect(gainNode);
        noiseSource.start();
        source = noiseSource;
        break;
      }
      default: {
        oscillator = this.audioContext.createOscillator();
        oscillator.frequency.value = 440;
        oscillator.connect(gainNode);
        oscillator.start();
        source = oscillator;
      }
    }

    return { 
      source, 
      gain: gainNode, 
      filter: filterNode,
      oscillator,
      noiseSource
    };
  }

  playSound(buildingId: string): void {
    this.ensureContext();
    if (!this.audioContext || !this.masterGain) return;

    if (this.sounds.has(buildingId)) {
      const instance = this.sounds.get(buildingId)!;
      this.fadeIn(instance);
      return;
    }

    const building = getBuildingById(buildingId);
    if (!building) return;

    try {
      const soundInfo = this.createSoundForFunction(building.function);
      const volume = this.getVolumeForFunction(building.function);
      
      const instance: SoundInstance = {
        gainNode: soundInfo.gain,
        oscillator: soundInfo.oscillator,
        noiseNode: soundInfo.noiseSource,
        filterNode: soundInfo.filter,
        playing: true,
        targetVolume: volume,
      };

      this.fadeIn(instance);
      this.sounds.set(buildingId, instance);
    } catch (e) {
      console.warn('Failed to create sound:', e);
    }
  }

  private getVolumeForFunction(func: BuildingFunction): number {
    switch (func) {
      case 'residential': return 0.15;
      case 'commercial': return 0.25;
      case 'leisure': return 0.2;
      case 'transport': return 0.3;
      default: return 0.2;
    }
  }

  private fadeIn(instance: SoundInstance): void {
    if (!this.audioContext) return;
    
    instance.playing = true;
    const now = this.audioContext.currentTime;
    instance.gainNode.gain.cancelScheduledValues(now);
    instance.gainNode.gain.setValueAtTime(instance.gainNode.gain.value, now);
    instance.gainNode.gain.linearRampToValueAtTime(instance.targetVolume, now + 0.3);
  }

  stopSound(buildingId: string): void {
    const instance = this.sounds.get(buildingId);
    if (!instance || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    instance.gainNode.gain.cancelScheduledValues(now);
    instance.gainNode.gain.setValueAtTime(instance.gainNode.gain.value, now);
    instance.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
    
    instance.playing = false;
  }

  stopAll(): void {
    for (const [id] of this.sounds) {
      this.stopSound(id);
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = volume;
    if (this.masterGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(volume, now + 0.1);
    }
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  getSoundLevel(buildingId: string): number {
    const instance = this.sounds.get(buildingId);
    if (!instance || !instance.playing) return 0;
    return instance.gainNode.gain.value / instance.targetVolume;
  }

  isPlaying(buildingId: string): boolean {
    const instance = this.sounds.get(buildingId);
    return instance?.playing ?? false;
  }

  dispose(): void {
    for (const [, instance] of this.sounds) {
      try {
        instance.oscillator?.stop();
        instance.noiseNode?.stop();
      } catch (e) {}
      instance.gainNode.disconnect();
    }
    this.sounds.clear();
    
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const audioEngine = new AudioEngine();
