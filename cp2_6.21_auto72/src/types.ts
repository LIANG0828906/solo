export type MusicianType = 'drummer' | 'bassist' | 'guitarist' | 'keyboardist';
export type MusicGenre = 'blues' | 'funk' | 'rock' | 'reggae';
export type ChordType = 'major' | 'minor' | 'seventh' | 'minor7' | 'major7';
export type TimeSignature = '4/4' | '3/4' | '6/8';

export interface MusicianConfig {
  id: MusicianType;
  name: string;
  volume: number;
  rhythmShift: number;
  genre: MusicGenre;
  complexity: number;
  rhythmPattern: number;
  rootNote: string;
  chordType: ChordType;
  timeSignature: TimeSignature;
  solo: boolean;
}

export interface BandState {
  musicians: Record<MusicianType, MusicianConfig>;
  selectedMusician: MusicianType | null;
  isPlaying: boolean;
  bpm: number;
  masterVolume: number;
}

export interface BandActions {
  selectMusician: (id: MusicianType | null) => void;
  updateMusician: (id: MusicianType, patch: Partial<MusicianConfig>) => void;
  togglePlay: () => void;
  setBpm: (bpm: number) => void;
  setMasterVolume: (volume: number) => void;
  toggleSolo: (id: MusicianType) => void;
}

export const MUSICIAN_TYPES: MusicianType[] = ['drummer', 'bassist', 'guitarist', 'keyboardist'];

export const GENRES: MusicGenre[] = ['blues', 'funk', 'rock', 'reggae'];
export const GENRE_LABELS: Record<MusicGenre, string> = {
  blues: '布鲁斯',
  funk: '放克',
  rock: '摇滚',
  reggae: '雷鬼'
};

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHORD_TYPES: ChordType[] = ['major', 'minor', 'seventh', 'minor7', 'major7'];
export const CHORD_LABELS: Record<ChordType, string> = {
  major: '大三和弦',
  minor: '小三和弦',
  seventh: '属七和弦',
  minor7: '小七和弦',
  major7: '大七和弦'
};

export const TIME_SIGNATURES: TimeSignature[] = ['4/4', '3/4', '6/8'];

export const MUSICIAN_LABELS: Record<MusicianType, string> = {
  drummer: '鼓手',
  bassist: '贝斯手',
  guitarist: '吉他手',
  keyboardist: '键盘手'
};

export const RHYTHM_PATTERNS = 6;
