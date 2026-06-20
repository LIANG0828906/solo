import { create } from 'zustand';
import type {
  GameState,
  PlayerId,
  GameAction,
  DeployAction,
  Position,
  Unit,
} from '../../shared/types';
import { getSocket } from './socket';
import { BOARD_SIZE } from './constants';

function createEmptyGameState(): GameState {
  const map: GameState['map'] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row: GameState['map'][number] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      row.push({ position: { x, y }, terrain: 'plain' });
    }
    map.push(row);
  }
  return {
    roomId: '',
    map,
    units: [],
    resourcePoints: [],
    bases: [
      { owner: 'player1', position: { x: 3, y: 0 }, hp: 100, maxHp: 100 },
      { owner: 'player2', position: { x: 4, y: 7 }, hp: 100, maxHp: 100 },
    ],
    currentPlayer: 'player1',
    turnNumber: 1,
    players: [
      { id: 'player1', gold: 200, socketId: '' },
      { id: 'player2', gold: 200, socketId: '' },
    ],
    turnTimeLeft: 60,
    gameLog: [],
    phase: 'lobby',
  };
}

interface GameStore extends GameState {
  myPlayerId: PlayerId | null;
  roomId: string | null;
  selectedUnit: Unit | null;
  reachablePositions: Position[];
  attackTargets: Position[];
  isDeploying: Unit['type'] | null;
  winner: PlayerId | null;
  winReason: string;
  setMyPlayerId: (id: PlayerId) => void;
  setRoomId: (id: string) => void;
  setSelectedUnit: (unit: Unit | null) => void;
  setReachablePositions: (positions: Position[]) => void;
  setAttackTargets: (positions: Position[]) => void;
  setDeploying: (type: Unit['type'] | null) => void;
  updateGameState: (state: GameState) => void;
  sendAction: (action: GameAction) => void;
  sendEndTurn: () => void;
  sendDeployUnit: (deploy: DeployAction) => void;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  const socket = getSocket();

  socket.on('game:state', (state) => {
    get().updateGameState(state);
  });

  socket.on('game:start', (state) => {
    get().updateGameState(state);
  });

  socket.on('game:action_result', (result) => {
    console.log('Action result:', result);
  });

  socket.on('game:turn_change', (data) => {
    set({
      currentPlayer: data.currentPlayer,
      turnTimeLeft: data.timeLeft,
      selectedUnit: null,
      reachablePositions: [],
      attackTargets: [],
    });
  });

  socket.on('game:over', (data) => {
    set({
      winner: data.winner,
      winReason: data.reason,
      phase: 'ended',
    });
  });

  socket.on('room:created', (data) => {
    set({ myPlayerId: data.playerId, roomId: data.roomId });
  });

  socket.on('room:joined', (data) => {
    set({ myPlayerId: data.playerId, roomId: data.roomId });
  });

  socket.on('room:player_joined', (data) => {
    console.log('Player joined:', data.playerId);
  });

  socket.on('error', (message) => {
    console.error('Socket error:', message);
  });

  return {
    ...createEmptyGameState(),
    myPlayerId: null,
    roomId: null,
    selectedUnit: null,
    reachablePositions: [],
    attackTargets: [],
    isDeploying: null,
    winner: null,
    winReason: '',

    setMyPlayerId: (id) => set({ myPlayerId: id }),
    setRoomId: (id) => set({ roomId: id }),
    setSelectedUnit: (unit) => set({ selectedUnit: unit }),
    setReachablePositions: (positions) => set({ reachablePositions: positions }),
    setAttackTargets: (positions) => set({ attackTargets: positions }),
    setDeploying: (type) => set({ isDeploying: type }),

    updateGameState: (state) => set({ ...state }),

    sendAction: (action) => {
      socket.emit('game:action', action);
    },

    sendEndTurn: () => {
      socket.emit('game:end_turn');
    },

    sendDeployUnit: (deploy) => {
      socket.emit('game:deploy_unit', deploy);
    },

    createRoom: () => {
      socket.emit('room:create');
    },

    joinRoom: (roomId) => {
      socket.emit('room:join', { roomId });
    },
  };
});
