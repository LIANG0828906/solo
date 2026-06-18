class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private continuousOscillator: OscillatorNode | null = null;
  private continuousGain: GainNode | null = null;
  private oscillatorPool: OscillatorNode[] = [];
  private poolSize = 20;

  async init(): Promise<void> {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 44100,
      latencyHint: 'interactive'
    });

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.initializeOscillatorPool();
  }

  private initializeOscillatorPool(): void {
    if (!this.audioContext) return;
    
    for (let i = 0; i < this.poolSize; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      this.oscillatorPool.push(osc);
    }
  }

  resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      return this.audioContext.resume();
    }
    return Promise.resolve();
  }

  playTone(
    frequency: number,
    waveform: OscillatorType,
    duration: number = 0.3,
    volume: number = 0.5
  ): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = waveform;
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  startContinuousTone(frequency: number, volume: number = 0.2): void {
    if (!this.audioContext || !this.masterGain) return;
    if (this.continuousOscillator) {
      this.stopContinuousTone();
    }

    this.continuousOscillator = this.audioContext.createOscillator();
    this.continuousGain = this.audioContext.createGain();

    this.continuousOscillator.type = 'sine';
    this.continuousOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    this.continuousGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.continuousGain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);

    this.continuousOscillator.connect(this.continuousGain);
    this.continuousGain.connect(this.masterGain);
    this.continuousOscillator.start();
  }

  stopContinuousTone(): void {
    if (this.continuousOscillator && this.continuousGain) {
      const now = this.audioContext!.currentTime;
      this.continuousGain.gain.cancelScheduledValues(now);
      this.continuousGain.gain.setValueAtTime(this.continuousGain.gain.value, now);
      this.continuousGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      setTimeout(() => {
        if (this.continuousOscillator) {
          this.continuousOscillator.stop();
          this.continuousOscillator.disconnect();
          this.continuousGain?.disconnect();
          this.continuousOscillator = null;
          this.continuousGain = null;
        }
      }, 200);
    }
  }

  updateContinuousVolume(volume: number): void {
    if (this.continuousGain && this.audioContext) {
      this.continuousGain.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.05
      );
    }
  }

  getWaveformData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

export const audioEngine = new AudioEngine();
