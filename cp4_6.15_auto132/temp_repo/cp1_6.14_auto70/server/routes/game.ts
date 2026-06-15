import express, { Request, Response } from 'express';
import { Low, JSONFile } from 'lowdb';
import { v4 as uuidv4 } from 'uuid';
import {
  rollDiceDeterministic,
  calculateNewPosition,
  triggerRandomEvent,
  calculateToll,
  calculateStartBonus,
  calculateJailBail,
  calculateInitialCoins,
  getRandomRole,
  getPlayerAvatar,
  generateRoomCode,
  applyEventToCoins,
  calculateWinner,
  getPerTurnBonus,
  BOARD_SIZE,
  ROLE_CARDS,
  BOARD_CELLS,
} from '../gameLogic.js';

const router = express.Router();

interface DBPlayer {
  id: string;
  name: string;
  avatar: string;
  role: string;
  roleName: string;
  roleEmoji: string;
  coins: number;
  position: number;
  isCurrentTurn: boolean;
  roleDescription: string;
}

interface DBLogEntry {
  id: string;
  timestamp: string;
  playerId?: string;
  playerName?: string;
  action: string;
  details: string;
}

interface GameRoom {
  roomCode: string;
  createdAt: string;
  phase: 'lobby' | 'playing' | 'ended';
  currentPlayerIndex: number;
  players: DBPlayer[];
  logs: DBLogEntry[];
  winner: DBPlayer | null;
  turnCount: number;
  maxTurns: number;
}

interface Database {
  rooms: Record<string, GameRoom>;
}

let db: Low<Database>;

export function initDatabase(database: Low<Database>) {
  db = database;
}

function createLogEntry(
  action: string,
  details: string,
  player?: DBPlayer
): DBLogEntry {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    playerId: player?.id,
    playerName: player?.name,
    action,
    details,
  };
}

function addLogToRoom(room: GameRoom, log: DBLogEntry) {
  room.logs.unshift(log);
  if (room.logs.length > 500) {
    room.logs.pop();
  }
}

function getRoomOrFail(roomCode: string, res: Response): GameRoom | null {
  const room = db.data.rooms[roomCode];
  if (!room) {
    res.status(404).json({ message: '房间不存在' });
    return null;
  }
  return room;
}

function getCurrentPlayer(room: GameRoom): DBPlayer | null {
  if (room.players.length === 0) return null;
  return room.players[room.currentPlayerIndex] || null;
}

function checkGameEnd(room: GameRoom): boolean {
  if (room.turnCount >= room.maxTurns) {
    return true;
  }
  const bankruptPlayers = room.players.filter((p) => p.coins <= 0);
  if (bankruptPlayers.length > 0 && room.players.length > 1) {
    const activePlayers = room.players.filter((p) => p.coins > 0);
    if (activePlayers.length <= 1) {
      return true;
    }
  }
  return false;
}

function finalizeGame(room: GameRoom) {
  room.phase = 'ended';
  const rankings = calculateWinner(room.players.map((p) => ({ id: p.id, coins: p.coins })));
  const winnerId = rankings[0]?.id;
  room.winner = room.players.find((p) => p.id === winnerId) || null;
  addLogToRoom(
    room,
    createLogEntry('游戏结束', `🏆 获胜者：${room.winner?.name || '未知'}！`)
  );
}

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { playerName } = req.body;
    if (!playerName || playerName.trim().length < 2) {
      return res.status(400).json({ message: '昵称至少2个字符' });
    }

    let roomCode: string;
    do {
      roomCode = generateRoomCode();
    } while (db.data.rooms[roomCode]);

    const usedRoleIds: string[] = [];
    const role = getRandomRole(usedRoleIds);
    const initialCoins = calculateInitialCoins(role);

    const player: DBPlayer = {
      id: uuidv4(),
      name: playerName.trim(),
      avatar: getPlayerAvatar(0),
      role: role.id,
      roleName: role.name,
      roleEmoji: role.emoji,
      roleDescription: role.description,
      coins: initialCoins,
      position: 0,
      isCurrentTurn: true,
    };

    const room: GameRoom = {
      roomCode,
      createdAt: new Date().toISOString(),
      phase: 'lobby',
      currentPlayerIndex: 0,
      players: [player],
      logs: [],
      winner: null,
      turnCount: 0,
      maxTurns: 50,
    };

    addLogToRoom(room, createLogEntry('创建房间', `房间号：${roomCode}`, player));

    db.data.rooms[roomCode] = room;
    await db.write();

    res.json({
      roomCode,
      player,
      gameState: {
        phase: room.phase,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
        winner: room.winner,
      },
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: '创建房间失败' });
  }
});

