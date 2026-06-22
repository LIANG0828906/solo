export function formatScientific(num: number): string {
  if (num === 0) return '0'
  const exp = Math.floor(Math.log10(Math.abs(num)))
  const mantissa = num / Math.pow(10, exp)
  return `${mantissa.toFixed(2)} × 10^${exp}`
}

export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}
