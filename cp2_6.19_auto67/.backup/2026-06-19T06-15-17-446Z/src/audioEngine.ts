export interface AudioRegion {
  startSec: number;
  endSec: number;
}

export type EffectType = 'volume' | 'echo' | 'lowpass';

export interface EffectParams {
  volume?: number;
  echoDelay?: number;
  lowpassFreq?: number;
}

export interface EffectResult {
  processingDelayMs: number;
}

type PlaybackEndCallback = () => void;
type ProgressCallback = (currentSec: number, totalSec: number) => void;

interface WindowWithWebkit {
  webkitAudioContext: typeof AudioContext;
}

export class AudioEngine {
  private _audioContext: AudioContext | null = null;
  private _decodedBuffer: AudioBuffer | null = null;
  private _analyser: AnalyserNode | null = null;
  private _sourceNode: AudioBufferSourceNode | null = null;
  private _masterGain: GainNode | null = null;
  private _isPlaying = false;
  private _selectedRegion: AudioRegion | null = null;
  private _playbackStartAt = 0;
  private _pauseOffset = 0;
  private _playbackEndCallback: PlaybackEndCallback | null = null;
  private _progressCallback: ProgressCallback | null = null;
  private _progressTimerId: number | null = null;
  private _originalBuffer: AudioBuffer | null = null;
  private _fileName = '';

  public get audioContext(): AudioContext | null {
    return this._audioContext;
  }

  public get decodedBuffer(): AudioBuffer | null {
    return this._decodedBuffer;
  }

