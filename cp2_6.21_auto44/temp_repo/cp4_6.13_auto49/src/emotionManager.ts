import { create } from 'zustand';
import {
  EmotionType,
  generatePlanet,
  PlanetData,
  EMOTION_LABELS
} from './planetGenerator';

export interface WeatherData {
  type: 'sunny' | 'misty' | 'starry' | 'quiet';
  description: string;
  icon: string;
}

export const EMOTION_ANGLES: Record<EmotionType, number> = {
  joy: 0,
  miss: 90,
  adventure: 270,
  contemplation: 180
};

interface EmotionState {
  currentSeed: number;
  currentPlanet: PlanetData | null;
  emotionDistribution: Record<EmotionType, number>;
  weather: WeatherData;
  clickHistory: EmotionType[];
  compassAngle: number;
  isCompassGlowing: boolean;
  generateNewPlanet: () => void;
  registerEmotionClick: (emotion: EmotionType) => void;
  triggerCompassGlow: () => void;
  getEmotionLabel: (emotion: EmotionType) => string;
}

function generateWeather(
  distribution: Record<EmotionType, number>
): WeatherData {
  let maxEmotion: EmotionType = 'joy';
  let maxValue = -1;
  (Object.keys(distribution) as EmotionType[]).forEach((e) => {
    if (distribution[e] > maxValue) {
      maxValue = distribution[e];
      maxEmotion = e;
    }
  });

  const weatherMap: Record<EmotionType, WeatherData> = {
    joy: {
      type: 'sunny',
      description: '阳光明媚，星光温暖',
      icon: '☀️'
    },
    miss: {
      type: 'misty',
      description: '薄雾笼罩，思念绵长',
      icon: '🌫️'
    },
    adventure: {
      type: 'starry',
      description: '繁星满天，冒险启程',
      icon: '✨'
    },
    contemplation: {
      type: 'quiet',
      description: '静谧深邃，思绪悠远',
      icon: '🌙'
    }
  };

  return weatherMap[maxEmotion];
}

function getInitialPlanet(): { seed: number; planet: PlanetData } {
  const seed = Math.floor(Math.random() * 1000000);
  const planet = generatePlanet(seed, 300);
  return { seed, planet };
}

const initial = getInitialPlanet();

export const useEmotionStore = create<EmotionState>((set, get) => ({
  currentSeed: initial.seed,
  currentPlanet: initial.planet,
  emotionDistribution: initial.planet.emotionDistribution,
  weather: generateWeather(initial.planet.emotionDistribution),
  clickHistory: [],
  compassAngle: 0,
  isCompassGlowing: false,

  generateNewPlanet: () => {
    const seed = Math.floor(Math.random() * 1000000);
    const planet = generatePlanet(seed, 300);
    set({
      currentSeed: seed,
      currentPlanet: planet,
      emotionDistribution: planet.emotionDistribution,
      weather: generateWeather(planet.emotionDistribution)
    });
  },

  registerEmotionClick: (emotion: EmotionType) => {
    const state = get();
    const targetAngle = EMOTION_ANGLES[emotion];
    let newAngle = state.compassAngle;
    const diff = ((targetAngle - newAngle + 540) % 360) - 180;
    newAngle = newAngle + diff;

    set({
      clickHistory: [...state.clickHistory, emotion],
      compassAngle: newAngle
    });
  },

  triggerCompassGlow: () => {
    set({ isCompassGlowing: true });
    setTimeout(() => set({ isCompassGlowing: false }), 500);
  },

  getEmotionLabel: (emotion: EmotionType) => EMOTION_LABELS[emotion]
}));
