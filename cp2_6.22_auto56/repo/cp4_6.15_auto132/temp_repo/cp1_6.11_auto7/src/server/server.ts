import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import { createHash, randomUUID } from 'crypto';
import {
  GameState,
  Snake,
  Food,
  Player,
  Direction,
  FoodType,
  Position,
  WSMessage,
  JoinData,
  DirectionData,
  ReadyData,
  COLORS,
  FOOD_CONFIG,
  GRID_WIDTH,
  GRID_HEIGHT,
  BASE_SPEED,
  SYNC_INTERVAL,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MIN_FOODS,
  MAX_FOODS,
} from '../types';

interface WebSocketConnection {
  id: string;
  socket: Socket;
  playerId: string | null;
}

const connections = new Map<string, WebSocketConnection>();
let gameState: GameState = createInitialGameState();
let lastUpdateTime = Date.now();
let foodSpawnTimer = 0;

function createInitialGameState(): GameState {
  return {
    status: 'waiting',
    players: [],
    snakes: [],
    foods: [],
    gridWidth: GRID_WIDTH,
    gridHeight: GRID_HEIGHT,
    safeMode: false,
    startTime: 0,
    endTime: null,
  };
}

function createSnake(id: string, color: string, spawnIndex: number): Snake {
  const spacing = Math.floor(GRID_WIDTH / (MAX_PLAYERS + 1));
  const startX = spacing * (spawnIndex + 1);
  const startY = Math.floor(GRID_HEIGHT / 2);

  const body: Position[] = [];
  for (let i = 0; i < 5; i++) {
    body.push({ x: startX, y: startY + i });
  }

  return {
    id,
    body,
    direction: 'up',
    color,
    speed: BASE_SPEED,
    baseSpeed: BASE_SPEED,
    speedBoostEndTime: 0,
    isAlive: true,
    kills: 0,
    maxLength: 5,
    spawnTime: Date.now(),
    deathTime: null,
  };
}

function generateFoodId(): string {
  return 'food_' + randomUUID().slice(0, 8);
}

function getRandomPosition(): Position {
  return {
    x: Math.floor(Math.random() * GRID_WIDTH),
    y: Math.floor(Math.random() * GRID_HEIGHT),
  };
}

function isPositionOccupied(pos: Position): boolean {
  for (const snake of gameState.snakes) {
    if (!snake.isAlive) continue;
    for (const segment of snake.body) {
      if (segment.x === pos.x && segment.y === pos.y) {
        return true;
      }
    }
  }
  for (const food of gameState.foods) {
    if (food.position.x === pos.x && food.position.y === pos.y) {
      return true;
    }
  }
  return false;
}

function spawnFood(type: FoodType): Food | null {
  let attempts = 100;
  while (attempts > 0) {
    const pos = getRandomPosition();
    if (!isPositionOccupied(pos)) {
      return {
        id: generateFoodId(),
        type,
        position: pos,
        spawnTime: Date.now(),
      };
    }
    attempts--;
  }
  return null;
}

function initializeFoods() {
  gameState.foods = [];
  for (let i = 0; i < 12; i++) {
    const food = spawnFood('normal');
    if (food) gameState.foods.push(food);
  }
}

function maintainFoodCount() {
  const now = Date.now();

  gameState.foods = gameState.foods.filter((food) => {
    if (food.type === 'normal') return true;
    const config = FOOD_CONFIG[food.type];
    if (config.duration === Infinity) return true;
    return now - food.spawnTime < config.duration;
  });

  const normalFoods = gameState.foods.filter((f) => f.type === 'normal').length;
  const targetNormal = Math.floor(MIN_FOODS + Math.random() * (MAX_FOODS - MIN_FOODS));

  if (normalFoods < targetNormal) {
    const toAdd = targetNormal - normalFoods;
    for (let i = 0; i < toAdd; i++) {
      const food = spawnFood('normal');
      if (food) gameState.foods.push(food);
    }
  }

  foodSpawnTimer += SYNC_INTERVAL;

  if (foodSpawnTimer >= 10000) {
    foodSpawnTimer = 0;
    const speedFoods = gameState.foods.filter((f) => f.type === 'speed').length;
    if (speedFoods < 2) {
      const food = spawnFood('speed');
      if (food) gameState.foods.push(food);
    }
  }

  if (foodSpawnTimer % 15000 < SYNC_INTERVAL && foodSpawnTimer > 0) {
    const bombFoods = gameState.foods.filter((f) => f.type === 'bomb').length;
    if (bombFoods < 1) {
      const food = spawnFood('bomb');
      if (food) gameState.foods.push(food);
    }
  }
}

