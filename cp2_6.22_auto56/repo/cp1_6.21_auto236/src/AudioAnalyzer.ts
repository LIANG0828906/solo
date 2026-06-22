import type { BeatPhase } from './types';

export interface BeatEvent {
  time: number;
  phase: BeatPhase;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private beatEvents: BeatEvent[] = [];
  private playbackStartTime: number = 0;
  private pausedAt: number = 0;
  private isPlaying: boolean = false;
  private bpm: number = 120;
  private currentPhase: BeatPhase = 0;
  private onBeatCallback: ((phase: BeatPhase) => void) | null = null;
  private onProgressCallback: ((progress: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private animationFrameId: number | null = null;
  private frequencyData: Uint8Array = new Uint8Array(0);
  private lastBeatIndex: number = -1;

  constructor() {}

  async loadAudio(file: File): Promise<{ songName: string; duration: number; bpm: number }> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.audioBuffer = audioBuffer;

    this.bpm = this.analyzeBPM(audioBuffer);
    this.beatEvents = this.generateBeatEvents(this.bpm, audioBuffer.duration);

    if (this.analyser) {
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    return {
      songName: file.name.replace(/\.[^/.]+$/, ''),
      duration: audioBuffer.duration,
      bpm: this.bpm,
    };
  }

  startPlayback(): void {
    if (!this.audioContext || !this.audioBuffer) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stopPlayback();

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    };

    this.playbackStartTime = this.audioContext.currentTime;
    this.lastBeatIndex = -1;
    this.currentPhase = 0;
    this.pausedAt = 0;
    this.isPlaying = true;
    this.sourceNode.start(0);
    this.update();
  }

  pausePlayback(): void {
    if (!this.isPlaying || !this.audioContext || !this.sourceNode) return;

    this.pausedAt = this.audioContext.currentTime - this.playbackStartTime;
    this.isPlaying = false;

    try {
      this.sourceNode.stop();
    } catch (e) {}

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resumePlayback(): void {
    if (this.isPlaying || !this.audioContext || !this.audioBuffer) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    };

    const remaining = this.audioBuffer.duration - this.pausedAt;
    if (remaining <= 0) return;

    this.playbackStartTime = this.audioContext.currentTime - this.pausedAt;
    this.isPlaying = true;
    this.sourceNode.start(0, this.pausedAt);
    this.update();
  }

  stopPlayback(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {}
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    this.isPlaying = false;
    this.pausedAt = 0;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  getBeatEventsSince(lastTime: number): BeatEvent[] {
    const currentTime = this.getCurrentTime();
    return this.beatEvents.filter(
      (event) => event.time > lastTime && event.time <= currentTime
    );
  }

  getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) {
      return this.pausedAt;
    }
    return this.audioContext.currentTime - this.playbackStartTime;
  }

  getBPM(): number {
    return this.bpm;
  }

  getProgress(): number {
    if (!this.audioBuffer) return 0;
    return Math.min(1, Math.max(0, this.getCurrentTime() / this.audioBuffer.duration));
  }

  setOnBeat(callback: (phase: BeatPhase) => void): void {
    this.onBeatCallback = callback;
  }

  setOnProgress(callback: (progress: number) => void): void {
    this.onProgressCallback = callback;
  }

  setOnEnded(callback: () => void): void {
    this.onEndedCallback = callback;
  }

  destroy(): void {
    this.stopPlayback();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioBuffer = null;
    this.beatEvents = [];
    this.onBeatCallback = null;
    this.onProgressCallback = null;
    this.onEndedCallback = null;
    this.frequencyData = new Uint8Array(0);
  }

  private analyzeBPM(buffer: AudioBuffer): number {
    try {
      const channelData = buffer.getChannelData(0);
      const sampleRate = buffer.sampleRate;
      const windowSize = Math.floor(sampleRate * 0.05);
      const hopSize = Math.floor(windowSize / 2);

      const energies: number[] = [];
      const lowFreqRatio = 0.1;
      const lowFreqSamples = Math.floor(windowSize * lowFreqRatio);

      for (let i = 0; i + windowSize < channelData.length; i += hopSize) {
        let energy = 0;
        for (let j = 0; j < lowFreqSamples; j++) {
          const sample = channelData[i + j];
          energy += sample * sample;
        }
        energies.push(energy / lowFreqSamples);
      }

      if (energies.length < 2) return 120;

      const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
      const variance =
        energies.reduce((a, b) => a + (b - mean) * (b - mean), 0) / energies.length;
      const threshold = mean + Math.sqrt(variance) * 1.5;

      const peaks: number[] = [];
      for (let i = 1; i < energies.length - 1; i++) {
        if (
          energies[i] > threshold &&
          energies[i] > energies[i - 1] &&
          energies[i] > energies[i + 1]
        ) {
          peaks.push(i);
        }
      }

      if (peaks.length < 2) return 120;

      const intervals: number[] = [];
      for (let i = 1; i < peaks.length; i++) {
        const intervalSec = ((peaks[i] - peaks[i - 1]) * hopSize) / sampleRate;
        if (intervalSec > 0.2 && intervalSec < 2.0) {
          intervals.push(intervalSec);
        }
      }

      if (intervals.length === 0) return 120;

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60 / avgInterval);

      if (bpm >= 60 && bpm <= 200) {
        return bpm;
      }

      return 120;
    } catch (e) {
      return 120;
    }
  }

  private generateBeatEvents(bpm: number, duration: number): BeatEvent[] {
    const events: BeatEvent[] = [];
    const beatInterval = 60 / bpm;
    let beatIndex = 0;

    for (let time = 0; time <= duration; time += beatInterval) {
      events.push({
        time,
        phase: (beatIndex % 4) as BeatPhase,
      });
      beatIndex++;
    }

    return events;
  }

  private update(): void {
    if (!this.isPlaying) return;

    const currentTime = this.getCurrentTime();

    while (
      this.lastBeatIndex + 1 < this.beatEvents.length &&
      this.beatEvents[this.lastBeatIndex + 1].time <= currentTime
    ) {
      this.lastBeatIndex++;
      const event = this.beatEvents[this.lastBeatIndex];
      this.currentPhase = event.phase;
      if (this.onBeatCallback) {
        this.onBeatCallback(event.phase);
      }
    }

    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }

    if (this.onProgressCallback) {
      this.onProgressCallback(this.getProgress());
    }

    this.animationFrameId = requestAnimationFrame(() => this.update());
  }
}
