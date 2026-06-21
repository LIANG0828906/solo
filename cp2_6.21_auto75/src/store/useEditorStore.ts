import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Panel,
  Layer,
  ScriptLine,
  EditorStore,
  CameraType,
  TextStyle,
} from '../types';

const createDefaultPanel = (x = 100, y = 100): Panel => ({
  id: uuidv4(),
  x,
  y,
  width: 320,
  height: 240,
  borderRadius: 4,
  backgroundColor: '#ffffff',
  cameraType: null,
  cameraNote: '',
  layers: [],
});

const createDefaultTextLayer = (content: string): Layer => {
  const defaultStyle: TextStyle = {
    fontFamily: 'Noto Sans SC',
    fontSize: 16,
    color: '#2d2d2d',
    textAlign: 'left',
  };
  return {
    id: uuidv4(),
    type: 'text',
    x: 20,
    y: 20,
    rotation: 0,
    scale: 1,
    content,
    style: defaultStyle,
  };
};

const splitIntoSentences = (text: string): string[] => {
  if (!text.trim()) return [];
  const sentences = text
    .split(/(?<=[。！？!?；;\n])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return sentences.length > 0 ? sentences : [text.trim()];
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  panels: [createDefaultPanel(80, 80), createDefaultPanel(460, 80)],
  selectedPanelIds: [],
  scriptLines: [],
  scriptInput: '',
  selectedLayerId: null,
  selectedPanelIdForCamera: null,
  viewportOffset: { x: 0, y: 0 },

  addPanel: (panel) =>
    set((state) => ({
      panels: [...state.panels, { ...createDefaultPanel(), ...panel }],
    })),

  updatePanel: (id, updates) =>
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),

  deletePanel: (id) =>
    set((state) => ({
      panels: state.panels.filter((p) => p.id !== id),
      selectedPanelIds: state.selectedPanelIds.filter((pid) => pid !== id),
      scriptLines: state.scriptLines.map((l) =>
        l.targetPanelId === id ? { ...l, assigned: false, targetPanelId: null } : l,
      ),
    })),

  selectPanels: (ids) => set({ selectedPanelIds: ids }),

  batchUpdatePanels: (ids, updates) =>
    set((state) => ({
      panels: state.panels.map((p) =>
        ids.includes(p.id) ? { ...p, ...updates } : p,
      ),
    })),

  addLayerToPanel: (panelId, layer) =>
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === panelId ? { ...p, layers: [...p.layers, layer] } : p,
      ),
    })),

  updateLayer: (panelId, layerId, updates) =>
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === panelId
          ? {
              ...p,
              layers: p.layers.map((l) =>
                l.id === layerId ? { ...l, ...updates } : l,
              ),
            }
          : p,
      ),
    })),

  removeLayer: (panelId, layerId) =>
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === panelId
          ? { ...p, layers: p.layers.filter((l) => l.id !== layerId) }
          : p,
      ),
      selectedLayerId:
        get().selectedLayerId === layerId ? null : get().selectedLayerId,
    })),

  selectLayer: (layerId) => set({ selectedLayerId: layerId }),

  setScriptInput: (text) => set({ scriptInput: text }),

  splitScriptToLines: () => {
    const state = get();
    const sentences = splitIntoSentences(state.scriptInput);
    if (sentences.length === 0) return;

    const existingContents = new Set(state.scriptLines.map((l) => l.content));
    const newLines: ScriptLine[] = sentences
      .filter((s) => !existingContents.has(s))
      .map((s) => ({
        id: uuidv4(),
        content: s,
        assigned: false,
        targetPanelId: null,
      }));

    set({
      scriptLines: [...state.scriptLines, ...newLines],
      scriptInput: '',
    });
  },

  assignScriptLineToPanel: (lineId, panelId) => {
    const state = get();
    const line = state.scriptLines.find((l) => l.id === lineId);
    if (!line) return;

    const layer = createDefaultTextLayer(line.content);
    get().addLayerToPanel(panelId, layer);

    set({
      scriptLines: state.scriptLines.map((l) =>
        l.id === lineId ? { ...l, assigned: true, targetPanelId: panelId } : l,
      ),
    });
  },

  removeScriptLine: (lineId) =>
    set((state) => ({
      scriptLines: state.scriptLines.filter((l) => l.id !== lineId),
    })),

  setCameraType: (panelId, cameraType) =>
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === panelId ? { ...p, cameraType } : p,
      ),
    })),

  setCameraNote: (panelId, note) =>
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === panelId ? { ...p, cameraNote: note.slice(0, 50) } : p,
      ),
    })),

  setSelectedPanelForCamera: (panelId) =>
    set({ selectedPanelIdForCamera: panelId }),

  setViewportOffset: (offset) => set({ viewportOffset: offset }),

  exportPdf: async () => {
    try {
      const state = get();
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panels: state.panels,
          scriptLines: state.scriptLines,
        }),
      });

      if (!response.ok) throw new Error('PDF生成失败');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `分镜脚本_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出PDF失败:', err);
      alert('导出PDF失败，请确保后端服务已启动');
    }
  },

  generateShareLink: async () => {
    try {
      const state = get();
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panels: state.panels,
          scriptLines: state.scriptLines,
        }),
      });

      if (!response.ok) throw new Error('生成分享链接失败');
      const data = await response.json();
      if (data.shareUrl) {
        const fullUrl = `${window.location.origin}${data.shareUrl}`;
        navigator.clipboard?.writeText(fullUrl).catch(() => {});
        alert(`分享链接已生成并复制到剪贴板:\n${fullUrl}`);
        return data.shareUrl;
      }
      return null;
    } catch (err) {
      console.error('生成分享链接失败:', err);
      alert('生成分享链接失败，请确保后端服务已启动');
      return null;
    }
  },
}));
