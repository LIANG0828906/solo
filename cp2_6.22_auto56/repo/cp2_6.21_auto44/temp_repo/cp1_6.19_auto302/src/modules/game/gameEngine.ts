import * as Tone from 'tone';
import { Note, NoteType, TrackIndex, NOTE_FALL_DURATION } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';
import { notePool } from './notePool';
import { judgeModule } from './judgeModule';

const BPM = 120;
const BEAT_MS = 60000 / BPM;
const GAME_DURATION_BEATS = 60;
const GAME_DURATION_MS = GAME_DURATION_BEATS * BEAT_MS;

export class GameEngine {
  private rafId: number | null = null;
  private lastFrame = 0;
  private bgmStarted = false;
  private synthArp: Tone.PolySynth | null = null;
  private synthKick: Tone.MembraneSynth | null = null;
  private synthSnare: Tone.NoiseSynth | null = null;
  private arpPart: Tone.Part | null = null;
  private kickPart: Tone.Sequence | null = null;
  private snarePart: Tone.Sequence | null = null;
  private scheduledNotes: Note[] = [];
  private notesSpawned: Set<number> = new Set();

  generateNoteChart(): Note[] {
    const notes: Note[] = [];
    const types: NoteType[] = ['tap', 'tap', 'tap', 'tap', 'hold', 'tap', 'slide', 'tap'];

    for (let beat = 4; beat < GAME_DURATION_BEATS - 4; beat++) {
      if (Math.random() < 0.85) {
        const track = Math.floor(Math.random() * 3) as TrackIndex;
        const type = types[Math.floor(Math.random() * types.length)];
        const hitTime = beat * BEAT_MS;
        const base: Partial<Note> = {
          type,
          track,
          hitTime,
        };
        if (type === 'hold') {
          base.holdEndTime = hitTime + BEAT_MS * (1 + Math.floor(Math.random() * 2));
        }
        if (type === 'slide') {
          base.slideDirection = Math.random() < 0.5 ? 'up' : 'down';
        }
        notes.push(base as Note);
      }
      if (beat % 2 === 0 && Math.random() < 0.4) {
        const subHit = beat * BEAT_MS + BEAT_MS / 2;
        let track = Math.floor(Math.random() * 3) as TrackIndex;
        const primary = notes.find((n) => Math.abs(n.hitTime - beat * BEAT_MS) < 10);
        if (primary && primary.track === track) {
          track = ((track + 1) % 3) as TrackIndex;
        }
        notes.push({
          type: 'tap',
          track,
          hitTime: subHit,
        } as Note);
      }
    }
    notes.sort((a, b) => a.hitTime - b.hitTime);
    return notes;
  }

  async setupAudio(): Promise<void> {
    await Tone.start();
    Tone.Transport.bpm.value = BPM;

    this.synthArp = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.3 },
    }).toDestination();
    this.synthArp.volume.value = -8;

    this.synthKick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' },
    }).toDestination();
    this.synthKick.volume.value = -5;

    this.synthSnare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
    }).toDestination();
    this.synthSnare.volume.value = -10;

    const arpNotes = ['C4', 'E4', 'G4', 'B4', 'C5', 'B4', 'G4', 'E4', 'D4', 'F4', 'A4', 'C5', 'D5', 'C5', 'A4', 'F4'];
    const arpEvents: Array<[Tone.Unit.Time, string]> = [];
    for (let bar = 0; bar < 8; bar++) {
      arpNotes.forEach((note, i) => {
        arpEvents.push([`${bar * 4}:${(i * 0.5).toFixed(2)}`, note]);
      });
    }
    this.arpPart = new Tone.Part((time, value) => {
      this.synthArp?.triggerAttackRelease(value, '16n', time);
    }, arpEvents).start(0);

    this.kickPart = new Tone.Sequence(
      (time) => {
        this.synthKick?.triggerAttackRelease('C2', '8n', time);
      },
      ['C2', null, null, null, 'C2', null, 'C2', null],
      '4n',
    ).start(0);

    this.snarePart = new Tone.Sequence(
      (time) => {
        this.synthSnare?.triggerAttackRelease('16n', time);
      },
      [null, null, 'C2', null, null, null, 'C2', null],
      '4n',
    ).start(0);
  }

  async start(): Promise<void> {
    useGameStore.getState().startGame();
    judgeModule.reset();
    this.notesSpawned.clear();

    this.scheduledNotes = this.generateNoteChart();

    if (!this.bgmStarted) {
      await this.setupAudio();
      this.bgmStarted = true;
    }
    Tone.Transport.position = 0;
    Tone.Transport.start();

    this.lastFrame = performance.now();
    this.loop();
  }

  private loop = (): void => {
    const now = performance.now();
    const state = useGameStore.getState();
    const currentTime = now - state.startTime;

    useGameStore.getState().setCurrentTime(currentTime);

    for (let i = 0; i < this.scheduledNotes.length; i++) {
      if (this.notesSpawned.has(i)) continue;
      const s = this.scheduledNotes[i];
      if (currentTime >= s.hitTime - NOTE_FALL_DURATION) {
        const note = notePool.acquire({
          type: s.type,
          track: s.track,
          hitTime: s.hitTime,
          holdEndTime: s.holdEndTime,
          slideDirection: s.slideDirection,
        });
        useGameStore.getState().addNote(note);
        this.notesSpawned.add(i);
      }
    }

    const latestState = useGameStore.getState();
    for (const note of latestState.notes) {
      if (note.judged && note.type !== 'hold') {
        continue;
      }
      if (note.judged && note.type === 'hold' && note.holdProgress !== undefined && note.holdProgress >= 1) {
        continue;
      }
      const progress = (currentTime - note.spawnTime) / NOTE_FALL_DURATION;
      note.y = progress;
      if (note.type === 'hold' && note.holdEndTime !== undefined) {
        note.holdProgress = Math.max(0, Math.min(1, (currentTime - note.hitTime) / (note.holdEndTime - note.hitTime)));
      }
    }

    judgeModule.update(currentTime);

    const active = useGameStore.getState().notes.filter((n) => {
      if (!n.judged) return true;
      if (n.type === 'hold') {
        const endHold = n.holdEndTime ?? n.hitTime;
        return currentTime < endHold + 200;
      }
      return currentTime - (n.hitTime ?? 0) < 300;
    });
    if (active.length !== useGameStore.getState().notes.length) {
      const removed = useGameStore.getState().notes.filter((n) => !active.includes(n));
      for (const r of removed) {
        notePool.release(r.id);
        useGameStore.getState().removeNote(r.id);
      }
    }

    useGameStore.getState().cleanupEffects(now);

    const milestoneCombos = [10, 25, 50, 100];
    const combo = useGameStore.getState().combo;
    if (milestoneCombos.includes(combo) && useGameStore.getState().comboShake > 0) {
      const ts = useGameStore.getState().comboShake;
      if (now - ts < 20) {
        useGameStore.getState().triggerComboMilestone();
      }
    }

    if (currentTime > GAME_DURATION_MS && Tone.Transport.state === 'started') {
      Tone.Transport.stop();
      useGameStore.getState().endGame();
    }

    this.lastFrame = now;
    if (useGameStore.getState().isPlaying) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
    }
  }

  reset(): void {
    this.stop();
    this.bgmStarted = false;
    this.notesSpawned.clear();
    notePool.reset();
    judgeModule.reset();
    useGameStore.getState().resetGame();
  }
}

export const gameEngine = new GameEngine();
