export interface Track {
  id: string;
  name: string;
  audioBufferId: string;
  startTime: number;
  duration: number;
  muted: boolean;
  soloed: boolean;
  volume: number;
  pan: number;
  reverb: number;
  delay: number;
  compression: number;
}

export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  bpm: number;
  loopEnabled: boolean;
  masterVolume: number;
  vuLevels: [number, number];
}

type EventCallbackMap = {
  onStateChange: (state: AudioEngineState) => void;
  onVUUpdate: (levels: [number, number]) => void;
  onPlaybackEnd: () => void;
};

interface TrackNodes {
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  pan: StereoPannerNode;
  reverbSend: GainNode;
  delaySend: GainNode;
  compressorSend: GainNode;
  analyser: AnalyserNode;
}

const MAX_TRACKS = 8;
const MAX_DURATION = 180;
const MIN_BPM = 60;
const MAX_BPM = 160;
const SAMPLE_RATE = 44100;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private tracks: Map<string, Track> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private trackNodes: Map<string, TrackNodes> = new Map();

  private masterGain: GainNode | null = null;
  private masterAnalyserL: AnalyserNode | null = null;
  private masterAnalyserR: AnalyserNode | null = null;
  private splitter: ChannelSplitterNode | null = null;

  private reverbBus: GainNode | null = null;
  private delayBus: GainNode | null = null;
  private compressorBus: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;

  private startTimestamp: number = 0;
  private pauseTimestamp: number = 0;
  private accumulatedTime: number = 0;
  private animationFrameId: number | null = null;
  private vuDataArrayL: Uint8Array | null = null;
  private vuDataArrayR: Uint8Array | null = null;

  private bpm: number = 120;
  private loopEnabled: boolean = false;
  private masterVolumeValue: number = 80;

  private callbacks: Partial<EventCallbackMap> = {};

  private generateId(): string {
    return Math.random().toString(36).slice(2, 11);
  }

  private emitStateChange(): void {
    const state = this.getState();
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(state);
    }
  }

  private emitVUUpdate(levels: [number, number]): void {
    if (this.callbacks.onVUUpdate) {
      this.callbacks.onVUUpdate(levels);
    }
  }

  private emitPlaybackEnd(): void {
    if (this.callbacks.onPlaybackEnd) {
      this.callbacks.onPlaybackEnd();
    }
  }

  private ensureContext(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      this.setupMasterChain();
      this.setupEffectBuses();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private setupMasterChain(): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.masterVolumeValue / 100;

    this.splitter = ctx.createChannelSplitter(2);
    this.masterAnalyserL = ctx.createAnalyser();
    this.masterAnalyserR = ctx.createAnalyser();
    this.masterAnalyserL.fftSize = 512;
    this.masterAnalyserR.fftSize = 512;
    this.vuDataArrayL = new Uint8Array(this.masterAnalyserL.fftSize);
    this.vuDataArrayR = new Uint8Array(this.masterAnalyserR.fftSize);

    this.masterGain.connect(this.splitter);
    this.splitter.connect(this.masterAnalyserL, 0);
    this.splitter.connect(this.masterAnalyserR, 1);
    this.masterGain.connect(ctx.destination);
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    const ctx = this.audioContext;
    const length = ctx.sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  private setupEffectBuses(): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;

    this.reverbBus = ctx.createGain();
    this.convolver = ctx.createConvolver();
    this.convolver.buffer = this.createImpulseResponse(2.5, 2.5);
    this.reverbBus.connect(this.convolver);
    this.convolver.connect(this.masterGain!);

    this.delayBus = ctx.createGain();
    this.delayNode = ctx.createDelay(5.0);
    this.delayNode.delayTime.value = 0.35;
    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.value = 0.4;
    this.delayBus.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.masterGain!);

    this.compressorBus = ctx.createGain();
    this.compressorNode = ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = -24;
    this.compressorNode.knee.value = 30;
    this.compressorNode.ratio.value = 4;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.25;
    this.compressorBus.connect(this.compressorNode);
    this.compressorNode.connect(this.masterGain!);
  }

  private createTrackNodes(track: Track): TrackNodes {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    const ctx = this.audioContext;

    const gain = ctx.createGain();
    gain.gain.value = track.muted ? 0 : track.volume / 100;

    const pan = ctx.createStereoPanner();
    pan.pan.value = track.pan;

    const reverbSend = ctx.createGain();
    reverbSend.gain.value = track.reverb / 100;

    const delaySend = ctx.createGain();
    delaySend.gain.value = track.delay / 100;

    const compressorSend = ctx.createGain();
    compressorSend.gain.value = track.compression / 100;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;

    gain.connect(pan);
    pan.connect(this.masterGain!);
    pan.connect(reverbSend);
    pan.connect(delaySend);
    pan.connect(compressorSend);
    reverbSend.connect(this.reverbBus!);
    delaySend.connect(this.delayBus!);
    compressorSend.connect(this.compressorBus!);

    return {
      source: null,
      gain,
      pan,
      reverbSend,
      delaySend,
      compressorSend,
      analyser,
    };
  }

  private hasAnySolo(): boolean {
    for (const track of this.tracks.values()) {
      if (track.soloed) return true;
    }
    return false;
  }

  private recalculateGains(): void {
    const anySolo = this.hasAnySolo();
    for (const [id, track] of this.tracks) {
      const nodes = this.trackNodes.get(id);
      if (!nodes) continue;
      let gainValue = 0;
      if (!track.muted) {
        if (anySolo) {
          if (track.soloed) gainValue = track.volume / 100;
        } else {
          gainValue = track.volume / 100;
        }
      }
      nodes.gain.gain.setTargetAtTime(gainValue, this.audioContext!.currentTime, 0.01);
    }
  }

  private getTotalDuration(): number {
    let max = 0;
    for (const track of this.tracks.values()) {
      const end = track.startTime + track.duration;
      if (end > max) max = end;
    }
    return max;
  }

  private startVULoop(): void {
    const tick = () => {
      this.updateVULevels();
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stopVULoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private calculateRMS(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / data.length);
  }

  private rmsToDB(rms: number): number {
    if (rms <= 0) return -Infinity;
    return 20 * Math.log10(rms);
  }

  private updateVULevels(): void {
    if (!this.masterAnalyserL || !this.masterAnalyserR || !this.vuDataArrayL || !this.vuDataArrayR) return;
    this.masterAnalyserL.getByteTimeDomainData(this.vuDataArrayL);
    this.masterAnalyserR.getByteTimeDomainData(this.vuDataArrayR);
    const rmsL = this.calculateRMS(this.vuDataArrayL);
    const rmsR = this.calculateRMS(this.vuDataArrayR);
    const dbL = this.rmsToDB(rmsL);
    const dbR = this.rmsToDB(rmsR);
    const levels: [number, number] = [dbL, dbR];
    this.emitVUUpdate(levels);
  }

  private schedulePlayback(): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;

    for (const [id, track] of this.tracks) {
      const buffer = this.audioBuffers.get(track.audioBufferId);
      if (!buffer) continue;
      const nodes = this.trackNodes.get(id);
      if (!nodes) continue;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = this.loopEnabled;
      source.connect(nodes.gain);
      nodes.source = source;

      const offset = Math.max(0, this.accumulatedTime - track.startTime);
      if (offset < track.duration || this.loopEnabled) {
        const startAt = ctx.currentTime;
        const actualOffset = this.loopEnabled ? offset % track.duration : offset;
        if (this.loopEnabled) {
          source.start(startAt, actualOffset);
        } else {
          source.start(startAt, actualOffset, track.duration - actualOffset);
        }
      }
    }

    const totalDuration = this.getTotalDuration();
    if (totalDuration > 0 && !this.loopEnabled) {
      const remaining = totalDuration - this.accumulatedTime;
      if (remaining > 0) {
        setTimeout(() => {
          if (this.getState().isPlaying) {
            this.pause();
            this.accumulatedTime = 0;
            this.pauseTimestamp = 0;
            this.emitPlaybackEnd();
            this.emitStateChange();
          }
        }, remaining * 1000);
      }
    }
  }

  private stopAllSources(): void {
    for (const nodes of this.trackNodes.values()) {
      if (nodes.source) {
        try {
          nodes.source.stop();
        } catch (_) {}
        nodes.source.disconnect();
        nodes.source = null;
      }
    }
  }

  async addTrackFromFile(file: File): Promise<Track> {
    if (this.tracks.size >= MAX_TRACKS) {
      throw new Error(`最多只能添加 ${MAX_TRACKS} 条轨道`);
    }
    this.ensureContext();

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer.slice(0));
    const duration = audioBuffer.duration;

    if (duration > MAX_DURATION) {
      throw new Error(`音频时长不能超过 ${MAX_DURATION} 秒（当前 ${duration.toFixed(1)} 秒）`);
    }

    const bufferId = this.generateId();
    this.audioBuffers.set(bufferId, audioBuffer);

    const track: Track = {
      id: this.generateId(),
      name: file.name.replace(/\.[^.]+$/, ''),
      audioBufferId: bufferId,
      startTime: 0,
      duration,
      muted: false,
      soloed: false,
      volume: 80,
      pan: 0,
      reverb: 0,
      delay: 0,
      compression: 0,
    };

    this.tracks.set(track.id, track);
    this.trackNodes.set(track.id, this.createTrackNodes(track));
    this.recalculateGains();
    this.emitStateChange();
    return track;
  }

  removeTrack(trackId: string): void {
    const nodes = this.trackNodes.get(trackId);
    if (nodes) {
      if (nodes.source) {
        try { nodes.source.stop(); } catch (_) {}
        nodes.source.disconnect();
      }
      nodes.gain.disconnect();
      nodes.pan.disconnect();
      nodes.reverbSend.disconnect();
      nodes.delaySend.disconnect();
      nodes.compressorSend.disconnect();
      nodes.analyser.disconnect();
    }
    const track = this.tracks.get(trackId);
    if (track) {
      this.audioBuffers.delete(track.audioBufferId);
    }
    this.tracks.delete(trackId);
    this.trackNodes.delete(trackId);
    this.recalculateGains();
    this.emitStateChange();
  }

  play(): void {
    this.ensureContext();
    if (!this.audioContext) return;
    if (this.getState().isPlaying) return;

    this.startTimestamp = this.audioContext.currentTime;
    this.schedulePlayback();
    this.startVULoop();
    this.emitStateChange();
  }

  pause(): void {
    if (!this.audioContext || !this.getState().isPlaying) return;
    this.pauseTimestamp = this.audioContext.currentTime;
    this.accumulatedTime += this.pauseTimestamp - this.startTimestamp;
    this.stopAllSources();
    this.stopVULoop();
    this.emitStateChange();
  }

  getCurrentTime(): number {
    if (!this.audioContext) return this.accumulatedTime;
    if (this.getState().isPlaying) {
      return this.accumulatedTime + (this.audioContext.currentTime - this.startTimestamp);
    }
    return this.accumulatedTime;
  }

  seek(time: number): void {
    const wasPlaying = this.getState().isPlaying;
    if (wasPlaying) {
      this.stopAllSources();
    }
    this.accumulatedTime = Math.max(0, time);
    this.pauseTimestamp = 0;
    if (wasPlaying && this.audioContext) {
      this.startTimestamp = this.audioContext.currentTime;
      this.schedulePlayback();
    }
    this.emitStateChange();
  }

  setVolume(trackId: string, volume: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    track.volume = Math.max(0, Math.min(100, volume));
    const nodes = this.trackNodes.get(trackId);
    if (nodes && this.audioContext) {
      this.recalculateGains();
    }
    this.emitStateChange();
  }

  setPan(trackId: string, pan: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    track.pan = Math.max(-1, Math.min(1, pan));
    const nodes = this.trackNodes.get(trackId);
    if (nodes && this.audioContext) {
      nodes.pan.pan.setTargetAtTime(track.pan, this.audioContext.currentTime, 0.01);
    }
    this.emitStateChange();
  }

  setReverb(trackId: string, reverb: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    track.reverb = Math.max(0, Math.min(100, reverb));
    const nodes = this.trackNodes.get(trackId);
    if (nodes && this.audioContext) {
      nodes.reverbSend.gain.setTargetAtTime(track.reverb / 100, this.audioContext.currentTime, 0.01);
    }
    this.emitStateChange();
  }

  setDelay(trackId: string, delay: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    track.delay = Math.max(0, Math.min(100, delay));
    const nodes = this.trackNodes.get(trackId);
    if (nodes && this.audioContext) {
      nodes.delaySend.gain.setTargetAtTime(track.delay / 100, this.audioContext.currentTime, 0.01);
    }
    this.emitStateChange();
  }

  setCompression(trackId: string, compression: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    track.compression = Math.max(0, Math.min(100, compression));
    const nodes = this.trackNodes.get(trackId);
    if (nodes && this.audioContext) {
      nodes.compressorSend.gain.setTargetAtTime(track.compression / 100, this.audioContext.currentTime, 0.01);
    }
    this.emitStateChange();
  }

  setTrackStartTime(trackId: string, startTime: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    track.startTime = Math.max(0, startTime);
    this.emitStateChange();
  }

  setBPM(bpm: number): void {
    this.bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
    this.emitStateChange();
  }

  toggleLoop(): void {
    this.loopEnabled = !this.loopEnabled;
    this.emitStateChange();
  }

  muteTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    track.muted = !track.muted;
    this.recalculateGains();
    this.emitStateChange();
  }

  soloTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    track.soloed = !track.soloed;
    this.recalculateGains();
    this.emitStateChange();
  }

  setMasterVolume(volume: number): void {
    this.masterVolumeValue = Math.max(0, Math.min(100, volume));
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(this.masterVolumeValue / 100, this.audioContext.currentTime, 0.01);
    }
    this.emitStateChange();
  }

  getTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  getState(): AudioEngineState {
    return {
      isPlaying: this.audioContext !== null && this.animationFrameId !== null,
      currentTime: this.getCurrentTime(),
      bpm: this.bpm,
      loopEnabled: this.loopEnabled,
      masterVolume: this.masterVolumeValue,
      vuLevels: [-Infinity, -Infinity],
    };
  }

  snapshotWaveform(trackId: string, pixelWidth: number): number[] {
    const track = this.tracks.get(trackId);
    if (!track) return [];
    const buffer = this.audioBuffers.get(track.audioBufferId);
    if (!buffer || pixelWidth <= 0) return [];

    const channelData = buffer.getChannelData(0);
    const samplesPerPixel = Math.max(1, Math.floor(channelData.length / pixelWidth));
    const peaks: number[] = new Array(pixelWidth);

    for (let i = 0; i < pixelWidth; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, channelData.length);
      let max = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) max = abs;
      }
      peaks[i] = max;
    }
    return peaks;
  }

  on<K extends keyof EventCallbackMap>(event: K, callback: EventCallbackMap[K]): void {
    this.callbacks[event] = callback as any;
  }

  off<K extends keyof EventCallbackMap>(event: K): void {
    delete this.callbacks[event];
  }

  async offlineRender(progressCallback?: (progress: number) => void): Promise<Blob> {
    const totalDuration = this.getTotalDuration();
    if (totalDuration <= 0) {
      throw new Error('没有可渲染的音频');
    }

    const numChunks = 20;
    const blockDuration = totalDuration / numChunks;
    const channels = 2;

    const renderedBuffers: AudioBuffer[] = [];

    progressCallback?.(0);

    for (let i = 0; i < numChunks; i++) {
      const chunkStartTime = i * blockDuration;
      const chunkLength = Math.ceil(blockDuration * SAMPLE_RATE);
      const offlineCtx = new OfflineAudioContext(channels, chunkLength, SAMPLE_RATE);

      const masterGain = offlineCtx.createGain();
      masterGain.gain.value = this.masterVolumeValue / 100;

      const reverbBus = offlineCtx.createGain();
      const convolver = offlineCtx.createConvolver();
      const impulseLen = SAMPLE_RATE * 2.5;
      const impulse = offlineCtx.createBuffer(2, impulseLen, SAMPLE_RATE);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let j = 0; j < impulseLen; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / impulseLen, 2.5);
        }
      }
      convolver.buffer = impulse;
      reverbBus.connect(convolver);
      convolver.connect(masterGain);

      const delayBus = offlineCtx.createGain();
      const delayNode = offlineCtx.createDelay(5.0);
      delayNode.delayTime.value = 0.35;
      const delayFeedback = offlineCtx.createGain();
      delayFeedback.gain.value = 0.4;
      delayBus.connect(delayNode);
      delayNode.connect(delayFeedback);
      delayFeedback.connect(delayNode);
      delayNode.connect(masterGain);

      const compressorBus = offlineCtx.createGain();
      const compressorNode = offlineCtx.createDynamicsCompressor();
      compressorNode.threshold.value = -24;
      compressorNode.knee.value = 30;
      compressorNode.ratio.value = 4;
      compressorNode.attack.value = 0.003;
      compressorNode.release.value = 0.25;
      compressorBus.connect(compressorNode);
      compressorNode.connect(masterGain);

      const anySolo = this.hasAnySolo();

      for (const track of this.tracks.values()) {
        const buffer = this.audioBuffers.get(track.audioBufferId);
        if (!buffer) continue;

        const trackStart = track.startTime;
        const trackEnd = track.startTime + track.duration;
        const chunkEnd = chunkStartTime + blockDuration;

        if (trackEnd <= chunkStartTime || trackStart >= chunkEnd) {
          continue;
        }

        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;

        const trackGain = offlineCtx.createGain();
        let gainValue = 0;
        if (!track.muted) {
          if (anySolo) {
            if (track.soloed) gainValue = track.volume / 100;
          } else {
            gainValue = track.volume / 100;
          }
        }
        trackGain.gain.value = gainValue;

        const pan = offlineCtx.createStereoPanner();
        pan.pan.value = track.pan;

        const reverbSend = offlineCtx.createGain();
        reverbSend.gain.value = track.reverb / 100;

        const delaySend = offlineCtx.createGain();
        delaySend.gain.value = track.delay / 100;

        const compressorSend = offlineCtx.createGain();
        compressorSend.gain.value = track.compression / 100;

        source.connect(trackGain);
        trackGain.connect(pan);
        pan.connect(masterGain);
        pan.connect(reverbSend);
        pan.connect(delaySend);
        pan.connect(compressorSend);
        reverbSend.connect(reverbBus);
        delaySend.connect(delayBus);
        compressorSend.connect(compressorBus);

        const offsetInTrack = Math.max(0, chunkStartTime - trackStart);
        const startInChunk = Math.max(0, trackStart - chunkStartTime);
        const playDuration = Math.min(trackEnd, chunkEnd) - Math.max(trackStart, chunkStartTime);

        source.start(startInChunk, offsetInTrack, playDuration);
      }

      masterGain.connect(offlineCtx.destination);

      const chunkBuffer = await offlineCtx.startRendering();
      renderedBuffers.push(chunkBuffer);

      progressCallback?.((i + 1) / numChunks);
    }

    const totalLength = renderedBuffers.reduce((sum, buf) => sum + buf.length, 0);
    const finalBuffer = new AudioBuffer({
      numberOfChannels: channels,
      length: totalLength,
      sampleRate: SAMPLE_RATE,
    });

    let offset = 0;
    for (const buf of renderedBuffers) {
      for (let ch = 0; ch < channels; ch++) {
        finalBuffer.copyToChannel(buf.getChannelData(ch), ch, offset);
      }
      offset += buf.length;
    }

    return this.encodeWAV(finalBuffer);
  }

  private encodeWAV(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const channelData: Float32Array[] = [];
    let totalSamples = 0;
    for (let i = 0; i < numChannels; i++) {
      const data = buffer.getChannelData(i);
      channelData.push(data);
      totalSamples = Math.max(totalSamples, data.length);
    }

    const dataSize = totalSamples * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channelData[ch][i] || 0));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  getAudioBuffer(trackId: string): AudioBuffer | undefined {
    const track = this.tracks.get(trackId);
    if (!track) return undefined;
    return this.audioBuffers.get(track.audioBufferId);
  }

  destroy(): void {
    this.stopVULoop();
    this.stopAllSources();
    for (const nodes of this.trackNodes.values()) {
      nodes.gain.disconnect();
      nodes.pan.disconnect();
      nodes.reverbSend.disconnect();
      nodes.delaySend.disconnect();
      nodes.compressorSend.disconnect();
      nodes.analyser.disconnect();
    }
    this.trackNodes.clear();
    this.tracks.clear();
    this.audioBuffers.clear();
    if (this.masterGain) this.masterGain.disconnect();
    if (this.splitter) this.splitter.disconnect();
    if (this.masterAnalyserL) this.masterAnalyserL.disconnect();
    if (this.masterAnalyserR) this.masterAnalyserR.disconnect();
    if (this.reverbBus) this.reverbBus.disconnect();
    if (this.delayBus) this.delayBus.disconnect();
    if (this.compressorBus) this.compressorBus.disconnect();
    if (this.convolver) this.convolver.disconnect();
    if (this.delayNode) this.delayNode.disconnect();
    if (this.delayFeedback) this.delayFeedback.disconnect();
    if (this.compressorNode) this.compressorNode.disconnect();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
