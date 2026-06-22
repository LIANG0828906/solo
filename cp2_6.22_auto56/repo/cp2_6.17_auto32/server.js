import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = 3001;

const GRID_SIZE = 8;
const TURN_DURATION = 15;
const MAX_ROUNDS = 5;
const INITIAL_LIVES = 3;
const CELL_SIZE = 80;
const BOARD_SIZE_PX = GRID_SIZE * CELL_SIZE;

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateId() {
  return `elem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createInitialElements() {
  const elements = [];

  const mirrorPositions = [
    { pos: { x: 2, y: 2 }, orientation: 'nw-se' },
    { pos: { x: 5, y: 2 }, orientation: 'ne-sw' },
    { pos: { x: 1, y: 4 }, orientation: 'ne-sw' },
    { pos: { x: 6, y: 4 }, orientation: 'nw-se' },
    { pos: { x: 3, y: 6 }, orientation: 'ne-sw' },
    { pos: { x: 4, y: 1 }, orientation: 'nw-se' },
  ];

  mirrorPositions.forEach(({ pos, orientation }) => {
    elements.push({
      id: generateId(),
      type: 'mirror',
      position: pos,
      orientation,
      movable: false,
      owner: 'neutral'
    });
  });

  const prismPositions = [
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 2, y: 5 },
  ];

  prismPositions.forEach(pos => {
    elements.push({
      id: generateId(),
      type: 'prism',
      position: pos,
      movable: false,
      owner: 'neutral'
    });
  });

  const blockerPositionsA = [
    { x: 1, y: 6 },
    { x: 2, y: 7 },
  ];

  blockerPositionsA.forEach(pos => {
    elements.push({
      id: generateId(),
      type: 'blocker',
      position: pos,
      movable: true,
      owner: 'playerA'
    });
  });

  const blockerPositionsB = [
    { x: 5, y: 0 },
    { x: 6, y: 1 },
  ];

  blockerPositionsB.forEach(pos => {
    elements.push({
      id: generateId(),
      type: 'blocker',
      position: pos,
      movable: true,
      owner: 'playerB'
    });
  });

  return elements;
}

const MIRROR_NORMALS = {
  'nw-se': { x: 1, y: -1 },
  'ne-sw': { x: -1, y: -1 }
};

function vecNormalize(v) {
  const len = Math.hypot(v.x, v.y);
  if (len < 1e-10) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function vecDot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function vecScale(v, s) {
  return { x: v.x * s, y: v.y * s };
}

function vecSub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function reflectVector(incident, normal) {
  const n = vecNormalize(normal);
  const d = vecDot(incident, n);
  return vecSub(incident, vecScale(n, 2 * d));
}

function rotateVector(v, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos
  };
}

function reflectMirror(incidentDir, orientation) {
  const normal = vecNormalize(MIRROR_NORMALS[orientation]);
  const dot = vecDot(incidentDir, normal);
  const usedNormal = dot < 0 ? normal : vecScale(normal, -1);
  const result = reflectVector(incidentDir, usedNormal);
  return vecNormalize(result);
}

function splitPrism(incidentDir) {
  const splitAngle = (60 * Math.PI) / 180;
  const dir1 = vecNormalize(rotateVector(incidentDir, splitAngle));
  const dir2 = vecNormalize(rotateVector(incidentDir, -splitAngle));
  return [dir1, dir2];
}

function simulateLaser(firingPlayer, elements) {
  function gridToPixel(grid, center = true) {
    return {
      x: grid.x * CELL_SIZE + (center ? CELL_SIZE / 2 : 0),
      y: grid.y * CELL_SIZE + (center ? CELL_SIZE / 2 : 0)
    };
  }

  function pixelToGrid(pixel) {
    return {
      x: Math.floor(pixel.x / CELL_SIZE),
      y: Math.floor(pixel.y / CELL_SIZE)
    };
  }

  function isInBounds(coord) {
    return coord.x >= 0 && coord.x < GRID_SIZE && coord.y >= 0 && coord.y < GRID_SIZE;
  }

  function getElementAt(grid, elements) {
    return elements.find(e => e.position.x === grid.x && e.position.y === grid.y);
  }

  function getBasePosition(player) {
    if (player === 'playerA') {
      return gridToPixel({ x: 0, y: 7 });
    } else {
      return gridToPixel({ x: 7, y: 0 });
    }
  }

  function getLaserStartPosition(player) {
    const base = getBasePosition(player);
    if (player === 'playerA') {
      return { x: base.x, y: base.y - CELL_SIZE / 2 };
    } else {
      return { x: base.x, y: base.y + CELL_SIZE / 2 };
    }
  }

  const startPos = getLaserStartPosition(firingPlayer);
  const initialDir = firingPlayer === 'playerA' ? { x: 0, y: -1 } : { x: 0, y: 1 };

  const segments = [];
  const particles = [];
  const rays = [{ position: startPos, direction: initialDir, intensity: 1.0 }];
  const visited = new Set();
  let hitBase = null;
  let hitPosition = null;

  while (rays.length > 0 && segments.length < 50) {
    const ray = rays.shift();
    const dir = vecNormalize(ray.direction);
    const posKey = `${ray.position.x.toFixed(1)},${ray.position.y.toFixed(1)}`;
    const dirKey = `${dir.x.toFixed(3)},${dir.y.toFixed(3)}`;
    const key = `${posKey}|${dirKey}`;

    if (visited.has(key)) continue;
    if (rays.length > 20) break;
    visited.add(key);

    const stepSize = 2;
    const maxSteps = 1000;
    let currentPos = { ...ray.position };
    let lastGrid = pixelToGrid(currentPos);
    let hit = false;

    for (let step = 0; step < maxSteps && !hit; step++) {
      currentPos = {
        x: currentPos.x + dir.x * stepSize,
        y: currentPos.y + dir.y * stepSize
      };

      const baseA = getBasePosition('playerA');
      const baseB = getBasePosition('playerB');

      if (Math.hypot(currentPos.x - baseA.x, currentPos.y - baseA.y) < 20) {
        segments.push({
          start: { ...ray.position },
          end: { ...baseA },
          intensity: ray.intensity
        });
        hitBase = 'playerA';
        hitPosition = baseA;
        hit = true;
        break;
      }

      if (Math.hypot(currentPos.x - baseB.x, currentPos.y - baseB.y) < 20) {
        segments.push({
          start: { ...ray.position },
          end: { ...baseB },
          intensity: ray.intensity
        });
        hitBase = 'playerB';
        hitPosition = baseB;
        hit = true;
        break;
      }

      if (currentPos.x < -50 || currentPos.x > BOARD_SIZE_PX + 50 ||
          currentPos.y < -50 || currentPos.y > BOARD_SIZE_PX + 50) {
        segments.push({
          start: { ...ray.position },
          end: { ...currentPos },
          intensity: ray.intensity
        });
        hit = true;
        break;
      }

      const currentGrid = pixelToGrid(currentPos);
      const gridChanged = currentGrid.x !== lastGrid.x || currentGrid.y !== lastGrid.y;

      if (gridChanged && isInBounds(currentGrid)) {
        const element = getElementAt(currentGrid, elements);
        if (element) {
          const elementCenter = gridToPixel(element.position);

          segments.push({
            start: { ...ray.position },
            end: { ...elementCenter },
            intensity: ray.intensity
          });

          if (element.type === 'mirror' && element.orientation) {
            const newDir = reflectMirror(vecNormalize(ray.direction), element.orientation);
            rays.push({
              position: { ...elementCenter },
              direction: newDir,
              intensity: ray.intensity * 0.95
            });
          } else if (element.type === 'prism') {
            const [dir1, dir2] = splitPrism(vecNormalize(ray.direction));
            const newIntensity = ray.intensity * 0.7;
            rays.push({
              position: { ...elementCenter },
              direction: dir1,
              intensity: newIntensity
            });
            rays.push({
              position: { ...elementCenter },
              direction: dir2,
              intensity: newIntensity
            });
          } else if (element.type === 'blocker') {
            particles.push({
              id: `particle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              position: { ...elementCenter },
              color: '#87CEEB',
              createdAt: Date.now(),
              duration: 500
            });
          }

          hit = true;
          break;
        }
      }

      lastGrid = currentGrid;
    }
  }

  return {
    segments,
    hitBase,
    hitPosition,
    particles
  };
}

