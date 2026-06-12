export interface ExtractedColor {
  hex: string;
  rgb: [number, number, number];
  count: number;
  percentage: number;
}

export class ColorExtractor {
  private static rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
        .toUpperCase()
    );
  }

  private static hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  }

  public static async extractColors(
    imageSource: string | HTMLImageElement,
    colorCount: number = 10,
    quality: number = 5
  ): Promise<ExtractedColor[]> {
    return new Promise((resolve, reject) => {
      const img =
        typeof imageSource === 'string'
          ? Object.assign(new Image(), { crossOrigin: 'Anonymous' })
          : imageSource;

      const handleLoad = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法获取Canvas上下文'));
            return;
          }

          const maxSize = 400;
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          canvas.width = Math.floor(img.width * scale);
          canvas.height = Math.floor(img.height * scale);

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const pixelCount = canvas.width * canvas.height;

          const colorMap = new Map<string, { rgb: [number, number, number]; count: number }>();

          for (let i = 0; i < pixelCount; i += quality) {
            const offset = i * 4;
            const r = imageData[offset];
            const g = imageData[offset + 1];
            const b = imageData[offset + 2];
            const a = imageData[offset + 3];

            if (a < 128) continue;

            const rBucket = Math.round(r / 16) * 16;
            const gBucket = Math.round(g / 16) * 16;
            const bBucket = Math.round(b / 16) * 16;

            const key = `${rBucket},${gBucket},${bBucket}`;
            const existing = colorMap.get(key);

            if (existing) {
              existing.rgb[0] += r;
              existing.rgb[1] += g;
              existing.rgb[2] += b;
              existing.count++;
            } else {
              colorMap.set(key, { rgb: [r, g, b], count: 1 });
            }
          }

          const averagedColors: ExtractedColor[] = [];
          const totalPixels = Array.from(colorMap.values()).reduce((sum, c) => sum + c.count, 0);

          colorMap.forEach((value) => {
            const avgR = Math.round(value.rgb[0] / value.count);
            const avgG = Math.round(value.rgb[1] / value.count);
            const avgB = Math.round(value.rgb[2] / value.count);
            averagedColors.push({
              hex: this.rgbToHex(avgR, avgG, avgB),
              rgb: [avgR, avgG, avgB],
              count: value.count,
              percentage: (value.count / totalPixels) * 100,
            });
          });

          averagedColors.sort((a, b) => b.count - a.count);

          const finalColors: ExtractedColor[] = [];
          const minDistance = 40;

          for (const color of averagedColors) {
            if (finalColors.length >= colorCount) break;

            const isTooSimilar = finalColors.some((existing) => {
              const dr = color.rgb[0] - existing.rgb[0];
              const dg = color.rgb[1] - existing.rgb[1];
              const db = color.rgb[2] - existing.rgb[2];
              return Math.sqrt(dr * dr + dg * dg + db * db) < minDistance;
            });

            if (!isTooSimilar) {
              finalColors.push(color);
            }
          }

          resolve(finalColors);
        } catch (error) {
          reject(error);
        }
      };

      if (typeof imageSource === 'string') {
        img.onload = handleLoad;
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = imageSource;
      } else {
        if (img.complete && img.naturalWidth > 0) {
          handleLoad();
        } else {
          img.onload = handleLoad;
          img.onerror = () => reject(new Error('图片加载失败'));
        }
      }
    });
  }

  public static rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

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

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  public static hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  public static getColorName(r: number, g: number, b: number): string {
    const [h, s, l] = this.rgbToHsl(r, g, b);

    if (s < 10) {
      if (l < 10) return '黑色';
      if (l < 30) return '深灰色';
      if (l < 50) return '灰色';
      if (l < 70) return '浅灰色';
      if (l < 90) return '银白色';
      return '白色';
    }

    if (l < 15) return '深黑色';
    if (l > 90) return '亮白色';

    if (h >= 0 && h < 15) return s > 70 ? '鲜红色' : '珊瑚红';
    if (h >= 15 && h < 40) return s > 60 ? '橙色' : '桃色';
    if (h >= 40 && h < 65) return s > 60 ? '金黄色' : '米黄色';
    if (h >= 65 && h < 95) return s > 50 ? '柠檬黄' : '淡黄色';
    if (h >= 95 && h < 145) return s > 50 ? '翠绿色' : '薄荷绿';
    if (h >= 145 && h < 175) return s > 50 ? '青绿色' : '碧绿色';
    if (h >= 175 && h < 205) return s > 50 ? '青色' : '天青色';
    if (h >= 205 && h < 240) return s > 60 ? '宝蓝色' : '天蓝色';
    if (h >= 240 && h < 270) return s > 50 ? '靛蓝色' : '淡紫色';
    if (h >= 270 && h < 300) return s > 50 ? '紫色' : '粉紫色';
    if (h >= 300 && h < 330) return s > 60 ? '品红色' : '粉红色';
    if (h >= 330 && h < 360) return s > 70 ? '玫红色' : '玫瑰色';

    return '未知色';
  }
}
