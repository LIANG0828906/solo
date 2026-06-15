import { Instrument, BIANZHONG_MIDI, BIANQING_MIDI, GUQIN_MIDI, XIAO_MIDI } from './audio';

export interface ScoreNote {
  instrument: Instrument;
  noteIndex: number;
  startBeat: number;
  duration: number;
}

export interface Score {
  id: string;
  name: string;
  bpm: number;
  totalBeats: number;
  notes: ScoreNote[];
}

export interface HitRecord {
  noteIndex: number;
  instrument: Instrument;
  expectedTime: number;
  actualTime: number;
  deviation: number;
  correct: boolean;
}

export interface EvaluationResult {
  accuracy: number;
  rhythmScore: number;
  fusionScore: number;
  totalScore: number;
  rank: string;
  review: string;
  hitRecords: HitRecord[];
  beatCV: number;
}

const GONGCHE_MAP: Record<string, number> = {
  '合': 0, '四': 1, '一': 2, '上': 3, '勾': 4,
  '尺': 5, '工': 6, '凡': 7, '六': 8, '五': 9,
  '乙': 10, '高上': 11, '高尺': 12, '高工': 13
};

export const SCORES: Score[] = [
  {
    id: 'luming',
    name: '鹿鸣',
    bpm: 72,
    totalBeats: 32,
    notes: [
      { instrument: Instrument.BIANZHONG, noteIndex: 0, startBeat: 0, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 4, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 7, startBeat: 8, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 12, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 0, startBeat: 16, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 2, startBeat: 20, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 7, startBeat: 24, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 28, duration: 4 },

      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 0, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 2, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 4, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 6, startBeat: 6, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 8, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 10, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 12, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 6, startBeat: 14, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 16, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 18, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 20, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 6, startBeat: 22, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 24, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 26, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 28, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 6, startBeat: 30, duration: 2 },

      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 0, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 2, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 3, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 4, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 6, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 8, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 9, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 10, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 2, startBeat: 12, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 14, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 16, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 17, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 18, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 20, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 21, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 22, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 2, startBeat: 24, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 26, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 27, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 28, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 30, duration: 2 },

      { instrument: Instrument.XIAO, noteIndex: 0, startBeat: 1, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 3, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 4, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 6, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 0, startBeat: 8, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 9, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 10, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 12, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 14, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 16, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 0, startBeat: 17, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 18, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 20, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 21, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 22, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 24, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 0, startBeat: 26, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 27, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 28, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 30, duration: 2 },
    ]
  },
  {
    id: 'guanju',
    name: '关雎',
    bpm: 66,
    totalBeats: 32,
    notes: [
      { instrument: Instrument.BIANZHONG, noteIndex: 0, startBeat: 0, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 2, startBeat: 4, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 8, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 7, startBeat: 12, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 16, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 2, startBeat: 20, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 0, startBeat: 24, duration: 4 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 28, duration: 4 },

      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 0, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 3, startBeat: 2, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 4, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 6, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 8, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 5, startBeat: 10, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 12, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 3, startBeat: 14, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 16, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 3, startBeat: 18, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 20, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 5, startBeat: 22, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 24, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 26, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 3, startBeat: 28, duration: 2 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 30, duration: 2 },

      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 0, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 2, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 3, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 4, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 6, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 8, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 9, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 10, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 12, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 13, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 14, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 16, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 18, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 2, startBeat: 20, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 21, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 22, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 24, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 25, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 26, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 28, duration: 2 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 30, duration: 2 },

      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 0.5, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 2.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 3.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 4.5, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 6.5, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 8.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 9.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 10.5, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 12.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 13.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 0, startBeat: 14.5, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 16.5, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 18.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 19.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 0, startBeat: 20.5, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 22.5, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 24.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 25.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 26.5, duration: 2 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 28.5, duration: 2 },
    ]
  },
  {
    id: 'fatan',
    name: '伐檀',
    bpm: 96,
    totalBeats: 32,
    notes: [
      { instrument: Instrument.BIANZHONG, noteIndex: 0, startBeat: 0, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 2, startBeat: 2, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 4, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 0, startBeat: 6, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 7, startBeat: 8, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 10, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 2, startBeat: 12, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 0, startBeat: 14, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 16, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 7, startBeat: 18, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 20, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 2, startBeat: 22, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 0, startBeat: 24, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 4, startBeat: 26, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 7, startBeat: 28, duration: 2 },
      { instrument: Instrument.BIANZHONG, noteIndex: 0, startBeat: 30, duration: 2 },

      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 0, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 1, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 2, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 6, startBeat: 3, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 4, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 5, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 6, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 7, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 8, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 6, startBeat: 9, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 10, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 11, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 12, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 13, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 14, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 6, startBeat: 15, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 16, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 17, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 18, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 6, startBeat: 19, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 20, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 21, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 22, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 23, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 24, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 6, startBeat: 25, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 2, startBeat: 26, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 27, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 28, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 4, startBeat: 29, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 0, startBeat: 30, duration: 1 },
      { instrument: Instrument.BIANQING, noteIndex: 6, startBeat: 31, duration: 1 },

      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 0, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 1, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 2, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 3, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 4, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 5, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 6, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 7, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 8, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 9, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 10, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 11, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 12, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 2, startBeat: 13, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 14, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 15, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 16, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 17, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 18, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 19, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 20, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 21, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 22, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 23, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 24, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 25, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 2, startBeat: 26, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 3, startBeat: 27, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 28, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 6, startBeat: 29, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 5, startBeat: 30, duration: 1 },
      { instrument: Instrument.GUQIN, noteIndex: 4, startBeat: 31, duration: 1 },

      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 0.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 1.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 2.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 3.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 4.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 5.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 6.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 7.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 0, startBeat: 8.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 9.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 10.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 11.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 12.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 13.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 0, startBeat: 14.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 15.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 16.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 17.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 18.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 19.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 20.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 21.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 22.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 23.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 0, startBeat: 24.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 25.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 26.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 5, startBeat: 27.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 4, startBeat: 28.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 29.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 0, startBeat: 30.5, duration: 1 },
      { instrument: Instrument.XIAO, noteIndex: 2, startBeat: 31.5, duration: 1 },
    ]
  }
];

