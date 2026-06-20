import { forceSimulation, forceCollide, forceCenter, forceX, forceY } from 'd3-force';
import { CuttingPieceData, LEATHER_BOUNDS, OPTIMIZATION_ITERATIONS } from '@/types';

interface SimNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  shape: string;
  radius: number;
}

export class LayoutOptimizer {
  private onProgress: (iteration: number, utilization: number) => void;

  constructor(onProgress: (iteration: number, utilization: number) => void) {
    this.onProgress = onProgress;
  }

  async optimize(
    pieces: CuttingPieceData[],
    density: number = 0.5
  ): Promise<CuttingPieceData[]> {
    const nodes: SimNode[] = pieces.map((p) => ({
      id: p.id,
      x: p.position.x,
      y: p.position.y,
      width: p.width * p.scale,
      height: p.height * p.scale,
      scale: p.scale,
      shape: p.shape,
      radius: Math.max(p.width, p.height) * p.scale * 0.55 * (1 + (1 - density) * 0.3),
    }));

    const hw = LEATHER_BOUNDS.width / 2 * 0.85;
    const hh = LEATHER_BOUNDS.height / 2 * 0.85;

    const simulation = forceSimulation<SimNode>(nodes)
      .force('collide', forceCollide<SimNode>((d) => d.radius).strength(0.8))
      .force('center', forceCenter(0, 0).strength(0.05))
      .force('x', forceX<SimNode>(0).strength(0.02))
      .force('y', forceY<SimNode>(0).strength(0.02))
      .stop();

    const piecesMap = new Map(pieces.map((p) => [p.id, p]));
    const totalIters = OPTIMIZATION_ITERATIONS;
    let completedIterations = 0;

    const runBatch = (batchSize: number): Promise<void> => {
      return new Promise((resolve) => {
        const step = () => {
          const end = Math.min(completedIterations + batchSize, totalIters);
          for (let i = completedIterations; i < end; i++) {
            simulation.tick();
          }
          completedIterations = end;

          const utilization = this.estimateUtilization(nodes);
          this.onProgress(completedIterations, utilization);

          if (completedIterations < totalIters) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    };

    await runBatch(5);

    const result = nodes.map((n) => {
      const original = piecesMap.get(n.id)!;
      return {
        ...original,
        position: {
          x: Math.max(-hw, Math.min(hw, n.x)),
          y: Math.max(-hh, Math.min(hh, n.y)),
        },
      };
    });

    return result;
  }

  private estimateUtilization(nodes: SimNode[]): number {
    const leatherArea = LEATHER_BOUNDS.width * LEATHER_BOUNDS.height;
    const totalPieceArea = nodes.reduce((sum, n) => {
      let area: number;
      switch (n.shape) {
        case 'circle':
          area = Math.PI * (n.width / 2) * (n.height / 2);
          break;
        case 'triangle':
          area = (n.width * n.height) / 2;
          break;
        default:
          area = n.width * n.height;
      }
      return sum + area;
    }, 0);
    return Math.min(1, totalPieceArea / leatherArea);
  }
}
