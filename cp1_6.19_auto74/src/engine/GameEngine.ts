import {
  GameState,
  Customer,
  Cashier,
  SelfCheckout,
  Shelf,
  Restocker,
  FloatText,
  Point,
  GRID_EMPTY,
  GRID_OBSTACLE,
  StatsPoint,
} from './GameState';
import { PathFinder } from './PathFinder';

const GRID_W = 28;
const GRID_H = 18;
const CELL = 40;
const CUSTOMER_SPEED = 80;
const RESTOCKER_SPEED = 90;
const MAX_CUSTOMERS = 80;
const QUEUE_LIMIT = 8;
const ANGRY_WAIT = 30;
const EMPTY_TIMEOUT = 20;
const RESTOCK_DURATION = 3;
const STATS_INTERVAL = 30;
const MAX_STATS_POINTS = 30;
const STOCK_DRAIN_RATE = 0.8;

export type StateUpdateCallback = (state: GameState) => void;
export type PlayerActions = {
  toggleCashier: (id: number) => void;
  toggleSelfCheckout: (id: number) => void;
  restockShelf: (id: number) => void;
  quickRestock: () => void;
};

export class GameEngine {
  private state: GameState;
  private pathFinder: PathFinder;
  private lastFrameTime: number = 0;
  private rafId: number | null = null;
  private running: boolean = false;
  private callback: StateUpdateCallback;
  private customerIdSeq: number = 1;
  private floatTextIdSeq: number = 1;
  private restockerIdSeq: number = 1;
  private customerMap: Map<number, Customer> = new Map();

  constructor(callback: StateUpdateCallback) {
    this.callback = callback;
    this.state = this.createInitialState();
    this.pathFinder = new PathFinder(this.state.grid);
    this.initEntities();
  }

  private createInitialState(): GameState {
    const grid: number[][] = [];
    for (let y = 0; y < GRID_H; y++) {
      grid.push(new Array(GRID_W).fill(GRID_EMPTY));
    }
    return {
      time: 0,
      customers: [],
      cashiers: [],
      selfCheckouts: [],
      shelves: [],
      restockers: [],
      revenue: 0,
      satisfaction: 100,
      avgWaitTime: 0,
      throughput: 0,
      totalWaitTime: 0,
      completedCount: 0,
      statsHistory: [],
      floatTexts: [],
      gridWidth: GRID_W,
      gridHeight: GRID_H,
      cellSize: CELL,
      entryPoint: { x: 0, y: 1 },
      exitPoint: { x: GRID_W - 1, y: 1 },
      warehousePoint: { x: 0, y: GRID_H - 2 },
      grid,
      lastCustomerSpawn: 0,
      nextSpawnDelay: 3,
      lastStatsSample: 0,
      revenueFlash: 0,
    };
  }

