export type ElementType = 'rectangle' | 'circle' | 'triangle' | 'hexagon' | 'star' | 'text';

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface ColorScheme {
  id: string;
  primary: string;
  complementary: string[];
  auxiliary: string[];
  createdAt: number;
}

export interface FontPreset {
  name: string;
  displayName: string;
  titleFont: string;
  bodyFont: string;
}

export interface ExportToast {
  visible: boolean;
  message: string;
  downloadUrl?: string;
  shareText?: string;
}

export interface BoardState {
  elements: BoardElement[];
  selectedElementId: string | null;
  colorHistory: ColorScheme[];
  historyIndex: number;
  currentFontPreset: FontPreset;
  currentColorScheme: ColorScheme | null;
  isExporting: boolean;
  exportToast: ExportToast;
}

export interface LayoutState {
  isPanelCollapsed: boolean;
  screenWidth: number;
}
