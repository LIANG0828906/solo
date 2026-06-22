export interface FilterState {
  blur: number
  brightness: number
  contrast: number
  hueRotate: number
  saturate: number
  grayscale: number
}

export const defaultFilters: FilterState = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  hueRotate: 0,
  saturate: 100,
  grayscale: 0,
}

export function generateCSSString(filters: FilterState): string {
  const parts: string[] = []

  if (filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`)
  }
  if (filters.brightness !== 100) {
    parts.push(`brightness(${filters.brightness}%)`)
  }
  if (filters.contrast !== 100) {
    parts.push(`contrast(${filters.contrast}%)`)
  }
  if (filters.hueRotate !== 0) {
    parts.push(`hue-rotate(${filters.hueRotate}deg)`)
  }
  if (filters.saturate !== 100) {
    parts.push(`saturate(${filters.saturate}%)`)
  }
  if (filters.grayscale > 0) {
    parts.push(`grayscale(${filters.grayscale}%)`)
  }

  return parts.length > 0 ? `filter: ${parts.join(' ')};` : 'filter: none;'
}

export function applyFilters(filters: FilterState): string {
  const parts: string[] = []

  if (filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`)
  }
  if (filters.brightness !== 100) {
    parts.push(`brightness(${filters.brightness}%)`)
  }
  if (filters.contrast !== 100) {
    parts.push(`contrast(${filters.contrast}%)`)
  }
  if (filters.hueRotate !== 0) {
    parts.push(`hue-rotate(${filters.hueRotate}deg)`)
  }
  if (filters.saturate !== 100) {
    parts.push(`saturate(${filters.saturate}%)`)
  }
  if (filters.grayscale > 0) {
    parts.push(`grayscale(${filters.grayscale}%)`)
  }

  return parts.join(' ')
}
