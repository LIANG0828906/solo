type EventHandler = (...args: any[]) => void;

class EventBus {
  private events: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (e) {
          console.error(`[EventBus] Error in handler for ${event}:`, e);
        }
      });
    }
  }

  clear(): void {
    this.events.clear();
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  MATERIAL_DRAG_START: 'material:drag:start',
  MATERIAL_DRAG_END: 'material:drag:end',
  MATERIAL_DROPPED: 'material:dropped',
  CHART_DATA_BLOCK_ADDED: 'chart:dataBlock:added',
  RENDER_CHART: 'render:chart',
  CHART_RENDERED: 'chart:rendered',
  CHART_CONFIG_UPDATE: 'chart:config:update',
  CHART_DELETE: 'chart:delete',
  STORY_VIEW_TOGGLE: 'story:view:toggle',
  CONNECTION_CREATE: 'connection:create',
  CONNECTION_REMOVE: 'connection:remove',
  CHART_CLICKED: 'chart:clicked',
  CHART_DOUBLE_CLICKED: 'chart:doubleClicked',
  PANEL_TOGGLE: 'panel:toggle'
};

export default eventBus;
