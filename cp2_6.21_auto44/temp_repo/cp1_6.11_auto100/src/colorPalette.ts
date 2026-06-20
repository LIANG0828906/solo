export interface ColorSwatch {
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
}

const PRESET_COLORS: Array<{ name: string; hex: string }> = [
  { name: '朱红', hex: '#E74C3C' },
  { name: '橙', hex: '#F39C12' },
  { name: '黄', hex: '#F1C40F' },
  { name: '翠绿', hex: '#2ECC71' },
  { name: '天蓝', hex: '#3498DB' },
  { name: '靛蓝', hex: '#2E86C1' },
  { name: '紫', hex: '#9B59B6' },
  { name: '品红', hex: '#E91E63' },
  { name: '白', hex: '#ECF0F1' },
  { name: '黑', hex: '#2C3E50' },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

export class ColorPalette {
  public colors: ColorSwatch[] = [];
  public selectedIndex: number = 0;
  private gridElement: HTMLElement | null = null;

  constructor() {
    PRESET_COLORS.forEach((c) => this.colors.push(this.makeSwatch(c.name, c.hex)));
  }

  private makeSwatch(name: string, hex: string): ColorSwatch {
    const { r, g, b } = hexToRgb(hex);
    return { name, hex, r, g, b };
  }

  public bind(gridElement: HTMLElement): void {
    this.gridElement = gridElement;
    this.render();
  }

  public render(): void {
    if (!this.gridElement) return;
    this.gridElement.innerHTML = '';
    this.colors.forEach((swatch, idx) => {
      const el = document.createElement('div');
      el.className = 'color-swatch' + (idx === this.selectedIndex ? ' selected' : '');
      el.style.backgroundColor = swatch.hex;
      const tip = document.createElement('span');
      tip.className = 'tooltip';
      tip.textContent = `${swatch.name} ${swatch.hex}`;
      el.appendChild(tip);
      el.addEventListener('click', () => {
        this.selectedIndex = idx;
        this.render();
      });
      this.gridElement!.appendChild(el);
    });
  }

  public selectColor(index: number): void {
    if (index >= 0 && index < this.colors.length) {
      this.selectedIndex = index;
      this.render();
    }
  }

  public addCustomColor(hex: string): void {
    const name = `自定义${this.colors.length - 9}`;
    this.colors.push(this.makeSwatch(name, hex));
    this.selectedIndex = this.colors.length - 1;
    this.render();
  }

  public getSelectedColor(): ColorSwatch {
    return this.colors[this.selectedIndex];
  }
}
