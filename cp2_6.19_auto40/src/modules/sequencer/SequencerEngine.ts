import { useSequencerStore } from '../../store/useSequencerStore';
import { Note, Track, TOTAL_BEATS, PITCH_MIN, PITCH_MAX } from '../../types';

export type NoteEventHandler = (note: Note, track: Track) => void;

export class SequencerEngine {
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private activeNotes: Map<string, number> = new Map();
  private onNoteOn: NoteEventHandler | null = null;
  private onNoteOff: NoteEventHandler | null = null;
  private onTick: ((beat: number) => void) | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.play = this.play.bind(this);
    this.stop = this.stop.bind(this);
    this.pause = this.pause.bind(this);
    this.animationLoop = this.animationLoop.bind(this);
  }

  setNoteOnHandler(handler: NoteEventHandler | null): void {
    this.onNoteOn = handler;
  }

  setNoteOffHandler(handler: NoteEventHandler | null): void {
    this.onNoteOff = handler;
  }

  setTickHandler(handler: ((beat: number) => void) | null): void {
    this.onTick = handler;
  }

  addNote(note: Omit<Note, 'id'>): void {
    useSequencerStore.getState().addNote(note);
  }

  removeNote(noteId: string): void {
    if (this.activeNotes.has(noteId)) {
      const state = useSequencerStore.getState();
      const note = state.notes.find((n) => n.id === noteId);
      const track = state.tracks.find((t) => t.id === note?.trackId);
      if (note && track && this.onNoteOff) {
        this.onNoteOff(note, track);
      }
      this.activeNotes.delete(noteId);
    }
    useSequencerStore.getState().removeNote(noteId);
  }

  moveNote(noteId: string, start: number, pitch: number, duration: number): void {
    const clampedStart = Math.max(0, Math.min(TOTAL_BEATS - duration, start));
    const clampedPitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
    const clampedDuration = Math.max(0.25, Math.min(TOTAL_BEATS - clampedStart, duration));

    if (this.activeNotes.has(noteId)) {
      const state = useSequencerStore.getState();
      const note = state.notes.find((n) => n.id === noteId);
      const track = state.tracks.find((t) => t.id === note?.trackId);
      if (note && track && this.onNoteOff) {
        this.onNoteOff(note, track);
      }
      this.activeNotes.delete(noteId);
    }

    useSequencerStore.getState().moveNote(noteId, clampedStart, clampedPitch, clampedDuration);
  }

  setTrackVolume(trackId: string, volume: number): void {
    useSequencerStore.getState().setTrackVolume(trackId, volume);
  }

  setTrackMuted(trackId: string, muted: boolean): void {
    const state = useSequencerStore.getState();
    const wasMuted = state.tracks.find((t) => t.id === trackId)?.muted;

    useSequencerStore.getState().setTrackMuted(trackId, muted);

    if (muted && !wasMuted && this.isRunning) {
      state.notes
        .filter((n) => n.trackId === trackId && this.activeNotes.has(n.id))
        .forEach((note) => {
          const track = state.tracks.find((t) => t.id === trackId);
          if (track && this.onNoteOff) {
            this.onNoteOff(note, track);
          }
          this.activeNotes.delete(note.id);
        });
    }
  }

  setTrackSolo(trackId: string, solo: boolean): void {
    useSequencerStore.getState().setTrackSolo(trackId, solo);
  }

  play(): void {
    const state = useSequencerStore.getState();
    if (state.isPlaying) return;

    useSequencerStore.getState().setIsPlaying(true);
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.animationLoop();
  }

  stop(): void {
    useSequencerStore.getState().setIsPlaying(false);
    useSequencerStore.getState().setCursorPosition(0);
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const state = useSequencerStore.getState();
    this.activeNotes.forEach((_, noteId) => {
      const note = state.notes.find((n) => n.id === noteId);
      const track = state.tracks.find((t) => t.id === note?.trackId);
      if (note && track && this.onNoteOff) {
        this.onNoteOff(note, track);
      }
    });
    this.activeNotes.clear();
  }

  pause(): void {
    useSequencerStore.getState().setIsPlaying(false);
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const state = useSequencerStore.getState();
    this.activeNotes.forEach((_, noteId) => {
      const note = state.notes.find((n) => n.id === noteId);
      const track = state.tracks.find((t) => t.id === note?.trackId);
      if (note && track && this.onNoteOff) {
        this.onNoteOff(note, track);
      }
    });
    this.activeNotes.clear();
  }

  private animationLoop(): void {
    if (!this.isRunning) return;

    const state = useSequencerStore.getState();
    const now = performance.now();
    const deltaSeconds = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    const beatsPerSecond = state.bpm / 60;
    const deltaBeats = deltaSeconds * beatsPerSecond;
    const newPosition = state.cursorPosition + deltaBeats;

    if (newPosition >= TOTAL_BEATS) {
      this.stop();
      return;
    }

    const currentBeat = state.cursorPosition;
    const nextBeat = newPosition;

    const beatFloor = Math.floor(currentBeat);
    const beatCeil = Math.ceil(nextBeat);
    for (let beat = beatFloor; beat <= beatCeil; beat++) {
      if (beat >= currentBeat && beat < nextBeat && this.onTick) {
        this.onTick(beat);
      }
    }

    useSequencerStore.getState().setCursorPosition(newPosition);
    this.processNotes(currentBeat, nextBeat);

    this.animationFrameId = requestAnimationFrame(this.animationLoop);
  }

  private processNotes(fromBeat: number, toBeat: number): void {
    const state = useSequencerStore.getState();
    const { notes, tracks } = state;
    const hasSolo = tracks.some((t) => t.solo);

    notes.forEach((note) => {
      const track = tracks.find((t) => t.id === note.trackId);
      if (!track) return;
      if (track.muted) return;
      if (hasSolo && !track.solo) return;

      const noteStart = note.start;
      const noteEnd = note.start + note.duration;

      if (noteStart >= fromBeat && noteStart < toBeat) {
        if (!this.activeNotes.has(note.id)) {
          this.activeNotes.set(note.id, performance.now());
          if (this.onNoteOn) {
            this.onNoteOn(note, track);
          }
        }
      }

      if (noteEnd >= fromBeat && noteEnd < toBeat) {
        if (this.activeNotes.has(note.id)) {
          this.activeNotes.delete(note.id);
          if (this.onNoteOff) {
            this.onNoteOff(note, track);
          }
        }
      }
    });
  }

  setBpm(bpm: number): void {
    useSequencerStore.getState().setBpm(bpm);
  }

  setCursorPosition(position: number): void {
    const clampedPos = Math.max(0, Math.min(TOTAL_BEATS, position));

    if (this.isRunning) {
      const state = useSequencerStore.getState();
      this.activeNotes.forEach((_, noteId) => {
        const note = state.notes.find((n) => n.id === noteId);
        const track = state.tracks.find((t) => t.id === note?.trackId);
        if (note && track && this.onNoteOff) {
          this.onNoteOff(note, track);
        }
      });
      this.activeNotes.clear();
    }

    useSequencerStore.getState().setCursorPosition(clampedPos);
  }

  exportMIDI(): Blob {
    const state = useSequencerStore.getState();
    const { notes, tracks, bpm } = state;

    const midiData = this.buildMIDI(notes, tracks, bpm);
    return new Blob([midiData.buffer.slice(midiData.byteOffset, midiData.byteOffset + midiData.byteLength)], {
      type: 'audio/midi',
    });
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

  snapToGrid(value: number, gridSize: number = 0.25): number {
    return Math.round(value / gridSize) * gridSize;
  }

  snapPitch(pitch: number): number {
    return Math.max(PITCH_MIN, Math.min(PITCH_MAX, Math.round(pitch)));
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

  getIsPlaying(): boolean {
    return this.isRunning;
  }

  getActiveNoteCount(): number {
    return this.activeNotes.size;
  }
}

export const sequencerEngine = new SequencerEngine();