function moveSnake(snake: Snake): boolean {
  if (!snake.isAlive) return false;

  const head = snake.body[0];
  const newHead = { ...head };

  switch (snake.direction) {
    case 'up':
      newHead.y -= 1;
      break;
    case 'down':
      newHead.y += 1;
      break;
    case 'left':
      newHead.x -= 1;
      break;
    case 'right':
      newHead.x += 1;
      break;
  }

  if (
    newHead.x < 0 ||
    newHead.x >= GRID_WIDTH ||
    newHead.y < 0 ||
    newHead.y >= GRID_HEIGHT
  ) {
    return false;
  }

  snake.body.unshift(newHead);
  snake.body.pop();

  return true;
}

function checkSelfCollision(snake: Snake): boolean {
  if (!snake.isAlive || snake.body.length < 4) return false;
  const head = snake.body[0];
  for (let i = 1; i < snake.body.length; i++) {
    if (snake.body[i].x === head.x && snake.body[i].y === head.y) {
      return true;
    }
  }
  return false;
}

function checkSnakeCollision(snakeA: Snake, snakeB: Snake): boolean {
  if (!snakeA.isAlive || !snakeB.isAlive) return false;
  if (snakeA.id === snakeB.id) return false;
  const head = snakeA.body[0];
  for (const segment of snakeB.body) {
    if (segment.x === head.x && segment.y === head.y) {
      return true;
    }
  }
  return false;
}

function checkFoodCollision(snake: Snake): Food | null {
  if (!snake.isAlive) return null;
  const head = snake.body[0];
  for (const food of gameState.foods) {
    if (food.position.x === head.x && food.position.y === head.y) {
      return food;
    }
  }
  return null;
}

function growSnake(snake: Snake, amount: number) {
  const tail = snake.body[snake.body.length - 1];
  for (let i = 0; i < amount; i++) {
    snake.body.push({ ...tail });
  }
  if (snake.body.length > snake.maxLength) {
    snake.maxLength = snake.body.length;
  }
}

function shrinkSnake(snake: Snake, amount: number) {
  const shrinkAmount = Math.min(amount, snake.body.length - 1);
  for (let i = 0; i < shrinkAmount; i++) {
    snake.body.pop();
  }
}

function updateGame(deltaTime: number) {
  if (gameState.status !== 'playing') return;

  const now = Date.now();

  for (const snake of gameState.snakes) {
    if (!snake.isAlive) continue;

    if (snake.speedBoostEndTime > 0 && now > snake.speedBoostEndTime) {
      snake.speed = snake.baseSpeed;
      snake.speedBoostEndTime = 0;
    }
  }

  for (const snake of gameState.snakes) {
    if (!snake.isAlive) continue;

    const moveInterval = 1000 / snake.speed;
    const moveChance = deltaTime / moveInterval;

    if (Math.random() < moveChance) {
      const moved = moveSnake(snake);
      if (!moved || checkSelfCollision(snake)) {
        snake.isAlive = false;
        snake.deathTime = now;
        continue;
      }

      let killed = false;
      for (const other of gameState.snakes) {
        if (checkSnakeCollision(snake, other)) {
          snake.isAlive = false;
          snake.deathTime = now;
          if (other.isAlive) {
            other.kills++;
          }
          killed = true;
          break;
        }
      }

      if (!killed && snake.isAlive) {
        const food = checkFoodCollision(snake);
        if (food && !gameState.safeMode) {
          const config = FOOD_CONFIG[food.type];

          if (food.type === 'bomb') {
            shrinkSnake(snake, 3);
          } else {
            growSnake(snake, config.growth);

            if (food.type === 'speed') {
              const speedConfig = FOOD_CONFIG.speed;
              if ('speedBoost' in speedConfig && 'speedBoostDuration' in speedConfig) {
                snake.speed = snake.baseSpeed * (1 + speedConfig.speedBoost);
                snake.speedBoostEndTime = now + speedConfig.speedBoostDuration;
              }
            }
          }

          gameState.foods = gameState.foods.filter((f) => f.id !== food.id);
        }
      }
    }
  }

  const aliveSnakes = gameState.snakes.filter((s) => s.isAlive);
  if (aliveSnakes.length <= 1 && gameState.snakes.length >= MIN_PLAYERS) {
    gameState.safeMode = true;
    if (aliveSnakes.length === 0) {
      endGame();
    }
  }

  maintainFoodCount();
}

