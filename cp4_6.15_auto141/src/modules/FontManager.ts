export interface FontMetadata {
  family: string;
  category: string;
  subsets: string[];
  variants: string[];
  isChinese: boolean;
}

export class FontManager {
  private fonts: FontMetadata[] = [];
  private loading: boolean = false;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly CHINESE_KEYWORDS = [
    'SC', 'TC', 'Chinese', 'Simplified', 'Traditional',
    'Noto Sans', 'Noto Serif', 'ZCOOL', 'Ma Shan',
    'Zhi Mang', 'Liu Jian', 'Long Cang', 'Dancing', 'Kai'
  ];

  private readonly MOCK_FONTS: FontMetadata[] = [
    { family: 'Roboto', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Open Sans', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Lato', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Montserrat', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Poppins', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Inter', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Raleway', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Oswald', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Source Sans Pro', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Nunito', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Playfair Display', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Merriweather', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Lora', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Georgia', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Times New Roman', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Baskerville', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Garamond', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Cormorant', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Source Serif Pro', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'PT Serif', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Space Mono', category: 'monospace', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Fira Code', category: 'monospace', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'JetBrains Mono', category: 'monospace', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Source Code Pro', category: 'monospace', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Inconsolata', category: 'monospace', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Roboto Mono', category: 'monospace', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Ubuntu Mono', category: 'monospace', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Courier New', category: 'monospace', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Cascadia Code', category: 'monospace', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Hack', category: 'monospace', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Noto Sans SC', category: 'sans-serif', subsets: ['chinese-simplified'], variants: ['400', '700'], isChinese: true },
    { family: 'Noto Serif SC', category: 'serif', subsets: ['chinese-simplified'], variants: ['400', '700'], isChinese: true },
    { family: 'ZCOOL KuaiLe', category: 'display', subsets: ['chinese-simplified'], variants: ['400'], isChinese: true },
    { family: 'ZCOOL QingKe HuangYou', category: 'display', subsets: ['chinese-simplified'], variants: ['400'], isChinese: true },
    { family: 'Ma Shan Zheng', category: 'display', subsets: ['chinese-simplified'], variants: ['400'], isChinese: true },
    { family: 'Zhi Mang Xing', category: 'display', subsets: ['chinese-simplified'], variants: ['400'], isChinese: true },
    { family: 'Liu Jian Mao Cao', category: 'display', subsets: ['chinese-simplified'], variants: ['400'], isChinese: true },
    { family: 'Long Cang', category: 'display', subsets: ['chinese-simplified'], variants: ['400'], isChinese: true },
    { family: 'Dancing Script', category: 'display', subsets: ['chinese-simplified'], variants: ['400'], isChinese: true },
    { family: 'KaiTi', category: 'serif', subsets: ['chinese-simplified'], variants: ['400'], isChinese: true },
    { family: 'SimSun', category: 'serif', subsets: ['chinese-simplified'], variants: ['400'], isChinese: true },
    { family: 'Microsoft YaHei', category: 'sans-serif', subsets: ['chinese-simplified'], variants: ['400', '700'], isChinese: true },
    { family: 'PingFang SC', category: 'sans-serif', subsets: ['chinese-simplified'], variants: ['400', '700'], isChinese: true },
    { family: 'Helvetica Neue', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Arial', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Verdana', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Tahoma', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Impact', category: 'sans-serif', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Comic Sans MS', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Pacifico', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Lobster', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Bebas Neue', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Anton', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Fredoka One', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Russo One', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Righteous', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Abril Fatface', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Fjalla One', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Archivo Black', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Cinzel', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Cormorant Garamond', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'DM Serif Display', category: 'serif', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Fraunces', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Libre Baskerville', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Old Standard TT', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Quattrocento', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Spectral', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Vollkorn', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Crimson Text', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'EB Garamond', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Alegreya', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Bitter', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Domine', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Gentium Book Plus', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Cardo', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Palatino', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Book Antiqua', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Cambria', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Didot', category: 'serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Calibri', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Segoe UI', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Candara', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Futura', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Gill Sans', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Optima', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Franklin Gothic', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Century Gothic', category: 'sans-serif', subsets: ['latin'], variants: ['400', '700'], isChinese: false },
    { family: 'Copperplate', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Brush Script MT', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Lucida Calligraphy', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Blackadder ITC', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Edwardian Script', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Freestyle Script', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Harrington', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Mistral', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Old English Text MT', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Parchment', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Ravie', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Snap ITC', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Stencil', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Wide Latin', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Viner Hand ITC', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Vivaldi', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Script MT Bold', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Curlz MT', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false },
    { family: 'Bradley Hand', category: 'display', subsets: ['latin'], variants: ['400'], isChinese: false }
  ];

  isChineseFont(family: string): boolean {
    return this.CHINESE_KEYWORDS.some(keyword => 
      family.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  async loadFonts(): Promise<FontMetadata[]> {
    this.loading = true;
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;
      if (apiKey) {
        const response = await fetch(
          `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`
        );
        if (response.ok) {
          const data = await response.json();
          this.fonts = data.items.map((item: any) => ({
            family: item.family,
            category: item.category,
            subsets: item.subsets,
            variants: item.variants,
            isChinese: this.isChineseFont(item.family)
          }));
        } else {
          this.fonts = this.MOCK_FONTS;
        }
      } else {
        this.fonts = this.MOCK_FONTS;
      }
    } catch {
      this.fonts = this.MOCK_FONTS;
    }
    this.loading = false;
    return this.fonts;
  }

  getFonts(): FontMetadata[] {
    return this.fonts;
  }

  isLoading(): boolean {
    return this.loading;
  }

  searchFonts(keyword: string): Promise<FontMetadata[]> {
    return new Promise((resolve) => {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }
      this.searchDebounceTimer = setTimeout(() => {
        if (!keyword.trim()) {
          resolve(this.fonts);
          return;
        }
        const lowerKeyword = keyword.toLowerCase();
        const filtered = this.fonts.filter(font =>
          font.family.toLowerCase().includes(lowerKeyword) ||
          font.category.toLowerCase().includes(lowerKeyword)
        );
        resolve(filtered);
      }, 200);
    });
  }

  getPreviewText(font: FontMetadata): string {
    return font.isChinese ? '你好世界' : 'Aa';
  }
}
