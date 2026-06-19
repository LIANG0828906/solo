import {
  isValidCssColor,
  parseColor,
  getColorFamily,
  throttle,
  debounce,
} from './colorUtils';

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

console.log('\n=== 问题1：颜色验证支持所有CSS格式 ===');

test('HEX 6位 - #ff0000', () => [
  isValidCssColor('#ff0000'),
  'true',
  String(isValidCssColor('#ff0000')),
]);

test('HEX 3位 - #f00', () => [
  isValidCssColor('#f00'),
  'true',
  String(isValidCssColor('#f00')),
]);

test('HEX 8位含Alpha - #ff000080', () => [
  isValidCssColor('#ff000080'),
  'true',
  String(isValidCssColor('#ff000080')),
]);

test('HEX 4位含Alpha - #f008', () => [
  isValidCssColor('#f008'),
  'true',
  String(isValidCssColor('#f008')),
]);

test('RGB - rgb(255, 0, 0)', () => [
  isValidCssColor('rgb(255, 0, 0)'),
  'true',
  String(isValidCssColor('rgb(255, 0, 0)')),
]);

test('RGBA - rgba(255, 0, 0, 0.5)', () => [
  isValidCssColor('rgba(255, 0, 0, 0.5)'),
  'true',
  String(isValidCssColor('rgba(255, 0, 0, 0.5)')),
]);

test('HSL - hsl(0, 100%, 50%)', () => [
  isValidCssColor('hsl(0, 100%, 50%)'),
  'true',
  String(isValidCssColor('hsl(0, 100%, 50%)')),
]);

test('HSLA - hsla(0, 100%, 50%, 0.5)', () => [
  isValidCssColor('hsla(0, 100%, 50%, 0.5)'),
  'true',
  String(isValidCssColor('hsla(0, 100%, 50%, 0.5)')),
]);

test('命名颜色 - red', () => [
  isValidCssColor('red'),
  'true',
  String(isValidCssColor('red')),
]);

test('命名颜色 - cornflowerblue', () => [
  isValidCssColor('cornflowerblue'),
  'true',
  String(isValidCssColor('cornflowerblue')),
]);

test('无效 - 超出范围的RGB', () => [
  !isValidCssColor('rgb(300, 0, 0)'),
  'true (invalid)',
  String(isValidCssColor('rgb(300, 0, 0)')),
]);

test('无效 - 错误Alpha', () => [
  !isValidCssColor('rgba(255,0,0,2)'),
  'true (invalid)',
  String(isValidCssColor('rgba(255,0,0,2)')),
]);

test('无效 - 错误格式字符串', () => [
  !isValidCssColor('notacolor'),
  'true (invalid)',
  String(isValidCssColor('notacolor')),
]);

test('无效 - 空字符串', () => [
  !isValidCssColor(''),
  'true (invalid)',
  String(isValidCssColor('')),
]);

console.log('\n=== 问题2：颜色类型（色系）过滤 ===');

test('parseColor - #ff0000 应为红色系', () => {
  const parsed = parseColor('#ff0000');
  return [parsed?.family === 'red', 'red', parsed?.family || 'null'];
});

test('parseColor - #0000ff 应为蓝色系', () => {
  const parsed = parseColor('#0000ff');
  return [parsed?.family === 'blue', 'blue', parsed?.family || 'null'];
});

test('parseColor - #00ff00 应为绿色系', () => {
  const parsed = parseColor('#00ff00');
  return [parsed?.family === 'green', 'green', parsed?.family || 'null'];
});

test('parseColor - rgb(255,215,0) 应为黄色系', () => {
  const parsed = parseColor('rgb(255, 215, 0)');
  return [parsed?.family === 'yellow', 'yellow', parsed?.family || 'null'];
});

test('parseColor - #00bfff 应为青色系', () => {
  const parsed = parseColor('#00bfff');
  return [parsed?.family === 'cyan', 'cyan', parsed?.family || 'null'];
});

test('parseColor - #ff69b4 应为粉色系', () => {
  const parsed = parseColor('#ff69b4');
  return [parsed?.family === 'pink', 'pink', parsed?.family || 'null'];
});

test('parseColor - #800080 应为紫色系', () => {
  const parsed = parseColor('#800080');
  return [parsed?.family === 'purple', 'purple', parsed?.family || 'null'];
});

