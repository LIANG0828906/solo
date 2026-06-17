interface TypographyParams {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
}

interface LayoutLine {
  text: string;
  x: number;
  y: number;
  width: number;
}

interface LayoutResult {
  blockId: string;
  lines: LayoutLine[];
  totalWidth: number;
  totalHeight: number;
}

class LayoutEngine {
  private static canvas: HTMLCanvasElement | null = null;

  private static getCanvas(): HTMLCanvasElement {
    if (!LayoutEngine.canvas) {
      LayoutEngine.canvas = document.createElement('canvas');
      LayoutEngine.canvas.style.display = 'none';
      document.body.appendChild(LayoutEngine.canvas);
    }
    return LayoutEngine.canvas;
  }

  static measureText(text: string, font: string, params: TypographyParams): { width: number; height: number } {
    const canvas = LayoutEngine.getCanvas();
    const ctx = canvas.getContext('2d')!;
    const fontString = `${params.fontSize}px ${font}`;
    ctx.font = fontString;
    ctx.letterSpacing = `${params.letterSpacing}px`;
    
    const metrics = ctx.measureText(text);
    const width = metrics.width;
    const height = params.fontSize * params.lineHeight;
    
    return { width, height };
  }

  static calculateLayout(
    text: string,
    font: string,
    params: TypographyParams,
    containerWidth: number
  ): LayoutResult {
    const lines: LayoutLine[] = [];
    const chars = Array.from(text);
    let currentLine = '';
    let currentWidth = 0;
    let y = 0;
    const lineHeight = params.fontSize * params.lineHeight;
    let maxWidth = 0;

    const flushLine = () => {
      if (currentLine.length > 0) {
        const lineWidth = LayoutEngine.measureText(currentLine, font, params).width;
        lines.push({
          text: currentLine,
          x: 0,
          y: y,
          width: lineWidth
        });
        if (lineWidth > maxWidth) {
          maxWidth = lineWidth;
        }
        y += lineHeight;
        currentLine = '';
        currentWidth = 0;
      }
    };

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      
      if (char === '\n') {
        flushLine();
        continue;
      }

      const charWidth = LayoutEngine.measureText(char, font, params).width;
      
      if (currentWidth + charWidth > containerWidth && currentLine.length > 0) {
        flushLine();
      }

      currentLine += char;
      currentWidth += charWidth;
    }

    flushLine();

    const totalHeight = lines.length * lineHeight;

    return {
      blockId: Math.random().toString(36).substring(2, 11),
      lines,
      totalWidth: maxWidth,
      totalHeight
    };
  }
}

export { TypographyParams, LayoutLine, LayoutResult, LayoutEngine };
