import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  Snake,
  SnakeSegment,
  Direction,
  Food,
  DeathParticle,
  MAP_WIDTH,
  MAP_HEIGHT,
  SEGMENT_SIZE,
  SEGMENT_GAP,
  MOVE_INTERVAL,
  INITIAL_SNAKE_LENGTH,
  FOOD_SPAWN_INTERVAL,
  MAX_FOODS,
  FOOD_SIZE,
  SERVER_TICK_INTERVAL,
} from '../src/game/types';

const SNAKE_NAMES = [
  '疾风蛇', '闪电蛇', '毒牙蛇', '翡翠蛇', '幽灵蛇',
  '烈焰蛇', '寒冰蛇', '风暴蛇', '暗影蛇', '光芒蛇',
  '雷霆蛇', '大地蛇', '深渊蛇', '星尘蛇', '幻影蛇',
];

const SNAKE_COLORS = [
  '#00ff88', '#00aaff', '#ff6b6b', '#ffd93d', '#6bcb77',
  '#4d96ff', '#ff6b9d', '#c56cf0', '#1dd1a1', '#ff9f43',
];

const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const DIRECTION_ROTATION: Record<Direction, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

interface Client {
  ws: WebSocket;
  playerId: string;
}

class ServerGameEngine {
  snakes: Map<string, Snake> = new Map();
  foods: Map<string, Food> = new Map();
  deathParticles: DeathParticle[] = [];
  tickInterval = MOVE_INTERVAL;
  tick = 0;
  startedAt = Date.now();
  mapWidth = MAP_WIDTH;
  mapHeight = MAP_HEIGHT;
  lastTickTime = 0;
  lastFoodSpawn = 0;

  getRandomPosition(): { x: number; y: number } {
    const padding = 60;
    const x = padding + Math.random() * (this.mapWidth - padding * 2);
    const y = padding + Math.random() * (this.mapHeight - padding * 2);
    return { x, y };
  }

  getRandomDirection(): Direction {
    const dirs: Direction[] = ['up', 'down', 'left', 'right'];
    return dirs[Math.floor(Math.random() * dirs.length)];
  }

  isPositionOccupied(x: number, y: number): boolean {
    const radius = SEGMENT_SIZE * 2;
    for (const snake of this.snakes.values()) {
      for (const seg of snake.segments) {
        if (Math.abs(seg.x - x) < radius && Math.abs(seg.y - y) < radius) {
          return true;
        }
      }
    }
    return false;
  }

  addSnake(playerId: string): Snake {
    let pos = this.getRandomPosition();
    let attempts = 0;
    while (this.isPositionOccupied(pos.x, pos.y) && attempts < 20) {
      pos = this.getRandomPosition();
      attempts++;
    }

    const direction = this.getRandomDirection();
    const step = SEGMENT_SIZE + SEGMENT_GAP;
    const segments: SnakeSegment[] = [];
    const vec = DIRECTION_VECTORS[direction];

    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      segments.push({
        x: pos.x - vec.dx * step * i,
        y: pos.y - vec.dy * step * i,
      });
    }

    const snake: Snake = {
      id: playerId,
      name: SNAKE_NAMES[Math.floor(Math.random() * SNAKE_NAMES.length)] + Math.floor(Math.random() * 100),
      segments,
      direction,
      nextDirection: direction,
      score: 0,
      alive: true,
      color: SNAKE_COLORS[Math.floor(Math.random() * SNAKE_COLORS.length)],
      bornAt: Date.now(),
      flashUntil: Date.now() + 300,
      headRotation: DIRECTION_ROTATION[direction],
      targetRotation: DIRECTION_ROTATION[direction],
    };