  public get analyser(): AnalyserNode | null {
    return this._analyser;
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get selectedRegion(): AudioRegion | null {
    return this._selectedRegion;
  }

  public get fileName(): string {
    return this._fileName;
  }

  public get pauseOffset(): number {
    return this._pauseOffset;
  }

  constructor() {
    this._ensureContext();
  }

  private _ensureContext(): void {
    if (!this._audioContext) {
      const W = window as unknown as WindowWithWebkit;
      const Ctx = window.AudioContext || W.webkitAudioContext;
      this._audioContext = new Ctx();
      this._analyser = this._audioContext.createAnalyser();
      this._analyser.fftSize = 512;
      this._analyser.smoothingTimeConstant = 0.82;
      this._masterGain = this._audioContext.createGain();
      this._masterGain.gain.value = 1;
      this._masterGain.connect(this._analyser);
      this._analyser.connect(this._audioContext.destination);
    }
  }

  public async loadFile(file: File): Promise<void> {
    this._ensureContext();
    if (!this._audioContext) throw new Error('AudioContext 初始化失败');

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'];
    const validExts = ['.mp3', '.wav'];
    const lowerName = file.name.toLowerCase();
    const typeOk = validTypes.includes(file.type) || validExts.some((ext) => lowerName.endsWith(ext));
    if (!typeOk) {
      throw new Error('不支持的文件格式，请使用 MP3 或 WAV');
    }

    this._fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this._audioContext.decodeAudioData(arrayBuffer.slice(0));
    this._decodedBuffer = decoded;
    this._originalBuffer = this._cloneBuffer(decoded);
    this._selectedRegion = null;
  }

  private _cloneBuffer(buffer: AudioBuffer): AudioBuffer {
    if (!this._audioContext) throw new Error('AudioContext 不可用');
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const newBuffer = this._audioContext.createBuffer(numChannels, length, sampleRate);
    for (let c = 0; c < numChannels; c++) {
      newBuffer.copyToChannel(buffer.getChannelData(c).slice(), c);
    }
    return newBuffer;
  }

  public onProgress(callback: ProgressCallback | null): void {
    this._progressCallback = callback;
  }

  public onPlaybackEnd(callback: PlaybackEndCallback | null): void {
    this._playbackEndCallback = callback;
  }

  public play(): void {
    if (!this._audioContext || !this._decodedBuffer) return;
    if (this._audioContext.state === 'suspended') {
      void this._audioContext.resume();
    }
    if (this._isPlaying) return;

    const buffer = this._decodedBuffer;
    const totalDuration = buffer.duration;

    let startSec = this._pauseOffset;
    let endSec = totalDuration;

    if (this._selectedRegion) {
      if (this._pauseOffset === 0 || this._pauseOffset < this._selectedRegion.startSec || this._pauseOffset >= this._selectedRegion.endSec) {
        startSec = this._selectedRegion.startSec;
      }
      endSec = this._selectedRegion.endSec;
    }

    const duration = Math.max(0, endSec - startSec);
    if (duration <= 0) return;

    this._sourceNode = this._audioContext.createBufferSource();
    this._sourceNode.buffer = buffer;
    if (this._masterGain) {
      this._sourceNode.connect(this._masterGain);
    } else {
      this._sourceNode.connect(this._analyser!);
    }

    this._sourceNode.onended = () => {
      if (this._isPlaying) {
        this._isPlaying = false;
        this._pauseOffset = this._selectedRegion ? this._selectedRegion.startSec : 0;
        this._stopProgressTimer();
        if (this._progressCallback) {
          this._progressCallback(this._pauseOffset, totalDuration);
        }
        if (this._playbackEndCallback) this._playbackEndCallback();
      }
    };

    this._playbackStartAt = this._audioContext.currentTime - startSec;
    this._isPlaying = true;
    this._sourceNode.start(0, startSec, duration);
    this._startProgressTimer();
  }

  public pause(): void {
    if (!this._audioContext || !this._isPlaying) return;
    if (this._sourceNode) {
      try {
        this._sourceNode.stop();
        this._sourceNode.disconnect();
      } catch {
        // ignore
      }
      this._sourceNode = null;
    }
    const played = this._audioContext.currentTime - this._playbackStartAt;
    this._pauseOffset = Math.max(0, played);
    this._isPlaying = false;
    this._stopProgressTimer();
  }

  public stop(): void {
    if (this._sourceNode) {
      try {
        this._sourceNode.stop();
        this._sourceNode.disconnect();
      } catch {
        // ignore
      }
      this._sourceNode = null;
    }
    this._isPlaying = false;
    this._pauseOffset = this._selectedRegion ? this._selectedRegion.startSec : 0;
    this._stopProgressTimer();
    if (this._decodedBuffer && this._progressCallback) {
      this._progressCallback(this._pauseOffset, this._decodedBuffer.duration);
    }
  }

  private _startProgressTimer(): void {
    this._stopProgressTimer();
    const tick = () => {
      if (!this._isPlaying || !this._audioContext || !this._decodedBuffer) return;
      const current = this._audioContext.currentTime - this._playbackStartAt;
      const total = this._decodedBuffer.duration;
      if (this._progressCallback) this._progressCallback(current, total);
    };
    tick();
    this._progressTimerId = window.setInterval(tick, 33);
  }

  private _stopProgressTimer(): void {
    if (this._progressTimerId !== null) {
      clearInterval(this._progressTimerId);
      this._progressTimerId = null;
    }
  }

  public selectRegion(startSec: number, endSec: number): void {
    if (startSec > endSec) [startSec, endSec] = [endSec, startSec];
    startSec = Math.max(0, startSec);
    if (this._decodedBuffer) {
      endSec = Math.min(this._decodedBuffer.duration, endSec);
    }
    if (endSec - startSec < 0.01) {
      this.clearRegion();
      return;
    }
    this._selectedRegion = { startSec, endSec };
    if (!this._isPlaying) {
      this._pauseOffset = startSec;
    }
  }

  public clearRegion(): void {
    this._selectedRegion = null;
    if (!this._isPlaying) this._pauseOffset = 0;
  }

  public resetPauseOffset(offset: number): void {
    this._pauseOffset = offset;
  }

  public getDuration(): number {
    return this._decodedBuffer ? this._decodedBuffer.duration : 0;
  }

  public getSampleData(channel = 0): Float32Array {
    if (!this._decodedBuffer) return new Float32Array(0);
    const c = Math.min(Math.max(0, channel), this._decodedBuffer.numberOfChannels - 1);
    return this._decodedBuffer.getChannelData(c);
  }

  public async applyEffect(type: EffectType, params: EffectParams): Promise<EffectResult> {
    if (!this._audioContext || !this._originalBuffer) {
      throw new Error('无音频数据可处理');
    }

    const src = this._originalBuffer;
    const numChannels = src.numberOfChannels;
    const sampleRate = src.sampleRate;

    let currentBuffer = this._cloneBuffer(src);
    let processingDelayMs = 0;

    if (params.volume !== undefined && params.volume !== 1) {
      currentBuffer = this._applyVolume(currentBuffer, params.volume);
    }

    let needsOffline = false;
    let nodes: Array<'echo' | 'lowpass'> = [];
    if (params.echoDelay !== undefined && params.echoDelay > 0) {
      nodes.push('echo');
      needsOffline = true;
      processingDelayMs = params.echoDelay;
    }
    if (params.lowpassFreq !== undefined && params.lowpassFreq < 5000) {
      nodes.push('lowpass');
      needsOffline = true;
    }

    if (needsOffline) {
      const extraDelay = (params.echoDelay ?? 0) / 1000;
      const renderDuration = currentBuffer.duration + extraDelay + 0.1;
      const renderLength = Math.ceil(renderDuration * sampleRate);

      const offline = new OfflineAudioContext(numChannels, renderLength, sampleRate);
      const source = offline.createBufferSource();
      source.buffer = currentBuffer;

      let prevNode: AudioNode = source;

      if (nodes.includes('echo') && params.echoDelay !== undefined) {
        const delayTime = params.echoDelay / 1000;
        const feedback = 0.4;
        const wetLevel = 0.4;

        const dryGain = offline.createGain();
        dryGain.gain.value = 1;

        const delay = offline.createDelay(delayTime + 0.1);
        delay.delayTime.value = delayTime;

        const feedbackGain = offline.createGain();
        feedbackGain.gain.value = feedback;

        const wetGain = offline.createGain();
        wetGain.gain.value = wetLevel;

        const merger = offline.createGain();

        prevNode.connect(dryGain);
        dryGain.connect(merger);

        prevNode.connect(delay);
        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
        delay.connect(wetGain);
        wetGain.connect(merger);

        prevNode = merger;
      }

      if (nodes.includes('lowpass') && params.lowpassFreq !== undefined) {
        const filter = offline.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = params.lowpassFreq;
        filter.Q.value = 0.707;
        prevNode.connect(filter);
        prevNode = filter;
      }

      prevNode.connect(offline.destination);
      source.start();
      currentBuffer = await offline.startRendering();
    }

    const wasPlaying = this._isPlaying;
    const progress = this._getCurrentProgress();
    if (wasPlaying) this.stop();

    this._decodedBuffer = currentBuffer;
    const totalDur = currentBuffer.duration;
    if (this._selectedRegion) {
      this._selectedRegion.startSec = Math.min(this._selectedRegion.startSec, totalDur - 0.01);
      this._selectedRegion.endSec = Math.min(this._selectedRegion.endSec, totalDur);
      if (this._selectedRegion.endSec - this._selectedRegion.startSec < 0.02) {
        this._selectedRegion = null;
      }
    }

    this._pauseOffset = Math.min(progress * totalDur, totalDur);
    void type;

    return { processingDelayMs };
  }

  private _applyVolume(buffer: AudioBuffer, gain: number): AudioBuffer {
    if (!this._audioContext) throw new Error('AudioContext 不可用');
    const numChannels = buffer.numberOfChannels;
    const newBuffer = this._audioContext.createBuffer(
      numChannels,
      buffer.length,
      buffer.sampleRate
    );
    for (let c = 0; c < numChannels; c++) {
      const data = buffer.getChannelData(c);
      const out = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) {
        const v = data[i] * gain;
        out[i] = v > 1 ? 1 : v < -1 ? -1 : v;
      }
      newBuffer.copyToChannel(out, c);
    }
    return newBuffer;
  }

  private _getCurrentProgress(): number {
    const total = this.getDuration();
    if (total <= 0) return 0;
    if (this._isPlaying && this._audioContext) {
      const current = this._audioContext.currentTime - this._playbackStartAt;
      return Math.min(1, Math.max(0, current / total));
    }
    return Math.min(1, Math.max(0, this._pauseOffset / total));
  }

  public reset(): void {
    if (!this._originalBuffer) return;
    const wasPlaying = this._isPlaying;
    if (wasPlaying) this.stop();
    this._decodedBuffer = this._cloneBuffer(this._originalBuffer);
    this._selectedRegion = null;
    this._pauseOffset = 0;
  }
}
