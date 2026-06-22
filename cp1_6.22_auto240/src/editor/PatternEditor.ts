import { v4 as uuidv4 } from 'uuid';
import {
  BeatPoint,
  Pattern,
  Difficulty,
  TrackType,
  TRACK_COLORS,
} from '../types';

const DEFAULT_DURATION = 30000;
const SECTOR_COUNT = 12;

export class PatternEditor {
  private pattern: Pattern;

  constructor() {
    this.pattern = this.createEmptyPattern();
  }

  private createEmptyPattern(): Pattern {
    return {
      name: 'Custom Pattern',
      bpm: 120,
      duration: DEFAULT_DURATION,
      tracks: {
        drum: { enabled: true, volume: 0.7 },
        bass: { enabled: true, volume: 0.7 },
        melody: { enabled: true, volume: 0.7 },
        effect: { enabled: true, volume: 0.7 },
      },
      beats: [],
    };
  }

  public generatePreset(difficulty: Difficulty): Pattern {
    const bpm =
      difficulty === 'easy' ? 100 : difficulty === 'normal' ? 120 : 140;
    const beatInterval = 60000 / bpm;
    const pattern: Pattern = this.createEmptyPattern();
    pattern.name = `Preset - ${
      difficulty === 'easy' ? '简单' : difficulty === 'normal' ? '普通' : '困难'
    }`;
    pattern.bpm = bpm;

    const beats: BeatPoint[] = [];
    const totalBeats = Math.floor(pattern.duration / beatInterval);

    if (difficulty === 'easy') {
      pattern.tracks.melody.enabled = false;
      pattern.tracks.effect.enabled = false;

      for (let i = 0; i < totalBeats; i++) {
        const time = i * beatInterval;

        if (i % 2 === 0) {
          beats.push({
            id: uuidv4(),
            time,
            track: 'drum',
            sector: (i * 3) % SECTOR_COUNT,
          });
        }

        if (i % 4 === 2) {
          beats.push({
            id: uuidv4(),
            time,
            track: 'bass',
            sector: ((i * 3) + 6) % SECTOR_COUNT,
          });
        }
      }
    } else if (difficulty === 'normal') {
      for (let i = 0; i < totalBeats; i++) {
        const time = i * beatInterval;
        const beatInBar = i % 4;

        const trackSequence: TrackType[] = [
          'drum',
          'bass',
          'melody',
          'bass',
        ];
        const track = trackSequence[beatInBar];

        beats.push({
          id: uuidv4(),
          time,
          track,
          sector: (i * 2 + (beatInBar * 3)) % SECTOR_COUNT,
        });

        if (i % 8 === 7) {
          beats.push({
            id: uuidv4(),
            time: time + beatInterval * 0.5,
            track: 'effect',
            sector: (i + 5) % SECTOR_COUNT,
          });
        }
      }
    } else {
      for (let i = 0; i < totalBeats; i++) {
        const time = i * beatInterval;
        const beatInBar = i % 8;

        const mainTracks: TrackType[] = [
          'drum',
          'bass',
          'melody',
          'bass',
          'drum',
          'melody',
          'bass',
          'melody',
        ];
        beats.push({
          id: uuidv4(),
          time,
          track: mainTracks[beatInBar],
          sector: (i * 3 + beatInBar) % SECTOR_COUNT,
        });

        if (Math.random() < 0.35) {
          beats.push({
            id: uuidv4(),
            time: time + beatInterval * (0.25 + Math.random() * 0.5),
            track: 'effect',
            sector: Math.floor(Math.random() * SECTOR_COUNT),
          });
        }

        if (i % 4 === 3) {
          beats.push({
            id: uuidv4(),
            time: time + beatInterval * 0.5,
            track: Math.random() < 0.5 ? 'drum' : 'bass',
            sector: Math.floor(Math.random() * SECTOR_COUNT),
          });
        }
      }
    }

    pattern.beats = beats.sort((a, b) => a.time - b.time);
    this.pattern = pattern;
    return { ...pattern, beats: [...pattern.beats] };
  }

