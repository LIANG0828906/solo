import {
  GameEngine,
  GameAction,
  RuneType,
  SpellType,
  GRID_COLS,
  GRID_ROWS,
  getNeighbors,
  getPlacementRows,
  getPlayerTerritory,
  LINE_DIRECTIONS,
} from '../engine/gameEngine';

const memoryTable: { q: number; r: number; turn: number }[] = [];

function runeToSpell(rune: RuneType): SpellType {
  switch (rune) {
    case RuneType.Fire: return SpellType.Fireball;
    case RuneType.Water: return SpellType.Frost;
    case RuneType.Wood: return SpellType.Vine;
  }
}

function canFormLineAfterMove(engine: GameEngine, fromQ: number, fromR: number, toQ: number, toR: number): boolean {
  const grid = engine.grid;
  const cell = grid[fromR][fromQ];
  if (!cell.rune) return false;

  const tempRune = cell.rune;
  const tempOwner = cell.owner;

  grid[fromR][fromQ].rune = null;
  grid[fromR][fromQ].owner = null;
  grid[toR][toQ].rune = tempRune;
  grid[toR][toQ].owner = tempOwner;
  grid[toR][toQ].cooldown = 0;

  const result = checkLineAt(grid, toQ, toR, tempRune);

  grid[fromR][fromQ].rune = tempRune;
  grid[fromR][fromQ].owner = tempOwner;
  grid[toR][toQ].rune = null;
  grid[toR][toQ].owner = null;

  return result;
}

function canFormLineAfterPlace(engine: GameEngine, q: number, r: number, rune: RuneType): boolean {
  const grid = engine.grid;
  if (grid[r][q].rune !== null) return false;

  grid[r][q].rune = rune;
  grid[r][q].owner = 'ai';
  grid[r][q].cooldown = 0;

  const result = checkLineAt(grid, q, r, rune);

  grid[r][q].rune = null;
  grid[r][q].owner = null;

  return result;
}

function checkLineAt(grid: { rune: RuneType | null; cooldown: number }[][], q: number, r: number, rune: RuneType): boolean {
  for (const dir of LINE_DIRECTIONS) {
    let count = 1;

    let cq = q + dir.dq;
    let cr = r + dir.dr;
    while (cq >= 0 && cq < GRID_COLS && cr >= 0 && cr < GRID_ROWS) {
      if (grid[cr][cq].rune !== rune || grid[cr][cq].cooldown > 0) break;
      count++;
      cq += dir.dq;
      cr += dir.dr;
    }

    cq = q - dir.dq;
    cr = r - dir.dr;
    while (cq >= 0 && cq < GRID_COLS && cr >= 0 && cr < GRID_ROWS) {
      if (grid[cr][cq].rune !== rune || grid[cr][cq].cooldown > 0) break;
      count++;
      cq -= dir.dq;
      cr -= dir.dr;
    }

    if (count >= 3) return true;
  }
  return false;
}

function countLinePotential(grid: { rune: RuneType | null; cooldown: number; owner: string | null }[][], q: number, r: number, rune: RuneType): number {
  let best = 0;
  for (const dir of LINE_DIRECTIONS) {
    let count = 1;

    let cq = q + dir.dq;
    let cr = r + dir.dr;
    while (cq >= 0 && cq < GRID_COLS && cr >= 0 && cr < GRID_ROWS) {
      if (grid[cr][cq].rune !== rune) break;
      count++;
      cq += dir.dq;
      cr += dir.dr;
    }

    cq = q - dir.dq;
    cr = r - dir.dr;
    while (cq >= 0 && cq < GRID_COLS && cr >= 0 && cr < GRID_ROWS) {
      if (grid[cr][cq].rune !== rune) break;
      count++;
      cq -= dir.dq;
      cr -= dir.dr;
    }

    best = Math.max(best, count);
  }
  return best;
}

function isNearMemoryLocation(q: number, r: number): boolean {
  if (memoryTable.length === 0) return false;
  const recent = memoryTable[memoryTable.length - 1];
  return Math.abs(q - recent.q) <= 1 && Math.abs(r - recent.r) <= 1;
}

