import type { CharacterFeatures, CharacterData } from './types';
import { PixelRenderer } from './pixelRenderer';

const HAIR_COLOR_MAP: Record<string, string> = {
  '白发': '#ffffff',
  '银发': '#e0e0e0',
  '黑发': '#2c2c2c',
  '红发': '#e74c3c',
  '金发': '#f1c40f',
  '棕发': '#8b5a2b',
  '蓝发': '#3498db',
  '绿发': '#2ecc71',
  '紫发': '#9b59b6',
  '粉发': '#ff80ab',
};

const EYE_COLOR_MAP: Record<string, string> = {
  '红瞳': '#e74c3c',
  '蓝瞳': '#3498db',
  '绿瞳': '#2ecc71',
  '金瞳': '#f1c40f',
  '紫瞳': '#9b59b6',
  '棕瞳': '#8b5a2b',
  '黑瞳': '#2c2c2c',
};

const HAIR_STYLE_MAP: Record<string, number> = {
  '短发': 0,
  '长发': 1,
  '马尾': 2,
  '卷发': 3,
  '光头': 4,
  '精灵': 5,
  '尖耳': 5,
};

const CLOTHES_STYLE_MAP: Record<string, number> = {
  'T恤': 0,
  '休闲': 0,
  '铠甲': 1,
  '战士': 1,
  '长袍': 2,
  '法师': 2,
  '机甲': 3,
  '斗篷': 4,
  '刺客': 4,
};

const BACKGROUND_MAP: Record<string, { type: string; color: string }> = {
  '森林': { type: 'forest', color: '#2d5a27' },
  '太空': { type: 'space', color: '#1a1a2e' },
  '海洋': { type: 'ocean', color: '#1e3a5f' },
  '城市': { type: 'city', color: '#4a4a5a' },
  '火焰': { type: 'fire', color: '#5a2d1a' },
  '雪山': { type: 'snow', color: '#c5d0e0' },
};

const SKIN_COLORS = ['#f5d0a9', '#e0b080', '#c68642', '#8d5524', '#ffdbac', '#f1c27d'];

const HAIR_COLORS = Object.values(HAIR_COLOR_MAP);
const EYE_COLORS = Object.values(EYE_COLOR_MAP);
const CLOTHES_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];

export class CharacterFactory {
  private renderer: PixelRenderer;
  private currentFeatures: CharacterFeatures;

  constructor(renderer: PixelRenderer) {
    this.renderer = renderer;
    this.currentFeatures = this.createDefaultFeatures();
  }

  private createDefaultFeatures(): CharacterFeatures {
    return {
      hairStyle: 0,
      hairColor: '#2c2c2c',
      eyeColor: '#3498db',
      skinColor: '#f5d0a9',
      clothesStyle: 0,
      clothesColor: '#e74c3c',
      backgroundType: 'forest',
      backgroundColor: '#2d5a27',
    };
  }

  parseDescription(description: string): CharacterFeatures {
    const features = this.createDefaultFeatures();
    const keywords = description.split(/[，,、\s]+/).filter(k => k.length > 0);

    for (const keyword of keywords) {
      if (HAIR_COLOR_MAP[keyword]) {
        features.hairColor = HAIR_COLOR_MAP[keyword];
      }
      if (EYE_COLOR_MAP[keyword]) {
        features.eyeColor = EYE_COLOR_MAP[keyword];
      }
      if (HAIR_STYLE_MAP[keyword] !== undefined) {
        features.hairStyle = HAIR_STYLE_MAP[keyword];
      }
      if (CLOTHES_STYLE_MAP[keyword] !== undefined) {
        features.clothesStyle = CLOTHES_STYLE_MAP[keyword];
      }
      if (BACKGROUND_MAP[keyword]) {
        features.backgroundType = BACKGROUND_MAP[keyword].type;
        features.backgroundColor = BACKGROUND_MAP[keyword].color;
      }
    }

    features.skinColor = this.randomFromArray(SKIN_COLORS);

    let hasClothesColor = false;
    for (const keyword of keywords) {
      if (CLOTHES_STYLE_MAP[keyword] !== undefined) {
        hasClothesColor = true;
        break;
      }
    }
    if (!hasClothesColor) {
      features.clothesColor = this.randomFromArray(CLOTHES_COLORS);
    }

    let hasHairColor = false;
    for (const keyword of keywords) {
      if (HAIR_COLOR_MAP[keyword]) {
        hasHairColor = true;
        break;
      }
    }
    if (!hasHairColor) {
      features.hairColor = this.randomFromArray(HAIR_COLORS);
    }

    let hasEyeColor = false;
    for (const keyword of keywords) {
      if (EYE_COLOR_MAP[keyword]) {
        hasEyeColor = true;
        break;
      }
    }
    if (!hasEyeColor) {
      features.eyeColor = this.randomFromArray(EYE_COLORS);
    }

    let hasHairStyle = false;
    for (const keyword of keywords) {
      if (HAIR_STYLE_MAP[keyword] !== undefined) {
        hasHairStyle = true;
        break;
      }
    }
    if (!hasHairStyle) {
      features.hairStyle = Math.floor(Math.random() * 6);
    }

    let hasClothesStyle = false;
    for (const keyword of keywords) {
      if (CLOTHES_STYLE_MAP[keyword] !== undefined) {
        hasClothesStyle = true;
        break;
      }
    }
    if (!hasClothesStyle) {
      features.clothesStyle = Math.floor(Math.random() * 5);
    }

    let hasBackground = false;
    for (const keyword of keywords) {
      if (BACKGROUND_MAP[keyword]) {
        hasBackground = true;
        break;
      }
    }
    if (!hasBackground) {
      const bgKeys = Object.keys(BACKGROUND_MAP);
      const randomBg = bgKeys[Math.floor(Math.random() * bgKeys.length)];
      features.backgroundType = BACKGROUND_MAP[randomBg].type;
      features.backgroundColor = BACKGROUND_MAP[randomBg].color;
    }

    return features;
  }

