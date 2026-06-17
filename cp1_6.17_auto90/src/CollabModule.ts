import { Shape, User } from './types';
import { useBoardStore } from './BoardStore';
import { HistoryModule } from './HistoryModule';

type CollabMessage =
  | { type: 'hello'; user: User }
  | { type: 'welcome'; users: User[]; shapes: Shape[] }
  | { type: 'user-join'; user: User }
  | { type: 'user-leave'; userId: string }
  | { type: 'shape-add'; shape: Shape; fromUser: string }
  | { type: 'shape-update'; shape: Shape; fromUser: string }
  | { type: 'shape-delete'; shapeId: string; fromUser: string };

class CollabModuleClass {
  private connected = false;
  private messageQueue: CollabMessage[] = [];
  private simulatedUsers: User[] = [
    { id: 'user-mock-1', name: '小A', avatar: '🧑', color: '#FF6B6B' },
    { id: 'user-mock-2', name: '小B', avatar: '👩', color: '#4ECDC4' },
  ];
  private initialized = false;

  connect() {
    if (this.connected) return;

    const currentUser = useBoardStore.getState().currentUser;
    this.connected = true;

    setTimeout(() => {
      this.receiveMessage({
        type: 'welcome',
        users: [currentUser, ...this.simulatedUsers],
        shapes: useBoardStore.getState().shapes,
      });

      this.simulatedUsers.forEach((u) => {
        setTimeout(() => {
          this.receiveMessage({ type: 'user-join', user: u });
        }, 500 + Math.random() * 1000);
      });
    }, 100);

    HistoryModule.setUsers([currentUser, ...this.simulatedUsers]);

    if (!this.initialized) {
      this.initialized = true;
      this.startSimulatedActivity();
    }
  }

  disconnect() {
    this.connected = false;
  }

  send<T extends CollabMessage>(message: T) {
    if (!this.connected) {
      this.messageQueue.push(message);
      return;
    }
    setTimeout(() => {
      this.broadcastToOthers(message);
    }, 50 + Math.random() * 100);
  }

  private broadcastToOthers(message: CollabMessage) {
    const currentUserId = useBoardStore.getState().currentUser.id;
    if ('fromUser' in message && message.fromUser === currentUserId) {
      setTimeout(() => this.receiveMessage(message), 0);
    }
  }

  private receiveMessage(message: CollabMessage) {
    const state = useBoardStore.getState();

    switch (message.type) {
      case 'welcome':
        useBoardStore.setState({ onlineUsers: message.users });
        break;

      case 'user-join':
        const exists = state.onlineUsers.find((u) => u.id === message.user.id);
        if (!exists) {
          useBoardStore.setState({
            onlineUsers: [...state.onlineUsers, message.user],
          });
          HistoryModule.addUser(message.user);
        }
        break;

      case 'user-leave':
        useBoardStore.setState({
          onlineUsers: state.onlineUsers.filter((u) => u.id !== message.userId),
        });
        break;

      case 'shape-add': {
        if (message.fromUser === state.currentUser.id) return;
        const exists = state.shapes.find((s) => s.id === message.shape.id);
        if (exists) return;

        const shapeWithPulse = { ...message.shape, pulseSync: true };
        useBoardStore.setState({
          shapes: [...state.shapes, shapeWithPulse],
        });
        HistoryModule.recordAction(
          message.fromUser,
          'add',
          message.shape.id,
          useBoardStore.getState().shapes
        );
        setTimeout(() => {
          useBoardStore.getState().setPulseSync(message.shape.id, false);
        }, 300);
        break;
      }

      case 'shape-update': {
        if (message.fromUser === state.currentUser.id) return;
        useBoardStore.setState({
          shapes: state.shapes.map((s) =>
            s.id === message.shape.id
              ? { ...message.shape, pulseSync: true }
              : s
          ),
        });
        HistoryModule.recordAction(
          message.fromUser,
          'modify',
          message.shape.id,
          useBoardStore.getState().shapes
        );
        setTimeout(() => {
          useBoardStore.getState().setPulseSync(message.shape.id, false);
        }, 300);
        break;
      }

      case 'shape-delete': {
        if (message.fromUser === state.currentUser.id) return;
        useBoardStore.setState({
          shapes: state.shapes.filter((s) => s.id !== message.shapeId),
          selectedId:
            state.selectedId === message.shapeId ? null : state.selectedId,
        });
        HistoryModule.recordAction(
          message.fromUser,
          'delete',
          message.shapeId,
          useBoardStore.getState().shapes
        );
        break;
      }
    }
  }

  private startSimulatedActivity() {
    const makeShape = (userId: string, userName: string): Shape => {
      const types: Shape['type'][] = ['rectangle', 'circle', 'diamond'];
      const type = types[Math.floor(Math.random() * types.length)];
      const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
      const fills = ['#FF6B6B33', '#4ECDC433', '#FFE66D33', '#95E1D333', '#F3818133'];
      const idx = Math.floor(Math.random() * colors.length);
      const w = 60 + Math.random() * 80;
      const h = 60 + Math.random() * 80;

      return {
        id: `sim-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        x: 200 + Math.random() * 600,
        y: 200 + Math.random() * 400,
        width: w,
        height: h,
        fill: fills[idx],
        stroke: colors[idx],
        strokeWidth: 2,
        rotation: Math.floor((Math.random() - 0.5) * 30),
        opacity: 0.9,
        createdAt: Date.now(),
        createdBy: userId,
      };
    };

    setInterval(() => {
      if (!this.connected) return;

      const action = Math.random();
      const user = this.simulatedUsers[Math.floor(Math.random() * this.simulatedUsers.length)];
      const shapes = useBoardStore.getState().shapes;
      const userShapes = shapes.filter((s) => s.createdBy === user.id);

      if (action < 0.5 && shapes.length < 30) {
        const shape = makeShape(user.id, user.name);
        this.receiveMessage({
          type: 'shape-add',
          shape,
          fromUser: user.id,
        });
      } else if (action < 0.85 && userShapes.length > 0) {
        const shape = userShapes[Math.floor(Math.random() * userShapes.length)];
        const updated = {
          ...shape,
          x: shape.x + (Math.random() - 0.5) * 100,
          y: shape.y + (Math.random() - 0.5) * 100,
        };
        this.receiveMessage({
          type: 'shape-update',
          shape: updated,
          fromUser: user.id,
        });
      } else if (userShapes.length > 0) {
        const shape = userShapes[Math.floor(Math.random() * userShapes.length)];
        this.receiveMessage({
          type: 'shape-delete',
          shapeId: shape.id,
          fromUser: user.id,
        });
      }
    }, 3500 + Math.random() * 2500);
  }

  broadcastAdd(shape: Shape) {
    const fromUser = useBoardStore.getState().currentUser.id;
    this.send({ type: 'shape-add', shape, fromUser });
  }

  broadcastUpdate(shape: Shape) {
    const fromUser = useBoardStore.getState().currentUser.id;
    this.send({ type: 'shape-update', shape, fromUser });
  }

  broadcastDelete(shapeId: string) {
    const fromUser = useBoardStore.getState().currentUser.id;
    this.send({ type: 'shape-delete', shapeId, fromUser });
  }
}

export const CollabModule = new CollabModuleClass();