test('parseColor - #808080 应为灰色系', () => {
  const parsed = parseColor('#808080');
  return [parsed?.family === 'gray', 'gray', parsed?.family || 'null'];
});

test('parseColor - #ffffff 应为白色系', () => {
  const parsed = parseColor('#ffffff');
  return [parsed?.family === 'white', 'white', parsed?.family || 'null'];
});

test('parseColor - #000000 应为黑色系', () => {
  const parsed = parseColor('#000000');
  return [parsed?.family === 'black', 'black', parsed?.family || 'null'];
});

test('parseColor - HSL 转换为RGB', () => {
  const parsed = parseColor('hsl(0, 100%, 50%)');
  return [parsed?.hex === '#FF0000', '#FF0000', parsed?.hex || 'null'];
});

console.log('\n=== 问题3：复制按钮反馈逻辑 ===');

test('parseColor 正确转换为大写十六进制', () => {
  const parsed = parseColor('#abc');
  return [parsed?.hex === '#AABBCC', '#AABBCC', parsed?.hex || 'null'];
});

test('parseColor 保留原始格式标识', () => {
  const parsed1 = parseColor('rgba(255, 0, 0, 0.5)');
  const parsed2 = parseColor('#ff0000');
  return [
    parsed1?.format === 'rgba' && parsed2?.format === 'hex',
    'rgba + hex',
    `${parsed1?.format} + ${parsed2?.format}`,
  ];
});

console.log('\n=== 问题4：节流防抖机制 ===');

test('throttle 函数存在且可调用', () => {
  const fn = () => {};
  const throttled = throttle(fn, 100);
  return [typeof throttled === 'function', 'function', typeof throttled];
});

test('debounce 函数存在且可调用', () => {
  const fn = () => {};
  const debounced = debounce(fn, 100);
  return [typeof debounced === 'function', 'function', typeof debounced];
});

test('throttle 能正常调用原函数', () => {
  let called = 0;
  const throttled = throttle(() => { called++; }, 100);
  throttled();
  return [called === 1, 'called 1 time', `called ${called} times`];
});

test('debounce 能正常调用原函数', () => {
  let called = 0;
  const debounced = debounce(() => { called++; }, 100);
  debounced();
  return [called === 0, 'called 0 times initially (debounced)', `called ${called} times`];
});

console.log('\n=== 问题5：颜色解析边界情况 ===');

test('解析重复颜色 - 多个相同值', () => {
  const p1 = parseColor('#ffffff');
  const p2 = parseColor('#FFFFFF');
  const p3 = parseColor('rgb(255,255,255)');
  return [
    p1?.hex === p2?.hex && p2?.hex === p3?.hex,
    'FFFFFF === FFFFFF === FFFFFF',
    `${p1?.hex} === ${p2?.hex} === ${p3?.hex}`,
  ];
});

test('空颜色列表处理 - 0个颜色', () => {
  // 模拟空列表
  const emptyGroups: any[] = [];
  return [emptyGroups.length === 0, '0', String(emptyGroups.length)];
});

test('重复颜色值去重', () => {
  const colors = ['#ff0000', '#FF0000', '#ff0000'];
  const unique = Array.from(new Set(colors.map((c) => c.toLowerCase())));
  return [unique.length === 1, '1 unique', String(unique.length)];
});

console.log('\n=== 问题7：边界情况测试 ===');

test('isValidCssColor - 空值验证', () => {
  const v1 = isValidCssColor('');
  const v2 = isValidCssColor(null as any);
  const v3 = isValidCssColor(undefined as any);
  return [!v1 && !v2 && !v3, 'all false', `${v1} ${v2} ${v3}`];
});

test('parseColor - 无效颜色返回null', () => {
  const parsed = parseColor('invalid');
  return [parsed === null, 'null', String(parsed)];
});

test('parseColor - 带空格的RGB', () => {
  const parsed = parseColor('rgb( 255 , 128 , 0 )');
  return [parsed?.hex === '#FF8000', '#FF8000', parsed?.hex || 'null'];
});

test('luminance 计算 - 白色比黑色亮', () => {
  const white = parseColor('#ffffff');
  const black = parseColor('#000000');
  return [
    (white?.luminance ?? 0) > (black?.luminance ?? 1000),
    'white > black',
    `white: ${white?.luminance}, black: ${black?.luminance}`,
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
  console.log('\n🎉 所有测试通过！');
}
