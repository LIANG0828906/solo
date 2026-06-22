import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';

const SOCKET_URL = 'http://localhost:3001';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  const store = useGameStore;
  store.getState().setSocket(socket);

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });

  socket.on('character:place', (data: { character: any; x: number; y: number }) => {
    const state = store.getState();
    const exists = state.characters.find(c => c.id === data.character.id);
    if (!exists) {
      state.grid.placeCharacter(data.character.id, data.x, data.y);
      store.setState({
        characters: [...state.characters, { ...data.character, x: data.x, y: data.y }],
      });
    }
  });

  socket.on('character:move', (data: { characterId: string; x: number; y: number }) => {
    const state = store.getState();
    state.grid.moveCharacter(data.characterId, data.x, data.y);
    store.setState({
      characters: state.characters.map(c =>
        c.id === data.characterId ? { ...c, x: data.x, y: data.y } : c
      ),
    });
  });

  socket.on('character:attack', (data: { attackerId: string; targetId: string; damage: number; damageType: string; targetHp: number }) => {
    const state = store.getState();
    const target = state.characters.find(c => c.id === data.targetId);
    if (!target) return;
    const floatingDamage = {
      id: `dmg-${Date.now()}-${Math.random()}`,
      x: target.x * state.grid.cellSize + state.grid.cellSize / 2,
      y: target.y * state.grid.cellSize,
      damage: data.damage,
      damageType: data.damageType as any,
      startTime: performance.now(),
    };
    store.setState({
      characters: state.characters.map(c =>
        c.id === data.targetId ? { ...c, hp: data.targetHp, isAlive: data.targetHp > 0 } : c
      ),
      floatingDamages: [...state.floatingDamages, floatingDamage],
      attackAnimations: new Map(state.attackAnimations).set(data.targetId, performance.now()),
    });
    setTimeout(() => {
      store.getState().removeFloatingDamage(floatingDamage.id);
      store.getState().removeAttackAnimation(data.targetId);
    }, 800);
  });

  socket.on('battle:log', (data: { type: string; message: string; characterId?: string; targetId?: string }) => {
    store.getState().addBattleLog(data.type as any, data.message, data.characterId, data.targetId);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function emitBattleEvent(event: string, data: any): void {
  if (socket?.connected) {
    socket.emit(event, data);
  }
}

export { socket };
