const testDuration = 5;
const interval = 100;
let elapsed = 0;
let lastTime = performance.now();
let maxError = 0;
let totalError = 0;
let tickCount = 0;

console.log(`计时器精度测试 - 运行 ${testDuration} 秒，更新间隔 ${interval}ms`);
console.log('='.repeat(50));

const timer = setInterval(() => {
  const now = performance.now();
  const actualDelta = now - lastTime;
  const expectedDelta = interval;
  const error = Math.abs(actualDelta - expectedDelta);

  if (error > maxError) maxError = error;
  totalError += error;
  tickCount++;
  elapsed += actualDelta / 1000;
  lastTime = now;

  if (elapsed >= testDuration) {
    clearInterval(timer);
    console.log(`\n测试完成！`);
    console.log(`总运行时间: ${elapsed.toFixed(3)} 秒`);
    console.log(`总 tick 次数: ${tickCount}`);
    console.log(`最大误差: ${maxError.toFixed(2)}ms`);
    console.log(`平均误差: ${(totalError / tickCount).toFixed(2)}ms`);
    console.log(`误差是否 < 50ms: ${maxError < 50 ? '✅ 通过' : '❌ 未通过'}`);
  }
}, interval);
