import { ColorExtractor } from './ColorExtractor';

export interface ColorInfo {
  hex: string;
  rgb: [number, number, number];
  hsl: [number, number, number];
  name: string;
}

export interface ColorScheme {
  type: 'complementary' | 'analogous' | 'triadic';
  title: string;
  description: string;
  colors: ColorInfo[];
}

export class ColorSchemeGenerator {
  private static createColorInfo(rgb: [number, number, number]): ColorInfo {
    const [r, g, b] = rgb;
    const hsl = ColorExtractor.rgbToHsl(r, g, b);
    const hex = ColorExtractor.rgbToHex(r, g, b);
    return {
      hex,
      rgb,
      hsl,
      name: ColorExtractor.getColorName(r, g, b),
    };
  }

  private static rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
        .toUpperCase()
    );
  }

  public static generateComplementary(hexColor: string): ColorScheme {
    const rgb = this.parseHex(hexColor);
    const [h, s, l] = ColorExtractor.rgbToHsl(rgb[0], rgb[1], rgb[2]);

    const complementH = (h + 180) % 360;
    const complementRgb = ColorExtractor.hslToRgb(complementH, s, l);

    const primaryAdjustedL = Math.min(90, l + 20);
    const complementAdjustedL = Math.max(20, l - 15);

    const lightPrimary = ColorExtractor.hslToRgb(h, Math.max(30, s - 10), primaryAdjustedL);
    const darkComplement = ColorExtractor.hslToRgb(complementH, s, complementAdjustedL);

    return {
      type: 'complementary',
      title: '互补色方案',
      description: '主色与180度对向色形成强烈对比',
      colors: [
        this.createColorInfo(rgb),
        this.createColorInfo(lightPrimary),
        this.createColorInfo(complementRgb),
        this.createColorInfo(darkComplement),
      ],
    };
  }

  public static generateAnalogous(hexColor: string): ColorScheme {
    const rgb = this.parseHex(hexColor);
    const [h, s, l] = ColorExtractor.rgbToHsl(rgb[0], rgb[1], rgb[2]);

    const analogousH1 = (h - 30 + 360) % 360;
    const analogousH2 = (h + 30) % 360;

    const analogousRgb1 = ColorExtractor.hslToRgb(analogousH1, Math.max(40, s - 10), Math.min(85, l + 10));
    const analogousRgb2 = ColorExtractor.hslToRgb(analogousH2, Math.max(40, s - 10), Math.min(85, l + 10));

    const accentRgb = ColorExtractor.hslToRgb(h, Math.min(90, s + 10), Math.max(25, l - 15));

    return {
      type: 'analogous',
      title: '类似色方案',
      description: '主色相邻的两种颜色，和谐自然',
      colors: [
        this.createColorInfo(analogousRgb1),
        this.createColorInfo(rgb),
        this.createColorInfo(analogousRgb2),
        this.createColorInfo(accentRgb),
      ],
    };
  }

  public static generateTriadic(hexColor: string): ColorScheme {
    const rgb = this.parseHex(hexColor);
    const [h, s, l] = ColorExtractor.rgbToHsl(rgb[0], rgb[1], rgb[2]);

    const triadicH1 = (h + 120) % 360;
    const triadicH2 = (h + 240) % 360;

    const triadicRgb1 = ColorExtractor.hslToRgb(triadicH1, Math.max(45, s - 5), l);
    const triadicRgb2 = ColorExtractor.hslToRgb(triadicH2, Math.max(45, s - 5), l);

    const balancedL = Math.min(85, Math.max(35, l));
    const balanceRgb = ColorExtractor.hslToRgb(h, Math.max(30, s - 15), balancedL);

    return {
      type: 'triadic',
      title: '三角色方案',
      description: '主色与相隔120度的两种颜色，活力平衡',
      colors: [
        this.createColorInfo(rgb),
        this.createColorInfo(triadicRgb1),
        this.createColorInfo(triadicRgb2),
        this.createColorInfo(balanceRgb),
      ],
    };
  }

  public static generateAllSchemes(primaryHex: string): ColorScheme[] {
    return [
      this.generateComplementary(primaryHex),
      this.generateAnalogous(primaryHex),
      this.generateTriadic(primaryHex),
    ];
  }

  private static parseHex(hex: string): [number, number, number] {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    if (!result) {
      throw new Error(`无效的颜色格式: ${hex}`);
    }
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
  }
}
