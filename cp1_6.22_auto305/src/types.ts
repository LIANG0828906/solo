export interface MaterialItem {
  id: string;
  type: 'image' | 'text';
  name: string;
  thumbnail?: string;
  content?: string;
}

export interface CanvasBlock {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
  content: string;
  textStyle?: TextStyle;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number;
  backgroundType: 'solid' | 'glass';
  backgroundColor: string;
}

export interface ColorSwatch {
  id: string;
  hex: string;
  sourceBlockId?: string;
}

export interface ArrowAnnotation {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  lineWidth: number;
  zIndex: number;
}

export interface CanvasState {
  blocks: CanvasBlock[];
  colorSwatches: ColorSwatch[];
  annotations: ArrowAnnotation[];
  selectedId: string | null;
  zoom: number;
  panX: number;
  panY: number;
}

export const FONT_OPTIONS = [
  { value: "'Playfair Display', serif", label: 'Playfair Display' },
  { value: "'Space Mono', monospace", label: 'Space Mono' },
  { value: "'Cormorant Garamond', serif", label: 'Cormorant Garamond' },
];

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: FONT_OPTIONS[0].value,
  fontSize: 24,
  color: '#e0e0e0',
  opacity: 100,
  backgroundType: 'solid',
  backgroundColor: 'transparent',
};
