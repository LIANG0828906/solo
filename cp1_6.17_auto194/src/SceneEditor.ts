import { usePixelStore, SceneElement } from './store';
import { eventBus } from './EventBus';
import { assetManager } from './AssetManager';

class SceneEditorClass {
  addElement(assetId: string, x: number, y: number): void {
    const asset = assetManager.getAsset(assetId);
    if (!asset) return;
    const store = usePixelStore.getState();
    store.addElement({
      assetId,
      x,
      y,
      scale: 1,
      opacity: 100,
    });
  }

  removeElement(elementId: string): void {
    const store = usePixelStore.getState();
    store.removeElement(elementId);
  }

  updateElement(elementId: string, updates: Partial<SceneElement>): void {
    const store = usePixelStore.getState();
    store.updateElement(elementId, updates);
  }

  selectElement(elementId: string | null): void {
    const store = usePixelStore.getState();
    store.setSelectedElement(elementId);
  }

  getSelectedElement(): SceneElement | undefined {
    const store = usePixelStore.getState();
    if (!store.selectedElementId) return undefined;
    const frame = store.getCurrentFrame();
    return frame?.elements.find(el => el.id === store.selectedElementId);
  }

  moveElement(elementId: string, x: number, y: number): void {
    this.updateElement(elementId, { x, y });
    eventBus.emit('element:updated', { elementId, updates: { x, y } });
  }
}

export const sceneEditor = new SceneEditorClass();
