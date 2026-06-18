import type { Track, EffectSlot } from '../store/audioStore';

interface TrackAudioNodes {
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  preFaderGain: GainNode;
  postFaderGain: GainNode;
  analyser: AnalyserNode;
  effects: Map<string, AudioNode>;
  buffer: AudioBuffer | null;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackNodes: Map<string, TrackAudioNodes> = new Map();
  private buffers: Map<string, AudioBuffer> = new Map();
  private isPlaying = false;
  private animationFrameId: number | null = null;
  private onLevelUpdate: ((trackId: string, rms: number, peak: number) => void) | null = null;
  private startTime = 0;
  private loopDuration = 0;

  init(): AudioContext {
    if (this.audioContext) return this.audioContext;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.audioContext.destination);

    return this.audioContext;
  }

  getContext(): AudioContext | null {
    return this.audioContext;
  }

  setOnLevelUpdate(callback: (trackId: string, rms: number, peak: number) => void): void {
    this.onLevelUpdate = callback;
  }

  async loadAudioFile(file: File): Promise<{ bufferId: string; duration: number }> {
    if (!this.audioContext) {
      this.init();
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    const bufferId = `buffer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.buffers.set(bufferId, audioBuffer);

    return { bufferId, duration: audioBuffer.duration };
  }

  getBuffer(bufferId: string): AudioBuffer | undefined {
    return this.buffers.get(bufferId);
  }

  initTrack(trackId: string): void {
    if (!this.audioContext) {
      this.init();
    }

    if (this.trackNodes.has(trackId)) return;

    const preFaderGain = this.audioContext!.createGain();
    const postFaderGain = this.audioContext!.createGain();
    const gainNode = this.audioContext!.createGain();
    const analyser = this.audioContext!.createAnalyser();

    analyser.fftSize = 256;
    gainNode.gain.value = 0.75;

    preFaderGain.connect(gainNode);
    gainNode.connect(postFaderGain);
    postFaderGain.connect(analyser);
    analyser.connect(this.masterGain!);

    this.trackNodes.set(trackId, {
      source: null,
      gainNode,
      preFaderGain,
      postFaderGain,
      analyser,
      effects: new Map(),
      buffer: null
    });
  }

  setTrackBuffer(trackId: string, bufferId: string): void {
    const trackNodes = this.trackNodes.get(trackId);
    const buffer = this.buffers.get(bufferId);

    if (!trackNodes || !buffer) return;

    trackNodes.buffer = buffer;
  }

  setTrackVolume(trackId: string, volume: number): void {
    const trackNodes = this.trackNodes.get(trackId);
    if (!trackNodes) return;

    const normalizedVolume = volume / 100;
    trackNodes.gainNode.gain.setTargetAtTime(
      normalizedVolume,
      this.audioContext!.currentTime,
      0.01
    );
  }

  setTrackMuted(trackId: string, muted: boolean): void {
    const trackNodes = this.trackNodes.get(trackId);
    if (!trackNodes) return;

    const targetGain = muted ? 0 : 1;
    trackNodes.postFaderGain.gain.setTargetAtTime(
      targetGain,
      this.audioContext!.currentTime,
      0.01
    );
  }

  setGlobalVolume(volume: number): void {
    if (!this.masterGain) return;

    const normalizedVolume = volume / 100;
    this.masterGain.gain.setTargetAtTime(
      normalizedVolume,
      this.audioContext!.currentTime,
      0.01
    );
  }

  createEffectNode(type: string, params: Record<string, number | undefined>): AudioNode | null {
    if (!this.audioContext) return null;

    switch (type) {
      case 'lowcut': {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = params.cutoff || 200;
        return filter;
      }
      case 'reverb': {
        const convolver = this.audioContext.createConvolver();
        const wetDry = (params.wetDry || 30) / 100;
        const impulseBuffer = this.createImpulseResponse(2.5, wetDry);
        convolver.buffer = impulseBuffer;
        return convolver;
      }
      case 'delay': {
        const delay = this.audioContext.createDelay(5.0);
        delay.delayTime.value = 0.3;
        const feedbackGain = this.audioContext.createGain();
        feedbackGain.gain.value = (params.feedback || 30) / 100;
        (delay as any)._feedbackGain = feedbackGain;
        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
        return delay;
      }
      case 'compressor': {
        const compressor = this.audioContext.createDynamicsCompressor();
        compressor.threshold.value = params.threshold || -12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        return compressor;
      }
      default:
        return null;
    }
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext!.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.exp(-t * 3 * (1 + decay * 2));
        channelData[i] = (Math.random() * 2 - 1) * envelope * 0.5;
      }
    }

    return impulse;
  }

  updateEffectParam(trackId: string, slotId: string, type: string, param: string, value: number): void {
    const trackNodes = this.trackNodes.get(trackId);
    if (!trackNodes) return;

    const effectNode = trackNodes.effects.get(slotId);
    if (!effectNode) return;

    switch (type) {
      case 'lowcut':
        if (param === 'cutoff') {
          (effectNode as BiquadFilterNode).frequency.setTargetAtTime(
            value,
            this.audioContext!.currentTime,
            0.01
          );
        }
        break;
      case 'delay':
        if (param === 'feedback') {
          const feedbackGain = (effectNode as any)._feedbackGain;
          if (feedbackGain) {
            feedbackGain.gain.setTargetAtTime(
              value / 100,
              this.audioContext!.currentTime,
              0.01
            );
          }
        }
        break;
      case 'compressor':
        if (param === 'threshold') {
          (effectNode as DynamicsCompressorNode).threshold.setTargetAtTime(
            value,
            this.audioContext!.currentTime,
            0.01
          );
        }
        break;
      case 'reverb':
        break;
    }
  }

  rebuildEffectChain(trackId: string, effectSlots: EffectSlot[]): void {
    const trackNodes = this.trackNodes.get(trackId);
    if (!trackNodes || !this.audioContext) return;

    trackNodes.effects.forEach((node) => {
      try {
        node.disconnect();
      } catch (e) {
        // ignore
      }
    });
    trackNodes.effects.clear();

    try {
      trackNodes.preFaderGain.disconnect();
    } catch (e) {
      // ignore
    }

    const preEffects = effectSlots.filter((s) => s.position === 'pre' && s.enabled && s.type !== 'none');
    const postEffects = effectSlots.filter((s) => s.position === 'post' && s.enabled && s.type !== 'none');

    let currentNode: AudioNode = trackNodes.preFaderGain;

    for (const slot of preEffects) {
      const effectNode = this.createEffectNode(slot.type, slot.params);
      if (effectNode) {
        currentNode.connect(effectNode);
        trackNodes.effects.set(slot.id, effectNode);
        currentNode = effectNode;
      }
    }

    currentNode.connect(trackNodes.gainNode);

    try {
      trackNodes.postFaderGain.disconnect();
    } catch (e) {
      // ignore
    }

    let postCurrentNode: AudioNode = trackNodes.postFaderGain;

    for (const slot of postEffects) {
      const effectNode = this.createEffectNode(slot.type, slot.params);
      if (effectNode) {
        postCurrentNode.connect(effectNode);
        trackNodes.effects.set(slot.id, effectNode);
        postCurrentNode = effectNode;
      }
    }

    postCurrentNode.connect(trackNodes.analyser);
  }

  play(tracks: Track[]): void {
    if (!this.audioContext) {
      this.init();
    }

    if (this.audioContext!.state === 'suspended') {
      this.audioContext!.resume();
    }

    this.stop();
    this.isPlaying = true;

    const hasSolo = tracks.some((t) => t.solo && t.audioBufferId);
    const maxDuration = Math.max(...tracks.map((t) => t.clipEnd - t.clipStart), 1);
    this.loopDuration = maxDuration;
    this.startTime = this.audioContext!.currentTime;

    tracks.forEach((track) => {
      const trackNodes = this.trackNodes.get(track.id);
      if (!trackNodes || !track.audioBufferId || !trackNodes.buffer) return;
      if (track.muted) return;
      if (hasSolo && !track.solo) return;

      this.scheduleTrackLoop(track, trackNodes);
    });

    this.startLevelMonitoring();
  }

  private scheduleTrackLoop(track: Track, trackNodes: TrackAudioNodes): void {
    if (!this.audioContext || !this.isPlaying) return;
    if (!trackNodes.buffer) return;

    const clipDuration = track.clipEnd - track.clipStart;
    if (clipDuration < 0.1) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = trackNodes.buffer;
    source.loop = false;

    const now = this.audioContext.currentTime;
    const elapsed = (now - this.startTime) % this.loopDuration;
    const waitTime = Math.max(0, -elapsed);

    const offset = track.clipStart;
    const duration = clipDuration;

    source.connect(trackNodes.preFaderGain);

    const startTime = now + waitTime;
    source.start(startTime, offset, duration);

    trackNodes.source = source;

    source.onended = () => {
      if (this.isPlaying && trackNodes.source === source) {
        this.scheduleTrackLoop(track, trackNodes);
      }
    };
  }

  stop(): void {
    this.isPlaying = false;

    this.trackNodes.forEach((trackNodes) => {
      if (trackNodes.source) {
        try {
          trackNodes.source.stop();
        } catch (e) {
          // ignore
        }
        trackNodes.source = null;
      }
    });

    this.stopLevelMonitoring();
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private startLevelMonitoring(): void {
    if (this.animationFrameId !== null) return;

    const monitor = () => {
      if (!this.isPlaying) {
        this.animationFrameId = null;
        return;
      }

      this.trackNodes.forEach((trackNodes, trackId) => {
        const analyser = trackNodes.analyser;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);

        let sum = 0;
        let peak = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
          if (Math.abs(v) > peak) {
            peak = Math.abs(v);
          }
        }

        const rms = Math.sqrt(sum / dataArray.length);
        const normalizedRms = Math.min(rms * 1.5, 1);
        const normalizedPeak = Math.min(peak, 1);

        if (this.onLevelUpdate) {
          this.onLevelUpdate(trackId, normalizedRms, normalizedPeak);
        }
      });

      this.animationFrameId = requestAnimationFrame(monitor);
    };

    this.animationFrameId = requestAnimationFrame(monitor);
  }

  private stopLevelMonitoring(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  dispose(): void {
    this.stop();

    this.trackNodes.forEach((trackNodes) => {
      try {
        trackNodes.preFaderGain.disconnect();
        trackNodes.gainNode.disconnect();
        trackNodes.postFaderGain.disconnect();
        trackNodes.analyser.disconnect();
        trackNodes.effects.forEach((node) => node.disconnect());
      } catch (e) {
        // ignore
      }
    });

    this.trackNodes.clear();
    this.buffers.clear();

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch (e) {
        // ignore
      }
      this.masterGain = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const audioEngine = new AudioEngine();
