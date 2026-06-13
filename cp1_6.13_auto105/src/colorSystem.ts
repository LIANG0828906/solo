export interface VoxelColor {
  hex: string;
  hsl: { h: number; s: number; l: number };
  name: string;
}

export class ColorSystem {
  private presetColors: VoxelColor[] = [];
  private currentColorIndex: number = 0;
  private currentCustomColor: string = '#FF3D3D';
  private useCustomColor: boolean = false;
  private emissiveIntensity: number = 1.0;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.generateRainbowColors();
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x: number) => {
      const hex = Math.round(255 * x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
  }

  private generateRainbowColors(): void {
    const hueSteps = [0, 30, 55, 110, 160, 195, 220, 255, 285, 315, 340, 355];
    const saturation = 85;
    const lightness = 90;
    const names = [
      '深红', '橙红', '金黄', '翠绿', '青蓝',
      '天蓝', '靛蓝', '蓝紫', '洋红', '品红', '玫红', '绯红'
    ];

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
