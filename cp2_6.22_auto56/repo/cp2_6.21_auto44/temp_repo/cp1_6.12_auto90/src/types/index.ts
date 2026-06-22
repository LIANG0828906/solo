export interface User {
  id: string;
  name: string;
}

export type DeskOrientation = 'east' | 'south' | 'west' | 'north';
export type PlantPreference = 'succulent' | 'pothos' | 'cactus' | 'none';
export type SnackFlavor = 'sweet' | 'salty' | 'spicy' | 'mixed';
export type LightType = 'natural' | 'warm' | 'cool';
export type RestPreference = 'window' | 'door' | 'away';

export interface UserPreferences {
  deskOrientation: DeskOrientation;
  temperature: number;
  screenBrightness: number;
  plantPreference: PlantPreference;
  snackFlavor: SnackFlavor;
  noiseTolerance: number;
  lightType: LightType;
  restPreference: RestPreference;
}

export interface PreferenceRecord {
  id: string;
  userId: string;
  seatX: number;
  seatY: number;
  preferences: UserPreferences;
  updatedAt: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  deskOrientation: 'south',
  temperature: 24,
  screenBrightness: 70,
  plantPreference: 'succulent',
  snackFlavor: 'sweet',
  noiseTolerance: 4,
  lightType: 'natural',
  restPreference: 'window',
};

export const DESK_ORIENTATION_OPTIONS: { value: DeskOrientation; label: string }[] = [
  { value: 'east',  label: '朝东' },
  { value: 'south', label: '朝南' },
  { value: 'west',  label: '朝西' },
  { value: 'north', label: '朝北' },
];

export const PLANT_OPTIONS: { value: PlantPreference; label: string; emoji: string }[] = [
  { value: 'succulent', label: '多肉',   emoji: '🌵' },
  { value: 'pothos',    label: '绿萝',   emoji: '🌿' },
  { value: 'cactus',    label: '仙人掌', emoji: '🌵' },
  { value: 'none',      label: '不要植物', emoji: '❌' },
];

export const SNACK_OPTIONS: { value: SnackFlavor; label: string; emoji: string }[] = [
  { value: 'sweet', label: '甜',  emoji: '🍰' },
  { value: 'salty', label: '咸',  emoji: '🍿' },
  { value: 'spicy', label: '辣',  emoji: '🌶️' },
  { value: 'mixed', label: '混合', emoji: '🍱' },
];

export const LIGHT_OPTIONS: { value: LightType; label: string; color: string }[] = [
  { value: 'natural', label: '自然光', color: '#FFF8E7' },
  { value: 'warm',    label: '暖光',   color: '#FFD9A0' },
  { value: 'cool',    label: '冷光',   color: '#C8E6FF' },
];

export const REST_OPTIONS: { value: RestPreference; label: string }[] = [
  { value: 'window', label: '靠窗' },
  { value: 'door',   label: '靠门' },
  { value: 'away',   label: '远离通道' },
];
