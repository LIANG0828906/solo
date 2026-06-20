import type { Vertex3D, UVCoord, Face, ModelData, ValidationResult } from '../types';

const MIN_TRIANGLE_AREA = 1e-6;

export function parseOBJ(content: string): ModelData {
  const vertices: Vertex3D[] = [];
  const uvs: UVCoord[] = [];
  const faces: Face[] = [];

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;

    const parts = trimmed.split(/\s+/);

    if (parts[0] === 'v' && parts.length >= 4) {
      vertices.push({
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3]),
      });
    } else if (parts[0] === 'vt' && parts.length >= 3) {
      uvs.push({
        u: parseFloat(parts[1]),
        v: parseFloat(parts[2]),
      });
    } else if (parts[0] === 'f' && parts.length >= 4) {
      const faceVertexIndices: number[] = [];
      const faceUVIndices: number[] = [];

      for (let i = 1; i < parts.length; i++) {
        const faceParts = parts[i].split('/');
        const vIdx = parseInt(faceParts[0]) - 1;
        const vtIdx = faceParts[1] ? parseInt(faceParts[1]) - 1 : -1;
        faceVertexIndices.push(vIdx);
        faceUVIndices.push(vtIdx);
      }

      for (let i = 1; i < faceVertexIndices.length - 1; i++) {
        const triVerts: [number, number, number] = [
          faceVertexIndices[0],
          faceVertexIndices[i],
          faceVertexIndices[i + 1],
        ];
        const triUVs: [number, number, number] = [
          faceUVIndices[0],
          faceUVIndices[i],
          faceUVIndices[i + 1],
        ];

        const v0 = vertices[triVerts[0]];
        const v1 = vertices[triVerts[1]];
        const v2 = vertices[triVerts[2]];
        const area = calculateTriangleArea3D(v0, v1, v2);

        faces.push({
          vertexIndices: triVerts,
          uvIndices: triUVs,
          area,
          color: '',
        });
      }
    }
  }

  const hasUVs = uvs.length > 0 && faces.every(f => f.uvIndices.every(i => i >= 0));

  if (!hasUVs) {
    const generatedUVs = generatePlanarUVs(vertices, faces);
    return {
      vertices,
      uvs: generatedUVs.uvs,
      faces: generatedUVs.faces,
      faceCount: faces.length,
      vertexCount: vertices.length,
    };
  }

  faces.forEach((face, index) => {
    face.color = getFaceColor(index, faces.length);
    face.normal = calculateFaceNormal(
      vertices[face.vertexIndices[0]],
      vertices[face.vertexIndices[1]],
      vertices[face.vertexIndices[2]]
    );
  });

  return {
    vertices,
    uvs,
    faces,
    faceCount: faces.length,
    vertexCount: vertices.length,
  };
}

function generatePlanarUVs(vertices: Vertex3D[], faces: Face[]): { uvs: UVCoord[]; faces: Face[] } {
  const uvs: UVCoord[] = [];
  const newFaces: Face[] = [];

  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;

  const tempUVs: UVCoord[] = [];

  for (const face of faces) {
    const normal = calculateFaceNormal(
      vertices[face.vertexIndices[0]],
      vertices[face.vertexIndices[1]],
      vertices[face.vertexIndices[2]]
    );

    const absX = Math.abs(normal.x);
    const absY = Math.abs(normal.y);
    const absZ = Math.abs(normal.z);

    for (let i = 0; i < 3; i++) {
      const v = vertices[face.vertexIndices[i]];
      let u: number;
      let vCoord: number;

      if (absX >= absY && absX >= absZ) {
        u = v.y;
        vCoord = v.z;
      } else if (absY >= absX && absY >= absZ) {
        u = v.x;
        vCoord = v.z;
      } else {
        u = v.x;
        vCoord = v.y;
      }

      tempUVs.push({ u: u, v: vCoord });

      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (vCoord < minV) minV = vCoord;
      if (vCoord > maxV) maxV = vCoord;
    }
  }

  const rangeU = maxU - minU;
  const rangeV = maxV - minV;
  const maxRange = Math.max(rangeU, rangeV) || 1;

  const scale = 0.9 / maxRange;
  const offsetU = (1 - (rangeU / maxRange) * 0.9) / 2;
  const offsetV = (1 - (rangeV / maxRange) * 0.9) / 2;

  for (let i = 0; i < tempUVs.length; i++) {
    uvs.push({
      u: (tempUVs[i].u - minU) * scale + offsetU,
      v: (tempUVs[i].v - minV) * scale + offsetV,
    });
  }

  for (let fi = 0; fi < faces.length; fi++) {
    const face = faces[fi];
    const uvBaseIdx = fi * 3;
    const newFace: Face = {
      vertexIndices: face.vertexIndices,
      uvIndices: [uvBaseIdx, uvBaseIdx + 1, uvBaseIdx + 2],
      area: face.area,
      color: getFaceColor(fi, faces.length),
      normal: calculateFaceNormal(
        vertices[face.vertexIndices[0]],
        vertices[face.vertexIndices[1]],
        vertices[face.vertexIndices[2]]
      ),
    };
    newFaces.push(newFace);
  }

  return { uvs, faces: newFaces };
}

