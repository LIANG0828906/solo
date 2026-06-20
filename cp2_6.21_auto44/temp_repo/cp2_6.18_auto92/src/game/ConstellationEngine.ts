import { Star, Constellation } from '../store/gameStore';

type EventCallback = (data: unknown) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data: unknown): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
}

export const eventBus = new EventBus();

export interface MatchResult {
  matched: boolean;
  accuracy: number;
  matchedStarIndices: number[];
}

export class ConstellationMatcher {
  private constellation: Constellation | null = null;
  private constellationStars: Star[] = [];
  private tolerance: number = 5;

  setConstellation(constellation: Constellation, stars: Star[]): void {
    this.constellation = constellation;
    this.constellationStars = stars.slice(0, constellation.starPositions.length);
  }

  setTolerance(tolerance: number): void {
    this.tolerance = tolerance;
  }

  getConstellationStarCount(): number {
    return this.constellationStars.length;
  }

  matchConstellation(_playerPath: { x: number; y: number }[], selectedStars: Star[]): MatchResult {
    if (!this.constellation || selectedStars.length < this.constellationStars.length) {
      return { matched: false, accuracy: 0, matchedStarIndices: [] };
    }

    const matchedStarIndices: number[] = [];
    let totalDistance = 0;
    let matchedCount = 0;

    for (let i = 0; i < this.constellationStars.length; i++) {
      const constellationStar = this.constellationStars[i];
      let minDistance = Infinity;
      let matchedPlayerStar: Star | null = null;

      for (const playerStar of selectedStars) {
        const distance = Math.sqrt(
          (playerStar.x - constellationStar.x) ** 2 +
          (playerStar.y - constellationStar.y) ** 2
        );
        if (distance < minDistance) {
          minDistance = distance;
          matchedPlayerStar = playerStar;
        }
      }

      if (matchedPlayerStar && minDistance <= this.tolerance * 6) {
        totalDistance += minDistance;
        matchedCount++;
        const index = selectedStars.findIndex((s) => s.id === matchedPlayerStar!.id);
        if (index !== -1 && !matchedStarIndices.includes(index)) {
          matchedStarIndices.push(index);
        }
      }
    }

    const allConnectionsMatched = this.checkConnections(
      selectedStars,
      matchedStarIndices
    );

    const accuracy =
      matchedCount > 0
        ? (1 - totalDistance / (matchedCount * this.tolerance * 6)) * 100
        : 0;

    const matched =
      matchedCount >= this.constellationStars.length &&
      allConnectionsMatched &&
      accuracy >= 60;

    return {
      matched,
      accuracy: Math.max(0, Math.min(100, accuracy)),
      matchedStarIndices,
    };
  }

  private checkConnections(
    _selectedStars: Star[],
    matchedStarIndices: number[]
  ): boolean {
    if (!this.constellation || matchedStarIndices.length < 2) return false;

    const playerConnections: Set<string> = new Set();
    for (let i = 0; i < matchedStarIndices.length - 1; i++) {
      const idx1 = Math.min(matchedStarIndices[i], matchedStarIndices[i + 1]);
      const idx2 = Math.max(matchedStarIndices[i], matchedStarIndices[i + 1]);
      playerConnections.add(`${idx1}-${idx2}`);
    }

    let matchedConnections = 0;
    for (const [from, to] of this.constellation.connections) {
      const idx1 = Math.min(from, to);
      const idx2 = Math.max(from, to);
      if (playerConnections.has(`${idx1}-${idx2}`)) {
        matchedConnections++;
      }
    }

    return matchedConnections >= this.constellation.connections.length * 0.6;
  }

  checkProximity(
    x: number,
    y: number,
    stars: Star[],
    radius: number = 20
  ): Star | null {
    for (const star of stars) {
      const distance = Math.sqrt((star.x - x) ** 2 + (star.y - y) ** 2);
      if (distance <= radius) {
        return star;
      }
    }
    return null;
  }
}

export const constellationMatcher = new ConstellationMatcher();

export const EVENTS = {
  STAR_SELECTED: 'starSelected',
  CONSTELLATION_MATCHED: 'constellationMatched',
  CONSTELLATION_MISMATCHED: 'constellationMismatched',
  SCORE_UPDATED: 'scoreUpdated',
  TIME_UPDATED: 'timeUpdated',
} as const;
