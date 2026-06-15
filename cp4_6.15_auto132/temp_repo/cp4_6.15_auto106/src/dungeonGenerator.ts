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
 *   3. A*寻路走廊连接算法 - 按距离排序后依次连接相邻房间，考虑墙壁阻挡、优先直线、避免穿过已有房间
 * ============================================================
 */

import { TileType, Room, DungeonMap, GeneratorParams } from './types';

/**
 * 种子化随机数生成器 - 使用线性同余算法确保可复现
 * 相同的seed值将产生完全相同的随机数序列，用于历史记录还原地图
 */
class SeededRandom {
  private seed: number;

  /**
   * 创建种子化随机数生成器实例
   * @param seed - 用于初始化随机数序列的种子值，将被转换为无符号32位整数
   * @example
   * const rng = new SeededRandom(12345);
   */
  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  /**
   * 返回 [0, 1) 范围内的伪随机浮点数
   * @returns {number} 介于0（包含）和1（不包含）之间的浮点数
   * @example
   * const value = rng.next(); // 例如: 0.72945123
   */
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0xffffffff;
  }

  /**
   * 返回 [min, max] 范围内的伪随机整数
   * @param min - 最小值（包含）
   * @param max - 最大值（包含）
   * @returns {number} 介于min和max之间的整数
   * @throws {RangeError} 当 min > max 时抛出范围错误
   * @example
   * const num = rng.nextInt(1, 10); // 例如: 7
   */
  nextInt(min: number, max: number): number {
    if (min > max) {
      throw new RangeError(`SeededRandom.nextInt: min (${min}) 不能大于 max (${max})`);
    }
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * 创建初始全墙地图
 * 所有格子初始化为 WALL，后续再挖出房间和走廊
 * @param width - 地图宽度（格子数），必须大于0
 * @param height - 地图高度（格子数），必须大于0
 * @returns {TileType[][]} 二维瓦片数组，所有元素初始化为 TileType.WALL
 * @throws {RangeError} 当 width 或 height 小于等于 0 时抛出范围错误
 * @example
 * const tiles = createTiles(20, 20);
 */
function createTiles(width: number, height: number): TileType[][] {
  if (width <= 0 || height <= 0) {
    throw new RangeError(`createTiles: width (${width}) 和 height (${height}) 必须大于 0`);
  }
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
 * @param a - 第一个房间对象
 * @param b - 第二个房间对象
 * @param padding - 房间外围的额外检测边距，默认为1，确保房间间有墙壁间隔
 * @returns {boolean} 如果两个房间（含padding）存在重叠则返回true，否则返回false
 * @throws {TypeError} 当 a 或 b 为 null/undefined 时抛出类型错误
 * @example
 * const overlap = roomsOverlap(room1, room2, 1);
 */
function roomsOverlap(a: Room, b: Room, padding: number = 1): boolean {
  if (!a || !b) {
    throw new TypeError('roomsOverlap: 参数 a 和 b 不能为 null 或 undefined');
  }
  return (
    a.x - padding < b.x + b.width &&
    a.x + a.width + padding > b.x &&
    a.y - padding < b.y + b.height &&
    a.y + a.height + padding > b.y
  );
}

/**
 * 挖出房间区域 - 将房间范围内的所有格子设为FLOOR
 * @param tiles - 二维瓦片数组，将被修改
 * @param room - 要挖出的房间对象，定义了位置和尺寸
 * @throws {TypeError} 当 tiles 或 room 为 null/undefined 时抛出类型错误
 * @throws {RangeError} 当房间坐标超出瓦片数组边界时抛出范围错误
 * @example
 * carveRoom(tiles, { x: 5, y: 5, width: 4, height: 3, centerX: 7, centerY: 6 });
 */
function carveRoom(tiles: TileType[][], room: Room): void {
  if (!tiles || !room) {
    throw new TypeError('carveRoom: 参数 tiles 和 room 不能为 null 或 undefined');
  }
  if (room.y < 0 || room.y + room.height > tiles.length ||
      room.x < 0 || room.x + room.width > tiles[0].length) {
    throw new RangeError('carveRoom: 房间坐标超出瓦片数组边界');
  }
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      tiles[y][x] = TileType.FLOOR;
    }
  }
}

/**
 * A* 寻路算法节点接口
 * 用于存储寻路过程中每个格子的代价信息
 */
interface AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

