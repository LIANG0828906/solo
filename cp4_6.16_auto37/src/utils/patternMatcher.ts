/**
 * ============================================================
 * 图案匹配核心算法
 * ============================================================
 * 
 * 本模块实现了合成台4x4网格的配方图案匹配功能，
 * 支持旋转对称和镜像对称的多形态匹配。
 * 
 * 支持的变换类型：
 * - 旋转：0°、90°、180°、270°（顺时针旋转）
 * - 镜像：水平翻转（左右镜像）
 * - 组合：旋转+镜像（共8种可能的对称变换）
 * 
 * 匹配算法流程：
 * 1. 快速预检：比较填充格子数量和资源类型数量，不匹配直接跳过
 * 2. 生成变换：为每个配方生成所有8种对称变换变体
 * 3. 去重优化：对对称变体进行去重，避免重复匹配
 * 4. 滑动匹配：将裁剪后的图案在合成台网格上滑动比对
 * 5. 精确匹配：每个图案位(1)必须对应资源，空位(0)必须为空
 * 
 * ============================================================
 */

import type { Recipe } from '@/data/recipes';

export type GridCell = string | null;

/**
 * 将4x4图案矩阵顺时针旋转90度
 * 
 * 算法说明：
 * 对于大小为 N x N 的矩阵，旋转90度的变换公式为：
 * newMatrix[i][j] = oldMatrix[N-1-j][i]
 * 
 * 示例：
 * 原矩阵     旋转90°后
 * [1,2,3]    [7,4,1]
 * [4,5,6] -> [8,5,2]
 * [7,8,9]    [9,6,3]
 * 
 * @param pattern - 原始图案矩阵
 * @returns 顺时针旋转90度后的矩阵
 */
export function rotatePattern(pattern: number[][]): number[][] {
  const size = pattern.length;
  const rotated: number[][] = [];
  for (let i = 0; i < size; i++) {
    rotated.push([]);
    for (let j = 0; j < size; j++) {
      rotated[i].push(pattern[size - 1 - j][i]);
    }
  }
  return rotated;
}

/**
 * 将图案矩阵水平镜像翻转（左右翻转）
 * 
 * 算法说明：
 * 对每一行进行反转操作，即水平镜像。
 * 
 * 示例：
 * 原矩阵     水平镜像后
 * [1,2,3]    [3,2,1]
 * [4,5,6] -> [6,5,4]
 * [7,8,9]    [9,8,7]
 * 
 * 注意：垂直镜像可通过 旋转180° + 水平镜像 实现
 * 
 * @param pattern - 原始图案矩阵
 * @returns 水平翻转后的矩阵
 */
export function mirrorPattern(pattern: number[][]): number[][] {
  return pattern.map(row => [...row].reverse());
}

/**
 * 生成图案的所有对称变体（最多8种）
 * 
 * 变换组合：
 * - 0° 原始
 * - 0° + 水平镜像
 * - 90° 顺时针旋转
 * - 90° + 水平镜像
 * - 180° 顺时针旋转
 * - 180° + 水平镜像
 * - 270° 顺时针旋转
 * - 270° + 水平镜像
 * 
 * 算法说明：
 * 1. 循环4次，每次旋转90度
 * 2. 每次旋转后，添加原始版本和镜像版本
 * 3. 最后通过字符串哈希去重（对称图案可能有重复变体）
 * 
 * 为什么是8种？
 * 二面体群D4的阶数为8，代表正方形的所有对称操作。
 * 包括4个旋转（0°, 90°, 180°, 270°）和4个反射（4条对称轴）。
 * 我们用"旋转+水平镜像"的组合来生成所有反射。
 * 
 * @param pattern - 原始图案矩阵
 * @returns 所有唯一的对称变体数组
 */
export function getAllPatternVariants(pattern: number[][]): number[][][] {
  const variants: number[][][] = [];
  let current = pattern;
  
  for (let i = 0; i < 4; i++) {
    variants.push(current);
    const mirrored = mirrorPattern(current);
    variants.push(mirrored);
    current = rotatePattern(current);
  }
  
  const unique: number[][][] = [];
  const seen = new Set<string>();
  
  for (const variant of variants) {
    const key = variant.map(row => row.join('')).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(variant);
    }
  }
  
  return unique;
}

/**
 * 计算图案的边界框（最小包围矩形）
 * 
 * 用途：
 * - 裁剪图案，去除周围的空白行/列
 * - 计算图案的实际宽高
 * - 滑动匹配时确定可移动范围
 * 
 * @param pattern - 图案矩阵
 * @returns 边界信息：最小/最大行列索引
 */
export function getPatternBounds(pattern: number[][]): { minRow: number; maxRow: number; minCol: number; maxCol: number } {
  let minRow = pattern.length;
  let maxRow = -1;
  let minCol = pattern[0].length;
  let maxCol = -1;
  
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] === 1) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }
  
  return { minRow, maxRow, minCol, maxCol };
}

/**
 * 裁剪图案，去除空白边界
 * 
 * 为什么需要裁剪？
 * - 配方定义时，图案可能不在4x4网格的左上角
 * - 实际匹配时，图案可以放在合成台的任意位置
 * - 裁剪后可以进行滑动匹配，找到图案在合成台上的位置
 * 
 * @param pattern - 原始图案矩阵
 * @returns 裁剪后的紧凑图案矩阵
 */
export function cropPattern(pattern: number[][]): number[][] {
  const { minRow, maxRow, minCol, maxCol } = getPatternBounds(pattern);
  
  if (maxRow < 0) return [];
  
  const cropped: number[][] = [];
  for (let r = minRow; r <= maxRow; r++) {
    const row: number[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      row.push(pattern[r][c]);
    }
    cropped.push(row);
  }
  
  return cropped;
}

