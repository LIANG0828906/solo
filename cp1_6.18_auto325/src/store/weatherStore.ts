import { create } from 'zustand';

export type Mood = 'happy' | 'calm' | 'sad' | 'angry' | 'anxious' | 'surprised';
export type Weather = 'sunny' | 'cloudy' | 'lightRain' | 'heavyRain' | 'snow' | 'thunderstorm';

export interface MoodCard {
  id: string;
  date: string;
  mood: Mood;
  weather: Weather;
  note: string;
  createdAt: number;
}

interface WeatherState {
  currentMood: Mood | null;
  currentWeather: Weather | null;
  cards: MoodCard[];
  setMood: (mood: Mood) => void;
  setWeather: (weather: Weather) => void;
  saveCard: (note: string) => void;
  getMonthCards: (year: number, month: number) => MoodCard[];
}

const STORAGE_KEY = 'emotion-weather-cards';

function loadCards(): MoodCard[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function persistCards(cards: MoodCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  currentMood: null,
  currentWeather: null,
  cards: loadCards(),
  setMood: (mood) => set({ currentMood: mood }),
  setWeather: (weather) => set({ currentWeather: weather }),
  saveCard: (note) => {
    const { currentMood, currentWeather, cards } = get();
    if (!currentMood || !currentWeather) return;
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newCard: MoodCard = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      date,
      mood: currentMood,
      weather: currentWeather,
      note: note.slice(0, 50),
      createdAt: Date.now(),
    };
    const updated = [...cards, newCard];
    persistCards(updated);
    set({ cards: updated });
  },
  getMonthCards: (year, month) => {
    const { cards } = get();
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return cards.filter((card) => card.date.startsWith(prefix));
  },
}));