function startGame() {
  if (gameState.status !== 'waiting') return;

  const readyPlayers = gameState.players.filter((p) => p.isReady);
  if (readyPlayers.length < MIN_PLAYERS) return;

  gameState.snakes = readyPlayers.map((player, index) =>
    createSnake(player.id, player.color, index)
  );

  initializeFoods();
  gameState.status = 'playing';
  gameState.safeMode = false;
  gameState.startTime = Date.now();
  gameState.endTime = null;
  lastUpdateTime = Date.now();
  foodSpawnTimer = 0;

  broadcast('start', {});
}

function endGame() {
  if (gameState.status === 'ended') return;

  gameState.status = 'ended';
  gameState.endTime = Date.now();

  broadcast('gameOver', { state: gameState });
}

function restartGame() {
  const players = [...gameState.players];
  gameState = createInitialGameState();
  for (const player of players) {
    player.isReady = false;
    gameState.players.push(player);
  }
  broadcast('state', gameState);
  broadcastPlayersUpdate();
}

function addPlayer(name: string, color: string, connId: string): Player | null {
  const existingConnection = connections.get(connId);
  if (!existingConnection) return null;

  if (gameState.players.length >= MAX_PLAYERS) return null;

  const playerId = 'player_' + randomUUID().slice(0, 8);
  const player: Player = {
    id: playerId,
    name,
    color,
    isReady: false,
  };

  gameState.players.push(player);
  existingConnection.playerId = playerId;

  broadcastPlayersUpdate();

  return player;
}

function removePlayer(playerId: string) {
  gameState.players = gameState.players.filter((p) => p.id !== playerId);
  gameState.snakes = gameState.snakes.filter((s) => s.id !== playerId);

  if (gameState.status === 'waiting') {
    broadcastPlayersUpdate();
  } else if (gameState.status === 'playing') {
    const aliveCount = gameState.snakes.filter((s) => s.isAlive).length;
    if (aliveCount <= 1 && gameState.snakes.length >= MIN_PLAYERS) {
      gameState.safeMode = true;
      if (aliveCount === 0) {
        endGame();
      }
    }
  }
}

function setPlayerReady(playerId: string, isReady: boolean) {
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return;

  player.isReady = isReady;
  broadcastPlayersUpdate();

  const readyCount = gameState.players.filter((p) => p.isReady).length;
  if (readyCount >= MIN_PLAYERS && gameState.status === 'waiting') {
    const allReady = gameState.players.every((p) => p.isReady);
    if (allReady && gameState.players.length >= MIN_PLAYERS) {
      startGame();
    }
  }
}

function changeDirection(playerId: string, direction: Direction) {
  const snake = gameState.snakes.find((s) => s.id === playerId);
  if (!snake || !snake.isAlive) return;

  const opposite: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };

  if (direction === opposite[snake.direction]) return;

  snake.direction = direction;
}

function broadcastPlayersUpdate() {
  broadcast('playersUpdate', {
    players: gameState.players,
    status: gameState.status,
  });
}

function broadcast<T>(type: string, data: T) {
  const message: WSMessage<T> = {
    type: type as WSMessage['type'],
    data,
    timestamp: Date.now(),
  };
  const json = JSON.stringify(message);
  for (const conn of connections.values()) {
    sendToConnection(conn, json);
  }
}

function sendToConnection(conn: WebSocketConnection, message: string) {
  try {
    conn.socket.write(encodeWebSocketFrame(message));
  } catch (e) {
    console.error('Error sending message:', e);
  }
}

function encodeWebSocketFrame(data: string): Buffer {
  const payload = Buffer.from(data, 'utf-8');
  const payloadLength = payload.length;

  let headerLength = 2;
  if (payloadLength > 125 && payloadLength <= 65535) {
    headerLength = 4;
  } else if (payloadLength > 65535) {
    headerLength = 10;
  }

  const frame = Buffer.alloc(headerLength + payloadLength);

  frame[0] = 0x81;

  if (payloadLength <= 125) {
    frame[1] = payloadLength;
  } else if (payloadLength <= 65535) {
    frame[1] = 126;
    frame.writeUInt16BE(payloadLength, 2);
  } else {
    frame[1] = 127;
    frame.writeBigUInt64BE(BigInt(payloadLength), 2);
  }

  payload.copy(frame, headerLength);

  return frame;
}

