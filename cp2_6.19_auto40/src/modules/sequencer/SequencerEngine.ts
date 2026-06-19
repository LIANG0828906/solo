import { useSequencerStore } from '../../store/useSequencerStore';
import { Note, Track, TOTAL_BEATS, PITCH_MIN, PITCH_MAX } from '../../types';

export class SequencerEngine {
  private playInterval: number | null = null;
  private lastTime: number = 0;
  private scheduledNotes: Map<string, number> = new Map();

  constructor() {
    this.play = this.play.bind(this);
    this.stop = this.stop.bind(this);
    this.animationLoop = this.animationLoop.bind(this);
  }

  addNote(note: Omit<Note, 'id'>): void {
    useSequencerStore.getState().addNote(note);
  }

  removeNote(noteId: string): void {
    useSequencerStore.getState().removeNote(noteId);
  }

  moveNote(noteId: string, start: number, pitch: number, duration: number): void {
    const clampedStart = Math.max(0, Math.min(TOTAL_BEATS - duration, start));
    const clampedPitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
    const clampedDuration = Math.max(0.25, Math.min(TOTAL_BEATS - clampedStart, duration));
    useSequencerStore.getState().moveNote(noteId, clampedStart, clampedPitch, clampedDuration);
  }

  setTrackVolume(trackId: string, volume: number): void {
    useSequencerStore.getState().setTrackVolume(trackId, volume);
  }

  setTrackMuted(trackId: string, muted: boolean): void {
    useSequencerStore.getState().setTrackMuted(trackId, muted);
  }

  setTrackSolo(trackId: string, solo: boolean): void {
    useSequencerStore.getState().setTrackSolo(trackId, solo);
  }

  play(): void {
    const state = useSequencerStore.getState();
    if (state.isPlaying) return;

    useSequencerStore.getState().setIsPlaying(true);
    this.lastTime = performance.now();
    this.animationLoop();
  }

  stop(): void {
    useSequencerStore.getState().setIsPlaying(false);
    if (this.playInterval) {
      cancelAnimationFrame(this.playInterval);
      this.playInterval = null;
    }
    this.scheduledNotes.clear();
  }

  pause(): void {
    useSequencerStore.getState().setIsPlaying(false);
    if (this.playInterval) {
      cancelAnimationFrame(this.playInterval);
      this.playInterval = null;
    }
  }

  private animationLoop(): void {
    const state = useSequencerStore.getState();
    if (!state.isPlaying) return;

    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    const beatsPerSecond = state.bpm / 60;
    const newPosition = state.cursorPosition + delta * beatsPerSecond;

    if (newPosition >= TOTAL_BEATS) {
      useSequencerStore.getState().setCursorPosition(0);
      this.stop();
      return;
    }

    useSequencerStore.getState().setCursorPosition(newPosition);
    this.scheduleNotes(state.cursorPosition, newPosition);

    this.playInterval = requestAnimationFrame(this.animationLoop);
  }

  private scheduleNotes(from: number, to: number): void {
    const state = useSequencerStore.getState();
    const { notes, tracks } = state;
    const hasSolo = tracks.some((t) => t.solo);

    notes.forEach((note) => {
      const track = tracks.find((t) => t.id === note.trackId);
      if (!track) return;
      if (track.muted) return;
      if (hasSolo && !track.solo) return;

      if (note.start >= from && note.start < to) {
        if (!this.scheduledNotes.has(note.id)) {
          this.scheduledNotes.set(note.id, now());
          this.triggerNoteOn(note, track);
        }
      }

      const noteEnd = note.start + note.duration;
      if (noteEnd >= from && noteEnd < to) {
        if (this.scheduledNotes.has(note.id)) {
          this.scheduledNotes.delete(note.id);
          this.triggerNoteOff(note, track);
        }
      }
    });
  }

  private triggerNoteOn(note: Note, track: Track): void {
    console.log(`Note On: track=${track.name}, pitch=${note.pitch}, velocity=${note.velocity}`);
  }

  private triggerNoteOff(note: Note, track: Track): void {
    console.log(`Note Off: track=${track.name}, pitch=${note.pitch}`);
  }

  setBpm(bpm: number): void {
    useSequencerStore.getState().setBpm(bpm);
  }

  setCursorPosition(position: number): void {
    useSequencerStore.getState().setCursorPosition(Math.max(0, Math.min(TOTAL_BEATS, position)));
  }

