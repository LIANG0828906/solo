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

function simulateLaser(firingPlayer, elements) {
  const CELL_SIZE = 80;
  
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

  const DIRECTION_VECTORS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  const MIRROR_REFLECTIONS = {
    'nw-se-up': 'right',
    'nw-se-right': 'up',
    'nw-se-down': 'left',
    'nw-se-left': 'down',
    'ne-sw-up': 'left',
    'ne-sw-left': 'up',
    'ne-sw-down': 'right',
    'ne-sw-right': 'down'
  };

  function reflectDirection(direction, orientation) {
    const key = `${orientation}-${direction}`;
    return MIRROR_REFLECTIONS[key] || direction;
  }

  function splitDirection(direction) {
    const splits = {
      up: ['left', 'right'],
      down: ['left', 'right'],
      left: ['up', 'down'],
      right: ['up', 'down']
    };
    return splits[direction];
  }

  const startPos = getLaserStartPosition(firingPlayer);
  const initialDir = firingPlayer === 'playerA' ? 'up' : 'down';

  const segments = [];
  const particles = [];
  const rays = [{ position: startPos, direction: initialDir, intensity: 1.0 }];
  const visited = new Set();
  let hitBase = null;
  let hitPosition = null;

  while (rays.length > 0 && segments.length < 100) {
    const ray = rays.shift();
    const key = `${ray.position.x},${ray.position.y},${ray.direction}`;
    
    if (visited.has(key)) continue;
    visited.add(key);

    const dir = DIRECTION_VECTORS[ray.direction];
    let currentPos = { ...ray.position };
    let hit = false;

    while (!hit) {
      const nextPos = {
        x: currentPos.x + dir.x * CELL_SIZE,
        y: currentPos.y + dir.y * CELL_SIZE
      };

      const nextGrid = pixelToGrid(nextPos);
      
      if (!isInBounds(nextGrid)) {
        segments.push({
          start: { ...ray.position },
          end: { ...nextPos },
          intensity: ray.intensity
        });
        break;
      }

      const baseA = getBasePosition('playerA');
      const baseB = getBasePosition('playerB');
      
      if (Math.hypot(nextPos.x - baseA.x, nextPos.y - baseA.y) < 20) {
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
      
      if (Math.hypot(nextPos.x - baseB.x, nextPos.y - baseB.y) < 20) {
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

      const element = getElementAt(nextGrid, elements);
      
      if (element) {
        const elementCenter = gridToPixel(element.position);
        
        segments.push({
          start: { ...ray.position },
          end: { ...elementCenter },
          intensity: ray.intensity
        });

        if (element.type === 'mirror' && element.orientation) {
          const newDir = reflectDirection(ray.direction, element.orientation);
          rays.push({
            position: { ...elementCenter },
            direction: newDir,
            intensity: ray.intensity
          });
        } else if (element.type === 'prism') {
          const [dir1, dir2] = splitDirection(ray.direction);
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

      currentPos = nextPos;
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
  io.to(roomCode).emit('game:state', {
    turnPhase: 'fire',
    isFiring: true,
    laserResult: result,
    players: room.gameState.players
  });

  setTimeout(() => {
    room.gameState.isFiring = false;
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

  io.to(roomCode).emit('game:state', {
    currentTurn: nextPlayer,
    turnPhase: 'adjust',
    round: newRound,
    timeRemaining: TURN_DURATION,
    laserResult: null,
    isFiring: false
  });

  startTurnTimer(roomCode, room);
}

function endGame(roomCode, room) {
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
    room.turnTimer = null;
  }

  room.gameState.phase = 'ended';
  
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
  io.to(roomCode).emit('game:state', {
    phase: 'ended',
    winner
  });
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
    
    io.to(roomCode).emit('game:state', {
      players: room.gameState.players
    });

    console.log(`Player ${player} joined room ${roomCode}`);

    if (room.players.playerA && room.players.playerB) {
      io.to(roomCode).emit('room:full');
      
      room.gameState.phase = 'playing';
      io.to(roomCode).emit('game:start', room.gameState);
      
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
    const isInCorrectHalf = player === 'playerA' 
      ? data.position.y >= midpoint 
      : data.position.y < midpoint;
    
    if (!isInCorrectHalf) return;

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

        io.to(roomCode).emit('game:state', {
          players: room.gameState.players
        });

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
