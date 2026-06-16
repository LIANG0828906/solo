export interface FontInfo {
  name: string
  family: string
  category: 'system' | 'google'
  isItalic?: boolean
}

export class FontManager {
  private static instance: FontManager
  private systemFonts: FontInfo[] = []
  private googleFonts: FontInfo[] = []
  private currentFont: FontInfo | null = null
  private loadedFonts: Set<string> = new Set()

  private constructor() {
    this.initSystemFonts()
    this.initGoogleFonts()
  }

  public static getInstance(): FontManager {
    if (!FontManager.instance) {
      FontManager.instance = new FontManager()
    }
    return FontManager.instance
  }

  private initSystemFonts(): void {
    this.systemFonts = [
      { name: '宋体', family: 'SimSun, "Songti SC", serif', category: 'system' },
      { name: '黑体', family: '"SimHei", "Heiti SC", sans-serif', category: 'system' },
      { name: '楷体', family: '"KaiTi", "Kaiti SC", serif', category: 'system' },
      { name: '仿宋', family: '"FangSong", "STFangsong", serif', category: 'system' },
      { name: '微软雅黑', family: '"Microsoft YaHei", sans-serif', category: 'system' },
      { name: 'Arial', family: 'Arial, sans-serif', category: 'system' },
      { name: 'Times New Roman', family: '"Times New Roman", serif', category: 'system' },
      { name: 'Georgia', family: 'Georgia, serif', category: 'system' },
    ]
  }

  private initGoogleFonts(): void {
    this.googleFonts = [
      { name: 'Dancing Script', family: '"Dancing Script", cursive', category: 'google', isItalic: false },
      { name: 'Dancing Script Italic', family: '"Dancing Script", cursive', category: 'google', isItalic: true },
      { name: 'Great Vibes', family: '"Great Vibes", cursive', category: 'google', isItalic: false },
      { name: 'Lobster', family: '"Lobster", cursive', category: 'google', isItalic: false },
      { name: 'Pacifico', family: '"Pacifico", cursive', category: 'google', isItalic: false },
      { name: 'Satisfy', family: '"Satisfy", cursive', category: 'google', isItalic: false },
      { name: 'Noto Serif SC', family: '"Noto Serif SC", serif', category: 'google', isItalic: false },
      { name: 'Noto Serif SC Italic', family: '"Noto Serif SC", serif', category: 'google', isItalic: true },
      { name: 'Ma Shan Zheng', family: '"Ma Shan Zheng", cursive', category: 'google', isItalic: false },
    ]
  }

  public getAllFonts(): FontInfo[] {
    return [...this.systemFonts, ...this.googleFonts]
  }

  public getSystemFonts(): FontInfo[] {
    return [...this.systemFonts]
  }

  public getGoogleFonts(): FontInfo[] {
    return [...this.googleFonts]
  }

  public getFontByName(name: string): FontInfo | undefined {
    return this.getAllFonts().find(f => f.name === name)
  }

  public getFontFamily(name: string): string {
    const font = this.getFontByName(name)
    return font?.family || name
  }

  public setCurrentFont(name: string): void {
    const font = this.getFontByName(name)
    if (font) {
      this.currentFont = font
    }
  }

  public getCurrentFont(): FontInfo | null {
    return this.currentFont
  }

  public isFontItalic(name: string): boolean {
    const font = this.getFontByName(name)
    return font?.isItalic || false
  }

  public async loadGoogleFont(name: string): Promise<boolean> {
    const font = this.getFontByName(name)
    if (!font || font.category !== 'google') {
      return true
    }
    if (this.loadedFonts.has(name)) {
      return true
    }
    try {
      if (document.fonts && 'load' in document.fonts) {
        const weight = '400'
        const style = font.isItalic ? 'italic' : 'normal'
        const fontSpec = `${style} ${weight} 16px ${font.family}`
        await document.fonts.load(fontSpec)
        this.loadedFonts.add(name)
        return true
      }
      return true
    } catch (e) {
      console.warn(`Failed to load font ${name}:`, e)
      return true
    }
  }

  public async preloadAllGoogleFonts(): Promise<void> {
    const promises = this.googleFonts.map(f => this.loadGoogleFont(f.name))
    await Promise.allSettled(promises)
  }
}

export const fontManager = FontManager.getInstance()
