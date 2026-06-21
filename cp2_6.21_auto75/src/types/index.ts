export type CameraType =
  | 'fixed'
  | 'push'
  | 'pull'
  | 'pan'
  | 'move'
  | 'follow'
  | 'lowAngle'
  | 'highAngle'
  | null;

export interface TextStyle {
  fontFamily: 'Noto Sans SC' | 'Noto Serif SC' | 'ZCOOL KuaiLe';
  fontSize: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface Layer {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  rotation: number;
  scale: number;
  content: string;
  style?: TextStyle;
}

export interface Panel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
  backgroundColor: string;
  cameraType: CameraType;
  cameraNote: string;
  layers: Layer[];
}

export interface ScriptLine {
  id: string;
  content: string;
  assigned: boolean;
  targetPanelId: string | null;
}

export interface EditorStore {
  panels: Panel[];
  selectedPanelIds: string[];
  scriptLines: ScriptLine[];
  scriptInput: string;
  selectedLayerId: string | null;
  selectedPanelIdForCamera: string | null;
  viewportOffset: { x: number; y: number };

  addPanel: (panel: Partial<Panel>) => void;
  updatePanel: (id: string, updates: Partial<Panel>) => void;
  deletePanel: (id: string) => void;
  selectPanels: (ids: string[]) => void;
  batchUpdatePanels: (ids: string[], updates: Partial<Panel>) => void;

  addLayerToPanel: (panelId: string, layer: Layer) => void;
  updateLayer: (panelId: string, layerId: string, updates: Partial<Layer>) => void;
  removeLayer: (panelId: string, layerId: string) => void;
  selectLayer: (layerId: string | null) => void;

  setScriptInput: (text: string) => void;
  splitScriptToLines: () => void;
  assignScriptLineToPanel: (lineId: string, panelId: string) => void;
  removeScriptLine: (lineId: string) => void;

  setCameraType: (panelId: string, cameraType: CameraType) => void;
  setCameraNote: (panelId: string, note: string) => void;
  setSelectedPanelForCamera: (panelId: string | null) => void;

  setViewportOffset: (offset: { x: number; y: number }) => void;

  exportPdf: () => Promise<void>;
  generateShareLink: () => Promise<string | null>;
}
