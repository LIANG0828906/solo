import type { Position, RoomData, RoomEventType } from './types';
import { GAME_CONFIG } from './constants';

export class RoomGenerator {
  private rooms: Map<string, RoomData> = new Map();
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 1000000);
  }

  private posKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  private seededRandom(x: number, y: number): number {
    const h = (x * 374761393 + y * 668265263 + this.seed * 982451653) | 0;
    const normalized = ((h ^ (h >>> 13)) * 1274126177) | 0;
    return ((normalized ^ (normalized >>> 16)) >>> 0) / 4294967295;
  }

  private generateEventType(x: number, y: number): RoomEventType {
    if (x === GAME_CONFIG.startPosition.x && y === GAME_CONFIG.startPosition.y) {
      return 'empty';
    }

    const rand = this.seededRandom(x, y);
    const probs = GAME_CONFIG.eventProbabilities;

    let cumulative = 0;
    cumulative += probs.spike;
    if (rand < cumulative) return 'spike';

    cumulative += probs.treasure;
    if (rand < cumulative) return 'treasure';

    cumulative += probs.swamp;
    if (rand < cumulative) return 'swamp';

    cumulative += probs.portal;
    if (rand < cumulative) return 'portal';

    return 'empty';
  }

  public getOrCreateRoom(pos: Position): RoomData {
    const key = this.posKey(pos);
    let room = this.rooms.get(key);

    if (!room) {
      room = {
        position: { ...pos },
        eventType: this.generateEventType(pos.x, pos.y),
        explored: false,
        eventTriggered: false
      };
      this.rooms.set(key, room);
    }

    return room;
  }

  public markExplored(pos: Position): void {
    const room = this.getOrCreateRoom(pos);
    room.explored = true;
  }

  public markEventTriggered(pos: Position): void {
    const room = this.getOrCreateRoom(pos);
    room.eventTriggered = true;
  }

  public isExplored(pos: Position): boolean {
    const room = this.rooms.get(this.posKey(pos));
    return room?.explored ?? false;
  }

  public isEventTriggered(pos: Position): boolean {
    const room = this.rooms.get(this.posKey(pos));
    return room?.eventTriggered ?? false;
  }

  public getExploredRooms(): RoomData[] {
    const result: RoomData[] = [];
    this.rooms.forEach((room) => {
      if (room.explored) {
        result.push(room);
      }
    });
    return result;
  }

  public setRoomFlash(pos: Position, durationMs: number): void {
    const room = this.getOrCreateRoom(pos);
    room.flashUntil = performance.now() + durationMs;
  }

  public setRoomSwamp(pos: Position, durationMs: number): void {
    const room = this.getOrCreateRoom(pos);
    room.swampUntil = performance.now() + durationMs;
  }

  public isFlashing(pos: Position, now: number): boolean {
    const room = this.rooms.get(this.posKey(pos));
    return (room?.flashUntil ?? 0) > now;
  }

  public hasSwamp(pos: Position, now: number): boolean {
    const room = this.rooms.get(this.posKey(pos));
    return (room?.swampUntil ?? 0) > now;
  }

  public getRoomBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    this.rooms.forEach((room) => {
      if (room.explored) {
        minX = Math.min(minX, room.position.x);
        maxX = Math.max(maxX, room.position.x);
        minY = Math.min(minY, room.position.y);
        maxY = Math.max(maxY, room.position.y);
      }
    });

    if (minX === Infinity) {
      minX = maxX = GAME_CONFIG.startPosition.x;
      minY = maxY = GAME_CONFIG.startPosition.y;
    }

    return { minX, maxX, minY, maxY };
  }
}