export class ScorePlayer {
  private score: Score;
  private startTime: number = 0;
  private _isPlaying: boolean = false;
  private _currentBeat: number = 0;
  private beatDuration: number;

  constructor(score: Score) {
    this.score = score;
    this.beatDuration = 60 / score.bpm;
  }

  start(audioTime: number): void {
    this.startTime = audioTime;
    this._isPlaying = true;
    this._currentBeat = 0;
  }

  stop(): void {
    this._isPlaying = false;
    this._currentBeat = 0;
  }

  update(audioTime: number): void {
    if (!this._isPlaying) return;
    const elapsed = audioTime - this.startTime;
    this._currentBeat = elapsed / this.beatDuration;
    if (this._currentBeat >= this.score.totalBeats) {
      this._isPlaying = false;
    }
  }

  isPlaying(): boolean {
    return this._isPlaying;
  }

  getCurrentBeat(): number {
    return this._currentBeat;
  }

  isFinished(): boolean {
    return this._currentBeat >= this.score.totalBeats;
  }

  getActiveNotes(): ScoreNote[] {
    const beat = this._currentBeat;
    const window = 0.5;
    return this.score.notes.filter(n =>
      Math.abs(n.startBeat - beat) < window
    );
  }

  getUpcomingNotes(): ScoreNote[] {
    const beat = this._currentBeat;
    return this.score.notes.filter(n =>
      n.startBeat >= beat && n.startBeat < beat + 2
    ).sort((a, b) => a.startBeat - b.startBeat);
  }

