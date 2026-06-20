import type { PathConfig } from './GameState';
import { v4 as uuidv4 } from 'uuid';

export class PathGenerator {
  generatePath(options?: {
    crystalDensity?: number;
    batIntensity?: number;
    width?: number;
  }): PathConfig {
    const crystalDensity =
      options?.crystalDensity ?? Math.random() * 0.5 + 0.5;
    const batIntensity =
      options?.batIntensity ?? Math.random() * 0.5 + 0.3;
    const width = options?.width ?? 1280 * 0.3;

    const centerY = 360;
    const halfWidth = width / 2;

    return {
      id: uuidv4(),
      crystalDensity,
      batIntensity,
      width,
      topBoundary: this.generateBoundaryFunction(
        centerY - halfWidth,
        40
      ),
      bottomBoundary: this.generateBoundaryFunction(
        centerY + halfWidth,
        40
      ),
    };
  }

  generateFork(): { left: PathConfig; right: PathConfig } {
    const left = this.generatePath({
      crystalDensity: Math.random() * 0.2 + 0.8,
      batIntensity: Math.random() * 0.2 + 0.7,
    });

    const right = this.generatePath({
      crystalDensity: Math.random() * 0.2 + 0.2,
      batIntensity: Math.random() * 0.2 + 0.1,
    });

    return { left, right };
  }

  private generateBoundaryFunction(
    baseOffset: number,
    variation: number
  ): (x: number) => number {
    const seed1 = Math.random() * Math.PI * 2;
    const seed2 = Math.random() * Math.PI * 2;
    const seed3 = Math.random() * Math.PI * 2;

    return (x: number): number => {
      const wave1 = Math.sin(x * (1 / 200) + seed1) * variation * 0.5;
      const wave2 = Math.sin(x * (1 / 350) + seed2) * variation * 0.3;
      const wave3 = Math.sin(x * (1 / 500) + seed3) * variation * 0.2;
      const noise = (Math.random() - 0.5) * variation * 0.15;

      return baseOffset + wave1 + wave2 + wave3 + noise;
    };
  }
}
