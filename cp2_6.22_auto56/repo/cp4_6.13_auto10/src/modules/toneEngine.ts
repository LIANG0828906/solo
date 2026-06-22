import * as Tone from 'tone';

export type InstrumentType = 'piano' | 'epiano' | 'strings';

export interface MidiNote {
  note: string;
  time: number;
  duration: number;
  velocity: number;
}

export interface MidiClip {
  id?: string;
  name: string;
  instrument: InstrumentType;
  duration: number;
  createdAt?: number;
  notes: MidiNote[];
}

export interface TrackClip {
  clipId: string;
  startTime: number;
  volume: number;
}

export interface Track {
  id: string;
  clips: TrackClip[];
}

export interface Composition {
  id?: string;
  name: string;
  createdAt?: number;
  tracks: Track[];
}

class ToneEngine {
  private static instance: ToneEngine;
  private currentInstrument: InstrumentType = 'piano';
  private piano: Tone.Sampler | null = null;
  private epiano: Tone.Synth | null = null;
  private strings: Tone.PolySynth | null = null;
  private started = false;
  private clipsMap: Map<string, MidiClip> = new Map();

  private constructor() {}

  public static getInstance(): ToneEngine {
    if (!ToneEngine.instance) {
      ToneEngine.instance = new ToneEngine();
    }
    return ToneEngine.instance;
  }

  public async init(): Promise<void> {
    if (this.piano && this.epiano && this.strings) return;

    const pianoMap: Record<string, string> = {
      'C4': 'C4', 'D4': 'D4', 'E4': 'E4', 'F4': 'F4',
      'G4': 'G4', 'A4': 'A4', 'B4': 'B4',
      'C5': 'C5', 'D5': 'D5', 'E5': 'E5', 'F5': 'F5',
      'G5': 'G5', 'A5': 'A5', 'B5': 'B5',
    };

    this.piano = new Tone.Sampler({
      urls: pianoMap,
      release: 1,
    }).toDestination();

    await Tone.loaded();

    this.epiano = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.4,
        release: 1.2,
      },
    }).toDestination();

    this.strings = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.6,
        release: 2,
      },
    }).toDestination();
  }

  public async ensureStarted(): Promise<void> {
    if (!this.started) {
      await Tone.start();
      this.started = true;
    }
    await this.init();
  }

  public setInstrument(instrument: InstrumentType): void {
    this.currentInstrument = instrument;
  }

  public getInstrument(): InstrumentType {
    return this.currentInstrument;
  }

  private getSynth(instrument: InstrumentType): Tone.Sampler | Tone.Synth | Tone.PolySynth | null {
    switch (instrument) {
      case 'piano':
        return this.piano;
      case 'epiano':
        return this.epiano;
      case 'strings':
        return this.strings;
      default:
        return null;
    }
  }

  public playNote(note: string, instrument?: InstrumentType, duration: string | number = '8n'): void {
    const inst = instrument || this.currentInstrument;
    const synth = this.getSynth(inst);
    if (synth) {
      if (synth instanceof Tone.Sampler) {
        synth.triggerAttackRelease(note, duration);
      } else if (synth instanceof Tone.PolySynth) {
        synth.triggerAttackRelease(note, duration);
      } else {
        synth.triggerAttackRelease(note, duration);
      }
    }
  }

  public scheduleNote(
    note: string,
    time: number,
    duration: number,
    instrument?: InstrumentType,
    velocity: number = 1
  ): void {
    const inst = instrument || this.currentInstrument;
    const synth = this.getSynth(inst);
    if (synth) {
      if (synth instanceof Tone.Sampler) {
        synth.triggerAttackRelease(note, duration, time, velocity);
      } else if (synth instanceof Tone.PolySynth) {
        synth.triggerAttackRelease(note, duration, time, velocity);
      } else {
        synth.triggerAttackRelease(note, duration, time, velocity);
      }
    }
  }

  public playClip(clip: MidiClip, startTime: number = 0): void {
    const now = Tone.now() + startTime;
    clip.notes.forEach((n) => {
      this.scheduleNote(n.note, now + n.time, n.duration, clip.instrument, n.velocity);
    });
  }

  public stopAll(): void {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (this.piano) this.piano.releaseAll(Tone.now());
    if (this.epiano) this.epiano.triggerRelease(Tone.now());
    if (this.strings) this.strings.releaseAll(Tone.now());
  }

  public startTransport(): void {
    Tone.Transport.start();
  }

  public stopTransport(): void {
    Tone.Transport.stop();
  }

  public seekTransport(seconds: number): void {
    Tone.Transport.seconds = seconds;
  }

  public setClips(clips: MidiClip[]): void {
    this.clipsMap.clear();
    clips.forEach((c) => {
      if (c.id) this.clipsMap.set(c.id, c);
    });
  }

  public async renderToWav(
    tracks: Track[],
    clips: MidiClip[],
    bpm: number = 120
  ): Promise<Blob> {
    const clipsMap = new Map<string, MidiClip>();
    clips.forEach((c) => {
      if (c.id) clipsMap.set(c.id, c);
    });

    let totalDuration = 0;
    tracks.forEach((track) => {
      track.clips.forEach((trackClip) => {
        const clip = clipsMap.get(trackClip.clipId);
        if (clip) {
          const end = trackClip.startTime + clip.duration;
          if (end > totalDuration) totalDuration = end;
        }
      });
    });

    totalDuration = Math.max(totalDuration, 1) + 0.5;

    const render = await Tone.Offline(() => {
      Tone.Transport.bpm.value = bpm;

      const offPiano = new Tone.Sampler({
        urls: { 'C4': 'C4', 'D4': 'D4', 'E4': 'E4', 'F4': 'F4',
          'G4': 'G4', 'A4': 'A4', 'B4': 'B4',
          'C5': 'C5', 'D5': 'D5', 'E5': 'E5', 'F5': 'F5',
          'G5': 'G5', 'A5': 'A5', 'B5': 'B5' },
        release: 1,
      }).toDestination();

      const offEpiano = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 1.2 },
      }).toDestination();

      const offStrings = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 2 },
      }).toDestination();

      const getOfflineSynth = (inst: InstrumentType) => {
        switch (inst) {
          case 'piano': return offPiano;
          case 'epiano': return offEpiano;
          case 'strings': return offStrings;
        }
      };

      tracks.forEach((track) => {
        track.clips.forEach((trackClip) => {
          const clip = clipsMap.get(trackClip.clipId);
          if (!clip) return;
          const synth = getOfflineSynth(clip.instrument);
          clip.notes.forEach((n) => {
            const noteTime = trackClip.startTime + n.time;
            if (synth instanceof Tone.Sampler) {
              synth.triggerAttackRelease(n.note, n.duration, noteTime, n.velocity * trackClip.volume);
            } else if (synth instanceof Tone.PolySynth) {
              synth.triggerAttackRelease(n.note, n.duration, noteTime, n.velocity * trackClip.volume);
            } else {
              synth.triggerAttackRelease(n.note, n.duration, noteTime, n.velocity * trackClip.volume);
            }
          });
        });
      });
    }, totalDuration, 2, 44100);

    return render as unknown as Blob;
  }
}

export function getAudioEngine(): ToneEngine {
  return ToneEngine.getInstance();
}
