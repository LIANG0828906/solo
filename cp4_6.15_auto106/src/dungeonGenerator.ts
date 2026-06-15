/**
 * ============================================================
 * 文件: dungeonGenerator.ts
 * 职责: 程序化生成基于网格的Roguelike地下城地图
 * ============================================================
 *
 * 调用关系 & 数据流向:
 *
 *   [上层调用者]               [本文件输出]
 *       │                           │
 *       └── App.tsx ───────────────► generateDungeon(params)
 *           │  (GeneratorParams)    │
 *           │                       ▼
 *           │               返回 DungeonMap 对象
 *           │               (包含 tiles二维数组 + rooms + seed)
 *           │                       │
 *           │                       ├── tiles[][]: 供Canvas渲染瓦片
 *           │                       ├── rooms[]: 供放置玩家/怪物
 *           │                       └── seed: 供历史记录卡片还原地图
 *           │
 *           └── App.tsx ─────────────► getWalkablePositions(map)
 *                (DungeonMap)         │
 *                                    ▼
 *                           返回可通行坐标数组
 *                           (用于随机放置玩家和怪物)
 *
 * 核心算法:
 *   1. 种子随机数生成器 (SeededRandom) - 支持相同seed复现地图
 *   2. 中心向外扩散房间生成 - 第一个房间固定在中心，后续房间按极坐标向外扩散
 *   3. L型走廊连接算法 - 按距离排序后依次连接相邻房间
 * ============================================================
 */

import { TileType, Room, DungeonMap, GeneratorParams } from './types';

/**
 * 种子化随机数生成器 - 使用线性同余算法确保可复现
 * 相同的seed值将产生完全相同的随机数序列，用于历史记录还原地图
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  /** 返回 [0, 1) 范围内的伪随机浮点数 */
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0xffffffff;
  }

  /** 返回 [min, max] 范围内的伪随机整数 */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * 创建初始全墙地图
 * 所有格子初始化为 WALL，后续再挖出房间和走廊
 */
function createTiles(width: number, height: number): TileType[][] {
  const tiles: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = TileType.WALL;
    }
  }
  return tiles;
}

/**
 * 检测两个房间是否重叠（含外围padding）
 * padding=1 确保房间之间至少隔1格墙壁，防止直接连通
 */
function roomsOverlap(a: Room, b: Room, padding: number = 1): boolean {
  return (
    a.x - padding < b.x + b.width &&
    a.x + a.width + padding > b.x &&
    a.y - padding < b.y + b.height &&
    a.y + a.height + padding > b.y
  );
}

/**
 * 挖出房间区域 - 将房间范围内的所有格子设为FLOOR
 */
function carveRoom(tiles: TileType[][], room: Room): void {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      tiles[y][x] = TileType.FLOOR;
    }
  }
}

/**
 * 挖出水平走廊 - 仅当是墙壁时才设置为CORRIDOR
 * 这样不会覆盖已有的FLOOR（房间地板）
 */
function carveHCorridor(tiles: TileType[][], x1: number, x2: number, y: number): void {
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  for (let x = startX; x <= endX; x++) {
    if (tiles[y][x] === TileType.WALL) {
      tiles[y][x] = TileType.CORRIDOR;
    }
  }
}

/**
 * 挖出垂直走廊
 */
function carveVCorridor(tiles: TileType[][], y1: number, y2: number, x: number): void {
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);
  for (let y = startY; y <= endY; y++) {
    if (tiles[y][x] === TileType.WALL) {
      tiles[y][x] = TileType.CORRIDOR;
    }
  }
}

/**
 * 连接所有房间 - 按距离中心的远近排序后依次连接
 * 确保形成连通图，不会出现孤立房间
 */
function connectRooms(
  tiles: TileType[][],
  rooms: Room[],
  rng: SeededRandom
): void {
  for (let i = 1; i < rooms.length; i++) {
    const prev = rooms[i - 1];
    const curr = rooms[i];
    const horizFirst = rng.next() > 0.5;
    if (horizFirst) {
      carveHCorridor(tiles, prev.centerX, curr.centerX, prev.centerY);
      carveVCorridor(tiles, prev.centerY, curr.centerY, curr.centerX);
    } else {
      carveVCorridor(tiles, prev.centerY, curr.centerY, prev.centerX);
      carveHCorridor(tiles, prev.centerX, curr.centerX, curr.centerY);
    }
  }
}

/**
 * ============================================================
 * 核心导出函数: generateDungeon
 * ============================================================
 * 算法流程:
 *   1. 初始化全墙地图 + 种子随机数生成器
 *   2. 在地图中心放置第一个房间（锚点）
 *   3. 后续房间按极坐标(角度+距离)从中心向外扩散放置
 *      - 距离逐圈递增，保证从中心向外扩散的布局
 *      - 角度均匀分布，避免房间集中在一侧
 *   4. 按距离排序房间，用L型走廊依次连接
 *   5. 返回完整DungeonMap对象
 *
 * 性能: 20x20地图 < 50ms（O(roomCount * 尝试次数)）
 * ============================================================
 */
