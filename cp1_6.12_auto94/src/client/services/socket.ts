import { io, Socket } from 'socket.io-client';
import { Card, Group, User } from '../../shared/types';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (socket) {
    return socket;
  }

  socket = io({
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const joinTeam = (teamName: string, nickname: string, color: string, userId: string): void => {
  if (socket) {
    socket.emit('join-team', { teamName, nickname, color, userId });
  }
};

export const leaveTeam = (teamName: string, userId: string): void => {
  if (socket) {
    socket.emit('leave-team', { teamName, userId });
  }
};

export interface SocketEventHandlers {
  onCardCreated?: (card: Card) => void;
  onCardPositionUpdated?: (data: { id: string; x: number; y: number }) => void;
  onCardGroupUpdated?: (data: { id: string; groupId: string | null }) => void;
  onCardDeleted?: (id: string) => void;
  onVoteUpdated?: (data: { cardId: string; votes: number; userId: string; votesRemaining: number }) => void;
  onVotingStarted?: (data: { votingActive: boolean; votingRound: number; users: { id: string; votesRemaining: number }[] }) => void;
  onVotingEnded?: (data: { votingActive: boolean; sortedCards: Card[] }) => void;
  onUserJoined?: (user: User) => void;
  onUserLeft?: (userId: string) => void;
  onGroupCreated?: (group: Group) => void;
  onGroupUpdated?: (group: Group) => void;
  onGroupDeleted?: (id: string) => void;
  onTeamState?: (state: { cards: Card[]; groups: Group[]; users: User[]; votingActive: boolean; votingRound: number }) => void;
}

export const registerSocketHandlers = (handlers: SocketEventHandlers): void => {
  if (!socket) return;

  if (handlers.onCardCreated) {
    socket.on('card:created', handlers.onCardCreated);
  }
  if (handlers.onCardPositionUpdated) {
    socket.on('card:positionUpdated', handlers.onCardPositionUpdated);
  }
  if (handlers.onCardGroupUpdated) {
    socket.on('card:groupUpdated', handlers.onCardGroupUpdated);
  }
  if (handlers.onCardDeleted) {
    socket.on('card:deleted', handlers.onCardDeleted);
  }
  if (handlers.onVoteUpdated) {
    socket.on('vote:updated', handlers.onVoteUpdated);
  }
  if (handlers.onVotingStarted) {
    socket.on('voting:started', handlers.onVotingStarted);
  }
  if (handlers.onVotingEnded) {
    socket.on('voting:ended', handlers.onVotingEnded);
  }
  if (handlers.onUserJoined) {
    socket.on('user:joined', handlers.onUserJoined);
  }
  if (handlers.onUserLeft) {
    socket.on('user:left', handlers.onUserLeft);
  }
  if (handlers.onGroupCreated) {
    socket.on('group:created', handlers.onGroupCreated);
  }
  if (handlers.onGroupUpdated) {
    socket.on('group:updated', handlers.onGroupUpdated);
  }
  if (handlers.onGroupDeleted) {
    socket.on('group:deleted', handlers.onGroupDeleted);
  }
  if (handlers.onTeamState) {
    socket.on('team-state', handlers.onTeamState);
  }
};

export const unregisterSocketHandlers = (handlers: SocketEventHandlers): void => {
  if (!socket) return;

  if (handlers.onCardCreated) {
    socket.off('card:created', handlers.onCardCreated);
  }
  if (handlers.onCardPositionUpdated) {
    socket.off('card:positionUpdated', handlers.onCardPositionUpdated);
  }
  if (handlers.onCardGroupUpdated) {
    socket.off('card:groupUpdated', handlers.onCardGroupUpdated);
  }
  if (handlers.onCardDeleted) {
    socket.off('card:deleted', handlers.onCardDeleted);
  }
  if (handlers.onVoteUpdated) {
    socket.off('vote:updated', handlers.onVoteUpdated);
  }
  if (handlers.onVotingStarted) {
    socket.off('voting:started', handlers.onVotingStarted);
  }
  if (handlers.onVotingEnded) {
    socket.off('voting:ended', handlers.onVotingEnded);
  }
  if (handlers.onUserJoined) {
    socket.off('user:joined', handlers.onUserJoined);
  }
  if (handlers.onUserLeft) {
    socket.off('user:left', handlers.onUserLeft);
  }
  if (handlers.onGroupCreated) {
    socket.off('group:created', handlers.onGroupCreated);
  }
  if (handlers.onGroupUpdated) {
    socket.off('group:updated', handlers.onGroupUpdated);
  }
  if (handlers.onGroupDeleted) {
    socket.off('group:deleted', handlers.onGroupDeleted);
  }
  if (handlers.onTeamState) {
    socket.off('team-state', handlers.onTeamState);
  }
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
