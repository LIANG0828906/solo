import {
  createAudioContext,
  getBandEnergy,
  detectBeat,
  applySmoothing,
  normalizeAmplitude,
  getMicrophoneStream,
  calculateRMS,
} from '@/utils/audio';
import { AUDIO_CONSTANTS } from '@/utils/constants';
import type { AudioFeatures, AudioSourceType } from '@/types';

type AnalysisCallback = (features: Partial<AudioFeatures>) => void;

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | MediaStreamAudioSourceNode | null =
    null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  private audioBuffer: AudioBuffer | null = null;

  private animationFrameId: number | null = null;
  private callback: AnalysisCallback | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private energyHistory: number[] = [];
  private smoothedBass = 0;
  private smoothedMid = 0;
  private smoothedTreble = 0;
  private smoothedAmplitude = 0;

  private frequencyData: Uint8Array;
  private timeDomainData: Uint8Array;
  private sampleRate = 44100;

  constructor() {
    this.frequencyData = new Uint8Array(AUDIO_CONSTANTS.FFT_SIZE / 2);
    this.timeDomainData = new Uint8Array(AUDIO_CONSTANTS.FFT_SIZE);
  }

  async init(): Promise<boolean> {
    this.audioContext = createAudioContext();
    if (!this.audioContext) {
      console.error('Failed to create AudioContext');
      return false;
    }

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = AUDIO_CONSTANTS.FFT_SIZE;
    this.analyser.smoothingTimeConstant =
      AUDIO_CONSTANTS.SMOOTHING_TIME_CONSTANT;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1;

    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.sampleRate = this.audioContext.sampleRate;

    return true;
  }

  async loadAudioFile(file: File): Promise<boolean> {
    if (!this.audioContext) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    if (!this.audioContext) return false;

    try {
      this.stop();
      this.cleanupSource();

      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      if (this.audioBuffer.duration > AUDIO_CONSTANTS.MAX_DURATION) {
        console.error(
          `Audio duration ${this.audioBuffer.duration}s exceeds maximum ${AUDIO_CONSTANTS.MAX_DURATION}s`
        );
        return false;
      }

      this.audioElement = new Audio();
      this.audioElement.src = URL.createObjectURL(file);
      this.audioElement.crossOrigin = 'anonymous';

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.mediaElementSource = this.audioContext.createMediaElementSource(
        this.audioElement
      );
      this.mediaElementSource.connect(this.analyser!);

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.callback && this.audioElement) {
          this.callback({
            currentTime: this.audioElement.currentTime,
            duration: this.audioElement.duration,
          });
        }
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        if (this.callback) {
          this.callback({ isPlaying: false });
        }
        this.stopAnalysis();
      });

      return true;
    } catch (e) {
      console.error('Failed to load audio file:', e);
      return false;
    }
  }

  async startMicrophone(): Promise<boolean> {
    if (!this.audioContext) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    if (!this.audioContext) return false;

    try {
      this.stop();
      this.cleanupSource();

      this.mediaStream = await getMicrophoneStream();
      if (!this.mediaStream) return false;

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(
        this.mediaStream
      );
      this.sourceNode.connect(this.analyser!);

      this.isPlaying = true;
      this.startTime = this.audioContext.currentTime;
      this.pauseTime = 0;

      if (this.callback) {
        this.callback({
          isPlaying: true,
          audioSourceType: 'microphone',
          duration: 0,
          currentTime: 0,
        });
      }

      this.startAnalysis();
      return true;
    } catch (e) {
      console.error('Failed to start microphone:', e);
      return false;
    }
  }

  async play(): Promise<boolean> {
    if (!this.audioContext || !this.audioElement) return false;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      await this.audioElement.play();
      this.isPlaying = true;

      if (this.callback) {
        this.callback({ isPlaying: true, audioSourceType: 'file' });
      }

      this.startAnalysis();
      return true;
    } catch (e) {
      console.error('Failed to play audio:', e);
      return false;
    }
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.pauseTime = this.audioElement.currentTime;
    }
    this.isPlaying = false;
    if (this.callback) {
      this.callback({ isPlaying: false });
    }
    this.stopAnalysis();
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.isPlaying = false;
    this.pauseTime = 0;
    this.energyHistory = [];
    this.smoothedBass = 0;
    this.smoothedMid = 0;
    this.smoothedTreble = 0;
    this.smoothedAmplitude = 0;

    if (this.callback) {
      this.callback({
        isPlaying: false,
        amplitude: 0,
        bass: 0,
        mid: 0,
        treble: 0,
        beatDetected: false,
        bpm: 0,
        currentTime: 0,
      });
    }
    this.stopAnalysis();
  }

  seek(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(
        0,
        Math.min(time, this.audioElement.duration)
      );
    }
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  setCallback(callback: AnalysisCallback): void {
    this.callback = callback;
  }

  getCurrentTime(): number {
    if (this.audioElement) {
      return this.audioElement.currentTime;
    }
    if (this.audioContext && this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pauseTime;
  }

  getDuration(): number {
    return this.audioElement?.duration || this.audioBuffer?.duration || 0;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private startAnalysis(): void {
    this.stopAnalysis();
    this.analyze();
  }

  private stopAnalysis(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private analyze = (): void => {
    if (!this.analyser || !this.isPlaying) return;

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    const bass = getBandEnergy(
      this.frequencyData,
      this.sampleRate,
      AUDIO_CONSTANTS.FFT_SIZE,
      AUDIO_CONSTANTS.BASS_RANGE[0],
      AUDIO_CONSTANTS.BASS_RANGE[1]
    );

    const mid = getBandEnergy(
      this.frequencyData,
      this.sampleRate,
      AUDIO_CONSTANTS.FFT_SIZE,
      AUDIO_CONSTANTS.MID_RANGE[0],
      AUDIO_CONSTANTS.MID_RANGE[1]
    );

    const treble = getBandEnergy(
      this.frequencyData,
      this.sampleRate,
      AUDIO_CONSTANTS.FFT_SIZE,
      AUDIO_CONSTANTS.TREBLE_RANGE[0],
      AUDIO_CONSTANTS.TREBLE_RANGE[1]
    );

    const amplitude = calculateRMS(this.timeDomainData);

    this.smoothedBass = applySmoothing(
      bass,
      this.smoothedBass,
      AUDIO_CONSTANTS.SMOOTHING_TIME_CONSTANT
    );
    this.smoothedMid = applySmoothing(
      mid,
      this.smoothedMid,
      AUDIO_CONSTANTS.SMOOTHING_TIME_CONSTANT
    );
    this.smoothedTreble = applySmoothing(
      treble,
      this.smoothedTreble,
      AUDIO_CONSTANTS.SMOOTHING_TIME_CONSTANT
    );
    this.smoothedAmplitude = applySmoothing(
      amplitude,
      this.smoothedAmplitude,
      AUDIO_CONSTANTS.SMOOTHING_TIME_CONSTANT
    );

    this.energyHistory.push(this.smoothedBass);
    if (this.energyHistory.length > AUDIO_CONSTANTS.BEAT_HISTORY_SIZE) {
      this.energyHistory.shift();
    }

    const { beatDetected, bpm } = detectBeat(
      this.smoothedBass,
      this.energyHistory
    );

    if (this.callback) {
      this.callback({
        amplitude: normalizeAmplitude(this.smoothedAmplitude * 255),
        bass: this.smoothedBass,
        mid: this.smoothedMid,
        treble: this.smoothedTreble,
        frequencyData: this.frequencyData.slice(),
        timeDomainData: this.timeDomainData.slice(),
        beatDetected,
        bpm,
      });
    }

    this.animationFrameId = requestAnimationFrame(this.analyze);
  };

  private cleanupSource(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaElementSource) {
      this.mediaElementSource.disconnect();
      this.mediaElementSource = null;
    }
    if (this.audioElement) {
      if (this.audioElement.src) {
        URL.revokeObjectURL(this.audioElement.src);
      }
      this.audioElement = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.audioBuffer = null;
  }

  destroy(): void {
    this.stop();
    this.stopAnalysis();
    this.cleanupSource();

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.callback = null;
    this.energyHistory = [];
  }
}

export const createAudioAnalyzer = (): AudioAnalyzer => {
  return new AudioAnalyzer();
};
