import * as THREE from 'three';

export interface VertexInfo {
  index: number;
  distance: number;
  weight: number;
}

export class GeometryUtils {
  static computeNormals(
    positions: Float32Array,
    indices: Uint32Array | Uint16Array | null
  ): Float32Array {
    const vertexCount = positions.length / 3;
    const normals = new Float32Array(vertexCount * 3);
    const tempN = new THREE.Vector3();
    const tempP1 = new THREE.Vector3();
    const tempP2 = new THREE.Vector3();
    const tempP3 = new THREE.Vector3();

    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i] * 3;
        const i2 = indices[i + 1] * 3;
        const i3 = indices[i + 2] * 3;

        tempP1.set(positions[i1], positions[i1 + 1], positions[i1 + 2]);
        tempP2.set(positions[i2], positions[i2 + 1], positions[i2 + 2]);
        tempP3.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);

        tempP2.sub(tempP1);
        tempP3.sub(tempP1);
        tempN.crossVectors(tempP2, tempP3);

        normals[i1] += tempN.x;
        normals[i1 + 1] += tempN.y;
        normals[i1 + 2] += tempN.z;
        normals[i2] += tempN.x;
        normals[i2 + 1] += tempN.y;
        normals[i2 + 2] += tempN.z;
        normals[i3] += tempN.x;
        normals[i3 + 1] += tempN.y;
        normals[i3 + 2] += tempN.z;
      }
    } else {
      for (let i = 0; i < positions.length; i += 9) {
        tempP1.set(positions[i], positions[i + 1], positions[i + 2]);
        tempP2.set(positions[i + 3], positions[i + 4], positions[i + 5]);
        tempP3.set(positions[i + 6], positions[i + 7], positions[i + 8]);

        tempP2.sub(tempP1);
        tempP3.sub(tempP1);
        tempN.crossVectors(tempP2, tempP3);

        for (let j = 0; j < 9; j += 3) {
          normals[i + j] += tempN.x;
          normals[i + j + 1] += tempN.y;
          normals[i + j + 2] += tempN.z;
        }
      }
    }

    for (let i = 0; i < normals.length; i += 3) {
      const x = normals[i];
      const y = normals[i + 1];
      const z = normals[i + 2];
      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 0) {
        normals[i] = x / len;
        normals[i + 1] = y / len;
        normals[i + 2] = z / len;
      }
    }

    return normals;
  }

  static cloneGeometrySnapshot(positions: Float32Array): Float32Array {
    return new Float32Array(positions);
  }

  static applyPositionsToGeometry(
    geometry: THREE.BufferGeometry,
    positions: Float32Array
  ): void {
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.array.set(positions);
    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.attributes.normal.needsUpdate = true;
  }

  static findNearestVertices(
    positions: Float32Array,
    centerPoint: THREE.Vector3,
    radius: number
  ): VertexInfo[] {
    const result: VertexInfo[] = [];
    const radiusSq = radius * radius;

    for (let i = 0; i < positions.length; i += 3) {
      const dx = positions[i] - centerPoint.x;
      const dy = positions[i + 1] - centerPoint.y;
      const dz = positions[i + 2] - centerPoint.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq <= radiusSq) {
        const distance = Math.sqrt(distSq);
        result.push({
          index: i / 3,
          distance,
          weight: 1 - distance / radius
        });
      }
    }

    return result.sort((a, b) => a.distance - b.distance);
  }

  static computeVertexNormal(
    positions: Float32Array,
    indices: Uint32Array | Uint16Array | null,
    vertexIndex: number
  ): THREE.Vector3 {
    const normal = new THREE.Vector3(0, 0, 0);
    const tempP1 = new THREE.Vector3();
    const tempP2 = new THREE.Vector3();
    const tempP3 = new THREE.Vector3();
    const edge1 = new THREE.Vector3();
    const edge2 = new THREE.Vector3();
    const faceNormal = new THREE.Vector3();

    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i];
        const i2 = indices[i + 1];
        const i3 = indices[i + 2];

        if (i1 === vertexIndex || i2 === vertexIndex || i3 === vertexIndex) {
          tempP1.set(
            positions[i1 * 3],
            positions[i1 * 3 + 1],
            positions[i1 * 3 + 2]
          );
          tempP2.set(
            positions[i2 * 3],
            positions[i2 * 3 + 1],
            positions[i2 * 3 + 2]
          );
          tempP3.set(
            positions[i3 * 3],
            positions[i3 * 3 + 1],
            positions[i3 * 3 + 2]
          );

          edge1.subVectors(tempP2, tempP1);
          edge2.subVectors(tempP3, tempP1);
          faceNormal.crossVectors(edge1, edge2);
          normal.add(faceNormal);
        }
      }
    }

    return normal.normalize();
  }

  static buildAdjacencyList(
    indices: Uint32Array | Uint16Array | null,
    vertexCount: number
  ): number[][] {
    const adjacency: number[][] = Array.from({ length: vertexCount }, () => []);

    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];

        GeometryUtils.addEdge(adjacency, a, b);
        GeometryUtils.addEdge(adjacency, b, c);
        GeometryUtils.addEdge(adjacency, c, a);
      }
    } else {
      for (let i = 0; i < vertexCount; i += 3) {
        GeometryUtils.addEdge(adjacency, i, i + 1);
        GeometryUtils.addEdge(adjacency, i + 1, i + 2);
        GeometryUtils.addEdge(adjacency, i + 2, i);
      }
    }

    return adjacency;
  }

  private static addEdge(adjacency: number[][], a: number, b: number): void {
    if (!adjacency[a].includes(b)) adjacency[a].push(b);
    if (!adjacency[b].includes(a)) adjacency[b].push(a);
  }
}
