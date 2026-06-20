import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, hexToHsl, hslToHex, generateDerivedColors } from './src/utils.ts';

let passed = 0;
let failed = 0;

const assert = (name, condition) => {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
};

console.log('\n=== HEX/RGB 转换测试 ===');
{
  const r1 = hexToRgb('#ff6600');
  assert('hexToRgb #ff6600', r1.r === 255 && r1.g === 102 && r1.b === 0);

  const r2 = hexToRgb('#000000');
  assert('hexToRgb #000000', r2.r === 0 && r2.g === 0 && r2.b === 0);

  const r3 = hexToRgb('#ffffff');
  assert('hexToRgb #ffffff', r3.r === 255 && r3.g === 255 && r3.b === 255);

  const r4 = hexToRgb('#abc');
  assert('hexToRgb #abc (3位简写)', r4.r === 170 && r4.g === 187 && r4.b === 204);

  assert('rgbToHex roundtrip #ff6600', rgbToHex(r1) === '#ff6600');
  assert('rgbToHex roundtrip #000000', rgbToHex(r2) === '#000000');
  assert('rgbToHex roundtrip #ffffff', rgbToHex(r3) === '#ffffff');
}

console.log('\n=== RGB/HSL 转换测试 ===');
{
  const h1 = rgbToHsl({ r: 255, g: 0, b: 0 });
  assert('rgbToHsl red: h≈0', Math.abs(h1.h) < 0.01 || Math.abs(h1.h - 360) < 0.01);
  assert('rgbToHsl red: s=100', Math.abs(h1.s - 100) < 0.01);
  assert('rgbToHsl red: l=50', Math.abs(h1.l - 50) < 0.01);

  const h2 = rgbToHsl({ r: 0, g: 0, b: 0 });
  assert('rgbToHsl black: l=0', Math.abs(h2.l) < 0.01);

  const h3 = rgbToHsl({ r: 128, g: 128, b: 128 });
  assert('rgbToHsl gray: s≈0', Math.abs(h3.s) < 0.01);
  assert('rgbToHsl gray: l≈50', Math.abs(h3.l - 50) < 1);

  const r1 = hslToRgb({ h: 0, s: 100, l: 50 });
  assert('hslToRgb red from HSL', Math.abs(r1.r - 255) < 1 && Math.abs(r1.g) < 1 && Math.abs(r1.b) < 1);

  const r2 = hslToRgb({ h: 120, s: 100, l: 50 });
  assert('hslToRgb green from HSL', Math.abs(r2.r) < 1 && Math.abs(r2.g - 255) < 1 && Math.abs(r2.b) < 1);

  const r3 = hslToRgb({ h: 240, s: 100, l: 50 });
  assert('hslToRgb blue from HSL', Math.abs(r3.r) < 1 && Math.abs(r3.g) < 1 && Math.abs(r3.b - 255) < 1);
}

console.log('\n=== HEX/HSL 往返转换测试 ===');
{
  const colors = ['#ff6600', '#336699', '#abcdef', '#1a1a2e', '#16213e'];
  for (const c of colors) {
    const roundtrip = hslToHex(hexToHsl(c));
    const orig = hexToRgb(c);
    const rt = hexToRgb(roundtrip);
    const close = Math.abs(orig.r - rt.r) <= 1 && Math.abs(orig.g - rt.g) <= 1 && Math.abs(orig.b - rt.b) <= 1;
    assert(`roundtrip ${c}`, close);
  }
}

console.log('\n=== 衍生色边界测试 ===');
{
  const colors = { primary: '#e94560', secondary: '#0f3460', background: '#1a1a2e', text: '#e0e0e0' };
  const derived = generateDerivedColors(colors);

  assert('衍生色数量 >= 5', derived.length >= 5);

  for (const d of derived) {
    const hex = d.value;
    assert(`${d.name} 是有效HEX`, /^#[0-9a-f]{6}$/i.test(hex));

    const hsl = hexToHsl(hex);
    assert(`${d.name} 色相 0-360`, hsl.h >= 0 && hsl.h <= 360);
    assert(`${d.name} 饱和度 0-100`, hsl.s >= 0 && hsl.s <= 100);
    assert(`${d.name} 明度 0-100`, hsl.l >= 0 && hsl.l <= 100);

    const rgb = hexToRgb(hex);
    assert(`${d.name} R 0-255`, rgb.r >= 0 && rgb.r <= 255);
    assert(`${d.name} G 0-255`, rgb.g >= 0 && rgb.g <= 255);
    assert(`${d.name} B 0-255`, rgb.b >= 0 && rgb.b <= 255);
  }
}

console.log('\n=== 色相偏移边界测试 ===');
{
  const hsl = hexToHsl('#ff0000');
  const hueAt0 = hsl.h;

  const derived1 = hslToHex({ h: ((hueAt0 - 10) % 360 + 360) % 360, s: 100, l: 50 });
  const d1hsl = hexToHsl(derived1);
  assert('色相-10偏移: 结果在0-360内', d1hsl.h >= 0 && d1hsl.h <= 360);

  const derived2 = hslToHex({ h: ((hueAt0 + 10) % 360 + 360) % 360, s: 100, l: 50 });
  const d2hsl = hexToHsl(derived2);
  assert('色相+10偏移: 结果在0-360内', d2hsl.h >= 0 && d2hsl.h <= 360);

  const crossZero = hslToHex({ h: ((355 + 10) % 360 + 360) % 360, s: 100, l: 50 });
  const crossHsl = hexToHsl(crossZero);
  assert('色相355+10 跨越0度', Math.abs(crossHsl.h - 5) < 1);

  const crossNeg = hslToHex({ h: ((5 - 10) % 360 + 360) % 360, s: 100, l: 50 });
  const crossNegHsl = hexToHsl(crossNeg);
  assert('色相5-10 跨越0度反向', Math.abs(crossNegHsl.h - 355) < 1);
}

console.log('\n=== 饱和度/明度截断测试 ===');
{
  const boosted = hslToHex({ h: 0, s: Math.min(95 + 15, 100), l: 50 });
  const bHsl = hexToHsl(boosted);
  assert('饱和度+15 截断到100', bHsl.s <= 100);

  const lowered = hslToHex({ h: 200, s: 50, l: Math.max(8 - 20, 0) });
  const lHsl = hexToHsl(lowered);
  assert('明度-20 截断到0', lHsl.l >= 0);

  const raised = hslToHex({ h: 200, s: 50, l: Math.min(88 + 20, 100) });
  const rHsl = hexToHsl(raised);
  assert('明度+20 截断到100', rHsl.l <= 100);
}

console.log(`\n=== 测试结果: ${passed} 通过, ${failed} 失败 ===\n`);
process.exit(failed > 0 ? 1 : 0);
