import { puzzleLevels } from './src/game/puzzleData';
import { BLOCK_SHAPES, Position } from './src/types';
import * as fs from 'fs';

function rotatePosition(pos: Position, rotation: number): Position {
  const r = ((rotation % 360) + 360) % 360;
  switch (r) {
    case 90: return { x: -pos.y, y: pos.x };
    case 180: return { x: -pos.x, y: -pos.y };
    case 270: return { x: pos.y, y: -pos.x };
    default: return { x: pos.x, y: pos.y };
  }
}

function getBlockCells(block: { type: keyof typeof BLOCK_SHAPES; position: Position; rotation: number }): Position[] {
  const shape = BLOCK_SHAPES[block.type];
  return shape.map((relPos) => {
    const rotated = rotatePosition(relPos, block.rotation);
    return {
      x: block.position.x + rotated.x,
      y: block.position.y + rotated.y,
    };
  });
}

function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

let output = '=== Puzzle Data Validation ===\n\n';
let hasErrors = false;

puzzleLevels.forEach((level, idx) => {
  output += `Level ${idx + 1}:\n`;
  
  const ta = level.targetArea;
  if (!ta || ta.x === undefined || ta.y === undefined || ta.width === undefined || ta.height === undefined) {
    output += `  [ERROR] targetArea incomplete: ${JSON.stringify(ta)}\n`;
    hasErrors = true;
  } else {
    output += `  [OK] targetArea: x=${ta.x}, y=${ta.y}, w=${ta.width}, h=${ta.height}\n`;
  }
  
  const obstacleSet = new Set(level.obstacles.map(posKey));
  output += `  Obstacles: [${level.obstacles.map(posKey).join(', ')}]\n`;
  
  level.blocks.forEach((block, bIdx) => {
    const cells = getBlockCells(block);
    const cellKeys = cells.map(posKey);
    output += `  Block ${bIdx + 1} (${block.type}, rot=${block.rotation}, pos=(${block.position.x},${block.position.y})): [${cellKeys.join(', ')}]\n`;
    
    const overlaps = cells.filter(c => obstacleSet.has(posKey(c)));
    if (overlaps.length > 0) {
      output += `    [ERROR] OVERLAP with obstacles: ${overlaps.map(posKey).join(', ')}\n`;
      hasErrors = true;
    }
    
    const outOfBounds = cells.filter(c => c.x < 0 || c.x >= level.gridSize || c.y < 0 || c.y >= level.gridSize);
    if (outOfBounds.length > 0) {
      output += `    [ERROR] OUT OF BOUNDS: ${outOfBounds.map(posKey).join(', ')}\n`;
      hasErrors = true;
    }
  });
  
  const allBlockCells: { blockIdx: number; cell: Position }[] = [];
  level.blocks.forEach((block, bIdx) => {
    const cells = getBlockCells(block);
    cells.forEach(c => {
      allBlockCells.push({ blockIdx: bIdx, cell: c });
    });
  });
  
  for (let i = 0; i < allBlockCells.length; i++) {
    for (let j = i + 1; j < allBlockCells.length; j++) {
      if (allBlockCells[i].blockIdx !== allBlockCells[j].blockIdx) {
        if (posKey(allBlockCells[i].cell) === posKey(allBlockCells[j].cell)) {
          output += `  [ERROR] Block ${allBlockCells[i].blockIdx + 1} overlaps Block ${allBlockCells[j].blockIdx + 1} at ${posKey(allBlockCells[i].cell)}\n`;
          hasErrors = true;
        }
      }
    }
  }
  
  output += '\n';
});

if (hasErrors) {
  output += '[FAILED] Found errors!\n';
} else {
  output += '[PASS] All levels valid!\n';
}

fs.writeFileSync('validation_output.txt', output, 'utf-8');
console.log(hasErrors ? 'Found errors - see validation_output.txt' : 'All valid!');
process.exit(hasErrors ? 1 : 0);