const rooms = new Map();

function createRoomState() {
  return {
    players: {
      playerA: null,
      playerB: null
    },
    gameState: {
      phase: 'matching',
      currentTurn: 'playerA',
      turnPhase: 'adjust',
      round: 1,
      timeRemaining: TURN_DURATION,
      players: {
        playerA: {
          id: 'playerA',
          name: 'playerA',
          lives: INITIAL_LIVES,
          score: 0,
          connected: false
        },
        playerB: {
          id: 'playerB',
          name: 'playerB',
          lives: INITIAL_LIVES,
          score: 0,
          connected: false
        }
      },
      elements: createInitialElements(),
      laserResult: null,
      isFiring: false,
      winner: null,
      roomCode: null,
      localPlayer: null
    },
    turnTimer: null
  };
}

function broadcastFullState(roomCode, room) {
  const gs = room.gameState;
  io.to(roomCode).emit('game:state', {
    phase: gs.phase,
    currentTurn: gs.currentTurn,
    turnPhase: gs.turnPhase,
    round: gs.round,
    timeRemaining: gs.timeRemaining,
    players: gs.players,
    elements: gs.elements,
    laserResult: gs.laserResult,
    isFiring: gs.isFiring,
    winner: gs.winner
  });
}

function startTurnTimer(roomCode, room) {
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
  }

  room.gameState.timeRemaining = TURN_DURATION;
  
  room.turnTimer = setInterval(() => {
    room.gameState.timeRemaining--;
    
    io.to(roomCode).emit('game:state', {
      timeRemaining: room.gameState.timeRemaining
    });

    if (room.gameState.timeRemaining <= 0) {
      clearInterval(room.turnTimer);
      room.turnTimer = null;
      autoFireLaser(roomCode, room);
    }
  }, 1000);
}

