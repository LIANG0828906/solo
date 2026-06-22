import { WaveformStyle } from './WaveformRenderer';
import { TextItem } from './TextOverlay';
import { BackgroundConfig } from './BackgroundManager';
import { WaveformData } from './AudioProcessor';
import { TextOverlay } from './TextOverlay';

export interface PosterConfig {
  v: number;
  waveform: WaveformStyle;
  waveformData: number[] | null;
  texts: TextItem[];
  background: {
    mode: 'solid' | 'gradient' | 'image';
    type?: 'linear' | 'radial';
    color?: string;
    startColor?: string;
    endColor?: string;
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    blur?: number;
    overlayOpacity?: number;
    overlayColor?: string;
  };
  canvasSize: { width: number; height: number };
}

export type ExportScale = 1 | 2 | 3;

export class ExportManager {
  static readonly BASE_WIDTH = 1280;
  static readonly BASE_HEIGHT = 720;
  static readonly MAX_URL_LENGTH = 500;

  static generateCompositeCanvas(
    width: number,
    height: number,
    scale: ExportScale,
    renderBackground: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
    renderWaveform: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
    texts: TextItem[],
    waveformData?: WaveformData | null,
    waveformStyle?: WaveformStyle
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    renderBackground(ctx, width, height);
    renderWaveform(ctx, width, height);
    this.renderTexts(ctx, texts, width, height);

    return canvas;
  }

