import { Server, Socket } from "socket.io";
import { GameSync, ShapeItem } from "./gameSync.js";

export interface Player {
  id: string;
  nickname: string;
  score: number;
}

interface Room {
  code: string;
  players: Player[];
  ownerId: string;
  gameStarted: boolean;
  currentRound: number;
  currentPlayerIndex: number;
  sequenceLength: number;
  phase: string;
  sequence: ShapeItem[];
  playerClickIndex: number;
  displayTimer: ReturnType<typeof setTimeout> | null;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRoomMap: Map<string, string> = new Map();
  private gameSync: GameSync;
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.gameSync = new GameSync();
  }

  createRoom(socket: Socket, nickname: string, roomCode: string): boolean {
    if (this.rooms.has(roomCode)) return false;
    if (nickname.length < 2 || nickname.length > 8) return false;

    const room: Room = {
      code: roomCode,
      players: [{ id: socket.id, nickname, score: 0 }],
      ownerId: socket.id,
      gameStarted: false,
      currentRound: 1,
      currentPlayerIndex: 0,
      sequenceLength: 3,
      phase: "lobby",
      sequence: [],
      playerClickIndex: 0,
      displayTimer: null,
    };

    this.rooms.set(roomCode, room);
    this.playerRoomMap.set(socket.id, roomCode);
    socket.join(roomCode);

    this.io.to(roomCode).emit("room-updated", this.getRoomState(roomCode));
    return true;
  }

  joinRoom(socket: Socket, nickname: string, roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    if (room.gameStarted) return false;
    if (room.players.length >= 4) return false;
    if (nickname.length < 2 || nickname.length > 8) return false;
    if (room.players.some((p) => p.nickname === nickname)) return false;

    room.players.push({ id: socket.id, nickname, score: 0 });
    this.playerRoomMap.set(socket.id, roomCode);
    socket.join(roomCode);

    this.io.to(roomCode).emit("room-updated", this.getRoomState(roomCode));
    return true;
  }

  leaveRoom(socket: Socket): void {
    const roomCode = this.playerRoomMap.get(socket.id);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    if (room.displayTimer) {
      clearTimeout(room.displayTimer);
      room.displayTimer = null;
    }

    room.players = room.players.filter((p) => p.id !== socket.id);
    socket.leave(roomCode);
    this.playerRoomMap.delete(socket.id);

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return;
    }

    if (room.ownerId === socket.id) {
      room.ownerId = room.players[0].id;
    }

    if (room.gameStarted) {
      const winner = room.players.find((p) => p.score >= 5);
      if (winner) {
        room.phase = "game-over";
        this.io.to(roomCode).emit("game-over", {
          winnerId: winner.id,
          winnerNickname: winner.nickname,
          players: room.players,
        });
        return;
      }

      if (room.currentPlayerIndex >= room.players.length) {
        room.currentPlayerIndex = 0;
      }

      this.startNextTurn(roomCode);
    }

    this.io.to(roomCode).emit("room-updated", this.getRoomState(roomCode));
  }

  startGame(socket: Socket): void {
    const roomCode = this.playerRoomMap.get(socket.id);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room || room.ownerId !== socket.id || room.players.length < 2) return;
    if (room.gameStarted) return;

    room.gameStarted = true;
    room.currentRound = 1;
    room.currentPlayerIndex = 0;
    room.sequenceLength = 3;
    room.players.forEach((p) => (p.score = 0));

    this.startNextTurn(roomCode);
  }

  private startNextTurn(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.phase = "displaying";
    room.sequence = this.gameSync.generateSequence(room.sequenceLength);
    room.playerClickIndex = 0;

    this.io.to(roomCode).emit("turn-start", {
      sequence: room.sequence,
      currentPlayerIndex: room.currentPlayerIndex,
      currentPlayerNickname: room.players[room.currentPlayerIndex].nickname,
      currentPlayerId: room.players[room.currentPlayerIndex].id,
      round: room.currentRound,
      sequenceLength: room.sequenceLength,
      players: room.players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
      })),
      phase: "displaying",
    });

    room.displayTimer = setTimeout(() => {
      room.phase = "input";
      room.displayTimer = null;
      this.io.to(roomCode).emit("phase-change", "input");
    }, 1500);
  }

  handlePlayerClick(socket: Socket, gridIndex: number): void {
    const roomCode = this.playerRoomMap.get(socket.id);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "input") return;

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return;

    const clickIndex = room.playerClickIndex;
    const correct = this.gameSync.validateInput(
      room.sequence,
      gridIndex,
      clickIndex
    );

    if (correct) {
      room.playerClickIndex++;
      this.io.to(roomCode).emit("click-result", {
        correct: true,
        gridIndex,
        clickIndex: room.playerClickIndex - 1,
        playerId: socket.id,
      });

      if (room.playerClickIndex >= room.sequence.length) {
        this.endTurn(roomCode, true);
      }
    } else {
      this.io.to(roomCode).emit("click-result", {
        correct: false,
        gridIndex,
        playerId: socket.id,
      });

      room.players.forEach((player, index) => {
        if (index !== room.currentPlayerIndex) {
          player.score += 1;
        }
      });

      setTimeout(() => {
        this.endTurn(roomCode, false);
      }, 600);
    }
  }

  private endTurn(roomCode: string, _success: boolean): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const winner = room.players.find((p) => p.score >= 5);
    if (winner) {
      room.phase = "game-over";
      this.io.to(roomCode).emit("game-over", {
        winnerId: winner.id,
        winnerNickname: winner.nickname,
        players: room.players.map((p) => ({
          id: p.id,
          nickname: p.nickname,
          score: p.score,
        })),
      });
      return;
    }

    room.currentPlayerIndex++;

    if (room.currentPlayerIndex >= room.players.length) {
      room.currentPlayerIndex = 0;
      room.currentRound++;
      room.sequenceLength++;
    }

    this.startNextTurn(roomCode);
  }

  getRoomState(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    return {
      roomCode: room.code,
      players: room.players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
      })),
      ownerId: room.ownerId,
      gameStarted: room.gameStarted,
    };
  }

  getPlayerRoom(socketId: string): string | undefined {
    return this.playerRoomMap.get(socketId);
  }
}
