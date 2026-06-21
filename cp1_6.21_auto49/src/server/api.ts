import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Resource {
  id: string;
  name: string;
  basePrice: number;
  currentPrice: number;
  priceChange: 'up' | 'down' | 'stable';
}

interface Planet {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  resources: Resource[];
  travelTime: Record<string, number>;
}

interface PlayerState {
  credits: number;
  cargoCapacity: number;
  cargoUsed: number;
  inventory: Record<string, number>;
  currentPlanet: string;
  energy: number;
}

interface GameLog {
  id: string;
  type: 'trade' | 'travel' | 'event';
  message: string;
  timestamp: number;
  icon: string;
}

interface RandomEventData {
  id: string;
  title: string;
  description: string;
  type: 'good' | 'bad';
  applyEffect: (player: PlayerState) => { player: PlayerState; message: string };
}

const app = express();
app.use(cors());
app.use(express.json());

const RESOURCE_DEFS = [
  { id: 'energy', name: '能源块', basePrice: 20 },
  { id: 'metal', name: '金属矿石', basePrice: 50 },
  { id: 'food', name: '食物补给', basePrice: 30 },
  { id: 'parts', name: '精密零件', basePrice: 80 }
];

const PLANET_DEFS = [
  { id: 'p1', name: '火星殖民地', color: '#FF6B6B', position: { x: 10, y: 40 } },
  { id: 'p2', name: '木卫二基地', color: '#4ECDC4', position: { x: 30, y: 20 } },
  { id: 'p3', name: '土星环站', color: '#45B7D1', position: { x: 50, y: 55 } },
  { id: 'p4', name: '海王星港', color: '#96CEB4', position: { x: 72, y: 30 } },
  { id: 'p5', name: '冥王星前哨', color: '#FFEAA7', position: { x: 90, y: 65 } }
];

function randomizePrice(basePrice: number): { price: number; change: 'up' | 'down' | 'stable' } {
  const fluctuation = 0.1 + Math.random() * 0.2;
  const direction = Math.random() > 0.5 ? 1 : -1;
  const price = Math.round(basePrice * (1 + direction * fluctuation));
  return {
    price,
    change: direction > 0 ? 'up' : direction < 0 ? 'down' : 'stable'
  };
}

function generateResources(planetId: string): Resource[] {
  const modifiers: Record<string, Record<string, number>> = {
    p1: { energy: 0.8, metal: 1.3, food: 1.1, parts: 1.2 },
    p2: { energy: 1.2, metal: 0.9, food: 0.7, parts: 1.4 },
    p3: { energy: 1.1, metal: 1.1, food: 1.3, parts: 0.8 },
    p4: { energy: 1.4, metal: 0.7, food: 1.2, parts: 1.1 },
    p5: { energy: 0.9, metal: 1.5, food: 1.4, parts: 0.6 }
  };
  const mod = modifiers[planetId] || {};
  return RESOURCE_DEFS.map(r => {
    const effectiveBase = Math.round(r.basePrice * (mod[r.id] || 1));
    const { price, change } = randomizePrice(effectiveBase);
    return {
      id: r.id,
      name: r.name,
      basePrice: effectiveBase,
      currentPrice: price,
      priceChange: change
    };
  });
}

function generatePlanets(): Planet[] {
  return PLANET_DEFS.map(p => ({
    ...p,
    resources: generateResources(p.id),
    travelTime: {
      p1: 2000,
      p2: 3500,
      p3: 5000,
      p4: 7000,
      p5: 9000
    }
  }));
}

let planets: Planet[] = generatePlanets();

let player: PlayerState = {
  credits: 1000,
  cargoCapacity: 50,
  cargoUsed: 0,
  inventory: { energy: 10 },
  currentPlanet: 'p1',
  energy: 10
};

player.cargoUsed = Object.values(player.inventory).reduce((a, b) => a + b, 0);

let gameLogs: GameLog[] = [];

const RANDOM_EVENTS: RandomEventData[] = [
  {
    id: 'pirate',
    title: '遭遇星际海盗！',
    description: '海盗抢走了你的部分货物',
    type: 'bad',
    applyEffect: (p) => {
      const keys = Object.keys(p.inventory).filter(k => p.inventory[k] > 0);
      if (keys.length === 0) return { player: p, message: '幸好你没有货物可抢' };
      const key = keys[Math.floor(Math.random() * keys.length)];
      const lost = Math.min(p.inventory[key], Math.ceil(Math.random() * 5) + 1);
      const newInv = { ...p.inventory, [key]: p.inventory[key] - lost };
      const newCargo = Object.values(newInv).reduce((a, b) => a + b, 0);
      return {
        player: { ...p, inventory: newInv, cargoUsed: newCargo },
        message: `海盗抢走了 ${lost} 单位 ${RESOURCE_DEFS.find(r => r.id === key)?.name}`
      };
    }
  },
  {
    id: 'treasure',
    title: '发现隐藏宝藏！',
    description: '你发现了一批稀有资源',
    type: 'good',
    applyEffect: (p) => {
      const bonus = 50 + Math.floor(Math.random() * 200);
      return {
        player: { ...p, credits: p.credits + bonus },
        message: `获得 ${bonus} 信用点`
      };
    }
  },
  {
    id: 'meteor',
    title: '流星雨袭击',
    description: '流星雨损坏了部分飞船设备',
    type: 'bad',
    applyEffect: (p) => {
      const loss = Math.min(p.credits, 50 + Math.floor(Math.random() * 100));
      return {
        player: { ...p, credits: p.credits - loss },
        message: `维修费用 ${loss} 信用点`
      };
    }
  },
  {
    id: 'merchant',
    title: '偶遇流浪商人',
    description: '他以优惠价格出售物资',
    type: 'good',
    applyEffect: (p) => {
      const space = p.cargoCapacity - p.cargoUsed;
      if (space <= 0) return { player: p, message: '货仓已满无法交易' };
      const amount = Math.min(space, Math.ceil(Math.random() * 5) + 1);
      const newInv = { ...p.inventory, food: (p.inventory.food || 0) + amount };
      return {
        player: { ...p, inventory: newInv, cargoUsed: p.cargoUsed + amount },
        message: `获赠 ${amount} 单位食物补给`
      };
    }
  },
  {
    id: 'blackmarket',
    title: '黑市交易机会',
    description: '一笔神秘的交易带来意外收入',
    type: 'good',
    applyEffect: (p) => {
      const bonus = 80 + Math.floor(Math.random() * 150);
      return {
        player: { ...p, credits: p.credits + bonus },
        message: `黑市交易获利 ${bonus} 信用点`
      };
    }
  }
];