export function getFaceColor(index: number, total: number): string {
  const hue = (index / Math.max(total, 1)) * 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export function calculateTriangleArea3D(v0: Vertex3D, v1: Vertex3D, v2: Vertex3D): number {
  const ax = v1.x - v0.x;
  const ay = v1.y - v0.y;
  const az = v1.z - v0.z;
  const bx = v2.x - v0.x;
  const by = v2.y - v0.y;
  const bz = v2.z - v0.z;

  const cx = ay * bz - az * by;
  const cy = az * bx - ax * bz;
  const cz = ax * by - ay * bx;

  return 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
}

export function calculateTriangleAreaUV(uv0: UVCoord, uv1: UVCoord, uv2: UVCoord): number {
  const ax = uv1.u - uv0.u;
  const ay = uv1.v - uv0.v;
  const bx = uv2.u - uv0.u;
  const by = uv2.v - uv0.v;
  return 0.5 * Math.abs(ax * by - ay * bx);
}

export function calculateFaceNormal(v0: Vertex3D, v1: Vertex3D, v2: Vertex3D): Vertex3D {
  const ax = v1.x - v0.x;
  const ay = v1.y - v0.y;
  const az = v1.z - v0.z;
  const bx = v2.x - v0.x;
  const by = v2.y - v0.y;
  const bz = v2.z - v0.z;

  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;

  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

export function getAdjacentFaces(uvIndex: number, faces: Face[]): number[] {
  const adjacent: number[] = [];
  for (let i = 0; i < faces.length; i++) {
    if (faces[i].uvIndices.includes(uvIndex)) {
      adjacent.push(i);
    }
  }
  return adjacent;
}

export function validateTriangles(uvs: UVCoord[], faces: Face[]): ValidationResult {
  const invalidFaces: number[] = [];

  for (let i = 0; i < faces.length; i++) {
    const face = faces[i];
    const uv0 = uvs[face.uvIndices[0]];
    const uv1 = uvs[face.uvIndices[1]];
    const uv2 = uvs[face.uvIndices[2]];

    const area = calculateTriangleAreaUV(uv0, uv1, uv2);

    if (area < MIN_TRIANGLE_AREA) {
      invalidFaces.push(i);
      continue;
    }
  }

  return {
    valid: invalidFaces.length === 0,
    invalidFaces,
    message: invalidFaces.length === 0
      ? '所有面片合法'
      : `发现 ${invalidFaces.length} 个非法面片`,
  };
}

export function createDefaultCube(): ModelData {
  const size = 1;
  const h = size / 2;

  const vertices: Vertex3D[] = [
    { x: -h, y: -h, z: h },
    { x: h, y: -h, z: h },
    { x: h, y: h, z: h },
    { x: -h, y: h, z: h },
    { x: h, y: -h, z: -h },
    { x: -h, y: -h, z: -h },
    { x: -h, y: h, z: -h },
    { x: h, y: h, z: -h },
  ];

  const faceIndices: [number, number, number, number][] = [
    [0, 1, 2, 3],
    [1, 4, 7, 2],
    [4, 5, 6, 7],
    [5, 0, 3, 6],
    [3, 2, 7, 6],
    [5, 4, 1, 0],
  ];

  const faces: Face[] = [];
  let uvIndex = 0;
  const uvs: UVCoord[] = [];

  const faceUVLayouts = [
    [{ u: 0, v: 0 }, { u: 0.25, v: 0 }, { u: 0.25, v: 0.33 }, { u: 0, v: 0.33 }],
    [{ u: 0.25, v: 0 }, { u: 0.5, v: 0 }, { u: 0.5, v: 0.33 }, { u: 0.25, v: 0.33 }],
    [{ u: 0.5, v: 0 }, { u: 0.75, v: 0 }, { u: 0.75, v: 0.33 }, { u: 0.5, v: 0.33 }],
    [{ u: 0.75, v: 0 }, { u: 1, v: 0 }, { u: 1, v: 0.33 }, { u: 0.75, v: 0.33 }],
    [{ u: 0.25, v: 0.33 }, { u: 0.5, v: 0.33 }, { u: 0.5, v: 0.66 }, { u: 0.25, v: 0.66 }],
    [{ u: 0.25, v: 0.66 }, { u: 0.5, v: 0.66 }, { u: 0.5, v: 1 }, { u: 0.25, v: 1 }],
  ];

  for (let fi = 0; fi < faceIndices.length; fi++) {
    const quad = faceIndices[fi];
    const uvLayout = faceUVLayouts[fi];

    for (let i = 0; i < 4; i++) {
      uvs.push(uvLayout[i]);
    }

    const baseUV = uvIndex;
    uvIndex += 4;

    const tri1: Face = {
      vertexIndices: [quad[0], quad[1], quad[2]],
      uvIndices: [baseUV, baseUV + 1, baseUV + 2],
      area: size * size * 0.5,
      color: getFaceColor(fi * 2, faceIndices.length * 2),
    };

    const tri2: Face = {
      vertexIndices: [quad[0], quad[2], quad[3]],
      uvIndices: [baseUV, baseUV + 2, baseUV + 3],
      area: size * size * 0.5,
      color: getFaceColor(fi * 2 + 1, faceIndices.length * 2),
    };

    faces.push(tri1, tri2);
  }

  return {
    vertices,
    uvs,
    faces,
    faceCount: faces.length,
    vertexCount: vertices.length,
  };
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
