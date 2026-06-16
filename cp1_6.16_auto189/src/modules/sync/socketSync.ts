import { io, Socket } from 'socket.io-client';
import type { RoomState, Slot } from '../types';
import { useRoomStore } from '../room/store/roomStore';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  socket = io(`${protocol}//${host}`, {
    transports: ['websocket', 'polling'],
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });

  socket.on('room-state', (state: RoomState) => {
    const store = useRoomStore.getState();
    store.setRoomState({
      players: state.players,
      areas: state.areas,
      items: state.items,
      interactionPoints: state.interactionPoints,
      slots: state.slots,
      gameStarted: state.gameStarted,
      gameComplete: state.gameComplete,
    });
  });

  socket.on('player-joined', (data: { playerId: string; playerName: string }) => {
    const store = useRoomStore.getState();
    store.addPlayer({ id: data.playerId, name: data.playerName, ready: false, currentArea: 'study' });
  });

  socket.on('player-left', (data: { playerId: string }) => {
    const store = useRoomStore.getState();
    store.removePlayer(data.playerId);
  });

  socket.on('item-picked', (data: { itemId: string; playerId: string }) => {
    const store = useRoomStore.getState();
    store.remotePickItem(data.itemId, data.playerId);
  });

  socket.on('slot-updated', (data: { slots: Slot[] }) => {
    const store = useRoomStore.getState();
    store.remotePlaceSlot(data.slots);
  });

  socket.on('items-combined', (data: {
    newItemId: string;
    removedItems: [string, string];
    revealMessage: string | null;
    unlockAreaId: string | null;
  }) => {
    const store = useRoomStore.getState();
    store.remoteCombinationResult(
      data.newItemId,
      data.removedItems,
      data.revealMessage,
      data.unlockAreaId,
      false
    );
  });

  socket.on('area-unlocked', (data: { areaId: string }) => {
    const store = useRoomStore.getState();
    store.unlockArea(data.areaId);
  });

  socket.on('game-complete', () => {
    const store = useRoomStore.getState();
    store.setGameComplete();
  });

  return socket;
}

export function joinRoom(roomId: string, playerName: string): void {
  if (!socket) connectSocket();
  const id = socket?.id ?? '';
  const store = useRoomStore.getState();
  store.setPlayerInfo(id, playerName);
  store.setRoomId(roomId);
  socket?.emit('join-room', { roomId, playerName });
}

export function playerReady(): void {
  const store = useRoomStore.getState();
  socket?.emit('player-ready', { roomId: store.roomId });
}

export function pickItem(itemId: string, areaId: string): void {
  const store = useRoomStore.getState();
  socket?.emit('pick-item', { roomId: store.roomId, itemId, areaId });
}

export function placeSlot(itemId: string, slotIndex: number): void {
  const store = useRoomStore.getState();
  socket?.emit('place-slot', { roomId: store.roomId, itemId, slotIndex });
}

export function removeSlot(slotIndex: number): void {
  const store = useRoomStore.getState();
  socket?.emit('remove-slot', { roomId: store.roomId, slotIndex });
}

export function combineItems(slotIndices: [number, number]): void {
  const store = useRoomStore.getState();
  socket?.emit('combine-items', { roomId: store.roomId, slotIndices });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
