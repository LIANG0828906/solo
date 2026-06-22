import { Star } from './StarData';

export interface ConstellationLine {
  id: string;
  startStarId: string;
  endStarId: string;
}

export interface SavedConstellation {
  id: string;
  timestamp: number;
  lines: ConstellationLine[];
  lineCount: number;
}

export class ConstellationSystem {
  private lines: Map<string, ConstellationLine> = new Map();

  addLine(startStarId: string, endStarId: string): ConstellationLine | null {
    if (startStarId === endStarId) {
      return null;
    }
    
    const sortedIds = [startStarId, endStarId].sort();
    const lineId = `${sortedIds[0]}-${sortedIds[1]}`;
    
    if (this.lines.has(lineId)) {
      return null;
    }
    
    const line: ConstellationLine = {
      id: lineId,
      startStarId: sortedIds[0],
      endStarId: sortedIds[1],
    };
    
    this.lines.set(lineId, line);
    return line;
  }

  removeLine(lineId: string): boolean {
    return this.lines.delete(lineId);
  }

  clearAllLines(): void {
    this.lines.clear();
  }

  getLines(): ConstellationLine[] {
    return Array.from(this.lines.values());
  }

  getLineCount(): number {
    return this.lines.size;
  }

  hasLine(startStarId: string, endStarId: string): boolean {
    const sortedIds = [startStarId, endStarId].sort();
    const lineId = `${sortedIds[0]}-${sortedIds[1]}`;
    return this.lines.has(lineId);
  }

  static calculateDistance(star1: Star, star2: Star): number {
    const dx = star1.position[0] - star2.position[0];
    const dy = star1.position[1] - star2.position[1];
    const dz = star1.position[2] - star2.position[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  serialize(): string {
    return JSON.stringify({
      lines: Array.from(this.lines.values()),
    });
  }

  static deserialize(json: string): ConstellationLine[] {
    try {
      const data = JSON.parse(json);
      return data.lines || [];
    } catch {
      return [];
    }
  }

  loadLines(lines: ConstellationLine[]): void {
    this.lines.clear();
    for (const line of lines) {
      this.lines.set(line.id, line);
    }
  }
}
