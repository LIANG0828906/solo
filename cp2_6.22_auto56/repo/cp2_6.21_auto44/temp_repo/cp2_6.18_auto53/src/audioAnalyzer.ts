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

const DIRECTIONS: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
const COLORS: Array<'red' | 'blue'> = ['red', 'blue'];

const SONG_PRESET_BEATS: Record<string, Array<{ t: number; lane: number; dir: 'up' | 'down' | 'left' | 'right'; color: 'red' | 'blue' }>> = {};

function buildNeonPulse(): Array<{ t: number; lane: number; dir: 'up' | 'down' | 'left' | 'right'; color: 'red' | 'blue' }> {
  const arr: Array<{ t: number; lane: number; dir: 'up' | 'down' | 'left' | 'right'; color: 'red' | 'blue' }> = [];
  const bpm = 120;
  const bi = 60 / bpm;
  let idx = 0;
  for (let bar = 0; bar < 120; bar++) {
    const baseT = 2.0 + bar * bi * 4;
    const laneSeq = [-1.5, -0.5, 0.5, 1.5, -0.5, 1.5, -1.5, 0.5];
    const dirSeq = ['up', 'right', 'down', 'left', 'up', 'left', 'down', 'right'];
    const colorSeq = ['red', 'blue', 'red', 'blue', 'blue', 'red', 'blue', 'red'];
    for (let step = 0; step < 8; step++) {
      arr.push({
        t: baseT + step * bi * 0.5,
        lane: laneSeq[step],
        dir: (dirSeq[step] as any),
        color: (colorSeq[step] as any),
      });
      idx++;
    }
  }
  return arr;
}

function buildCyberStorm(): Array<{ t: number; lane: number; dir: 'up' | 'down' | 'left' | 'right'; color: 'red' | 'blue' }> {
  const arr: Array<{ t: number; lane: number; dir: 'up' | 'down' | 'left' | 'right'; color: 'red' | 'blue' }> = [];
  const bpm = 140;
  const bi = 60 / bpm;
  for (let bar = 0; bar < 135; bar++) {
    const baseT = 2.0 + bar * bi * 4;
    for (let step = 0; step < 16; step++) {
      const beatType = step % 4;
      const t = baseT + step * bi * 0.25;
      const lane = (step % 4 === 0 ? -1.5 : step % 4 === 1 ? -0.5 : step % 4 === 2 ? 0.5 : 1.5);
      const dir = beatType === 0 ? 'up' : beatType === 1 ? 'right' : beatType === 2 ? 'down' : 'left';
      const color = step % 2 === 0 ? 'red' : 'blue';
      arr.push({ t, lane, dir: (dir as any), color: (color as any) });
    }
  }
  return arr;
}

function buildQuantumBeat(): Array<{ t: number; lane: number; dir: 'up' | 'down' | 'left' | 'right'; color: 'red' | 'blue' }> {
  const arr: Array<{ t: number; lane: number; dir: 'up' | 'down' | 'left' | 'right'; color: 'red' | 'blue' }> = [];
  const bpm = 160;
  const bi = 60 / bpm;
  for (let bar = 0; bar < 140; bar++) {
    const baseT = 2.0 + bar * bi * 4;
    for (let step = 0; step < 16; step++) {
      const t = baseT + step * bi * 0.25;
      if (step % 2 === 0 || (bar % 2 === 1 && step % 1 === 0)) {
        const laneIdx = (bar * 4 + step) % 4;
        const lane = -1.5 + laneIdx;
        const dirs: any[] = ['up', 'down', 'left', 'right', 'up', 'left', 'down', 'right'];
        const dir = dirs[(bar * 16 + step) % 8];
        const color = (bar + step) % 2 === 0 ? 'blue' : 'red';
        arr.push({ t, lane, dir, color });
      }
    }
  }
  return arr;
}

SONG_PRESET_BEATS['neon-pulse'] = buildNeonPulse();
SONG_PRESET_BEATS['cyber-storm'] = buildCyberStorm();
SONG_PRESET_BEATS['quantum-beat'] = buildQuantumBeat();

function generateBeatsFromPresets(songId: string): BeatNote[] {
  const preset = SONG_PRESET_BEATS[songId] || [];
  return preset.map(p => ({
    time: p.t,
    color: p.color,
    direction: p.dir,
    lane: p.lane,
  }));
}

const SONGS: SongInfo[] = [
  { id: 'neon-pulse', name: 'Neon Pulse', duration: 62, bpm: 120, beats: [] },
  { id: 'cyber-storm', name: 'Cyber Storm', duration: 58, bpm: 140, beats: [] },
  { id: 'quantum-beat', name: 'Quantum Beat', duration: 55, bpm: 160, beats: [] },
];

