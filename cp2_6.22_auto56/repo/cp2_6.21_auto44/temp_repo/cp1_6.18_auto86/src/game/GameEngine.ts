import type {
  GameState,
  HexCell,
  HexCoord,
  PlayerType,
  RuneColor,
  Track,
} from './types';
import {
  findPathBFS,
  getCell,
  getNeighbors,
  hexDistance,
  hexEquals,
  hexKey,
  isAdjacent,
} from './hexUtils';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;
const HEX_SIZE = 32;
const RUNE_COLORS: RuneColor[] = ['red', 'blue', 'yellow', 'green'];
const VICTORY_SCORE = 50;
const VICTORY_RUNES = 10;

export class GameEngine {
  state: GameState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const grid = this.generateMap();

    return {
      grid,
      hexSize: HEX_SIZE,
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      tracks: [],
      players: {
        player: {
          type: 'player',
          score: 0,
          runesCollected: 0,
          cart: {
            id: 'player-cart',
            owner: 'player',
            position: { q: 0, r: GRID_HEIGHT - 1 },
            carrying: null,
          },
        },
        ai: {
          type: 'ai',
          score: 0,
          runesCollected: 0,
          cart: {
            id: 'ai-cart',
            owner: 'ai',
            position: { q: GRID_WIDTH - 1, r: 0 },
            carrying: null,
          },
        },
      },
      currentTurn: 'player',
      turnNumber: 1,
      gameOver: false,
      winner: null,
      actionTaken: false,
    };
  }

  private generateMap(): HexCell[][] {
    const grid: HexCell[][] = [];

    for (let r = 0; r < GRID_HEIGHT; r++) {
      const row: HexCell[] = [];
      for (let q = 0; q < GRID_WIDTH; q++) {
        let terrain: HexCell['terrain'] = 'plain';
        const isPlayerBase = q === 0 && r === GRID_HEIGHT - 1;
        const isAIBase = q === GRID_WIDTH - 1 && r === 0;

        if (isPlayerBase || isAIBase) {
          terrain = 'base';
        } else {
          const rand = Math.random();
          if (rand < 0.08) terrain = 'crack';
          else if (rand < 0.14) terrain = 'lava';
          else if (rand < 0.24) terrain = 'rune';
        }

        row.push({
          coord: { q, r },
          terrain,
          hasRune: terrain === 'rune',
          runeColor:
            terrain === 'rune'
              ? RUNE_COLORS[Math.floor(Math.random() * RUNE_COLORS.length)]
              : undefined,
          isBase: terrain === 'base',
          baseOwner: isPlayerBase ? 'player' : isAIBase ? 'ai' : undefined,
        });
      }
      grid.push(row);
    }

    return grid;
  }

  refreshRunes(): void {
    const count = Math.floor(Math.random() * 2) + 1;
    let placed = 0;
    const plainCells: HexCell[] = [];

    for (const row of this.state.grid) {
      for (const cell of row) {
        if (
          cell.terrain === 'plain' &&
          !cell.isBase &&
          !this.hasCartOn(cell.coord)
        ) {
          plainCells.push(cell);
        }
      }
    }

    while (placed < count && plainCells.length > 0) {
      const idx = Math.floor(Math.random() * plainCells.length);
      const cell = plainCells.splice(idx, 1)[0];
      cell.terrain = 'rune';
      cell.hasRune = true;
      cell.runeColor =
        RUNE_COLORS[Math.floor(Math.random() * RUNE_COLORS.length)];
      placed++;
    }
  }

  private hasCartOn(coord: HexCoord): boolean {
    return (
      hexEquals(this.state.players.player.cart.position, coord) ||
      hexEquals(this.state.players.ai.cart.position, coord)
    );
  }

  private hasOpponentTrackOn(coord: HexCoord, player: PlayerType): boolean {
    const opponent = player === 'player' ? 'ai' : 'player';
    for (const track of this.state.tracks) {
      if (track.owner !== opponent) continue;
      if (
        hexEquals(track.from, coord) ||
        hexEquals(track.to, coord)
      ) {
        return true;
      }
    }
    return false;
  }

  private trackExists(from: HexCoord, to: HexCoord, player?: PlayerType): boolean {
    return this.state.tracks.some(
      (t) =>
        (player === undefined || t.owner === player) &&
        ((hexEquals(t.from, from) && hexEquals(t.to, to)) ||
          (hexEquals(t.from, to) && hexEquals(t.to, from))),
    );
  }

  getTracksOnCell(coord: HexCoord, player?: PlayerType): Track[] {
    return this.state.tracks.filter(
      (t) =>
        (player === undefined || t.owner === player) &&
        (hexEquals(t.from, coord) || hexEquals(t.to, coord)),
    );
  }

  hasAnyTrack(coord: HexCoord, player?: PlayerType): boolean {
    return this.getTracksOnCell(coord, player).length > 0;
  }

  canBuildTrack(from: HexCoord, to: HexCoord, player: PlayerType): boolean {
    if (this.state.gameOver || this.state.actionTaken) return false;
    if (this.state.currentTurn !== player) return false;
    if (!isAdjacent(from, to)) return false;

    const cellFrom = getCell(this.state.grid, from);
    const cellTo = getCell(this.state.grid, to);
    if (!cellFrom || !cellTo) return false;

    if (
      cellTo.terrain === 'crack' ||
      cellTo.terrain === 'lava'
    )
      return false;

    if (this.trackExists(from, to)) return false;

    if (this.hasOpponentTrackOn(to, player)) return false;

    const cart = this.state.players[player].cart;
    const hasFromTrack =
      this.hasAnyTrack(from, player) || hexEquals(cart.position, from);
    if (!hasFromTrack) return false;

    return true;
  }

  buildTrack(from: HexCoord, to: HexCoord, player: PlayerType): boolean {
    if (!this.canBuildTrack(from, to, player)) return false;

    this.state.tracks.push({ from, to, owner: player });
    this.state.actionTaken = true;
    return true;
  }

  canMoveCart(player: PlayerType, target: HexCoord): boolean {
    if (this.state.gameOver || this.state.actionTaken) return false;
    if (this.state.currentTurn !== player) return false;

    const cart = this.state.players[player].cart;
    if (!isAdjacent(cart.position, target)) return false;

    const targetCell = getCell(this.state.grid, target);
    if (!targetCell) return false;

    if (
      targetCell.terrain === 'crack' ||
      targetCell.terrain === 'lava'
    )
      return false;

    if (!this.trackExists(cart.position, target, player)) return false;

    if (this.hasOpponentTrackOn(target, player)) return false;

    const otherPlayer = player === 'player' ? 'ai' : 'player';
    if (hexEquals(this.state.players[otherPlayer].cart.position, target))
      return false;

    return true;
  }

  moveCart(player: PlayerType, target: HexCoord): boolean {
    if (!this.canMoveCart(player, target)) return false;

    const cart = this.state.players[player].cart;
    cart.position = { ...target };

    const cell = getCell(this.state.grid, target);
    if (cell) {
      if (cell.hasRune && !cart.carrying) {
        cart.carrying = cell.runeColor ?? null;
        cell.hasRune = false;
        cell.runeColor = undefined;
        cell.terrain = 'plain';
      } else if (cell.isBase && cell.baseOwner === player && cart.carrying) {
        cart.carrying = null;
        this.state.players[player].score += 10;
        this.state.players[player].runesCollected += 1;
      }
    }

    this.state.actionTaken = true;
    this.checkVictory();
    return true;
  }

  checkVictory(): void {
    for (const player of ['player', 'ai'] as PlayerType[]) {
      const p = this.state.players[player];
      if (p.score >= VICTORY_SCORE || p.runesCollected >= VICTORY_RUNES) {
        this.state.gameOver = true;
        this.state.winner = player;
        return;
      }
    }
  }

  endTurn(): void {
    if (this.state.gameOver) return;

    const nextPlayer: PlayerType =
      this.state.currentTurn === 'player' ? 'ai' : 'player';

    if (nextPlayer === 'player') {
      this.state.turnNumber++;
      this.refreshRunes();
    }

    this.state.currentTurn = nextPlayer;
    this.state.actionTaken = false;
  }

  handlePlayerClick(coord: HexCoord): boolean {
    if (this.state.gameOver) return false;
    if (this.state.currentTurn !== 'player') return false;
    if (this.state.actionTaken) return false;

    const cart = this.state.players.player.cart;

    if (this.canMoveCart('player', coord)) {
      return this.moveCart('player', coord);
    }

    if (isAdjacent(cart.position, coord)) {
      if (this.canBuildTrack(cart.position, coord, 'player')) {
        return this.buildTrack(cart.position, coord, 'player');
      }
    }

    for (const track of this.getTracksOnCell(cart.position, 'player')) {
      const other = hexEquals(track.from, cart.position)
        ? track.to
        : track.from;
      if (isAdjacent(other, coord)) {
        if (this.canBuildTrack(other, coord, 'player')) {
          return this.buildTrack(other, coord, 'player');
        }
      }
    }

    return false;
  }

  aiDecision(): { type: 'move' | 'build' | 'skip'; data?: HexCoord[] } {
    const ai = this.state.players.ai;
    const cart = ai.cart;

    const baseCoord = this.findBase('ai');
    if (!baseCoord) return { type: 'skip' };

    if (cart.carrying) {
      const moveResult = this.tryMoveTowards(cart.position, baseCoord, 'ai');
      if (moveResult) return moveResult;
      const buildResult = this.tryBuildTowards(cart.position, baseCoord, 'ai');
      if (buildResult) return buildResult;
    }

    const runeCoord = this.findNearestRune(cart.position);
    if (runeCoord) {
      const moveResult = this.tryMoveTowards(cart.position, runeCoord, 'ai');
      if (moveResult) return moveResult;
      const buildResult = this.tryBuildTowards(cart.position, runeCoord, 'ai');
      if (buildResult) return buildResult;
    }

    return { type: 'skip' };
  }

  private findBase(player: PlayerType): HexCoord | null {
    for (const row of this.state.grid) {
      for (const cell of row) {
        if (cell.isBase && cell.baseOwner === player) {
          return cell.coord;
        }
      }
    }
    return null;
  }

  private findNearestRune(from: HexCoord): HexCoord | null {
    let nearest: HexCoord | null = null;
    let minDist = Infinity;

    for (const row of this.state.grid) {
      for (const cell of row) {
        if (cell.hasRune) {
          const d = hexDistance(from, cell.coord);
          if (d < minDist) {
            minDist = d;
            nearest = cell.coord;
          }
        }
      }
    }

    return nearest;
  }

  private tryMoveTowards(
    from: HexCoord,
    to: HexCoord,
    player: PlayerType,
  ): { type: 'move'; data: HexCoord[] } | null {
    const isPassable = (coord: HexCoord): boolean => {
      if (hexEquals(coord, from)) return true;
      const cell = getCell(this.state.grid, coord);
      if (!cell) return false;
      if (cell.terrain === 'crack' || cell.terrain === 'lava') return false;
      if (this.hasOpponentTrackOn(coord, player)) return false;
      return this.trackExists(from, coord, player);
    };

    const path = findPathBFS(
      from,
      to,
      isPassable,
      this.state.gridWidth,
      this.state.gridHeight,
    );

    if (path && path.length >= 2) {
      const nextStep = path[1];
      if (this.canMoveCart(player, nextStep)) {
        return { type: 'move', data: [nextStep] };
      }
    }

    return null;
  }

  private tryBuildTowards(
    from: HexCoord,
    to: HexCoord,
    player: PlayerType,
  ): { type: 'build'; data: HexCoord[] } | null {
    const isPassable = (coord: HexCoord): boolean => {
      const cell = getCell(this.state.grid, coord);
      if (!cell) return false;
      if (cell.terrain === 'crack' || cell.terrain === 'lava') return false;
      if (this.hasOpponentTrackOn(coord, player)) return false;
      return true;
    };

    const path = findPathBFS(
      from,
      to,
      isPassable,
      this.state.gridWidth,
      this.state.gridHeight,
    );

    if (!path || path.length < 2) return null;

    const buildCandidates: HexCoord[] = [];
    const cartTracks = this.getTracksOnCell(from, player);
    let frontier = new Set<string>([hexKey(from)]);

    for (const t of cartTracks) {
      const other = hexEquals(t.from, from) ? t.to : t.from;
      frontier.add(hexKey(other));
      buildCandidates.push(other);
    }

    for (let i = 1; i < path.length; i++) {
      const step = path[i];
      if (frontier.has(hexKey(step))) {
        if (i + 1 < path.length) {
          const nextStep = path[i + 1];
          if (this.canBuildTrack(step, nextStep, player)) {
            return { type: 'build', data: [step, nextStep] };
          }
        }
      } else {
        for (const fc of buildCandidates) {
          if (isAdjacent(fc, step)) {
            if (this.canBuildTrack(fc, step, player)) {
              return { type: 'build', data: [fc, step] };
            }
          }
        }
        for (const neighbor of getNeighbors(from)) {
          if (this.canBuildTrack(from, neighbor, player)) {
            if (hexDistance(neighbor, to) < hexDistance(from, to)) {
              return { type: 'build', data: [from, neighbor] };
            }
          }
        }
        for (const neighbor of getNeighbors(from)) {
          if (this.canBuildTrack(from, neighbor, player)) {
            return { type: 'build', data: [from, neighbor] };
          }
        }
        break;
      }
    }

    return null;
  }

  executeAITurn(): void {
    if (this.state.currentTurn !== 'ai' || this.state.gameOver) return;

    const decision = this.aiDecision();

    if (decision.type === 'move' && decision.data) {
      this.moveCart('ai', decision.data[0]);
    } else if (decision.type === 'build' && decision.data) {
      this.buildTrack(decision.data[0], decision.data[1], 'ai');
    }
  }

  reset(): void {
    this.state = this.createInitialState();
  }
}
