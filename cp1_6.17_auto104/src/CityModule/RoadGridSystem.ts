import * as THREE from 'three';
import { LineSegments, BufferGeometry, LineBasicMaterial, Vector3, Float32BufferAttribute } from 'three';

export class RoadGridSystem {
  public generateRoadGrid(
    centerX: number,
    centerZ: number,
    size: number,
    gridSize: number
  ): LineSegments {
    const halfSize = size / 2;
    const positions: number[] = [];

    for (let x = -halfSize; x <= halfSize; x += gridSize) {
      positions.push(centerX + x, 0.01, centerZ - halfSize);
      positions.push(centerX + x, 0.01, centerZ + halfSize);
    }

    for (let z = -halfSize; z <= halfSize; z += gridSize) {
      positions.push(centerX - halfSize, 0.01, centerZ + z);
      positions.push(centerX + halfSize, 0.01, centerZ + z);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

    const material = new LineBasicMaterial({
      color: 0x333333,
      linewidth: 1,
      transparent: true,
      opacity: 0.8,
    });

    const lineSegments = new LineSegments(geometry, material);
    lineSegments.name = 'RoadGrid';
    lineSegments.renderOrder = 1;

    return lineSegments;
  }

  public dispose(): void {
  }
}
