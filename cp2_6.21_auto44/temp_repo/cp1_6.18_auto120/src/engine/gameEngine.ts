export enum RuneType {
  Fire = 'fire',
  Water = 'water',
  Wood = 'wood',
}

export enum SpellType {
  Fireball = 'fireball',
  Frost = 'frost',
  Vine = 'vine',
}

export type PlayerID = 'player' | 'ai';

export interface HexCell {
  q: number;
  r: number;
  rune: RuneType | null;
  owner: PlayerID | null;
  cooldown: number;
}

export interface PlayerState {
  id: PlayerID;
  hp: number;
  maxHp: number;
  hand: RuneType[];
  skipNextTurn: boolean;
  cannotPlace: boolean;
}

export interface SpellResult {
  type: SpellType;
  cells: HexCell[];
  caster: PlayerID;
  target: PlayerID;
}

export interface GameAction {
  type: 'move' | 'place';
  fromQ?: number;
  fromR?: number;
  toQ: number;
  toR: number;
  handIndex?: number;
  runeType?: RuneType;
}

export const GRID_COLS = 6;
export const GRID_ROWS = 6;
export const HEX_RADIUS = 30;
export const HEX_SPACING = 2;
export const INITIAL_HP = 100;
export const MAX_HAND_SIZE = 5;
export const FIREBALL_DAMAGE = 15;

const HEX_DIRECTIONS = [
  { dq: 1, dr: 0 },
  { dq: -1, dr: 0 },
  { dq: 0, dr: 1 },
  { dq: 0, dr: -1 },
  { dq: 1, dr: -1 },
  { dq: -1, dr: 1 },
];

export const LINE_DIRECTIONS = [
  { dq: 1, dr: 0 },
  { dq: 0, dr: 1 },
  { dq: 1, dr: -1 },
];

function runeToSpell(rune: RuneType): SpellType {
  switch (rune) {
    case RuneType.Fire: return SpellType.Fireball;
    case RuneType.Water: return SpellType.Frost;
    case RuneType.Wood: return SpellType.Vine;
  }
}

function randomRuneType(): RuneType {
  const types = [RuneType.Fire, RuneType.Water, RuneType.Wood];
  return types[Math.floor(Math.random() * types.length)];
}

export function createEmptyGrid(): HexCell[][] {
  const grid: HexCell[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    grid[r] = [];
    for (let q = 0; q < GRID_COLS; q++) {
      grid[r][q] = { q, r, rune: null, owner: null, cooldown: 0 };
    }
  }
  return grid;
}

export function cloneGrid(grid: HexCell[][]): HexCell[][] {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

export function isValidCoord(q: number, r: number): boolean {
  return q >= 0 && q < GRID_COLS && r >= 0 && r < GRID_ROWS;
}

export function getNeighbors(q: number, r: number): { q: number; r: number }[] {
  const result: { q: number; r: number }[] = [];
  for (const d of HEX_DIRECTIONS) {
    const nq = q + d.dq;
    const nr = r + d.dr;
    if (isValidCoord(nq, nr)) {
      result.push({ q: nq, r: nr });
    }
  }
  return result;
}

export function hexToPixel(q: number, r: number, centerX: number, centerY: number): { x: number; y: number } {
  const R = HEX_RADIUS + HEX_SPACING;
  const x = centerX + R * Math.sqrt(3) * (q + r / 2);
  const y = centerY + R * 1.5 * r;
  return { x, y };
}

export function pixelToHex(px: number, py: number, centerX: number, centerY: number): { q: number; r: number } | null {
  const R = HEX_RADIUS + HEX_SPACING;
  const x = px - centerX;
  const y = py - centerY;
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / R;
  const r = (2 / 3 * y) / R;
  return cubeRound(q, -q - r, r);
}

function cubeRound(q: number, s: number, r: number): { q: number; r: number } | null {
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }
  if (isValidCoord(rq, rr)) {
    return { q: rq, r: rr };
  }
  return null;
}

export function getPlayerTerritory(player: PlayerID): { minR: number; maxR: number } {
  if (player === 'player') {
    return { minR: 3, maxR: 5 };
  }
  return { minR: 0, maxR: 2 };
}

export function getPlacementRows(player: PlayerID): { minR: number; maxR: number } {
  if (player === 'player') {
    return { minR: 3, maxR: 4 };
  }
  return { minR: 1, maxR: 2 };
}

export function getBackRow(player: PlayerID): number {
  return player === 'player' ? 5 : 0;
}

