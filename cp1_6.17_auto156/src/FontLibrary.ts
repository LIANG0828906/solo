export interface Font {
  id: string;
  name: string;
  family: string;
  category: 'serif' | 'sans-serif' | 'monospace' | 'display' | 'handwriting';
  source: 'web-safe' | 'google-fonts';
  weights: number[];
  previewText: string;
}

const FONTS: Font[] = [
  {
    id: 'arial',
    name: 'Arial',
    family: 'Arial, sans-serif',
    category: 'sans-serif',
    source: 'web-safe',
    weights: [400, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'times-new-roman',
    name: 'Times New Roman',
    family: 'Times New Roman, serif',
    category: 'serif',
    source: 'web-safe',
    weights: [400, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'courier-new',
    name: 'Courier New',
    family: 'Courier New, monospace',
    category: 'monospace',
    source: 'web-safe',
    weights: [400, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'georgia',
    name: 'Georgia',
    family: 'Georgia, serif',
    category: 'serif',
    source: 'web-safe',
    weights: [400, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'verdana',
    name: 'Verdana',
    family: 'Verdana, sans-serif',
    category: 'sans-serif',
    source: 'web-safe',
    weights: [400, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    family: 'Roboto, sans-serif',
    category: 'sans-serif',
    source: 'google-fonts',
    weights: [300, 400, 500, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    family: 'Playfair Display, serif',
    category: 'serif',
    source: 'google-fonts',
    weights: [400, 500, 600, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    family: 'Source Code Pro, monospace',
    category: 'monospace',
    source: 'google-fonts',
    weights: [300, 400, 500, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: 'Montserrat, sans-serif',
    category: 'sans-serif',
    source: 'google-fonts',
    weights: [300, 400, 500, 600, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'lora',
    name: 'Lora',
    family: 'Lora, serif',
    category: 'serif',
    source: 'google-fonts',
    weights: [400, 500, 600, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: 'Poppins, sans-serif',
    category: 'sans-serif',
    source: 'google-fonts',
    weights: [300, 400, 500, 600, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: 'Merriweather, serif',
    category: 'serif',
    source: 'google-fonts',
    weights: [300, 400, 700, 900],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'oswald',
    name: 'Oswald',
    family: 'Oswald, sans-serif',
    category: 'display',
    source: 'google-fonts',
    weights: [300, 400, 500, 600, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'raleway',
    name: 'Raleway',
    family: 'Raleway, sans-serif',
    category: 'sans-serif',
    source: 'google-fonts',
    weights: [300, 400, 500, 600, 700],
    previewText: 'The quick brown fox jumps over the lazy dog'
  },
  {
    id: 'noto-serif-sc',
    name: 'Noto Serif SC',
    family: 'Noto Serif SC, serif',
    category: 'serif',
    source: 'google-fonts',
    weights: [300, 400, 500, 600, 700],
    previewText: '天地玄黄 宇宙洪荒 日月盈昃 辰宿列张'
  }
];

export class FontLibrary {
  private loadedFonts: Map<string, boolean> = new Map();
  private loadingPromises: Map<string, Promise<boolean>> = new Map();

  getFonts(): Font[] {
    return [...FONTS];
  }

  getFontById(id: string): Font | undefined {
    return FONTS.find(font => font.id === id);
  }

  isFontLoaded(id: string): boolean {
    const font = this.getFontById(id);
    if (!font) return false;
    if (font.source === 'web-safe') return true;
    return this.loadedFonts.get(id) || false;
  }

  loadFont(id: string): Promise<boolean> {
    const font = this.getFontById(id);
    if (!font) return Promise.resolve(false);
    if (font.source === 'web-safe') return Promise.resolve(true);
    if (this.loadedFonts.get(id)) return Promise.resolve(true);
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    const familyName = font.name.replace(/\s+/g, '+');
    const weights = font.weights.join(';');
    const href = `https://fonts.googleapis.com/css2?family=${familyName}:wght@${weights}&display=swap`;

    const promise = new Promise<boolean>((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => {
        this.loadedFonts.set(id, true);
        this.loadingPromises.delete(id);
        resolve(true);
      };
      link.onerror = () => {
        this.loadingPromises.delete(id);
        resolve(false);
      };
      document.head.appendChild(link);
    });

    this.loadingPromises.set(id, promise);
    return promise;
  }
}

export const fontLibrary = new FontLibrary();
