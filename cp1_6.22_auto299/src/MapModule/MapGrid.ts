import {
  HexCell,
  HexCell as HexCellType,
  MapNode,
  FogAnimation,
  HEX_SIZE,
  RuneType,
  COMBINATION_FORMULAS,
} from '../types';

const SQRT3 = Math.sqrt(3);

function hexToPixel(q: number, r: number): { cx: number; cy: number } {
  const cx = HEX_SIZE * (SQRT3 * q + SQRT3 / 2 * r);
  const cy = HEX_SIZE * (1.5 * r);
  return { cx, cy };
}

export function generateHexGrid(cols: number, rows: number): HexCell[] {
  const cells: HexCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      const { cx, cy } = hexToPixel(q, r);
      const id = `cell_${q}_${r}`;
      const isEdge = q === 0 || r === 0 || q === cols - 1 || r === rows - 1;
      cells.push({
        id,
        q,
        r,
        cx,
        cy,
        fogOpacity: 0.7,
        isRevealed: false,
        hasHiddenPath: false,
        hasSecretEntrance: false,
      });
    }
  }
  return cells;
}

export function generateMapNodes(cells: HexCell[]): MapNode[] {
  const nodes: MapNode[] = [];
  const altarPositions = [
    { q: 2, r: 2, types: ['fire', 'water'] as RuneType[] },
    { q: 5, r: 1, types: ['earth', 'wind'] as RuneType[] },
    { q: 7, r: 4, types: ['light', 'dark'] as RuneType[] },
    { q: 3, r: 5, types: ['fire', 'earth'] as RuneType[] },
    { q: 8, r: 2, types: ['water', 'wind'] as RuneType[] },
    { q: 6, r: 6, types: ['fire', 'light'] as RuneType[] },
  ];

  for (const pos of altarPositions) {
    const cell = cells.find(c => c.q === pos.q && c.r === pos.r);
    if (cell) {
      nodes.push({
        id: `altar_${pos.q}_${pos.r}`,
        cx: cell.cx,
        cy: cell.cy,
        type: 'altar',
        connectedCellIds: getNeighborIds(cell.q, cell.r, cells),
        isActivated: false,
        runeTypesNeeded: pos.types,
      });
    }
  }

  const explorationCells = cells.filter(c => {
    const isAltar = altarPositions.some(p => p.q === c.q && p.r === c.r);
    return !isAltar && (c.q + c.r) % 3 === 0;
  });

  for (const cell of explorationCells) {
    nodes.push({
      id: `explore_${cell.q}_${cell.r}`,
      cx: cell.cx,
      cy: cell.cy,
      type: 'exploration',
      connectedCellIds: [cell.id],
      isActivated: false,
    });
  }

  const secretPositions = [
    { q: 4, r: 3 },
    { q: 6, r: 5 },
  ];

  for (const pos of secretPositions) {
    const cell = cells.find(c => c.q === pos.q && c.r === pos.r);
    if (cell) {
      cell.hasSecretEntrance = true;
      cell.secretEntrancePos = { x: cell.cx, y: cell.cy };
      nodes.push({
        id: `secret_${pos.q}_${pos.r}`,
        cx: cell.cx,
        cy: cell.cy,
        type: 'secret',
        connectedCellIds: getNeighborIds(pos.q, pos.r, cells),
        isActivated: false,
      });
    }
  }

  return nodes;
}

function getNeighborIds(q: number, r: number, cells: HexCell[]): string[] {
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1],
  ];
  const ids: string[] = [];
  for (const [dq, dr] of dirs) {
    const nq = q + dq;
    const nr = r + dr;
    const found = cells.find(c => c.q === nq && c.r === nr);
    if (found) ids.push(found.id);
  }
  return ids;
}

export class MapGrid {
  cells: HexCell[];
  nodes: MapNode[];
  fogAnimations: FogAnimation[] = [];

  constructor(cols: number = 10, rows: number = 8) {
    this.cells = generateHexGrid(cols, rows);
    this.nodes = generateMapNodes(this.cells);
    this._assignHiddenPaths();
  }

  private _assignHiddenPaths() {
    for (const node of this.nodes) {
      if (node.type === 'altar') {
        for (const cellId of node.connectedCellIds) {
          const cell = this.cells.find(c => c.id === cellId);
          if (cell && !cell.hasSecretEntrance) {
            cell.hasHiddenPath = true;
            cell.hiddenPathPos = {
              x: (cell.cx + node.cx) / 2,
              y: (cell.cy + node.cy) / 2,
            };
          }
        }
      }
    }
  }

  revealArea(cellIds: string[], now: number): FogAnimation[] {
    const animations: FogAnimation[] = [];
    for (const id of cellIds) {
      const cell = this.cells.find(c => c.id === id);
      if (cell && !cell.isRevealed) {
        cell.isRevealed = true;
        const anim: FogAnimation = {
          cellId: id,
          startOpacity: cell.fogOpacity,
          endOpacity: 0,
          startTime: now,
          duration: 500,
        };
        this.fogAnimations.push(anim);
        animations.push(anim);
      }
    }
    return animations;
  }

  updateFogAnimations(now: number) {
    const completed: string[] = [];
    for (const anim of this.fogAnimations) {
      const elapsed = now - anim.startTime;
      const t = Math.min(elapsed / anim.duration, 1);
      const cell = this.cells.find(c => c.id === anim.cellId);
      if (cell) {
        cell.fogOpacity = anim.startOpacity + (anim.endOpacity - anim.startOpacity) * t;
      }
      if (t >= 1) {
        completed.push(anim.cellId);
      }
    }
    this.fogAnimations = this.fogAnimations.filter(a => !completed.includes(a.cellId));
  }

  getVisibleCells(viewX: number, viewY: number, viewW: number, viewH: number, scale: number): HexCell[] {
    const margin = HEX_SIZE * 2;
    return this.cells.filter(c => {
      const sx = c.cx * scale - viewX;
      const sy = c.cy * scale - viewY;
      return sx > -margin && sx < viewW + margin && sy > -margin && sy < viewH + margin;
    });
  }

  activateAltarNode(nodeId: string, now: number): FogAnimation[] {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node || node.isActivated) return [];
    node.isActivated = true;
    return this.revealArea(node.connectedCellIds, now);
  }

  loadState(revealedCellIds: string[], activatedNodeIds: string[]) {
    for (const id of revealedCellIds) {
      const cell = this.cells.find(c => c.id === id);
      if (cell) {
        cell.isRevealed = true;
        cell.fogOpacity = 0;
      }
    }
    for (const id of activatedNodeIds) {
      const node = this.nodes.find(n => n.id === id);
      if (node) node.isActivated = true;
    }
  }
}

export function getHexCorners(cx: number, cy: number, size: number): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: cx + size * Math.cos(angle),
      y: cy + size * Math.sin(angle),
    });
  }
  return corners;
}
