import { CONFIG } from './config';

export interface FrequencyBand {
  low: number;
  mid: number;
  high: number;
  lowAmplitude: number;
  highAmplitude: number;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private threshold: number = 80;
  private isInitialized: boolean = false;
  private lastTriggerTime: number = 0;
  private triggerCooldown: number = 100;
  
  async initialize(): Promise<boolean> {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error);
      return false;
    }
  }
  
  setThreshold(value: number): void {
    this.threshold = value;
  }
  
  getThreshold(): number {
    return this.threshold;
  }
  
  getFrequencyData(): FrequencyBand | null {
    if (!this.analyser || !this.dataArray) {
      return null;
    }
    
    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);
    
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const binSize = sampleRate / this.analyser.fftSize;
    
    const lowBin = Math.floor(CONFIG.LOW_FREQ_THRESHOLD / binSize);
    const highBin = Math.floor(CONFIG.HIGH_FREQ_THRESHOLD / binSize);
    
    let lowSum = 0;
    let lowCount = 0;
    let midSum = 0;
    let midCount = 0;
    let highSum = 0;
    let highCount = 0;
    
    for (let i = 0; i < this.dataArray.length; i++) {
      const freq = i * binSize;
      const amplitude = this.dataArray[i];
      
      if (freq < CONFIG.LOW_FREQ_THRESHOLD) {
        lowSum += amplitude;
        lowCount++;
      } else if (freq < CONFIG.HIGH_FREQ_THRESHOLD) {
        midSum += amplitude;
        midCount++;
      } else {
        highSum += amplitude;
        highCount++;
      }
    }
    
    const low = lowCount > 0 ? lowSum / lowCount : 0;
    const mid = midCount > 0 ? midSum / midCount : 0;
    const high = highCount > 0 ? highSum / highCount : 0;
    
    const lowAmplitude = this.getAverageAmplitude(0, lowBin);
    const highAmplitude = this.getAverageAmplitude(highBin, this.dataArray.length);
    
    return { low, mid, high, lowAmplitude, highAmplitude };
  }
  
  private getAverageAmplitude(startBin: number, endBin: number): number {
    if (!this.dataArray) return 0;
    
    let sum = 0;
    const count = endBin - startBin;
    
    for (let i = startBin; i < endBin && i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    return count > 0 ? sum / count : 0;
  }
  
  shouldTrigger(): { triggered: boolean; band: 'low' | 'mid' | 'high' | null } {
    if (!this.isInitialized) {
      return { triggered: false, band: null };
    }
    
    const now = performance.now();
    if (now - this.lastTriggerTime < this.triggerCooldown) {
      return { triggered: false, band: null };
    }
    
    const freqData = this.getFrequencyData();
    if (!freqData) {
      return { triggered: false, band: null };
    }
    
    const normalizedThreshold = (this.threshold / 255) * 255;
    
    if (freqData.low > normalizedThreshold) {
      this.lastTriggerTime = now;
      return { triggered: true, band: 'low' };
    }
    
    if (freqData.high > normalizedThreshold) {
      this.lastTriggerTime = now;
      return { triggered: true, band: 'high' };
    }
    
    if (freqData.mid > normalizedThreshold) {
      this.lastTriggerTime = now;
      return { triggered: true, band: 'mid' };
    }
    
    return { triggered: false, band: null };
  }
  
  isReady(): boolean {
    return this.isInitialized;
  }
  
  dispose(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
    this.isInitialized = false;
  }
}