  private initEntities(): void {
    const { grid } = this.state;

    const shelfSpecs = [
      { gx: 2, gy: 3, w: 6, h: 2 },
      { gx: 11, gy: 3, w: 6, h: 2 },
      { gx: 2, gy: 7, w: 6, h: 2 },
      { gx: 11, gy: 7, w: 6, h: 2 },
      { gx: 20, gy: 3, w: 6, h: 2 },
      { gx: 20, gy: 7, w: 6, h: 2 },
    ];
    let shelfId = 1;
    for (const s of shelfSpecs) {
      for (let dy = 0; dy < s.h; dy++) {
        for (let dx = 0; dx < s.w; dx++) {
          const gy = s.gy + dy;
          const gx = s.gx + dx;
          if (gy >= 0 && gy < GRID_H && gx >= 0 && gx < GRID_W) {
            grid[gy][gx] = GRID_OBSTACLE;
          }
        }
      }
      this.state.shelves.push({
        id: shelfId++,
        gridX: s.gx,
        gridY: s.gy,
        width: s.w,
        height: s.h,
        stock: 100,
        emptyTimer: 0,
        restocking: false,
        restockProgress: 0,
      });
    }

    const cashierPositions = [
      { gx: 3, gy: 13 },
      { gx: 5, gy: 13 },
      { gx: 7, gy: 13 },
      { gx: 9, gy: 13 },
      { gx: 11, gy: 13 },
    ];
    for (let i = 0; i < cashierPositions.length; i++) {
      const p = cashierPositions[i];
      grid[p.gy][p.gx] = GRID_OBSTACLE;
      this.state.cashiers.push({
        id: i + 1,
        gridX: p.gx,
        gridY: p.gy,
        open: i < 3,
        rate: 0.5,
        customersServed: 0,
        queue: [],
        checkoutProgress: 0,
      });
    }

    const selfPositions = [
      { gx: 16, gy: 13 },
      { gx: 18, gy: 13 },
      { gx: 20, gy: 13 },
      { gx: 22, gy: 13 },
    ];
    for (let i = 0; i < selfPositions.length; i++) {
      const p = selfPositions[i];
      grid[p.gy][p.gx] = GRID_OBSTACLE;
      this.state.selfCheckouts.push({
        id: i + 1,
        gridX: p.gx,
        gridY: p.gy,
        enabled: i < 2,
        inUse: false,
        checkoutProgress: 0,
      });
    }

    this.state.restockers.push({
      id: this.restockerIdSeq++,
      x: this.state.warehousePoint.x * CELL + CELL / 2,
      y: this.state.warehousePoint.y * CELL + CELL / 2,
      prevX: this.state.warehousePoint.x * CELL + CELL / 2,
      prevY: this.state.warehousePoint.y * CELL + CELL / 2,
      path: [],
      pathIndex: 0,
      state: 'idle',
      restockTimer: 0,
      rotation: 0,
    });

    this.pathFinder.updateGrid(this.state.grid);
  }

  getActions(): PlayerActions {
    return {
      toggleCashier: (id) => this.toggleCashier(id),
      toggleSelfCheckout: (id) => this.toggleSelfCheckout(id),
      restockShelf: (id) => this.restockShelf(id),
      quickRestock: () => this.quickRestock(),
    };
  }

  private toggleCashier(id: number): void {
    const c = this.state.cashiers.find((x) => x.id === id);
    if (!c) return;
    c.open = !c.open;
    if (!c.open && c.queue.length > 0) {
      for (const cid of c.queue) {
        const cust = this.customerMap.get(cid);
        if (cust) {
          cust.checkoutTargetId = undefined;
          cust.checkoutTargetType = undefined;
          cust.state = 'choosing';
          cust.path = [];
          cust.pathIndex = 0;
        }
      }
      c.queue = [];
    }
  }

  private toggleSelfCheckout(id: number): void {
    const s = this.state.selfCheckouts.find((x) => x.id === id);
    if (!s) return;
    s.enabled = !s.enabled;
  }

  private restockShelf(id: number): void {
    const shelf = this.state.shelves.find((x) => x.id === id);
    if (!shelf || shelf.restocking || shelf.stock >= 100) return;
    const restocker = this.state.restockers.find((r) => r.state === 'idle');
    if (!restocker) return;

    const targetGX = shelf.gridX + Math.floor(shelf.width / 2);
    const targetGY = shelf.gridY - 1;
    const startGX = Math.floor(restocker.x / CELL);
    const startGY = Math.floor(restocker.y / CELL);
    const path = this.pathFinder.findPath(startGX, startGY, targetGX, targetGY);
    if (path.length === 0) return;

    restocker.path = path.map((p) => ({
      x: p.x * CELL + CELL / 2,
      y: p.y * CELL + CELL / 2,
    }));
    restocker.pathIndex = 0;
    restocker.targetShelfId = id;
    restocker.state = 'moving';
    shelf.restocking = true;
  }