    this.snakes.set(playerId, snake);
    return snake;
  }

  removeSnake(playerId: string) {
    this.snakes.delete(playerId);
  }

  setDirection(playerId: string, direction: Direction) {
    const snake = this.snakes.get(playerId);
    if (!snake || !snake.alive) return;
    if (OPPOSITE_DIRECTION[snake.direction] === direction) return;
    snake.nextDirection = direction;
    snake.targetRotation = DIRECTION_ROTATION[direction];
  }

  spawnFood() {
    if (this.foods.size >= MAX_FOODS) return;
    let pos = this.getRandomPosition();
    let attempts = 0;
    while ((this.isPositionOccupied(pos.x, pos.y) || this.isFoodNearby(pos.x, pos.y)) && attempts < 20) {
      pos = this.getRandomPosition();
      attempts++;
    }

    const food: Food = {
      id: uuidv4(),
      x: pos.x,
      y: pos.y,
      spawnedAt: Date.now(),
    };
    this.foods.set(food.id, food);
  }

  isFoodNearby(x: number, y: number): boolean {
    const radius = FOOD_SIZE * 2;
    for (const food of this.foods.values()) {
      if (Math.abs(food.x - x) < radius && Math.abs(food.y - y) < radius) {
        return true;
      }
    }
    return false;
  }

  checkCollision(snake: Snake, head: SnakeSegment): { hit: boolean; foodId?: string } {
    if (head.x < SEGMENT_SIZE / 2 || head.x > this.mapWidth - SEGMENT_SIZE / 2) {
      return { hit: true };
    }
    if (head.y < SEGMENT_SIZE / 2 || head.y > this.mapHeight - SEGMENT_SIZE / 2) {
      return { hit: true };
    }

    for (const food of this.foods.values()) {
      const dist = Math.sqrt((head.x - food.x) ** 2 + (head.y - food.y) ** 2);
      if (dist < (SEGMENT_SIZE + FOOD_SIZE) / 2) {
        return { hit: false, foodId: food.id };
      }
    }

    for (const otherSnake of this.snakes.values()) {
      if (!otherSnake.alive) continue;

      if (otherSnake.id === snake.id) {
        for (let i = 2; i < snake.segments.length; i++) {
          const seg = snake.segments[i];
          const dist = Math.sqrt((head.x - seg.x) ** 2 + (head.y - seg.y) ** 2);
          if (dist < SEGMENT_SIZE - 4) {
            return { hit: true };
          }
        }
      } else {
        for (let i = 0; i < otherSnake.segments.length; i++) {
          const seg = otherSnake.segments[i];
          const dist = Math.sqrt((head.x - seg.x) ** 2 + (head.y - seg.y) ** 2);
          if (dist < SEGMENT_SIZE - 2) {
            return { hit: true };
          }
        }
      }
    }

    return { hit: false };
  }

  killSnake(snake: Snake) {
    snake.alive = false;
    const now = Date.now();
    for (let i = 0; i < snake.segments.length; i++) {
      const seg = snake.segments[i];
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 50;
      this.deathParticles.push({
        id: uuidv4(),
        x: seg.x,
        y: seg.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: snake.color,
        size: SEGMENT_SIZE * (0.5 + Math.random() * 0.5),
        createdAt: now,
      });
    }
  }

  update(deltaTime: number) {
    const now = Date.now();

    if (now - this.lastFoodSpawn > FOOD_SPAWN_INTERVAL) {
      this.spawnFood();
      this.lastFoodSpawn = now;
    }

    if (now - this.lastTickTime > this.tickInterval) {
      this.lastTickTime = now;
      this.tick++;

      for (const snake of this.snakes.values()) {
        if (!snake.alive) continue;

        snake.direction = snake.nextDirection;
        const vec = DIRECTION_VECTORS[snake.direction];
        const step = SEGMENT_SIZE + SEGMENT_GAP;
        const head = snake.segments[0];
        const newHead: SnakeSegment = {
          x: head.x + vec.dx * step,
          y: head.y + vec.dy * step,
        };

        const collision = this.checkCollision(snake, newHead);

        if (collision.hit) {
          this.killSnake(snake);
          continue;
        }

        if (collision.foodId) {
          this.foods.delete(collision.foodId);
          snake.score += 10;
          snake.segments.unshift(newHead);
        } else {
          snake.segments.unshift(newHead);
          snake.segments.pop();
        }
      }
    }

    this.deathParticles = this.deathParticles.filter((p) => {
      const age = (now - p.createdAt) / 1000;
      if (age > 1) return false;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      return true;
    });
  }

  serialize() {
    return {
      snakes: Array.from(this.snakes.values()),
      foods: Array.from(this.foods.values()),
      deathParticles: this.deathParticles,
      tick: this.tick,
      tickInterval: this.tickInterval,
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      startedAt: this.startedAt,
    };
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const gameEngine = new ServerGameEngine();
const clients = new Map<string, Client>();

function broadcast(message: any) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

function sendTo(playerId: string, message: any) {
  const client = clients.get(playerId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  let playerId = uuidv4();

  console.log('New connection:', playerId);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'join') {
        if (message.data?.playerId && clients.has(message.data.playerId)) {
          playerId = message.data.playerId;
        }

        clients.set(playerId, { ws, playerId });
        gameEngine.addSnake(playerId);

        sendTo(playerId, {
          type: 'welcome',
          data: {
            playerId,
            serverTime: Date.now(),
          },
        });

        broadcast({
          type: 'player-joined',
          data: { playerId },
        });

        console.log('Player joined:', playerId, 'Total players:', clients.size);
      } else if (message.type === 'direction') {
        const { playerId: pid, direction } = message.data;
        if (pid && direction) {
          gameEngine.setDirection(pid, direction);
        }
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Connection closed:', playerId);
    clients.delete(playerId);
    gameEngine.removeSnake(playerId);
    broadcast({
      type: 'player-left',
      data: { playerId },
    });
    console.log('Player left:', playerId, 'Total players:', clients.size);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

let lastUpdateTime = Date.now();

setInterval(() => {
  const now = Date.now();
  const deltaTime = (now - lastUpdateTime) / 1000;
  lastUpdateTime = now;

  gameEngine.update(deltaTime);

  broadcast({
    type: 'state',
    data: gameEngine.serialize(),
  });
}, SERVER_TICK_INTERVAL);

setInterval(() => {
  for (let i = 0; i < 3; i++) {
    gameEngine.spawnFood();
  }
}, 3000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

for (let i = 0; i < 8; i++) {
  gameEngine.spawnFood();
}