/**
 * 曼哈顿距离启发函数 - 用于 A* 算法估算从当前点到目标点的距离
 * 优先直线移动，符合网格寻路的最优启发
 * @param x1 - 起点x坐标
 * @param y1 - 起点y坐标
 * @param x2 - 终点x坐标
 * @param y2 - 终点y坐标
 * @returns {number} 曼哈顿距离值（横向+纵向距离之和）
 * @example
 * const dist = manhattanDistance(0, 0, 5, 3); // 返回 8
 */
function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * 检查坐标是否在地图范围内
 * @param x - 要检查的x坐标
 * @param y - 要检查的y坐标
 * @param width - 地图宽度
 * @param height - 地图高度
 * @returns {boolean} 如果坐标在地图范围内返回true，否则返回false
 * @example
 * const inside = isInBounds(5, 5, 20, 20); // true
 */
function isInBounds(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && x < width && y >= 0 && y < height;
}

/**
 * 检查坐标是否属于已有房间（FLOOR类型），用于避免走廊穿过房间
 * @param tiles - 二维瓦片数组
 * @param x - 要检查的x坐标
 * @param y - 要检查的y坐标
 * @param startX - 起点x坐标（房间中心，允许为FLOOR）
 * @param startY - 起点y坐标
 * @param endX - 终点x坐标（房间中心，允许为FLOOR）
 * @param endY - 终点y坐标
 * @returns {boolean} 如果是需要避开的房间地板返回true，否则返回false
 */
function isRoomFloor(
  tiles: TileType[][],
  x: number,
  y: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): boolean {
  if ((x === startX && y === startY) || (x === endX && y === endY)) {
    return false;
  }
  return tiles[y][x] === TileType.FLOOR;
}

/**
 * A* 寻路算法 - 在墙壁间寻找最优路径连接两个房间中心
 * 考虑墙壁阻挡，优先直线移动，避免穿过已有房间
 * @param tiles - 二维瓦片数组，用于判断地形
 * @param startX - 起点x坐标（房间中心）
 * @param startY - 起点y坐标
 * @param endX - 终点x坐标（房间中心）
 * @param endY - 终点y坐标
 * @param width - 地图宽度
 * @param height - 地图高度
 * @returns {Array<{ x: number; y: number }> | null} 路径坐标数组（从起点到终点，包含两端），无法找到路径时返回null
 * @throws {RangeError} 当起点或终点超出地图边界时抛出范围错误
 * @example
 * const path = findPathAStar(tiles, 5, 5, 15, 10, 20, 20);
 */
function findPathAStar(
  tiles: TileType[][],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  width: number,
  height: number
): Array<{ x: number; y: number }> | null {
  if (!isInBounds(startX, startY, width, height)) {
    throw new RangeError(`findPathAStar: 起点 (${startX}, ${startY}) 超出地图边界`);
  }
  if (!isInBounds(endX, endY, width, height)) {
    throw new RangeError(`findPathAStar: 终点 (${endX}, ${endY}) 超出地图边界`);
  }

  if (startX === endX && startY === endY) {
    return [{ x: startX, y: startY }];
  }

  const openList: AStarNode[] = [];
  const closedSet = new Set<string>();
  const nodeMap = new Map<string, AStarNode>();

  const startNode: AStarNode = {
    x: startX,
    y: startY,
    g: 0,
    h: manhattanDistance(startX, startY, endX, endY),
    f: manhattanDistance(startX, startY, endX, endY),
    parent: null,
  };

  openList.push(startNode);
  nodeMap.set(`${startX},${startY}`, startNode);

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;
    const currentKey = `${current.x},${current.y}`;

    if (current.x === endX && current.y === endY) {
      const path: Array<{ x: number; y: number }> = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(currentKey);

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const neighborKey = `${nx},${ny}`;

      if (!isInBounds(nx, ny, width, height)) {
        continue;
      }

      if (closedSet.has(neighborKey)) {
        continue;
      }

      if (isRoomFloor(tiles, nx, ny, startX, startY, endX, endY)) {
        continue;
      }

      const movementCost = current.g + 1;
      const existingNode = nodeMap.get(neighborKey);

      if (!existingNode || movementCost < existingNode.g) {
        const h = manhattanDistance(nx, ny, endX, endY);
        const newNode: AStarNode = {
          x: nx,
          y: ny,
          g: movementCost,
          h: h,
          f: movementCost + h,
          parent: current,
        };

        nodeMap.set(neighborKey, newNode);

        if (!existingNode) {
          openList.push(newNode);
        } else {
          const index = openList.indexOf(existingNode);
          if (index !== -1) {
            openList[index] = newNode;
          }
        }
      }
    }
  }

  return null;
}

