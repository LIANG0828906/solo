export interface FrequencyBand {
  low: number;
  mid: number;
  high: number;
}

export interface AudioAnalysis {
  spectrum: Uint8Array;
  timeDomain: Float32Array;
  timeDomainLeft: Float32Array;
  timeDomainRight: Float32Array;
  bands: FrequencyBand;
}

export interface BeatEvent {
  time: number;
  strength: number;
  bpm: number;
}

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended';

const FFT_SIZE = 256;
const SAMPLE_RATE = 44100;
const FREQ_RESOLUTION = SAMPLE_RATE / FFT_SIZE;

const LOW_BAND_MIN = Math.floor(20 / FREQ_RESOLUTION);
const LOW_BAND_MAX = Math.floor(250 / FREQ_RESOLUTION);
const MID_BAND_MIN = LOW_BAND_MAX + 1;
const MID_BAND_MAX = Math.floor(2000 / FREQ_RESOLUTION);
const HIGH_BAND_MIN = MID_BAND_MAX + 1;
const HIGH_BAND_MAX = Math.floor(20000 / FREQ_RESOLUTION);

interface WorkerMessage {
  type: 'analyze' | 'reset';
  spectrum?: ArrayBuffer;
  timestamp?: number;
}

interface WorkerResult {
  type: 'bands' | 'beat';
  bands?: FrequencyBand;
  beat?: BeatEvent;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserLeft: AnalyserNode | null = null;
  private analyserRight: AnalyserNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private gainNode: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private worker: Worker | null = null;
  private state: AudioState = 'idle';
  private startTime = 0;
  private pausedAt = 0;
  private duration = 0;
  private songName = '';
  private onBeatCallback: ((beat: BeatEvent) => void) | null = null;
  private onBandsCallback: ((bands: FrequencyBand) => void) | null = null;
  private spectrumBuffer: Uint8Array;
  private timeDomainBuffer: Float32Array;
  private timeDomainLeftBuffer: Float32Array;
  private timeDomainRightBuffer: Float32Array;
  private currentBands: FrequencyBand = { low: 0, mid: 0, high: 0 };

  constructor() {
    this.spectrumBuffer = new Uint8Array(FFT_SIZE);
    this.timeDomainBuffer = new Float32Array(FFT_SIZE);
    this.timeDomainLeftBuffer = new Float32Array(FFT_SIZE);
    this.timeDomainRightBuffer = new Float32Array(FFT_SIZE);
    this.initWorker();
  }