function autoFireLaser(roomCode, room) {
  if (room.gameState.turnPhase !== 'adjust' || room.gameState.isFiring) {
    nextTurn(roomCode, room);
    return;
  }

  handleFireLaser(roomCode, room);
}

function handleFireLaser(roomCode, room) {
  if (room.gameState.phase !== 'playing') return;
  if (room.gameState.turnPhase !== 'adjust') return;
  if (room.gameState.isFiring) return;

  if (room.turnTimer) {
    clearInterval(room.turnTimer);
    room.turnTimer = null;
  }

  room.gameState.turnPhase = 'fire';
  room.gameState.isFiring = true;

  const result = simulateLaser(room.gameState.currentTurn, room.gameState.elements);
  room.gameState.laserResult = result;

  const firingPlayer = room.gameState.currentTurn;
  const targetPlayer = firingPlayer === 'playerA' ? 'playerB' : 'playerA';

  if (result.hitBase === targetPlayer) {
    room.gameState.players[firingPlayer].score++;
    room.gameState.players[targetPlayer].lives = Math.max(0, room.gameState.players[targetPlayer].lives - 1);
  }

  io.to(roomCode).emit('laser:fired', result);

  broadcastFullState(roomCode, room);

  setTimeout(() => {
    room.gameState.isFiring = false;
    room.gameState.turnPhase = 'resolve';
    nextTurn(roomCode, room);
  }, 2000);
}

function nextTurn(roomCode, room) {
  const nextPlayer = room.gameState.currentTurn === 'playerA' ? 'playerB' : 'playerA';
  const newRound = nextPlayer === 'playerA' ? room.gameState.round + 1 : room.gameState.round;

  if (newRound > MAX_ROUNDS || 
      room.gameState.players.playerA.lives <= 0 || 
      room.gameState.players.playerB.lives <= 0) {
    endGame(roomCode, room);
    return;
  }

  room.gameState.currentTurn = nextPlayer;
  room.gameState.turnPhase = 'adjust';
  room.gameState.round = newRound;
  room.gameState.timeRemaining = TURN_DURATION;
  room.gameState.laserResult = null;
  room.gameState.isFiring = false;

  io.to(roomCode).emit('game:turn', {
    turn: nextPlayer,
    phase: 'adjust',
    time: TURN_DURATION
  });

  broadcastFullState(roomCode, room);

  startTurnTimer(roomCode, room);
}

function endGame(roomCode, room) {
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
    room.turnTimer = null;
  }

  room.gameState.phase = 'ended';
  room.gameState.laserResult = null;
  room.gameState.isFiring = false;
  room.gameState.turnPhase = 'resolve';
  
  const playerA = room.gameState.players.playerA;
  const playerB = room.gameState.players.playerB;
  
  let winner;
  if (playerA.lives <= 0) {
    winner = 'playerB';
  } else if (playerB.lives <= 0) {
    winner = 'playerA';
  } else if (playerA.score > playerB.score) {
    winner = 'playerA';
  } else if (playerB.score > playerA.score) {
    winner = 'playerB';
  } else {
    winner = 'draw';
  }

  room.gameState.winner = winner;

  io.to(roomCode).emit('game:end', { winner });

  broadcastFullState(roomCode, room);
}

