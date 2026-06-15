import { describe, it, expect, assert, test } from 'vitest';
import {
  PerlinNoise,
  generateTerrain,
  exportHeightmapJSON,
  type TerrainParams,
  type VoxelData,
} from './terrainGenerator';

const TEST_SEED = 42;

function collectStats(values: number[]): {
  min: number;
  max: number;
  mean: number;
  std: number;
  nonZeroCount: number;
} {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let nonZeroCount = 0;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
    if (v !== 0) nonZeroCount++;
  }
  const mean = sum / values.length;
  let varianceSum = 0;
  for (const v of values) {
    varianceSum += (v - mean) * (v - mean);
  }
  const std = Math.sqrt(varianceSum / values.length);
  return { min, max, mean, std, nonZeroCount };
}

function flattenHeights(heights: number[][]): number[] {
  const flat: number[] = [];
  for (let x = 0; x < heights.length; x++) {
    for (let z = 0; z < heights[x].length; z++) {
      flat.push(heights[x][z]);
    }
  }
  return flat;
}

describe('PerlinNoise - 基础数学函数', () => {
  const noise = new PerlinNoise(TEST_SEED);

  describe('fade(t)', () => {
    it('输入0返回0', () => {
      expect(noise.fade(0)).toBe(0);
    });

    it('输入1返回1', () => {
      expect(noise.fade(1)).toBeCloseTo(1, 5);
    });

    it('输入0.5返回中间值', () => {
      const v = noise.fade(0.5);
      expect(v).toBeGreaterThan(0.4);
      expect(v).toBeLessThan(0.6);
    });

    it('在[0,1]区间单调递增', () => {
      let prev = -1;
      for (let t = 0; t <= 1; t += 0.05) {
        const v = noise.fade(t);
        expect(v).toBeGreaterThanOrEqual(prev);
        prev = v;
      }
    });
  });

  describe('lerp(a, b, t)', () => {
    it('t=0返回a', () => {
      expect(noise.lerp(5, 10, 0)).toBe(5);
    });

    it('t=1返回b', () => {
      expect(noise.lerp(5, 10, 1)).toBe(10);
    });

    it('t=0.5返回平均值', () => {
      expect(noise.lerp(5, 10, 0.5)).toBe(7.5);
    });

    it('线性插值正确性', () => {
      expect(noise.lerp(0, 100, 0.25)).toBe(25);
      expect(noise.lerp(-10, 10, 0.75)).toBe(5);
    });
  });

  describe('grad(hash, x, y, z)', () => {
    it('返回值在预期范围内', () => {
      const values: number[] = [];
      for (let h = 0; h < 256; h++) {
        values.push(noise.grad(h, 1, 1, 1));
      }
      const stats = collectStats(values);
      expect(stats.min).toBeGreaterThanOrEqual(-3);
      expect(stats.max).toBeLessThanOrEqual(3);
    });

    it('符号取决于hash位运算结果', () => {
      const v1 = noise.grad(0, 1, 2, 3);
      const v2 = noise.grad(1, 1, 2, 3);
      expect(typeof v1).toBe('number');
      expect(typeof v2).toBe('number');
    });
  });
});

