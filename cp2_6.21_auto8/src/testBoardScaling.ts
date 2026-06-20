/**
 * 棋盘缩放适配测试脚本
 *
 * 功能：验证在不同窗口尺寸下，棋盘的 transform: scale() 是否正确计算，
 *      确保 4x7 回形跑道（28 格）在任何分辨率下都完整可见。
 *
 * 使用方法：
 * 1. 运行 `npm run dev` 启动开发服务器
 * 2. 在浏览器中打开 http://localhost:5173
 * 3. 打开浏览器开发者工具的 Console 面板
 * 4. 执行 `testBoardScaling()` 运行自动化测试
 * 5. 或手动调整窗口大小进行目视验证
 */

import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  BOARD_CELLS,
  CELL_SIZE,
  CELL_GAP,
  getCellCenterByIndex,
} from './BoardConfig';

interface TestResult {
  testName: string;
  passed: boolean;
  actual?: number;
  expected?: number;
  message?: string;
}

export function runBoardConfigTests(): TestResult[] {
  const results: TestResult[] = [];

  results.push({
    testName: '棋盘尺寸配置',
    passed: BOARD_WIDTH === 508 && BOARD_HEIGHT === 508,
    actual: BOARD_WIDTH,
    expected: 508,
    message: `8 列 × 8 行，每格 ${CELL_SIZE}px + ${CELL_GAP}px 间距 = ${BOARD_WIDTH}px`,
  });

  results.push({
    testName: '格子总数',
    passed: BOARD_CELLS.length === 28,
    actual: BOARD_CELLS.length,
    expected: 28,
  });

  const corners = [
    { idx: 0, row: 0, col: 0 },
    { idx: 7, row: 0, col: 7 },
    { idx: 13, row: 6, col: 7 },
    { idx: 14, row: 7, col: 7 },
    { idx: 21, row: 7, col: 0 },
    { idx: 27, row: 1, col: 0 },
  ];

  corners.forEach(({ idx, row, col }) => {
    const cell = BOARD_CELLS[idx];
    results.push({
      testName: `格子 ${idx} 坐标验证`,
      passed: cell.row === row && cell.col === col,
      actual: `row=${cell.row}, col=${cell.col}`,
      expected: `row=${row}, col=${col}`,
    });
  });

  const center0 = getCellCenterByIndex(0);
  results.push({
    testName: '格子 0 中心点计算',
    passed: center0.x === 30 && center0.y === 30,
    actual: `x=${center0.x}, y=${center0.y}`,
    expected: 'x=30, y=30',
    message: '左上角格子中心 = 格子尺寸的一半 (60/2 = 30)',
  });

  const center7 = getCellCenterByIndex(7);
  results.push({
    testName: '格子 7 中心点计算',
    passed: center7.x === 478 && center7.y === 30,
    actual: `x=${center7.x}, y=${center7.y}`,
    expected: 'x=478, y=30',
    message: '右上角格子中心 = 7×64 + 30 = 478',
  });

  const center14 = getCellCenterByIndex(14);
  results.push({
    testName: '格子 14 中心点计算',
    passed: center14.x === 478 && center14.y === 478,
    actual: `x=${center14.x}, y=${center14.y}`,
    expected: 'x=478, y=478',
    message: '右下角格子中心 = 7×64 + 30 = 478',
  });

  return results;
}

export function calculateExpectedScale(
  containerWidth: number,
  containerHeight: number,
  padding = 48,
): number {
  const maxWidth = containerWidth - padding * 2;
  const maxHeight = containerHeight - padding * 2;
  const scaleX = maxWidth / BOARD_WIDTH;
  const scaleY = maxHeight / BOARD_HEIGHT;
  const scale = Math.min(scaleX, scaleY, 1);
  return Math.max(scale, 0.4);
}

export interface ScalingTestCase {
  name: string;
  width: number;
  height: number;
  minExpected: number;
  maxExpected: number;
}

