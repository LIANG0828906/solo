import type { ColorStop, GradientConfig } from '../types';
import { hexToRgb, rgbToHex, clamp, generateId } from '../utils/colorUtils';

class ColorEngine {
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      return t < 0.5 ? color1 : color2;
    }

    const r = this.lerp(rgb1.r, rgb2.r, t);
    const g = this.lerp(rgb1.g, rgb2.g, t);
    const b = this.lerp(rgb1.b, rgb2.b, t);

    return rgbToHex(r, g, b);
  }

  public generateColors(config: GradientConfig): string[] {
    const { stops, steps } = config;
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const colors: string[] = [];

    if (sortedStops.length === 0) {
      return Array(steps).fill('#FFFFFF');
    }

    if (sortedStops.length === 1) {
      return Array(steps).fill(sortedStops[0].color);
    }

    for (let i = 0; i < steps; i++) {
      const position = (i / (steps - 1)) * 100;

      let stopIndex = 0;
      while (stopIndex < sortedStops.length - 1 && sortedStops[stopIndex + 1].position <= position) {
        stopIndex++;
      }

      if (stopIndex >= sortedStops.length - 1) {
        colors.push(sortedStops[sortedStops.length - 1].color);
      } else {
        const stop1 = sortedStops[stopIndex];
        const stop2 = sortedStops[stopIndex + 1];
        const range = stop2.position - stop1.position;
        const localT = range === 0 ? 0 : (position - stop1.position) / range;
        colors.push(this.interpolateColor(stop1.color, stop2.color, localT));
      }
    }

    return colors;
  }

  public generateCSSGradient(config: GradientConfig): string {
    const { stops, angle } = config;
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopsString = sortedStops.map((stop) => `${stop.color} ${stop.position}%`).join(', ');
    return `linear-gradient(${angle}deg, ${stopsString})`;
  }

  public addStop(stops: ColorStop[], color: string, position: number): ColorStop[] {
    if (stops.length >= 8) {
      return stops;
    }

    const newStop: ColorStop = {
      id: generateId(),
      color,
      position: clamp(position, 0, 100)
    };

    const newStops = [...stops, newStop];
    return newStops.sort((a, b) => a.position - b.position);
  }

  public removeStop(stops: ColorStop[], id: string): ColorStop[] {
    if (stops.length <= 2) {
      return stops;
    }
    return stops.filter((stop) => stop.id !== id);
  }

  public updateStop(stops: ColorStop[], id: string, updates: Partial<ColorStop>): ColorStop[] {
    return stops.map((stop) => {
      if (stop.id === id) {
        const updated = { ...stop, ...updates };
        if (updates.position !== undefined) {
          updated.position = clamp(updates.position, 0, 100);
        }
        return updated;
      }
      return stop;
    });
  }

  public validateStops(stops: ColorStop[]): boolean {
    if (stops.length < 2 || stops.length > 8) {
      return false;
    }
    return stops.every(
      (stop) =>
        typeof stop.id === 'string' &&
        typeof stop.color === 'string' &&
        /^#[0-9A-Fa-f]{6}$/.test(stop.color) &&
        typeof stop.position === 'number' &&
        stop.position >= 0 &&
        stop.position <= 100
    );
  }

  public getGradientPositionAtAngle(angle: number, width: number, height: number): { x1: number; y1: number; x2: number; y2: number } {
    const rad = (angle * Math.PI) / 180;
    const centerX = width / 2;
    const centerY = height / 2;
    const diagonal = Math.sqrt(width * width + height * height) / 2;

    const x1 = centerX - Math.cos(rad) * diagonal;
    const y1 = centerY - Math.sin(rad) * diagonal;
    const x2 = centerX + Math.cos(rad) * diagonal;
    const y2 = centerY + Math.sin(rad) * diagonal;

    return { x1, y1, x2, y2 };
  }

  public createLinearGradient(
    ctx: CanvasRenderingContext2D,
    config: GradientConfig,
    width: number,
    height: number
  ): CanvasGradient {
    const { stops, angle } = config;
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const { x1, y1, x2, y2 } = this.getGradientPositionAtAngle(angle, width, height);

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    sortedStops.forEach((stop) => {
      gradient.addColorStop(stop.position / 100, stop.color);
    });

    return gradient;
  }
}

export const colorEngine = new ColorEngine();
