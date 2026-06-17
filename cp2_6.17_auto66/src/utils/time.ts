export function parseTimestamp(value: number | string): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return parsed
    const num = Number(value)
    if (!Number.isNaN(num)) return num
  }
  return 0
}

export function compareTimestamps(a: number | string, b: number | string): number {
  return parseTimestamp(a) - parseTimestamp(b)
}
