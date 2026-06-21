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
    hitPoint: THREE.Vector3,
    viewDirection: THREE.Vector3,
    params: BrushParams,
    adjacencyList?: number[][]
  ): Float32Array {
    const affectedVertices = GeometryUtils.findNearestVertices(
      positions,
      hitPoint,
      params.size
    );

    if (affectedVertices.length === 0) return positions;

    const newPositions = new Float32Array(positions);

    switch (params.type) {
      case 'pull':
        return BrushTool.pull(
          newPositions,
          hitPoint,
          viewDirection,
          affectedVertices,
          params
        );
      case 'smooth':
        return BrushTool.smooth(
          newPositions,
          indices,
          affectedVertices,
          params,
          adjacencyList
        );
      case 'inflate':
        return BrushTool.inflate(
          newPositions,
          indices,
          hitPoint,
          affectedVertices,
          params
        );
      default:
        return positions;
    }
  }

  static pull(
    positions: Float32Array,
    hitPoint: THREE.Vector3,
    viewDirection: THREE.Vector3,
    affectedVertices: VertexInfo[],
    params: BrushParams
  ): Float32Array {
    const direction = viewDirection.clone().normalize();
    const displacement = direction.multiplyScalar(params.intensity * 0.1);

    for (const vertex of affectedVertices) {
      const weight = BrushTool.getFalloffWeight(vertex.weight, params.hardness);
      const idx = vertex.index * 3;

      positions[idx] += displacement.x * weight;
      positions[idx + 1] += displacement.y * weight;
      positions[idx + 2] += displacement.z * weight;
    }

    return positions;
  }

  static smooth(
    positions: Float32Array,
    indices: Uint32Array | Uint16Array | null,
    affectedVertices: VertexInfo[],
    params: BrushParams,
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
      for (const neighborIdx of neighbors) {
        avgPos.x += originalPositions[neighborIdx * 3];
        avgPos.y += originalPositions[neighborIdx * 3 + 1];
        avgPos.z += originalPositions[neighborIdx * 3 + 2];
      }
      avgPos.divideScalar(neighbors.length);

      const weight = BrushTool.getFalloffWeight(vertex.weight, params.hardness);
      const smoothAmount = params.intensity * weight;

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
    hitPoint: THREE.Vector3,
    affectedVertices: VertexInfo[],
    params: BrushParams
  ): Float32Array {
    for (const vertex of affectedVertices) {
      const normal = GeometryUtils.computeVertexNormal(
        positions,
        indices,
        vertex.index
      );

      const weight = BrushTool.getFalloffWeight(vertex.weight, params.hardness);
      const displacement = normal.multiplyScalar(params.intensity * 0.1 * weight);

      const idx = vertex.index * 3;
      positions[idx] += displacement.x;
      positions[idx + 1] += displacement.y;
      positions[idx + 2] += displacement.z;
    }

    return positions;
  }

  private static getFalloffWeight(
    distanceWeight: number,
    hardness: number
  ): number {
    const softness = 1 - hardness;
    if (softness === 0) {
      return distanceWeight > 0 ? 1 : 0;
    }
    const falloff = Math.pow(distanceWeight, 1 / (softness + 0.01));
    return falloff;
  }
}
