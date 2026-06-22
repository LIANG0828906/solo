export interface Track {
  id: string;
  name: string;
  duration: number;
  url: string;
}

export const builtInTracks: Track[] = [
  {
    id: 'track1',
    name: '霓虹脉冲',
    duration: 60,
    url: generateProceduralMusicURL(120, 'synthwave'),
  },
  {
    id: 'track2',
    name: '电子梦境',
    duration: 60,
    url: generateProceduralMusicURL(140, 'edm'),
  },
  {
    id: 'track3',
    name: '赛博奔跑',
    duration: 60,
    url: generateProceduralMusicURL(100, 'cyberpunk'),
  },
];

function generateProceduralMusicURL(bpm: number, style: string): string {
  const sampleRate = 44100;
  const duration = 60;
  const channels = 2;
  const totalSamples = sampleRate * duration;

  const buffer = new ArrayBuffer(44 + totalSamples * channels * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * channels * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, totalSamples * channels * 2, true);

  const beatInterval = 60 / bpm;
  const samplesPerBeat = sampleRate * beatInterval;

  let bassSeed = 0;
  let melodySeed = 0;
  let hihatSeed = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const beatPhase = (i % samplesPerBeat) / samplesPerBeat;
    const beat = Math.floor(i / samplesPerBeat);
    const bar = Math.floor(beat / 4);
    const barBeat = beat % 4;

    let left = 0;
    let right = 0;

    const kickEnv = beatPhase < 0.15 ? Math.exp(-beatPhase * 25) : 0;
    const kickFreq = 60 + 40 * Math.exp(-beatPhase * 30);
    const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.8;

    const snareActive = barBeat === 1 || barBeat === 3;
    const snarePhase = snareActive && beatPhase < 0.2 ? beatPhase / 0.2 : 1;
    const snareEnv = snareActive ? Math.exp(-snarePhase * 15) * (beatPhase < 0.2 ? 1 : 0) : 0;
    bassSeed = (bassSeed * 9301 + 49297) % 233280;
    const snareNoise = (bassSeed / 233280) * 2 - 1;
    const snare = snareNoise * snareEnv * 0.4;

    const hihatPhase = (i % (samplesPerBeat / 2)) / (samplesPerBeat / 2);
    const hihatEnv = Math.exp(-hihatPhase * 40) * (hihatPhase < 0.05 ? 1 : 0);
    hihatSeed = (hihatSeed * 9301 + 49297) % 233280;
    const hihatNoise = (hihatSeed / 233280) * 2 - 1;
    const hihat = hihatNoise * hihatEnv * 0.15;

    const bassNotes = style === 'synthwave'
      ? [55, 55, 73.42, 65.41, 55, 55, 82.41, 73.42]
      : style === 'edm'
      ? [65.41, 65.41, 82.41, 73.42, 65.41, 65.41, 98, 82.41]
      : [49, 49, 65.41, 55, 49, 49, 73.42, 65.41];
    const bassNote = bassNotes[bar % bassNotes.length];
    const bassWobble = 1 + Math.sin(2 * Math.PI * 4 * t) * 0.05;
    const bass = Math.sin(2 * Math.PI * bassNote * bassWobble * t) * 0.35;
    const bass2 = Math.sin(2 * Math.PI * bassNote * 2 * bassWobble * t) * 0.15;

    const melodyScale = style === 'synthwave'
      ? [261.63, 293.66, 329.63, 392, 440, 523.25]
      : style === 'edm'
      ? [293.66, 349.23, 440, 493.88, 587.33, 698.46]
      : [246.94, 293.66, 349.23, 415.3, 493.88, 587.33];

    melodySeed = (melodySeed * 9301 + 49297) % 233280;
    const noteIndex = Math.floor(((bar * 4 + barBeat) + melodySeed / 233280 * 3) % melodyScale.length);
    const melodyNote = melodyScale[noteIndex];
    const noteEnv = Math.exp(-beatPhase * 6);
    const melody = Math.sin(2 * Math.PI * melodyNote * t) * noteEnv * 0.2;
    const melody2 = Math.sin(2 * Math.PI * melodyNote * 2 * t) * noteEnv * 0.1;

    const padNote = bassNote * 4;
    const pad = Math.sin(2 * Math.PI * padNote * t) * 0.08 +
      Math.sin(2 * Math.PI * padNote * 1.5 * t) * 0.05;

    left = kick + snare + hihat + bass + bass2 + melody + melody2 + pad;
    right = kick + snare * 0.9 + hihat * 1.1 + bass * 0.95 + bass2 * 1.05 +
      melody * 0.9 + melody2 * 1.1 + pad;

    const clipIndex = (i % (samplesPerBeat * 16)) / (samplesPerBeat * 16);
    const fadeIn = t < 2 ? t / 2 : 1;
    const fadeOut = t > duration - 2 ? (duration - t) / 2 : 1;
    const envelope = fadeIn * fadeOut * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.5 * clipIndex));

    left = Math.max(-1, Math.min(1, left * envelope));
    right = Math.max(-1, Math.min(1, right * envelope));

    const offset = 44 + i * channels * 2;
    view.setInt16(offset, left * 32767, true);
    view.setInt16(offset + 2, right * 32767, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export class MusicLoader {
  private audioElement: HTMLAudioElement;
  private currentTrack: Track | null = null;
  private volume: number = 0.7;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.loop = true;
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.volume = this.volume;
  }

  getAudioElement(): HTMLAudioElement {
    return this.audioElement;
  }

  getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  getTracks(): Track[] {
    return builtInTracks;
  }

  async load(trackId: string): Promise<void> {
    const track = builtInTracks.find((t) => t.id === trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    this.currentTrack = track;
    this.audioElement.src = track.url;
    await this.audioElement.load();
  }

  async play(): Promise<void> {
    try {
      await this.audioElement.play();
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  pause(): void {
    this.audioElement.pause();
  }

  isPlaying(): boolean {
    return !this.audioElement.paused;
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    this.audioElement.volume = this.volume;
  }

  getVolume(): number {
    return this.volume;
  }

  getCurrentTime(): number {
    return this.audioElement.currentTime;
  }

  getDuration(): number {
    return this.audioElement.duration || this.currentTrack?.duration || 60;
  }

  dispose(): void {
    this.audioElement.pause();
    this.audioElement.src = '';
  }
}

export const musicLoader = new MusicLoader();
