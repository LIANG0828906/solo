export interface VoxelColor {
  hex: string;
  hsl: { h: number; s: number; l: number };
  name: string;
}

export class ColorSystem {
  private presetColors: VoxelColor[] = [];
  private currentColorIndex: number = 0;
  private currentCustomColor: string = '#FF6B6B';
  private useCustomColor: boolean = false;
  private emissiveIntensity: number = 1.0;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.generateRainbowColors();
  }

  private hslToHex(h: number, s: number, l: number): string {
    const sat = 85;
    const light = 90;
    const sNorm = sat / 100;
    const lNorm = light / 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = sNorm * Math.min(lNorm, 1 - lNorm);
    const f = (n: number) =>
      lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x: number) => {
      const hex = Math.round(255 * x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
  }

  private generateRainbowColors(): void {
    const hueSteps = [0, 30, 60, 120, 210, 240, 270];
    const saturation = 85;
    const lightness = 90;
    const names = ['红', '橙', '黄', '绿', '蓝', '靛', '紫'];

    this.presetColors = hueSteps.map((h, i) => ({
      hex: this.hslToHex(h, saturation, lightness),
      hsl: { h, s: saturation, l: lightness },
      name: names[i]
    }));
  }

  getPresetColors(): VoxelColor[] {
    return [...this.presetColors];
  }

  getCurrentColor(): string {
    if (this.useCustomColor) {
      return this.currentCustomColor;
    }
    return this.presetColors[this.currentColorIndex].hex;
  }

  getCurrentColorIndex(): number {
    return this.currentColorIndex;
  }

  isUsingCustomColor(): boolean {
    return this.useCustomColor;
  }

  selectPresetColor(index: number): void {
    if (index < 0 || index >= this.presetColors.length) return;
    this.currentColorIndex = index;
    this.useCustomColor = false;
    this.notifyListeners();
  }

  setCustomColor(hex: string): void {
    const normalized = hex.toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(normalized)) return;
    this.currentCustomColor = normalized;
    this.useCustomColor = true;
    this.notifyListeners();
  }

  getEmissiveIntensity(): number {
    return this.emissiveIntensity;
  }

  setEmissiveIntensity(value: number): void {
    const clamped = Math.max(0.5, Math.min(2.0, value));
    this.emissiveIntensity = clamped;
    this.notifyListeners();
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb());
  }
}