  public addBeat(time: number, track: TrackType, sector: number): BeatPoint {
    const beat: BeatPoint = {
      id: uuidv4(),
      time,
      track,
      sector: ((sector % SECTOR_COUNT) + SECTOR_COUNT) % SECTOR_COUNT,
    };
    this.pattern.beats.push(beat);
    this.pattern.beats.sort((a, b) => a.time - b.time);
    return beat;
  }

  public removeBeat(id: string): boolean {
    const index = this.pattern.beats.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.pattern.beats.splice(index, 1);
    return true;
  }

  public toggleBeatAt(time: number, track: TrackType, sector: number): BeatPoint | null {
    const tolerance = 100;
    const existing = this.pattern.beats.find(
      (b) =>
        b.track === track &&
        b.sector === sector &&
        Math.abs(b.time - time) < tolerance
    );
    if (existing) {
      this.removeBeat(existing.id);
      return null;
    }
    return this.addBeat(time, track, sector);
  }

  public getPattern(): Pattern {
    return {
      ...this.pattern,
      tracks: { ...this.pattern.tracks },
      beats: this.pattern.beats.map((b) => ({ ...b })),
    };
  }

  public setPattern(pattern: Pattern): void {
    this.pattern = {
      ...pattern,
      tracks: { ...pattern.tracks },
      beats: pattern.beats.map((b) => ({ ...b })),
    };
  }

  public setBPM(bpm: number): void {
    this.pattern.bpm = Math.max(80, Math.min(180, bpm));
  }

  public setTrackEnabled(track: TrackType, enabled: boolean): void {
    this.pattern.tracks[track].enabled = enabled;
  }

  public setTrackVolume(track: TrackType, volume: number): void {
    this.pattern.tracks[track].volume = Math.max(0, Math.min(1, volume));
  }

  public exportJSON(): string {
    return JSON.stringify(
      {
        name: this.pattern.name,
        bpm: this.pattern.bpm,
        duration: this.pattern.duration,
        tracks: this.pattern.tracks,
        beats: this.pattern.beats,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
      null,
      2
    );
  }

  public importJSON(json: string): Pattern {
    const data = JSON.parse(json) as Pattern & { beats?: BeatPoint[] };
    if (!data.bpm || !data.beats || !Array.isArray(data.beats)) {
      throw new Error('Invalid pattern JSON');
    }
    const pattern: Pattern = {
      name: data.name || 'Imported Pattern',
      bpm: Math.max(80, Math.min(180, data.bpm)),
      duration: data.duration || DEFAULT_DURATION,
      tracks: {
        drum: data.tracks?.drum ?? { enabled: true, volume: 0.7 },
        bass: data.tracks?.bass ?? { enabled: true, volume: 0.7 },
        melody: data.tracks?.melody ?? { enabled: true, volume: 0.7 },
        effect: data.tracks?.effect ?? { enabled: true, volume: 0.7 },
      },
      beats: data.beats
        .filter((b) => b && typeof b.time === 'number' && b.track)
        .map((b) => ({
          id: b.id || uuidv4(),
          time: Math.max(0, b.time),
          track: b.track,
          sector: ((b.sector ?? 0) % SECTOR_COUNT + SECTOR_COUNT) % SECTOR_COUNT,
        }))
        .sort((a, b) => a.time - b.time),
    };
    this.pattern = pattern;
    return this.getPattern();
  }

  public getBeatsInSector(sector: number): BeatPoint[] {
    return this.pattern.beats.filter((b) => b.sector === sector);
  }

  public getBeatsAtTimeRange(start: number, end: number): BeatPoint[] {
    return this.pattern.beats.filter(
      (b) => b.time >= start && b.time < end
    );
  }

  public getBeatCount(): number {
    return this.pattern.beats.length;
  }

  public clear(): void {
    this.pattern = this.createEmptyPattern();
  }
}