  private quickRestock(): void {
    let lowest: Shelf | null = null;
    for (const s of this.state.shelves) {
      if (s.restocking) continue;
      if (!lowest || s.stock < lowest.stock) {
        lowest = s;
      }
    }
    if (lowest && lowest.stock < 80) {
      this.restockShelf(lowest.id);
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (): void => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 1 / 15);
    this.lastFrameTime = now;

    this.update(dt);
    this.callback({ ...this.state });

    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.state.time += dt;
    this.state.revenueFlash = Math.max(0, this.state.revenueFlash - dt);

    this.spawnCustomers(dt);
    this.updateCustomers(dt);
    this.updateCashiers(dt);
    this.updateSelfCheckouts(dt);
    this.updateShelves(dt);
    this.updateRestockers(dt);
    this.updateFloatTexts(dt);
    this.sampleStats();
  }

  private spawnCustomers(dt: number): void {
    if (this.state.customers.length >= MAX_CUSTOMERS) return;
    if (this.state.time - this.state.lastCustomerSpawn >= this.state.nextSpawnDelay) {
      this.state.lastCustomerSpawn = this.state.time;
      this.state.nextSpawnDelay = 2 + Math.random() * 3;

      const entry = this.state.entryPoint;
      const items = Math.floor(Math.random() * 15) + 1;

      const allEmpty = this.state.shelves.every((s) => s.stock <= 0 && s.emptyTimer >= EMPTY_TIMEOUT);

      const customer: Customer = {
        id: this.customerIdSeq++,
        x: entry.x * CELL + CELL / 2,
        y: entry.y * CELL + CELL / 2,
        prevX: entry.x * CELL + CELL / 2,
        prevY: entry.y * CELL + CELL / 2,
        path: [],
        pathIndex: 0,
        state: allEmpty ? 'leaving' : 'choosing',
        items,
        waitTime: 0,
        angry: false,
        rotation: 0,
      };

      if (customer.state === 'choosing') {
        this.state.customers.push(customer);
        this.customerMap.set(customer.id, customer);
        this.chooseCheckout(customer);
        if (allEmpty) {
          this.sendToExit(customer);
        }
      } else {
        this.state.customers.push(customer);
        this.customerMap.set(customer.id, customer);
        this.sendToExit(customer);
      }
    }
  }

  private chooseCheckout(customer: Customer): void {
    type Option = { type: 'cashier' | 'self'; id: number; score: number; queueX: number; queueY: number };
    const options: Option[] = [];

    for (const c of this.state.cashiers) {
      if (!c.open) continue;
      const qLen = c.queue.length + (c.currentCustomerId ? 1 : 0);
      if (qLen >= QUEUE_LIMIT) continue;
      const queueX = c.gridX * CELL + CELL / 2;
      const queueY = (c.gridY + 1 + qLen) * CELL + CELL / 2;
      const dist = this.dist(customer.x, customer.y, queueX, queueY);
      const score = dist + qLen * 40 + (1 / c.rate) * 5;
      options.push({ type: 'cashier', id: c.id, score, queueX, queueY });
    }

    for (const s of this.state.selfCheckouts) {
      if (!s.enabled) continue;
      if (s.inUse) continue;
      const queueX = s.gridX * CELL + CELL / 2;
      const queueY = (s.gridY + 1) * CELL + CELL / 2;
      const dist = this.dist(customer.x, customer.y, queueX, queueY);
      options.push({ type: 'self', id: s.id, score: dist, queueX, queueY });
    }

    if (options.length === 0) {
      customer.waitTime += 0.1;
      return;
    }

    options.sort((a, b) => a.score - b.score);
    const chosen = options[0];

    customer.checkoutTargetType = chosen.type;
    customer.checkoutTargetId = chosen.id;
    customer.state = 'walking';

    const startGX = Math.max(0, Math.min(GRID_W - 1, Math.floor(customer.x / CELL)));
    const startGY = Math.max(0, Math.min(GRID_H - 1, Math.floor(customer.y / CELL)));
    const endGX = Math.max(0, Math.min(GRID_W - 1, Math.floor(chosen.queueX / CELL)));
    const endGY = Math.max(0, Math.min(GRID_H - 1, Math.floor(chosen.queueY / CELL)));

    const path = this.pathFinder.findPath(startGX, startGY, endGX, endGY);
    customer.path = path.map((p) => ({
      x: p.x * CELL + CELL / 2,
      y: p.y * CELL + CELL / 2,
    }));
    customer.pathIndex = 0;

    if (chosen.type === 'cashier') {
      const cashier = this.state.cashiers.find((c) => c.id === chosen.id);
      if (cashier) {
        cashier.queue.push(customer.id);
        customer.queuePosition = cashier.queue.length - 1;
      }
    }
  }

