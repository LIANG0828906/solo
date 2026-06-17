export type PaperTextureType = 'kraft' | 'parchment' | 'letterhead' | 'grid';
export type FontFamilyType = 'playfair' | 'inter' | 'caveat';

interface PaperStyle {
  background: string;
  boxShadow: string;
}

interface FontStyle {
  fontFamily: string;
  fontSize: string;
  lineHeight: number;
  letterSpacing: string;
}

const paperTextures: Record<PaperTextureType, PaperStyle> = {
  kraft: {
    background: `
      linear-gradient(135deg, #D4A574 0%, #C4956A 25%, #D4A574 50%, #C4956A 75%, #D4A574 100%),
      radial-gradient(ellipse at 20% 30%, rgba(139, 90, 43, 0.3) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(139, 90, 43, 0.2) 0%, transparent 50%)
    `,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06), inset 0 0 100px rgba(139, 90, 43, 0.1)',
  },
  parchment: {
    background: `
      linear-gradient(145deg, #F5E6D3 0%, #EDD8C0 30%, #F0DECB 60%, #E8D4BC 100%),
      radial-gradient(ellipse at 30% 20%, rgba(180, 140, 100, 0.15) 0%, transparent 40%),
      radial-gradient(ellipse at 70% 80%, rgba(180, 140, 100, 0.1) 0%, transparent 45%)
    `,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06), inset 0 0 80px rgba(200, 170, 130, 0.15)',
  },
  letterhead: {
    background: `
      linear-gradient(180deg, #FFFEF9 0%, #FAF8F0 100%),
      repeating-linear-gradient(
        180deg,
        transparent 0px,
        transparent 39px,
        #E8E0D0 39px,
        #E8E0D0 40px
      )
    `,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  grid: {
    background: `
      linear-gradient(#FFFEF9, #FFFEF9),
      linear-gradient(#E0D8C8 1px, transparent 1px),
      linear-gradient(90deg, #E0D8C8 1px, transparent 1px)
    `,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
};

const fontStyles: Record<FontFamilyType, FontStyle> = {
  playfair: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '18px',
    lineHeight: 1.8,
    letterSpacing: '0.02em',
  },
  inter: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '16px',
    lineHeight: 1.7,
    letterSpacing: '0.01em',
  },
  caveat: {
    fontFamily: "'Caveat', cursive",
    fontSize: '24px',
    lineHeight: 1.6,
    letterSpacing: '0.03em',
  },
};

export class LetterPaperEngine {
  static getPaperBackground(texture: PaperTextureType): string {
    return paperTextures[texture].background;
  }

  static getPaperShadow(texture: PaperTextureType): string {
    return paperTextures[texture].boxShadow;
  }

  static getFontStyle(fontFamily: FontFamilyType): FontStyle {
    return fontStyles[fontFamily];
  }

  static getTextStyle(color: string, fontFamily: FontFamilyType): React.CSSProperties {
    const font = fontStyles[fontFamily];
    return {
      fontFamily: font.fontFamily,
      fontSize: font.fontSize,
      lineHeight: font.lineHeight,
      letterSpacing: font.letterSpacing,
      color: color,
    };
  }

  static getPaperStyle(texture: PaperTextureType): React.CSSProperties {
    const paper = paperTextures[texture];
    return {
      background: paper.background,
      backgroundBlendMode: texture === 'letterhead' || texture === 'grid' ? 'multiply' : 'normal',
      boxShadow: paper.boxShadow,
    };
  }
}

export const paperTextureLabels: Record<PaperTextureType, string> = {
  kraft: '牛皮纸',
  parchment: '羊皮纸',
  letterhead: '信笺纸',
  grid: '方格纸',
};

export const fontLabels: Record<FontFamilyType, string> = {
  playfair: '衬线字体',
  inter: '无衬线字体',
  caveat: '手写字体',
};
