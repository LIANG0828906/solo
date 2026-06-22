import { generateMaze, isWalkable, updateValveAngle, checkValveOpen, checkAllValvesOpen, movePlayer, canMoveDiagonal } from './engine.ts';

function bfs(maze, start) {
  const visited = new Set();
  const key = p => p.x+','+p.y;
  const queue = [start];
  visited.add(key(start));
  let count = 0;
  while (queue.length) {
    const p = queue.shift();
    count++;
    for (const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const np = {x:p.x+dx, y:p.y+dy};
      if (!visited.has(key(np)) && isWalkable(maze, np)) {
        visited.add(key(np));
        queue.push(np);
      }
    }
  }
  let totalFloor = 0;
  for (let y=0;y<maze.height;y++) for (let x=0;x<maze.width;x++) {
    if (maze.cells[y][x].type !== 'wall') totalFloor++;
  }
  return { count, totalFloor, connected: count === totalFloor };
}

const N = 10;
let maxTime = 0, allConnected = true, allFast = true;
for (let i=0;i<N;i++) {
  const t0 = performance.now();
  const maze = generateMaze(i+1);
  const t1 = performance.now();
  const elapsed = t1 - t0;
  if (elapsed > maxTime) maxTime = elapsed;
  if (elapsed >= 500) allFast = false;
  const result = bfs(maze, maze.startPos);
  if (!result.connected) allConnected = false;
  console.log(`Level ${i+1}: ${elapsed.toFixed(1)}ms, rooms=${maze.rooms.length}, valves=${maze.valves.length}, floor=${result.count}/${result.totalFloor} connected=${result.connected}`);
}
console.log(`\nMax time: ${maxTime.toFixed(1)}ms, all <500ms: ${allFast}, all connected: ${allConnected}`);

const v = { id:'t', pos:{x:0,y:0}, currentAngle:0, targetAngle:45, isOpen:false, connectedPipeIds:[] };
const v1 = updateValveAngle(v, 45);
console.log('Valve test: open@45 =', checkValveOpen(v1), ', allOpen=', checkAllValvesOpen([v1]));
