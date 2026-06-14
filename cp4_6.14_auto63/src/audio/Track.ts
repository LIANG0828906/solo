import { v4 as uuidv4 } from 'uuid';
import { EffectSlot } from './EffectSlot.js';
import { EffectType, TrackState, ITrack, IEffectSlot, WAVEFORM_SAMPLES, WAVEFORM_REFRESH_INTERVAL, MAX_EFFECTS_PER_TRACK } from '@types/index';

export class Track implements ITrack {
  id: string;
  name: string;
  volume: number = 80;
  pan: number = 0;
  muted: boolean = false;
  solo: boolean = false;
  effects: IEffectSlot[] = [];
  buffer: AudioBuffer | null = null;
  waveformData: Float32Array | null = null;
  duration: number = 0;

  private audioContext: AudioContext;
  private gainNode: GainNode;
  private panNode: StereoPannerNode;
  private sourceNode: AudioBufferSourceNode | null = null;
  private preGain: GainNode;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private isPlaying: boolean = false;
  private isSoloMuted: boolean = false;
  private waveformRefreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(audioContext: AudioContext, name: string = '新轨道') {
    this.id = uuidv4();
    this.name = name;
    this.audioContext = audioContext;

    this.gainNode = this.audioContext.createGain();
    this.panNode = this.audioContext.createStereoPanner();
    this.preGain = this.audioContext.createGain();

    this.gainNode.gain.value = this.volume / 100;
    this.panNode.pan.value = this.pan / 100;
  }

  getState(): TrackState {
    return {
      id: this.id,
      name: this.name,
      volume: this.volume,
      pan: this.pan,
      muted: this.muted,
      solo: this.solo,
      effects: this.effects.map((e) => e.getState()),
      duration: this.duration,
      waveformData: this.waveformData,
    };
  }

  async importAudioFile(file: File | ArrayBuffer, fileName?: string): Promise<void> {
    let arrayBuffer: ArrayBuffer;

    if (file instanceof File) {
      this.name = fileName || file.name.replace(/\.[^/.]+$/, '');
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = file;
      if (fileName && (this.name === '新轨道' || this.name.startsWith('轨道'))) {
        this.name = fileName;
      }
    }

    this.buffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
    this.duration = this.buffer.duration;
    this.computeWaveform();
  }

  setBuffer(buffer: AudioBuffer, name?: string): void {
    this.buffer = buffer;
    this.duration = buffer.duration;
    if (name) this.name = name;
    this.computeWaveform();
  }

