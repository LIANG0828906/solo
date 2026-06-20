import { Camel } from './camel.ts';

export interface MapPoint {
  x: number;
  y: number;
}

export interface Oasis {
  x: number;
  y: number;
  radius: number;
}

export interface Sandstorm {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  opacity: number;
}

export interface Town {
  x: number;
  y: number;
  size: number;
  name: string;
  visited: boolean;
}

export interface SandParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export class GameMap {
  private width: number;
  private height: number;
  private oases: Oasis[];
  private sandstorms: Sandstorm[];
  private towns: Town[];
  private path: MapPoint[];
  private currentPathIndex: number;
  private sandParticles: SandParticle[];
  private gridSize: number;
  private heatWaveOffset: number;
  private screenShake: number;
  private screenShakeTime: number;
  private pathDashOffset: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.oases = [];
    this.sandstorms = [];
    this.towns = [];
    this.path = [];
    this.currentPathIndex = 0;
    this.sandParticles = [];
    this.gridSize = 40;
    this.heatWaveOffset = 0;
    this.screenShake = 0;
    this.screenShakeTime = 0;
    this.pathDashOffset = 0;
    this.initializeMapElements();
  }

  private initializeMapElements(): void {
    this.oases = [
      { x: 300, y: 400, radius: 40 },
      { x: 800, y: 600, radius: 35 },
      { x: 1200, y: 300, radius: 45 },
      { x: 500, y: 900, radius: 38 },
    ];

    this.sandstorms = [
      { x: 600, y: 200, width: 200, height: 150, vx: 0.3, vy: 0.2, opacity: 0.4 },
      { x: 1000, y: 700, width: 180, height: 130, vx: -0.25, vy: 0.15, opacity: 0.35 },
    ];

    this.towns = [
      { x: 200, y: 200, size: 70, name: '起始城镇', visited: true },
      { x: 1400, y: 250, size: 75, name: '绿洲城', visited: false },
      { x: 1300, y: 1000, size: 80, name: '沙漠商都', visited: false },
    ];
  }

  public findPath(startX: number, startY: number, endX: number, endY: number): MapPoint[] {
    const startTime = performance.now();

    const startNode: PathNode = {
      x: Math.floor(startX / this.gridSize),
      y: Math.floor(startY / this.gridSize),
      g: 0,
      h: 0,
      f: 0,
      parent: null
    };

    const endNode: PathNode = {
      x: Math.floor(endX / this.gridSize),
      y: Math.floor(endY / this.gridSize),
      g: 0,
      h: 0,
      f: 0,
      parent: null
    };

    const openList: PathNode[] = [startNode];
    const closedSet: Set<string> = new Set();
    const nodeMap: Map<string, PathNode> = new Map();

    const getKey = (x: number, y: number) => `${x},${y}`;

    const heuristic = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    };

    startNode.h = heuristic(startNode.x, startNode.y, endNode.x, endNode.y);
    startNode.f = startNode.h;
    nodeMap.set(getKey(startNode.x, startNode.y), startNode);

    while (openList.length > 0) {
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;

      if (current.x === endNode.x && current.y === endNode.y) {
        const path: MapPoint[] = [];
        let node: PathNode | null = current;
        while (node) {
          path.unshift({
            x: node.x * this.gridSize + this.gridSize / 2,
            y: node.y * this.gridSize + this.gridSize / 2
          });
          node = node.parent;
        }
        return path;
      }

      closedSet.add(getKey(current.x, current.y));

      const neighbors = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: -1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: 1, dy: 1 }
      ];

      for (const neighbor of neighbors) {
        const nx = current.x + neighbor.dx;
        const ny = current.y + neighbor.dy;

        if (nx < 0 || nx >= Math.ceil(this.width / this.gridSize) ||
            ny < 0 || ny >= Math.ceil(this.height / this.gridSize)) {
          continue;
        }

        const key = getKey(nx, ny);
        if (closedSet.has(key)) continue;

        const moveCost = (neighbor.dx !== 0 && neighbor.dy !== 0) ? 1.4 : 1;
        const g = current.g + moveCost;

        let neighborNode = nodeMap.get(key);
        if (!neighborNode) {
          neighborNode = {
            x: nx,
            y: ny,
            g,
            h: heuristic(nx, ny, endNode.x, endNode.y),
            f: g + heuristic(nx, ny, endNode.x, endNode.y),
            parent: current
          };
          nodeMap.set(key, neighborNode);
          openList.push(neighborNode);
        } else if (g < neighborNode.g) {
          neighborNode.g = g;
          neighborNode.f = g + neighborNode.h;
          neighborNode.parent = current;
        }
      }

      if (performance.now() - startTime > 10) {
        break;
      }
    }

    return [
      { x: startX, y: startY },
      { x: endX, y: endY }
    ];
  }

  public setPath(path: MapPoint[]): void {
    this.path = path;
    this.currentPathIndex = 0;
  }

  public getNextPathPoint(): MapPoint | null {
    if (this.currentPathIndex >= this.path.length) {
      return null;
    }
    return this.path[this.currentPathIndex];
  }

  public advancePath(): void {
    this.currentPathIndex++;
  }

  public isPathComplete(): boolean {
    return this.currentPathIndex >= this.path.length;
  }

  public getPath(): MapPoint[] {
    return this.path.slice(this.currentPathIndex);
  }

  public update(deltaTime: number, camels: Camel[]): void {
    this.heatWaveOffset += deltaTime * 0.5;

    this.screenShakeTime -= deltaTime;
    if (this.screenShakeTime > 0) {
      this.screenShake = Math.sin(Date.now() * 0.01) * 2;
    } else {
      this.screenShake = 0;
    }

    this.pathDashOffset += deltaTime * 30;

    for (const storm of this.sandstorms) {
      storm.x += storm.vx * deltaTime * 60;
      storm.y += storm.vy * deltaTime * 60;

      if (storm.x < 0 || storm.x > this.width - storm.width) {
        storm.vx *= -1;
      }
      if (storm.y < 0 || storm.y > this.height - storm.height) {
        storm.vy *= -1;
      }
    }

    this.updateSandParticles(deltaTime, camels);
  }

  private updateSandParticles(deltaTime: number, camels: Camel[]): void {
    for (const camel of camels) {
      if (camel.state.isAlive && camel.isMovingState()) {
        if (Math.random() < 0.3) {
          const angle = camel.state.direction + Math.PI + (Math.random() - 0.5) * 0.5;
          const speed = 1 + Math.random() * 2;
          this.sandParticles.push({
            x: camel.state.x - Math.cos(camel.state.direction) * 10,
            y: camel.state.y - Math.sin(camel.state.direction) * 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5,
            life: 0.2,
            maxLife: 0.2,
            size: 2 + Math.random() * 3
          });
        }
      }
    }

    for (let i = this.sandParticles.length - 1; i >= 0; i--) {
      const p = this.sandParticles[i];
      p.x += p.vx * deltaTime * 60;
      p.y += p.vy * deltaTime * 60;
      p.life -= deltaTime;
      p.vy += 0.1 * deltaTime * 60;

      if (p.life <= 0) {
        this.sandParticles.splice(i, 1);
      }
    }

    if (this.sandParticles.length > 200) {
      this.sandParticles = this.sandParticles.slice(-200);
    }
  }

  public addScreenShake(duration: number): void {
    this.screenShakeTime = duration;
  }

  public getScreenShake(): number {
    return this.screenShake;
  }

  public render(ctx: CanvasRenderingContext2D, camels: Camel[], scale: number, offsetX: number, offsetY: number): void {
    ctx.save();
    ctx.translate(offsetX + this.screenShake, offsetY + this.screenShake);
    ctx.scale(scale, scale);

    this.drawDesertBackground(ctx);
    this.drawPath(ctx);
    this.drawOases(ctx);
    this.drawTowns(ctx);
    this.drawSandstorms(ctx);
    this.drawSandParticles(ctx);
    this.drawCamels(ctx, camels);

    ctx.restore();
  }

  private drawDesertBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#F5DEB3');
    gradient.addColorStop(1, '#E8D8A8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = 'rgba(210, 180, 140, 0.3)';
    for (let i = 0; i < 8; i++) {
      const y = (i * 200 + Math.sin(this.heatWaveOffset * 0.3 + i) * 20) % this.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < this.width; x += 50) {
        ctx.lineTo(x, y + Math.sin(x * 0.01 + this.heatWaveOffset * 0.2 + i) * 15);
      }
      ctx.lineTo(this.width, y + 50);
      ctx.lineTo(0, y + 50);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawPath(ctx: CanvasRenderingContext2D): void {
    if (this.path.length <= this.currentPathIndex) return;

    ctx.save();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -this.pathDashOffset;
    ctx.lineCap = 'round';

    ctx.beginPath();
    const startPoint = this.path[this.currentPathIndex];
    ctx.moveTo(startPoint.x, startPoint.y);

    for (let i = this.currentPathIndex + 1; i < this.path.length; i++) {
      ctx.lineTo(this.path[i].x, this.path[i].y);
    }

    ctx.stroke();
    ctx.restore();
  }

  private drawOases(ctx: CanvasRenderingContext2D): void {
    for (const oasis of this.oases) {
      ctx.save();

      const gradient = ctx.createRadialGradient(
        oasis.x, oasis.y, 0,
        oasis.x, oasis.y, oasis.radius * 1.5
      );
      gradient.addColorStop(0, 'rgba(34, 139, 34, 0.4)');
      gradient.addColorStop(1, 'rgba(34, 139, 34, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(oasis.x, oasis.y, oasis.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(oasis.x, oasis.y, oasis.radius, 0, Math.PI * 2);
      ctx.fill();

      const waterGradient = ctx.createRadialGradient(
        oasis.x - oasis.radius * 0.2, oasis.y - oasis.radius * 0.2, 0,
        oasis.x, oasis.y, oasis.radius * 0.6
      );
      waterGradient.addColorStop(0, '#87CEEB');
      waterGradient.addColorStop(1, '#1E90FF');
      ctx.fillStyle = waterGradient;
      ctx.beginPath();
      ctx.arc(oasis.x, oasis.y, oasis.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      this.drawPalmTree(ctx, oasis.x - oasis.radius * 0.5, oasis.y - oasis.radius * 0.3, 1);
      this.drawPalmTree(ctx, oasis.x + oasis.radius * 0.4, oasis.y - oasis.radius * 0.5, 2);
      this.drawPalmTree(ctx, oasis.x + oasis.radius * 0.2, oasis.y + oasis.radius * 0.4, 3);

      ctx.restore();
    }
  }

  private drawPalmTree(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number = 0): void {
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(x - 4, y + 25);
    ctx.lineTo(x - 2, y - 5);
    ctx.lineTo(x + 2, y - 5);
    ctx.lineTo(x + 4, y + 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2E8B2E';
    const leafCount = 7;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2 - Math.PI / 2 + seed * 0.1;
      const leafLength = 16 + (i % 3) * 4;

      ctx.save();
      ctx.translate(x, y - 5);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(leafLength * 0.5, -5, leafLength, 0);
      ctx.quadraticCurveTo(leafLength * 0.5, 5, 0, 0);
      ctx.fill();

      ctx.strokeStyle = '#1E6E1E';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(leafLength - 2, 0);
      ctx.stroke();

      ctx.restore();
    }

    ctx.fillStyle = '#6B3410';
    ctx.beginPath();
    ctx.arc(x, y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTowns(ctx: CanvasRenderingContext2D): void {
    for (const town of this.towns) {
      ctx.save();

      ctx.fillStyle = '#8B7355';
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 2;

      const halfSize = town.size / 2;
      ctx.fillRect(town.x - halfSize, town.y - halfSize, town.size, town.size);
      ctx.strokeRect(town.x - halfSize, town.y - halfSize, town.size, town.size);

      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.moveTo(town.x - halfSize - 5, town.y - halfSize);
      ctx.lineTo(town.x, town.y - halfSize - 20);
      ctx.lineTo(town.x + halfSize + 5, town.y - halfSize);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5D4037';
      ctx.fillRect(town.x - 8, town.y, 16, 20);

      ctx.fillStyle = '#F5DEB3';
      ctx.fillRect(town.x - halfSize + 10, town.y - halfSize + 10, 12, 12);
      ctx.fillRect(town.x + halfSize - 22, town.y - halfSize + 10, 12, 12);
      ctx.fillRect(town.x - halfSize + 10, town.y + 10, 12, 12);

      ctx.fillStyle = '#3B1F0B';
      ctx.font = 'bold 14px KaiTi, 楷体, serif';
      ctx.textAlign = 'center';
      ctx.fillText(town.name, town.x, town.y + halfSize + 20);

      if (town.visited) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(town.x + halfSize, town.y - halfSize, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3B1F0B';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', town.x + halfSize, town.y - halfSize);
      }

      ctx.restore();
    }
  }

  private drawSandstorms(ctx: CanvasRenderingContext2D): void {
    for (const storm of this.sandstorms) {
      ctx.save();

      const gradient = ctx.createRadialGradient(
        storm.x + storm.width / 2, storm.y + storm.height / 2, 0,
        storm.x + storm.width / 2, storm.y + storm.height / 2, storm.width / 2
      );
      gradient.addColorStop(0, `rgba(210, 180, 140, ${storm.opacity})`);
      gradient.addColorStop(1, 'rgba(210, 180, 140, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(
        storm.x + storm.width / 2,
        storm.y + storm.height / 2,
        storm.width / 2,
        storm.height / 2,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#D2B48C';
      for (let i = 0; i < 20; i++) {
        const px = storm.x + Math.random() * storm.width;
        const py = storm.y + Math.random() * storm.height;
        const size = 2 + Math.random() * 4;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawSandParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.sandParticles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCamels(ctx: CanvasRenderingContext2D, camels: Camel[]): void {
    for (const camel of camels) {
      if (!camel.state.isAlive) {
        this.drawDeadCamel(ctx, camel);
      } else {
        this.drawCamel(ctx, camel);
      }
    }
  }

  private drawCamel(ctx: CanvasRenderingContext2D, camel: Camel): void {
    const { x, y, direction, walkCycle } = camel.state;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(direction);

    const bobOffset = Math.sin(walkCycle) * 2;

    ctx.fillStyle = '#C4A882';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(0, bobOffset, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-5, -10 + bobOffset, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(8, -8 + bobOffset, 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(22, -5 + bobOffset, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(25, -8 + bobOffset);
    ctx.quadraticCurveTo(30, -15 + bobOffset, 28, -20 + bobOffset);
    ctx.quadraticCurveTo(26, -22 + bobOffset, 24, -20 + bobOffset);
    ctx.quadraticCurveTo(27, -15 + bobOffset, 28, -10 + bobOffset);
    ctx.closePath();
    ctx.fillStyle = '#C4A882';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(25, -6 + bobOffset, 1.5, 0, Math.PI * 2);
    ctx.fill();

    const legPhase = walkCycle * 2;
    const legPositions = [
      { x: -10, front: false },
      { x: -4, front: false },
      { x: 8, front: true },
      { x: 14, front: true }
    ];

    for (let i = 0; i < legPositions.length; i++) {
      const leg = legPositions[i];
      const phase = legPhase + (i % 2 === 0 ? 0 : Math.PI);
      const legY = leg.front ? Math.sin(phase) * 5 : Math.sin(phase + Math.PI) * 5;

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(leg.x, 10 + bobOffset);
      ctx.lineTo(leg.x + Math.sin(phase) * 3, 20 + legY + bobOffset);
      ctx.stroke();

      ctx.fillStyle = '#C4A882';
      ctx.beginPath();
      ctx.arc(leg.x + Math.sin(phase) * 3, 22 + legY + bobOffset, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -2 + bobOffset);
    ctx.quadraticCurveTo(-28, -5 + bobOffset, -25, -10 + bobOffset);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const fy = -15 + bobOffset + i * 6;
      ctx.beginPath();
      ctx.moveTo(-15, fy);
      ctx.quadraticCurveTo(-10, fy - 2, -5, fy);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawDeadCamel(ctx: CanvasRenderingContext2D, camel: Camel): void {
    const { x, y } = camel.state;

    ctx.save();
    ctx.translate(x, y);

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#A0896C';
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(0, 5, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', 0, -5);

    ctx.restore();
  }

  public checkOasisCollision(x: number, y: number, radius: number): Oasis | null {
    for (const oasis of this.oases) {
      const dx = x - oasis.x;
      const dy = y - oasis.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < oasis.radius + radius) {
        return oasis;
      }
    }
    return null;
  }

  public checkTownCollision(x: number, y: number): Town | null {
    for (const town of this.towns) {
      const halfSize = town.size / 2;
      if (x >= town.x - halfSize - 20 && x <= town.x + halfSize + 20 &&
          y >= town.y - halfSize - 20 && y <= town.y + halfSize + 20) {
        return town;
      }
    }
    return null;
  }

  public checkSandstormCollision(x: number, y: number): boolean {
    for (const storm of this.sandstorms) {
      const dx = x - (storm.x + storm.width / 2);
      const dy = y - (storm.y + storm.height / 2);
      const normalizedDx = dx / (storm.width / 2);
      const normalizedDy = dy / (storm.height / 2);
      if (normalizedDx * normalizedDx + normalizedDy * normalizedDy < 1) {
        return true;
      }
    }
    return false;
  }

  public visitTown(town: Town): void {
    town.visited = true;
  }

  public getTowns(): Town[] {
    return this.towns;
  }

  public getVisitedTownCount(): number {
    return this.towns.filter(t => t.visited).length;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getSandstorms(): Sandstorm[] {
    return this.sandstorms;
  }

  public reset(): void {
    this.path = [];
    this.currentPathIndex = 0;
    this.sandParticles = [];
    for (const town of this.towns) {
      town.visited = (town.name === '起始城镇');
    }
  }
}
