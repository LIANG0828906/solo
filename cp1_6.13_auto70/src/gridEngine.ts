export interface GridNode {
  x: number;
  y: number;
  height: number;
  velocity: number;
  restHeight: number;
  isDragging: boolean;
}

export type SpreadMode = 'circular' | 'cross' | 'random';

export interface RippleEvent {
  row: number;
  col: number;
  amplitude: number;
  distance: number;
}

export class GridEngine {
  private rows: number;
  private cols: number;
  private nodes: GridNode[][];
  private damping: number;
  private spreadDecay: number;
  private spreadSpeed: number;
  private spreadMode: SpreadMode;
  private minHeight: number = -3;
  private maxHeight: number = 3;
  private rippleQueue: RippleEvent[] = [];
  private frameCount: number = 0;
  private spreadInterval: number;

  constructor(rows: number = 20, cols: number = 20) {
    this.rows = rows;
    this.cols = cols;
    this.nodes = [];
    this.damping = 0.85;
    this.spreadDecay = 0.6;
    this.spreadSpeed = 3;
    this.spreadMode = 'circular';
    this.spreadInterval = Math.round(60 / this.spreadSpeed);
    this.initGrid();
  }

  private initGrid(): void {
    this.nodes = [];
    for (let row = 0; row < this.rows; row++) {
      this.nodes[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.nodes[row][col] = {
          x: col,
          y: row,
          height: 0,
          velocity: 0,
          restHeight: 0,
          isDragging: false
        };
      }
    }
  }

  getRows(): number {
    return this.rows;
  }

  getCols(): number {
    return this.cols;
  }

  getNodes(): GridNode[][] {
    return this.nodes;
  }

