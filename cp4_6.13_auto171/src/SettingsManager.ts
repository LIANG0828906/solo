export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  beatIndicator: boolean;
  highScore: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 70,
  sfxVolume: 80,
  beatIndicator: true,
  highScore: 0
};

const STORAGE_KEY = 'rhythm-space-shooter-settings';

export class SettingsManager {
  private settings: GameSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage');
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage');
    }
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  setMusicVolume(value: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(100, value));
    this.saveSettings();
  }

  setSfxVolume(value: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(100, value));
    this.saveSettings();
  }

  setBeatIndicator(enabled: boolean): void {
    this.settings.beatIndicator = enabled;
    this.saveSettings();
  }

  setHighScore(score: number): void {
    if (score > this.settings.highScore) {
      this.settings.highScore = score;
      this.saveSettings();
    }
  }

  getMusicVolumeNormalized(): number {
    return this.settings.musicVolume / 100;
  }

  getSfxVolumeNormalized(): number {
    return this.settings.sfxVolume / 100;
  }
}
