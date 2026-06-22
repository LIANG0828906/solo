
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
  return `rgba(${r}, ${g}, ${b}, 0.08)`
}

export { interpolateColor }