export class GameEngine {
  grid: HexCell[][] = createEmptyGrid();
  players: Record<PlayerID, PlayerState> = {
    player: { id: 'player', hp: INITIAL_HP, maxHp: INITIAL_HP, hand: [], skipNextTurn: false, cannotPlace: false },
    ai: { id: 'ai', hp: INITIAL_HP, maxHp: INITIAL_HP, hand: [], skipNextTurn: false, cannotPlace: false },
  };
  currentTurn: PlayerID = 'player';
  turnCount = 1;
  gameOver = false;
  winner: PlayerID | null = null;
  lastSpellLocations: { q: number; r: number }[] = [];

  init() {
    this.grid = createEmptyGrid();
    this.players = {
      player: { id: 'player', hp: INITIAL_HP, maxHp: INITIAL_HP, hand: [], skipNextTurn: false, cannotPlace: false },
      ai: { id: 'ai', hp: INITIAL_HP, maxHp: INITIAL_HP, hand: [], skipNextTurn: false, cannotPlace: false },
    };

    const backRowP = getBackRow('player');
    const backRowA = getBackRow('ai');
    const midQ = Math.floor(GRID_COLS / 2);

    this.placeRuneOnGrid(midQ - 1, backRowP, RuneType.Fire, 'player');
    this.placeRuneOnGrid(midQ, backRowP, RuneType.Water, 'player');
    this.placeRuneOnGrid(midQ + 1, backRowP, RuneType.Wood, 'player');

    this.placeRuneOnGrid(midQ - 1, backRowA, RuneType.Fire, 'ai');
    this.placeRuneOnGrid(midQ, backRowA, RuneType.Water, 'ai');
    this.placeRuneOnGrid(midQ + 1, backRowA, RuneType.Wood, 'ai');

    this.players.player.hand = [];
    this.players.ai.hand = [];
    for (let i = 0; i < MAX_HAND_SIZE; i++) {
      this.players.player.hand.push(randomRuneType());
      this.players.ai.hand.push(randomRuneType());
    }

    this.currentTurn = 'player';
    this.turnCount = 1;
    this.gameOver = false;
    this.winner = null;
    this.lastSpellLocations = [];
  }

  private placeRuneOnGrid(q: number, r: number, rune: RuneType, owner: PlayerID) {
    if (isValidCoord(q, r)) {
      this.grid[r][q].rune = rune;
      this.grid[r][q].owner = owner;
      this.grid[r][q].cooldown = 0;
    }
  }

