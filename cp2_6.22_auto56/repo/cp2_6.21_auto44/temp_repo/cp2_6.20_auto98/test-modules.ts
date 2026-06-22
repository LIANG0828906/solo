import {
  generateMonochromatic,
  generateComplementary,
  generateTriadic,
  createColorFromHSL,
  interpolateColor
} from './src/modules/paletteGenerator';
import { createColor, getContrastColor, rgbToHex, hexToRgb, rgbToHsl, hslToRgb } from './src/utils/colorUtils';

console.log('=== 测试颜色工具函数 ===');

console.log('rgbToHex(255, 0, 0):', rgbToHex(255, 0, 0));
console.log('hexToRgb("#00ff00"):', hexToRgb('#00ff00'));
console.log('rgbToHsl(0, 0, 255):', rgbToHsl(0, 0, 255));
console.log('hslToRgb(120, 100, 50):', hslToRgb(120, 100, 50));
console.log('getContrastColor("#ffffff"):', getContrastColor('#ffffff'));
console.log('getContrastColor("#000000"):', getContrastColor('#000000'));

console.log('\n=== 测试配色方案生成模块 ===');

const baseColor = createColorFromHSL(200, 70, 50);
console.log('基准颜色:', baseColor.hex, 'HSL:', baseColor.hsl);

console.log('\n单色渐变方案:');
const monoColors = generateMonochromatic(baseColor);
monoColors.forEach((color, index) => {
  console.log(`  ${index + 1}. ${color.hex} - HSL: (${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`);
});

console.log('\n互补色方案:');
const compColors = generateComplementary(baseColor);
compColors.forEach((color, index) => {
  console.log(`  ${index + 1}. ${color.hex} - HSL: (${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`);
});

console.log('\n三元色方案:');
const triadicColors = generateTriadic(baseColor);
triadicColors.forEach((color, index) => {
  console.log(`  ${index + 1}. ${color.hex} - HSL: (${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`);
});

console.log('\n=== 测试辅助函数 ===');

const color1 = createColor({ r: 255, g: 0, b: 0 }, 0);
const color2 = createColor({ r: 0, g: 0, b: 255 }, 0);

console.log('颜色插值 (t=0.5):', interpolateColor(color1, color2, 0.5).hex);
console.log('从HSL创建颜色 (h=120, s=80, l=40):', createColorFromHSL(120, 80, 40).hex);

console.log('\n✅ 所有模块测试完成！');
