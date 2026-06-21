interface EditRequest {
  type: 'raise' | 'lower' | 'smooth';
  heights: Float32Array;
  centerX: number;
  centerZ: number;
  radius: number;
  strength: number;
  size: number;
}

interface EditResponse {
  heights: Float32Array;
  affectedVertices: number[];
  previousHeights: Array<[number, number]>;
}

function editHeight(
  heights: Float32Array,
  centerX: number,
  centerZ: number,
  radius: number,
  strength: number,
  size: number
): { affected: number[]; previousHeights: Array<[number, number]> } {
  const affected: number[] = [];
  const previousHeights: Array<[number, number]> = [];
  const radiusSq = radius * radius;

  const minZ = Math.max(0, Math.floor(centerZ - radius));
  const maxZ = Math.min(size - 1, Math.ceil(centerZ + radius));
  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(size - 1, Math.ceil(centerX + radius));

  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - centerX;
      const dz = z - centerZ;
      const distSq = dx * dx + dz * dz;

      if (distSq <= radiusSq) {
        const index = z * size + x;
        const falloff = 1 - Math.sqrt(distSq) / radius;
        previousHeights.push([index, heights[index]]);
        heights[index] += strength * falloff;
        affected.push(index);
      }
    }
  }

  return { affected, previousHeights };
}

function smoothHeight(
  heights: Float32Array,
  centerX: number,
  centerZ: number,
  radius: number,
  size: number
): { affected: number[]; previousHeights: Array<[number, number]> } {
  const affected: number[] = [];
  const previousHeights: Array<[number, number]> = [];
  const radiusSq = radius * radius;
  const newHeights = new Map<number, number>();

  const minZ = Math.max(0, Math.floor(centerZ - radius));
  const maxZ = Math.min(size - 1, Math.ceil(centerZ + radius));
  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(size - 1, Math.ceil(centerX + radius));

  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - centerX;
      const dz = z - centerZ;
      const distSq = dx * dx + dz * dz;

      if (distSq <= radiusSq) {
        const index = z * size + x;
        let sum = 0;
        let count = 0;
        for (let nz = Math.max(0, z - 1); nz <= Math.min(size - 1, z + 1); nz++) {
          for (let nx = Math.max(0, x - 1); nx <= Math.min(size - 1, x + 1); nx++) {
            if (nx === x && nz === z) continue;
            sum += heights[nz * size + nx];
            count++;
          }
        }
        newHeights.set(index, sum / count);
        previousHeights.push([index, heights[index]]);
        affected.push(index);
      }
    }
  }

  newHeights.forEach((height, index) => {
    heights[index] = height;
  });

  return { affected, previousHeights };
}

self.onmessage = (e: MessageEvent<EditRequest>) => {
  const { type, heights, centerX, centerZ, radius, strength, size } = e.data;
  const heightsCopy = new Float32Array(heights);

  let result: { affected: number[]; previousHeights: Array<[number, number]> };

  if (type === 'smooth') {
    result = smoothHeight(heightsCopy, centerX, centerZ, radius, size);
  } else {
    const actualStrength = type === 'lower' ? -strength : strength;
    result = editHeight(heightsCopy, centerX, centerZ, radius, actualStrength, size);
  }

  const response: EditResponse = {
    heights: heightsCopy,
    affectedVertices: result.affected,
    previousHeights: result.previousHeights,
  };

  self.postMessage(response, [heightsCopy.buffer]);
};