export const SCALING_TEST_CASES: ScalingTestCase[] = [
  { name: '4K 显示器 (3840×2160)', width: 3840, height: 2160, minExpected: 1, maxExpected: 1 },
  { name: '2K 显示器 (2560×1440)', width: 2560, height: 1440, minExpected: 1, maxExpected: 1 },
  { name: '全高清 (1920×1080)', width: 1920, height: 1080, minExpected: 1, maxExpected: 1 },
  { name: '笔记本 (1366×768)', width: 1366, height: 768, minExpected: 0.9, maxExpected: 1 },
  { name: 'iPad 横屏 (1024×768)', width: 1024, height: 768, minExpected: 0.8, maxExpected: 0.95 },
  { name: 'iPad 竖屏 (768×1024)', width: 768, height: 1024, minExpected: 0.85, maxExpected: 0.95 },
  { name: '手机横屏 (667×375)', width: 667, height: 375, minExpected: 0.5, maxExpected: 0.6 },
  { name: '手机竖屏 (375×667)', width: 375, height: 667, minExpected: 0.5, maxExpected: 0.6 },
  { name: '小屏手机 (320×480)', width: 320, height: 480, minExpected: 0.4, maxExpected: 0.5 },
  { name: '极小窗口 (200×200)', width: 200, height: 200, minExpected: 0.4, maxExpected: 0.4 },
];

export function runScalingTests(): TestResult[] {
  const results: TestResult[] = [];

  SCALING_TEST_CASES.forEach((testCase) => {
    const scale = calculateExpectedScale(testCase.width, testCase.height);
    const scaledWidth = BOARD_WIDTH * scale;
    const scaledHeight = BOARD_HEIGHT * scale;
    const fitsWidth = scaledWidth <= testCase.width - 96;
    const fitsHeight = scaledHeight <= testCase.height - 96;
    const inRange = scale >= testCase.minExpected && scale <= testCase.maxExpected;

    results.push({
      testName: `缩放适配: ${testCase.name}`,
      passed: fitsWidth && fitsHeight && inRange,
      actual: `scale=${scale.toFixed(3)}, ${scaledWidth.toFixed(0)}×${scaledHeight.toFixed(0)}px`,
      expected: `${testCase.minExpected.toFixed(2)}-${testCase.maxExpected.toFixed(2)}`,
      message: `容器: ${testCase.width}×${testCase.height}px, 缩小后: ${scaledWidth.toFixed(0)}×${scaledHeight.toFixed(0)}px`,
    });
  });

  return results;
}

export function printTestResults(results: TestResult[]): void {
  console.log('\n' + '='.repeat(70));
  console.log('  飞行棋棋盘缩放适配测试报告');
  console.log('='.repeat(70));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result, idx) => {
    const status = result.passed ? '✅ 通过' : '❌ 失败';
    console.log(`\n${idx + 1}. [${status}] ${result.testName}`);
    if (result.message) {
      console.log(`   ${result.message}`);
    }
    console.log(`   实际值: ${result.actual ?? 'N/A'}`);
    console.log(`   期望值: ${result.expected ?? 'N/A'}`);
  });

  console.log('\n' + '-'.repeat(70));
  console.log(`  总计: ${passed}/${total} 测试通过 (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('='.repeat(70) + '\n');

  if (passed === total) {
    console.log('🎉 所有测试通过！棋盘缩放适配逻辑正确。');
  } else {
    console.log('⚠️  部分测试失败，请检查缩放算法。');
  }
}

export function testBoardScaling(): void {
  const configTests = runBoardConfigTests();
  const scalingTests = runScalingTests();
  printTestResults([...configTests, ...scalingTests]);
}

if (typeof window !== 'undefined') {
  (window as unknown as { testBoardScaling?: () => void }).testBoardScaling = testBoardScaling;
  console.log('💡 飞行棋测试脚本已加载。在控制台执行 testBoardScaling() 运行测试。');
}
