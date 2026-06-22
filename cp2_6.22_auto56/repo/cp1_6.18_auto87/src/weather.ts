import { v4 as uuidv4 } from 'uuid';
import type { MoodType, DiaryEntry } from './data';
import { MOOD_SCORES, getDominantMood, getEntriesByDate } from './data';

export type WeatherElementType = 'sun' | 'moon' | 'rain' | 'snow' | 'thunder' | 'cloud';

export interface WeatherElement {
  id: string;
  type: WeatherElementType;
  x: number;
  y: number;
  size: number;
  opacity: number;
  date: string;
  mood: MoodType;
  zIndex: number;
}

export interface DecorationElement {
  id: string;
  type: 'cloud' | 'star';
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
}

export interface WeatherConfig {
  gradientStart: string;
  gradientEnd: string;
  elements: WeatherElement[];
  decorations: DecorationElement[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function interpolateColor(color1: string, color2: string, ratio: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = c1.r + (c2.r - c1.r) * ratio;
  const g = c1.g + (c2.g - c1.g) * ratio;
  const b = c1.b + (c2.b - c1.b) * ratio;
  return rgbToHex(r, g, b);
}

function moodToWeatherType(mood: MoodType): WeatherElementType {
  switch (mood) {
    case 'happy':
      return 'sun';
    case 'calm':
      return 'cloud';
    case 'irritated':
      return 'thunder';
    case 'sad':
      return 'rain';
    case 'anxious':
      return 'cloud';
    case 'tired':
      return 'moon';
    default:
      return 'cloud';
  }
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function calculateGradient(avgScore: number): { start: string; end: string } {
  const ratio = (avgScore - 2) / 8;
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  const deepNight = '#0B1026';
  const duskPurple = '#1A1A3E';
  const dawnPink = '#FFB199';
  const warmOrange = '#FF7E5F';

  if (clampedRatio < 0.33) {
    const localRatio = clampedRatio / 0.33;
    return {
      start: interpolateColor(deepNight, duskPurple, localRatio),
      end: interpolateColor('#1E3A5F', '#4A6FA5', localRatio),
    };
  } else if (clampedRatio < 0.66) {
    const localRatio = (clampedRatio - 0.33) / 0.33;
    return {
      start: interpolateColor(duskPurple, '#87CEEB', localRatio),
      end: interpolateColor('#4A6FA5', dawnPink, localRatio),
    };
  } else {
    const localRatio = (clampedRatio - 0.66) / 0.34;
    return {
      start: interpolateColor('#87CEEB', '#FFD89B', localRatio),
      end: interpolateColor(dawnPink, warmOrange, localRatio),
    };
  }
}

export function generateWeatherElements(entries: DiaryEntry[]): WeatherElement[] {
  const elements: WeatherElement[] = [];
  const dates = [...new Set(entries.map((e) => e.date))].sort();

  dates.forEach((date, index) => {
    const dayEntries = getEntriesByDate(entries, date);
    const dominantMood = getDominantMood(dayEntries);
    const weatherType = moodToWeatherType(dominantMood);
    const dayScore = dayEntries.reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / dayEntries.length;

    const baseX = 10 + (index / 6) * 80 + randomRange(-5, 5);
    const baseY = 25 + randomRange(-15, 15);
    const baseSize = weatherType === 'sun' || weatherType === 'moon' ? 70 : 50;

    if (weatherType === 'rain' || weatherType === 'snow') {
      const count = 5 + Math.floor(dayScore < 5 ? 5 : 3);
      for (let i = 0; i < count; i++) {
        elements.push({
          id: uuidv4(),
          type: weatherType,
          x: baseX + randomRange(-10, 10),
          y: baseY + randomRange(-10, 20),
          size: baseSize * randomRange(0.4, 0.7),
          opacity: randomRange(0.6, 0.9),
          date,
          mood: dominantMood,
          zIndex: Math.floor(randomRange(1, 10)),
        });
      }
    } else if (weatherType === 'thunder') {
      elements.push({
        id: uuidv4(),
        type: 'thunder',
        x: baseX,
        y: baseY,
        size: baseSize * 1.2,
        opacity: 0.9,
        date,
        mood: dominantMood,
        zIndex: 5,
      });
      for (let i = 0; i < 3; i++) {
        elements.push({
          id: uuidv4(),
          type: 'rain',
          x: baseX + randomRange(-8, 8),
          y: baseY + randomRange(5, 15),
          size: 30,
          opacity: randomRange(0.5, 0.8),
          date,
          mood: dominantMood,
          zIndex: 3,
        });
      }
    } else {
      elements.push({
        id: uuidv4(),
        type: weatherType,
        x: baseX,
        y: baseY,
        size: baseSize,
        opacity: 0.95,
        date,
        mood: dominantMood,
        zIndex: 5,
      });
    }
  });

  return elements.sort((a, b) => a.zIndex - b.zIndex);
}

export function generateDecorations(avgScore: number): DecorationElement[] {
  const decorations: DecorationElement[] = [];
  const isDark = avgScore < 5;

  const cloudCount = isDark ? 4 : 6;
  for (let i = 0; i < cloudCount; i++) {
    decorations.push({
      id: uuidv4(),
      type: 'cloud',
      x: randomRange(0, 100),
      y: randomRange(10, 60),
      size: randomRange(40, 80),
      opacity: randomRange(0.15, 0.35),
      delay: randomRange(0, 3),
      duration: randomRange(8, 15),
    });
  }

  if (isDark) {
    const starCount = 20 + Math.floor(randomRange(0, 15));
    for (let i = 0; i < starCount; i++) {
      decorations.push({
        id: uuidv4(),
        type: 'star',
        x: randomRange(0, 100),
        y: randomRange(5, 50),
        size: randomRange(2, 6),
        opacity: randomRange(0.3, 0.8),
        delay: randomRange(0, 2),
        duration: randomRange(2, 4),
      });
    }
  }

  return decorations;
}

export function generateWeatherConfig(entries: DiaryEntry[], avgScore: number): WeatherConfig {
  const gradient = calculateGradient(avgScore);
  const elements = generateWeatherElements(entries);
  const decorations = generateDecorations(avgScore);

  return {
    gradientStart: gradient.start,
    gradientEnd: gradient.end,
    elements,
    decorations,
  };
}
