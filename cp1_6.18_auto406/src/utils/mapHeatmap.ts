export function getHeatColor(votes: number, maxVotes: number): string {
  if (maxVotes === 0) return '#0000FF'
  const ratio = Math.min(Math.max(votes / maxVotes, 0), 1)
  const r = Math.round(ratio * 255)
  const b = Math.round((1 - ratio) * 255)
  return `rgb(${r}, 0, ${b})`
}

export function interpolateColor(
  color1: [number, number, number],
  color2: [number, number, number],
  ratio: number
): [number, number, number] {
  const t = Math.min(Math.max(ratio, 0), 1)
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * t),
    Math.round(color1[1] + (color2[1] - color1[1]) * t),
    Math.round(color1[2] + (color2[2] - color1[2]) * t),
  ]
}

export function rgbToString(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}