function decodeWebSocketFrame(buffer: Buffer): { data: string | null; opcode: number; frameLength: number } | null {
  if (buffer.length < 2) return null;

  const byte1 = buffer[0];
  const byte2 = buffer[1];

  const opcode = byte1 & 0x0f;
  const isMasked = (byte2 & 0x80) !== 0;
  let payloadLength = byte2 & 0x7f;

  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    payloadLength = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  let totalHeaderLength = offset;

  if (isMasked) {
    totalHeaderLength += 4;
  }

  const totalFrameLength = totalHeaderLength + payloadLength;

  if (buffer.length < totalFrameLength) return null;

  if (isMasked) {
    const mask = buffer.slice(offset, offset + 4);
    offset += 4;

    const payload = Buffer.alloc(payloadLength);
    for (let i = 0; i < payloadLength; i++) {
      payload[i] = buffer[offset + i] ^ mask[i % 4];
    }

    return { data: payload.toString('utf-8'), opcode, frameLength: totalFrameLength };
  }

  return {
    data: buffer.slice(offset, offset + payloadLength).toString('utf-8'),
    opcode,
    frameLength: totalFrameLength,
  };
}

function handleUpgrade(request: IncomingMessage, socket: Socket) {
  const key = request.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '',
    '',
  ].join('\r\n');

  socket.write(headers);

  const connId = 'conn_' + randomUUID().slice(0, 8);
  const connection: WebSocketConnection = {
    id: connId,
    socket,
    playerId: null,
  };
  connections.set(connId, connection);

  let buffer = Buffer.alloc(0);

  socket.on('data', (data: Buffer) => {
    buffer = Buffer.concat([buffer, data]);

    while (buffer.length >= 2) {
      const result = decodeWebSocketFrame(buffer);
      if (!result) break;

      if (result.opcode === 0x8) {
        socket.destroy();
        return;
      }

      if (result.data !== null) {
        try {
          const message = JSON.parse(result.data) as WSMessage;
          handleMessage(connId, message);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }

      buffer = buffer.slice(result.frameLength);
    }
  });

  socket.on('close', () => {
    handleDisconnect(connId);
  });

  socket.on('error', () => {
    handleDisconnect(connId);
  });
}

function handleMessage(connId: string, message: WSMessage) {
  const connection = connections.get(connId);
  if (!connection) return;

  switch (message.type) {
    case 'join': {
      const data = message.data as JoinData;
      const player = addPlayer(data.name, data.color, connId);
      if (player) {
        const stateMsg: WSMessage = {
          type: 'state',
          data: gameState,
          timestamp: Date.now(),
        };
        sendToConnection(connection, JSON.stringify(stateMsg));
      } else {
        const errMsg: WSMessage = {
          type: 'error',
          data: { message: '房间已满' },
          timestamp: Date.now(),
        };
        sendToConnection(connection, JSON.stringify(errMsg));
      }
      break;
    }
    case 'ready': {
      if (connection.playerId) {
        const data = message.data as ReadyData;
        setPlayerReady(connection.playerId, data.isReady);
      }
      break;
    }
    case 'direction': {
      if (connection.playerId && gameState.status === 'playing') {
        const data = message.data as DirectionData;
        changeDirection(connection.playerId, data.direction);
      }
      break;
    }
    case 'restart': {
      if (connection.playerId) {
        if (gameState.status === 'ended') {
          restartGame();
        } else {
          const player = gameState.players.find((p) => p.id === connection.playerId);
          if (player) {
            player.isReady = false;
            broadcastPlayersUpdate();
          }
        }
      }
      break;
    }
  }
}

function handleDisconnect(connId: string) {
  const connection = connections.get(connId);
  if (!connection) return;

  if (connection.playerId) {
    removePlayer(connection.playerId);
  }

  connections.delete(connId);
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.on('upgrade', (request: IncomingMessage, socket: Socket) => {
  if (request.url === '/ws') {
    handleUpgrade(request, socket);
  } else {
    socket.destroy();
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
});

function gameLoop() {
  const now = Date.now();
  const deltaTime = now - lastUpdateTime;
  lastUpdateTime = now;

  if (gameState.status === 'playing') {
    updateGame(deltaTime);
  }

  if (gameState.status === 'playing' || gameState.status === 'ended') {
    broadcast('state', gameState);
  }
}

setInterval(gameLoop, SYNC_INTERVAL);
