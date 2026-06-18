import { io, Socket } from 'socket.io-client';
import { useMarkersStore } from '../store/markersStore';
import type { Marker, User, RoomState } from '../types';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function initSocket(): Socket {
  if (socket) return socket;

  socket = io({
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Connected to server:', socket!.id);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('room-joined', (data: RoomState) => {
    const { setRoom, currentUser: existingUser } = useMarkersStore.getState();
    const currentUser = data.users.find((u) => u.id === socket!.id);
    if (currentUser) {
      setRoom(data.roomId, currentUser, data.users, data.markers);
    }
  });

  socket.on('user-joined', ({ user }: { user: User }) => {
    useMarkersStore.getState().addUser(user);
  });

  socket.on('user-left', ({ userId }: { userId: string }) => {
    useMarkersStore.getState().removeUser(userId);
  });

  socket.on('marker-added', ({ marker }: { marker: Marker }) => {
    useMarkersStore.getState().addMarker(marker, true);
  });

  socket.on('marker-edited', ({ marker }: { marker: Marker }) => {
    useMarkersStore.getState().editMarker(marker.id, marker.text, true);
  });

  socket.on('marker-deleted', ({ markerId }: { markerId: string }) => {
    useMarkersStore.getState().deleteMarker(markerId, true);
  });

  return socket;
}

export function joinRoom(nickname: string, roomId: string) {
  if (!socket) {
    socket = initSocket();
  }
  socket.emit('join-room', { nickname, roomId });
}

export function addMarker(roomId: string, position: { x: number; y: number; z: number }, text: string) {
  if (!socket) return;
  socket.emit('add-marker', { roomId, position, text });
}

export function editMarker(roomId: string, markerId: string, text: string) {
  if (!socket) return;
  socket.emit('edit-marker', { roomId, markerId, text });
}

export function deleteMarker(roomId: string, markerId: string) {
  if (!socket) return;
  socket.emit('delete-marker', { roomId, markerId });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