router.post('/join', async (req: Request, res: Response) => {
  try {
    const { roomCode, playerName } = req.body;
    const room = getRoomOrFail(roomCode, res);
    if (!room) return;

    if (room.phase !== 'lobby') {
      return res.status(400).json({ message: '游戏已开始，无法加入' });
    }
    if (room.players.length >= 6) {
      return res.status(400).json({ message: '房间已满（最多6人）' });
    }
    if (!playerName || playerName.trim().length < 2) {
      return res.status(400).json({ message: '昵称至少2个字符' });
    }
    if (room.players.some((p) => p.name === playerName.trim())) {
      return res.status(400).json({ message: '昵称已存在' });
    }

    const usedRoleIds = room.players.map((p) => p.role);
    const role = getRandomRole(usedRoleIds);
    const initialCoins = calculateInitialCoins(role);

    const player: DBPlayer = {
      id: uuidv4(),
      name: playerName.trim(),
      avatar: getPlayerAvatar(room.players.length),
      role: role.id,
      roleName: role.name,
      roleEmoji: role.emoji,
      roleDescription: role.description,
      coins: initialCoins,
      position: 0,
      isCurrentTurn: false,
    };

    room.players.push(player);
    addLogToRoom(room, createLogEntry('加入房间', `${player.name} 加入了房间`, player));
    await db.write();

    res.json({
      roomCode,
      player,
      gameState: {
        phase: room.phase,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
        winner: room.winner,
      },
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ message: '加入房间失败' });
  }
});

router.post('/start', async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.body;
    const room = getRoomOrFail(roomCode, res);
    if (!room) return;

    if (room.players.length < 2) {
      return res.status(400).json({ message: '至少需要2名玩家才能开始' });
    }
    if (room.phase !== 'lobby') {
      return res.status(400).json({ message: '游戏已开始或已结束' });
    }

    room.phase = 'playing';
    room.currentPlayerIndex = 0;
    room.turnCount = 1;
    room.players.forEach((p, i) => {
      p.isCurrentTurn = i === 0;
      p.position = 0;
    });
    addLogToRoom(room, createLogEntry('游戏开始', '游戏正式开始！祝大家好运！'));
    addLogToRoom(
      room,
      createLogEntry(
        '回合开始',
        `第 ${room.turnCount} 回合，轮到 ${room.players[0].name}`,
        room.players[0]
      )
    );
    await db.write();

    res.json({
      success: true,
      gameState: {
        phase: room.phase,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
        turnCount: room.turnCount,
        winner: room.winner,
      },
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ message: '开始游戏失败' });
  }
});

router.post('/roll-dice', async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.body;
    const room = getRoomOrFail(roomCode, res);
    if (!room) return;

    if (room.phase !== 'playing') {
      return res.status(400).json({ message: '游戏未进行中' });
    }

    const currentPlayer = getCurrentPlayer(room);
    if (!currentPlayer) {
      return res.status(400).json({ message: '无当前玩家' });
    }

    const diceResult = rollDiceDeterministic();

    addLogToRoom(
      room,
      createLogEntry('掷骰子', `掷出了 ${diceResult.value} 点`, currentPlayer)
    );
    await db.write();

    res.json({
      diceResult,
      currentPlayer,
      roomCode,
    });
  } catch (error) {
    console.error('Roll dice error:', error);
    res.status(500).json({ message: '掷骰子失败' });
  }
});

