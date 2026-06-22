import { extractColors, replaceColorsInCss, ColorEntry } from '../parser/colorExtractor';
import { buildGraph, computeLayoutSync, LayoutResult, GraphNode, GraphEdge } from '../graph/forceLayout';
import { isValidCssColor, parseColor } from './colorUtils';

type TestResult = {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
};

const results: TestResult[] = [];

function test(name: string, fn: () => [boolean, string, string]) {
  try {
    const [passed, expected, actual] = fn();
    results.push({ name, passed, expected, actual });
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (!passed) {
      console.log(`   Expected: ${expected}`);
      console.log(`   Actual:   ${actual}`);
    }
  } catch (e) {
    results.push({ name, passed: false, expected: 'no error', actual: String(e) });
    console.log(`❌ ${name} - Error: ${e}`);
  }
}

console.log('\n=== 集成测试：颜色替换与依赖图同步 ===');

const sampleCss = `
.btn-primary {
  background-color: #007bff;
  color: #ffffff;
  border-color: #007bff;
}

.btn-secondary {
  background-color: #6c757d;
  color: #ffffff;
}

.card {
  background: linear-gradient(135deg, #007bff, #6610f2);
  border: 1px solid #dee2e6;
}

.alert-danger {
  color: #dc3545;
  background-color: #f8d7da;
}

.text-muted {
  color: #6c757d;
}
`;

test('问题6 - 提取颜色', () => {
  const entries = extractColors(sampleCss);
  const uniqueColors = new Set(entries.map((e) => e.color.toLowerCase()));
  return [
    entries.length > 0 && uniqueColors.size > 0,
    `entries > 0, unique colors > 0`,
    `${entries.length} entries, ${uniqueColors.size} unique colors`,
  ];
});

test('问题6 - #007bff 使用次数为3', () => {
  const entries = extractColors(sampleCss);
  const primaryBtn = entries.filter((e) => e.color.toLowerCase() === '#007bff');
  return [primaryBtn.length === 3, '3 occurrences', `${primaryBtn.length} occurrences`];
});

test('问题6 - #ffffff 使用次数为2', () => {
  const entries = extractColors(sampleCss);
  const white = entries.filter((e) => e.color.toLowerCase() === '#ffffff');
  return [white.length === 2, '2 occurrences', `${white.length} occurrences`];
});

test('问题6 - 构建图结构', () => {
  const entries = extractColors(sampleCss);
  const graph = buildGraph(entries);
  return [
    graph.nodes.length > 0 && graph.edges.length > 0,
    'nodes > 0, edges > 0',
    `${graph.nodes.length} nodes, ${graph.edges.length} edges`,
  ];
});

test('问题6 - 图中包含颜色节点和选择器节点', () => {
  const entries = extractColors(sampleCss);
  const graph = buildGraph(entries);
  const colorNodes = graph.nodes.filter((n) => n.type === 'color');
  const selectorNodes = graph.nodes.filter((n) => n.type === 'selector');
  return [
    colorNodes.length > 0 && selectorNodes.length > 0,
    `color nodes > 0, selector nodes > 0`,
    `${colorNodes.length} color, ${selectorNodes.length} selector`,
  ];
});

test('问题6 - 边连接选择器到颜色', () => {
  const entries = extractColors(sampleCss);
  const graph = buildGraph(entries);
  const edgesValid = graph.edges.every(
    (e) =>
      (e.source as GraphNode).type === 'selector' &&
      (e.target as GraphNode).type === 'color'
  );
  return [edgesValid, 'all edges from selector to color', 'not all edges valid'];
});

test('问题6 - 颜色替换后CSS正确更新', () => {
  const replacements = [
    { oldColor: '#007bff', newColor: '#28a745' },
  ];
  const newCss = replaceColorsInCss(sampleCss, replacements);
  return [
    !newCss.includes('#007bff') && newCss.includes('#28a745'),
    'no #007bff, has #28a745',
    `has #007bff: ${newCss.includes('#007bff')}, has #28a745: ${newCss.includes('#28a745')}`,
  ];
});

test('问题6 - 替换后重新解析颜色', () => {
  const replacements = [
    { oldColor: '#007bff', newColor: '#28a745' },
  ];
  const newCss = replaceColorsInCss(sampleCss, replacements);
  const newEntries = extractColors(newCss);
  const newColors = new Set(newEntries.map((e) => e.color.toLowerCase()));
  return [
    !newColors.has('#007bff') && newColors.has('#28a745'),
    'new colors have #28a745, not #007bff',
    `has #007bff: ${newColors.has('#007bff')}, has #28a745: ${newColors.has('#28a745')}`,
  ];
});

