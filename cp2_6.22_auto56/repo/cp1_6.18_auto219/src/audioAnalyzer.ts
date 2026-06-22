export interface BandEnergy {
  band: number;
  energy: number;
  isBeat: boolean;
}

const BAND_COUNT = 8;
const MAX_FREQ = 8000;
const FFT_SIZE = 1024;
const BEAT_THRESHOLD = 1.3;
const ENERGY_HISTORY_SIZE = 43;
const MAX_DURATION = 30;

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(FFT_SIZE / 2));
  private bandEnergies: BandEnergy[] = [];
  private energyHistory: number[][] = [];
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private pauseOffset: number = 0;
  private volume: number = 0.7;
  private onEndedCallback: (() => void) | null = null;

  constructor() {
    for (let i = 0; i < BAND_COUNT; i++) {
      this.bandEnergies.push({ band: i, energy: 0, isBeat: false });
      this.energyHistory.push([]);
    }
  }

  async loadFile(file: File): Promise<void> {
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('文件过大，请选择小于50MB的音频文件');
    }

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave'];
    const validExts = ['.mp3', '.wav'];
    const fileName = file.name.toLowerCase();
    const isValidType = validTypes.includes(file.type) || validExts.some(ext => fileName.endsWith(ext));
    
    if (!isValidType) {
      throw new Error('不支持的文件格式，请上传MP3或WAV文件');
    }

    this.dispose();

    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    if (this.audioBuffer.duration > MAX_DURATION) {
      throw new Error(`音频时长超过${MAX_DURATION}秒限制，请选择更短的音频`);
    }

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.volume;

    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

    for (let i = 0; i < BAND_COUNT; i++) {
      this.energyHistory[i] = [];
    }
  }

  start(): void {
    if (!this.audioContext || !this.audioBuffer || !this.analyser || !this.gainNode) {
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stop();

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser);

    this.source.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.pauseOffset = 0;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    };

    const offset = this.pauseOffset;
    this.source.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    this.isPlaying = true;
  }

  stop(): void {
    if (this.source) {
      try {
        if (this.isPlaying && this.audioContext) {
          this.pauseOffset = this.audioContext.currentTime - this.startTime;
          if (this.pauseOffset >= (this.audioBuffer?.duration ?? 0)) {
            this.pauseOffset = 0;
          }
        }
        this.source.stop();
        this.source.disconnect();
      } catch {
        // ignore stop errors
      }
      this.source = null;
    }
    this.isPlaying = false;
  }

  reset(): void {
    this.stop();
    this.pauseOffset = 0;
    for (let i = 0; i < BAND_COUNT; i++) {
      this.bandEnergies[i].energy = 0;
      this.bandEnergies[i].isBeat = false;
      this.energyHistory[i] = [];
    }
  }

  setOnEnded(callback: () => void): void {
    this.onEndedCallback = callback;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getAudioDuration(): number {
    return this.audioBuffer?.duration ?? 0;
  }

  getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) {
      return this.pauseOffset;
    }
    return this.audioContext.currentTime - this.startTime;
  }

  getBandEnergies(): BandEnergy[] {
    if (!this.analyser || !this.audioContext) {
      return this.bandEnergies;
    }

    this.analyser.getByteFrequencyData(this.frequencyData);

    const sampleRate = this.audioContext.sampleRate;
    const nyquist = sampleRate / 2;
    const binCount = this.frequencyData.length;

    for (let band = 0; band < BAND_COUNT; band++) {
      const lowFreq = (band / BAND_COUNT) * MAX_FREQ;
      const highFreq = ((band + 1) / BAND_COUNT) * MAX_FREQ;

      const lowBin = Math.floor((lowFreq / nyquist) * binCount);
      const highBin = Math.min(Math.ceil((highFreq / nyquist) * binCount), binCount);

      let sum = 0;
      let count = 0;
      for (let i = lowBin; i < highBin; i++) {
        sum += this.frequencyData[i];
        count++;
      }

      const avgEnergy = count > 0 ? sum / count / 255 : 0;
      
      const history = this.energyHistory[band];
      history.push(avgEnergy);
      if (history.length > ENERGY_HISTORY_SIZE) {
        history.shift();
      }

      const avgHistory = history.reduce((a, b) => a + b, 0) / Math.max(history.length, 1);
      const isBeat = avgHistory > 0 && avgEnergy > avgHistory * BEAT_THRESHOLD;

      this.bandEnergies[band].band = band;
      this.bandEnergies[band].energy = avgEnergy;
      this.bandEnergies[band].isBeat = isBeat;
    }

    return this.bandEnergies;
  }

  dispose(): void {
    this.stop();
    if (this.gainNode) {
      try { this.gainNode.disconnect(); } catch { /* ignore */ }
      this.gainNode = null;
    }
    if (this.analyser) {
      try { this.analyser.disconnect(); } catch { /* ignore */ }
      this.analyser = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch { /* ignore */ }
      this.audioContext = null;
    }
    this.audioBuffer = null;
    this.isPlaying = false;
    this.pauseOffset = 0;
  }
}