/**
 * 在合成台网格中查找图案的位置
 * 
 * 匹配规则：
 * - 图案中的1必须对应网格中的资源（非null）
 * - 图案中的0必须对应网格中的空位（null）
 * - 图案可以放在合成台的任意位置（滑动匹配）
 * 
 * 算法：滑动窗口匹配
 * 时间复杂度：O((H-h+1) * (W-w+1) * h * w)
 * 其中 H,W 是网格大小（4x4），h,w 是图案大小
 * 对于4x4网格，最坏情况约 4*4*3*3 = 144 次比较，完全可以忽略
 * 
 * @param grid - 合成台网格（物品id或null）
 * @param pattern - 图案矩阵（0/1）
 * @returns 匹配到的位置（左上角行列），未找到返回null
 */
export function findPatternPosition(grid: GridCell[][], pattern: number[][]): { row: number; col: number } | null {
  const { minRow, maxRow, minCol, maxCol } = getPatternBounds(pattern);
  const patternHeight = maxRow - minRow + 1;
  const patternWidth = maxCol - minCol + 1;
  
  for (let startRow = 0; startRow <= grid.length - patternHeight; startRow++) {
    for (let startCol = 0; startCol <= grid[0].length - patternWidth; startCol++) {
      let matches = true;
      
      for (let r = 0; r < patternHeight; r++) {
        for (let c = 0; c < patternWidth; c++) {
          const patternCell = pattern[minRow + r][minCol + c];
          const gridCell = grid[startRow + r][startCol + c];
          
          if (patternCell === 1 && gridCell === null) {
            matches = false;
            break;
          }
          if (patternCell === 0 && gridCell !== null) {
            matches = false;
            break;
          }
        }
        if (!matches) break;
      }
      
      if (matches) {
        return { row: startRow, col: startCol };
      }
    }
  }
  
  return null;
}

/**
 * 统计网格中填充的格子数量
 */
export function countFilledCells(grid: GridCell[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) count++;
    }
  }
  return count;
}

/**
 * 获取网格中所有不同的物品ID
 */
export function getUniqueItemsInGrid(grid: GridCell[][]): string[] {
  const items = new Set<string>();
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) {
        items.add(cell);
      }
    }
  }
  return Array.from(items);
}

/**
 * 统计网格中某种物品的数量
 */
export function countItemInGrid(grid: GridCell[][], itemId: string): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === itemId) count++;
    }
  }
  return count;
}

/**
 * 检查网格中是否包含所有必需的资源（种类和数量）
 * 
 * 这是快速预检的第二步：
 * 1. 数量预检（countFilledCells）- O(n)
 * 2. 资源预检（hasAllResources）- O(n*m)，m是资源种类数
 * 3. 图案精确匹配（findPatternPosition）- O(n²)
 * 
 * 按复杂度从低到高排列，尽早排除不匹配的配方
 */
export function hasAllResources(grid: GridCell[][], requiredResources: { itemId: string; count: number }[]): boolean {
  for (const req of requiredResources) {
    const count = countItemInGrid(grid, req.itemId);
    if (count < req.count) return false;
  }
  return true;
}

/**
 * 检查单个配方是否与合成台布局匹配
 * 
 * 匹配流程：
 * 1. 填充格子数量必须一致（快速失败）
 * 2. 所需资源种类和数量必须匹配（快速失败）
 * 3. 生成配方的所有对称变体
 * 4. 遍历所有变体，尝试在合成台上找到匹配位置
 * 
 * 关于图案与资源的对应关系：
 * - 图案矩阵只定义"形状"（哪些格子有物品）
 * - 资源列表定义"内容"（需要哪些资源、各多少个）
 * - 两者是独立的：图案描述空间布局，资源描述材料需求
 * - 这样设计的好处是：同一个图案可以用于不同资源的配方
 * 
 * 注意：本实现不检查资源在图案中的具体位置，
 * 只检查资源总数和图案形状。如果需要更严格的匹配
 * （比如特定位置必须放特定资源），可以在这一层扩展。
 * 
 * @param grid - 合成台当前布局
 * @param recipe - 要检查的配方
 * @returns 是否匹配成功
 */
export function checkRecipeMatch(grid: GridCell[][], recipe: Recipe): boolean {
  const filledCells = countFilledCells(grid);
  const requiredCells = recipe.pattern.flat().filter(c => c === 1).length;
  
  if (filledCells !== requiredCells) return false;
  
  if (!hasAllResources(grid, recipe.requiredResources)) return false;
  
  const variants = getAllPatternVariants(recipe.pattern);
  
  for (const variant of variants) {
    const position = findPatternPosition(grid, variant);
    if (position !== null) {
      return true;
    }
  }
  
  return false;
}

/**
 * 在所有配方中查找与合成台布局匹配的配方
 * 
 * 遍历所有配方，返回第一个匹配的。
 * 如果有多个配方都匹配，返回数组中靠前的那个。
 * 
 * 性能优化建议：
 * - 可以按填充格子数量分组，只检查对应数量的配方
 * - 可以缓存每个配方的所有对称变体，避免重复计算
 * - 对于4x4网格和20个配方，当前实现完全够用
 * 
 * @param grid - 合成台当前布局
 * @param recipes - 所有可用配方
 * @returns 匹配的配方，未找到返回null
 */
export function findMatchingRecipe(grid: GridCell[][], recipes: Recipe[]): Recipe | null {
  const filledCells = countFilledCells(grid);
  
  if (filledCells === 0) return null;
  
  for (const recipe of recipes) {
    if (checkRecipeMatch(grid, recipe)) {
      return recipe;
    }
  }
  
  return null;
}
