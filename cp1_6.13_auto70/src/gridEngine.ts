export interface GridNode {
  x: number;
  y: number;
  height: number;
  velocity: number;
  restHeight: number;
  isDragging: boolean;
  resetting: boolean;
  resetStartTime: number;
  resetStartHeight: number;
  resetStartVelocity: number;
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
  
  private rippleQueueA: RippleEvent[] = [];
  private rippleQueueB: RippleEvent[] = [];
  private useQueueA: boolean = true;
  
  private spreadAccumulator: number = 0;
  private resetDuration: number = 0.3;
  
  private processedSet: Set<number> = new Set();
  private directions8: number[][] = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];
  private directions4: number[][] = [
    [-1, 0], [1, 0], [0, -1], [0, 1]
  ];

  constructor(rows: number = 20, cols: number = 20) {
    this.rows = rows;
    this.cols = cols;
    this.nodes = [];
    this.damping = 0.85;
    this.spreadDecay = 0.6;
    this.spreadSpeed = 3;
    this.spreadMode = 'circular';
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
          isDragging: false,
          resetting: false,
          resetStartTime: 0,
          resetStartHeight: 0,
          resetStartVelocity: 0
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
  }

  dragNode(row: number, col: number, height: number): void {
    const node = this.getNode(row, col);
    if (!node) return;

    const clampedHeight = Math.max(this.minHeight, Math.min(this.maxHeight, height));
    const delta = clampedHeight - node.height;
    
    node.height = clampedHeight;
    node.velocity = 0;
    node.isDragging = true;
    node.resetting = false;

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
    const queue = this.useQueueA ? this.rippleQueueA : this.rippleQueueB;

    if (this.spreadMode === 'cross') {
      this.addCrossRipple(row, col, amplitude, queue);
    } else if (this.spreadMode === 'random') {
      this.addRandomRipple(row, col, amplitude, queue);
    } else {
      this.addCircularRipple(row, col, amplitude, queue);
    }
  }

  private addCircularRipple(row: number, col: number, amplitude: number, queue: RippleEvent[]): void {
    for (const [dr, dc] of this.directions8) {
      const newRow = row + dr;
      const newCol = col + dc;
      const node = this.getNode(newRow, newCol);
      if (node && !node.isDragging && !node.resetting) {
        const distFactor = Math.abs(dr) + Math.abs(dc) > 1 ? 1.4 : 1;
        queue.push({
          row: newRow,
          col: newCol,
          amplitude: amplitude * this.spreadDecay / distFactor,
          distance: 1
        });
      }
    }
  }

  private addCrossRipple(row: number, col: number, amplitude: number, queue: RippleEvent[]): void {
    for (const [dr, dc] of this.directions4) {
      const newRow = row + dr;
      const newCol = col + dc;
      const node = this.getNode(newRow, newCol);
      if (node && !node.isDragging && !node.resetting) {
        queue.push({
          row: newRow,
          col: newCol,
          amplitude: amplitude * this.spreadDecay,
          distance: 1
        });
      }
    }
  }

  private addRandomRipple(row: number, col: number, amplitude: number, queue: RippleEvent[]): void {
    const count = Math.floor(Math.random() * 4) + 3;
    const shuffled = [...this.directions8].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count && i < shuffled.length; i++) {
      const [dr, dc] = shuffled[i];
      const newRow = row + dr;
      const newCol = col + dc;
      const node = this.getNode(newRow, newCol);
      if (node && !node.isDragging && !node.resetting) {
        const randomFactor = 0.5 + Math.random() * 0.5;
        queue.push({
          row: newRow,
          col: newCol,
          amplitude: amplitude * this.spreadDecay * randomFactor,
          distance: 1
        });
      }
    }
  }

  update(deltaTime: number): void {
    const dt = Math.min(deltaTime, 0.05);

    this.spreadAccumulator += dt;
    const spreadInterval = 1 / this.spreadSpeed;
    
    while (this.spreadAccumulator >= spreadInterval) {
      this.spreadAccumulator -= spreadInterval;
      this.propagateRipples();
    }

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const node = this.nodes[row][col];
        
        if (node.resetting) {
          const elapsed = (performance.now() / 1000) - node.resetStartTime;
          if (elapsed >= this.resetDuration) {
            node.height = 0;
            node.velocity = 0;
            node.resetting = false;
          } else {
            const t = elapsed / this.resetDuration;
            const easeOutElastic = this.easeOutElastic(t);
            node.height = node.resetStartHeight * (1 - easeOutElastic);
            node.velocity = node.resetStartVelocity * (1 - easeOutElastic);
          }
          continue;
        }
        
        if (node.isDragging) continue;

        const springForce = (node.restHeight - node.height) * 0.15;
        node.velocity += springForce * dt * 60;
        node.velocity *= Math.pow(this.damping, dt * 60);
        node.height += node.velocity * dt * 60;

        if (Math.abs(node.height) < 0.001 && Math.abs(node.velocity) < 0.001) {
          node.height = node.restHeight;
          node.velocity = 0;
        }
      }
    }
  }

  private easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  private propagateRipples(): void {
    const currentQueue = this.useQueueA ? this.rippleQueueA : this.rippleQueueB;
    const nextQueue = this.useQueueA ? this.rippleQueueB : this.rippleQueueA;
    
    nextQueue.length = 0;
    this.processedSet.clear();

    for (let i = 0; i < currentQueue.length; i++) {
      const ripple = currentQueue[i];
      const key = ripple.row * this.cols + ripple.col;
      
      if (this.processedSet.has(key)) continue;
      this.processedSet.add(key);

      const node = this.nodes[ripple.row]?.[ripple.col];
      if (!node || node.isDragging || node.resetting) continue;

      node.velocity += ripple.amplitude;
      node.height += ripple.amplitude * 0.3;

      const nextAmplitude = ripple.amplitude * this.spreadDecay;
      if (nextAmplitude >= 0.1) {
        if (this.spreadMode === 'cross') {
          this.propagateCross(ripple, nextAmplitude, nextQueue);
        } else if (this.spreadMode === 'random') {
          this.propagateRandom(ripple, nextAmplitude, nextQueue);
        } else {
          this.propagateCircular(ripple, nextAmplitude, nextQueue);
        }
      }
    }

    this.useQueueA = !this.useQueueA;
  }

  private propagateCircular(
    ripple: RippleEvent,
    amplitude: number,
    queue: RippleEvent[]
  ): void {
    for (const [dr, dc] of this.directions8) {
      const newRow = ripple.row + dr;
      const newCol = ripple.col + dc;
      const key = newRow * this.cols + newCol;
      
      if (this.processedSet.has(key)) continue;
      if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) continue;

      const distFactor = Math.abs(dr) + Math.abs(dc) > 1 ? 1.4 : 1;
      queue.push({
        row: newRow,
        col: newCol,
        amplitude: amplitude / distFactor,
        distance: ripple.distance + 1
      });
    }
  }

  private propagateCross(
    ripple: RippleEvent,
    amplitude: number,
    queue: RippleEvent[]
  ): void {
    for (const [dr, dc] of this.directions4) {
      const newRow = ripple.row + dr;
      const newCol = ripple.col + dc;
      const key = newRow * this.cols + newCol;
      
      if (this.processedSet.has(key)) continue;
      if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) continue;

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
    queue: RippleEvent[]
  ): void {
    const count = Math.floor(Math.random() * 4) + 2;
    const shuffled = [...this.directions8].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count && i < shuffled.length; i++) {
      const [dr, dc] = shuffled[i];
      const newRow = ripple.row + dr;
      const newCol = ripple.col + dc;
      const key = newRow * this.cols + newCol;
      
      if (this.processedSet.has(key)) continue;
      if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) continue;

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
    this.rippleQueueA.length = 0;
    this.rippleQueueB.length = 0;

    if (!animated) {
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const node = this.nodes[row][col];
          node.height = 0;
          node.velocity = 0;
          node.isDragging = false;
          node.resetting = false;
        }
      }
      return;
    }

    const now = performance.now() / 1000;
    const centerRow = (this.rows - 1) / 2;
    const centerCol = (this.cols - 1) / 2;
    const maxDist = Math.sqrt(centerRow * centerRow + centerCol * centerCol);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const node = this.nodes[row][col];
        node.isDragging = false;
        
        const dist = Math.sqrt(
          Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
        );
        const delay = (dist / maxDist) * 0.15;
        
        if (Math.abs(node.height) < 0.001 && Math.abs(node.velocity) < 0.001) {
          node.height = 0;
          node.velocity = 0;
          node.resetting = false;
        } else {
          node.resetting = true;
          node.resetStartTime = now + delay;
          node.resetStartHeight = node.height;
          node.resetStartVelocity = node.velocity;
        }
      }
    }
  }

  getHeightRange(): { min: number; max: number } {
    return { min: this.minHeight, max: this.maxHeight };
  }
}
