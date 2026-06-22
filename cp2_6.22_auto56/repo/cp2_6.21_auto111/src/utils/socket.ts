import { io, Socket } from 'socket.io-client';
import type { Poll } from '../types';

let socket: Socket | null = null;
let isConnected = false;

type VoteUpdateCallback = (poll: Poll) => void;

export function connect(): void {
  if (socket) return;

  socket = io(window.location.host, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    isConnected = true;
  });

  socket.on('disconnect', () => {
    isConnected = false;
  });

  socket.on('connect_error', () => {
    isConnected = false;
  });
}

export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
  }
}

export function joinPoll(pollId: string): void {
  if (socket && isConnected) {
    socket.emit('join_poll', { poll_id: pollId });
  }
}

export function leavePoll(pollId: string): void {
  if (socket && isConnected) {
    socket.emit('leave_poll', { poll_id: pollId });
  }
}

export function onVoteUpdate(callback: VoteUpdateCallback): void {
  if (socket) {
    socket.on('vote_update', callback);
  }
}

export function offVoteUpdate(callback: VoteUpdateCallback): void {
  if (socket) {
    socket.off('vote_update', callback);
  }
}

export function onPollData(callback: VoteUpdateCallback): void {
  if (socket) {
    socket.on('poll_data', callback);
  }
}

export function offPollData(callback: VoteUpdateCallback): void {
  if (socket) {
    socket.off('poll_data', callback);
  }
}

export function getConnectionStatus(): boolean {
  return isConnected;
}
