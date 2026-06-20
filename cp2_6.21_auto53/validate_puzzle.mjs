import { puzzleLevels } from './src/game/puzzleData.ts';

const BLOCK_SHAPES = {
  I4: [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
  ],
  L4: [
    { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 },
  ],
  T4: [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 },
  ],
  Z4: [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 },
  ],
  SQUARE: [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 },
  ],
  I3: [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
  ],
  L3: [
    { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 },
  ],
};

function rotatePosition(pos, rotation) {
  const r = ((rotation % 360) + 360) % 360;
  switch (r) {
    case 90: return { x: -pos.y, y: pos.x };
    case 180: return { x: -pos.x, y: -pos.y };
    case 270: return { x: pos.y, y: -pos.x };
    default: return { x: pos.x, y: pos.y };
  }
}

function getBlockCells(block) {
  const shape = BLOCK_SHAPES[block.type];
  return shape.map((relPos) => {
    const rotated = rotatePosition(relPos, block.rotation);
    return {
      x: block.position.x + rotated.x,
      y: block.position.y + rotated.y,
    };
  });
}

function posKey(pos) {
  return `${pos.x},${pos.y}`;
}

console.log('=== Puzzle Data Validation ===\n');

puzzleLevels.forEach((level, idx) => {
  console.log(`Level ${idx + 1}:`);
  
  // Check targetArea
  const ta = level.targetArea;
  if (!ta || ta.x === undefined || ta.y === undefined || ta.width === undefined || ta.height === undefined) {
    console.log(`  ❌ targetArea incomplete: ${JSON.stringify(ta)}`);
  } else {
    console.log(`  ✅ targetArea: x=${ta.x}, y=${ta.y}, w=${ta.width}, h=${ta.height}`);
  }
  
  // Check obstacles vs blocks overlap
  const obstacleSet = new Set(level.obstacles.map(posKey));
  console.log(`  Obstacles: ${level.obstacles.map(posKey).join(', ')}`);
  
  level.blocks.forEach((block, bIdx) => {
    const cells = getBlockCells(block);
    const cellKeys = cells.map(posKey);
    console.log(`  Block ${bIdx + 1} (${block.type}, rot=${block.rotation}, pos=(${block.position.x},${block.position.y})): cells=[${cellKeys.join(', ')}]`);
    
    const overlaps = cells.filter(c => obstacleSet.has(posKey(c)));
    if (overlaps.length > 0) {
      console.log(`    ❌ OVERLAP with obstacles: ${overlaps.map(posKey).join(', ')}`);
    }
    
    // Also check if cells are in bounds
    const outOfBounds = cells.filter(c => c.x < 0 || c.x >= level.gridSize || c.y < 0 || c.y >= level.gridSize);
    if (outOfBounds.length > 0) {
      console.log(`    ⚠️  OUT OF BOUNDS: ${outOfBounds.map(posKey).join(', ')}`);
    }
  });
  
  // Check block vs block overlap
  const allBlockCells = [];
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
          console.log(`  ❌ Block ${allBlockCells[i].blockIdx + 1} overlaps Block ${allBlockCells[j].blockIdx + 1} at ${posKey(allBlockCells[i].cell)}`);
        }
      }
    }
  }
  
  console.log('');
});
