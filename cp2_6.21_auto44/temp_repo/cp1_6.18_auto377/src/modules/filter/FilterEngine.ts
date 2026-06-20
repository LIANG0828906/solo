import type { Filters, BlendMode } from '../../types';
import { useCanvasStore } from '../../store/useCanvasStore';

export interface FilterStyle {
  filter: string;
  mixBlendMode: BlendMode;
  opacity: number;
}

export class FilterEngine {
  static buildFilterString(filters: Filters): string {
    const parts: string[] = [];
    if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
    if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
    if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
    if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`);
    if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
    return parts.length > 0 ? parts.join(' ') : 'none';
  }

  static getElementStyle(filters: Filters, blendMode: BlendMode): FilterStyle {
    return {
      filter: FilterEngine.buildFilterString(filters),
      mixBlendMode: blendMode,
      opacity: filters.opacity / 100,
    };
  }

  static setBlur(value: number): void {
    useCanvasStore.getState().updateFilter('blur', value);
  }

  static setBrightness(value: number): void {
    useCanvasStore.getState().updateFilter('brightness', value);
  }

  static setContrast(value: number): void {
    useCanvasStore.getState().updateFilter('contrast', value);
  }

  static setSaturate(value: number): void {
    useCanvasStore.getState().updateFilter('saturate', value);
  }

  static setHueRotate(value: number): void {
    useCanvasStore.getState().updateFilter('hueRotate', value);
  }

  static setOpacity(value: number): void {
    useCanvasStore.getState().updateFilter('opacity', value);
  }

  static setBlendMode(mode: BlendMode): void {
    useCanvasStore.getState().updateBlendMode(mode);
  }

  static resetAll(): void {
    useCanvasStore.getState().resetFilters();
  }

  static getSelectedFilters(): Filters | null {
    const els = useCanvasStore.getState().elements;
    const selected = useCanvasStore.getState().selectedIds;
    if (selected.length === 0) return null;
    const el = els.find((e) => e.id === selected[0]);
    return el ? el.filters : null;
  }

  static getSelectedBlendMode(): BlendMode | null {
    const els = useCanvasStore.getState().elements;
    const selected = useCanvasStore.getState().selectedIds;
    if (selected.length === 0) return null;
    const el = els.find((e) => e.id === selected[0]);
    return el ? el.blendMode : null;
  }
}