export function generateDungeon(params: GeneratorParams): DungeonMap {
  const {
    width,
    height,
    roomCount,
    seed = Math.floor(Math.random() * 1000000),
  } = params;

  const rng = new SeededRandom(seed);
  const tiles = createTiles(width, height);
  const rooms: Room[] = [];

  const maxAttempts = roomCount * 15;
  let attempts = 0;

  const minRoomSize = 3;
  const maxRoomSize = Math.max(3, Math.min(5, Math.floor(Math.min(width, height) / 4)));

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  const maxRadius = Math.floor(Math.min(width, height) / 2) - maxRoomSize;

  /**
   * 核心: 从中心向外扩散生成房间
   * 使用极坐标系，随房间数量增加:
   *   - radius (距离): 线性递增 from 1 → maxRadius
   *   - angle (角度): 均匀分布 + 随机扰动
   * 这样房间自然形成从中心向外扩散的螺旋/环形布局
   */
  while (rooms.length < roomCount && attempts < maxAttempts) {
    attempts++;

    const roomWidth = rng.nextInt(minRoomSize, maxRoomSize);
    const roomHeight = rng.nextInt(minRoomSize, maxRoomSize);

    let roomX: number;
    let roomY: number;

    if (rooms.length === 0) {
      /** 第一个房间: 精确固定在地图中心 */
      roomX = centerX - Math.floor(roomWidth / 2);
      roomY = centerY - Math.floor(roomHeight / 2);
    } else {
      /**
       * 后续房间: 从中心向外扩散
       * progress ∈ (0, 1]: 表示扩散进度
       * 距离中心越远的房间，progress越大
       */
      const progress = rooms.length / roomCount;

      /** 基础半径随progress递增，确保由内向外 */
      const baseRadius = 2 + progress * maxRadius;
      const radiusJitter = rng.nextInt(0, Math.max(1, Math.floor(maxRadius / 4)));
      const distance = Math.min(maxRadius, Math.floor(baseRadius) + radiusJitter);

      /** 黄金角分布，让房间均匀分布在360度圆周上 */
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const baseAngle = rooms.length * goldenAngle;
      const angleJitter = (rng.next() - 0.5) * 0.8;
      const angle = baseAngle + angleJitter;

      /** 极坐标 → 直角坐标 */
      const targetX = centerX + Math.floor(Math.cos(angle) * distance);
      const targetY = centerY + Math.floor(Math.sin(angle) * distance);

      /** 边界钳制，确保房间完全在地图内 */
      roomX = Math.max(1, Math.min(width - roomWidth - 1, targetX - Math.floor(roomWidth / 2)));
      roomY = Math.max(1, Math.min(height - roomHeight - 1, targetY - Math.floor(roomHeight / 2)));
    }

    const newRoom: Room = {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      centerX: roomX + Math.floor(roomWidth / 2),
      centerY: roomY + Math.floor(roomHeight / 2),
    };

    /** 重叠检测: 不与任何已有房间重叠 */
    let overlaps = false;
    for (const existing of rooms) {
      if (roomsOverlap(newRoom, existing, 1)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      rooms.push(newRoom);
      carveRoom(tiles, newRoom);
    }
  }

  /**
   * 按距离中心的远近排序，再依次连接
   * 保证走廊也是从中心向外延伸的树形结构
   */
  rooms.sort((a, b) => {
    const distA = Math.abs(a.centerX - centerX) + Math.abs(a.centerY - centerY);
    const distB = Math.abs(b.centerX - centerX) + Math.abs(b.centerY - centerY);
    return distA - distB;
  });

  connectRooms(tiles, rooms, rng);

  return {
    width,
    height,
    tiles,
    rooms,
    seed,
  };
}

/**
 * 提取所有可通行坐标
 * 数据流向: App.tsx调用 → 随机选择位置放置玩家/怪物
 */
export function getWalkablePositions(map: DungeonMap): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.tiles[y][x] !== TileType.WALL) {
        positions.push({ x, y });
      }
    }
  }
  return positions;
}

/**
 * 性能测试函数: 运行N次生成，统计平均耗时
 * 用于验证20x20地图生成时间 ≤ 50ms的性能约束
 */
export function benchmarkGeneration(iterations: number = 50): { avg: number; max: number; min: number } {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    generateDungeon({ width: 20, height: 20, roomCount: 8, monsterCount: 5, seed: i });
    times.push(performance.now() - start);
  }
  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    max: Math.max(...times),
    min: Math.min(...times),
  };
}
