export type FrequencyBandResult = {
  low: number;
  mid: number;
  high: number;
};

export const SAMPLE_RATE = 44100;
export const FFT_SIZE = 2048;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
export const ACCEPTED_EXTENSIONS = ['.mp3', '.wav'];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: '未选择文件' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '文件超过20MB限制' };
  }

  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasValidType = ACCEPTED_TYPES.includes(file.type) || file.type.startsWith('audio/');

  if (!hasValidExtension && !hasValidType) {
    return { valid: false, error: '仅支持mp3和wav格式' };
  }

  return { valid: true };
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateFrequencyBands(
  frequencyData: Float32Array,
  sampleRate: number,
): FrequencyBandResult {
  const bufferLength = frequencyData.length;
  const nyquist = sampleRate / 2;
  const binWidth = nyquist / bufferLength;

  let lowSum = 0;
  let midSum = 0;
  let highSum = 0;
  let lowCount = 0;
  let midCount = 0;
  let highCount = 0;

  for (let i = 0; i < bufferLength; i++) {
    const freq = i * binWidth;
    const value = frequencyData[i];

    if (freq <= 200) {
      lowSum += value;
      lowCount++;
    } else if (freq <= 2000) {
      midSum += value;
      midCount++;
    } else if (freq <= 20000) {
      highSum += value;
      highCount++;
    }
  }

  const normalize = (sum: number, count: number): number => {
    if (count === 0) return 0;
    const avg = sum / count;
    const normalized = Math.max(0, Math.min(1, (avg + 100) / 100));
    return normalized;
  };

  return {
    low: normalize(lowSum, lowCount),
    mid: normalize(midSum, midCount),
    high: normalize(highSum, highCount),
  };
}

export type BpmEstimateResult = {
  bpm: number;
  confidence: number;
};

export class BpmEstimator {
  private energyHistory: { time: number; energy: number }[] = [];
  private lastBpm: number = 120;
  private beatTimestamps: number[] = [];
  private lastBeatTime: number = 0;

  update(currentTime: number, lowFrequencyEnergy: number): number {
    this.energyHistory.push({ time: currentTime, energy: lowFrequencyEnergy });

    const windowSize = 400;
    if (this.energyHistory.length > windowSize) {
      this.energyHistory.shift();
    }

    if (this.energyHistory.length < 20) {
      return this.lastBpm;
    }

    const recentEnergies = this.energyHistory.slice(-20);
    const avgEnergy = recentEnergies.reduce((s, e) => s + e.energy, 0) / recentEnergies.length;
    const threshold = avgEnergy * 1.6;

    const recent = this.energyHistory[this.energyHistory.length - 1];
    if (recent.energy > threshold && currentTime - this.lastBeatTime > 0.3) {
      this.beatTimestamps.push(currentTime);
      this.lastBeatTime = currentTime;

      const maxHistory = 30;
      if (this.beatTimestamps.length > maxHistory) {
        this.beatTimestamps.shift();
      }

      if (this.beatTimestamps.length >= 4) {
        const intervals: number[] = [];
        for (let i = 1; i < this.beatTimestamps.length; i++) {
          intervals.push(this.beatTimestamps[i] - this.beatTimestamps[i - 1]);
        }

        const sortedIntervals = [...intervals].sort((a, b) => a - b);
        const midStart = Math.floor(sortedIntervals.length * 0.2);
        const midEnd = Math.ceil(sortedIntervals.length * 0.8);
        const coreIntervals = sortedIntervals.slice(midStart, midEnd);

        const avgInterval =
          coreIntervals.reduce((s, v) => s + v, 0) / coreIntervals.length;

        if (avgInterval > 0) {
          const rawBpm = 60 / avgInterval;
          const clampedBpm = Math.max(40, Math.min(220, rawBpm));
          this.lastBpm = this.lastBpm * 0.6 + clampedBpm * 0.4;
        }
      }
    }

    return Math.round(this.lastBpm);
  }

  reset(): void {
    this.energyHistory = [];
    this.beatTimestamps = [];
    this.lastBeatTime = 0;
    this.lastBpm = 120;
  }
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private frequencyBuffer: Float32Array | null = null;
  private animationId: number | null = null;
  private bpmEstimator: BpmEstimator = new BpmEstimator();

  onFrequencyUpdate?: (
    frequencies: Float32Array,
    bands: FrequencyBandResult,
    bpm: number,
  ) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;

  async init(audioElement: HTMLAudioElement): Promise<void> {
    this.audioElement = audioElement;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.75;
    }

    if (!this.gainNode) {
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.9;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }

    this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
    this.frequencyBuffer = new Float32Array(
      new ArrayBuffer(
        this.analyser.frequencyBinCount * Float32Array.BYTES_PER_ELEMENT,
      ),
    );

    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
  }

  startAnalysis(): void {
    this.stopAnalysis();
    this.bpmEstimator.reset();
    this.analyzeLoop();
  }

  private analyzeLoop = (): void => {
    if (!this.analyser || !this.frequencyBuffer || !this.audioElement) return;

    this.analyser.getFloatFrequencyData(
      this.frequencyBuffer as Float32Array<ArrayBuffer>,
    );

    const sampleRate = this.audioContext?.sampleRate || SAMPLE_RATE;
    const bands = calculateFrequencyBands(this.frequencyBuffer, sampleRate);
    const bpm = this.bpmEstimator.update(this.audioElement.currentTime, bands.low);

    this.onFrequencyUpdate?.(this.frequencyBuffer, bands, bpm);
    this.onTimeUpdate?.(this.audioElement.currentTime, this.audioElement.duration);

    this.animationId = requestAnimationFrame(this.analyzeLoop);
  };

  stopAnalysis(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  async applyNormalization(): Promise<void> {
    if (!this.audioElement || !this.gainNode) return;

    try {
      const duration = this.audioElement.duration;
      if (!isFinite(duration) || duration <= 0) return;

      this.gainNode.gain.value = 0.9;
    } catch {
      // ignore
    }
  }

  dispose(): void {
    this.stopAnalysis();
    this.bpmEstimator.reset();

    try {
      this.sourceNode?.disconnect();
      this.gainNode?.disconnect();
      this.analyser?.disconnect();
    } catch {
      // ignore
    }

    this.sourceNode = null;
    this.audioElement = null;
  }
}