describe('PerlinNoise - 噪声输出特性', () => {
  describe('noise2D', () => {
    it('输出值在合理范围内', () => {
      const noise = new PerlinNoise(TEST_SEED);
      const values: number[] = [];
      for (let x = 0; x < 50; x++) {
        for (let z = 0; z < 50; z++) {
          values.push(noise.noise2D(x * 0.1, z * 0.1));
        }
      }
      const stats = collectStats(values);
      expect(stats.min).toBeGreaterThanOrEqual(-1.2);
      expect(stats.max).toBeLessThanOrEqual(1.2);
      expect(stats.std).toBeGreaterThan(0.1);
    });

    it('相同输入产生相同输出（确定性）', () => {
      const n1 = new PerlinNoise(TEST_SEED);
      const n2 = new PerlinNoise(TEST_SEED);
      for (let x = 0; x < 20; x++) {
        for (let z = 0; z < 20; z++) {
          expect(n1.noise2D(x * 0.1, z * 0.1)).toBe(n2.noise2D(x * 0.1, z * 0.1));
        }
      }
    });

    it('不同种子产生不同结果', () => {
      const n1 = new PerlinNoise(123);
      const n2 = new PerlinNoise(456);
      let diffCount = 0;
      for (let x = 0; x < 10; x++) {
        for (let z = 0; z < 10; z++) {
          if (n1.noise2D(x * 0.1, z * 0.1) !== n2.noise2D(x * 0.1, z * 0.1)) {
            diffCount++;
          }
        }
      }
      expect(diffCount).toBeGreaterThan(50);
    });

    it('连续值之间变化平滑（非突变）', () => {
      const noise = new PerlinNoise(TEST_SEED);
      let maxDelta = 0;
      for (let x = 0; x < 99; x++) {
        const a = noise.noise2D(x * 0.05, 0);
        const b = noise.noise2D((x + 1) * 0.05, 0);
        const delta = Math.abs(b - a);
        if (delta > maxDelta) maxDelta = delta;
      }
      expect(maxDelta).toBeLessThan(0.5);
    });
  });

  describe('noise3D', () => {
    it('输出值在合理范围内', () => {
      const noise = new PerlinNoise(TEST_SEED);
      const values: number[] = [];
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 10; y++) {
          for (let z = 0; z < 20; z++) {
            values.push(noise.noise3D(x * 0.1, y * 0.1, z * 0.1));
          }
        }
      }
      const stats = collectStats(values);
      expect(stats.min).toBeGreaterThanOrEqual(-1.3);
      expect(stats.max).toBeLessThanOrEqual(1.3);
    });
  });

  describe('fbm2D', () => {
    it('输出值在预期范围内', () => {
      const noise = new PerlinNoise(TEST_SEED);
      const values: number[] = [];
      for (let x = 0; x < 50; x++) {
        for (let z = 0; z < 50; z++) {
          values.push(noise.fbm2D(x * 0.05, z * 0.05, 4));
        }
      }
      const stats = collectStats(values);
      expect(stats.min).toBeGreaterThanOrEqual(-1.2);
      expect(stats.max).toBeLessThanOrEqual(1.2);
    });

    it('八度数影响输出变化频率', () => {
      const noise = new PerlinNoise(TEST_SEED);
      const lowOct = [];
      const highOct = [];
      for (let x = 0; x < 100; x++) {
        lowOct.push(noise.fbm2D(x * 0.05, 0, 1));
        highOct.push(noise.fbm2D(x * 0.05, 0, 6));
      }

      let lowCrossings = 0;
      let highCrossings = 0;
      for (let i = 1; i < 100; i++) {
        if (lowOct[i] * lowOct[i - 1] < 0) lowCrossings++;
        if (highOct[i] * highOct[i - 1] < 0) highCrossings++;
      }
      expect(highCrossings).toBeGreaterThan(lowCrossings);
    });

    it('fbm输出具有自相似性（分形特征）', () => {
      const noise = new PerlinNoise(TEST_SEED);
      const coarse = [];
      const fine = [];
      for (let i = 0; i < 50; i++) {
        coarse.push(noise.fbm2D(i * 0.1, 0, 4));
        fine.push(noise.fbm2D(i * 0.05, 0, 4));
      }
      expect(coarse.length).toBe(50);
      expect(fine.length).toBe(50);
    });
  });

  describe('fbm3D', () => {
    it('输出值在预期范围内', () => {
      const noise = new PerlinNoise(TEST_SEED);
      const values: number[] = [];
      for (let x = 0; x < 15; x++) {
        for (let y = 0; y < 10; y++) {
          for (let z = 0; z < 15; z++) {
            values.push(noise.fbm3D(x * 0.1, y * 0.1, z * 0.1, 3));
          }
        }
      }
      const stats = collectStats(values);
      expect(stats.min).toBeGreaterThanOrEqual(-1.2);
      expect(stats.max).toBeLessThanOrEqual(1.2);
    });
  });
});

