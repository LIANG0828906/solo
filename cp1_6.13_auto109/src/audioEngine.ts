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

const LOW_BAND_MAX = Math.floor(250 / FREQ_RESOLUTION);
const MID_BAND_MAX = Math.floor(2000 / FREQ_RESOLUTION);
const HIGH_BAND_MAX = Math.floor(20000 / FREQ_RESOLUTION);

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
      const HALF_FFT = ${FFT_SIZE / 2};
      const LOW_BAND_MAX = ${LOW_BAND_MAX};
      const MID_BAND_MAX = ${MID_BAND_MAX};
      const HIGH_BAND_MAX = ${Math.min(HIGH_BAND_MAX, FFT_SIZE / 2 - 1)};
      const LOG_COMPRESSION_GAMMA = 10;
      const THRESHOLD_WINDOW = 50;
      const THRESHOLD_DELTA = 1.5;
      const PEAK_WINDOW_SIZE = 5;
      const MIN_BEAT_INTERVAL_MS = 200;
      const ONSET_BUFFER_SIZE = 300;
      const FRAME_INTERVAL_MS = 16;
      const BPM_MIN = 60;
      const BPM_MAX = 300;

      let lastCompressedSpectrum = null;
      let fluxHistory = [];
      let beatTimes = [];
      let lastBeatTime = 0;
      let onsetStrengthBuffer = [];

      function compress(value) {
        return Math.log(1 + LOG_COMPRESSION_GAMMA * value);
      }

      function calculateBands(spectrum) {
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

      function computeSpectralFlux(spectrum) {
        const compressed = new Float32Array(HALF_FFT);
        for (let i = 0; i < HALF_FFT; i++) {
          compressed[i] = compress(spectrum[i] / 255);
        }

        if (!lastCompressedSpectrum) {
          lastCompressedSpectrum = compressed;
          return 0;
        }

        let flux = 0;
        for (let i = 0; i < HALF_FFT; i++) {
          const diff = compressed[i] - lastCompressedSpectrum[i];
          if (diff > 0) {
            const weight = 1 + (HALF_FFT - i) / HALF_FFT;
            flux += weight * diff * diff;
          }
        }

        lastCompressedSpectrum = compressed;
        return flux;
      }

      function adaptiveThreshold(flux) {
        fluxHistory.push(flux);
        if (fluxHistory.length > THRESHOLD_WINDOW) {
          fluxHistory.shift();
        }

        if (fluxHistory.length < 10) return false;

        const mean = fluxHistory.reduce((s, v) => s + v, 0) / fluxHistory.length;
        const variance = fluxHistory.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / fluxHistory.length;
        const stdDev = Math.sqrt(variance);

        return flux > mean + THRESHOLD_DELTA * stdDev;
      }

      function isLocalPeak() {
        const len = fluxHistory.length;
        if (len < 3) return false;

        const current = fluxHistory[len - 1];
        const start = Math.max(0, len - 1 - PEAK_WINDOW_SIZE);

        for (let i = start; i < len - 1; i++) {
          if (fluxHistory[i] >= current) return false;
        }
        return true;
      }

      function estimateBPM() {
        const len = onsetStrengthBuffer.length;
        if (len < 20) return 120;

        const minLagSamples = Math.floor(60000 / (BPM_MAX * FRAME_INTERVAL_MS));
        const maxLagSamples = Math.ceil(60000 / (BPM_MIN * FRAME_INTERVAL_MS));

        let bestLag = 0;
        let bestCorr = -Infinity;

        for (let lag = minLagSamples; lag <= Math.min(maxLagSamples, Math.floor(len / 2)); lag++) {
          let corr = 0;
          let count = 0;
          for (let i = 0; i < len - lag; i++) {
            corr += onsetStrengthBuffer[i] * onsetStrengthBuffer[i + lag];
            count++;
          }
          if (count > 0) corr /= count;

          if (corr > bestCorr) {
            bestCorr = corr;
            bestLag = lag;
          }
        }

        if (bestLag === 0) return 120;

        const beatPeriodMs = bestLag * FRAME_INTERVAL_MS;
        let bpm = Math.round(60000 / beatPeriodMs);
        bpm = Math.max(BPM_MIN, Math.min(BPM_MAX, bpm));

        return bpm;
      }

      function detectBeat(spectrum, timestamp) {
        const flux = computeSpectralFlux(spectrum);

        onsetStrengthBuffer.push(flux);
        if (onsetStrengthBuffer.length > ONSET_BUFFER_SIZE) {
          onsetStrengthBuffer.shift();
        }

        if (!adaptiveThreshold(flux)) return null;
        if (!isLocalPeak()) return null;
        if (timestamp - lastBeatTime < MIN_BEAT_INTERVAL_MS) return null;

        lastBeatTime = timestamp;
        beatTimes.push(timestamp);
        if (beatTimes.length > 30) beatTimes.shift();

        const bpm = estimateBPM();

        return {
          time: timestamp,
          strength: Math.min(1, flux / 50),
          bpm: bpm
        };
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
          lastCompressedSpectrum = null;
          fluxHistory = [];
          onsetStrengthBuffer = [];
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

    this.analyser.getByteFrequencyData(this.spectrumBuffer as Uint8Array<ArrayBuffer>);
    this.analyser.getFloatTimeDomainData(this.timeDomainBuffer as Float32Array<ArrayBuffer>);
    this.analyserLeft.getFloatTimeDomainData(this.timeDomainLeftBuffer as Float32Array<ArrayBuffer>);
    this.analyserRight.getFloatTimeDomainData(this.timeDomainRightBuffer as Float32Array<ArrayBuffer>);

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
