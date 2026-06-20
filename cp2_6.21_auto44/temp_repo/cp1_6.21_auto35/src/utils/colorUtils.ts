export function colorTemperatureToRGB(kelvin: number): { r: number; g: number; b: number } {
  const temp = kelvin / 100
  let r: number
  let g: number
  let b: number

  if (temp <= 66) {
    r = 255
    g = 99.4708025861 * Math.log(temp) - 161.1195681661
    if (temp <= 19) {
      b = 0
    } else {
      b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307
    }
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592)
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492)
    b = 255
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
  }
}

export function colorTemperatureToHex(kelvin: number): string {
  const { r, g, b } = colorTemperatureToRGB(kelvin)
  const toHex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function colorTemperatureToThreeColor(kelvin: number): string {
  const { r, g, b } = colorTemperatureToRGB(kelvin)
  return `rgb(${r}, ${g}, ${b})`
}