  private dist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  private updateCustomers(dt: number): void {
    const toRemove: number[] = [];

    for (const c of this.state.customers) {
      c.prevX = c.x;
      c.prevY = c.y;

      switch (c.state) {
        case 'choosing':
          this.chooseCheckout(c);
          if (c.state === 'choosing') {
            c.waitTime += dt;
            if (c.waitTime > 20) {
              this.makeCustomerAngry(c, toRemove);
            }
          }
          break;

        case 'walking':
          this.moveAlongPath(c, CUSTOMER_SPEED, dt);
          if (c.pathIndex >= c.path.length) {
            c.state = 'queueing';
            c.waitTime = 0;
          }
          break;

        case 'queueing':
          c.waitTime += dt;
          this.checkQueueAdvance(c, dt);

          if (c.queuePosition !== undefined && c.queuePosition >= QUEUE_LIMIT) {
            c.angry = true;
          }
          if (c.waitTime > ANGRY_WAIT) {
            this.makeCustomerAngry(c, toRemove);
          }
          break;

        case 'checkout':
          break;

        case 'angry':
          this.moveAlongPath(c, CUSTOMER_SPEED, dt);
          if (c.pathIndex >= c.path.length) {
            toRemove.push(c.id);
          }
          break;

        case 'leaving':
          this.moveAlongPath(c, CUSTOMER_SPEED, dt);
          if (c.pathIndex >= c.path.length) {
            toRemove.push(c.id);
          }
          break;
      }
    }

    if (toRemove.length > 0) {
      this.state.customers = this.state.customers.filter((c) => !toRemove.includes(c.id));
      for (const id of toRemove) {
        this.customerMap.delete(id);
        for (const cashier of this.state.cashiers) {
          const idx = cashier.queue.indexOf(id);
          if (idx >= 0) cashier.queue.splice(idx, 1);
          for (let i = idx; i < cashier.queue.length; i++) {
            const cc = this.customerMap.get(cashier.queue[i]);
            if (cc) cc.queuePosition = i;
          }
        }
      }
    }
  }