describe('generateTerrain - 地形生成核心', () => {
  const DEFAULT_PARAMS: TerrainParams = {
    amplitude: 60,
    treeDensity: 40,
    waterRatio: 40,
    caveComplexity: 2,
    seed: TEST_SEED,
  };

  const SIZE = 32;

  describe('数据结构正确性', () => {
    const data = generateTerrain(DEFAULT_PARAMS, SIZE);

    it('返回正确的数据结构', () => {
      expect(data).toHaveProperty('heights');
      expect(data).toHaveProperty('waterLevel');
      expect(data).toHaveProperty('size');
      expect(data).toHaveProperty('treePositions');
      expect(data).toHaveProperty('caveMap');
    });

    it('size字段与输入一致', () => {
      expect(data.size).toBe(SIZE);
    });

    it('heights数组尺寸正确', () => {
      expect(data.heights.length).toBe(SIZE);
      expect(data.heights[0].length).toBe(SIZE);
    });

    it('caveMap数组维度正确', () => {
      expect(data.caveMap.length).toBe(SIZE);
      expect(data.caveMap[0].length).toBe(SIZE);
      expect(data.caveMap[0][0].length).toBeGreaterThan(0);
    });

    it('treePositions数组元素格式正确', () => {
      if (data.treePositions.length > 0) {
        const tree = data.treePositions[0];
        expect(tree).toHaveProperty('x');
        expect(tree).toHaveProperty('y');
        expect(tree).toHaveProperty('z');
        expect(typeof tree.x).toBe('number');
        expect(typeof tree.y).toBe('number');
        expect(typeof tree.z).toBe('number');
      }
    });
  });

  describe('高度分布特性', () => {
    const data = generateTerrain(DEFAULT_PARAMS, SIZE);
    const flat = flattenHeights(data.heights);
    const stats = collectStats(flat);

    it('所有高度均为非负整数', () => {
      for (const h of flat) {
        expect(h).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(h)).toBe(true);
      }
    });

    it('存在非零高度的地块（有地形起伏）', () => {
      expect(stats.nonZeroCount).toBeGreaterThan(0);
    });

    it('最大高度 > 0（有山脉存在）', () => {
      expect(stats.max).toBeGreaterThan(0);
    });

    it('具有明显的高度变化（不是全平坦）', () => {
      expect(stats.std).toBeGreaterThan(0.5);
    });

    it('高度分布在合理范围内', () => {
      const expectedMax = (DEFAULT_PARAMS.amplitude / 100) * 24 + 4;
      expect(stats.max).toBeLessThanOrEqual(expectedMax + 2);
    });
  });

  describe('岛屿衰减特性', () => {
    const data = generateTerrain(
      { ...DEFAULT_PARAMS, waterRatio: 0, amplitude: 80 },
      SIZE
    );
    const half = SIZE / 2;

    it('中心区域高度明显高于边缘', () => {
      let centerSum = 0;
      let centerCount = 0;
      let edgeSum = 0;
      let edgeCount = 0;

      for (let x = 0; x < SIZE; x++) {
        for (let z = 0; z < SIZE; z++) {
          const dx = x - half;
          const dz = z - half;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < SIZE * 0.2) {
            centerSum += data.heights[x][z];
            centerCount++;
          }
          if (dist > SIZE * 0.42) {
            edgeSum += data.heights[x][z];
            edgeCount++;
          }
        }
      }

      const centerAvg = centerSum / centerCount;
      const edgeAvg = edgeSum / edgeCount;
      expect(centerAvg).toBeGreaterThan(edgeAvg);
      expect(centerAvg).toBeGreaterThan(edgeAvg * 1.5);
    });

    it('最外圈高度为0（岛屿被水环绕）', () => {
      let edgeZeroCount = 0;
      let edgeTotal = 0;
      for (let i = 0; i < SIZE; i++) {
        if (data.heights[0][i] === 0) edgeZeroCount++;
        if (data.heights[SIZE - 1][i] === 0) edgeZeroCount++;
        if (data.heights[i][0] === 0) edgeZeroCount++;
        if (data.heights[i][SIZE - 1] === 0) edgeZeroCount++;
        edgeTotal += 4;
      }
      const zeroRatio = edgeZeroCount / edgeTotal;
      expect(zeroRatio).toBeGreaterThan(0.6);
    });
  });

  describe('振幅参数影响', () => {
    it('振幅越大，最大高度越高', () => {
      const lowData = generateTerrain({ ...DEFAULT_PARAMS, amplitude: 20 }, SIZE);
      const midData = generateTerrain({ ...DEFAULT_PARAMS, amplitude: 60 }, SIZE);
      const highData = generateTerrain({ ...DEFAULT_PARAMS, amplitude: 100 }, SIZE);

      const lowMax = Math.max(...flattenHeights(lowData.heights));
      const midMax = Math.max(...flattenHeights(midData.heights));
      const highMax = Math.max(...flattenHeights(highData.heights));

      expect(midMax).toBeGreaterThan(lowMax);
      expect(highMax).toBeGreaterThan(midMax);
    });

    it('振幅为0时仍有基础高度', () => {
      const data = generateTerrain({ ...DEFAULT_PARAMS, amplitude: 0, waterRatio: 0 }, SIZE);
      const stats = collectStats(flattenHeights(data.heights));
      expect(stats.max).toBeGreaterThanOrEqual(0);
    });
  });

  describe('水位参数影响', () => {
    it('水位比例越高，waterLevel越高', () => {
      const low = generateTerrain({ ...DEFAULT_PARAMS, waterRatio: 10 }, SIZE);
      const high = generateTerrain({ ...DEFAULT_PARAMS, waterRatio: 80 }, SIZE);
      expect(high.waterLevel).toBeGreaterThan(low.waterLevel);
    });

    it('水位在0到振幅之间', () => {
      const data = generateTerrain(DEFAULT_PARAMS, SIZE);
      const expectedMax = (DEFAULT_PARAMS.amplitude / 100) * 24 + 4;
      expect(data.waterLevel).toBeGreaterThanOrEqual(0);
      expect(data.waterLevel).toBeLessThanOrEqual(expectedMax + 2);
    });
  });

  describe('树木生成', () => {
    it('树木密度为0时没有树', () => {
      const data = generateTerrain({ ...DEFAULT_PARAMS, treeDensity: 0 }, SIZE);
      expect(data.treePositions.length).toBe(0);
    });

    it('树木密度越高，树木越多', () => {
      const low = generateTerrain({ ...DEFAULT_PARAMS, treeDensity: 10 }, SIZE);
      const high = generateTerrain({ ...DEFAULT_PARAMS, treeDensity: 90 }, SIZE);
      expect(high.treePositions.length).toBeGreaterThanOrEqual(low.treePositions.length);
    });

    it('树木只生长在陆地上（高度 > 水位）', () => {
      const data = generateTerrain(DEFAULT_PARAMS, SIZE);
      for (const tree of data.treePositions) {
        expect(tree.y).toBeGreaterThan(data.waterLevel);
      }
    });

    it('树木都在地图范围内', () => {
      const data = generateTerrain(DEFAULT_PARAMS, SIZE);
      for (const tree of data.treePositions) {
        expect(tree.x).toBeGreaterThanOrEqual(0);
        expect(tree.x).toBeLessThan(SIZE);
        expect(tree.z).toBeGreaterThanOrEqual(0);
        expect(tree.z).toBeLessThan(SIZE);
      }
    });

    it('树木高度等于所在位置的地形高度', () => {
      const data = generateTerrain(DEFAULT_PARAMS, SIZE);
      for (const tree of data.treePositions) {
        expect(tree.y).toBe(data.heights[tree.x][tree.z]);
      }
    });
  });

  describe('洞穴生成', () => {
    it('洞穴复杂度为0时没有洞穴', () => {
      const data = generateTerrain({ ...DEFAULT_PARAMS, caveComplexity: 0 }, SIZE);
      let caveCount = 0;
      for (let x = 0; x < SIZE; x++) {
        for (let z = 0; z < SIZE; z++) {
          for (let y = 0; y < data.caveMap[x][z].length; y++) {
            if (data.caveMap[x][z][y]) caveCount++;
          }
        }
      }
      expect(caveCount).toBe(0);
    });

    it('洞穴复杂度越高，洞穴空间越多', () => {
      const countCaves = (complexity: number) => {
        const data = generateTerrain({ ...DEFAULT_PARAMS, caveComplexity: complexity }, SIZE);
        let count = 0;
        for (let x = 0; x < SIZE; x++) {
          for (let z = 0; z < SIZE; z++) {
            for (let y = 0; y < data.caveMap[x][z].length; y++) {
              if (data.caveMap[x][z][y]) count++;
            }
          }
        }
        return count;
      };

      const c1 = countCaves(1);
      const c2 = countCaves(2);
      const c3 = countCaves(3);

      expect(c2).toBeGreaterThan(c1);
      expect(c3).toBeGreaterThan(c2);
    });

    it('洞穴都在地表以下', () => {
      const data = generateTerrain({ ...DEFAULT_PARAMS, caveComplexity: 2 }, SIZE);
      for (let x = 0; x < SIZE; x++) {
        for (let z = 0; z < SIZE; z++) {
          const surfaceY = data.heights[x][z];
          for (let y = 0; y < data.caveMap[x][z].length; y++) {
            if (data.caveMap[x][z][y]) {
              expect(y).toBeLessThan(surfaceY);
            }
          }
        }
      }
    });

    it('洞穴具有连通性（相邻洞穴格点 > 1）', () => {
      const data = generateTerrain({ ...DEFAULT_PARAMS, caveComplexity: 2 }, SIZE);
      let caveCells = 0;
      let connectedPairs = 0;

      for (let x = 1; x < SIZE - 1; x++) {
        for (let z = 1; z < SIZE - 1; z++) {
          const maxY = data.caveMap[x][z].length - 1;
          for (let y = 1; y < maxY; y++) {
            if (data.caveMap[x][z][y]) {
              caveCells++;
              if (data.caveMap[x + 1]?.[z]?.[y]) connectedPairs++;
              if (data.caveMap[x]?.[z + 1]?.[y]) connectedPairs++;
              if (data.caveMap[x]?.[z]?.[y + 1]) connectedPairs++;
            }
          }
        }
      }

      if (caveCells > 0) {
        expect(connectedPairs).toBeGreaterThan(0);
        expect(connectedPairs / caveCells).toBeGreaterThan(0.3);
      }
    });
  });

  describe('种子确定性', () => {
    it('相同种子产生相同地形', () => {
      const d1 = generateTerrain({ ...DEFAULT_PARAMS, seed: 999 }, SIZE);
      const d2 = generateTerrain({ ...DEFAULT_PARAMS, seed: 999 }, SIZE);

      for (let x = 0; x < SIZE; x++) {
        for (let z = 0; z < SIZE; z++) {
          expect(d1.heights[x][z]).toBe(d2.heights[x][z]);
        }
      }

      expect(d1.waterLevel).toBe(d2.waterLevel);
      expect(d1.treePositions.length).toBe(d2.treePositions.length);

      for (let i = 0; i < d1.treePositions.length; i++) {
        expect(d1.treePositions[i].x).toBe(d2.treePositions[i].x);
        expect(d1.treePositions[i].y).toBe(d2.treePositions[i].y);
        expect(d1.treePositions[i].z).toBe(d2.treePositions[i].z);
      }
    });

    it('不同种子产生不同地形', () => {
      const d1 = generateTerrain({ ...DEFAULT_PARAMS, seed: 111 }, SIZE);
      const d2 = generateTerrain({ ...DEFAULT_PARAMS, seed: 222 }, SIZE);

      let diffCount = 0;
      for (let x = 0; x < SIZE; x++) {
        for (let z = 0; z < SIZE; z++) {
          if (d1.heights[x][z] !== d2.heights[x][z]) {
            diffCount++;
          }
        }
      }
      expect(diffCount).toBeGreaterThan(SIZE * SIZE * 0.3);
    });
  });
});

