import { Cell, CellState } from './Cell';

export interface PathPoint {
    row: number;
    col: number;
}

export class Board {
    readonly rows = 8;
    readonly cols = 10;
    readonly iconTypes = 8;
    grid: Cell[][];

    constructor() {
        this.grid = [];
        this.generateLayout();
    }

    generateLayout(): void {
        this.grid = [];
        const total = this.rows * this.cols;
        const perType = total / this.iconTypes;
        const icons: number[] = [];
        for (let t = 0; t < this.iconTypes; t++) {
            for (let i = 0; i < perType; i++) {
                icons.push(t);
            }
        }

        let attempts = 0;
        do {
            this.shuffle(icons);
            this.grid = [];
            let idx = 0;
            for (let r = 0; r < this.rows; r++) {
                this.grid[r] = [];
                for (let c = 0; c < this.cols; c++) {
                    this.grid[r][c] = new Cell(r, c, icons[idx++]);
                }
            }
            attempts++;
        } while (!this.findHint() && attempts < 100);
    }

    private shuffle(arr: number[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    getCell(r: number, c: number): Cell {
        return this.grid[r][c];
    }

    isEmptyCell(r: number, c: number): boolean {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return true;
        return this.grid[r][c].isEmpty;
    }

    isLineClear(r1: number, c1: number, r2: number, c2: number): boolean {
        if (r1 === r2) {
            const minC = Math.min(c1, c2);
            const maxC = Math.max(c1, c2);
            for (let c = minC + 1; c < maxC; c++) {
                if (!this.isEmptyCell(r1, c)) return false;
            }
            return true;
        }
        if (c1 === c2) {
            const minR = Math.min(r1, r2);
            const maxR = Math.max(r1, r2);
            for (let r = minR + 1; r < maxR; r++) {
                if (!this.isEmptyCell(r, c1)) return false;
            }
            return true;
        }
        return false;
    }

    findPath(r1: number, c1: number, r2: number, c2: number): PathPoint[] | null {
        if (r1 === r2 && c1 === c2) return null;
        if (this.grid[r1][c1].isEmpty || this.grid[r2][c2].isEmpty) return null;
        if (this.grid[r1][c1].iconType !== this.grid[r2][c2].iconType) return null;

        if (r1 === r2 && this.isLineClear(r1, c1, r2, c2)) {
            return [{ row: r1, col: c1 }, { row: r2, col: c2 }];
        }
        if (c1 === c2 && this.isLineClear(r1, c1, r2, c2)) {
            return [{ row: r1, col: c1 }, { row: r2, col: c2 }];
        }

        if (this.isEmptyCell(r1, c2) && this.isLineClear(r1, c1, r1, c2) && this.isLineClear(r1, c2, r2, c2)) {
            return [{ row: r1, col: c1 }, { row: r1, col: c2 }, { row: r2, col: c2 }];
        }
        if (this.isEmptyCell(r2, c1) && this.isLineClear(r1, c1, r2, c1) && this.isLineClear(r2, c1, r2, c2)) {
            return [{ row: r1, col: c1 }, { row: r2, col: c1 }, { row: r2, col: c2 }];
        }

        for (let r = -1; r <= this.rows; r++) {
            if (this.isEmptyCell(r, c1) && this.isEmptyCell(r, c2)) {
                if (this.isLineClear(r1, c1, r, c1) && this.isLineClear(r, c1, r, c2) && this.isLineClear(r, c2, r2, c2)) {
                    return [
                        { row: r1, col: c1 },
                        { row: r, col: c1 },
                        { row: r, col: c2 },
                        { row: r2, col: c2 }
                    ];
                }
            }
        }

        for (let c = -1; c <= this.cols; c++) {
            if (this.isEmptyCell(r1, c) && this.isEmptyCell(r2, c)) {
                if (this.isLineClear(r1, c1, r1, c) && this.isLineClear(r1, c, r2, c) && this.isLineClear(r2, c, r2, c2)) {
                    return [
                        { row: r1, col: c1 },
                        { row: r1, col: c },
                        { row: r2, col: c },
                        { row: r2, col: c2 }
                    ];
                }
            }
        }

        return null;
    }

    findHint(): [number, number, number, number] | null {
        for (let r1 = 0; r1 < this.rows; r1++) {
            for (let c1 = 0; c1 < this.cols; c1++) {
                if (this.grid[r1][c1].isEmpty) continue;
                for (let r2 = r1; r2 < this.rows; r2++) {
                    const startC = r2 === r1 ? c1 + 1 : 0;
                    for (let c2 = startC; c2 < this.cols; c2++) {
                        if (this.grid[r2][c2].isEmpty) continue;
                        if (this.grid[r1][c1].iconType !== this.grid[r2][c2].iconType) continue;
                        if (this.findPath(r1, c1, r2, c2)) {
                            return [r1, c1, r2, c2];
                        }
                    }
                }
            }
        }
        return null;
    }

    eliminate(r1: number, c1: number, r2: number, c2: number): void {
        this.grid[r1][c1].iconType = -1;
        this.grid[r1][c1].state = CellState.EMPTY;
        this.grid[r2][c2].iconType = -1;
        this.grid[r2][c2].state = CellState.EMPTY;
    }

    getRemainingCount(): number {
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.grid[r][c].isEmpty) count++;
            }
        }
        return count;
    }

    isBoardCleared(): boolean {
        return this.getRemainingCount() === 0;
    }

    reshuffleRemaining(): void {
        const remaining: number[] = [];
        const positions: [number, number][] = [];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.grid[r][c].isEmpty) {
                    remaining.push(this.grid[r][c].iconType);
                    positions.push([r, c]);
                }
            }
        }

        let attempts = 0;
        do {
            this.shuffle(remaining);
            for (let i = 0; i < positions.length; i++) {
                const [r, c] = positions[i];
                this.grid[r][c].iconType = remaining[i];
            }
            attempts++;
        } while (!this.findHint() && attempts < 100);
    }

    setFadeDelays(startTime: number): void {
        const interval = 25;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const delay = (r * this.cols + c) * interval;
                this.grid[r][c].fadeDelay = startTime + delay;
                this.grid[r][c].stateStartTime = startTime + delay;
            }
        }
    }
}