function restartGame(roomCode, room) {
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
    room.turnTimer = null;
  }

  room.gameState = {
    phase: 'playing',
    currentTurn: 'playerA',
    turnPhase: 'adjust',
    round: 1,
    timeRemaining: TURN_DURATION,
    players: {
      playerA: {
        ...room.gameState.players.playerA,
        lives: INITIAL_LIVES,
        score: 0
      },
      playerB: {
        ...room.gameState.players.playerB,
        lives: INITIAL_LIVES,
        score: 0
      }
    },
    elements: createInitialElements(),
    laserResult: null,
    isFiring: false,
    winner: null,
    roomCode,
    localPlayer: null
  };

  io.to(roomCode).emit('game:start', room.gameState);
  
  broadcastFullState(roomCode, room);

  setTimeout(() => {
    startTurnTimer(roomCode, room);
  }, 500);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('room:create', () => {
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));

    const room = createRoomState();
    room.gameState.roomCode = roomCode;
    rooms.set(roomCode, room);

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.player = 'playerA';

    room.players.playerA = socket.id;
    room.gameState.players.playerA.connected = true;

    socket.emit('room:joined', { roomCode, player: 'playerA' });
    console.log(`Room ${roomCode} created by playerA`);
  });

  socket.on('room:join', (roomCode) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', '房间不存在');
      return;
    }

    if (room.players.playerA && room.players.playerB) {
      socket.emit('error', '房间已满');
      return;
    }

    const player = room.players.playerA ? 'playerB' : 'playerA';
    
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.player = player;

    room.players[player] = socket.id;
    room.gameState.players[player].connected = true;

    socket.emit('room:joined', { roomCode, player });
    
    broadcastFullState(roomCode, room);

    console.log(`Player ${player} joined room ${roomCode}`);

    if (room.players.playerA && room.players.playerB) {
      io.to(roomCode).emit('room:full');
      
      room.gameState.phase = 'playing';
      io.to(roomCode).emit('game:start', room.gameState);
      
      broadcastFullState(roomCode, room);

      setTimeout(() => {
        startTurnTimer(roomCode, room);
      }, 1000);
    }
  });

  socket.on('element:move', (data) => {
    const { roomCode, player } = socket.data;
    const room = rooms.get(roomCode);
    
    if (!room || room.gameState.phase !== 'playing') return;
    if (room.gameState.turnPhase !== 'adjust') return;
    if (room.gameState.currentTurn !== player) return;

    const element = room.gameState.elements.find(e => e.id === data.elementId);
    if (!element || !element.movable || element.owner !== player) return;

    const midpoint = GRID_SIZE / 2;
    
    if (player === 'playerA') {
      if (data.position.y < midpoint || data.position.x >= midpoint) return;
    } else {
      if (data.position.y >= midpoint || data.position.x < midpoint) return;
    }

    if (data.position.x < 0 || data.position.x >= GRID_SIZE || 
        data.position.y < 0 || data.position.y >= GRID_SIZE) return;

    const isOccupied = room.gameState.elements.some(e => 
      e.id !== data.elementId && 
      e.position.x === data.position.x && 
      e.position.y === data.position.y
    );
    
    if (isOccupied) return;

    room.gameState.elements = room.gameState.elements.map(e =>
      e.id === data.elementId ? { ...e, position: data.position } : e
    );

    io.to(roomCode).emit('element:moved', data);

    io.to(roomCode).emit('game:state', {
      elements: room.gameState.elements
    });
  });

  socket.on('laser:fire', () => {
    const { roomCode, player } = socket.data;
    const room = rooms.get(roomCode);
    
    if (!room) return;
    if (room.gameState.currentTurn !== player) return;

    handleFireLaser(roomCode, room);
  });

  socket.on('game:restart', () => {
    const { roomCode } = socket.data;
    const room = rooms.get(roomCode);
    
    if (!room) return;

    restartGame(roomCode, room);
  });

  socket.on('disconnect', () => {
    const { roomCode, player } = socket.data;
    
    if (roomCode && rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      
      if (room.players[player] === socket.id) {
        room.players[player] = null;
        room.gameState.players[player].connected = false;

        if (room.turnTimer) {
          clearInterval(room.turnTimer);
          room.turnTimer = null;
        }

        broadcastFullState(roomCode, room);

        if (!room.players.playerA && !room.players.playerB) {
          setTimeout(() => {
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} deleted`);
          }, 30000);
        }
      }
    }

    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
