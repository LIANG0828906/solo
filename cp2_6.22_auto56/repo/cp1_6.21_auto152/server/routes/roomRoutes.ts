import { Router, type Request, type Response } from 'express';
import { v4 } from 'uuid';
import { rooms } from '../index.js';
import { initBattleState } from './battleRoutes.js';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomStatusResponse,
  RoomState,
} from '../../shared/types.js';

const router = Router();

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/', (req: Request, res: Response): void => {
  const { playerName } = req.body as CreateRoomRequest;

  if (!playerName) {
    res.status(400).json({ success: false, error: 'Player name is required' });
    return;
  }

  const roomId = generateRoomCode();
  const room: RoomState = {
    roomId,
    players: [playerName],
    currentPlayerIndex: 0,
    battleState: null,
  };

  rooms.set(roomId, room);

  const response: CreateRoomResponse = { roomId, players: room.players };
  res.status(201).json(response);
});

router.post('/:roomId/join', (req: Request, res: Response): void => {
  const { roomId } = req.params;
  const { playerName } = req.body as JoinRoomRequest;

  if (!playerName) {
    res.status(400).json({ success: false, error: 'Player name is required' });
    return;
  }

  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }

  if (room.players.length >= 2) {
    res.status(400).json({ success: false, error: 'Room is full' });
    return;
  }

  room.players.push(playerName);

  if (room.players.length === 2) {
    room.battleState = initBattleState();
  }

  const response: JoinRoomResponse = { success: true, roomId, players: room.players };
  res.json(response);
});

router.get('/:roomId', (req: Request, res: Response): void => {
  const room = rooms.get(req.params.roomId);

  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }

  const response: RoomStatusResponse = {
    roomId: room.roomId,
    players: room.players,
    currentPlayerIndex: room.currentPlayerIndex,
    battleState: room.battleState,
  };

  res.json(response);
});

export default router;
