type Handler = (payload?: any) => void;

class EventBusClass {
  private map: Map<string, Set<Handler>> = new Map();

  on(event: string, handler: Handler): () => void {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: Handler): void {
    this.map.get(event)?.delete(handler);
  }

  emit(event: string, payload?: any): void {
    this.map.get(event)?.forEach(h => h(payload));
  }
}

export const EventBus = new EventBusClass();

export const Events = {
  LIGHT_ADD: 'LIGHT_ADD',
  LIGHT_DELETE: 'LIGHT_DELETE',
  LIGHT_UPDATE: 'LIGHT_UPDATE',
  LIGHT_SELECT: 'LIGHT_SELECT',
  SCENE_DRAG_UPDATE: 'SCENE_DRAG_UPDATE',
  SCENE_LIGHT_CLICK: 'SCENE_LIGHT_CLICK',
  SCHEME_SAVE: 'SCHEME_SAVE',
  SCHEME_DELETE: 'SCHEME_DELETE',
  SCHEME_SWITCH: 'SCHEME_SWITCH',
  THUMBNAIL_CAPTURED: 'THUMBNAIL_CAPTURED',
} as const;
