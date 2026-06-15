import { benchmarkAllScenes, generateDungeon, getWalkablePositions } from './src/dungeonGenerator';

try {
  const map = generateDungeon({ width: 15, height: 15, roomCount: 5, monsterCount: 3, seed: 42 });
  console.log('✓ 地图生成成功:');
  console.log('  尺寸:', map.width + 'x' + map.height);
  console.log('  房间数:', map.rooms.length);
  console.log('  可通行格子数:', getWalkablePositions(map).length);
  console.log('  种子:', map.seed);
  
  let allFloors = true;
  for (const room of map.rooms) {
    if (map.tiles[room.centerY][room.centerX] !== 1) {
      allFloors = false;
      break;
    }
  }
  console.log('  房间中心都是地板:', allFloors ? '✓' : '✗');
  
  let corridorCount = 0;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.tiles[y][x] === 2) corridorCount++;
    }
  }
  console.log('  走廊格子数:', corridorCount);
  
  console.log('');
  console.log('地图瓦片可视化:');
  for (let y = 0; y < map.height; y++) {
    let line = '';
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y][x];
      if (tile === 0) line += '█';
      else if (tile === 1) line += '·';
      else line += '░';
    }
    console.log('  ' + line);
  }
  
} catch (e) {
  console.error('生成失败:', (e as Error).message);
}

console.log('');
console.log('运行基准测试 (每个场景5次迭代)...');
const results = benchmarkAllScenes(5);
console.log('');
console.log('┌──────────┬──────┬────────┬────────┬────────┐');
console.log('│  场景    │ 房间 │ 平均ms │ 最大ms │ 最小ms │');
console.log('├──────────┼──────┼────────┼────────┼────────┤');
for (const r of results) {
  const size = (r.width + 'x' + r.height).padEnd(8);
  const room = String(r.roomCount).padStart(4);
  const avg = r.avg.toFixed(2).padStart(6);
  const max = r.max.toFixed(2).padStart(6);
  const min = r.min.toFixed(2).padStart(6);
  console.log('│ ' + size + ' │ ' + room + ' │ ' + avg + ' │ ' + max + ' │ ' + min + ' │');
}
console.log('└──────────┴──────┴────────┴────────┴────────┘');