  private computeWaveform(): void {
    if (!this.buffer) return;

    const rawData = this.buffer.getChannelData(0);
    const samples = WAVEFORM_SAMPLES;
    const blockSize = Math.floor(rawData.length / samples);
    const waveform = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[start + j] || 0);
      }
      waveform[i] = sum / blockSize;
    }

    this.waveformData = waveform;
  }

  getWaveformData(): Float32Array | null {
    return this.waveformData;
  }

  startWaveformRefresh(): void {
    this.stopWaveformRefresh();
    this.computeWaveform();
    this.waveformRefreshTimer = setInterval(() => {
      if (this.buffer) {
        this.computeWaveform();
      }
    }, WAVEFORM_REFRESH_INTERVAL);
  }

  stopWaveformRefresh(): void {
    if (this.waveformRefreshTimer !== null) {
      clearInterval(this.waveformRefreshTimer);
      this.waveformRefreshTimer = null;
    }
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(100, value));
    this.updateGain();
  }

  setPan(value: number): void {
    this.pan = Math.max(-100, Math.min(100, value));
    this.panNode.pan.setTargetAtTime(this.pan / 100, this.audioContext.currentTime, 0.01);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.updateGain();
    return this.muted;
  }

  toggleSolo(): boolean {
    this.solo = !this.solo;
    return this.solo;
  }

  setSoloMuted(muted: boolean): void {
    this.isSoloMuted = muted;
    this.updateGain();
  }

  private updateGain(): void {
    const shouldMute = this.muted || this.isSoloMuted;
    const targetGain = shouldMute ? 0 : this.volume / 100;
    this.gainNode.gain.setTargetAtTime(targetGain, this.audioContext.currentTime, 0.01);
  }

  addEffect(type: EffectType, slotIndex: number): IEffectSlot | null {
    if (this.effects.length >= MAX_EFFECTS_PER_TRACK) return null;
    if (this.effects.some((e) => e.slotIndex === slotIndex)) return null;

    const effect = new EffectSlot(this.audioContext, type, slotIndex);
    this.effects.push(effect);
    this.effects.sort((a, b) => a.slotIndex - b.slotIndex);

    if (this.isPlaying) {
      this.reconnectEffectChain();
    }

    return effect;
  }

  removeEffect(effectId: string): boolean {
    const index = this.effects.findIndex((e) => e.id === effectId);
    if (index === -1) return false;

    const effect = this.effects[index];
    effect.disconnect();
    effect.destroy();
    this.effects.splice(index, 1);

    if (this.isPlaying) {
      this.reconnectEffectChain();
    }

    return true;
  }

  getEffect(effectId: string): IEffectSlot | undefined {
    return this.effects.find((e) => e.id === effectId);
  }

  private reconnectEffectChain(): void {
    if (!this.sourceNode) return;

    try { this.sourceNode.disconnect(); } catch (e) { /* ignore */ }
    try { this.preGain.disconnect(); } catch (e) { /* ignore */ }

    for (const effect of this.effects) {
      effect.disconnect();
    }

    if (this.effects.length === 0) {
      this.sourceNode.connect(this.gainNode);
    } else {
      let prevNode: AudioNode = this.sourceNode;
      prevNode.connect(this.preGain);
      prevNode = this.preGain;

      for (const effect of this.effects) {
        effect.createNodes(prevNode, this.gainNode);
        prevNode = this.gainNode;
      }
    }
  }

  play(offset: number = 0): void {
    if (!this.buffer) return;

    this.stop();

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.buffer;

    this.reconnectEffectChain();

    this.startTime = this.audioContext.currentTime - offset;
    this.pausedAt = 0;
    this.isPlaying = true;

    try {
      this.sourceNode.start(0, offset);
    } catch (e) {
      console.error('Error starting track:', e);
    }
  }

  pause(): void {
    if (!this.isPlaying || !this.sourceNode) return;

    this.pausedAt = this.getCurrentTime();
    this.isPlaying = false;

    try {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
    } catch (e) { /* ignore */ }

    this.sourceNode = null;
  }

  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) { /* ignore */ }
      this.sourceNode = null;
    }
    this.isPlaying = false;
    this.pausedAt = 0;
    this.startTime = 0;
  }

  seek(time: number): void {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.pausedAt = time;
    if (wasPlaying) {
      this.play(time);
    }
  }

  getCurrentTime(): number {
    if (!this.isPlaying) {
      return this.pausedAt;
    }
    return this.audioContext.currentTime - this.startTime;
  }

  getOutputNode(): AudioNode {
    return this.panNode;
  }

  connect(destination: AudioNode): void {
    this.gainNode.connect(this.panNode);
    this.panNode.connect(destination);
  }

  disconnect(): void {
    try {
      this.gainNode.disconnect();
      this.panNode.disconnect();
      this.preGain.disconnect();
    } catch (e) { /* ignore */ }
  }

  cutSelection(start: number, end: number): AudioBuffer | null {
    if (!this.buffer) return null;

    const sampleRate = this.buffer.sampleRate;
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);
    const length = endSample - startSample;

    if (length <= 0) return null;

    const newBuffer = this.audioContext.createBuffer(
      this.buffer.numberOfChannels,
      length,
      sampleRate,
    );

    for (let channel = 0; channel < this.buffer.numberOfChannels; channel++) {
      const sourceData = this.buffer.getChannelData(channel);
      const destData = newBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        destData[i] = sourceData[startSample + i] || 0;
      }
    }

    return newBuffer;
  }

  deleteSelection(start: number, end: number): void {
    if (!this.buffer) return;

    const sampleRate = this.buffer.sampleRate;
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);
    const deleteLength = endSample - startSample;
    const newLength = this.buffer.length - deleteLength;

    if (newLength <= 0) return;

    const newBuffer = this.audioContext.createBuffer(
      this.buffer.numberOfChannels,
      newLength,
      sampleRate,
    );

    for (let channel = 0; channel < this.buffer.numberOfChannels; channel++) {
      const sourceData = this.buffer.getChannelData(channel);
      const destData = newBuffer.getChannelData(channel);

      for (let i = 0; i < startSample; i++) {
        destData[i] = sourceData[i];
      }
      for (let i = endSample; i < this.buffer.length; i++) {
        destData[i - deleteLength] = sourceData[i];
      }
    }

    this.buffer = newBuffer;
    this.duration = newBuffer.duration;
    this.computeWaveform();

    if (this.isPlaying) {
      const currentTime = this.getCurrentTime();
      if (currentTime > start) {
        const newTime = Math.max(0, currentTime - (end - start));
        this.seek(newTime);
      }
    }
  }

  pasteBuffer(insertBuffer: AudioBuffer, insertTime: number): void {
    if (!this.buffer) {
      this.setBuffer(insertBuffer);
      return;
    }

    const sampleRate = this.buffer.sampleRate;
    const insertSample = Math.floor(insertTime * sampleRate);
    const insertLength = Math.floor(insertBuffer.duration * sampleRate);
    const newLength = this.buffer.length + insertLength;

    const newBuffer = this.audioContext.createBuffer(
      this.buffer.numberOfChannels,
      newLength,
      sampleRate,
    );

    const channels = Math.max(this.buffer.numberOfChannels, insertBuffer.numberOfChannels);

    for (let channel = 0; channel < channels; channel++) {
      const sourceData = this.buffer.getChannelData(Math.min(channel, this.buffer.numberOfChannels - 1));
      const insertData = insertBuffer.getChannelData(Math.min(channel, insertBuffer.numberOfChannels - 1));
      const destData = newBuffer.getChannelData(channel);

      for (let i = 0; i < insertSample; i++) {
        destData[i] = sourceData[i];
      }
      for (let i = 0; i < insertLength; i++) {
        destData[insertSample + i] = insertData[i] || 0;
      }
      for (let i = insertSample; i < this.buffer.length; i++) {
        destData[i + insertLength] = sourceData[i];
      }
    }

    this.buffer = newBuffer;
    this.duration = newBuffer.duration;
    this.computeWaveform();
  }

  destroy(): void {
    this.stop();
    this.stopWaveformRefresh();
    this.disconnect();
    for (const effect of this.effects) {
      effect.destroy();
    }
    this.effects = [];
    this.buffer = null;
    this.waveformData = null;
  }
}
