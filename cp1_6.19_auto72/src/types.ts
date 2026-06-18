export enum MoodLevel {
  Sunny = 0,
  Cloudy = 1,
  Overcast = 2,
  LightRain = 3,
  HeavyRain = 4,
  Thunderstorm = 5,
}

export interface MoodConfig {
  level: MoodLevel;
  name: string;
  emoji: string;
  gradient: string;
  gradientType: 'linear' | 'radial';
  autoText: string;
  color: string;
}

export interface MoodRecord {
  date: string;
  level: MoodLevel;
  text: string;
  createdAt: number;
}

export const MOOD_CONFIGS: MoodConfig[] = [
  {
    level: MoodLevel.Sunny,
    name: '晴',
    emoji: '☀️',
    gradient: 'radial-gradient(circle, #FFD700, #FFA500)',
    gradientType: 'radial',
    autoText: '今天心情像阳光一样灿烂',
    color: '#FFA500',
  },
  {
    level: MoodLevel.Cloudy,
    name: '多云',
    emoji: '⛅',
    gradient: 'linear-gradient(135deg, #B0C4DE, #778899)',
    gradientType: 'linear',
    autoText: '云淡风轻，平静而惬意',
    color: '#778899',
  },
  {
    level: MoodLevel.Overcast,
    name: '阴',
    emoji: '☁️',
    gradient: 'linear-gradient(135deg, #696969, #A9A9A9)',
    gradientType: 'linear',
    autoText: '心情有些低沉，但会好起来的',
    color: '#808080',
  },
  {
    level: MoodLevel.LightRain,
    name: '小雨',
    emoji: '🌧️',
    gradient: 'linear-gradient(135deg, #87CEEB, #4682B4)',
    gradientType: 'linear',
    autoText: '有些许心事，像细雨绵绵',
    color: '#4682B4',
  },
  {
    level: MoodLevel.HeavyRain,
    name: '大雨',
    emoji: '🌧️',
    gradient: 'linear-gradient(135deg, #4169E1, #00008B)',
    gradientType: 'linear',
    autoText: '心情像大雨滂沱，需要宣泄',
    color: '#00008B',
  },
  {
    level: MoodLevel.Thunderstorm,
    name: '雷电',
    emoji: '⛈️',
    gradient: 'linear-gradient(135deg, #4B0082, #8B0000)',
    gradientType: 'linear',
    autoText: '内心波澜起伏，像雷雨交加',
    color: '#8B0000',
  },
];

export function getMoodConfig(level: MoodLevel): MoodConfig {
  return MOOD_CONFIGS.find((c) => c.level === level) || MOOD_CONFIGS[MoodLevel.Overcast];
}
