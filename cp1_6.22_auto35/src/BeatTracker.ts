import { Note } from './Note';
import { SoundManager } from './SoundManager';

export interface BeatmapNote {
  time: number;
  track: number;
}

export class BeatTracker {
  public bpm: number = 120;
  public beatmap: BeatmapNote[] = [];
  public notes: Note[] = [];
  public currentTime: number = 0;
  public noteSpeed: number = 200;
  public judgeLineY: number = 400;
  public noteFallDuration: number = 2000;
  public isPlaying: boolean = false;
  public songDuration: number = 30000;
  public allNotesSpawned: boolean = false;

  private nextNoteIndex: number = 0;
  private lastBeatTime: number = 0;
  private beatInterval: number = 500;
  private soundManager: SoundManager;
  private startY: number = -40;

  constructor(soundManager: SoundManager) {
    this.soundManager = soundManager;
    this.calculateNoteSpeed();
    this.generateBeatmap();
  }

  private calculateNoteSpeed(): void {
    const distance = this.judgeLineY - this.startY;
    this.noteSpeed = (distance / this.noteFallDuration) * 1000;
  }

  private generateBeatmap(): void {
    this.beatmap = [];
    const notesPerTrack = 20;
    const totalNotes = notesPerTrack * 4;

    const baseInterval = this.songDuration / (totalNotes + 1);

    let currentTime = baseInterval;
    const tracks = [0, 1, 2, 3];

    for (let i = 0; i < totalNotes; i++) {
      const track = tracks[i % 4];
      const timeOffset = (Math.random() - 0.5) * baseInterval * 0.3;
      const time = Math.max(500, currentTime + timeOffset);
      this.beatmap.push({ time, track });
      currentTime += baseInterval;
    }

    this.beatmap.sort((a, b) => a.time - b.time);
  }

  public start(): void {
    this.isPlaying = true;
    this.currentTime = 0;
    this.nextNoteIndex = 0;
    this.notes = [];
    this.allNotesSpawned = false;
    this.lastBeatTime = -this.beatInterval;
    this.beatInterval = 60000 / this.bpm;
    this.soundManager.resume();
  }

  public reset(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.nextNoteIndex = 0;
    this.notes = [];
    this.allNotesSpawned = false;
  }

  public update(deltaTime: number): Note[] {
    if (!this.isPlaying) return [];

    this.currentTime += deltaTime;

    while (
      this.nextNoteIndex < this.beatmap.length &&
      this.beatmap[this.nextNoteIndex].time - this.noteFallDuration <= this.currentTime
    ) {
      const noteData = this.beatmap[this.nextNoteIndex];
      const note = new Note(noteData.track, this.startY, this.noteSpeed);
      this.notes.push(note);
      this.nextNoteIndex++;
    }

    if (this.nextNoteIndex >= this.beatmap.length) {
      this.allNotesSpawned = true;
    }

    if (this.currentTime - this.lastBeatTime >= this.beatInterval) {
      this.lastBeatTime = Math.floor(this.currentTime / this.beatInterval) * this.beatInterval;
      this.soundManager.playBeatSound();
    }

    for (const note of this.notes) {
      note.update(deltaTime);
    }

    return this.notes.filter(n => n.isParticleDone);
  }

  public removeNote(note: Note): void {
    const index = this.notes.indexOf(note);
    if (index > -1) {
      this.notes.splice(index, 1);
    }
  }

  public getActiveNotes(): Note[] {
    return this.notes.filter(n => !n.isDead || n.particles.length > 0);
  }

  public isGameOver(): boolean {
    return this.allNotesSpawned && this.notes.every(n => n.isParticleDone || n.isJudged);
  }

  public getProgress(): number {
    return Math.min(1, this.currentTime / this.songDuration);
  }
}
