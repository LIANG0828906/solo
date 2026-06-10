export type UrgencyLevel = 'normal' | 'urgent' | 'emergency';

export type WindDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type DecryptStep = 'idle' | 'fanqie' | 'wuxing' | 'complete';

export type EnemyCount = 'hundred' | 'thousand' | 'tenThousand';

export interface SignalTower {
  id: string;
  name: string;
  position: { x: number; y: number };
  isBurning: boolean;
  smokeCount: number;
  burningTime: number;
}

export interface MilitaryReport {
  id: string;
  encryptedText: string;
  plainText: string;
  urgency: UrgencyLevel;
  sourcePosition: { x: number; y: number };
  enemyCount: EnemyCount;
  receivedAt: number;
  decryptStartTime?: number;
  decryptEndTime?: number;
  isDecrypted: boolean;
  towerId?: string;
}

export interface WeatherData {
  windDirection: WindDirection;
  windSpeed: number;
}

export interface LogEntry {
  id: string;
  time: string;
  towerName: string;
  urgency: UrgencyLevel;
  content: string;
  timestamp: number;
}

export interface AppState {
  reports: MilitaryReport[];
  currentReport: MilitaryReport | null;
  towers: SignalTower[];
  decryptStep: DecryptStep;
  decryptProgress: number;
  mapZoom: number;
  mapOffset: { x: number; y: number };
  score: number;
  weather: WeatherData;
  logs: LogEntry[];
  selectedTower: string | null;
  showCourierEffect: boolean;
  fanqieResult: string;
  wuxingResult: string;
}

export interface EncryptResponse {
  report: MilitaryReport;
  weather: WeatherData;
}

export interface DecryptRequest {
  reportId: string;
  step: DecryptStep;
}

export interface DecryptResponse {
  success: boolean;
  plainText?: string;
  stepResult?: string;
  nextStep?: DecryptStep;
}

export const URGENCY_SMOKE_MAP: Record<UrgencyLevel, number> = {
  normal: 1,
  urgent: 3,
  emergency: 5,
};

export const URGENCY_LABEL_MAP: Record<UrgencyLevel, string> = {
  normal: '平报',
  urgent: '急报',
  emergency: '八百里加急',
};

export const URGENCY_COLOR_MAP: Record<UrgencyLevel, string> = {
  normal: '#f4d03f',
  urgent: '#e67e22',
  emergency: '#c0392b',
};

export const ENEMY_COUNT_LABEL_MAP: Record<EnemyCount, string> = {
  hundred: '百人',
  thousand: '千人',
  tenThousand: '万人',
};

export const WIND_DIRECTION_LABEL_MAP: Record<WindDirection, string> = {
  N: '北风',
  NE: '东北风',
  E: '东风',
  SE: '东南风',
  S: '南风',
  SW: '西南风',
  W: '西风',
  NW: '西北风',
};

export const WIND_DIRECTION_ANGLE_MAP: Record<WindDirection, number> = {
  N: 180,
  NE: 225,
  E: 270,
  SE: 315,
  S: 0,
  SW: 45,
  W: 90,
  NW: 135,
};

export const WUXING_MAP: Record<string, { num: number; dir: string }> = {
  金: { num: 1, dir: '西' },
  木: { num: 3, dir: '东' },
  水: { num: 2, dir: '北' },
  火: { num: 4, dir: '南' },
  土: { num: 5, dir: '中' },
};

export const FANQIE_MAP: Record<string, { sheng: string; yun: string }> = {
  火: { sheng: 'h', yun: 'uo' },
  生: { sheng: 'sh', yun: 'eng' },
  土: { sheng: 't', yun: 'u' },
  甲: { sheng: 'j', yun: 'ia' },
  子: { sheng: 'z', yun: 'i' },
  北: { sheng: 'b', yun: 'ei' },
  虏: { sheng: 'l', yun: 'u' },
  三: { sheng: 's', yun: 'an' },
  千: { sheng: 'q', yun: 'ian' },
  骑: { sheng: 'q', yun: 'i' },
  出: { sheng: 'ch', yun: 'u' },
  没: { sheng: 'm', yun: 'o' },
  金: { sheng: 'j', yun: 'in' },
  水: { sheng: 'sh', yun: 'ui' },
  木: { sheng: 'm', yun: 'u' },
  东: { sheng: 'd', yun: 'ong' },
  西: { sheng: 'x', yun: 'i' },
  南: { sheng: 'n', yun: 'an' },
  中: { sheng: 'zh', yun: 'ong' },
};
