export interface Breakpoint {
  id: string;
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'large';
}

const DEFAULT_BREAKPOINTS = [360, 768, 1024, 1440];
const MAX_BREAKPOINTS = 6;
const MIN_WIDTH = 240;
const MAX_WIDTH = 2000;
const ASPECT_RATIO = 16 / 9;

function getDeviceType(width: number): Breakpoint['deviceType'] {
  if (width < 480) return 'mobile';
  if (width < 900) return 'tablet';
  if (width <= 1440) return 'desktop';
  return 'large';
}

export function getDeviceTypeName(deviceType: Breakpoint['deviceType']): string {
  const names: Record<Breakpoint['deviceType'], string> = {
    mobile: '手机',
    tablet: '平板',
    desktop: '桌面',
    large: '大屏',
  };
  return names[deviceType];
}

export class AdapterManager {
  private breakpoints: Breakpoint[] = [];
  private aspectRatioLocked: boolean = false;
  private viewportHeight: number = 0;

  constructor(viewportHeight: number = 800) {
    this.viewportHeight = viewportHeight;
    this.initializeDefaultBreakpoints();
  }

  private initializeDefaultBreakpoints(): void {
    this.breakpoints = DEFAULT_BREAKPOINTS.map((width, index) => ({
      id: `breakpoint-${index}`,
      width,
      height: this.calculateHeight(width),
      deviceType: getDeviceType(width),
    }));
  }

  private calculateHeight(width: number): number {
    if (this.aspectRatioLocked) {
      return Math.round(width / ASPECT_RATIO);
    }
    return Math.round(this.viewportHeight * 0.85);
  }

  getBreakpoints(): Breakpoint[] {
    return [...this.breakpoints];
  }

  updateBreakpointWidth(id: string, width: number): Breakpoint | null {
    const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
    const index = this.breakpoints.findIndex((bp) => bp.id === id);
    if (index === -1) return null;

    const updated: Breakpoint = {
      ...this.breakpoints[index],
      width: clampedWidth,
      height: this.calculateHeight(clampedWidth),
      deviceType: getDeviceType(clampedWidth),
    };

    this.breakpoints[index] = updated;
    return updated;
  }

  addBreakpoint(width?: number): Breakpoint | null {
    if (this.breakpoints.length >= MAX_BREAKPOINTS) return null;

    const newWidth = width ?? this.suggestNewWidth();
    const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
    const newBreakpoint: Breakpoint = {
      id: `breakpoint-${Date.now()}`,
      width: clampedWidth,
      height: this.calculateHeight(clampedWidth),
      deviceType: getDeviceType(clampedWidth),
    };

    this.breakpoints.push(newBreakpoint);
    this.breakpoints.sort((a, b) => a.width - b.width);
    return newBreakpoint;
  }

  removeBreakpoint(id: string): boolean {
    if (this.breakpoints.length <= 1) return false;
    const index = this.breakpoints.findIndex((bp) => bp.id === id);
    if (index === -1) return false;
    this.breakpoints.splice(index, 1);
    return true;
  }

  setAspectRatioLocked(locked: boolean): void {
    this.aspectRatioLocked = locked;
    this.breakpoints = this.breakpoints.map((bp) => ({
      ...bp,
      height: this.calculateHeight(bp.width),
    }));
  }

  isAspectRatioLocked(): boolean {
    return this.aspectRatioLocked;
  }

  setViewportHeight(height: number): void {
    this.viewportHeight = height;
    if (!this.aspectRatioLocked) {
      this.breakpoints = this.breakpoints.map((bp) => ({
        ...bp,
        height: this.calculateHeight(bp.width),
      }));
    }
  }

  private suggestNewWidth(): number {
    const widths = this.breakpoints.map((bp) => bp.width);
    const maxWidth = Math.max(...widths);
    const suggested = maxWidth + 200;
    return Math.min(suggested, MAX_WIDTH);
  }

  getMinWidth(): number {
    return MIN_WIDTH;
  }

  getMaxWidth(): number {
    return MAX_WIDTH;
  }

  getMaxBreakpoints(): number {
    return MAX_BREAKPOINTS;
  }
}