router.post('/move', async (req: Request, res: Response) => {
  try {
    const { roomCode, steps } = req.body;
    const room = getRoomOrFail(roomCode, res);
    if (!room) return;

    if (room.phase !== 'playing') {
      return res.status(400).json({ message: '游戏未进行中' });
    }

    const currentPlayer = getCurrentPlayer(room);
    if (!currentPlayer) {
      return res.status(400).json({ message: '无当前玩家' });
    }

    const moveResult = calculateNewPosition(currentPlayer.position, steps, BOARD_SIZE);
    let events: any[] = [];
    let totalDelta = 0;

    currentPlayer.position = moveResult.newPosition;

    if (moveResult.passedStart) {
      const bonus = calculateStartBonus(currentPlayer.role);
      currentPlayer.coins += bonus;
      totalDelta += bonus;
      events.push({
        id: uuidv4(),
        type: 'pass_start',
        title: '经过起点',
        description: `恭喜经过起点，获得 ${bonus} 金币`,
        amount: bonus,
      });
      addLogToRoom(
        room,
        createLogEntry(
          '经过起点',
          `获得 ${bonus} 金币奖励`,
          currentPlayer
        )
      );
    }

    addLogToRoom(
      room,
      createLogEntry(
        '移动',
        `移动到第 ${moveResult.newPosition + 1} 格：${moveResult.landedCell.name}`,
        currentPlayer
      )
    );

    const landedCell = moveResult.landedCell;

    switch (landedCell.type) {
      case 'tax': {
        const toll = calculateToll(landedCell, currentPlayer.role);
        currentPlayer.coins = Math.max(0, currentPlayer.coins - toll);
        totalDelta -= toll;
        events.push({
          id: uuidv4(),
          type: 'toll',
          title: '缴纳过路费',
          description: `到达过路费格子，缴纳 ${toll} 金币`,
          amount: toll,
        });
        addLogToRoom(
          room,
          createLogEntry(
            '缴纳过路费',
            `缴纳 ${toll} 金币`,
            currentPlayer
          )
        );
        break;
      }
      case 'chance': {
        const event = triggerRandomEvent('chance');
        if (event) {
          if (event.type === 'teleport' && event.targetPosition !== undefined) {
            currentPlayer.position = event.targetPosition;
            events.push({
              id: uuidv4(),
              ...event,
              title: '抽取机会卡 - ' + event.title,
            });
            addLogToRoom(
              room,
              createLogEntry(
                '抽取机会卡',
                `${event.title}：${event.description}`,
                currentPlayer
              )
            );
          } else {
            const assetUpdate = applyEventToCoins(currentPlayer.coins, event, currentPlayer.role);
            currentPlayer.coins = assetUpdate.newCoins;
            totalDelta += assetUpdate.delta;
            events.push({
              id: uuidv4(),
              ...event,
              title: '抽取机会卡 - ' + event.title,
            });
            addLogToRoom(
              room,
              createLogEntry(
                '抽取机会卡',
                `${event.title}：${event.description}（${assetUpdate.delta >= 0 ? '+' : ''}${assetUpdate.delta} 金币）`,
                currentPlayer
              )
            );
          }
        }
        break;
      }
      case 'jail': {
        const bail = calculateJailBail(currentPlayer.role);
        currentPlayer.coins = Math.max(0, currentPlayer.coins - bail);
        totalDelta -= bail;
        events.push({
          id: uuidv4(),
          type: 'jail',
          title: '入狱',
          description: `不幸入狱，支付保释金 ${bail} 金币`,
          amount: bail,
        });
        addLogToRoom(
          room,
          createLogEntry(
            '入狱',
            `支付保释金 ${bail} 金币`,
            currentPlayer
          )
        );
        break;
      }
      case 'parking': {
        events.push({
          id: uuidv4(),
          type: 'parking',
          title: '休息站',
          description: '到达休息站，免费歇脚',
          amount: 0,
        });
        addLogToRoom(
          room,
          createLogEntry(
            '休息',
            '到达休息站，恢复精力',
            currentPlayer
          )
        );
        break;
      }
      case 'shop': {
        events.push({
          id: uuidv4(),
          type: 'shop',
          title: '到达商店',
          description: '欢迎光临，暂无商品可购买',
          amount: 0,
        });
        addLogToRoom(
          room,
          createLogEntry(
            '商店',
            '进入商店闲逛了一圈',
            currentPlayer
          )
        );
        break;
      }
      case 'property': {
        events.push({
          id: uuidv4(),
          type: 'property',
          title: `到达：${landedCell.name}`,
          description: landedCell.description + `，价值 ${landedCell.cost} 金币`,
          amount: landedCell.cost,
        });
        break;
      }
    }

    if (checkGameEnd(room)) {
      finalizeGame(room);
    }

    await db.write();

    res.json({
      player: currentPlayer,
      newPosition: moveResult.newPosition,
      events,
      moveResult,
      totalDelta,
      gameState: {
        phase: room.phase,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
        winner: room.winner,
        turnCount: room.turnCount,
      },
    });
  } catch (error) {
    console.error('Move player error:', error);
    res.status(500).json({ message: '移动失败' });
  }
});

