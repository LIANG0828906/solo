import { SongSection } from './types';
import beatmap from '../assets/beatmap.json';

export interface SectionInfo {
  name: SongSection;
  startTime: number;
  endTime: number;
  startBeat: number;
  endBeat: number;
}

export class BeatParser {
  private beats: number[];
  private sections: SectionInfo[];
  private bpm: number;
  private beatIntervalMs: number;

  constructor() {
    this.beats = beatmap.beats as number[];
    this.sections = (beatmap.sections as any[]).map((s) => ({
      name: s.name as SongSection,
      startTime: s.startTime,
      endTime: s.endTime,
      startBeat: s.startBeat,
      endBeat: s.endBeat,
    }));
    this.bpm = beatmap.bpm;
    this.beatIntervalMs = beatmap.beatInterval;
  }

  getBpm(): number {
    return this.bpm;
  }

  getBeatIntervalMs(): number {
    return this.beatIntervalMs;
  }

  getBeats(): number[] {
    return [...this.beats];
  }

  getSections(): SectionInfo[] {
    return [...this.sections];
  }

  getCurrentBeatIndex(currentTimeMs: number): number {
    if (this.beats.length === 0) return -1;
    let idx = 0;
    for (let i = 0; i < this.beats.length; i++) {
      if (currentTimeMs >= this.beats[i]) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }

  isOnBeat(currentTimeMs: number, toleranceMs: number = 100): boolean {
    for (const beat of this.beats) {
      if (Math.abs(currentTimeMs - beat) <= toleranceMs) {
        return true;
      }
    }
    return false;
  }

  getNextBeat(currentTimeMs: number): { index: number; time: number } | null {
    for (let i = 0; i < this.beats.length; i++) {
      if (this.beats[i] > currentTimeMs) {
        return { index: i, time: this.beats[i] };
      }
    }
    return null;
  }

  getPreviousBeat(currentTimeMs: number): { index: number; time: number } | null {
    let result: { index: number; time: number } | null = null;
    for (let i = 0; i < this.beats.length; i++) {
      if (this.beats[i] <= currentTimeMs) {
        result = { index: i, time: this.beats[i] };
      } else {
        break;
      }
    }
    return result;
  }

  getSection(currentTimeMs: number): SongSection {
    for (const section of this.sections) {
      if (currentTimeMs >= section.startTime && currentTimeMs < section.endTime) {
        return section.name;
      }
    }
    const lastSection = this.sections[this.sections.length - 1];
    return lastSection ? lastSection.name : 'intro';
  }

  getSectionInfo(currentTimeMs: number): SectionInfo | null {
    for (const section of this.sections) {
      if (currentTimeMs >= section.startTime && currentTimeMs < section.endTime) {
        return section;
      }
    }
    return null;
  }

  getTotalBeats(): number {
    return this.beats.length;
  }

  getBeatProgress(currentTimeMs: number): number {
    const prev = this.getPreviousBeat(currentTimeMs);
    const next = this.getNextBeat(currentTimeMs);
    if (!prev || !next) return 0;
    const elapsed = currentTimeMs - prev.time;
    const total = next.time - prev.time;
    return Math.min(1, elapsed / total);
  }
}