  exportMIDI(): Blob {
    const state = useSequencerStore.getState();
    const { notes, tracks, bpm } = state;

    const midiData = this.buildMIDI(notes, tracks, bpm);
    return new Blob([midiData as unknown as ArrayBuffer], { type: 'audio/midi' });
  }

  private buildMIDI(notes: Note[], tracks: Track[], bpm: number): Uint8Array {
    const midiTracks: number[][] = [];
    const ticksPerBeat = 480;

    midiTracks.push(this.buildTempoTrack(bpm, ticksPerBeat));

    tracks.forEach((track) => {
      const trackNotes = notes.filter((n) => n.trackId === track.id);
      if (trackNotes.length > 0) {
        midiTracks.push(this.buildNoteTrack(trackNotes, ticksPerBeat, track.name));
      }
    });

    return this.buildMIDIFile(midiTracks, ticksPerBeat);
  }

  private buildTempoTrack(bpm: number, _ticksPerBeat: number): number[] {
    const track: number[] = [];
    const microsecondsPerBeat = Math.round(60000000 / bpm);

    track.push(0x00);
    track.push(0xff, 0x51, 0x03);
    track.push((microsecondsPerBeat >> 16) & 0xff);
    track.push((microsecondsPerBeat >> 8) & 0xff);
    track.push(microsecondsPerBeat & 0xff);

    track.push(0x00);
    track.push(0xff, 0x2f, 0x00);

    return track;
  }

  private buildNoteTrack(notes: Note[], ticksPerBeat: number, trackName: string): number[] {
    const track: number[] = [];
    const events: Array<{ time: number; data: number[] }> = [];

    const nameBytes = new TextEncoder().encode(trackName);
    events.push({
      time: 0,
      data: [0xff, 0x03, nameBytes.length, ...nameBytes],
    });

    events.push({
      time: 0,
      data: [0xc0, 0x00],
    });

    const sortedNotes = [...notes].sort((a, b) => a.start - b.start);

    sortedNotes.forEach((note) => {
      const startTime = Math.round(note.start * ticksPerBeat);
      const endTime = Math.round((note.start + note.duration) * ticksPerBeat);
      const velocity = Math.round(note.velocity * 127);

      events.push({
        time: startTime,
        data: [0x90, note.pitch, velocity],
      });

      events.push({
        time: endTime,
        data: [0x80, note.pitch, 0x00],
      });
    });

    events.sort((a, b) => a.time - b.time);

    let lastTime = 0;
    events.forEach((event) => {
      const delta = event.time - lastTime;
      track.push(...this.encodeVariableLength(delta));
      track.push(...event.data);
      lastTime = event.time;
    });

    track.push(0x00);
    track.push(0xff, 0x2f, 0x00);

    return track;
  }

  private encodeVariableLength(value: number): number[] {
    const bytes: number[] = [];
    let v = value;

    do {
      let byte = v & 0x7f;
      v >>= 7;
      if (v > 0) byte |= 0x80;
      bytes.push(byte);
    } while (v > 0);

    return bytes;
  }

  private buildMIDIFile(midiTracks: number[][], ticksPerBeat: number): Uint8Array {
    const chunks: number[] = [];

    chunks.push(...[0x4d, 0x54, 0x68, 0x64]);
    chunks.push(...[0x00, 0x00, 0x00, 0x06]);
    chunks.push(...[0x00, 0x01]);
    chunks.push(...[(midiTracks.length >> 8) & 0xff, midiTracks.length & 0xff]);
    chunks.push(...[(ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff]);

    midiTracks.forEach((track) => {
      chunks.push(...[0x4d, 0x54, 0x72, 0x6b]);
      const length = track.length;
      chunks.push(...[(length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff]);
      chunks.push(...track);
    });

    return new Uint8Array(chunks);
  }

  quantizeBeat(value: number, grid: number = 1): number {
    return Math.round(value / grid) * grid;
  }

  snapToGrid(value: number): number {
    return Math.round(value * 4) / 4;
  }

  getNotesAtBeat(beat: number, trackId?: string): Note[] {
    const state = useSequencerStore.getState();
    return state.notes.filter((n) => {
      const inTime = n.start <= beat && n.start + n.duration > beat;
      const inTrack = trackId ? n.trackId === trackId : true;
      return inTime && inTrack;
    });
  }

  getTracks(): Track[] {
    return useSequencerStore.getState().tracks;
  }

  getNotes(): Note[] {
    return useSequencerStore.getState().notes;
  }
}

function now(): number {
  return performance.now();
}

export const sequencerEngine = new SequencerEngine();