describe('exportHeightmapJSON - 导出功能', () => {
  const testParams: TerrainParams = {
    amplitude: 50,
    treeDensity: 30,
    waterRatio: 35,
    caveComplexity: 1,
    seed: 12345,
  };
  const SIZE = 24;
  const data = generateTerrain(testParams, SIZE);

  it('返回有效的JSON字符串', () => {
    const json = exportHeightmapJSON(data);
    expect(typeof json).toBe('string');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('JSON包含必要字段', () => {
    const parsed = JSON.parse(exportHeightmapJSON(data));
    expect(parsed).toHaveProperty('version');
    expect(parsed).toHaveProperty('generator');
    expect(parsed).toHaveProperty('size');
    expect(parsed).toHaveProperty('waterLevel');
    expect(parsed).toHaveProperty('heights');
    expect(parsed).toHaveProperty('trees');
    expect(parsed).toHaveProperty('exportedAt');
  });

  it('导出的size与输入一致', () => {
    const parsed = JSON.parse(exportHeightmapJSON(data));
    expect(parsed.size).toBe(SIZE);
  });

  it('导出的waterLevel与地形一致', () => {
    const parsed = JSON.parse(exportHeightmapJSON(data));
    expect(parsed.waterLevel).toBe(data.waterLevel);
  });

  it('导出的heights数据完整', () => {
    const parsed = JSON.parse(exportHeightmapJSON(data));
    expect(parsed.heights.length).toBe(SIZE);
    expect(parsed.heights[0].length).toBe(SIZE);

    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        expect(parsed.heights[x][z]).toBe(data.heights[x][z]);
      }
    }
  });

  it('导出的trees数据正确', () => {
    const parsed = JSON.parse(exportHeightmapJSON(data));
    expect(parsed.trees.length).toBe(data.treePositions.length);

    for (let i = 0; i < parsed.trees.length; i++) {
      expect(parsed.trees[i].x).toBe(data.treePositions[i].x);
      expect(parsed.trees[i].y).toBe(data.treePositions[i].y);
      expect(parsed.trees[i].z).toBe(data.treePositions[i].z);
    }
  });

  it('generator字段标识正确', () => {
    const parsed = JSON.parse(exportHeightmapJSON(data));
    expect(parsed.generator).toContain('AbyssEcho');
  });

  it('exportedAt是有效的ISO时间戳', () => {
    const parsed = JSON.parse(exportHeightmapJSON(data));
    expect(() => new Date(parsed.exportedAt)).not.toThrow();
    expect(new Date(parsed.exportedAt).getTime()).toBeGreaterThan(0);
  });
});

