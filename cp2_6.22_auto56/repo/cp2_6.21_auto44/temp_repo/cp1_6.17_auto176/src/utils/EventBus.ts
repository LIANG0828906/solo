export enum Events {
  DRAW_START = 'draw:start',
  DRAW_END = 'draw:end',
  FRAME_ADDED = 'frame:added',
  FRAME_REMOVED = 'frame:removed',
  FRAME_CHANGED = 'frame:changed',
  FRAME_REORDERED = 'frame:reordered',
  PLAY_START = 'play:start',
  PLAY_PAUSE = 'play:pause',
  PLAY_STOP = 'play:stop',
  COLOR_CHANGED = 'color:changed',
  THICKNESS_CHANGED = 'thickness:changed',
  EDIT_MODE_ENTER = 'edit:enter',
  EDIT_MODE_EXIT = 'edit:exit',
  SCENE_CLEAR = 'scene:clear',
  TRACE_DELETED = 'trace:deleted',
  NEEDS_THUMBNAIL = 'needs:thumbnail'
}

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;
    callbacks.forEach(callback => callback(...args));
  }
}

export const eventBus = new EventBus();
