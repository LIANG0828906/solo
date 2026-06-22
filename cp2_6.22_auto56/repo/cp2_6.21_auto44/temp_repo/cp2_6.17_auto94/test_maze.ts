import { MazeGenerator } from './src/engine/MazeGenerator';

const generator = new MazeGenerator();
const maze = generator.generateMaze(12, 12);

console.log('Maze dimensions:', maze.length, 'x', maze[0].length);

let treasureCount = 0;
let exitCount = 0;
let monsterSpawnCount = 0;
let wallCount = 0;
let floorCount = 0;

for (let y = 0; y < maze.length; y++) {
  let row = '';
  for (let x = 0; x < maze[y].length; x++) {
    const cell = maze[y][x];
    switch (cell) {
      case 'wall':
        wallCount++;
        row += '#';
        break;
      case 'floor':
        floorCount++;
        row += '.';
        break;
      case 'treasure':
        treasureCount++;
        row += 'T';
        break;
      case 'exit':
        exitCount++;
        row += 'E';
        break;
      case 'monsterSpawn':
        monsterSpawnCount++;
        row += 'M';
        break;
    }
  }
  console.log(row);
}

console.log('\nStats:');
console.log('Walls:', wallCount);
console.log('Floors:', floorCount);
console.log('Treasures:', treasureCount, '(need >= 1)');
console.log('Exits:', exitCount, '(need 1)');
console.log('Monster spawns:', monsterSpawnCount, '(need >= 3)');
console.log('Start cell (0,0):', maze[0][0]);
console.log('Exit cell (11,11):', maze[11][11]);

const isValid = treasureCount >= 1 && exitCount === 1 && monsterSpawnCount >= 3 && maze[0][0] === 'floor' && maze[11][11] === 'exit';
console.log('\nAll requirements met:', isValid);
