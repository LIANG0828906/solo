import { hslToRgb, rgbToHex, createDeviatedColor, generateRandomTargetHSL, isSameColor, shuffleArray } from './src/modules/color/utils.ts'
import { createColorItem } from './src/modules/color/ColorItem.ts'

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}`)
    failed++
  }
}

function assertApprox(actual, expected, tolerance, label) {
  assert(Math.abs(actual - expected) <= tolerance, `${label} (got ${actual}, expected ~${expected})`)
}

console.log('\n=== 1. hslToRgb 基础转换 ===')

{
  const black = hslToRgb(0, 0, 0)
  assert(black.r === 0 && black.g === 0 && black.b === 0, '纯黑 (0,0,0) → RGB(0,0,0)')

  const white = hslToRgb(0, 0, 100)
  assert(white.r === 255 && white.g === 255 && white.b === 255, '纯白 (0,0,100) → RGB(255,255,255)')

  const red = hslToRgb(0, 100, 50)
  assert(red.r === 255 && red.g === 0 && red.b === 0, '红色 (0,100,50) → RGB(255,0,0)')

  const green = hslToRgb(120, 100, 50)
  assert(green.r === 0 && green.g === 255 && green.b === 0, '绿色 (120,100,50) → RGB(0,255,0)')

  const blue = hslToRgb(240, 100, 50)
  assert(blue.r === 0 && blue.g === 0 && blue.b === 255, '蓝色 (240,100,50) → RGB(0,0,255)')

  const yellow = hslToRgb(60, 100, 50)
  assert(yellow.r === 255 && yellow.g === 255 && yellow.b === 0, '黄色 (60,100,50) → RGB(255,255,0)')

  const cyan = hslToRgb(180, 100, 50)
  assert(cyan.r === 0 && cyan.g === 255 && cyan.b === 255, '青色 (180,100,50) → RGB(0,255,255)')

  const magenta = hslToRgb(300, 100, 50)
  assert(magenta.r === 255 && magenta.g === 0 && magenta.b === 255, '品红 (300,100,50) → RGB(255,0,255)')
}

console.log('\n=== 2. hslToRgb 边界与中间值 ===')

{
  const darkGray = hslToRgb(0, 0, 25)
  assertApprox(darkGray.r, 64, 1, '暗灰 (0,0,25) R≈64')
  assertApprox(darkGray.g, 64, 1, '暗灰 (0,0,25) G≈64')
  assertApprox(darkGray.b, 64, 1, '暗灰 (0,0,25) B≈64')

  const h360 = hslToRgb(360, 100, 50)
  assert(h360.r === 255, '360度色相 ≡ 0度 → 红色 R=255')

  const midSat = hslToRgb(0, 50, 50)
  assert(midSat.r === 191 && midSat.g === 64 && midSat.b === 64, '中等饱和红 (0,50,50) → RGB(191,64,64)')
}

console.log('\n=== 3. rgbToHex ===')

{
  assert(rgbToHex(255, 0, 0) === '#FF0000', 'RGB(255,0,0) → #FF0000')
  assert(rgbToHex(0, 255, 0) === '#00FF00', 'RGB(0,255,0) → #00FF00')
  assert(rgbToHex(0, 0, 255) === '#0000FF', 'RGB(0,0,255) → #0000FF')
  assert(rgbToHex(44, 62, 80) === '#2C3E50', 'RGB(44,62,80) → #2C3E50')
  assert(rgbToHex(26, 188, 156) === '#1ABC9C', 'RGB(26,188,156) → #1ABC9C')
  assert(rgbToHex(5, 5, 5) === '#050505', '单字符十六进制补零')

  const clamped = rgbToHex(300, -10, 128)
  assert(clamped === '#FF0080', '溢出值被 clamp: ' + clamped)
}

console.log('\n=== 4. createColorItem 集成 ===')

{
  const item = createColorItem({ h: 0, s: 100, l: 50 })
  assert(item.hex === '#FF0000', `createColorItem(红) hex 正确: ${item.hex}`)
  assert(item.rgb.r === 255 && item.rgb.g === 0 && item.rgb.b === 0, 'createColorItem(红) rgb 正确')
  assert(item.hsl.h === 0 && item.hsl.s === 100 && item.hsl.l === 50, 'createColorItem 保留原始 HSL')
  assert(typeof item.id === 'string' && item.id.length > 0, 'createColorItem 生成 ID')
}

console.log('\n=== 5. createDeviatedColor 偏离逻辑 ===')

{
  const base = { h: 180, s: 80, l: 60 }

  let hueOk = true
  for (let i = 0; i < 50; i++) {
    const dev = createDeviatedColor(base, [10, 20], 'hue')
    const hueDiff = Math.abs(dev.h - base.h)
    if (hueDiff < 10 || hueDiff > 20) {
      console.log(`  ❌ 色相偏离越界: diff=${hueDiff.toFixed(1)}`)
      hueOk = false
      failed++
    }
    if (dev.s !== base.s || dev.l !== base.l) {
      console.log(`  ❌ 色相偏离时 s/l 不应变化: s=${dev.s} l=${dev.l}`)
      hueOk = false
      failed++
    }
  }
  if (hueOk) {
    console.log('  ✅ 50次色相偏离全部在 [10,20] 范围，s/l 不变')
    passed++
  }

  let satOk = true
  for (let i = 0; i < 50; i++) {
    const dev = createDeviatedColor(base, [5, 15], 'sat')
    const satDiff = Math.abs(dev.s - base.s)
    if (satDiff < 5 || satDiff > 15) {
      console.log(`  ❌ 饱和度偏离越界: diff=${satDiff.toFixed(1)}`)
      satOk = false
      failed++
    }
    if (dev.h !== base.h || dev.l !== base.l) {
      console.log(`  ❌ 饱和度偏离时 h/l 不应变化: h=${dev.h} l=${dev.l}`)
      satOk = false
      failed++
    }
  }
  if (satOk) {
    console.log('  ✅ 50次饱和度偏离全部在 [5,15] 范围，h/l 不变')
    passed++
  }
}

console.log('\n=== 6. generateRandomTargetHSL 范围验证 ===')

{
  let allOk = true
  for (let i = 0; i < 200; i++) {
    const hsl = generateRandomTargetHSL()
    if (hsl.h < 0 || hsl.h > 360) { allOk = false; console.log(`  ❌ h=${hsl.h} 越界`) }
    if (hsl.s < 50 || hsl.s > 100) { allOk = false; console.log(`  ❌ s=${hsl.s} 越界`) }
    if (hsl.l < 40 || hsl.l > 90) { allOk = false; console.log(`  ❌ l=${hsl.l} 越界`) }
  }
  if (allOk) {
    console.log('  ✅ 200次随机生成全部在范围内')
    passed++
  } else {
    failed++
  }
}

console.log('\n=== 7. isSameColor ===')

{
  const a = createColorItem({ h: 0, s: 100, l: 50 })
  const b = createColorItem({ h: 0, s: 100, l: 50 })
  assert(isSameColor(a, b), '相同 HSL → isSameColor=true')

  const c = createColorItem({ h: 5, s: 100, l: 50 })
  assert(!isSameColor(a, c), '不同 HSL → isSameColor=false')
}

console.log('\n=== 8. shuffleArray ===')

{
  const arr = [1, 2, 3, 4, 5]
  const shuffled = shuffleArray(arr)
  assert(shuffled.length === 5, 'shuffle 后长度不变')
  assert(arr.length === 5, '原数组不被修改')
  const sorted = [...shuffled].sort((a, b) => a - b)
  assert(JSON.stringify(sorted) === JSON.stringify(arr), 'shuffle 后元素相同（顺序不同）')
}

console.log(`\n${'='.repeat(40)}`)
console.log(`结果: ${passed} 通过, ${failed} 失败`)
if (failed > 0) {
  console.log('⚠️  有测试未通过，请修复后再继续！')
  process.exit(1)
} else {
  console.log('🎉 全部通过！底层色彩模块验证OK')
}