/**
 * 挖出 A* 寻路得到的走廊路径
 * 仅将墙壁设置为走廊，不覆盖已有的地板或走廊
 * @param tiles - 二维瓦片数组，将被修改
 * @param path - 路径坐标数组
 * @throws {TypeError} 当 tiles 或 path 为 null/undefined 时抛出类型错误
 * @example
 * carveCorridorPath(tiles, path);
 */
function carveCorridorPath(tiles: TileType[][], path: Array<{ x: number; y: number }>): void {
  if (!tiles || !path) {
    throw new TypeError('carveCorridorPath: 参数 tiles 和 path 不能为 null 或 undefined');
  }
  for (const point of path) {
    if (point.y >= 0 && point.y < tiles.length &&
        point.x >= 0 && point.x < tiles[0].length &&
        tiles[point.y][point.x] === TileType.WALL) {
      tiles[point.y][point.x] = TileType.CORRIDOR;
    }
  }
}

/**
 * 连接所有房间 - 按距离中心的远近排序后依次用A*算法连接相邻房间
 * 确保形成连通图，不会出现孤立房间。A*算法会考虑墙壁阻挡、优先直线、避免穿过已有房间
 * @param tiles - 二维瓦片数组，将被修改以添加走廊
 * @param rooms - 房间数组，将按距离中心排序
 * @param width - 地图宽度
 * @param height - 地图高度
 * @param rng - 种子化随机数生成器实例（保留参数以兼容原有接口，当前A*算法不使用随机）
 * @throws {TypeError} 当 tiles、rooms 或 rng 为 null/undefined 时抛出类型错误
 * @throws {Error} 当A*寻路失败无法连接房间时抛出错误
 * @example
 * connectRooms(tiles, rooms, 20, 20, rng);
 */