  static renderTexts(ctx: CanvasRenderingContext2D, texts: TextItem[], width: number, height: number) {
    const FONT_MAP: Record<string, string> = {
      'serif': 'Georgia, "Times New Roman", Times, serif',
      'sans-serif': '"Helvetica Neue", Helvetica, Arial, sans-serif',
      'handwriting': '"Brush Script MT", "Lucida Handwriting", cursive',
      'decorative': 'Impact, "Arial Black", fantasy',
      'monospace': '"Courier New", Courier, monospace'
    };

    for (const text of texts) {
      if (!text.content.trim()) continue;
      const style = text.style;
      const parts: string[] = [];
      if (style.italic) parts.push('italic');
      parts.push(style.fontWeight);
      parts.push(`${style.fontSize}px`);
      parts.push(FONT_MAP[style.fontFamily] || 'sans-serif');

      ctx.font = parts.join(' ');
      ctx.fillStyle = style.color;
      ctx.textAlign = style.alignment;
      ctx.textBaseline = 'alphabetic';

      const shadow = style.textShadow;
      if (shadow.blur > 0 || shadow.offsetX !== 0 || shadow.offsetY !== 0) {
        ctx.shadowColor = shadow.color;
        ctx.shadowOffsetX = shadow.offsetX;
        ctx.shadowOffsetY = shadow.offsetY;
        ctx.shadowBlur = shadow.blur;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      const x = text.x * width;
      const y = text.y * height;
      ctx.fillText(text.content, x, y);
    }
  }

  static async exportToPNG(
    canvas: HTMLCanvasElement,
    scale: ExportScale,
    onProgress?: (phase: 'animating' | 'processing' | 'saving', progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (onProgress) onProgress('animating', 0);
        const animateDuration = 300;
        const startTime = performance.now();
        const wrap = canvas.parentElement;

        const animate = () => {
          const elapsed = performance.now() - startTime;
          const t = Math.min(1, elapsed / animateDuration);
          const easeOut = 1 - Math.pow(1 - t, 3);
          const scaleNow = 1 - easeOut * 0.1;
          canvas.style.transform = `scale(${scaleNow})`;
          canvas.style.opacity = String(1 - easeOut * 0.2);

          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            if (onProgress) onProgress('processing', 0.5);
            setTimeout(() => {
              canvas.style.transform = 'scale(1)';
              canvas.style.opacity = '1';
              this.saveCanvasAsPNG(canvas, `wavewall_poster_${scale}x.png`);
              if (onProgress) onProgress('saving', 1);
              resolve();
            }, 50);
          }
        };
        animate();
      } catch (e) {
        reject(e);
      }
    });
  }

  static saveCanvasAsPNG(canvas: HTMLCanvasElement, filename: string) {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static generateShareLink(config: PosterConfig): string {
    const minimized: any = {
      v: 1,
      wf: {
        sc: config.waveform.startColor,
        ec: config.waveform.endColor,
        st: config.waveform.style,
        vs: Math.round(config.waveform.verticalScale * 10) / 10,
        cr: config.waveform.cornerRadius,
        bg: config.waveform.barGap
      },
      wd: config.waveformData ? this.compressPeaks(config.waveformData) : null,
      tx: config.texts.map(t => ({
        c: t.content,
        x: Math.round(t.x * 100) / 100,
        y: Math.round(t.y * 100) / 100,
        s: {
          ff: t.style.fontFamily,
          fs: t.style.fontSize,
          cl: t.style.color,
          fw: t.style.fontWeight,
          it: t.style.italic,
          al: t.style.alignment,
          sh: {
            ox: t.style.textShadow.offsetX,
            oy: t.style.textShadow.offsetY,
            br: t.style.textShadow.blur,
            cc: t.style.textShadow.color
          }
        }
      })),
      bg: {
        m: config.background.mode,
        t: config.background.type,
        c: config.background.color,
        sc: config.background.startColor,
        ec: config.background.endColor,
        sx: config.background.startX,
        sy: config.background.startY,
        ex: config.background.endX,
        ey: config.background.endY,
        bl: config.background.blur,
        oo: config.background.overlayOpacity,
        oc: config.background.overlayColor
      },
      cs: config.canvasSize
    };

    let encoded = this.encodeToBase64Url(minimized);
    if (encoded.length > 450) {
      minimized.wd = null;
      encoded = this.encodeToBase64Url(minimized);
    }

    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?p=${encoded}`;
  }

  private static compressPeaks(peaks: number[]): number[] {
    const step = Math.max(1, Math.floor(peaks.length / 100));
    const result: number[] = [];
    for (let i = 0; i < peaks.length; i += step) {
      result.push(Math.round(peaks[i] * 100) / 100);
    }
    return result;
  }

  private static encodeToBase64Url(obj: any): string {
    try {
      const json = JSON.stringify(obj);
      const utf8 = unescape(encodeURIComponent(json));
      let binary = '';
      for (let i = 0; i < utf8.length; i++) {
        binary += String.fromCharCode(utf8.charCodeAt(i));
      }
      const b64 = btoa(binary);
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      console.error('Encode error', e);
      return '';
    }
  }

  static parseShareLink(): PosterConfig | null {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('p');
      if (!p) return null;
      const decoded = this.decodeFromBase64Url(p);
      if (!decoded) return null;
      return this.normalizeConfig(decoded);
    } catch (e) {
      console.error('Parse share link error', e);
      return null;
    }
  }

  private static decodeFromBase64Url(encoded: string): any {
    try {
      let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json);
    } catch (e) {
      console.error('Decode error', e);
      return null;
    }
  }

  private static normalizeConfig(obj: any): PosterConfig {
    return {
      v: obj.v || 1,
      waveform: {
        startColor: obj.wf?.sc || '#00d4ff',
        endColor: obj.wf?.ec || '#9d4edd',
        lineWidth: obj.wf?.lw || 2,
        mirror: obj.wf?.mr ?? true,
        barWidth: obj.wf?.bw || 3,
        barGap: obj.wf?.bg ?? 2,
        cornerRadius: obj.wf?.cr ?? 2,
        style: obj.wf?.st || 'mirror',
        verticalScale: obj.wf?.vs ?? 1
      },
      waveformData: obj.wd || null,
      texts: (obj.tx || []).map((t: any) => ({
        id: t.id || `t${Math.random().toString(36).slice(2, 7)}`,
        content: t.c || '',
        x: t.x ?? 0.5,
        y: t.y ?? 0.85,
        style: {
          fontFamily: t.s?.ff || 'sans-serif',
          fontSize: t.s?.fs || 24,
          color: t.s?.cl || '#ffffff',
          fontWeight: t.s?.fw || 'normal',
          italic: t.s?.it ?? false,
          letterSpacing: t.s?.ls || 0,
          alignment: t.s?.al || 'center',
          textShadow: {
            offsetX: t.s?.sh?.ox || 0,
            offsetY: t.s?.sh?.oy || 0,
            blur: t.s?.sh?.br || 0,
            color: t.s?.sh?.cc || 'rgba(0,0,0,0.5)'
          }
        }
      })),
      background: {
        mode: obj.bg?.m || 'gradient',
        type: obj.bg?.t || 'linear',
        color: obj.bg?.c,
        startColor: obj.bg?.sc,
        endColor: obj.bg?.ec,
        startX: obj.bg?.sx,
        startY: obj.bg?.sy,
        endX: obj.bg?.ex,
        endY: obj.bg?.ey,
        blur: obj.bg?.bl,
        overlayOpacity: obj.bg?.oo,
        overlayColor: obj.bg?.oc
      },
      canvasSize: obj.cs || { width: 1280, height: 720 }
    };
  }
}
