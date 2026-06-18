import { useSequencerStore } from '../../store/useSequencerStore';
import { Note } from '../../types';

export class SequencerEngine {
  private playInterval: number | null = null;
  private lastFrameTime: number = 0;
  private beatDuration: number = 500;

  constructor() {
    const bpm = useSequencerStore.getState().bpm;
    this.beatDuration = 60000 / bpm;
  }

  addNote(note: Omit<Note, 'id'>) {
    const state = useSequencerStore.getState();
    const trackNotes = state.notes.filter((n) => n.trackId === note.trackId);
    if (trackNotes.length >= 128) return;
    state.addNote(note);
  }

  removeNote(id: string) {
    useSequencerStore.getState().removeNote(id);
  }

  moveNote(id: string, newStart: number, newPitch: number) {
    useSequencerStore.getState().updateNote(id, {
      start: Math.max(0, newStart),
      pitch: Math.min(127, Math.max(0, newPitch)),
    });
  }

  resizeNote(id: string, newDuration: number) {
    useSequencerStore.getState().updateNote(id, {
      duration: Math.max(0.25, newDuration),
    });
  }

  play() {
    const state = useSequencerStore.getState();
    if (state.isPlaying) return;

    state.setIsPlaying(true);
    this.beatDuration = 60000 / state.bpm;
    this.lastFrameTime = performance.now();
    this.animationFrame();
  }

  private animationFrame = () => {
    const state = useSequencerStore.getState();
    if (!state.isPlaying) return;

    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const beatsDelta = delta / this.beatDuration;
    const newPosition = state.cursorPosition + beatsDelta;

    const totalBeats = 32;
    const wrappedPosition = newPosition >= totalBeats ? 0 : newPosition;

    state.setCursorPosition(wrappedPosition);

    this.playInterval = window.requestAnimationFrame(this.animationFrame);
  };

  pause() {
    useSequencerStore.getState().setIsPlaying(false);
    if (this.playInterval !== null) {
      cancelAnimationFrame(this.playInterval);
      this.playInterval = null;
    }
  }

  stop() {
    useSequencerStore.getState().setIsPlaying(false);
    useSequencerStore.getState().setCursorPosition(0);
    if (this.playInterval !== null) {
      cancelAnimationFrame(this.playInterval);
      this.playInterval = null;
    }
  }

  setBpm(bpm: number) {
    useSequencerStore.getState().setBpm(Math.max(60, Math.min(200, bpm)));
    this.beatDuration = 60000 / bpm;
  }

  exportMIDI(): Blob {
    const state = useSequencerStore.getState();
    const tracks = state.tracks;
    const notes = state.notes;

    const midiEvents: number[] = [];

    const writeVarLength = (value: number, arr: number[]) => {
      let buffer = value & 0x7f;
      while ((value >>= 7)) {
        buffer <<= 8;
        buffer |= (value & 0x7f) | 0x80;
      }
      while (true) {
        arr.push(buffer & 0xff);
        if (buffer & 0x80) buffer >>= 8;
        else break;
      }
    };

    const headerChunk: number[] = [];
    headerChunk.push(0x4d, 0x54, 0x68, 0x64);
    headerChunk.push(0x00, 0x00, 0x00, 0x06);
    headerChunk.push(0x00, 0x01);
    headerChunk.push(0x00, tracks.length + 1);
    const division = 480;
    headerChunk.push((division >> 8) & 0xff, division & 0xff);

    const tempoTrack: number[] = [];
    const microsecondsPerBeat = Math.floor(60000000 / state.bpm);
    tempoTrack.push(0x00);
    tempoTrack.push(0xff, 0x51, 0x03);
    tempoTrack.push((microsecondsPerBeat >> 16) & 0xff);
    tempoTrack.push((microsecondsPerBeat >> 8) & 0xff);
    tempoTrack.push(microsecondsPerBeat & 0xff);
    tempoTrack.push(0x00, 0xff, 0x2f, 0x00);

    const tempoTrackChunk: number[] = [];
    tempoTrackChunk.push(0x4d, 0x54, 0x72, 0x6b);
    const len1 = tempoTrack.length;
    tempoTrackChunk.push((len1 >> 24) & 0xff, (len1 >> 16) & 0xff, (len1 >> 8) & 0xff, len1 & 0xff);
    tempoTrackChunk.push(...tempoTrack);

    midiEvents.push(...headerChunk, ...tempoTrackChunk);

    tracks.forEach((track, trackIdx) => {
      const trackNotes = notes
        .filter((n) => n.trackId === track.id)
        .sort((a, b) => a.start - b.start);

      const events: number[] = [];
      const ticksPerBeat = 480;

      let lastTick = 0;

      trackNotes.forEach((note) => {
        const startTick = Math.floor(note.start * ticksPerBeat);
        const endTick = Math.floor((note.start + note.duration) * ticksPerBeat);

        const deltaOn = startTick - lastTick;
        writeVarLength(deltaOn, events);
        events.push(0x90 + trackIdx, note.pitch, note.velocity);
        lastTick = startTick;

        const deltaOff = endTick - lastTick;
        writeVarLength(deltaOff, events);
        events.push(0x80 + trackIdx, note.pitch, 0x00);
        lastTick = endTick;
      });

      writeVarLength(0, events);
      events.push(0xff, 0x2f, 0x00);

      const trackChunk: number[] = [];
      trackChunk.push(0x4d, 0x54, 0x72, 0x6b);
      const length = events.length;
      trackChunk.push((length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff);
      trackChunk.push(...events);

      midiEvents.push(...trackChunk);
    });

    return new Blob([new Uint8Array(midiEvents)], { type: 'audio/midi' });
  }

  downloadMIDI(filename: string = 'project.mid') {
    const blob = this.exportMIDI();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const sequencerEngine = new SequencerEngine();
