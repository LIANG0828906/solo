import { audioEngine, type InstrumentType, type DrumType } from './audioEngine';

export interface RecordedNote {
  instrument: InstrumentType;
  note: string | DrumType;
  time: number;
  duration?: number;
  velocity?: number;
  stringIndex?: number;
  fretIndex?: number;
}

export interface Recording {
  id: string;
  name: string;
  notes: RecordedNote[];
  duration: number;
  createdAt: number;
  tag: string;
}

class Recorder {
  private isRecording = false;
  private recordingNotes: RecordedNote[] = [];
  private startTime = 0;
  private isPlaying = false;
  private playbackTimeouts: number[] = [];
  private playbackStartTime = 0;
  private currentPlaybackNotes: Set<string> = new Set();
  private onNotePlayCallback?: (note: RecordedNote) => void;
  private onPlaybackEndCallback?: () => void;
  private playbackSpeed = 1;

  startRecording(): void {
    this.isRecording = true;
    this.recordingNotes = [];
    this.startTime = performance.now();
  }

  stopRecording(): Recording | null {
    if (!this.isRecording) return null;
    this.isRecording = false;
    const endTime = performance.now();
    const duration = (endTime - this.startTime) / 1000;

    if (this.recordingNotes.length === 0) return null;

    const recording: Recording = {
      id: this.generateId(),
      name: `录音 ${new Date().toLocaleTimeString()}`,
      notes: [...this.recordingNotes],
      duration,
      createdAt: Date.now(),
      tag: ''
    };

    return recording;
  }

  recordNote(instrument: InstrumentType, note: string | DrumType, options?: { velocity?: number; stringIndex?: number; fretIndex?: number }): void {
    if (!this.isRecording) return;

    const now = performance.now();
    const time = (now - this.startTime) / 1000;

    this.recordingNotes.push({
      instrument,
      note,
      time,
      velocity: options?.velocity,
      stringIndex: options?.stringIndex,
      fretIndex: options?.fretIndex
    });
  }

  async playRecording(recording: Recording, speed: number = 1): Promise<void> {
    return new Promise((resolve) => {
      this.stopPlayback();
      this.isPlaying = true;
      this.playbackSpeed = speed;
      this.playbackStartTime = performance.now();

      const notes = [...recording.notes].sort((a, b) => a.time - b.time);

      notes.forEach((note) => {
        const delayMs = (note.time / speed) * 1000;
        const timeoutId = window.setTimeout(() => {
          audioEngine.playNote(note.instrument, note.note, {
            velocity: note.velocity,
            stringIndex: note.stringIndex,
            fretIndex: note.fretIndex
          });

          if (this.onNotePlayCallback) {
            this.onNotePlayCallback(note);
          }

          const noteKey = `${note.instrument}_${note.note}_${note.stringIndex || ''}_${note.fretIndex || ''}`;
          this.currentPlaybackNotes.add(noteKey);
          setTimeout(() => {
            this.currentPlaybackNotes.delete(noteKey);
          }, 200);
        }, delayMs);

        this.playbackTimeouts.push(timeoutId);
      });

      const totalDuration = (recording.duration / speed) * 1000;
      const endTimeoutId = window.setTimeout(() => {
        this.isPlaying = false;
        this.playbackTimeouts = [];
        this.currentPlaybackNotes.clear();
        if (this.onPlaybackEndCallback) {
          this.onPlaybackEndCallback();
        }
        resolve();
      }, totalDuration + 500);

      this.playbackTimeouts.push(endTimeoutId);
    });
  }

  stopPlayback(): void {
    this.playbackTimeouts.forEach((id) => clearTimeout(id));
    this.playbackTimeouts = [];
    this.isPlaying = false;
    this.currentPlaybackNotes.clear();
    audioEngine.stopAllNotes();
  }

  setOnNotePlay(callback: (note: RecordedNote) => void): void {
    this.onNotePlayCallback = callback;
  }

  setOnPlaybackEnd(callback: () => void): void {
    this.onPlaybackEndCallback = callback;
  }

  isNotePlaying(instrument: InstrumentType, note: string | DrumType, stringIndex?: number, fretIndex?: number): boolean {
    const noteKey = `${instrument}_${note}_${stringIndex || ''}_${fretIndex || ''}`;
    return this.currentPlaybackNotes.has(noteKey);
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed;
  }

  private generateId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const recorder = new Recorder();
