import { create } from 'zustand';
import axios from 'axios';
import type {
  RoutePoint,
  Route,
  Teammate,
  GearItem,
  WeatherData,
  ElevationPoint,
  CalorieData,
  UserProfile,
} from '../types';

interface RouteState {
  points: RoutePoint[];
  addPoint: (point: RoutePoint) => void;
  updatePoint: (index: number, point: RoutePoint) => void;
  removePoint: (index: number) => void;
  clearPoints: () => void;

  route: Route | null;
  setRoute: (route: Route) => void;

  teammates: Teammate[];
  addTeammate: (t: Teammate) => void;
  updateTeammate: (id: string, data: Partial<Teammate>) => void;
  removeTeammate: (id: string) => void;

  gearItems: GearItem[];
  toggleGearItem: (id: string) => void;
  setGearItems: (items: GearItem[]) => void;

  weatherData: WeatherData[];
  setWeatherData: (data: WeatherData[]) => void;

  elevationData: ElevationPoint[];
  setElevationData: (data: ElevationPoint[]) => void;

  calorieData: CalorieData[];
  setCalorieData: (data: CalorieData[]) => void;

  userProfile: UserProfile;
  setUserProfile: (profile: Partial<UserProfile>) => void;

  activityId: string | null;
  inviteCode: string | null;
  setActivity: (id: string, code: string) => void;

  isPanelExpanded: boolean;
  togglePanel: () => void;

  fetchWeather: (routeId: string) => Promise<void>;
  fetchGearList: () => Promise<void>;
  fetchCalories: (routeId: string, weight: number, packWeight: number) => Promise<void>;
  fetchElevation: (routeId: string) => Promise<void>;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  points: [],
  addPoint: (point) => set((state) => ({ points: [...state.points, point] })),
  updatePoint: (index, point) =>
    set((state) => {
      const newPoints = [...state.points];
      newPoints[index] = point;
      return { points: newPoints };
    }),
  removePoint: (index) =>
    set((state) => ({
      points: state.points.filter((_, i) => i !== index),
    })),
  clearPoints: () => set({ points: [] }),

  route: null,
  setRoute: (route) => set({ route }),

  teammates: [],
  addTeammate: (t) => set((state) => ({ teammates: [...state.teammates, t] })),
  updateTeammate: (id, data) =>
    set((state) => ({
      teammates: state.teammates.map((t) =>
        t.id === id ? { ...t, ...data } : t
      ),
    })),
  removeTeammate: (id) =>
    set((state) => ({
      teammates: state.teammates.filter((t) => t.id !== id),
    })),

  gearItems: [],
  toggleGearItem: (id) =>
    set((state) => ({
      gearItems: state.gearItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    })),
  setGearItems: (items) => set({ gearItems: items }),

  weatherData: [],
  setWeatherData: (data) => set({ weatherData: data }),

  elevationData: [],
  setElevationData: (data) => set({ elevationData: data }),

  calorieData: [],
  setCalorieData: (data) => set({ calorieData: data }),

  userProfile: {
    weight: 70,
    packWeight: 10,
    name: '徒步者',
    avatar: '🏔️',
  },
  setUserProfile: (profile) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    })),

  activityId: null,
  inviteCode: null,
  setActivity: (id, code) => set({ activityId: id, inviteCode: code }),

  isPanelExpanded: true,
  togglePanel: () =>
    set((state) => ({ isPanelExpanded: !state.isPanelExpanded })),

  fetchWeather: async (routeId) => {
    try {
      const response = await axios.get(`/api/routes/${routeId}/weather`);
      const apiData = response.data as Array<{
        date: string;
        temperature: { high: number; low: number };
        condition: string;
        precipitation: number;
      }>;
      const weatherData: WeatherData[] = apiData.map((item) => ({
        date: item.date,
        condition: item.condition,
        tempHigh: item.temperature.high,
        tempLow: item.temperature.low,
        rainProbability: Math.round(item.precipitation * 100),
      }));
      set({ weatherData });
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    }
  },

  fetchGearList: async () => {
    try {
      const response = await axios.get('/api/gear/default');
      const apiData = response.data as Array<{
        id: string;
        name: string;
        category: string;
        essential: boolean;
      }>;
      const gearItems: GearItem[] = apiData.map((item) => ({
        id: item.id,
        name: item.name,
        checked: item.essential,
        category: 'essentials',
      }));
      set({ gearItems });
    } catch (error) {
      console.error('Failed to fetch gear list:', error);
    }
  },

  fetchCalories: async (routeId, weight, packWeight) => {
    try {
      const response = await axios.post(`/api/routes/${routeId}/calories`, {
        weight,
        packWeight,
      });
      const apiData = response.data as Array<{
        segment: string;
        calories: number;
        duration: number;
      }>;
      const calorieData: CalorieData[] = apiData.map((item, index) => {
        const distance = (index + 1) * 2;
        const slope = 0;
        const isDifficult = false;
        return {
          distance,
          calories: item.calories,
          slope,
          isDifficult,
        };
      });
      set({ calorieData });
    } catch (error) {
      console.error('Failed to fetch calories:', error);
    }
  },

  fetchElevation: async (routeId) => {
    try {
      const response = await axios.get(`/api/routes/${routeId}/elevation`);
      const apiData = response.data as Array<{
        distance: number;
        elevation: number;
      }>;
      const elevationData: ElevationPoint[] = apiData.map((item, index, arr) => {
        const slope =
          index > 0 && arr[index - 1].distance !== item.distance
            ? Math.round(
                ((item.elevation - arr[index - 1].elevation) /
                  ((item.distance - arr[index - 1].distance) * 1000)) *
                  100 *
                  10
              ) / 10
            : 0;
        return {
          distance: item.distance,
          elevation: item.elevation,
          slope,
        };
      });
      set({ elevationData });
    } catch (error) {
      console.error('Failed to fetch elevation:', error);
    }
  },
}));

export default useRouteStore;