router.post('/end-turn', async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.body;
    const room = getRoomOrFail(roomCode, res);
    if (!room) return;

    if (room.phase !== 'playing') {
      return res.status(400).json({ message: '游戏未进行中' });
    }

    const currentPlayer = getCurrentPlayer(room);
    if (!currentPlayer) {
      return res.status(400).json({ message: '无当前玩家' });
    }

    currentPlayer.isCurrentTurn = false;
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
    const isNewRound = room.currentPlayerIndex === 0;
    if (isNewRound) {
      room.turnCount++;
    }

    const nextPlayer = room.players[room.currentPlayerIndex];
    nextPlayer.isCurrentTurn = true;

    const perTurnBonus = getPerTurnBonus(nextPlayer.role);
    if (perTurnBonus > 0) {
      nextPlayer.coins += perTurnBonus;
      addLogToRoom(
        room,
        createLogEntry(
          '角色技能',
          `${nextPlayer.roleName} 技能触发，额外获得 ${perTurnBonus} 金币`,
          nextPlayer
        )
      );
    }

    addLogToRoom(
      room,
      createLogEntry(
        isNewRound ? '回合开始' : '换回合',
        isNewRound
          ? `第 ${room.turnCount} 回合开始，轮到 ${nextPlayer.name}`
          : `轮到 ${nextPlayer.name}`,
        nextPlayer
      )
    );

    if (checkGameEnd(room)) {
      finalizeGame(room);
    }

    await db.write();

    res.json({
      nextPlayerIndex: room.currentPlayerIndex,
      nextPlayer,
      turnCount: room.turnCount,
      perTurnBonus,
      gameState: {
        phase: room.phase,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
        winner: room.winner,
        turnCount: room.turnCount,
      },
    });
  } catch (error) {
    console.error('End turn error:', error);
    res.status(500).json({ message: '结束回合失败' });
  }
});

router.get('/state/:roomCode', (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    const room = getRoomOrFail(roomCode, res);
    if (!room) return;

    res.json({
      gameState: {
        phase: room.phase,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
        winner: room.winner,
        logs: room.logs,
        turnCount: room.turnCount,
        maxTurns: room.maxTurns,
      },
    });
  } catch (error) {
    console.error('Get state error:', error);
    res.status(500).json({ message: '获取状态失败' });
  }
});

router.get('/logs/:roomCode', (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    const room = getRoomOrFail(roomCode, res);
    if (!room) return;

    res.json({
      logs: room.logs,
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: '获取日志失败' });
  }
});

router.post('/log', async (req: Request, res: Response) => {
  try {
    const { roomCode, action, details, playerId } = req.body;
    const room = getRoomOrFail(roomCode, res);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    const log = createLogEntry(action, details, player);
    addLogToRoom(room, log);
    await db.write();

    res.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error('Add log error:', error);
    res.status(500).json({ message: '添加日志失败' });
  }
});

router.get('/board-cells', (_req: Request, res: Response) => {
  res.json({
    cells: BOARD_CELLS,
    boardSize: BOARD_SIZE,
    roleCards: ROLE_CARDS,
  });
});

router.get('/rankings/:roomCode', (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    const room = getRoomOrFail(roomCode, res);
    if (!room) return;

    const rankings = room.players
      .map((p, idx) => ({
        ...p,
        rank: 0,
        rankInfo: null as any,
      }))
      .sort((a, b) => b.coins - a.coins)
      .map((p, idx) => ({
        ...p,
        rank: idx + 1,
        rankInfo: calculateWinner.length > idx ? null : null,
      }));

    res.json({
      rankings,
      winner: room.winner,
      logs: room.logs,
    });
  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({ message: '获取排名失败' });
  }
});

router.delete('/:roomCode', async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    if (!db.data.rooms[roomCode]) {
      return res.status(404).json({ message: '房间不存在' });
    }
    delete db.data.rooms[roomCode];
    await db.write();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: '删除房间失败' });
  }
});

export default router;
