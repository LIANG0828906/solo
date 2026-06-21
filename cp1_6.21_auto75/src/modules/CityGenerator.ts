import { CityBlock, RoadSegment, CityData } from './types';

function simpleHash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  h = (h ^ (h >> 16)) | 0;
  return (h & 0x7fffffff) / 0x7fffffff;
}

export function generateCityData(
  width = 5,
  depth = 5,
  blockSize = 50,
  streetWidth = 10
): CityData {
  const blocks: CityBlock[] = [];
  const roads: RoadSegment[] = [];
  const stride = blockSize + streetWidth;

  for (let gz = 0; gz < depth; gz++) {
    for (let gx = 0; gx < width; gx++) {
      const centerX = gx * stride + blockSize / 2;
      const centerZ = gz * stride + blockSize / 2;

      const h1 = simpleHash(gx, gz);
      const h2 = simpleHash(gx + 7919, gz + 6271);

      const buildingHeight = 10 + h1 * 70;
      const density = h2 * 0.6 + 0.1;
      const pedestrianCount = Math.floor(density * 200);
      const avgSpeed = 20 + h2 * 40;

      blocks.push({
        id: `block_${gx}_${gz}`,
        x: gx * stride,
        z: gz * stride,
        centerX,
        centerZ,
        width: blockSize,
        depth: blockSize,
        buildingHeight,
        density,
        avgSpeed,
        pedestrianCount,
      });
    }
  }

  const fullSpanX = width * stride;
  const fullSpanZ = depth * stride;

  for (let i = 0; i <= width; i++) {
    const roadX = i * stride - streetWidth / 2;
    roads.push({
      id: `road_ns_${i}`,
      startX: roadX,
      startZ: -streetWidth / 2,
      endX: roadX,
      endZ: fullSpanZ - streetWidth / 2,
      direction: 'ns',
      lanes: 2,
    });
  }

  for (let i = 0; i <= depth; i++) {
    const roadZ = i * stride - streetWidth / 2;
    roads.push({
      id: `road_ew_${i}`,
      startX: -streetWidth / 2,
      startZ: roadZ,
      endX: fullSpanX - streetWidth / 2,
      endZ: roadZ,
      direction: 'ew',
      lanes: 2,
    });
  }

  return {
    blocks,
    roads,
    gridWidth: width,
    gridDepth: depth,
    blockSize,
    streetWidth,
  };
}
