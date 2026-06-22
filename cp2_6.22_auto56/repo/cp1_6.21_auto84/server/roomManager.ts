import { v4 as uuidv4 } from 'uuid';
import type {
  Unit,
  UnitType,
  Player,
  Room,
  RoomStatus,
  BattleLogEntry,
  ToastEvent,
} from '../src/types';
import { combatEngine } from './combatEngine';

const UNIT_PRESETS: Record<
  UnitType,
  Omit<Unit, 'id' | 'playerId' | 'currentCooldown' | 'skillTriggered'>
> = {
  warrior: {
    type: 'warrior',
    name: '战士',
    attack: 25,
    health: 120,
    maxHealth: 120,
    skillCooldown: 3,
  },
  mage: {
    type: 'mage',
    name: '法师',
    attack: 40,
    health: 70,
    maxHealth: 70,
    skillCooldown: 2,
  },
  archer: {
    type: 'archer',
    name: '射手',
    attack: 30,
    health: 90,
    maxHealth: 90,
    skillCooldown: 2,
  },
};

const rooms = new Map<string, Room>();
const eventQueues = new Map<string, ToastEvent[]>();

function generateRoomId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createUnit(type: UnitType, playerId: string): Unit {
  const preset = UNIT_PRESETS[type];
  return {
    id: uuidv4(),
    type,
    name: preset.name,
    attack: preset.attack,
    health: preset.health,
    maxHealth: preset.maxHealth,
    skillCooldown: preset.skillCooldown,
    currentCooldown: 0,
    skillTriggered: 0,
    playerId,
  };
}

function addEvent(roomId: string, message: string, type: ToastEvent['type'] = 'info') {
  if (!eventQueues.has(roomId)) {
    eventQueues.set(roomId, []);
  }
  eventQueues.get(roomId)!.push({
    id: uuidv4(),
    message,
    timestamp: Date.now(),
    type,
  });
}

export function createRoom(
  maxPlayers: number,
  initialHealth: number,
  playerName: string
): { roomId: string; playerId: string; room: Room } {
  const roomId = generateRoomId();
  const playerId = uuidv4();

  const player: Player = {
    id: playerId,
    name: playerName,
    roomId,
    units: [],
    isReady: false,
    totalHealth: 0,
    maxTotalHealth: 0,
  };

  const room: Room = {
    id: roomId,
    maxPlayers,
    initialHealth,
    players: [player],
    status: 'waiting',
    currentRound: 0,
    battleLogs: [],
    winner: null,
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  eventQueues.set(roomId, []);
  addEvent(roomId, `${playerName} 创建了房间`, 'success');

  return { roomId, playerId, room };
}

export function joinRoom(
  roomId: string,
  playerName: string
): { playerId: string; room: Room } | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.players.length >= room.maxPlayers) return null;
  if (room.status !== 'waiting') return null;

  const playerId = uuidv4();
  const player: Player = {
    id: playerId,
    name: playerName,
    roomId,
    units: [],
    isReady: false,
    totalHealth: 0,
    maxTotalHealth: 0,
  };

  room.players.push(player);
  addEvent(roomId, `${playerName} 加入了房间`, 'info');

  if (room.players.length === room.maxPlayers) {
    room.status = 'configuring';
    addEvent(roomId, '所有玩家已加入，请选择阵容', 'success');
  }

  return { playerId, room };
}

export function getRoom(roomId: string): Room | null {
  return rooms.get(roomId) || null;
}

export function selectUnits(
  roomId: string,
  playerId: string,
  unitTypes: UnitType[]
): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.status !== 'configuring') return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;

  const units: Unit[] = unitTypes.map((type) => createUnit(type, playerId));
  const totalHealth = units.reduce((sum, u) => sum + u.health, 0);

  player.units = units;
  player.totalHealth = totalHealth;
  player.maxTotalHealth = totalHealth;
  player.isReady = false;

  addEvent(roomId, `${player.name} 选择了阵容`, 'info');

  return room;
}

export function setPlayerReady(
  roomId: string,
  playerId: string
): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;
  if (player.units.length === 0) return null;

  player.isReady = true;
  addEvent(roomId, `${player.name} 已准备就绪`, 'success');

  return room;
}

export function startBattle(
  roomId: string,
  playerId: string
): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const creator = room.players[0];
  if (creator.id !== playerId) return null;

  const allReady = room.players.every((p) => p.isReady && p.units.length > 0);
  if (!allReady) return null;

  room.status = 'battling';
  room.currentRound = 0;
  room.battleLogs = [];
  addEvent(roomId, '战斗开始！', 'success');

  return room;
}

export function executeCombatRound(roomId: string): {
  result: {
    round: number;
    logs: BattleLogEntry[];
    updatedUnits: Unit[];
    isFinished: boolean;
    winner: string | null;
  };
  room: Room;
} | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.status !== 'battling') return null;

  room.currentRound += 1;

  const allUnits = room.players.flatMap((p) => p.units);
  const result = combatEngine.executeRound(allUnits, room.currentRound);

  room.battleLogs.push(...result.logs);

  for (const updatedUnit of result.updatedUnits) {
    const player = room.players.find((p) => p.id === updatedUnit.playerId);
    if (player) {
      const unitIndex = player.units.findIndex((u) => u.id === updatedUnit.id);
      if (unitIndex !== -1) {
        player.units[unitIndex] = updatedUnit;
      }
    }
  }

  for (const player of room.players) {
    player.totalHealth = player.units.reduce((sum, u) => sum + Math.max(0, u.health), 0);
  }

  if (result.isFinished && result.winner) {
    room.status = 'finished';
    room.winner = result.winner;
    const winnerPlayer = room.players.find((p) => p.id === result.winner);
    if (winnerPlayer) {
      addEvent(roomId, `${winnerPlayer.name} 获得胜利！`, 'success');
    }
  }

  return { result, room };
}

export function leaveRoom(
  roomId: string,
  playerId: string
): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const playerIndex = room.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return null;

  const player = room.players[playerIndex];
  addEvent(roomId, `${player.name} 离开了房间`, 'warning');

  room.players.splice(playerIndex, 1);

  if (room.players.length === 0) {
    rooms.delete(roomId);
    eventQueues.delete(roomId);
    return null;
  }

  if (room.status === 'waiting' && room.players.length < room.maxPlayers) {
    room.status = 'waiting';
  }

  return room;
}

export function pollEvents(
  roomId: string,
  since: number
): { room: Room; events: ToastEvent[] } | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const events = eventQueues.get(roomId) || [];
  const newEvents = events.filter((e) => e.timestamp > since);

  return { room, events: newEvents };
}

export const roomManager = {
  createRoom,
  joinRoom,
  getRoom,
  selectUnits,
  setPlayerReady,
  startBattle,
  executeCombatRound,
  leaveRoom,
  pollEvents,
};