  private randomFromArray<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  generateCharacter(name: string, description: string): { data: CharacterData; features: CharacterFeatures } {
    const features = this.parseDescription(description);
    this.currentFeatures = features;
    this.renderer.render(features);
    const avatarDataUrl = this.renderer.getDataUrl();

    const data: CharacterData = {
      id: this.generateId(),
      name,
      description,
      features: { ...features },
      avatarDataUrl,
      createdAt: Date.now(),
    };

    return { data, features };
  }

  private generateId(): string {
    return 'char_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
  }

  randomizeHairStyle(): void {
    this.currentFeatures.hairStyle = Math.floor(Math.random() * 6);
    this.renderer.render(this.currentFeatures);
  }

  randomizeHairColor(): void {
    this.currentFeatures.hairColor = this.randomFromArray(HAIR_COLORS);
    this.renderer.render(this.currentFeatures);
  }

  randomizeEyeColor(): void {
    this.currentFeatures.eyeColor = this.randomFromArray(EYE_COLORS);
    this.renderer.render(this.currentFeatures);
  }

  randomizeClothes(): void {
    this.currentFeatures.clothesStyle = Math.floor(Math.random() * 5);
    this.currentFeatures.clothesColor = this.randomFromArray(CLOTHES_COLORS);
    this.renderer.render(this.currentFeatures);
  }

  randomizeBackground(): void {
    const bgKeys = Object.keys(BACKGROUND_MAP);
    const randomBg = bgKeys[Math.floor(Math.random() * bgKeys.length)];
    this.currentFeatures.backgroundType = BACKGROUND_MAP[randomBg].type;
    this.currentFeatures.backgroundColor = BACKGROUND_MAP[randomBg].color;
    this.renderer.render(this.currentFeatures);
  }

  randomizeAll(): void {
    this.currentFeatures.hairStyle = Math.floor(Math.random() * 6);
    this.currentFeatures.hairColor = this.randomFromArray(HAIR_COLORS);
    this.currentFeatures.eyeColor = this.randomFromArray(EYE_COLORS);
    this.currentFeatures.skinColor = this.randomFromArray(SKIN_COLORS);
    this.currentFeatures.clothesStyle = Math.floor(Math.random() * 5);
    this.currentFeatures.clothesColor = this.randomFromArray(CLOTHES_COLORS);
    const bgKeys = Object.keys(BACKGROUND_MAP);
    const randomBg = bgKeys[Math.floor(Math.random() * bgKeys.length)];
    this.currentFeatures.backgroundType = BACKGROUND_MAP[randomBg].type;
    this.currentFeatures.backgroundColor = BACKGROUND_MAP[randomBg].color;
    this.renderer.render(this.currentFeatures);
  }

  getCurrentFeatures(): CharacterFeatures {
    return { ...this.currentFeatures };
  }

  getAvatarDataUrl(): string {
    return this.renderer.getDataUrl();
  }
}