test('问题6 - 替换后依赖图节点数相同', () => {
  const entries = extractColors(sampleCss);
  const graph1 = buildGraph(entries);

  const replacements = [{ oldColor: '#007bff', newColor: '#28a745' }];
  const newCss = replaceColorsInCss(sampleCss, replacements);
  const newEntries = extractColors(newCss);
  const graph2 = buildGraph(newEntries);

  return [
    graph1.nodes.length === graph2.nodes.length,
    `${graph1.nodes.length} nodes`,
    `${graph1.nodes.length} vs ${graph2.nodes.length} nodes`,
  ];
});

test('问题6 - 替换后依赖图边数相同', () => {
  const entries = extractColors(sampleCss);
  const graph1 = buildGraph(entries);

  const replacements = [{ oldColor: '#007bff', newColor: '#28a745' }];
  const newCss = replaceColorsInCss(sampleCss, replacements);
  const newEntries = extractColors(newCss);
  const graph2 = buildGraph(newEntries);

  return [
    graph1.edges.length === graph2.edges.length,
    `${graph1.edges.length} edges`,
    `${graph1.edges.length} vs ${graph2.edges.length} edges`,
  ];
});

test('问题6 - 同步布局计算产生有效坐标', () => {
  const entries = extractColors(sampleCss);
  const graph = buildGraph(entries);
  const layout = computeLayoutSync(graph, 800, 600);
  const allValid = layout.nodes.every(
    (n) => !isNaN(n.x) && !isNaN(n.y) && isFinite(n.x) && isFinite(n.y)
  );
  return [allValid, 'all nodes have valid finite coordinates', 'some nodes invalid (NaN/Infinite)'];
});

test('问题6 - 替换后同步更新依赖图（完整流程）', () => {
  const oldEntries = extractColors(sampleCss);
  const oldGraph = buildGraph(oldEntries);
  const oldLayout = computeLayoutSync(oldGraph, 800, 600);

  const replacements = [{ oldColor: '#dc3545', newColor: '#ffc107' }];
  const newCss = replaceColorsInCss(sampleCss, replacements);
  const newEntries = extractColors(newCss);
  const newGraph = buildGraph(newEntries);
  const newLayout = computeLayoutSync(newGraph, 800, 600);

  const oldColorNodes = oldLayout.nodes.filter((n) => n.type === 'color').length;
  const newColorNodes = newLayout.nodes.filter((n) => n.type === 'color').length;
  const oldSelectorNodes = oldLayout.nodes.filter((n) => n.type === 'selector').length;
  const newSelectorNodes = newLayout.nodes.filter((n) => n.type === 'selector').length;

  return [
    oldColorNodes === newColorNodes && oldSelectorNodes === newSelectorNodes,
    `same structure (${oldColorNodes} colors, ${oldSelectorNodes} selectors)`,
    `old: ${oldColorNodes}c ${oldSelectorNodes}s, new: ${newColorNodes}c ${newSelectorNodes}s`,
  ];
});

console.log('\n=== 集成测试：多选批量替换 ===');

test('问题7 - 批量替换多个颜色', () => {
  const replacements = [
    { oldColor: '#007bff', newColor: '#28a745' },
    { oldColor: '#6c757d', newColor: '#17a2b8' },
    { oldColor: '#ffffff', newColor: '#f8f9fa' },
  ];
  const newCss = replaceColorsInCss(sampleCss, replacements);
  const entries = extractColors(newCss);
  const colors = new Set(entries.map((e) => e.color.toLowerCase()));

  return [
    !colors.has('#007bff') && !colors.has('#6c757d') && !colors.has('#ffffff') &&
    colors.has('#28a745') && colors.has('#17a2b8') && colors.has('#f8f9fa'),
    'all 3 old colors replaced, all 3 new colors present',
    `old present: ${colors.has('#007bff')}${colors.has('#6c757d')}${colors.has('#ffffff')}, ` +
    `new present: ${colors.has('#28a745')}${colors.has('#17a2b8')}${colors.has('#f8f9fa')}`,
  ];
});

test('问题7 - 批量替换后使用次数保留', () => {
  const replacements = [
    { oldColor: '#007bff', newColor: '#28a745' },
  ];
  const newCss = replaceColorsInCss(sampleCss, replacements);
  const entries = extractColors(newCss);
  const primaryCount = entries.filter((e) => e.color.toLowerCase() === '#28a745').length;
  return [primaryCount === 3, '3 occurrences (preserved)', `${primaryCount} occurrences`];
});

