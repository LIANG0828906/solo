import WebFont from 'webfontloader';

export interface LayoutParams {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  text: string;
}

export interface CharInfo {
  char: string;
  x: number;
  y: number;
  width: number;
  unicode: string;
}

export class LayoutEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private loadedFonts: Set<string> = new Set();
  private hoveredCharIndex: number | null = null;
  private charInfos: CharInfo[] = [];

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  async loadFont(fontFamily: string): Promise<void> {
    if (this.loadedFonts.has(fontFamily)) {
      return;
    }
    return new Promise((resolve) => {
      WebFont.load({
        google: {
          families: [fontFamily]
        },
        active: () => {
          this.loadedFonts.add(fontFamily);
          resolve();
        },
        inactive: () => {
          this.loadedFonts.add(fontFamily);
          resolve();
        },
        timeout: 3000
      });
    });
  }

  generateCSS(params: LayoutParams): string {
    const fontFamily = params.fontFamily.includes(' ') 
      ? `"${params.fontFamily}"` 
      : params.fontFamily;
    
    return `.typography-preview {
  font-family: ${fontFamily}, sans-serif;
  font-size: ${params.fontSize}px;
  line-height: ${params.lineHeight};
  letter-spacing: ${params.letterSpacing}em;
  color: ${params.color};
}`;
  }

  render(params: LayoutParams): number {
    if (!this.canvas || !this.ctx) return 0;
    
    const startTime = performance.now();
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
      this.draw(params);
    });
    
    return performance.now() - startTime;
  }

  private draw(params: LayoutParams): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const padding = 40;
    const maxWidth = rect.width - padding * 2;
    const x = padding;
    let y = padding + params.fontSize;

    ctx.font = `${params.fontSize}px "${params.fontFamily}", sans-serif`;
    ctx.fillStyle = params.color;
    ctx.textBaseline = 'alphabetic';

    const letterSpacingEm = params.letterSpacing;
    const letterSpacingPx = params.fontSize * letterSpacingEm;
    const lineHeightPx = params.fontSize * params.lineHeight;

    this.charInfos = [];
    
    const lines = this.wrapText(params.text, maxWidth, letterSpacingPx);
    let charIndex = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      let lineX = x;
      const lineY = y + lineIndex * lineHeightPx;
      
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, lineY + 2);
      ctx.lineTo(x + maxWidth, lineY + 2);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const charWidth = ctx.measureText(char).width;
        
        if (charIndex === this.hoveredCharIndex) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
          ctx.fillRect(lineX - 2, lineY - params.fontSize, charWidth + 4, params.fontSize + 4);
          ctx.restore();
        }
        
        ctx.fillText(char, lineX, lineY);
        
        this.charInfos.push({
          char,
          x: lineX,
          y: lineY - params.fontSize,
          width: charWidth,
          unicode: `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`
        });

        lineX += charWidth + letterSpacingPx;
        charIndex++;
      }
    }
  }

  private wrapText(text: string, maxWidth: number, letterSpacingPx: number): string[] {
    if (!this.ctx) return [text];

    const ctx = this.ctx;
    const words = text.split(/(\s+)/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word;
      const testWidth = ctx.measureText(testLine).width + (testLine.length - 1) * letterSpacingPx;
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word.trimStart();
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  getCharAtPosition(clientX: number, clientY: number): CharInfo | null {
    if (!this.canvas) return null;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    for (let i = 0; i < this.charInfos.length; i++) {
      const info = this.charInfos[i];
      if (
        x >= info.x && 
        x <= info.x + info.width &&
        y >= info.y &&
        y <= info.y + info.width * 1.5
      ) {
        this.hoveredCharIndex = i;
        return info;
      }
    }
    
    this.hoveredCharIndex = null;
    return null;
  }

  clearHover(): void {
    this.hoveredCharIndex = null;
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