  getValidMoves(player: PlayerID): { fromQ: number; fromR: number; toQ: number; toR: number }[] {
    const moves: { fromQ: number; fromR: number; toQ: number; toR: number }[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let q = 0; q < GRID_COLS; q++) {
        const cell = this.grid[r][q];
        if (cell.rune !== null && cell.owner === player && cell.cooldown === 0) {
          const neighbors = getNeighbors(q, r);
          for (const n of neighbors) {
            if (this.grid[n.r][n.q].rune === null) {
              moves.push({ fromQ: q, fromR: r, toQ: n.q, toR: n.r });
            }
          }
        }
      }
    }
    return moves;
  }

  getValidPlacements(player: PlayerID): { q: number; r: number }[] {
    if (this.players[player].cannotPlace) return [];
    if (this.players[player].hand.length === 0) return [];

    const { minR, maxR } = getPlacementRows(player);
    const placements: { q: number; r: number }[] = [];
    for (let r = minR; r <= maxR; r++) {
      for (let q = 0; q < GRID_COLS; q++) {
        if (this.grid[r][q].rune === null) {
          placements.push({ q, r });
        }
      }
    }
    return placements;
  }

  moveRune(fromQ: number, fromR: number, toQ: number, toR: number): SpellResult[] {
    const fromCell = this.grid[fromR][fromQ];
    const toCell = this.grid[toR][toQ];
    if (!fromCell.rune || fromCell.owner !== this.currentTurn || fromCell.cooldown > 0) return [];
    if (toCell.rune !== null) return [];

    const isAdjacent = getNeighbors(fromQ, fromR).some(n => n.q === toQ && n.r === toR);
    if (!isAdjacent) return [];

    toCell.rune = fromCell.rune;
    toCell.owner = fromCell.owner;
    toCell.cooldown = 0;
    fromCell.rune = null;
    fromCell.owner = null;
    fromCell.cooldown = 0;

    return this.checkSpells();
  }

  placeRune(q: number, r: number, handIndex: number): SpellResult[] {
    const player = this.currentTurn;
    const pState = this.players[player];
    if (pState.cannotPlace) return [];
    if (handIndex < 0 || handIndex >= pState.hand.length) return [];

    const { minR, maxR } = getPlacementRows(player);
    if (r < minR || r > maxR) return [];
    if (this.grid[r][q].rune !== null) return [];

    const runeType = pState.hand[handIndex];
    this.grid[r][q].rune = runeType;
    this.grid[r][q].owner = player;
    this.grid[r][q].cooldown = 0;
    pState.hand.splice(handIndex, 1);

    return this.checkSpells();
  }

  checkSpells(): SpellResult[] {
    const spells: SpellResult[] = [];
    const visited = new Set<string>();

    for (const dir of LINE_DIRECTIONS) {
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let q = 0; q < GRID_COLS; q++) {
          const cell = this.grid[r][q];
          if (cell.rune === null || cell.cooldown > 0) continue;

          const key = `${q},${r},${dir.dq},${dir.dr}`;
          const prevQ = q - dir.dq;
          const prevR = r - dir.dr;
          if (isValidCoord(prevQ, prevR)) {
            const prevCell = this.grid[prevR][prevQ];
            if (prevCell.rune === cell.rune && prevCell.cooldown === 0) continue;
          }

          if (visited.has(key)) continue;

          const lineCells: HexCell[] = [{ ...cell }];
          let cq = q + dir.dq;
          let cr = r + dir.dr;

          while (isValidCoord(cq, cr)) {
            const nextCell = this.grid[cr][cq];
            if (nextCell.rune !== cell.rune || nextCell.cooldown > 0) break;
            lineCells.push({ ...nextCell });
            visited.add(`${cq},${cr},${dir.dq},${dir.dr}`);
            cq += dir.dq;
            cr += dir.dr;
          }

          if (lineCells.length >= 3) {
            const owner = cell.owner!;
            const target: PlayerID = owner === 'player' ? 'ai' : 'player';
            spells.push({
              type: runeToSpell(cell.rune),
              cells: lineCells,
              caster: owner,
              target,
            });

            for (const lc of lineCells) {
              this.grid[lc.r][lc.q].cooldown = 1;
            }

            this.lastSpellLocations = lineCells.map(c => ({ q: c.q, r: c.r }));
          }
        }
      }
    }

    return spells;
  }

  applySpellEffect(spell: SpellResult) {
    switch (spell.type) {
      case SpellType.Fireball:
        this.players[spell.target].hp = Math.max(0, this.players[spell.target].hp - FIREBALL_DAMAGE);
        break;
      case SpellType.Frost:
        this.players[spell.target].skipNextTurn = true;
        break;
      case SpellType.Vine:
        this.players[spell.target].cannotPlace = true;
        break;
    }

    if (this.players[spell.target].hp <= 0) {
      this.gameOver = true;
      this.winner = spell.caster;
    }
  }

  tickCooldowns(player: PlayerID) {
    const territory = getPlayerTerritory(player);
    for (let r = territory.minR; r <= territory.maxR; r++) {
      for (let q = 0; q < GRID_COLS; q++) {
        if (this.grid[r][q].cooldown > 0) {
          this.grid[r][q].cooldown--;
        }
      }
    }
  }

  endTurn() {
    this.tickCooldowns(this.currentTurn);

    if (this.players.player.cannotPlace && this.currentTurn === 'player') {
      this.players.player.cannotPlace = false;
    }
    if (this.players.ai.cannotPlace && this.currentTurn === 'ai') {
      this.players.ai.cannotPlace = false;
    }

    const next: PlayerID = this.currentTurn === 'player' ? 'ai' : 'player';

    if (this.players[next].skipNextTurn) {
      this.players[next].skipNextTurn = false;
      this.currentTurn = this.currentTurn;
      this.turnCount++;
    } else {
      this.currentTurn = next;
      if (next === 'player') {
        this.turnCount++;
      }
    }

    if (this.players.player.hand.length < MAX_HAND_SIZE) {
      this.players.player.hand.push(randomRuneType());
    }
    if (this.players.ai.hand.length < MAX_HAND_SIZE) {
      this.players.ai.hand.push(randomRuneType());
    }
  }

  getState() {
    return {
      grid: cloneGrid(this.grid),
      players: {
        player: { ...this.players.player, hand: [...this.players.player.hand] },
        ai: { ...this.players.ai, hand: [...this.players.ai.hand] },
      },
      currentTurn: this.currentTurn,
      turnCount: this.turnCount,
      gameOver: this.gameOver,
      winner: this.winner,
      lastSpellLocations: [...this.lastSpellLocations],
    };
  }

  getGridCenter(canvasWidth: number, canvasHeight: number): { x: number; y: number } {
    const R = HEX_RADIUS + HEX_SPACING;
    const gridWidth = R * Math.sqrt(3) * (GRID_COLS - 1 + (GRID_ROWS - 1) / 2);
    const gridHeight = R * 1.5 * (GRID_ROWS - 1);
    return {
      x: (canvasWidth - gridWidth) / 2 + R * Math.sqrt(3) * ((GRID_ROWS - 1) / 2) / 2,
      y: (canvasHeight - gridHeight) / 2,
    };
  }
}
