import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

function parseRgba(str) {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (!m) return null
  return {
    r: parseInt(m[1], 10),
    g: parseInt(m[2], 10),
    b: parseInt(m[3], 10),
    a: m[4] !== undefined ? parseFloat(m[4]) : 1
  }
}

function colorDiff(a, b) {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
    Math.pow(a.g - b.g, 2) +
    Math.pow(a.b - b.b, 2)
  )
}

const code = `
const interpolateColor = (score) => {
  const clampedScore = Math.max(0, Math.min(100, score))
  const anchors = [
    { score: 0, color: { r: 39, g: 174, b: 96 } },
    { score: 50, color: { r: 243, g: 156, b: 18 } },
    { score: 100, color: { r: 231, g: 76, b: 60 } }
  ]
  let lower = anchors[0]
  let upper = anchors[anchors.length - 1]
  for (let i = 0; i < anchors.length - 1; i++) {
    if (clampedScore >= anchors[i].score && clampedScore <= anchors[i + 1].score) {
      lower = anchors[i]
      upper = anchors[i + 1]
      break
    }
  }
  const range = upper.score - lower.score
  const t = range === 0 ? 0 : (clampedScore - lower.score) / range
  const r = Math.round(lower.color.r + (upper.color.r - lower.color.r) * t)
  const g = Math.round(lower.color.g + (upper.color.g - lower.color.g) * t)
  const b = Math.round(lower.color.b + (upper.color.b - lower.color.b) * t)
  return \`rgba(\${r}, \${g}, \${b}, 0.08)\`
}

export { interpolateColor }
`

const tmpFile = path.join(root, 'scripts', '_interpolate-tmp.mjs')
await import('fs').then((fs) => fs.promises.writeFile(tmpFile, code, 'utf8'))

try {
  const { interpolateColor } = await import(`file://${tmpFile.replace(/\\/g, '/')}`)

  let passed = 0
  let failed = 0

  function test(name, fn) {
    try {
      fn()
      console.log(`  ✓ ${name}`)
      passed++
    } catch (err) {
      console.log(`  ✗ ${name}`)
      console.log(`    Error: ${err.message}`)
      failed++
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'Assertion failed')
  }

  function assertApprox(actual, expected, epsilon, msg) {
    if (Math.abs(actual - expected) > epsilon) {
      throw new Error(`${msg || 'Value mismatch'}: expected ~${expected}, got ${actual}`)
    }
  }

  console.log('\n=== interpolateColor Unit Tests ===\n')

  test('0分返回绿色系 (锚点精确值)', () => {
    const c = parseRgba(interpolateColor(0))
    assert(c, '返回有效rgba字符串')
    assert(c.r === 39 && c.g === 174 && c.b === 96, `0分应为(39,174,96), 实际(${c.r},${c.g},${c.b})`)
  })

  test('50分返回橙色系 (锚点精确值)', () => {
    const c = parseRgba(interpolateColor(50))
    assert(c, '返回有效rgba字符串')
    assert(c.r === 243 && c.g === 156 && c.b === 18, `50分应为(243,156,18), 实际(${c.r},${c.g},${c.b})`)
  })

  test('100分返回红色系 (锚点精确值)', () => {
    const c = parseRgba(interpolateColor(100))
    assert(c, '返回有效rgba字符串')
    assert(c.r === 231 && c.g === 76 && c.b === 60, `100分应为(231,76,60), 实际(${c.r},${c.g},${c.b})`)
  })

  test('25分在绿-橙区间中点', () => {
    const c = parseRgba(interpolateColor(25))
    const midR = Math.round(39 + (243 - 39) * 0.5)
    const midG = Math.round(174 + (156 - 174) * 0.5)
    const midB = Math.round(96 + (18 - 96) * 0.5)
    assert(c.r === midR && c.g === midG && c.b === midB,
      `25分中点应为(${midR},${midG},${midB}), 实际(${c.r},${c.g},${c.b})`)
  })

  test('75分在橙-红区间中点', () => {
    const c = parseRgba(interpolateColor(75))
    const midR = Math.round(243 + (231 - 243) * 0.5)
    const midG = Math.round(156 + (76 - 156) * 0.5)
    const midB = Math.round(18 + (60 - 18) * 0.5)
    assert(c.r === midR && c.g === midG && c.b === midB,
      `75分中点应为(${midR},${midG},${midB}), 实际(${c.r},${c.g},${c.b})`)
  })

  test('边界连续性: 49.9分 vs 50.1分 颜色差很小', () => {
    const c1 = parseRgba(interpolateColor(49.9))
    const c2 = parseRgba(interpolateColor(50.1))
    const diff = colorDiff(c1, c2)
    assert(diff < 5, `跨50分边界色差应<5, 实际=${diff.toFixed(2)}`)
  })

  test('边界连续性: 50分 附近连续10个点颜色单调变化', () => {
    const prev = parseRgba(interpolateColor(45))
    let lastG = prev.g
    for (let s = 46; s <= 55; s++) {
      const c = parseRgba(interpolateColor(s))
      assert(c.g <= lastG + 1, `分数增加时G不应突变: score=${s}, g=${c.g}, prev_g=${lastG}`)
      lastG = c.g
    }
  })

  test('全范围0-100: RGB通道单调/连续变化', () => {
    let prev = parseRgba(interpolateColor(0))
    let maxJump = 0
    let worstScore = 0
    for (let s = 1; s <= 100; s++) {
      const c = parseRgba(interpolateColor(s))
      const diff = colorDiff(prev, c)
      if (diff > maxJump) {
        maxJump = diff
        worstScore = s
      }
      prev = c
    }
    assert(maxJump < 10, `相邻1分最大色差应<10, 实际最大跳变在score=${worstScore}, diff=${maxJump.toFixed(2)}`)
  })

  test('超出范围clamp: -10 等价于 0', () => {
    const c1 = parseRgba(interpolateColor(-10))
    const c2 = parseRgba(interpolateColor(0))
    assert(colorDiff(c1, c2) === 0, '-10应被clamp到0, 颜色必须完全一致')
  })

  test('超出范围clamp: 999 等价于 100', () => {
    const c1 = parseRgba(interpolateColor(999))
    const c2 = parseRgba(interpolateColor(100))
    assert(colorDiff(c1, c2) === 0, '999应被clamp到100, 颜色必须完全一致')
  })

  test('所有返回值带alpha=0.08', () => {
    for (let s = 0; s <= 100; s += 10) {
      const c = parseRgba(interpolateColor(s))
      assert(Math.abs(c.a - 0.08) < 0.001, `score=${s} alpha应为0.08, 实际=${c.a}`)
    }
  })

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)
  process.exit(failed > 0 ? 1 : 0)

} finally {
  try {
    await import('fs').then((fs) => fs.promises.unlink(tmpFile))
  } catch (_) {}
}
