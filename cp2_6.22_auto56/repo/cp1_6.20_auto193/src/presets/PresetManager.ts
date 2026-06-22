export type ThemeType = 'forest' | 'desert' | 'snow';
export type WeatherType = 'sunny' | 'rain' | 'snow' | 'sandstorm';
export type CharacterColor = 'red' | 'blue' | 'green';

export interface Preset {
  id: string;
  name: string;
  theme: ThemeType;
  weather: WeatherType;
  lightAngle: number;
  lightIntensity: number;
  characterColor: CharacterColor;
  createdAt: number;
}

const STORAGE_KEY = 'rpg_scene_presets';
const API_BASE = '/api/presets';

function generateId(): string {
  return 'preset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function readLocalPresets(): Preset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function writeLocalPresets(presets: Preset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export async function loadPresetList(): Promise<Preset[]> {
  try {
    const response = await fetch(API_BASE);
    if (response.ok) {
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const serverPresets = result.data as Preset[];
        if (serverPresets.length > 0) {
          return serverPresets;
        }
      }
    }
  } catch {
  }
  return readLocalPresets();
}

export async function savePreset(
  name: string,
  theme: ThemeType,
  weather: WeatherType,
  lightAngle: number,
  lightIntensity: number,
  characterColor: CharacterColor
): Promise<Preset> {
  const newPreset: Preset = {
    id: generateId(),
    name,
    theme,
    weather,
    lightAngle,
    lightIntensity,
    characterColor,
    createdAt: Date.now()
  };

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        theme,
        weather,
        lightAngle,
        lightIntensity,
        characterColor
      })
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const presets = readLocalPresets();
        presets.push(result.data as Preset);
        writeLocalPresets(presets);
        return result.data as Preset;
      }
    }
  } catch {
  }

  const presets = readLocalPresets();
  presets.push(newPreset);
  writeLocalPresets(presets);
  return newPreset;
}

export function loadPreset(id: string): Preset | null {
  const presets = readLocalPresets();
  return presets.find(p => p.id === id) || null;
}
