import { TileType, Room } from './src/types';

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed >>> 0; }
  next(): number { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 0xffffffff; }
  nextInt(min: number, max: number): number { return Math.floor(this.next() * (max - min + 1)) + min; }
}

function roomsOverlap(a: Room, b: Room, padding: number = 1): boolean {
  return (
    a.x - padding < b.x + b.width &&
    a.x + a.width + padding > b.x &&
    a.y - padding < b.y + b.height &&
    a.y + a.height + padding > b.y
  );
}

const width = 15, height = 15, roomCount = 5, seed = 42;
const rng = new SeededRandom(seed);

const minRoomSize = 3;
const maxRoomSize = Math.max(3, Math.min(5, Math.floor(Math.min(width, height) / 4)));
const centerX = Math.floor(width / 2);
const centerY = Math.floor(height / 2);
const maxRadius = Math.floor(Math.min(width, height) / 2) - maxRoomSize;

console.log('配置:');
console.log('  minRoomSize:', minRoomSize);
console.log('  maxRoomSize:', maxRoomSize);
console.log('  center:', centerX, centerY);
console.log('  maxRadius:', maxRadius);
console.log('');

const rooms: Room[] = [];
const maxAttempts = roomCount * 15;
let attempts = 0;

while (rooms.length < roomCount && attempts < maxAttempts) {
  attempts++;
  
  const roomWidth = rng.nextInt(minRoomSize, maxRoomSize);
  const roomHeight = rng.nextInt(minRoomSize, maxRoomSize);
  
  let roomX: number, roomY: number;
  
  if (rooms.length === 0) {
    roomX = centerX - Math.floor(roomWidth / 2);
    roomY = centerY - Math.floor(roomHeight / 2);
  } else {
    const progress = rooms.length / roomCount;
    const baseRadius = 2 + progress * maxRadius;
    const radiusJitter = rng.nextInt(0, Math.max(1, Math.floor(maxRadius / 4)));
    const distance = Math.min(maxRadius, Math.floor(baseRadius) + radiusJitter);
    
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const baseAngle = rooms.length * goldenAngle;
    const angleJitter = (rng.next() - 0.5) * 0.8;
    const angle = baseAngle + angleJitter;
    
    const targetX = centerX + Math.floor(Math.cos(angle) * distance);
    const targetY = centerY + Math.floor(Math.sin(angle) * distance);
    
    roomX = Math.max(1, Math.min(width - roomWidth - 1, targetX - Math.floor(roomWidth / 2)));
    roomY = Math.max(1, Math.min(height - roomHeight - 1, targetY - Math.floor(roomHeight / 2)));
    
    console.log(`尝试 ${attempts}: 房间#${rooms.length + 1}`);
    console.log(`  progress=${progress.toFixed(2)}, baseRadius=${baseRadius.toFixed(2)}, distance=${distance}`);
    console.log(`  angle=${angle.toFixed(2)} rad (${(angle * 180 / Math.PI).toFixed(1)}°)`);
    console.log(`  target=(${targetX}, ${targetY}), pos=(${roomX}, ${roomY}), size=${roomWidth}x${roomHeight}`);
    console.log(`  覆盖范围: x=${roomX}~${roomX + roomWidth - 1}, y=${roomY}~${roomY + roomHeight - 1}`);
  }
  
  const newRoom: Room = {
    x: roomX, y: roomY, width: roomWidth, height: roomHeight,
    centerX: roomX + Math.floor(roomWidth / 2),
    centerY: roomY + Math.floor(roomHeight / 2),
  };
  
  let overlaps = false;
  for (const existing of rooms) {
    if (roomsOverlap(newRoom, existing, 1)) {
      console.log(`  与房间 (${existing.x},${existing.y}) 重叠，跳过`);
      overlaps = true;
      break;
    }
  }
  
  if (!overlaps) {
    console.log(`  ✓ 成功添加房间 #${rooms.length + 1}`);
    rooms.push(newRoom);
  }
}

console.log('');
console.log('最终: 生成了 ' + rooms.length + '/' + roomCount + ' 个房间，用了 ' + attempts + ' 次尝试');
