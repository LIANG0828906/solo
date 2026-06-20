import { useComponentStore } from '@/store/componentStore';
import type { CanvasComponent, ComponentItem } from '@/store/componentStore';

interface ExportData {
  canvasComponents: CanvasComponent[];
  componentLibrary: ComponentItem[];
  exportedAt: string;
}

export function exportCharacterData() {
  const state = useComponentStore.getState();
  const data: ExportData = {
    canvasComponents: state.canvasComponents,
    componentLibrary: state.componentLibrary.filter((ci) =>
      state.canvasComponents.some((cc) => cc.componentId === ci.id)
    ),
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `character-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