function connectRooms(
  tiles: TileType[][],
  rooms: Room[],
  width: number,
  height: number,
  rng: SeededRandom
): void {
  if (!tiles || !rooms || !rng) {
    throw new TypeError('connectRooms: 参数 tiles、rooms 和 rng 不能为 null 或 undefined');
  }
  if (rooms.length < 2) {
    return;
  }

  for (let i = 1; i < rooms.length; i++) {
    const prev = rooms[i - 1];
    const curr = rooms[i];

    const path = findPathAStar(
      tiles,
      prev.centerX,
      prev.centerY,
      curr.centerX,
      curr.centerY,
      width,
      height
    );

    if (!path) {
      throw new Error(`connectRooms: A* 寻路失败，无法连接房间 (${prev.centerX}, ${prev.centerY}) 和 (${curr.centerX}, ${curr.centerY})`);
    }

    carveCorridorPath(tiles, path);
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
 *   4. 按距离排序房间，用A*寻路算法依次连接相邻房间
 *   5. 返回完整DungeonMap对象
 *
 * 性能: 20x20地图 < 50ms（O(roomCount * 尝试次数 + roomCount * A*寻路开销)）
 * ============================================================
 * @param params - 生成器参数对象
 * @param params.width - 地图宽度（格子数）
 * @param params.height - 地图高度（格子数）
 * @param params.roomCount - 要生成的房间数量
 * @param params.monsterCount - 怪物数量（保留参数，本函数不直接使用）
 * @param params.seed - 可选的随机种子，用于复现地图，默认随机生成
 * @returns {DungeonMap} 完整的地下城地图对象，包含瓦片、房间列表和种子
 * @throws {TypeError} 当 params 为 null/undefined 时抛出类型错误
 * @throws {RangeError} 当 width、height 或 roomCount 小于等于 0 时抛出范围错误
 * @throws {Error} 当无法在最大尝试次数内生成足够房间或A*寻路失败时抛出错误
 * @example
 * const dungeon = generateDungeon({
 *   width: 20,
 *   height: 20,
 *   roomCount: 8,
 *   monsterCount: 5,
 *   seed: 12345
 * });
 */
export function generateDungeon(params: GeneratorParams): DungeonMap {
  if (!params) {
    throw new TypeError('generateDungeon: 参数 params 不能为 null 或 undefined');
  }

  const {
    width,
    height,
    roomCount,
    seed = Math.floor(Math.random() * 1000000),
  } = params;

  if (width <= 0 || height <= 0) {
    throw new RangeError(`generateDungeon: width (${width}) 和 height (${height}) 必须大于 0`);
  }
  if (roomCount <= 0) {
    throw new RangeError(`generateDungeon: roomCount (${roomCount}) 必须大于 0`);
  }

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

  if (rooms.length < roomCount) {
    throw new Error(`generateDungeon: 在 ${maxAttempts} 次尝试后仅生成了 ${rooms.length}/${roomCount} 个房间，请尝试减小房间数量或增大地图尺寸`);
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

  connectRooms(tiles, rooms, width, height, rng);

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
 * @param map - 地下城地图对象
 * @returns {Array<{ x: number; y: number }>} 所有可通行（非墙壁）坐标的数组
 * @throws {TypeError} 当 map 为 null/undefined 时抛出类型错误
 * @example
 * const positions = getWalkablePositions(dungeon);
 * const randomPos = positions[Math.floor(Math.random() * positions.length)];
 */
export function getWalkablePositions(map: DungeonMap): Array<{ x: number; y: number }> {
  if (!map) {
    throw new TypeError('getWalkablePositions: 参数 map 不能为 null 或 undefined');
  }
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
 * @param iterations - 测试迭代次数，默认为50次
 * @returns {{ avg: number; max: number; min: number }} 统计结果，包含平均、最大、最小耗时（毫秒）
 * @throws {RangeError} 当 iterations 小于等于 0 时抛出范围错误
 * @example
 * const result = benchmarkGeneration(100);
 * console.log(`平均耗时: ${result.avg.toFixed(2)}ms`);
 */
export function benchmarkGeneration(iterations: number = 50): { avg: number; max: number; min: number } {
  if (iterations <= 0) {
    throw new RangeError(`benchmarkGeneration: iterations (${iterations}) 必须大于 0`);
  }
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

/**
 * 单场景性能基准测试结果接口
 */
interface BenchmarkResult {
  width: number;
  height: number;
  roomCount: number;
  avg: number;
  max: number;
  min: number;
  totalTiles: number;
  iterations: number;
}

/**
 * 多场景性能基准测试函数: 测试9种不同场景的生成性能
 * 场景组合: (10x10 / 15x15 / 20x20) × (3房 / 5房 / 8房)
 * 每种场景运行指定迭代次数，统计平均、最大、最小耗时
 * @param iterations - 每种场景的测试迭代次数，默认为30次
 * @returns {BenchmarkResult[]} 9种场景的测试结果数组
 * @throws {RangeError} 当 iterations 小于等于 0 时抛出范围错误
 * @example
 * const results = benchmarkAllScenes(50);
 * results.forEach(r => {
 *   console.log(`${r.width}x${r.height} ${r.roomCount}房: 平均${r.avg.toFixed(2)}ms`);
 * });
 */
export function benchmarkAllScenes(iterations: number = 30): BenchmarkResult[] {
  if (iterations <= 0) {
    throw new RangeError(`benchmarkAllScenes: iterations (${iterations}) 必须大于 0`);
  }

  const sizes = [
    { width: 10, height: 10 },
    { width: 15, height: 15 },
    { width: 20, height: 20 },
  ];

  const roomCounts = [3, 5, 8];

  const results: BenchmarkResult[] = [];

  for (const size of sizes) {
    for (const roomCount of roomCounts) {
      const times: number[] = [];
      let seedOffset = 0;

      for (let i = 0; i < iterations; i++) {
        let success = false;
        let attempts = 0;
        const maxAttemptsPerIteration = 5;

        while (!success && attempts < maxAttemptsPerIteration) {
          try {
            const start = performance.now();
            generateDungeon({
              width: size.width,
              height: size.height,
              roomCount: roomCount,
              monsterCount: Math.max(1, Math.floor(roomCount / 2)),
              seed: seedOffset++
            });
            times.push(performance.now() - start);
            success = true;
          } catch (e) {
            attempts++;
          }
        }

        if (!success) {
          console.warn(`benchmarkAllScenes: 场景 ${size.width}x${size.height} ${roomCount}房 在迭代 ${i} 连续 ${maxAttemptsPerIteration} 次失败，跳过`);
        }
      }

      if (times.length > 0) {
        results.push({
          width: size.width,
          height: size.height,
          roomCount: roomCount,
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          max: Math.max(...times),
          min: Math.min(...times),
          totalTiles: size.width * size.height,
          iterations: times.length,
        });
      }
    }
  }

  return results;
}
