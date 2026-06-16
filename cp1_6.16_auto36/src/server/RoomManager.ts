import { v4 as uuidv4 } from 'uuid';
import type { RoomLayout, PlayerState, LeaderboardEntry, Puzzle } from '../client/types';

interface Room {
  id: string;
  name: string;
  layout: RoomLayout;
  players: Map<string, PlayerState>;
  observers: Set<string>;
  scores: Array<{ nickname: string; timeMs: number; timestamp: number }>;
  published: boolean;
  versions: Array<{ name: string; layout: RoomLayout; timestamp: number }>;
  createdAt: number;
  sequenceProgress: Map<string, string[]>;
  exitUnlocked: Map<string, boolean>;
}

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private static instance: RoomManager;

  private constructor() {
    this.initializeDemoRoom();
  }

  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  private initializeDemoRoom() {
    const demoLayout: RoomLayout = {
      width: 800,
      height: 600,
      name: '暗夜密室 · 序章',
      elements: [
        { id: 'w1', type: 'wall', x: 0, y: 0, width: 800, height: 20 },
        { id: 'w2', type: 'wall', x: 0, y: 580, width: 800, height: 20 },
        { id: 'w3', type: 'wall', x: 0, y: 0, width: 20, height: 600 },
        { id: 'w4', type: 'wall', x: 780, y: 0, width: 20, height: 600 },
        { id: 'w5', type: 'wall', x: 300, y: 100, width: 20, height: 200 },
        { id: 'w6', type: 'wall', x: 300, y: 400, width: 20, height: 180 },
        { id: 'item1', type: 'item', x: 200, y: 200, width: 50, height: 50, label: '宝箱',
          interaction: { type: 'click_text', content: '这是一个古老的宝箱，上面刻着神秘的符文。你发现了一张纸条："先点亮烛台，再凝视画像..."' } },
        { id: 'item2', type: 'item', x: 400, y: 300, width: 50, height: 50, label: '烛台',
          interaction: { type: 'sequence_trigger', triggerId: 'seq1' } },
        { id: 'item3', type: 'item', x: 550, y: 150, width: 50, height: 50, label: '画像',
          interaction: { type: 'sequence_trigger', triggerId: 'seq1' } },
        { id: 'item4', type: 'item', x: 500, y: 450, width: 50, height: 50, label: '密码箱',
          interaction: { type: 'password', password: '1234' } },
        { id: 'clue1', type: 'clue', x: 150, y: 400, width: 40, height: 40, label: '纸条',
          interaction: { type: 'click_text', content: '密码箱的密码是 1-2-3-4。' } },
        { id: 'exit1', type: 'exit', x: 720, y: 280, width: 40, height: 60, label: '出口' },
      ],
      puzzles: [
        { id: 'puz1', level: 1, type: 'sequence', solution: ['item2', 'item3'],
          hint: '按正确顺序点亮机关', unlocksExit: true }
      ],
      startPosition: { x: 100, y: 300 },
    };

    this.rooms.set('demo', {
      id: 'demo',
      name: '暗夜密室 · 序章',
      layout: demoLayout,
      players: new Map(),
      observers: new Set(),
      scores: [
        { nickname: '逃脱大师', timeMs: 45000, timestamp: Date.now() - 86400000 },
        { nickname: '密室达人', timeMs: 62000, timestamp: Date.now() - 43200000 },
        { nickname: '解谜王者', timeMs: 78000, timestamp: Date.now() - 21600000 },
        { nickname: '探险者', timeMs: 95000, timestamp: Date.now() - 10800000 },
        { nickname: '新手玩家', timeMs: 120000, timestamp: Date.now() - 3600000 },
      ],
      published: true,
      versions: [],
      createdAt: Date.now() - 86400000 * 7,
      sequenceProgress: new Map(),
      exitUnlocked: new Map(),
    });
  }

  createRoom(layout: RoomLayout, name: string): { roomId: string; shareUrl: string } {
    const roomId = uuidv4().substring(0, 8);
    const room: Room = {
      id: roomId,
      name,
      layout,
      players: new Map(),
      observers: new Set(),
      scores: [],
      published: true,
      versions: [{ name: '初始版本', layout: JSON.parse(JSON.stringify(layout)), timestamp: Date.now() }],
      createdAt: Date.now(),
      sequenceProgress: new Map(),
      exitUnlocked: new Map(),
    };
    this.rooms.set(roomId, room);
    return {
      roomId,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/room/${roomId}`,
    };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getPublishedRooms(): Array<{ id: string; name: string }> {
    return Array.from(this.rooms.values())
      .filter(r => r.published)
      .map(r => ({ id: r.id, name: r.name }));
  }

  addPlayer(roomId: string, playerId: string, nickname: string): PlayerState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player: PlayerState = {
      id: playerId,
      nickname,
      x: room.layout.startPosition.x,
      y: room.layout.startPosition.y,
      currentLevel: 1,
      startTime: Date.now(),
      inventory: [],
      solvedPuzzles: [],
      sequenceProgress: [],
    };

    room.players.set(playerId, player);
    room.sequenceProgress.set(playerId, []);
    room.exitUnlocked.set(playerId, false);
    return player;
  }

  removePlayer(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.players.delete(playerId);
      room.sequenceProgress.delete(playerId);
      room.exitUnlocked.delete(playerId);
      room.observers.delete(playerId);
    }
  }

  updatePlayerPosition(roomId: string, playerId: string, x: number, y: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const player = room.players.get(playerId);
    if (!player) return false;

    player.x = Math.max(30, Math.min(room.layout.width - 30, x));
    player.y = Math.max(30, Math.min(room.layout.height - 30, y));
    return true;
  }

  addObserver(roomId: string, observerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.observers.add(observerId);
    return true;
  }

  handleInteraction(roomId: string, playerId: string, elementId: string, action: string, payload?: any): {
    success: boolean;
    response?: any;
    broadcast?: any;
  } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false };

    const player = room.players.get(playerId);
    if (!player) return { success: false };

    const element = room.layout.elements.find(e => e.id === elementId);
    if (!element) return { success: false };

    if (element.interaction?.type === 'click_text') {
      return {
        success: true,
        response: { type: 'show_text', content: element.interaction.content || '' },
      };
    }

    if (element.interaction?.type === 'sequence_trigger') {
      const progress = room.sequenceProgress.get(playerId) || [];
      const newProgress = [...progress, elementId];
      room.sequenceProgress.set(playerId, newProgress);
      player.sequenceProgress = newProgress;

      const puzzle = room.layout.puzzles.find(p => p.type === 'sequence');
      if (puzzle && Array.isArray(puzzle.solution)) {
        const expected = puzzle.solution[newProgress.length - 1];
        if (elementId !== expected) {
          room.sequenceProgress.set(playerId, []);
          player.sequenceProgress = [];
          return {
            success: true,
            response: { type: 'puzzle_failed', reason: '顺序错误' },
          };
        }

        if (newProgress.length === puzzle.solution.length) {
          room.exitUnlocked.set(playerId, true);
          player.solvedPuzzles.push(puzzle.id);
          player.sequenceProgress = [];
          return {
            success: true,
            broadcast: { type: 'unlock_exit' },
            response: { type: 'puzzle_solved', puzzleId: puzzle.id },
          };
        }
      }
      return { success: true };
    }

    if (element.type === 'exit' && action === 'exit') {
      const isUnlocked = room.exitUnlocked.get(playerId) || false;
      if (!isUnlocked) {
        return {
          success: true,
          response: { type: 'show_text', content: '门被锁住了...你需要解开房间里的谜题才能打开。' },
        };
      }

      const time = payload?.time || (Date.now() - player.startTime);
      return this.submitScore(roomId, player.nickname, time, playerId);
    }

    return { success: true };
  }

  submitScore(roomId: string, nickname: string, timeMs: number, playerId?: string): {
    success: boolean;
    response?: any;
  } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false };

    room.scores.push({ nickname, timeMs, timestamp: Date.now() });
    room.scores.sort((a, b) => a.timeMs - b.timeMs);

    const rankings: LeaderboardEntry[] = room.scores.slice(0, 10).map((s, i) => ({
      nickname: s.nickname,
      timeMs: s.timeMs,
      rank: i + 1,
    }));

    const rank = room.scores.findIndex(s => s.nickname === nickname && Math.abs(s.timeMs - timeMs) < 1000) + 1;

    if (playerId) {
      room.players.delete(playerId);
      room.sequenceProgress.delete(playerId);
      room.exitUnlocked.delete(playerId);
    }

    return {
      success: true,
      response: { type: 'game_complete', time: timeMs, rank, rankings },
    };
  }

  getLeaderboard(roomId: string, nickname?: string): { rankings: LeaderboardEntry[]; myRank?: number } {
    const room = this.rooms.get(roomId);
    if (!room) return { rankings: [] };

    const rankings: LeaderboardEntry[] = room.scores.slice(0, 10).map((s, i) => ({
      nickname: s.nickname,
      timeMs: s.timeMs,
      rank: i + 1,
    }));

    let myRank: number | undefined;
    if (nickname) {
      const idx = room.scores.findIndex(s => s.nickname === nickname);
      if (idx >= 0) myRank = idx + 1;
    }

    return { rankings, myRank };
  }

  getRoomState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return {
      layout: room.layout,
      players: Array.from(room.players.values()),
      exitUnlocked: false,
    };
  }

  saveVersion(roomId: string, versionName: string, layout: RoomLayout): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.versions.push({
      name: versionName,
      layout: JSON.parse(JSON.stringify(layout)),
      timestamp: Date.now(),
    });
    return true;
  }

  getVersions(roomId: string): Array<{ name: string; layout: RoomLayout; timestamp: number }> {
    const room = this.rooms.get(roomId);
    return room?.versions || [];
  }
}

export const roomManager = RoomManager.getInstance();
export default roomManager;
