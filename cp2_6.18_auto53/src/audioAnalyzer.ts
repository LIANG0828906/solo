export interface BeatNote {
  time: number;
  color: 'red' | 'blue';
  direction: 'up' | 'down' | 'left' | 'right';
  lane: number;
}

export interface SongInfo {
  id: string;
  name: string;
  duration: number;
  bpm: number;
  beats: BeatNote[];
}

const SONGS: SongInfo[] = [
  { id: 'neon-pulse', name: 'Neon Pulse', duration: 62, bpm: 120, beats: [] },
  { id: 'cyber-storm', name: 'Cyber Storm', duration: 58, bpm: 140, beats: [] },
  { id: 'quantum-beat', name: 'Quantum Beat', duration: 55, bpm: 160, beats: [] },
];

function generateBeats(bpm: number, duration: number): BeatNote[] {
  const beatInterval = 60 / bpm;
  const notes: BeatNote[] = [];
  const colors: Array<'red' | 'blue'> = ['red', 'blue'];
  const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
  let id = 0;

  for (let t = 2.0; t < duration - 3; t += beatInterval) {
    const swing = Math.sin(t * 0.5);
    if (swing > 0.3) {
      notes.push({
        time: t,
        color: colors[Math.floor(Math.random() * 2)],
        direction: directions[Math.floor(Math.random() * 4)],
        lane: Math.floor(Math.random() * 4) - 1.5,
      });
      id++;
    }
    if (swing > 0.7 && Math.random() > 0.5) {
      notes.push({
        time: t + beatInterval * 0.5,
        color: colors[Math.floor(Math.random() * 2)],
        direction: directions[Math.floor(Math.random() * 4)],
        lane: Math.floor(Math.random() * 4) - 1.5,
      });
      id++;
    }
    if (swing < -0.2 && Math.random() > 0.6) {
      notes.push({
        time: t + beatInterval * 0.25,
        color: colors[Math.floor(Math.random() * 2)],
        direction: directions[Math.floor(Math.random() * 4)],
        lane: Math.floor(Math.random() * 4) - 1.5,
      });
      id++;
    }
  }

  return notes;
}

SONGS.forEach(song => {
  song.beats = generateBeats(song.bpm, song.duration);
});

export function getSongs(): SongInfo[] {
  return SONGS;
}

export function getSongById(id: string): SongInfo | undefined {
  return SONGS.find(s => s.id === id);
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private scheduledNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private isPlaying = false;
  private startTime = 0;
  private frequencyData: Uint8Array = new Uint8Array(0);
  private songInfo: SongInfo | null = null;
  private nextNoteIndex = 0;

  async init(): Promise<void> {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 64;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  playSong(song: SongInfo): void {
    if (!this.audioContext || !this.masterGain) return;
    this.stop();

    this.songInfo = song;
    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime;
    this.nextNoteIndex = 0;

    this.scheduleMusic(song);
  }

  private scheduleMusic(song: SongInfo): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const baseFreqs = [130.81, 164.81, 196.0, 261.63, 329.63, 392.0];
    const beatInterval = 60 / song.bpm;
    const endBeat = Math.floor(song.duration / beatInterval);

    for (let i = 0; i < endBeat; i++) {
      const t = this.startTime + i * beatInterval;
      if (t > this.startTime + song.duration) break;

      const freqIndex = i % baseFreqs.length;
      const freq = baseFreqs[freqIndex];
      const pattern = Math.floor(i / 4) % 4;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = pattern < 2 ? 'sawtooth' : 'square';
      osc.frequency.value = freq * (1 + pattern * 0.5);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beatInterval * 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + beatInterval * 0.9);

      this.scheduledNodes.push({ osc, gain });
      this.oscillators.push(osc);

      if (i % 2 === 0) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.value = freq / 4;
        bassGain.gain.setValueAtTime(0.2, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + beatInterval * 0.6);
        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain!);
        bassOsc.start(t);
        bassOsc.stop(t + beatInterval * 0.7);
        this.scheduledNodes.push({ osc: bassOsc, gain: bassGain });
        this.oscillators.push(bassOsc);
      }

      if (i % 4 === 0) {
        const percOsc = ctx.createOscillator();
        const percGain = ctx.createGain();
        percOsc.type = 'triangle';
        percOsc.frequency.setValueAtTime(800, t);
        percOsc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
        percGain.gain.setValueAtTime(0.12, t);
        percGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        percOsc.connect(percGain);
        percGain.connect(this.masterGain!);
        percOsc.start(t);
        percOsc.stop(t + 0.1);
        this.scheduledNodes.push({ osc: percOsc, gain: percGain });
        this.oscillators.push(percOsc);
      }
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch (_e) { /* already stopped */ }
    });
    this.oscillators = [];
    this.scheduledNodes = [];
    this.nextNoteIndex = 0;
  }

  pause(): void {
    if (this.audioContext?.state === 'running') {
      this.audioContext.suspend();
    }
  }

  resume(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) return 0;
    return this.audioContext.currentTime - this.startTime;
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }
    return this.frequencyData;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  playHitSound(grade: 'perfect' | 'good' | 'miss'): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    if (grade === 'perfect') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (grade === 'good') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  playComboSound(): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 100;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  getUpcomingBeats(currentTime: number, windowSeconds: number): BeatNote[] {
    if (!this.songInfo) return [];
    const result: BeatNote[] = [];
    const end = currentTime + windowSeconds;
    for (let i = this.nextNoteIndex; i < this.songInfo.beats.length; i++) {
      const beat = this.songInfo.beats[i];
      if (beat.time >= currentTime && beat.time <= end) {
        result.push(beat);
      }
      if (beat.time > end) break;
      if (beat.time < currentTime) {
        this.nextNoteIndex = i + 1;
      }
    }
    return result;
  }
}
