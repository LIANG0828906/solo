import { Color, FilterOptions, HSL, HueCategory, HUE_CATEGORY_RANGES } from './types';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => {
    const hex = Math.round(255 * x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function hexToHsl(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export class PaletteManager {
  private colors: Color[] = [];
  private selectedColorId: string | null = null;

  constructor(initialColors: Color[] = []) {
    this.colors = [...initialColors];
  }

  addColor(color: Omit<Color, 'id'>): Color {
    const newColor: Color = {
      ...color,
      id: generateId(),
    };
    this.colors.push(newColor);
    return newColor;
  }

  addColorFromHSL(hsl: HSL, name?: string): Color {
    const hex = hslToHex(hsl.h, hsl.s, hsl.l);
    return this.addColor({ hex, hsl, name });
  }

  addColorFromHex(hex: string, name?: string): Color {
    const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
    const hsl = hexToHsl(normalizedHex);
    return this.addColor({ hex: normalizedHex, hsl, name });
  }

  removeColor(id: string): void {
    this.colors = this.colors.filter((c) => c.id !== id);
    if (this.selectedColorId === id) {
      this.selectedColorId = null;
    }
  }

  getColors(): Color[] {
    return [...this.colors];
  }

  getColorById(id: string): Color | undefined {
    return this.colors.find((c) => c.id === id);
  }

  setSelectedColor(id: string | null): void {
    if (id === null || this.colors.some((c) => c.id === id)) {
      this.selectedColorId = id;
    }
  }

  getSelectedColor(): Color | undefined {
    if (this.selectedColorId === null) return undefined;
    return this.getColorById(this.selectedColorId);
  }

  getSelectedColorId(): string | null {
    return this.selectedColorId;
  }

  getHueCategory(h: number): HueCategory {
    for (const [cat, [start, end]] of Object.entries(HUE_CATEGORY_RANGES)) {
      if (h >= start && h < end) return cat as HueCategory;
    }
    return 'red';
  }

  filterByHueCategory(category: HueCategory | 'all'): Color[] {
    if (category === 'all') return this.getColors();
    const [start, end] = HUE_CATEGORY_RANGES[category];
    return this.colors.filter((c) => c.hsl.h >= start && c.hsl.h < end);
  }

  filterBySaturation(level: 'high' | 'low' | 'all'): Color[] {
    if (level === 'all') return this.getColors();
    if (level === 'high') return this.colors.filter((c) => c.hsl.s >= 60);
    return this.colors.filter((c) => c.hsl.s < 60);
  }

  filterByLightness(level: 'high' | 'low' | 'all'): Color[] {
    if (level === 'all') return this.getColors();
    if (level === 'high') return this.colors.filter((c) => c.hsl.l >= 60);
    return this.colors.filter((c) => c.hsl.l < 60);
  }

  sortByHue(colors: Color[] = this.colors): Color[] {
    return [...colors].sort((a, b) => a.hsl.h - b.hsl.h);
  }

  sortBySaturation(colors: Color[] = this.colors): Color[] {
    return [...colors].sort((a, b) => b.hsl.s - a.hsl.s);
  }

  sortByLightness(colors: Color[] = this.colors): Color[] {
    return [...colors].sort((a, b) => a.hsl.l - b.hsl.l);
  }

  getColorsWithFilters(filters: FilterOptions): Color[] {
    let result = this.getColors();

    if (filters.hueCategory !== 'all') {
      const [start, end] = HUE_CATEGORY_RANGES[filters.hueCategory];
      result = result.filter((c) => c.hsl.h >= start && c.hsl.h < end);
    }

    if (filters.saturation === 'high') {
      result = result.filter((c) => c.hsl.s >= 60);
    } else if (filters.saturation === 'low') {
      result = result.filter((c) => c.hsl.s < 60);
    }

    if (filters.lightness === 'high') {
      result = result.filter((c) => c.hsl.l >= 60);
    } else if (filters.lightness === 'low') {
      result = result.filter((c) => c.hsl.l < 60);
    }

    return this.sortByHue(result);
  }

  updateColor(id: string, updates: Partial<Omit<Color, 'id'>>): Color | undefined {
    const index = this.colors.findIndex((c) => c.id === id);
    if (index === -1) return undefined;
    const updated = { ...this.colors[index], ...updates };
    if (updates.hsl) {
      updated.hex = hslToHex(updates.hsl.h, updates.hsl.s, updates.hsl.l);
    } else if (updates.hex) {
      updated.hsl = hexToHsl(updates.hex);
    }
    this.colors[index] = updated;
    return updated;
  }

  clear(): void {
    this.colors = [];
    this.selectedColorId = null;
  }
}
