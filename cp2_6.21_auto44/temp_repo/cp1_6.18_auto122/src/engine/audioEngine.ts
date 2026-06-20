import { Genre, BPM } from '@/data/genres';

interface TrackAudio {
  gainNode: GainNode;
  isPlaying: boolean;
  schedulerId: number | null;
  nextNoteTime: number;
  currentStep: number;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private tracks: Map<string, TrackAudio> = new Map();
  private lookahead = 25;
  private scheduleAheadTime = 0.1;

  init(): AudioContext {
    if (this.ctx) return this.ctx;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    return this.ctx;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }

  ensureResumed(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTrack(trackId: string, genre: Genre): void {
    if (!this.ctx || !this.masterGain) return;
    this.ensureResumed();

    this.stopTrack(trackId);

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = genre.volume / 100;
    gainNode.connect(this.masterGain);

    const trackAudio: TrackAudio = {
      gainNode,
      isPlaying: true,
      schedulerId: null,
      nextNoteTime: this.ctx.currentTime,
      currentStep: 0,
    };

    this.tracks.set(trackId, trackAudio);
    this.scheduleNotes(trackId, genre);
  }

  private scheduleNotes(trackId: string, genre: Genre): void {
    const trackAudio = this.tracks.get(trackId);
    if (!trackAudio || !trackAudio.isPlaying || !this.ctx) return;

    const secondsPerBeat = 60.0 / BPM;
    const secondsPerStep = secondsPerBeat / 8;

    while (
      trackAudio.nextNoteTime <
      this.ctx.currentTime + this.scheduleAheadTime
    ) {
      const beatIndex = Math.floor(trackAudio.currentStep / 8);
      const stepInBeat = trackAudio.currentStep % 8;

      if (
        beatIndex < genre.rhythmPattern.length &&
        stepInBeat < genre.rhythmPattern[beatIndex].length &&
        genre.rhythmPattern[beatIndex][stepInBeat]
      ) {
        this.playNote(
          trackAudio.gainNode,
          genre,
          trackAudio.nextNoteTime
        );
      }

      trackAudio.nextNoteTime += secondsPerStep;
      trackAudio.currentStep = (trackAudio.currentStep + 1) % 32;
    }

    trackAudio.schedulerId = window.setTimeout(() => {
      this.scheduleNotes(trackId, genre);
    }, this.lookahead);
  }

  private playNote(
    destination: GainNode,
    genre: Genre,
    startTime: number
  ): void {
    if (!this.ctx) return;
    const { soundConfig } = genre;
    const now = startTime;

    const fundamental = this.ctx.createOscillator();
    fundamental.type = soundConfig.oscillatorType;
    fundamental.frequency.value = soundConfig.baseFrequency;

    const noteGain = this.ctx.createGain();
    const { attack, decay, sustain, release } = soundConfig;
    const noteDuration = attack + decay + 0.15 + release;

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(0.3, now + attack);
    noteGain.gain.linearRampToValueAtTime(
      0.3 * sustain,
      now + attack + decay
    );
    noteGain.gain.setValueAtTime(0.3 * sustain, now + noteDuration - release);
    noteGain.gain.linearRampToValueAtTime(0.001, now + noteDuration);

    fundamental.connect(noteGain);

    const harmonicGains: OscillatorNode[] = [];
    soundConfig.harmonics.slice(1).forEach((amp, i) => {
      const harm = this.ctx!.createOscillator();
      harm.type = soundConfig.oscillatorType;
      harm.frequency.value = soundConfig.baseFrequency * (i + 2);
      const harmGain = this.ctx!.createGain();
      harmGain.gain.value = amp * 0.2;
      harm.connect(harmGain);
      harmGain.connect(noteGain);
      harmonicGains.push(harm);
    });

    noteGain.connect(destination);

    fundamental.start(now);
    fundamental.stop(now + noteDuration);
    harmonicGains.forEach((h) => {
      h.start(now);
      h.stop(now + noteDuration);
    });
  }

  stopTrack(trackId: string): void {
    const trackAudio = this.tracks.get(trackId);
    if (!trackAudio) return;
    trackAudio.isPlaying = false;
    if (trackAudio.schedulerId !== null) {
      clearTimeout(trackAudio.schedulerId);
      trackAudio.schedulerId = null;
    }
    try {
      trackAudio.gainNode.disconnect();
    } catch {}
    this.tracks.delete(trackId);
  }

  setTrackVolume(trackId: string, volume: number): void {
    const trackAudio = this.tracks.get(trackId);
    if (!trackAudio) return;
    trackAudio.gainNode.gain.value = volume / 100;
  }

  async exportWav(
    genres: Genre[],
    trackAssignments: { trackId: string; genre: Genre; volume: number }[]
  ): Promise<void> {
    const secondsPerBeat = 60.0 / BPM;
    const totalDuration = secondsPerBeat * 4 * 4;
    const sampleRate = 44100;
    const offCtx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);

    for (const assignment of trackAssignments) {
      const { genre, volume } = assignment;
      const gainNode = offCtx.createGain();
      gainNode.gain.value = volume / 100;
      gainNode.connect(offCtx.destination);

      const secondsPerStep = secondsPerBeat / 8;
      for (let step = 0; step < 32; step++) {
        const beatIndex = Math.floor(step / 8);
        const stepInBeat = step % 8;
        if (
          beatIndex < genre.rhythmPattern.length &&
          stepInBeat < genre.rhythmPattern[beatIndex].length &&
          genre.rhythmPattern[beatIndex][stepInBeat]
        ) {
          const startTime = step * secondsPerStep;
          this.renderOfflineNote(gainNode, genre, startTime, offCtx);
        }
      }
    }

    const buffer = await offCtx.startRendering();
    const wav = this.encodeWav(buffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'music-mix.wav';
    a.click();
    URL.revokeObjectURL(url);
  }

  private renderOfflineNote(
    destination: GainNode,
    genre: Genre,
    startTime: number,
    ctx: OfflineAudioContext
  ): void {
    const { soundConfig } = genre;
    const fundamental = ctx.createOscillator();
    fundamental.type = soundConfig.oscillatorType;
    fundamental.frequency.value = soundConfig.baseFrequency;

    const noteGain = ctx.createGain();
    const { attack, decay, sustain, release } = soundConfig;
    const noteDuration = attack + decay + 0.15 + release;
    const now = startTime;

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(0.3, now + attack);
    noteGain.gain.linearRampToValueAtTime(0.3 * sustain, now + attack + decay);
    noteGain.gain.setValueAtTime(0.3 * sustain, now + noteDuration - release);
    noteGain.gain.linearRampToValueAtTime(0.001, now + noteDuration);

    fundamental.connect(noteGain);
    noteGain.connect(destination);

    fundamental.start(now);
    fundamental.stop(now + noteDuration);
  }

  private encodeWav(buffer: AudioBuffer): ArrayBuffer {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const bytesPerSample = 2;
    const dataLength = length * numChannels * bytesPerSample;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    const channels: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      channels.push(buffer.getChannelData(ch));
    }

    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }

  destroy(): void {
    this.tracks.forEach((_, trackId) => this.stopTrack(trackId));
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.analyser = null;
  }
}

export const audioEngine = new AudioEngine();