  private initWorker(): void {
    const workerCode = `
      let spectrumHistory = [];
      let beatTimes = [];
      let lastBeatTime = 0;
      let lastSpectrum = new Float32Array(${FFT_SIZE / 2});
      const energyHistory = [];
      const HISTORY_SIZE = 43;
      
      function calculateBands(spectrum) {
        const LOW_BAND_MAX = ${LOW_BAND_MAX};
        const MID_BAND_MAX = ${MID_BAND_MAX};
        const HIGH_BAND_MAX = ${Math.min(HIGH_BAND_MAX, FFT_SIZE / 2 - 1)};
        
        let low = 0, mid = 0, high = 0;
        let lowCount = 0, midCount = 0, highCount = 0;
        
        for (let i = 0; i < spectrum.length; i++) {
          const val = spectrum[i] / 255;
          if (i <= LOW_BAND_MAX) { low += val; lowCount++; }
          else if (i <= MID_BAND_MAX) { mid += val; midCount++; }
          else if (i <= HIGH_BAND_MAX) { high += val; highCount++; }
        }
        
        return {
          low: lowCount > 0 ? low / lowCount : 0,
          mid: midCount > 0 ? mid / midCount : 0,
          high: highCount > 0 ? high / highCount : 0
        };
      }
      
      function detectBeat(spectrum, timestamp) {
        const current = new Float32Array(spectrum);
        
        let flux = 0;
        for (let i = 0; i < current.length; i++) {
          const diff = current[i] - lastSpectrum[i];
          flux += diff > 0 ? diff : 0;
        }
        
        lastSpectrum = current;
        
        energyHistory.push({ flux, time: timestamp });
        if (energyHistory.length > HISTORY_SIZE) {
          energyHistory.shift();
        }
        
        if (energyHistory.length < HISTORY_SIZE) return null;
        
        const recent = energyHistory.slice(-10);
        const avgFlux = energyHistory.reduce((sum, e) => sum + e.flux, 0) / energyHistory.length;
        const variance = energyHistory.reduce((sum, e) => sum + Math.pow(e.flux - avgFlux, 2), 0) / energyHistory.length;
        const stdDev = Math.sqrt(variance);
        
        const threshold = avgFlux + stdDev * 1.3;
        const latest = energyHistory[energyHistory.length - 1];
        const prev = energyHistory[energyHistory.length - 2];
        
        const minInterval = 200;
        if (latest.flux > threshold && 
            latest.flux > prev.flux && 
            timestamp - lastBeatTime > minInterval &&
            latest.flux > 5) {
          
          lastBeatTime = timestamp;
          beatTimes.push(timestamp);
          if (beatTimes.length > 20) beatTimes.shift();
          
          let bpm = 120;
          if (beatTimes.length >= 4) {
            const intervals = [];
            for (let i = 1; i < beatTimes.length; i++) {
              intervals.push(beatTimes[i] - beatTimes[i - 1]);
            }
            intervals.sort((a, b) => a - b);
            const mid = Math.floor(intervals.length / 2);
            const medianInterval = intervals.length % 2 === 0
              ? (intervals[mid - 1] + intervals[mid]) / 2
              : intervals[mid];
            bpm = Math.round(60000 / medianInterval);
            bpm = Math.max(100, Math.min(200, bpm));
          }
          
          return {
            time: timestamp,
            strength: Math.min(1, latest.flux / 50),
            bpm: bpm
          };
        }
        
        return null;
      }
      
      self.onmessage = function(e) {
        const data = e.data;
        if (data.type === 'analyze' && data.spectrum) {
          const spectrum = new Uint8Array(data.spectrum);
          const bands = calculateBands(spectrum);
          const timestamp = data.timestamp || 0;
          
          self.postMessage({ type: 'bands', bands: bands });
          
          const beat = detectBeat(spectrum, timestamp);
          if (beat) {
            self.postMessage({ type: 'beat', beat: beat });
          }
        } else if (data.type === 'reset') {
          beatTimes = [];
          lastBeatTime = 0;
          lastSpectrum = new Float32Array(${FFT_SIZE / 2});
          energyHistory.length = 0;
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e: MessageEvent<WorkerResult>) => {
      if (e.data.type === 'bands' && e.data.bands) {
        this.currentBands = e.data.bands;
        if (this.onBandsCallback) {
          this.onBandsCallback(e.data.bands);
        }
      } else if (e.data.type === 'beat' && e.data.beat) {
        if (this.onBeatCallback) {
          this.onBeatCallback(e.data.beat);
        }
      }
    };
  }

  async loadFile(file: File): Promise<void> {
    this.state = 'loading';
    this.songName = file.name;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.duration = this.audioBuffer.duration;
    this.state = 'idle';
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stopSource();

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.8;

    this.analyserLeft = this.audioContext.createAnalyser();
    this.analyserLeft.fftSize = FFT_SIZE;
    this.analyserLeft.smoothingTimeConstant = 0.8;

    this.analyserRight = this.audioContext.createAnalyser();
    this.analyserRight.fftSize = FFT_SIZE;
    this.analyserRight.smoothingTimeConstant = 0.8;

    this.splitter = this.audioContext.createChannelSplitter(2);
    this.gainNode = this.audioContext.createGain();

    this.source.connect(this.splitter);
    this.splitter.connect(this.analyserLeft, 0);
    this.splitter.connect(this.analyserRight, 1);
    this.splitter.connect(this.analyser, 0);
    this.splitter.connect(this.analyser, 1);

    this.source.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.worker?.postMessage({ type: 'reset' });

    const offset = this.pausedAt;
    this.source.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    this.state = 'playing';

    this.source.onended = () => {
      if (this.state === 'playing') {
        this.state = 'ended';
        this.pausedAt = 0;
      }
    };
  }

  pause(): void {
    if (this.state !== 'playing' || !this.audioContext) return;
    this.pausedAt = this.getCurrentTime();
    this.stopSource();
    this.state = 'paused';
  }

  stop(): void {
    this.stopSource();
    this.pausedAt = 0;
    this.state = 'idle';
    this.worker?.postMessage({ type: 'reset' });
  }

  private stopSource(): void {
    if (this.source) {
      try {
        this.source.stop();
        this.source.disconnect();
      } catch {
        // ignore
      }
      this.source = null;
    }
  }

  setVolume(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
  }

  getAnalysis(): AudioAnalysis | null {
    if (!this.analyser || !this.analyserLeft || !this.analyserRight) return null;

    this.analyser.getByteFrequencyData(this.spectrumBuffer);
    this.analyser.getFloatTimeDomainData(this.timeDomainBuffer);
    this.analyserLeft.getFloatTimeDomainData(this.timeDomainLeftBuffer);
    this.analyserRight.getFloatTimeDomainData(this.timeDomainRightBuffer);

    if (this.worker && this.state === 'playing') {
      const spectrumCopy = new Uint8Array(this.spectrumBuffer.slice(0, FFT_SIZE / 2));
      this.worker.postMessage({
        type: 'analyze',
        spectrum: spectrumCopy.buffer,
        timestamp: this.getCurrentTime() * 1000
      }, [spectrumCopy.buffer]);
    }

    return {
      spectrum: this.spectrumBuffer,
      timeDomain: this.timeDomainBuffer,
      timeDomainLeft: this.timeDomainLeftBuffer,
      timeDomainRight: this.timeDomainRightBuffer,
      bands: this.currentBands
    };
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    if (this.state === 'playing') {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pausedAt;
  }

  getDuration(): number {
    return this.duration;
  }

  getState(): AudioState {
    return this.state;
  }

  getSongName(): string {
    return this.songName;
  }

  setOnBeatCallback(callback: (beat: BeatEvent) => void): void {
    this.onBeatCallback = callback;
  }

  setOnBandsCallback(callback: (bands: FrequencyBand) => void): void {
    this.onBandsCallback = callback;
  }

  destroy(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
