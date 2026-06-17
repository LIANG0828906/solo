import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { GameState, Direction, GameRecord, DungeonMap } from '../types';
import { generateDungeonMap, findStartPosition, getRoomAt } from '../mapGenerator';
import { eventDeck, applyEventEffect } from '../EventDeck';

const MAX_HEALTH = 100;
const HISTORY_KEY = 'dungeon_history';
const MAX_HISTORY = 5;

interface GameActions {
  startNewGame: () => void;
  generateNewMap: () => void;
  movePlayer: (direction: Direction) => void;
  setPlayerRenderPosition: (x: number, y: number) => void;
  closeEventModal: () => void;
  updateElapsedTime: () => void;
  setMoving: (moving: boolean) => void;
  getHistory: () => GameRecord[];
}

type GameStore = GameState & GameActions;

const initialPlayer = {
  x: 0,
  y: 0,
  renderX: 0,
  renderY: 0,
  health: MAX_HEALTH,
  maxHealth: MAX_HEALTH,
  isMoving: false,
};

const initialState: GameState = {
  map: null,
  player: initialPlayer,
  currentEvent: null,
  showEventModal: false,
  gameStatus: 'playing',
  exploredRooms: 0,
  totalRooms: 0,
  startTime: 0,
  elapsedTime: 0,
  hintText: '',
};

function saveGameRecord(record: Omit<GameRecord, 'id' | 'timestamp'>): void {
  try {
    const history = getHistoryFromStorage();
    const newRecord: GameRecord = {
      ...record,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    history.unshift(newRecord);
    const trimmed = history.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save game record:', e);
  }
}

function getHistoryFromStorage(): GameRecord[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load history:', e);
  }
  return [];
}

function initializeMap(): { map: DungeonMap; startX: number; startY: number } {
  const map = generateDungeonMap({
    width: 6,
    height: 6,
    minRooms: 4,
    maxRooms: 6,
    minRoomSize: 2,
    maxRoomSize: 4,
  });
  const start = findStartPosition(map);

  if (map.rooms.length > 0) {
    const firstRoom = map.rooms[0];
    firstRoom.explored = true;
  }

  return { map, startX: start.x, startY: start.y };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  startNewGame: () => {
    eventDeck.resetDeck();
    const { map, startX, startY } = initializeMap();

    set({
      map,
      player: {
        x: startX,
        y: startY,
        renderX: startX,
        renderY: startY,
        health: MAX_HEALTH,
        maxHealth: MAX_HEALTH,
        isMoving: false,
      },
      currentEvent: null,
      showEventModal: false,
      gameStatus: 'playing',
      exploredRooms: 1,
      totalRooms: map.rooms.length,
      startTime: Date.now(),
      elapsedTime: 0,
      hintText: '',
    });
  },

  generateNewMap: () => {
    const { startNewGame } = get();
    startNewGame();
  },

  movePlayer: (direction: Direction) => {
    const state = get();
    if (state.gameStatus !== 'playing' || state.showEventModal || state.player.isMoving) {
      return;
    }
    if (!state.map) return;

    let newX = state.player.x;
    let newY = state.player.y;

    switch (direction) {
      case 'up':
        newY -= 1;
        break;
      case 'down':
        newY += 1;
        break;
      case 'left':
        newX -= 1;
        break;
      case 'right':
        newX += 1;
        break;
    }

    if (
      newX < 0 ||
      newX >= state.map.width ||
      newY < 0 ||
      newY >= state.map.height
    ) {
      return;
    }

    const cellType = state.map.grid[newY][newX];
    if (cellType === 'wall') {
      return;
    }

    set((prev) => ({
      player: {
        ...prev.player,
        x: newX,
        y: newY,
        isMoving: true,
      },
    }));

    const updatedState = get();
    const room = getRoomAt(updatedState.map!, newX, newY);

    if (room && !room.explored) {
      const updatedRooms = updatedState.map!.rooms.map((r) =>
        r.id === room.id ? { ...r, explored: true } : r
      );
      const newExploredCount = updatedState.exploredRooms + 1;

      set((prev) => ({
        map: prev.map ? { ...prev.map, rooms: updatedRooms } : null,
        exploredRooms: newExploredCount,
      }));

      const afterUpdateState = get();
      if (newExploredCount >= afterState.totalRooms) {
        setTimeout(() => {
          const currentState = get();
          if (currentState.gameStatus === 'playing') {
            set({ gameStatus: 'won' });
            saveGameRecord({
              result: 'won',
              time: currentState.elapsedTime,
              roomsExplored: currentState.exploredRooms,
              remainingHealth: currentState.player.health,
            });
          }
        }, 500);
      }
    }

    const stateAfterMove = get();
    const currentRoom = getRoomAt(stateAfterMove.map!, newX, newY);

    if (currentRoom && !currentRoom.eventTriggered) {
      const eventCard = eventDeck.drawCard();
      const newHealth = applyEventEffect(
        eventCard,
        stateAfterMove.player.health,
        stateAfterMove.player.maxHealth
      );

      const updatedRoomsWithEvent = stateAfterMove.map!.rooms.map((r) =>
        r.id === currentRoom.id ? { ...r, eventTriggered: true } : r
      );

      set((prev) => ({
        map: prev.map ? { ...prev.map, rooms: updatedRoomsWithEvent } : null,
        currentEvent: eventCard,
        showEventModal: true,
        player: {
          ...prev.player,
          health: newHealth,
        },
      }));

      const stateAfterEvent = get();
      if (newHealth <= 0) {
        set({ gameStatus: 'lost' });
        saveGameRecord({
          result: 'lost',
          time: stateAfterEvent.elapsedTime,
          roomsExplored: stateAfterEvent.exploredRooms,
          remainingHealth: 0,
        });
      }
    }
  },

  setPlayerRenderPosition: (x: number, y: number) => {
    set((prev) => ({
      player: {
        ...prev.player,
        renderX: x,
        renderY: y,
      },
    }));
  },

  closeEventModal: () => {
    set({ showEventModal: false, currentEvent: null });
  },

  updateElapsedTime: () => {
    const state = get();
    if (state.gameStatus !== 'playing' || !state.startTime) return;
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    set({ elapsedTime: elapsed });
  },

  setMoving: (moving: boolean) => {
    set((prev) => ({
      player: {
        ...prev.player,
        isMoving: moving,
      },
    }));
  },

  getHistory: () => {
    return getHistoryFromStorage();
  },
}));