SONGS.forEach(song => {
  song.beats = generateBeatsFromPresets(song.id);
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
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private scheduledNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private isPlaying = false;
  private startTime = 0;
  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));
  private beatHistory: number[] = [];
  private lastBeatTime = -1;
  private beatCallbacks: Array<() => void> = [];
  private songInfo: SongInfo | null = null;
  private nextNoteIndex = 0;
  private energyHistory: number[] = [];
  private spectrumSnapshots: Array<number[]> = [];

  async init(): Promise<void> {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.7;
    this.frequencyData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

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
    this.lastBeatTime = -1;
    this.beatHistory = [];
    this.energyHistory = [];
    this.spectrumSnapshots = [];

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

      gain.gain.setValueAtTime(0.0, t - 0.001);
      gain.gain.linearRampToValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beatInterval * 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t - 0.001);
      osc.stop(t + beatInterval * 0.9);

      this.scheduledNodes.push({ osc, gain });
      this.oscillators.push(osc);

      if (i % 2 === 0) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.value = freq / 4;
        bassGain.gain.setValueAtTime(0.0, t - 0.001);
        bassGain.gain.linearRampToValueAtTime(0.25, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + beatInterval * 0.6);
        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start(t - 0.001);
        bassOsc.stop(t + beatInterval * 0.7);
        this.scheduledNodes.push({ osc: bassOsc, gain: bassGain });
        this.oscillators.push(bassOsc);
      }

      if (i % 4 === 0) {
        const percOsc = ctx.createOscillator();
        const percGain = ctx.createGain();
        percOsc.type = 'triangle';
        percOsc.frequency.setValueAtTime(1200, t);
        percOsc.frequency.exponentialRampToValueAtTime(80, t + 0.05);
        percGain.gain.setValueAtTime(0.0, t - 0.001);
        percGain.gain.linearRampToValueAtTime(0.15, t);
        percGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        percOsc.connect(percGain);
        percGain.connect(this.masterGain);
        percOsc.start(t - 0.001);
        percOsc.stop(t + 0.1);
        this.scheduledNodes.push({ osc: percOsc, gain: percGain });
        this.oscillators.push(percOsc);
      }

      if (i % 8 === 0) {
        const hiOsc = ctx.createOscillator();
        const hiGain = ctx.createGain();
        hiOsc.type = 'square';
        hiOsc.frequency.setValueAtTime(freq * 4, t);
        hiGain.gain.setValueAtTime(0.0, t - 0.001);
        hiGain.gain.linearRampToValueAtTime(0.08, t);
        hiGain.gain.exponentialRampToValueAtTime(0.001, t + beatInterval * 0.4);
        hiOsc.connect(hiGain);
        hiGain.connect(this.masterGain);
        hiOsc.start(t - 0.001);
        hiOsc.stop(t + beatInterval * 0.5);
        this.scheduledNodes.push({ osc: hiOsc, gain: hiGain });
        this.oscillators.push(hiOsc);
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

  detectBeat(): boolean {
    if (!this.analyser) return false;

    this.analyser.getByteFrequencyData(this.frequencyData);

    const lowEnd = Math.floor(this.frequencyData.length * 0.1);
    let bassEnergy = 0;
    for (let i = 0; i < lowEnd; i++) {
      bassEnergy += this.frequencyData[i];
    }
    bassEnergy = bassEnergy / lowEnd / 255;

    this.energyHistory.push(bassEnergy);
    if (this.energyHistory.length > 43) {
      this.energyHistory.shift();
    }

    if (this.energyHistory.length < 43) return false;

    const avg = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const variance = this.energyHistory.reduce((a, b) => a + (b - avg) * (b - avg), 0) / this.energyHistory.length;
    const stdDev = Math.sqrt(variance);
    const threshold = avg + stdDev * 1.2 + 0.08;

    const currentTime = this.getCurrentTime();
    if (bassEnergy > threshold && currentTime - this.lastBeatTime > 0.25) {
      this.lastBeatTime = currentTime;
      this.beatHistory.push(currentTime);
      if (this.beatHistory.length > 50) this.beatHistory.shift();
      this.beatCallbacks.forEach(cb => cb());
      return true;
    }
    return false;
  }

  getBPM(): number {
    if (this.songInfo) return this.songInfo.bpm;
    if (this.beatHistory.length < 4) return 120;
    let total = 0;
    for (let i = 1; i < this.beatHistory.length; i++) {
      total += this.beatHistory[i] - this.beatHistory[i - 1];
    }
    const avgInterval = total / (this.beatHistory.length - 1);
    return 60 / avgInterval;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  playHitSound(grade: 'perfect' | 'good' | 'miss'): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    if (grade === 'perfect') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 880;
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 1320;
      gain2.gain.setValueAtTime(0.1, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.15);
    } else if (grade === 'good') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  playComboSound(): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  registerBeatCallback(cb: () => void): void {
    this.beatCallbacks.push(cb);
  }

  getUpcomingBeats(currentTime: number, windowSeconds: number): BeatNote[] {
    if (!this.songInfo) return [];
    const result: BeatNote[] = [];
    const end = currentTime + windowSeconds;

    while (this.nextNoteIndex < this.songInfo.beats.length
      && this.songInfo.beats[this.nextNoteIndex].time < currentTime) {
      this.nextNoteIndex++;
    }

    for (let i = this.nextNoteIndex; i < this.songInfo.beats.length; i++) {
      const beat = this.songInfo.beats[i];
      if (beat.time > end) break;
      if (beat.time >= currentTime) {
        result.push(beat);
      }
    }
    return result;
  }
}
