export interface FilterParams {
  grainIntensity: number
  colorShift: 'warm' | 'cool'
  vignetteRadius: number
}

const WARM_TINT = { r: 212, g: 165, b: 116 }
const COOL_TINT = { r: 126, g: 181, b: 209 }

export class FilterProcessor {
  static applyGrain(imageData: ImageData, intensity: number): ImageData {
    const data = imageData.data
    const strength = (intensity / 100) * 50

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * strength * 2
      data[i] = Math.max(0, Math.min(255, data[i] + noise))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
    }

    return imageData
  }

  static applyColorShift(imageData: ImageData, mode: 'warm' | 'cool'): ImageData {
    const data = imageData.data
    const tint = mode === 'warm' ? WARM_TINT : COOL_TINT
    const blend = 0.15

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] * (1 - blend) + tint.r * blend))
      data[i + 1] = Math.max(
        0,
        Math.min(255, data[i + 1] * (1 - blend) + tint.g * blend)
      )
      data[i + 2] = Math.max(
        0,
        Math.min(255, data[i + 2] * (1 - blend) + tint.b * blend)
      )
    }

    return imageData
  }

  static applyVignette(imageData: ImageData, radiusPercent: number): ImageData {
    const { width, height, data } = imageData
    const centerX = width / 2
    const centerY = height / 2
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
    const vignetteStart = maxDist * (1 - radiusPercent / 100)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > vignetteStart) {
          const idx = (y * width + x) * 4
          const fade =
            1 -
            Math.min(1, (dist - vignetteStart) / (maxDist - vignetteStart))
          const darken = 0.3 + fade * 0.7

          data[idx] = Math.max(0, data[idx] * darken)
          data[idx + 1] = Math.max(0, data[idx + 1] * darken)
          data[idx + 2] = Math.max(0, data[idx + 2] * darken)
        }
      }
    }

    return imageData
  }

  static process(imageData: ImageData, params: FilterParams): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    this.applyGrain(result, params.grainIntensity)
    this.applyColorShift(result, params.colorShift)
    this.applyVignette(result, params.vignetteRadius)

    return result
  }
}