console.log('\n=== 集成测试：边界情况 ===');

test('问题7 - 空CSS处理', () => {
  const entries = extractColors('');
  return [entries.length === 0, '0 entries', `${entries.length} entries`];
});

test('问题7 - CSS无颜色', () => {
  const css = `.btn { font-size: 14px; padding: 10px; margin: 0; }`;
  const entries = extractColors(css);
  return [entries.length === 0, '0 entries', `${entries.length} entries`];
});

test('问题7 - 重复颜色值去重计数', () => {
  const css = `
    .a { color: #ff0000; }
    .b { background-color: #ff0000; }
    .c { border-color: #ff0000; }
    .d { outline-color: #FF0000; }
  `;
  const entries = extractColors(css);
  const redCount = entries.filter((e) => e.color.toLowerCase() === '#ff0000').length;
  return [redCount === 4, '4 occurrences', `${redCount} occurrences`];
});

test('问题7 - 替换为相同颜色（无变化）', () => {
  const replacements = [{ oldColor: '#007bff', newColor: '#007bff' }];
  const newCss = replaceColorsInCss(sampleCss, replacements);
  return [newCss === sampleCss, 'CSS unchanged', 'CSS was changed'];
});

test('问题7 - 替换不存在的颜色（无变化）', () => {
  const replacements = [{ oldColor: '#abc123', newColor: '#def456' }];
  const newCss = replaceColorsInCss(sampleCss, replacements);
  return [newCss === sampleCss, 'CSS unchanged', 'CSS was changed'];
});

test('问题7 - 替换为空列表（无变化）', () => {
  const replacements: { oldColor: string; newColor: string }[] = [];
  const newCss = replaceColorsInCss(sampleCss, replacements);
  return [newCss === sampleCss, 'CSS unchanged', 'CSS was changed'];
});

test('问题7 - 混合颜色格式替换', () => {
  const css = `.a { color: rgb(255, 0, 0); background: hsl(240, 100%, 50%); }`;
  const replacements = [
    { oldColor: '#ff0000', newColor: '#00ff00' },
    { oldColor: '#0000ff', newColor: '#ffff00' },
  ];
  const newCss = replaceColorsInCss(css, replacements);
  const entries = extractColors(newCss);
  const colors = new Set(entries.map((e) => e.color.toLowerCase()));
  return [
    colors.has('#00ff00') && colors.has('#ffff00'),
    'rgb and hsl replaced via hex',
    `colors: ${Array.from(colors).join(', ')}`,
  ];
});

test('问题7 - 无效颜色格式不影响有效颜色', () => {
  const css = `.a { color: #ff0000; background: invalidcolor; }`;
  const entries = extractColors(css);
  const valid = entries.filter((e) => isValidCssColor(e.color));
  return [
    valid.length === 1 && valid[0].color.toLowerCase() === '#ff0000',
    'only #ff0000 extracted',
    `${entries.length} entries: ${entries.map(e => e.color).join(', ')}`,
  ];
});

test('问题7 - 颜色列表为空时的依赖图', () => {
  const entries: ColorEntry[] = [];
  const graph = buildGraph(entries);
  const layout = computeLayoutSync(graph, 800, 600);
  return [
    graph.nodes.length === 0 && graph.edges.length === 0 && layout.nodes.length === 0,
    'empty graph',
    `${graph.nodes.length} nodes, ${graph.edges.length} edges`,
  ];
});

console.log('\n=== 集成测试：解析性能 ===');

test('问题 - 解析100行CSS快速完成', () => {
  let largeCss = '';
  for (let i = 0; i < 100; i++) {
    largeCss += `.class-${i} { color: ${i % 2 === 0 ? '#ff0000' : '#0000ff'}; background: #${i.toString(16).padStart(6, '0')}; }\n`;
  }
  const start = Date.now();
  const entries = extractColors(largeCss);
  const end = Date.now();
  return [
    end - start < 200 && entries.length > 0,
    `< 200ms, entries > 0`,
    `${end - start}ms, ${entries.length} entries`,
  ];
});

const passed = results.filter((r) => r.passed).length;
const total = results.length;
console.log(`\n=== 测试结果：${passed}/${total} 通过 ===`);

if (passed < total) {
  console.log('\n失败的测试：');
  results.filter((r) => !r.passed).forEach((r) => {
    console.log(`  ❌ ${r.name}`);
    console.log(`     Expected: ${r.expected}`);
    console.log(`     Actual:   ${r.actual}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 所有集成测试通过！');
}
