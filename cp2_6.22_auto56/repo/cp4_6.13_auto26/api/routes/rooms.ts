import { Router, type Request, type Response } from 'express';
import type { Room, Player, GameReport } from '../../shared/types.js';
import { games } from './games.js';

const router = Router();

const rooms = new Map<string, Room>();
const roomsByCode = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

router.post('/', (req: Request, res: Response): void => {
  const { gameId } = req.body;
  if (!gameId) {
    res.status(400).json({ success: false, error: 'Game ID required' });
    return;
  }
  const game = games.get(gameId);
  if (!game) {
    res.status(404).json({ success: false, error: 'Game not found' });
    return;
  }
  let code = generateCode();
  while (roomsByCode.has(code)) {
    code = generateCode();
  }
  const room: Room = {
    id: generateId(),
    code,
    gameId,
    game,
    players: [],
    status: 'waiting',
    currentTurnPlayerId: null,
    deck: [],
  };
  rooms.set(room.id, room);
  roomsByCode.set(code, room);
  res.status(201).json({ success: true, data: room });
});

router.get('/:roomId/report', (req: Request, res: Response): void => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }
  const rankings = [...room.players].sort((a, b) => b.score - a.score);
  const report: GameReport = {
    roomId: room.id,
    roomCode: room.code,
    theme: room.game.theme,
    players: room.players,
    rankings,
    timestamp: new Date().toISOString(),
  };
  res.json({ success: true, data: report });
});

router.get('/:code', (req: Request, res: Response): void => {
  const room = roomsByCode.get(req.params.code);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }
  res.json({ success: true, data: room });
});

router.post('/:code/join', (req: Request, res: Response): void => {
  const room = roomsByCode.get(req.params.code);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }
  const { name, avatarId } = req.body;
  if (!name || avatarId === undefined) {
    res.status(400).json({ success: false, error: 'Name and avatarId required' });
    return;
  }
  if (room.status !== 'waiting') {
    res.status(400).json({ success: false, error: 'Game already in progress' });
    return;
  }
  const player: Player = {
    id: generateId(),
    name,
    avatarId,
    score: 0,
    hand: [],
    correctCount: 0,
    wrongCount: 0,
    propCount: 0,
    results: [],
    skipped: false,
  };
  room.players.push(player);
  res.json({ success: true, data: { player, room } });
});

export default router;
export { rooms, roomsByCode };
