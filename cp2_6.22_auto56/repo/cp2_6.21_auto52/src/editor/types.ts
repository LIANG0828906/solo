export interface ComponentStyle {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fillColorIndex?: number;
  strokeColorIndex?: number;
  textColorIndex?: number;
}

export interface TextData {
  content: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ImageData {
  src?: string;
  alt?: string;
}

export interface ChartSeries {
  name: string;
  value: number;
}

export interface ChartData {
  title: string;
  type: 'bar' | 'line' | 'pie';
  series: ChartSeries[];
}

export interface ShapeData {
  shapeType: 'rectangle' | 'circle' | 'line';
}

export interface Component {
  id: string;
  type: 'text' | 'image' | 'chart' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  borderRadius: number;
  style: ComponentStyle;
  data?: TextData | ImageData | ChartData | ShapeData;
  columnRole?: 'left' | 'right';
}

export interface ThemePalette {
  id: string;
  name: string;
  colors: string[];
}

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  components: Component[];
  isTwoColumn?: boolean;
  columnGap?: number;
}

export interface ExportRecord {
  id: string;
  fileName: string;
  timestamp: number;
  thumbnail: string;
  shortLink: string;
}

export interface EditorStateSnapshot {
  components: Component[];
  theme: ThemePalette;
}