function getInterferencePlacements(engine: GameEngine): { q: number; r: number; handIndex: number }[] {
  const { minR, maxR } = getPlacementRows('ai');
  const hand = engine.players.ai.hand;
  const results: { q: number; r: number; handIndex: number; score: number }[] = [];

  for (let hi = 0; hi < hand.length; hi++) {
    for (let r = minR; r <= maxR; r++) {
      for (let q = 0; q < GRID_COLS; q++) {
        if (engine.grid[r][q].rune === null && isNearMemoryLocation(q, r)) {
          results.push({ q, r, handIndex: hi, score: 1 });
        }
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).map(r => ({ q: r.q, r: r.r, handIndex: r.handIndex }));
}

export function decideAiAction(engine: GameEngine): GameAction[] {
  const actions: GameAction[] = [];

  const lastSpellLocs = engine.lastSpellLocations;
  if (lastSpellLocs.length > 0) {
    for (const loc of lastSpellLocs) {
      if (!memoryTable.some(m => m.q === loc.q && m.r === loc.r)) {
        memoryTable.push({ q: loc.q, r: loc.r, turn: engine.turnCount });
      }
    }
    while (memoryTable.length > 5) {
      memoryTable.shift();
    }
  }

  const moveActions = engine.getValidMoves('ai');
  const spellMoves = moveActions.filter(m => canFormLineAfterMove(engine, m.fromQ, m.fromR, m.toQ, m.toR));

  if (spellMoves.length > 0) {
    const move = spellMoves[0];
    actions.push({
      type: 'move',
      fromQ: move.fromQ,
      fromR: move.fromR,
      toQ: move.toQ,
      toR: move.toR,
    });
    return actions;
  }

  const validPlacements = engine.getValidPlacements('ai');
  const hand = engine.players.ai.hand;

  for (let hi = 0; hi < hand.length; hi++) {
    const rune = hand[hi];
    for (const p of validPlacements) {
      if (canFormLineAfterPlace(engine, p.q, p.r, rune)) {
        actions.push({
          type: 'place',
          toQ: p.q,
          toR: p.r,
          handIndex: hi,
          runeType: rune,
        });
        return actions;
      }
    }
  }

  const interference = getInterferencePlacements(engine);
  if (interference.length > 0 && hand.length > 0) {
    const best = interference[0];
    actions.push({
      type: 'place',
      toQ: best.q,
      toR: best.r,
      handIndex: best.handIndex,
      runeType: hand[best.handIndex],
    });
    return actions;
  }

  if (validPlacements.length > 0 && hand.length > 0) {
    let bestPlacement: { q: number; r: number; handIndex: number; potential: number } | null = null;

    for (let hi = 0; hi < hand.length; hi++) {
      const rune = hand[hi];
      for (const p of validPlacements) {
        const potential = countLinePotential(engine.grid as any, p.q, p.r, rune);
        if (!bestPlacement || potential > bestPlacement.potential) {
          bestPlacement = { q: p.q, r: p.r, handIndex: hi, potential };
        }
      }
    }

    if (bestPlacement) {
      actions.push({
        type: 'place',
        toQ: bestPlacement.q,
        toR: bestPlacement.r,
        handIndex: bestPlacement.handIndex,
        runeType: hand[bestPlacement.handIndex],
      });
      return actions;
    }
  }

  if (moveActions.length > 0) {
    const aiTerritory = getPlayerTerritory('ai');
    const edgeMoves = moveActions.filter(m => {
      const toR = m.toR;
      return toR === aiTerritory.minR || toR === aiTerritory.maxR || m.toQ === 0 || m.toQ === GRID_COLS - 1;
    });

    const moves = edgeMoves.length > 0 ? edgeMoves : moveActions;
    const move = moves[Math.floor(Math.random() * moves.length)];
    actions.push({
      type: 'move',
      fromQ: move.fromQ,
      fromR: move.fromR,
      toQ: move.toQ,
      toR: move.toR,
    });
    return actions;
  }

  return actions;
}

export function resetMemory() {
  memoryTable.length = 0;
}