  private moveAlongPath(entity: Customer | Restocker, speed: number, dt: number): void {
    if (entity.path.length === 0 || entity.pathIndex >= entity.path.length) return;

    let remaining = speed * dt;
    while (remaining > 0 && entity.pathIndex < entity.path.length) {
      const target = entity.path[entity.pathIndex];
      const dx = target.x - entity.x;
      const dy = target.y - entity.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.5) {
        entity.pathIndex++;
        continue;
      }
      if (d <= remaining) {
        entity.x = target.x;
        entity.y = target.y;
        remaining -= d;
        entity.pathIndex++;
      } else {
        const ratio = remaining / d;
        entity.x += dx * ratio;
        entity.y += dy * ratio;
        remaining = 0;
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          entity.rotation = Math.atan2(dy, dx) * (180 / Math.PI);
        }
      }
    }
  }

  private checkQueueAdvance(c: Customer, dt: number): void {
    if (c.checkoutTargetType === 'cashier' && c.checkoutTargetId !== undefined) {
      const cashier = this.state.cashiers.find((x) => x.id === c.checkoutTargetId);
      if (!cashier) return;

      const idx = cashier.queue.indexOf(c.id);
      if (idx < 0) return;
      c.queuePosition = idx;

      if (idx === 0 && !cashier.currentCustomerId) {
        cashier.currentCustomerId = c.id;
        cashier.checkoutProgress = 0;
        c.state = 'checkout';
        c.checkoutStartTime = this.state.time;
        cashier.queue.shift();
        for (let i = 0; i < cashier.queue.length; i++) {
          const cc = this.customerMap.get(cashier.queue[i]);
          if (cc) cc.queuePosition = i;
        }
        this.recalcQueuePositions(cashier);
      } else {
        if (idx > 0) {
          const prevCust = this.customerMap.get(cashier.queue[idx - 1]);
          if (prevCust) {
            const targetX = prevCust.x;
            const targetY = prevCust.y - CELL * 0.8;
            const dx = targetX - c.x;
            const dy = targetY - c.y;
            const d = Math.hypot(dx, dy);
            if (d > CELL * 0.55) {
              const ratio = Math.min(1, (CUSTOMER_SPEED * 0.6 * dt) / d);
              c.x += dx * ratio;
              c.y += dy * ratio;
              if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                c.rotation = Math.atan2(dy, dx) * (180 / Math.PI);
              }
            }
          }
        }
      }
    } else if (c.checkoutTargetType === 'self' && c.checkoutTargetId !== undefined) {
      const self = this.state.selfCheckouts.find((x) => x.id === c.checkoutTargetId);
      if (!self) return;
      if (!self.inUse) {
        self.inUse = true;
        self.currentCustomerId = c.id;
        self.checkoutProgress = 0;
        c.state = 'checkout';
        c.checkoutStartTime = this.state.time;
      }
    }
  }

  private recalcQueuePositions(cashier: Cashier): void {
    for (let i = 0; i < cashier.queue.length; i++) {
      const c = this.customerMap.get(cashier.queue[i]);
      if (!c || c.state !== 'queueing') continue;
      const targetX = cashier.gridX * CELL + CELL / 2;
      const targetY = (cashier.gridY + 2 + i) * CELL + CELL / 2;
      const startGX = Math.max(0, Math.min(GRID_W - 1, Math.floor(c.x / CELL)));
      const startGY = Math.max(0, Math.min(GRID_H - 1, Math.floor(c.y / CELL)));
      const endGX = Math.max(0, Math.min(GRID_W - 1, Math.floor(targetX / CELL)));
      const endGY = Math.max(0, Math.min(GRID_H - 1, Math.floor(targetY / CELL)));
      const path = this.pathFinder.findPath(startGX, startGY, endGX, endGY);
      if (path.length > 0) {
        c.path = path.map((p) => ({
          x: p.x * CELL + CELL / 2,
          y: p.y * CELL + CELL / 2,
        }));
        c.pathIndex = 0;
        c.state = 'walking';
      }
    }
  }

  private makeCustomerAngry(c: Customer, toRemove: number[]): void {
    this.state.satisfaction = Math.max(0, this.state.satisfaction - 2);
    c.state = 'angry';
    c.angry = true;

    if (c.checkoutTargetType === 'cashier' && c.checkoutTargetId !== undefined) {
      const cashier = this.state.cashiers.find((x) => x.id === c.checkoutTargetId);
      if (cashier) {
        const idx = cashier.queue.indexOf(c.id);
        if (idx >= 0) {
          cashier.queue.splice(idx, 1);
          for (let i = idx; i < cashier.queue.length; i++) {
            const cc = this.customerMap.get(cashier.queue[i]);
            if (cc) cc.queuePosition = i;
          }
        }
      }
    } else if (c.checkoutTargetType === 'self' && c.checkoutTargetId !== undefined) {
      const self = this.state.selfCheckouts.find((x) => x.id === c.checkoutTargetId);
      if (self && self.currentCustomerId === c.id) {
        self.currentCustomerId = undefined;
        self.inUse = false;
      }
    }
    this.sendToExit(c);
  }

  private sendToExit(c: Customer): void {
    const startGX = Math.max(0, Math.min(GRID_W - 1, Math.floor(c.x / CELL)));
    const startGY = Math.max(0, Math.min(GRID_H - 1, Math.floor(c.y / CELL)));
    const exit = this.state.exitPoint;
    const path = this.pathFinder.findPath(startGX, startGY, exit.x, exit.y);
    c.path = path.map((p) => ({
      x: p.x * CELL + CELL / 2,
      y: p.y * CELL + CELL / 2,
    }));
    c.pathIndex = 0;
  }

  private updateCashiers(dt: number): void {
    for (const cashier of this.state.cashiers) {
      if (!cashier.currentCustomerId) continue;
      const c = this.customerMap.get(cashier.currentCustomerId);
      if (!c) {
        cashier.currentCustomerId = undefined;
        cashier.checkoutProgress = 0;
        continue;
      }

      cashier.checkoutProgress += (cashier.rate * dt) / c.items;
      if (cashier.checkoutProgress >= 1) {
        this.completeCheckout(c, cashier.id, 'cashier');
        cashier.customersServed++;
        if (cashier.customersServed % 10 === 0) {
          cashier.rate = Math.min(1.5, cashier.rate + 0.05);
        }
        cashier.currentCustomerId = undefined;
        cashier.checkoutProgress = 0;
      }
    }
  }

  private updateSelfCheckouts(dt: number): void {
    for (const self of this.state.selfCheckouts) {
      if (!self.currentCustomerId) continue;
      const c = this.customerMap.get(self.currentCustomerId);
      if (!c) {
        self.currentCustomerId = undefined;
        self.inUse = false;
        self.checkoutProgress = 0;
        continue;
      }

      const selfRate = 0.6;
      self.checkoutProgress += (selfRate * dt) / c.items;
      if (self.checkoutProgress >= 1) {
        this.completeCheckout(c, self.id, 'self');
        self.currentCustomerId = undefined;
        self.inUse = false;
        self.checkoutProgress = 0;
      }
    }
  }

  private completeCheckout(c: Customer, targetId: number, type: 'cashier' | 'self'): void {
    const price = 5 + Math.random() * 15;
    const amount = Math.round(c.items * price * 100) / 100;
    this.state.revenue += amount;
    this.state.revenueFlash = 0.3;
    this.state.throughput++;
    this.state.completedCount++;
    this.state.totalWaitTime += c.waitTime;
    if (this.state.completedCount > 0) {
      this.state.avgWaitTime = this.state.totalWaitTime / this.state.completedCount;
    }

    this.drainStock(c.items);

    this.addFloatText(c.x, c.y - 20, `+¥${amount.toFixed(0)}`, '#FFD700');

    c.state = 'leaving';
    c.checkoutTargetId = undefined;
    c.checkoutTargetType = undefined;
    this.sendToExit(c);
  }

  private drainStock(items: number): void {
    const validShelves = this.state.shelves.filter((s) => s.stock > 0);
    if (validShelves.length === 0) return;
    const totalStock = validShelves.reduce((sum, s) => sum + s.stock, 0);
    if (totalStock === 0) return;

    let remaining = items * STOCK_DRAIN_RATE;
    for (const s of validShelves) {
      const take = Math.min(s.stock, (s.stock / totalStock) * remaining * 1.5);
      s.stock = Math.max(0, s.stock - take);
      remaining -= take;
      if (remaining <= 0) break;
    }
  }

  private updateShelves(dt: number): void {
    for (const s of this.state.shelves) {
      if (s.stock <= 0) {
        s.emptyTimer += dt;
        if (s.emptyTimer >= EMPTY_TIMEOUT && !s.restocking) {
          // shelf empty for too long - handled when customers arrive
        }
      } else {
        s.emptyTimer = 0;
      }
    }
  }

  private updateRestockers(dt: number): void {
    for (const r of this.state.restockers) {
      r.prevX = r.x;
      r.prevY = r.y;

      if (r.state === 'moving') {
        this.moveAlongPath(r, RESTOCKER_SPEED, dt);
        if (r.pathIndex >= r.path.length) {
          r.state = 'restocking';
          r.restockTimer = 0;
        }
      } else if (r.state === 'restocking') {
        r.restockTimer += dt;
        if (r.targetShelfId !== undefined) {
          const shelf = this.state.shelves.find((s) => s.id === r.targetShelfId);
          if (shelf) {
            shelf.restockProgress = Math.min(1, r.restockTimer / RESTOCK_DURATION);
            shelf.stock = Math.min(100, (r.restockTimer / RESTOCK_DURATION) * 100);
          }
        }
        if (r.restockTimer >= RESTOCK_DURATION) {
          if (r.targetShelfId !== undefined) {
            const shelf = this.state.shelves.find((s) => s.id === r.targetShelfId);
            if (shelf) {
              shelf.stock = 100;
              shelf.restocking = false;
              shelf.restockProgress = 0;
              shelf.emptyTimer = 0;
            }
          }
          r.targetShelfId = undefined;
          r.state = 'moving';

          const startGX = Math.floor(r.x / CELL);
          const startGY = Math.floor(r.y / CELL);
          const wh = this.state.warehousePoint;
          const path = this.pathFinder.findPath(startGX, startGY, wh.x, wh.y);
          r.path = path.map((p) => ({
            x: p.x * CELL + CELL / 2,
            y: p.y * CELL + CELL / 2,
          }));
          r.pathIndex = 0;
        }
      } else if (r.state === 'idle') {
        // nothing
      } else {
        // idle transition after returning to warehouse
        this.moveAlongPath(r, RESTOCKER_SPEED, dt);
        if (r.pathIndex >= r.path.length) {
          r.state = 'idle';
          r.path = [];
          r.pathIndex = 0;
        }
      }
    }
  }

  private addFloatText(x: number, y: number, text: string, color: string): void {
    const topRightX = GRID_W * CELL - 60;
    const topRightY = 80;
    const midX = (x + topRightX) / 2;
    const midY = (y + topRightY) / 2 - 40;
    this.state.floatTexts.push({
      id: this.floatTextIdSeq++,
      x,
      y,
      targetX: midX,
      targetY: midY,
      text,
      color,
      life: 1.5,
      maxLife: 1.5,
    });
    this.state.floatTexts.push({
      id: this.floatTextIdSeq++,
      x: midX,
      y: midY,
      targetX: topRightX,
      targetY: topRightY,
      text: '',
      color,
      life: 0.01,
      maxLife: 0.01,
    });
  }

  private updateFloatTexts(dt: number): void {
    for (const ft of this.state.floatTexts) {
      const progress = 1 - ft.life / ft.maxLife;
      ft.x = ft.x + (ft.targetX - ft.x) * Math.min(1, dt * 3);
      ft.y = ft.y + (ft.targetY - ft.y) * Math.min(1, dt * 3);
      ft.life -= dt;
    }
    this.state.floatTexts = this.state.floatTexts.filter((ft) => ft.life > 0);
  }

  private sampleStats(): void {
    if (this.state.time - this.state.lastStatsSample >= 1) {
      this.state.lastStatsSample = this.state.time;
      const point: StatsPoint = {
        time: this.state.time,
        avgWait: this.state.avgWaitTime,
        throughput: this.state.throughput,
        satisfaction: this.state.satisfaction,
      };
      this.state.statsHistory.push(point);
      if (this.state.statsHistory.length > MAX_STATS_POINTS) {
        this.state.statsHistory.shift();
      }
    }
  }
}