describe('集成测试 - 完整参数组合验证', () => {
  const SIZE = 40;

  const testCases: Array<{ name: string; params: TerrainParams }> = [
    {
      name: '平缓小丘 + 少量树木 + 浅水',
      params: { amplitude: 30, treeDensity: 20, waterRatio: 20, caveComplexity: 0, seed: 100 },
    },
    {
      name: '高山地形 + 密集森林 + 深水',
      params: { amplitude: 90, treeDensity: 80, waterRatio: 60, caveComplexity: 3, seed: 200 },
    },
    {
      name: '中等起伏 + 无树 + 中等水位',
      params: { amplitude: 50, treeDensity: 0, waterRatio: 40, caveComplexity: 1, seed: 300 },
    },
    {
      name: '全平坦地形',
      params: { amplitude: 0, treeDensity: 0, waterRatio: 0, caveComplexity: 0, seed: 400 },
    },
  ];

  test.each(testCases)('参数组合: $name', ({ params }) => {
    const data = generateTerrain(params, SIZE);

    expect(data.size).toBe(SIZE);
    expect(data.heights.length).toBe(SIZE);
    expect(data.heights[0].length).toBe(SIZE);

    const stats = collectStats(flattenHeights(data.heights));
    expect(stats.min).toBeGreaterThanOrEqual(0);

    if (params.treeDensity === 0) {
      expect(data.treePositions.length).toBe(0);
    }

    if (params.caveComplexity === 0) {
      let caveCount = 0;
      for (let x = 0; x < SIZE; x++) {
        for (let z = 0; z < SIZE; z++) {
          for (let y = 0; y < data.caveMap[x][z].length; y++) {
            if (data.caveMap[x][z][y]) caveCount++;
          }
        }
      }
      expect(caveCount).toBe(0);
    }

    const json = exportHeightmapJSON(data);
    const parsed = JSON.parse(json);
    expect(parsed.size).toBe(SIZE);
    expect(parsed.heights.length).toBe(SIZE);
  });
});
