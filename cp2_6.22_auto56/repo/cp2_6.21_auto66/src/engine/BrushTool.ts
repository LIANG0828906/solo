import * as THREE from 'three';
import { GeometryUtils, VertexInfo } from './GeometryUtils';

export interface BrushParams {
  size: number;
  intensity: number;
  hardness: number;
  type: 'pull' | 'smooth' | 'inflate';
}

export class BrushTool {
  static applyBrush(
    positions: Float32Array,
    indices: Uint32Array | Uint16Array | null,
    hitPointLocal: THREE.Vector3,
    viewDirection: THREE.Vector3,
    params: BrushParams,
    adjacencyList?: number[][]
  ): Float32Array {
    const affectedVertices = GeometryUtils.findNearestVertices(
      positions,
      hitPointLocal,
      params.size
    );

    if (affectedVertices.length === 0) return positions;

    const newPositions = new Float32Array(positions);

    const weightedVertices = affectedVertices.map((v) => ({
      ...v,
      weight: BrushTool.calculateBrushWeight(v.distance, params.size, params.hardness)
    }));

    switch (params.type) {
      case 'pull':
        return BrushTool.pull(
          newPositions,
          weightedVertices,
          viewDirection,
          params.intensity
        );
      case 'smooth':
        return BrushTool.smooth(
          newPositions,
          indices,
          weightedVertices,
          params.intensity,
          adjacencyList
        );
      case 'inflate':
        return BrushTool.inflate(
          newPositions,
          indices,
          weightedVertices,
          params.intensity
        );
      default:
        return positions;
    }
  }

  private static calculateBrushWeight(
    distance: number,
    radius: number,
    hardness: number
  ): number {
    if (radius <= 0 || distance > radius) return 0;

    const t = distance / radius;

    if (hardness >= 1) {
      return t < 1 ? 1 : 0;
    }

    const softness = 1 - hardness;
    const falloffRadius = radius * softness;
    const innerRadius = radius - falloffRadius;

    if (t <= innerRadius / radius) {
      return 1;
    }

    const x = (t - innerRadius / radius) / (falloffRadius / radius);
    const smoothFalloff = 1 - x * x * (3 - 2 * x);

    return Math.max(0, Math.min(1, smoothFalloff));
  }

  static pull(
    positions: Float32Array,
    affectedVertices: (VertexInfo & { weight: number })[],
    viewDirection: THREE.Vector3,
    intensity: number
  ): Float32Array {
    const direction = viewDirection.clone().normalize();
    const displacementAmount = intensity * 0.3;

    for (const vertex of affectedVertices) {
      const idx = vertex.index * 3;
      const w = vertex.weight;

      positions[idx] += direction.x * displacementAmount * w;
      positions[idx + 1] += direction.y * displacementAmount * w;
      positions[idx + 2] += direction.z * displacementAmount * w;
    }

    return positions;
  }

  static smooth(
    positions: Float32Array,
    indices: Uint32Array | Uint16Array | null,
    affectedVertices: (VertexInfo & { weight: number })[],
    intensity: number,
    adjacencyList?: number[][]
  ): Float32Array {
    const vertexCount = positions.length / 3;
    const adjacency =
      adjacencyList || GeometryUtils.buildAdjacencyList(indices, vertexCount);

    const originalPositions = new Float32Array(positions);

    for (const vertex of affectedVertices) {
      const neighbors = adjacency[vertex.index];
      if (neighbors.length === 0) continue;

      const avgPos = new THREE.Vector3(0, 0, 0);
      let totalWeight = 0;

      for (const neighborIdx of neighbors) {
        avgPos.x += originalPositions[neighborIdx * 3];
        avgPos.y += originalPositions[neighborIdx * 3 + 1];
        avgPos.z += originalPositions[neighborIdx * 3 + 2];
        totalWeight += 1;
      }

      if (totalWeight > 0) {
        avgPos.divideScalar(totalWeight);
      }

      const smoothAmount = intensity * vertex.weight;
      const idx = vertex.index * 3;

      positions[idx] =
        originalPositions[idx] * (1 - smoothAmount) + avgPos.x * smoothAmount;
      positions[idx + 1] =
        originalPositions[idx + 1] * (1 - smoothAmount) +
        avgPos.y * smoothAmount;
      positions[idx + 2] =
        originalPositions[idx + 2] * (1 - smoothAmount) +
        avgPos.z * smoothAmount;
    }

    return positions;
  }

  static inflate(
    positions: Float32Array,
    indices: Uint32Array | Uint16Array | null,
    affectedVertices: (VertexInfo & { weight: number })[],
    intensity: number
  ): Float32Array {
    const displacementAmount = intensity * 0.3;

    for (const vertex of affectedVertices) {
      const normal = GeometryUtils.computeVertexNormal(
        positions,
        indices,
        vertex.index
      );

      const displacement = normal.multiplyScalar(
        displacementAmount * vertex.weight
      );

      const idx = vertex.index * 3;
      positions[idx] += displacement.x;
      positions[idx + 1] += displacement.y;
      positions[idx + 2] += displacement.z;
    }

    return positions;
  }
}
