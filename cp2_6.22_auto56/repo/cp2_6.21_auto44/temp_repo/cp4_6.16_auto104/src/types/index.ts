export enum ItemType {
  MISSILE = 'MISSILE',
  SHIELD = 'SHIELD',
  BOOST = 'BOOST'
}

export enum GameState {
  LOBBY = 'LOBBY',
  COUNTDOWN = 'COUNTDOWN',
  RACING = 'RACING',
  FINISHED = 'FINISHED'
}

export enum RoomState {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  ENDED = 'ENDED'
}

export enum CarType {
  SPEEDER = 'SPEEDER',
  BALANCED = 'BALANCED',
  DRIFTER = 'DRIFTER'
}

export interface PlayerInputState {
  left: boolean;
  right: boolean;
  acceleration: boolean;
  brake: boolean;
  drift: boolean;
  useItem: boolean;
}

export interface CarStats {
  speed: number;
  acceleration: number;
  handling: number;
}

export interface Car {
  x: number;
  y: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  isDrifting: boolean;
  driftAngle: number;
  driftPower: number;
  nitroMeter: number;
  nitroActive: boolean;
  nitroTimer: number;
  type: CarType;
  shieldActive: boolean;
  shieldTimer: number;
  stunTimer: number;
}

export interface Item {
  type: ItemType;
  count: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  car: Car;
  inventory: Item[];
  selectedItemIndex: number;
  rank: number;
  lap: number;
  totalLaps: number;
  checkpointIndex: number;
  raceTime: number;
  bestLapTime: number;
  lastLapTime: number;
  isPlayer: boolean;
  color: string;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  state: RoomState;
  maxPlayers: number;
  hostId: string;
  totalLaps: number;
}

export type NetworkMessageType =
  | 'ROOM_LIST'
  | 'ROOM_CREATED'
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'ROOM_UPDATED'
  | 'GAME_START'
  | 'PLAYER_INPUT'
  | 'PLAYER_STATE'
  | 'ITEM_USED'
  | 'RACE_FINISH'
  | 'CHAT';

export interface NetworkMessage<T = unknown> {
  type: NetworkMessageType;
  data: T;
  timestamp: number;
  senderId?: string;
}

export interface RaceRecord {
  id: string;
  playerId: string;
  raceDate: number;
  totalTime: number;
  bestLapTime: number;
  rank: number;
  opponents: number;
  trackName: string;
  carType: CarType;
}

export interface PlayerProfileData {
  id: string;
  name: string;
  avatar: string;
  totalRaces: number;
  wins: number;
  podiums: number;
  bestLapTime: number;
  unlockedCars: CarType[];
  selectedCar: CarType;
  raceHistory: RaceRecord[];
  level: number;
  xp: number;
  coins: number;
}

export interface ItemEffect {
  type: ItemType;
  active: boolean;
  targetPlayerId: string;
  sourcePlayerId: string;
  duration: number;
  startTime: number;
}
