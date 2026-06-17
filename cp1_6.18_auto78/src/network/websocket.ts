import {
  CollabEvent,
  CollabEventType,
  WhiteboardElement,
  DEFAULT_ROOM_ID,
} from '@types/index';
import { useElementStore } from '@data/elementStore';

type EventHandler = (event: CollabEvent) => void;

const MIN_LATENCY = 0;
const MAX_LATENCY = 100;

function getRandomLatency(): number {
  return Math.floor(Math.random() * (MAX_LATENCY - MIN_LATENCY + 1)) + MIN_LATENCY;
}

class WebSocketManager {
  private roomId: string = DEFAULT_ROOM_ID;
  private handlers: Map<CollabEventType, EventHandler[]> = new Map();
  private connected: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;

  connect(roomId: string = DEFAULT_ROOM_ID): void {
    this.roomId = roomId;
    this.connected = true;

    try {
      this.broadcastChannel = new BroadcastChannel(`canvas_resonance_${roomId}`);
      this.broadcastChannel.onmessage = (e) => {
        const event: CollabEvent = e.data;
        this.deliverEvent(event);
      };
    } catch {
      this.broadcastChannel = null;
    }

    this.simulateOtherUsers();
  }

  disconnect(): void {
    this.connected = false;
    this.broadcastChannel?.close();
    this.broadcastChannel = null;
  }

  on(eventType: CollabEventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  off(eventType: CollabEventType, handler: EventHandler): void {
    const list = this.handlers.get(eventType);
    if (list) {
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
    }
  }

  private deliverEvent(event: CollabEvent): void {
    const state = useElementStore.getState();
    if (event.userId === state.currentUserId) return;

    const latency = getRandomLatency();
    setTimeout(() => {
      const handlers = this.handlers.get(event.type);
      if (handlers) {
        handlers.forEach((h) => h(event));
      }
      this.applyEventToStore(event);
    }, latency);
  }

  private applyEventToStore(event: CollabEvent): void {
    const state = useElementStore.getState();

    switch (event.type) {
      case 'element_add': {
        const el = event.payload as WhiteboardElement;
        const exists = state.elements.some((e) => e.id === el.id);
        if (!exists) {
          useElementStore.setState({
            elements: [...state.elements, el],
            lastOperationTime: Date.now(),
          });
        }
        break;
      }
      case 'element_update': {
        const { id, patch } = event.payload as {
          id: string;
          patch: Partial<WhiteboardElement>;
        };
        useElementStore.setState({
          elements: state.elements.map((e) =>
            e.id === id
              ? ({ ...e, ...patch, updatedAt: Date.now() } as WhiteboardElement)
              : e,
          ),
          lastOperationTime: Date.now(),
        });
        break;
      }
      case 'element_delete': {
        const id = event.payload as string;
        useElementStore.setState({
          elements: state.elements.filter((e) => e.id !== id),
          lastOperationTime: Date.now(),
        });
        break;
      }
      case 'cursor_move': {
        const { userId, x, y } = event.payload as {
          userId: string;
          x: number;
          y: number;
        };
        state.updateCollaboratorCursor(userId, x, y);
        break;
      }
      case 'user_join': {
        const collab = event.payload as {
          id: string;
          name: string;
          color: string;
        };
        const exists = state.collaborators.some((c) => c.id === collab.id);
        if (!exists) {
          state.addCollaborator(collab);
        }
        break;
      }
      case 'user_leave': {
        const id = event.payload as string;
        state.removeCollaborator(id);
        break;
      }
      case 'undo':
      case 'redo': {
        const elements = event.payload as WhiteboardElement[];
        useElementStore.setState({
          elements,
          lastOperationTime: Date.now(),
        });
        break;
      }
      case 'history_load': {
        const elements = event.payload as WhiteboardElement[];
        useElementStore.setState({
          elements,
          lastOperationTime: Date.now(),
        });
        break;
      }
    }
  }

  send(event: Omit<CollabEvent, 'timestamp' | 'roomId'>): void {
    if (!this.connected) return;

    const fullEvent: CollabEvent = {
      ...event,
      roomId: this.roomId,
      timestamp: Date.now(),
    };

    this.broadcastChannel?.postMessage(fullEvent);
  }

  broadcastElementAdd(element: WhiteboardElement): void {
    this.send({
      type: 'element_add',
      userId: useElementStore.getState().currentUserId,
      payload: element,
    });
  }

  broadcastElementUpdate(
    id: string,
    patch: Partial<WhiteboardElement>,
  ): void {
    this.send({
      type: 'element_update',
      userId: useElementStore.getState().currentUserId,
      payload: { id, patch },
    });
  }

  broadcastElementDelete(id: string): void {
    this.send({
      type: 'element_delete',
      userId: useElementStore.getState().currentUserId,
      payload: id,
    });
  }

  broadcastCursorMove(x: number, y: number): void {
    const state = useElementStore.getState();
    state.updateCollaboratorCursor(state.currentUserId, x, y);
    this.send({
      type: 'cursor_move',
      userId: state.currentUserId,
      payload: { userId: state.currentUserId, x, y },
    });
  }

  broadcastUserJoin(): void {
    const state = useElementStore.getState();
    this.send({
      type: 'user_join',
      userId: state.currentUserId,
      payload: {
        id: state.currentUserId,
        name: state.currentUserName,
        color: state.currentUserColor,
      },
    });
  }

  broadcastUndo(elements: WhiteboardElement[]): void {
    this.send({
      type: 'undo',
      userId: useElementStore.getState().currentUserId,
      payload: elements,
    });
  }

  broadcastRedo(elements: WhiteboardElement[]): void {
    this.send({
      type: 'redo',
      userId: useElementStore.getState().currentUserId,
      payload: elements,
    });
  }

  private simulateOtherUsers(): void {
    setTimeout(() => {
      const state = useElementStore.getState();
      if (state.collaborators.length < 3) {
        state.addCollaborator();
      }
    }, 2000);

    setInterval(() => {
      const state = useElementStore.getState();
      const others = state.collaborators.filter((c) => !c.isLocal);
      others.forEach((c) => {
        if (Math.random() < 0.3) {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            state.updateCollaboratorCursor(c.id, x, y);
          }
        }
      });
    }, 1500);
  }
}

export const websocket = new WebSocketManager();
