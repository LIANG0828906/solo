export interface AnchorPoint {
  x: number;
  y: number;
}

export interface SvgLayer {
  id: string;
  d: string;
  type: 'outline' | 'shadow' | 'highlight';
  name: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
  anchors: AnchorPoint[];
  visible: boolean;
}

export interface ConvertResult {
  paths: SvgLayer[];
  width: number;
  height: number;
  layers: string[];
}

export interface ExportOptions {
  format: 'svg' | 'png' | 'json';
  selectedLayerIds: string[];
  bgColor: string;
}

export interface AppState {
  uploadedImage: string | null;
  convertedResult: ConvertResult | null;
  layers: SvgLayer[];
  selectedLayerIds: string[];
  isConverting: boolean;
  fineness: number;
  exportModalOpen: boolean;
  exportOptions: ExportOptions;
}