  getBeatDuration(): number {
    return this.beatDuration;
  }

  getScore(): Score {
    return this.score;
  }
}

export class ScoreEvaluator {
  private hitRecords: HitRecord[] = [];
  private expectedNotes: ScoreNote[];

  constructor(score: Score) {
    this.expectedNotes = [...score.notes].sort((a, b) => a.startBeat - b.startBeat);
  }

  recordHit(instrument: Instrument, noteIndex: number, actualBeat: number, beatDuration: number): void {
    const expected = this.expectedNotes.find(n =>
      n.instrument === instrument &&
      n.noteIndex === noteIndex &&
      !this.hitRecords.some(r =>
        r.instrument === instrument &&
        r.noteIndex === noteIndex &&
        Math.abs(r.expectedTime - n.startBeat * beatDuration) < 0.01
      )
    );

    if (expected) {
      const expectedTime = expected.startBeat * beatDuration;
      const actualTime = actualBeat * beatDuration;
      const deviation = (actualTime - expectedTime) * 1000;
      this.hitRecords.push({
        noteIndex,
        instrument,
        expectedTime,
        actualTime,
        deviation,
        correct: Math.abs(noteIndex - expected.noteIndex) === 0 && Math.abs(deviation) < 200
      });
    }
  }

  evaluate(instrumentLevels: Map<Instrument, number>): EvaluationResult {
    const totalNotes = this.expectedNotes.length;
    const hitCount = this.hitRecords.filter(r => r.correct).length;
    const accuracy = totalNotes > 0 ? hitCount / totalNotes : 0;

    const deviations = this.hitRecords.map(r => r.deviation);
    const avgDeviation = deviations.length > 0
      ? deviations.reduce((s, d) => s + Math.abs(d), 0) / deviations.length
      : 200;
    const rhythmScore = Math.max(0, 1 - avgDeviation / 200);

    const levels = [Instrument.BIANZHONG, Instrument.BIANQING, Instrument.GUQIN, Instrument.XIAO]
      .map(i => instrumentLevels.get(i) || 0)
      .filter(l => l > 0);
    const avgLevel = levels.length > 0 ? levels.reduce((s, l) => s + l, 0) / levels.length : 0;
    const maxDev = levels.length > 0 ? Math.max(...levels.map(l => Math.abs(l - avgLevel))) : 0;
    const fusionScore = avgLevel > 0 ? Math.max(0, 1 - maxDev / (avgLevel * 0.15)) : 0;

    const totalScore = accuracy * 0.5 + rhythmScore * 0.3 + fusionScore * 0.2;

    let rank: string;
    if (accuracy > 0.9) rank = '天籁';
    else if (accuracy > 0.75) rank = '清雅';
    else if (accuracy > 0.6) rank = '合律';
    else rank = '失调';

    const reviews: string[] = [
      '宫商谐畅，声振林木',
      '八音克谐，神人以和',
      '清商随风发，一曲动四方',
      '丝竹管弦，洋洋乎盈耳',
      '雅乐正声，金石和鸣',
      '黄钟大吕，正音堂皇',
      '泠泠七弦上，静听松风寒',
      '大音希声，余韵绕梁',
      '箫韶九成，凤凰来仪',
      '乐者天地之和也'
    ];
    const review = reviews[Math.floor(totalScore * reviews.length)] || reviews[reviews.length - 1];

    const mean = deviations.length > 0 ? deviations.reduce((s, d) => s + d, 0) / deviations.length : 0;
    const variance = deviations.length > 0
      ? deviations.reduce((s, d) => s + (d - mean) ** 2, 0) / deviations.length
      : 0;
    const beatCV = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 999;

    return {
      accuracy,
      rhythmScore,
      fusionScore,
      totalScore,
      rank,
      review,
      hitRecords: this.hitRecords,
      beatCV
    };
  }
}
