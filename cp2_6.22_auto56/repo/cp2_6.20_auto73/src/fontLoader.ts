export interface FontItem {
  name: string;
  family: string;
  isCustom?: boolean;
  url?: string;
}

const DEFAULT_FONTS: FontItem[] = [
  { name: 'Arial', family: 'Arial, sans-serif' },
  { name: 'Times New Roman', family: '"Times New Roman", serif' },
  { name: 'Courier New', family: '"Courier New", monospace' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Verdana', family: 'Verdana, sans-serif' },
  { name: 'Impact', family: 'Impact, sans-serif' },
  { name: 'Comic Sans MS', family: '"Comic Sans MS", cursive' },
  { name: 'Trebuchet MS', family: '"Trebuchet MS", sans-serif' },
  { name: 'Palatino Linotype', family: '"Palatino Linotype", serif' },
  { name: 'Lucida Console', family: '"Lucida Console", monospace' },
];

class FontLoader {
  private customFonts: FontItem[] = [];
  private fontFaces: Map<string, FontFace> = new Map();

  getFonts(): FontItem[] {
    return [...DEFAULT_FONTS, ...this.customFonts];
  }

  getDefaultFont(): FontItem {
    return DEFAULT_FONTS[0];
  }

  async loadFont(font: FontItem): Promise<void> {
    if (this.fontFaces.has(font.name)) {
      return;
    }

    if (font.isCustom && font.url) {
      try {
        const fontFace = new FontFace(font.name, `url(${font.url})`);
        const loadedFace = await fontFace.load();
        document.fonts.add(loadedFace);
        this.fontFaces.set(font.name, loadedFace);
      } catch (error) {
        console.error('Failed to load font:', error);
        throw new Error('字体加载失败');
      }
    }
  }

  async addCustomFont(file: File): Promise<FontItem> {
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const fontName = `Custom_${fileName}_${Date.now()}`;
    const url = URL.createObjectURL(file);

    const fontItem: FontItem = {
      name: fileName,
      family: `"${fontName}", sans-serif`,
      isCustom: true,
      url: url,
    };

    try {
      const fontFace = new FontFace(fontName, `url(${url})`);
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);
      this.fontFaces.set(fontName, loadedFace);
      this.customFonts.push(fontItem);
      return fontItem;
    } catch (error) {
      URL.revokeObjectURL(url);
      console.error('Failed to load custom font:', error);
      throw new Error('自定义字体加载失败，请检查文件格式');
    }
  }

  async loadAllFonts(): Promise<void> {
    const allFonts = this.getFonts();
    await Promise.all(allFonts.map((font) => this.loadFont(font).catch(() => {})));
  }
}

export const fontLoader = new FontLoader();
