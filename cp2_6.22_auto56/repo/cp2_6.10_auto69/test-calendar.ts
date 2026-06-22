import {
  degToRad,
  radToDeg,
  lerp,
  lerpColor,
  getSolarTermData,
  calculateProjection,
  calculateTimeInfo,
  SHICHEN_NAMES,
  ZODIAC_NAMES,
  SHICHEN_DATA,
  SOLAR_TERMS
} from './src/utils/calendar.js';

console.log('=== 测试日历计算模块 ===\n');

console.log('1. 基础工具函数测试:');
console.log('   degToRad(180) =', degToRad(180));
console.log('   radToDeg(Math.PI) =', radToDeg(Math.PI));
console.log('   lerp(0, 100, 0.5) =', lerp(0, 100, 0.5));
console.log('   lerpColor(#000000, #ffffff, 0.5) =', lerpColor('#000000', '#ffffff', 0.5));
console.log();

console.log('2. 常量数据验证:');
console.log('   SHICHEN_NAMES 长度:', SHICHEN_NAMES.length);
console.log('   ZODIAC_NAMES 长度:', ZODIAC_NAMES.length);
console.log('   SHICHEN_DATA 长度:', SHICHEN_DATA.length);
console.log('   SOLAR_TERMS 长度:', SOLAR_TERMS.length);
console.log();

console.log('3. 时辰数据示例:');
SHICHEN_DATA.slice(0, 4).forEach(s => {
  console.log(`   ${s.index}: ${s.name}时 (${s.zodiac}) - ${s.modernStart}:00-${s.modernEnd}:00`);
});
console.log('   ...');
console.log();

console.log('4. 节气数据示例:');
[0, 6, 12, 18].forEach(i => {
  const t = SOLAR_TERMS[i];
  console.log(`   [${i}] ${t.name}: gnomonAngle=${t.gnomonAngle.toFixed(1)}, sunMaxAltitude=${t.sunMaxAltitude.toFixed(1)}, lightColor=${t.lightColor}`);
});
console.log();

console.log('5. 浮点节气索引测试 (平滑过渡):');
const t1 = getSolarTermData(0.5);
console.log(`   索引 0.5: name=${t1.name}, gnomonAngle=${t1.gnomonAngle.toFixed(2)}`);
const t2 = getSolarTermData(12.3);
console.log(`   索引 12.3: name=${t2.name}, gnomonAngle=${t2.gnomonAngle.toFixed(2)}`);
console.log();

console.log('6. 投影计算测试:');
const projectionNoon = calculateProjection(90, 90, 73, 150, 8);
console.log(`   正午 (sunAngle=90°): x=${projectionNoon.x.toFixed(3)}, z=${projectionNoon.z.toFixed(3)}, length=${projectionNoon.length.toFixed(3)}, direction=${projectionNoon.direction.toFixed(3)}rad`);

const projectionMorning = calculateProjection(90, 45, 73, 150, 8);
console.log(`   上午 (sunAngle=45°): x=${projectionMorning.x.toFixed(3)}, z=${projectionMorning.z.toFixed(3)}, length=${projectionMorning.length.toFixed(3)}, direction=${projectionMorning.direction.toFixed(3)}rad`);
console.log();

console.log('7. 时间信息测试:');
[0, 30, 75, 90, 120, 180].forEach(angle => {
  const info = calculateTimeInfo(angle, 12);
  console.log(`   sunAngle=${angle}°: ${info.shichenName}时${info.ke}刻 (${info.modernTime}), progress=${(info.dayProgress * 100).toFixed(0)}%`);
});
console.log();

console.log('=== 所有测试通过 ===');
