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
  height: number;
  baselineY: number;
  unicode: string;
}

export class LayoutEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private loadedFonts: Set<string> = new Set();
  private hoveredCharIndex: number | null = null;
  private charInfos: CharInfo[] = [];
  private lastRenderTime: number = 0;

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
  }

  async loadFont(fontFamily: string): Promise<void> {
    if (this.loadedFonts.has(fontFamily)) {
      return;
    }
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.loadedFonts.add(fontFamily);
        resolve();
      }, 3000);

      try {
        WebFont.load({
          google: {
            families: [`${fontFamily}:400,700`]
          },
          active: () => {
            clearTimeout(timeoutId);
            this.loadedFonts.add(fontFamily);
            resolve();
          },
          inactive: () => {
            clearTimeout(timeoutId);
            this.loadedFonts.add(fontFamily);
            resolve();
          },
          timeout: 3000
        });
      } catch {
        clearTimeout(timeoutId);
        this.loadedFonts.add(fontFamily);
        resolve();
      }
    });
  }

  generateCSS(params: LayoutParams): string {
    const fontFamily = params.fontFamily.includes(' ') 
      ? `"${params.fontFamily}"` 
      : params.fontFamily;
    
    return `/* Generated Typography CSS */
@font-face {
  font-family: ${fontFamily};
  src: local('${params.fontFamily}');
  font-display: swap;
}

.typography-preview {
  font-family: ${fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: ${params.fontSize}px;
  line-height: ${params.lineHeight};
  letter-spacing: ${params.letterSpacing}em;
  color: ${params.color};
  word-wrap: break-word;
  overflow-wrap: break-word;
}`;
  }

  render(params: LayoutParams): number {
    if (!this.canvas || !this.ctx) return 0;
    
    const startTime = performance.now();
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
      this.draw(params);
      this.lastRenderTime = performance.now() - startTime;
      if (this.lastRenderTime > 8) {
        console.warn(`Canvas render took ${this.lastRenderTime.toFixed(2)}ms (target: <8ms)`);
      }
    });
    
    return performance.now() - startTime;
  }

  getLastRenderTime(): number {
    return this.lastRenderTime;
  }

  private draw(params: LayoutParams): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    
    const canvasWidth = Math.floor(rect.width * dpr);
    const canvasHeight = Math.floor(rect.height * dpr);
    
    if (this.canvas.width !== canvasWidth || this.canvas.height !== canvasHeight) {
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
    }
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const padding = 48;
    const maxWidth = Math.max(100, rect.width - padding * 2);
    const startX = padding;
    const startY = padding + params.fontSize;

    ctx.font = `${params.fontSize}px "${params.fontFamily}", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = params.color;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    const letterSpacingPx = params.fontSize * params.letterSpacing;
    const lineHeightPx = params.fontSize * params.lineHeight;

    this.charInfos = [];
    
    const lines = this.wrapText(params.text, maxWidth, letterSpacingPx, ctx);
    let globalCharIndex = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      let charX = startX;
      const baselineY = startY + lineIndex * lineHeightPx;
      
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.30)';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(startX, baselineY + 0.5);
      ctx.lineTo(startX + maxWidth, baselineY + 0.5);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const charWidth = ctx.measureText(char).width;
        const charTop = baselineY - params.fontSize;
        const charHeight = params.fontSize * 1.4;

        if (globalCharIndex === this.hoveredCharIndex) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 102, 0.55)';
          const highlightPadding = 3;
          ctx.fillRect(
            charX - highlightPadding,
            charTop - highlightPadding,
            charWidth + highlightPadding * 2,
            charHeight + highlightPadding * 2
          );
          ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            charX - highlightPadding,
            charTop - highlightPadding,
            charWidth + highlightPadding * 2,
            charHeight + highlightPadding * 2
          );
          ctx.restore();
        }
        
        ctx.fillText(char, charX, baselineY);
        
        this.charInfos.push({
          char,
          x: charX,
          y: charTop,
          width: charWidth,
          height: charHeight,
          baselineY,
          unicode: `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`
        });

        charX += charWidth + letterSpacingPx;
        globalCharIndex++;
      }
    }
  }

  private wrapText(
    text: string, 
    maxWidth: number, 
    letterSpacingPx: number,
    ctx: CanvasRenderingContext2D
  ): string[] {
    const words = text.split(/(\s+|[，。！？、；：""''（）【】《》])/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (word === '') continue;
      
      const testLine = currentLine + word;
      let testWidth = 0;
      for (let i = 0; i < testLine.length; i++) {
        testWidth += ctx.measureText(testLine[i]).width;
      }
      testWidth += Math.max(0, testLine.length - 1) * letterSpacingPx;
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        const trimmed = word.trimStart();
        if (trimmed !== '') {
          currentLine = trimmed;
        } else {
          currentLine = '';
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.trim() !== '') {
      lines.push(currentLine);
    } else if (lines.length === 0 && text !== '') {
      lines.push(text);
    }

    return lines.length > 0 ? lines : [''];
  }

  getCharAtPosition(clientX: number, clientY: number): CharInfo | null {
    if (!this.canvas) return null;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    let foundIndex: number | null = null;
    let foundChar: CharInfo | null = null;
    
    for (let i = 0; i < this.charInfos.length; i++) {
      const info = this.charInfos[i];
      if (
        x >= info.x - 4 && 
        x <= info.x + info.width + 4 &&
        y >= info.y - 4 &&
        y <= info.y + info.height + 4
      ) {
        foundIndex = i;
        foundChar = info;
        break;
      }
    }
    
    if (foundIndex !== this.hoveredCharIndex) {
      this.hoveredCharIndex = foundIndex;
      return foundChar;
    }
    
    return foundChar;
  }

  isHoveringChar(): boolean {
    return this.hoveredCharIndex !== null;
  }

  getHoveredCharIndex(): number | null {
    return this.hoveredCharIndex;
  }

  clearHover(): void {
    if (this.hoveredCharIndex !== null) {
      this.hoveredCharIndex = null;
    }
  }

  getCharCount(): number {
    return this.charInfos.length;
  }

  getAllChars(): CharInfo[] {
    return [...this.charInfos];
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.charInfos = [];
    this.canvas = null;
    this.ctx = null;
  }
}
