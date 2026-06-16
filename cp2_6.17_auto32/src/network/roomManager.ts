import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../game/types';
import { useBoardStore } from '../game/board';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function initSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket) {
    return socket;
  }

  socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  setupSocketListeners(socket);

  return socket;
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  return socket;
}

function setupSocketListeners(socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
  const store = useBoardStore;

  socket.on('room:joined', (data) => {
    store.getState().setRoomCode(data.roomCode);
    store.getState().setLocalPlayer(data.player);
    store.getState().setPlayerConnected(data.player, true);
  });

  socket.on('room:full', () => {
    console.log('Room is full, game starting...');
  });

  socket.on('game:start', (state) => {
    store.getState().setState({
      ...state,
      phase: 'playing'
    });
  });

  socket.on('game:state', (state) => {
    store.getState().setState(state);
  });

  socket.on('game:turn', (data) => {
    store.getState().setTurn(data.turn, data.phase, data.time);
  });

  socket.on('element:moved', (data) => {
    const localPlayer = store.getState().localPlayer;
    const element = store.getState().elements.find(e => e.id === data.elementId);
    
    if (element && element.owner !== localPlayer) {
      store.getState().moveElement(data.elementId, data.position);
    }
  });

  socket.on('laser:fired', (result) => {
    const firingPlayer = store.getState().currentTurn;
    store.getState().applyLaserResult(result, firingPlayer);
    store.getState().setIsFiring(true);
    
    setTimeout(() => {
      store.getState().setIsFiring(false);
    }, 2000);
  });

  socket.on('game:end', (data) => {
    store.getState().endGame(data.winner);
  });

  socket.on('error', (message) => {
    console.error('Socket error:', message);
    alert(message);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('connect', () => {
    console.log('Connected to server');
  });
}

export function createRoom(): void {
  if (!socket) {
    socket = initSocket();
  }
  socket.emit('room:create');
}

export function joinRoom(roomCode: string): void {
  if (!socket) {
    socket = initSocket();
  }
  socket.emit('room:join', roomCode);
}

export function moveElement(elementId: string, position: { x: number; y: number }): void {
  if (!socket) return;
  socket.emit('element:move', { elementId, position });
}

export function fireLaser(): void {
  if (!socket) return;
  socket.emit('laser:fire');
}

export function restartGame(): void {
  if (!socket) {
    socket = initSocket();
  }
  socket.emit('game:restart');
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
