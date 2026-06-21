import { ResourceField } from './resourceField';

export interface GridCell {
    x: number;
    y: number;
    type: 'empty' | 'obstacle' | 'resource' | 'base';
    resourceField?: ResourceField;
    baseId?: string;
}

export class GridManager {
    width: number;
    height: number;
    cells: GridCell[][];
    resourceFields: Map<string, ResourceField>;

    constructor(width: number = 100, height: number = 100) {
        this.width = width;
        this.height = height;
        this.cells = [];
        this.resourceFields = new Map();
        this._initialize();
    }

    private _initialize(): void {
        for (let y = 0; y < this.height; y++) {
            this.cells[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x] = {
                    x,
                    y,
                    type: 'empty'
                };
            }
        }
    }

    generateMap(seed?: number): void {
    }

    getCell(x: number, y: number): GridCell | null {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.cells[y][x];
    }

    getNeighbors(x: number, y: number): GridCell[] {
        const neighbors: GridCell[] = [];
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: -1, dy: -1 }
        ];
        for (const dir of directions) {
            const cell = this.getCell(x + dir.dx, y + dir.dy);
            if (cell) {
                neighbors.push(cell);
            }
        }
        return neighbors;
    }

    isWalkable(x: number, y: number): boolean {
        const cell = this.getCell(x, y);
        if (!cell) return false;
        return cell.type !== 'obstacle';
    }

    findNearestResource(type: string, fromX: number, fromY: number): ResourceField | null {
        let nearest: ResourceField | null = null;
        let minDist = Infinity;
        for (const field of this.resourceFields.values()) {
            if (field.isDepleted) continue;
            if (type !== 'any' && field.type !== type) continue;
            const dx = field.x - fromX;
            const dy = field.y - fromY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = field;
            }
        }
        return nearest;
    }

    getResourceField(id: string): ResourceField | null {
        return this.resourceFields.get(id) || null;
    }

    addResourceField(field: ResourceField): void {
        this.resourceFields.set(field.id, field);
        const cell = this.getCell(field.x, field.y);
        if (cell) {
            cell.type = 'resource';
            cell.resourceField = field;
        }
    }

    setBase(x: number, y: number, baseId: string): void {
        const cell = this.getCell(x, y);
        if (cell) {
            cell.type = 'base';
            cell.baseId = baseId;
        }
    }

    update(delta: number): void {
        for (const field of this.resourceFields.values()) {
            field.updateVisual(delta);
        }
    }
}