function addLog(type: 'trade' | 'travel' | 'event', message: string, icon: string) {
  gameLogs.unshift({
    id: uuidv4(),
    type,
    message,
    timestamp: Date.now(),
    icon
  });
  if (gameLogs.length > 50) gameLogs = gameLogs.slice(0, 50);
}

function triggerRandomEvent(): { event: RandomEventData; result: { player: PlayerState; message: string } } | null {
  if (Math.random() > 0.35) return null;
  const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  const result = event.applyEffect(player);
  player = result.player;
  addLog('event', `${event.title}: ${result.message}`, '✨');
  return { event, result };
}

app.get('/api/player', (_req, res) => {
  res.json(player);
});

app.get('/api/planets', (_req, res) => {
  res.json(planets);
});

app.get('/api/planet/:id', (req, res) => {
  const planet = planets.find(p => p.id === req.params.id);
  if (!planet) return res.status(404).json({ error: 'Planet not found' });
  res.json(planet);
});

app.post('/api/trade', (req, res) => {
  const { resourceId, action, quantity } = req.body;
  const planet = planets.find(p => p.id === player.currentPlanet);
  if (!planet) return res.status(400).json({ error: 'Invalid planet' });
  const resource = planet.resources.find(r => r.id === resourceId);
  if (!resource) return res.status(400).json({ error: 'Resource not found' });

  const qty = Math.max(1, parseInt(quantity) || 1);
  const total = resource.currentPrice * qty;

  if (action === 'buy') {
    if (player.credits < total) return res.status(400).json({ error: '信用点不足' });
    const space = player.cargoCapacity - player.cargoUsed;
    if (space < qty) return res.status(400).json({ error: '货仓容量不足' });
    player.credits -= total;
    player.inventory[resourceId] = (player.inventory[resourceId] || 0) + qty;
    player.cargoUsed += qty;
    addLog('trade', `购买 ${qty} 单位 ${resource.name}，花费 ${total} 信用点`, '💰');
  } else if (action === 'sell') {
    if ((player.inventory[resourceId] || 0) < qty) return res.status(400).json({ error: '库存不足' });
    player.credits += total;
    player.inventory[resourceId] -= qty;
    player.cargoUsed -= qty;
    addLog('trade', `出售 ${qty} 单位 ${resource.name}，获得 ${total} 信用点`, '💰');
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const eventResult = triggerRandomEvent();
  res.json({ player, event: eventResult });
});

app.post('/api/travel', (req, res) => {
  const { targetPlanetId } = req.body;
  if (player.currentPlanet === targetPlanetId) {
    return res.status(400).json({ error: '已在目标星球' });
  }
  const targetPlanet = planets.find(p => p.id === targetPlanetId);
  if (!targetPlanet) return res.status(404).json({ error: 'Planet not found' });

  const ENERGY_COST = 5;
  if (player.energy < ENERGY_COST) {
    return res.status(400).json({ error: '能源不足，无法航行' });
  }

  player.energy -= ENERGY_COST;
  if (player.inventory.energy && player.inventory.energy > 0) {
    // do nothing, keep inventory energy
  }

  const travelTime = targetPlanet.travelTime[targetPlanetId] || 5000;
  player.currentPlanet = targetPlanetId;
  addLog('travel', `航行至 ${targetPlanet.name}`, '🔹');
  const eventResult = triggerRandomEvent();
  res.json({ player, travelTime, event: eventResult });
});

app.get('/api/events', (_req, res) => {
  res.json(gameLogs.slice(0, 10));
});

app.get('/api/refresh-prices', (_req, res) => {
  planets = planets.map(p => ({
    ...p,
    resources: generateResources(p.id)
  }));
  res.json(planets);
});

app.get('/api/energy/buy', (_req, res) => {
  const cost = 30;
  if (player.credits < cost) return res.status(400).json({ error: '信用点不足' });
  const space = player.cargoCapacity - player.cargoUsed;
  if (space < 1) return res.status(400).json({ error: '货仓容量不足' });
  player.credits -= cost;
  player.energy += 5;
  player.inventory.energy = (player.inventory.energy || 0) + 5;
  player.cargoUsed += 5;
  addLog('trade', '补充能源 5 单位，花费 30 信用点', '💰');
  res.json(player);
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`星际贸易 API 服务运行在 http://localhost:${PORT}`);
});
