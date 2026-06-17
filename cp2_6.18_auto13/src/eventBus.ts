// ============================================================================
// eventBus.ts - 自定义事件发射器
// 职责：提供on/emit/off方法，作为模块间通信桥梁
// 调用关系：
//   - dataHandler.ts  emit('dataReady', meshData)  →  renderer.ts on('dataReady', ...)
//   - uiControl.ts    emit('filterChange', range)  →  renderer.ts on('filterChange', ...)
//   - uiControl.ts    emit('viewChange', view)     →  renderer.ts on('viewChange', ...)
//   - uiControl.ts    emit('timelinePlay', ...)    →  renderer.ts on('timelinePlay', ...)
//   - renderer.ts     emit('statsUpdate', stats)   →  uiControl.ts on('statsUpdate', ...)
// 数据流向：各模块通过事件总线松耦合通信，不直接依赖
// ============================================================================

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`[EventBus] Error in event "${event}":`, error);
        }
      });
    }
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  clear(): void {
    this.events.clear();
  }
}

export const eventBus = new EventBus();
