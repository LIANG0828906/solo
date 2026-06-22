import * as Tone from 'tone';
import type { InstrumentType, NoteInfo } from './types';

export class Player {
  private synth: Tone.PolySynth | null = null;
  private bpm: number = 120;
  private instrument: InstrumentType = 'piano';
  private isPlaying: boolean = false;
  private pauseTime: number = 0;
  private currentNoteIndex: number = 0;
  private scheduledEvents: number[] = [];

  constructor() {
    this.initSynth();
  }

  private initSynth(): void {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      volume: -6
    }).toDestination();
    this.applyInstrumentSettings();
  }

  private applyInstrumentSettings(): void {
    if (!this.synth) return;

    switch (this.instrument) {
      case 'piano':
        this.synth.set({
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.005,
            decay: 0.3,
            sustain: 0.4,
            release: 1.2
          }
        });
        break;
      case 'electricPiano':
        this.synth.set({
          oscillator: { type: 'triangle' },
          envelope: {
            attack: 0.003,
            decay: 0.5,
            sustain: 0.3,
            release: 2.0
          }
        });
        break;
      case 'strings':
        this.synth.set({
          oscillator: { type: 'sawtooth' },
          envelope: {
            attack: 0.15,
            decay: 0.4,
            sustain: 0.6,
            release: 2.5
          }
        });
        break;
    }
  }

  public async ensureAudioContext(): Promise<void> {
    if (Tone.getTransport().state === 'stopped') {
      await Tone.start();
    }
  }

  public setInstrument(instrument: InstrumentType): void {
    this.instrument = instrument;
    this.applyInstrumentSettings();
    console.log(`[Player] 切换乐器: ${instrument}`);
  }

  public setBpm(bpm: number): void {
    this.bpm = bpm;
    Tone.getTransport().bpm.value = bpm;
    console.log(`[Player] 设置BPM: ${bpm}`);
  }

  public async playNote(note: string, duration: number): Promise<void> {
    await this.ensureAudioContext();
    
    if (!this.synth) return;
    
    const durationInSeconds = (duration * 60) / this.bpm;
    console.log(`[Player] 演奏音符: ${note}, 时长: ${duration}拍 (${durationInSeconds.toFixed(2)}秒)`);
    
    this.synth.triggerAttackRelease(note, durationInSeconds);
  }

  public stop(): void {
    this.clearScheduledEvents();
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.isPlaying = false;
    this.currentNoteIndex = 0;
    this.pauseTime = 0;
    if (this.synth) {
      this.synth.releaseAll();
    }
    console.log('[Player] 停止播放');
  }

  private clearScheduledEvents(): void {
    this.scheduledEvents.forEach(id => {
      Tone.getTransport().clear(id);
    });
    this.scheduledEvents = [];
  }

  public async playSequence(
    notes: NoteInfo[],
    onProgress: (noteIndex: number, measure: number) => void
  ): Promise<void> {
    await this.ensureAudioContext();
    
    if (this.isPlaying) {
      this.pause();
      return;
    }

    if (notes.length === 0) return;

    this.clearScheduledEvents();
    Tone.getTransport().bpm.value = this.bpm;

    const startIndex = this.currentNoteIndex;
    let currentTime = this.pauseTime;

    for (let i = startIndex; i < notes.length; i++) {
      const note = notes[i];
      const noteDuration = (note.duration * 60) / this.bpm;

      const eventId = Tone.getTransport().schedule((time) => {
        if (!this.isPlaying) return;
        
        if (this.synth) {
          this.synth.triggerAttackRelease(note.pitch, noteDuration, time);
        }
        
        this.currentNoteIndex = i;
        console.log(`[Player] 序列演奏 - 音符: ${note.pitch}, 小节: ${note.measure}, 索引: ${i}`);
        
        Tone.Draw.schedule(() => {
          onProgress(i, note.measure);
        }, time);
      }, currentTime);

      this.scheduledEvents.push(eventId);
      currentTime += noteDuration;
    }

    const endEventId = Tone.getTransport().schedule(() => {
      this.isPlaying = false;
      this.currentNoteIndex = 0;
      this.pauseTime = 0;
      Tone.getTransport().stop();
      onProgress(-1, 0);
      console.log('[Player] 序列播放完成');
    }, currentTime);
    this.scheduledEvents.push(endEventId);

    this.isPlaying = true;
    Tone.getTransport().start();
    console.log(`[Player] 开始序列播放，从索引 ${startIndex} 开始，BPM: ${this.bpm}`);
  }

  public pause(): void {
    if (!this.isPlaying) return;
    
    Tone.getTransport().pause();
    this.pauseTime = Tone.getTransport().seconds;
    this.isPlaying = false;
    console.log(`[Player] 暂停播放，位置: ${this.pauseTime.toFixed(2)}秒，当前音符索引: ${this.currentNoteIndex}`);
  }

  public async resume(
    notes: NoteInfo[],
    onProgress: (noteIndex: number, measure: number) => void
  ): Promise<void> {
    if (this.isPlaying) return;
    
    await this.playSequence(notes, onProgress);
  }

  public getPlayState(): boolean {
    return this.isPlaying;
  }

  public getCurrentNoteIndex(): number {
    return this.currentNoteIndex;
  }

  public resetPosition(): void {
    this.currentNoteIndex = 0;
    this.pauseTime = 0;
    Tone.getTransport().position = 0;
  }
}
