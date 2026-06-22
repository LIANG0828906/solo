export interface TypographyParams {
  headingFont: string;
  bodyFont: string;
  h1Size: number;
  h2Size: number;
  h3Size: number;
  bodySize: number;
  h1LineHeight: number;
  h2LineHeight: number;
  h3LineHeight: number;
  bodyLineHeight: number;
  h1LetterSpacing: number;
  h2LetterSpacing: number;
  h3LetterSpacing: number;
  bodyLetterSpacing: number;
  paragraphSpacing: number;
  headingSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textColor: string;
  headingColor: string;
  quoteStyle: 'modern' | 'classic' | 'minimal';
  linkColor: string;
}

export interface ParsedTypography {
  h1: Record<string, string>;
  h2: Record<string, string>;
  h3: Record<string, string>;
  body: Record<string, string>;
  p: Record<string, string>;
  blockquote: Record<string, string>;
  a: Record<string, string>;
}

const fontStacks: Record<string, string> = {
  'system-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  'Georgia': 'Georgia, "Times New Roman", Times, serif',
  'Helvetica': '"Helvetica Neue", Helvetica, Arial, sans-serif',
  'Times New Roman': '"Times New Roman", Times, Georgia, serif',
  'Arial': 'Arial, Helvetica, sans-serif',
  'Verdana': 'Verdana, Geneva, Tahoma, sans-serif',
  'Courier New': '"Courier New", Courier, monospace',
  'Inter': 'Inter, system-ui, -apple-system, sans-serif',
  'Roboto': 'Roboto, "Helvetica Neue", Arial, sans-serif',
  'Playfair Display': '"Playfair Display", Georgia, serif',
  'Lora': 'Lora, Georgia, serif',
  'Merriweather': 'Merriweather, Georgia, serif',
  'Poppins': 'Poppins, "Helvetica Neue", Arial, sans-serif',
  'Montserrat': 'Montserrat, "Helvetica Neue", Arial, sans-serif',
  'Fira Code': '"Fira Code", "Courier New", monospace',
};

function getFontStack(font: string): string {
  return fontStacks[font] || font;
}

function quoteStyles(style: string): Record<string, string> {
  switch (style) {
    case 'modern':
      return {
        borderLeft: '4px solid #7C6FFF',
        paddingLeft: '20px',
        margin: '24px 0',
        fontStyle: 'italic',
        opacity: '0.9',
      };
    case 'classic':
      return {
        borderLeft: '3px solid #333',
        paddingLeft: '16px',
        margin: '20px 0',
        fontStyle: 'italic',
      };
    case 'minimal':
      return {
        borderLeft: '2px solid #888',
        paddingLeft: '12px',
        margin: '16px 0',
        opacity: '0.85',
      };
    default:
      return {};
  }
}

export function parseTypography(params: TypographyParams): ParsedTypography {
  const headingFont = getFontStack(params.headingFont);
  const bodyFont = getFontStack(params.bodyFont);

  return {
    h1: {
      fontFamily: headingFont,
      fontSize: `${params.h1Size}px`,
      lineHeight: String(params.h1LineHeight),
      letterSpacing: `${params.h1LetterSpacing}px`,
      color: params.headingColor,
      fontWeight: '700',
      marginTop: '0',
      marginBottom: `${params.headingSpacing}px`,
      textAlign: params.textAlign,
    },
    h2: {
      fontFamily: headingFont,
      fontSize: `${params.h2Size}px`,
      lineHeight: String(params.h2LineHeight),
      letterSpacing: `${params.h2LetterSpacing}px`,
      color: params.headingColor,
      fontWeight: '600',
      marginTop: `${params.headingSpacing * 1.5}px`,
      marginBottom: `${params.headingSpacing * 0.8}px`,
      textAlign: params.textAlign,
    },
    h3: {
      fontFamily: headingFont,
      fontSize: `${params.h3Size}px`,
      lineHeight: String(params.h3LineHeight),
      letterSpacing: `${params.h3LetterSpacing}px`,
      color: params.headingColor,
      fontWeight: '600',
      marginTop: `${params.headingSpacing}px`,
      marginBottom: `${params.headingSpacing * 0.6}px`,
      textAlign: params.textAlign,
    },
    body: {
      fontFamily: bodyFont,
      fontSize: `${params.bodySize}px`,
      lineHeight: String(params.bodyLineHeight),
      letterSpacing: `${params.bodyLetterSpacing}px`,
      color: params.textColor,
    },
    p: {
      fontFamily: bodyFont,
      fontSize: `${params.bodySize}px`,
      lineHeight: String(params.bodyLineHeight),
      letterSpacing: `${params.bodyLetterSpacing}px`,
      color: params.textColor,
      marginBottom: `${params.paragraphSpacing}px`,
      textAlign: params.textAlign,
    },
    blockquote: {
      fontFamily: bodyFont,
      fontSize: `${params.bodySize * 1.05}px`,
      lineHeight: String(params.bodyLineHeight),
      letterSpacing: `${params.bodyLetterSpacing}px`,
      color: params.textColor,
      ...quoteStyles(params.quoteStyle),
      textAlign: params.textAlign,
    },
    a: {
      color: params.linkColor,
      textDecoration: 'underline',
    },
  };
}

export function inlineStyle(styleObj: Record<string, string>): React.CSSProperties {
  const result: Record<string, string> = {};
  for (const key in styleObj) {
    const cssKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    result[cssKey] = styleObj[key];
  }
  return result as React.CSSProperties;
}
