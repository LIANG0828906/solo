export interface Constellation {
  id: string;
  name: string;
  pinyin: string;
  element: string;
  x: number;
  y: number;
  size: number;
  color: string;
  lines: string[];
  description: string;
}

export interface CelestialEvent {
  id: string;
  type: 'meteor' | 'comet' | 'eclipse' | 'starfall' | 'battle' | 'destruction';
  name: string;
  description: string;
  constellationId: string;
  correctInscription: string;
  options: { constellationId: string; inscription: string; isCorrect: boolean }[];
  difficulty: number;
  timeLimit: number;
}

export interface Inscription {
  id: string;
  text: string;
  meaning: string;
  element: string;
}

export interface StarOfficer {
  name: string;
  cultivation: number;
  rank: string;
  accuracy: number;
  totalEvents: number;
  correctEvents: number;
  daysInCurrentXun: number;
}

export interface Weather {
  type: 'clear' | 'rain' | 'thunder';
  name: string;
  icon: string;
  modifier: number;
}

export interface XunScore {
  totalScore: number;
  accuracyScore: number;
  cultivationScore: number;
  eventScore: number;
  rank: string;
  comment: string;
}

export interface GameState {
  currentEvent: CelestialEvent | null;
  starOfficer: StarOfficer;
  weather: Weather;
  constellations: Constellation[];
  selectedConstellation: Constellation | null;
  showEventModal: boolean;
  showScorePage: boolean;
  xunScore: XunScore | null;
  countdown: number;
  flashConstellation: string | null;
  flowLines: { from: string; to: string; progress: number }[];
  gamePhase: 'playing' | 'scoring' | 'event';
}