  getNode(row: number, col: number): GridNode | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }
    return this.nodes[row][col];
  }

  setDamping(damping: number): void {
    this.damping = damping;
  }

  getDamping(): number {
    return this.damping;
  }

  setSpreadDecay(decay: number): void {
    this.spreadDecay = decay;
  }

  getSpreadDecay(): number {
    return this.spreadDecay;
  }

  setSpreadMode(mode: SpreadMode): void {
    this.spreadMode = mode;
  }

  getSpreadMode(): SpreadMode {
    return this.spreadMode;
  }

  setSpreadSpeed(speed: number): void {
    this.spreadSpeed = speed;
    this.spreadInterval = Math.round(60 / speed);
  }

  dragNode(row: number, col: number, height: number): void {
    const node = this.getNode(row, col);
    if (!node) return;

    const clampedHeight = Math.max(this.minHeight, Math.min(this.maxHeight, height));
    const delta = clampedHeight - node.height;
    
    node.height = clampedHeight;
    node.velocity = 0;
    node.isDragging = true;

    if (Math.abs(delta) > 0.01) {
      this.addRipple(row, col, Math.abs(delta) * 0.8);
    }
  }

  releaseNode(row: number, col: number): void {
    const node = this.getNode(row, col);
    if (!node) return;
    node.isDragging = false;
  }

  private addRipple(row: number, col: number, amplitude: number): void {
    if (amplitude < 0.1) return;

    if (this.spreadMode === 'cross') {
      this.addCrossRipple(row, col, amplitude);
    } else if (this.spreadMode === 'random') {
      this.addRandomRipple(row, col, amplitude);
    } else {
      this.addCircularRipple(row, col, amplitude);
    }
  }

  private addCircularRipple(row: number, col: number, amplitude: number): void {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      const node = this.getNode(newRow, newCol);
      if (node && !node.isDragging) {
        const distance = Math.abs(dr) + Math.abs(dc) > 1 ? 1.4 : 1;
        this.rippleQueue.push({
          row: newRow,
          col: newCol,
          amplitude: amplitude * this.spreadDecay / distance,
          distance: 1
        });
      }
    }
  }

  private addCrossRipple(row: number, col: number, amplitude: number): void {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      const node = this.getNode(newRow, newCol);
      if (node && !node.isDragging) {
        this.rippleQueue.push({
          row: newRow,
          col: newCol,
          amplitude: amplitude * this.spreadDecay,
          distance: 1
        });
      }
    }
  }

  private addRandomRipple(row: number, col: number, amplitude: number): void {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    const count = Math.floor(Math.random() * 4) + 3;
    const shuffled = [...directions].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count && i < shuffled.length; i++) {
      const [dr, dc] = shuffled[i];
      const newRow = row + dr;
      const newCol = col + dc;
      const node = this.getNode(newRow, newCol);
      if (node && !node.isDragging) {
        const randomFactor = 0.5 + Math.random() * 0.5;
        this.rippleQueue.push({
          row: newRow,
          col: newCol,
          amplitude: amplitude * this.spreadDecay * randomFactor,
          distance: 1
        });
      }
    }
  }

  update(): void {
    this.frameCount++;

    if (this.frameCount % this.spreadInterval === 0) {
      this.propagateRipples();
    }

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const node = this.nodes[row][col];
        if (node.isDragging) continue;

        const springForce = (node.restHeight - node.height) * 0.15;
        node.velocity += springForce;
        node.velocity *= this.damping;
        node.height += node.velocity;

        if (Math.abs(node.height) < 0.001 && Math.abs(node.velocity) < 0.001) {
          node.height = node.restHeight;
          node.velocity = 0;
        }
      }
    }
  }

  private propagateRipples(): void {
    const newRipples: RippleEvent[] = [];
    const processed = new Set<string>();

    for (const ripple of this.rippleQueue) {
      const key = `${ripple.row},${ripple.col}`;
      if (processed.has(key)) continue;
      processed.add(key);

      const node = this.nodes[ripple.row]?.[ripple.col];
      if (!node || node.isDragging) continue;

      node.velocity += ripple.amplitude;

      const nextAmplitude = ripple.amplitude * this.spreadDecay;
      if (nextAmplitude >= 0.1) {
        if (this.spreadMode === 'cross') {
          this.propagateCross(ripple, nextAmplitude, newRipples, processed);
        } else if (this.spreadMode === 'random') {
          this.propagateRandom(ripple, nextAmplitude, newRipples, processed);
        } else {
          this.propagateCircular(ripple, nextAmplitude, newRipples, processed);
        }
      }
    }

    this.rippleQueue = newRipples;
  }

  private propagateCircular(
    ripple: RippleEvent,
    amplitude: number,
    queue: RippleEvent[],
    processed: Set<string>
  ): void {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    for (const [dr, dc] of directions) {
      const newRow = ripple.row + dr;
      const newCol = ripple.col + dc;
      const key = `${newRow},${newCol}`;
      
      if (processed.has(key)) continue;
      if (!this.getNode(newRow, newCol)) continue;

      const distance = Math.abs(dr) + Math.abs(dc) > 1 ? 1.4 : 1;
      queue.push({
        row: newRow,
        col: newCol,
        amplitude: amplitude / distance,
        distance: ripple.distance + 1
      });
    }
  }

  private propagateCross(
    ripple: RippleEvent,
    amplitude: number,
    queue: RippleEvent[],
    processed: Set<string>
  ): void {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      const newRow = ripple.row + dr;
      const newCol = ripple.col + dc;
      const key = `${newRow},${newCol}`;
      
      if (processed.has(key)) continue;
      if (!this.getNode(newRow, newCol)) continue;

      queue.push({
        row: newRow,
        col: newCol,
        amplitude: amplitude,
        distance: ripple.distance + 1
      });
    }
  }

  private propagateRandom(
    ripple: RippleEvent,
    amplitude: number,
    queue: RippleEvent[],
    processed: Set<string>
  ): void {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    const count = Math.floor(Math.random() * 4) + 2;
    const shuffled = [...directions].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count && i < shuffled.length; i++) {
      const [dr, dc] = shuffled[i];
      const newRow = ripple.row + dr;
      const newCol = ripple.col + dc;
      const key = `${newRow},${newCol}`;
      
      if (processed.has(key)) continue;
      if (!this.getNode(newRow, newCol)) continue;

      const randomFactor = 0.6 + Math.random() * 0.4;
      queue.push({
        row: newRow,
        col: newCol,
        amplitude: amplitude * randomFactor,
        distance: ripple.distance + 1
      });
    }
  }

  reset(animated: boolean = true): void {
    if (!animated) {
      this.rippleQueue = [];
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          this.nodes[row][col].height = 0;
          this.nodes[row][col].velocity = 0;
          this.nodes[row][col].isDragging = false;
        }
      }
      return;
    }

    this.rippleQueue = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const node = this.nodes[row][col];
        node.isDragging = false;
        const distance = Math.sqrt(
          Math.pow(row - this.rows / 2, 2) + Math.pow(col - this.cols / 2, 2)
        );
        const delay = distance * 0.02;
        setTimeout(() => {
          node.velocity = (0 - node.height) * 0.3;
        }, delay * 1000);
      }
    }
  }

  getHeightRange(): { min: number; max: number } {
    return { min: this.minHeight, max: this.maxHeight };
  }
}
