import * as THREE from 'three'

export interface SurfaceParams {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export const defaultParams: SurfaceParams = {
  a: 2,
  b: 1,
  c: 1,
  d: 0.5,
  e: 1,
  f: 1,
}

export const GRID_WIDTH = 60
export const GRID_HEIGHT = 60

const colorStart = new THREE.Color('#00E5FF')
const colorEnd = new THREE.Color('#FF6B6B')

function lerpColor(t: number): THREE.Color {
  return colorStart.clone().lerp(colorEnd, Math.max(0, Math.min(1, t)))
}

export function createMobiusStrip(
  widthSeg: number,
  heightSeg: number,
  params: SurfaceParams
): THREE.BufferGeometry {
  const { a, b, c } = params
  const geometry = new THREE.BufferGeometry()

  const vertices: number[] = []
  const colors: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= heightSeg; i++) {
    const v = (i / heightSeg) * 2 - 1

    for (let j = 0; j <= widthSeg; j++) {
      const u = (j / widthSeg) * Math.PI * 2

      const x = (a + b * v * Math.cos(u / 2)) * Math.cos(u)
      const y = (a + b * v * Math.cos(u / 2)) * Math.sin(u)
      const z = c * v * Math.sin(u / 2)

      vertices.push(x, y, z)

      const colorT = (j / widthSeg + i / heightSeg) / 2
      const color = lerpColor(colorT)
      colors.push(color.r, color.g, color.b)

      uvs.push(j / widthSeg, i / heightSeg)
    }
  }

  for (let i = 0; i < heightSeg; i++) {
    for (let j = 0; j < widthSeg; j++) {
      const aIdx = i * (widthSeg + 1) + j
      const bIdx = aIdx + 1
      const cIdx = aIdx + (widthSeg + 1)
      const dIdx = cIdx + 1

      indices.push(aIdx, cIdx, bIdx)
      indices.push(bIdx, cIdx, dIdx)
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

export function updateSurfaceVertices(
  geometry: THREE.BufferGeometry,
  widthSeg: number,
  heightSeg: number,
  params: SurfaceParams
): void {
  const { a, b, c } = params
  const positions = geometry.attributes.position.array as Float32Array
  const colors = geometry.attributes.color.array as Float32Array

  let posIdx = 0
  let colIdx = 0

  for (let i = 0; i <= heightSeg; i++) {
    const v = (i / heightSeg) * 2 - 1

    for (let j = 0; j <= widthSeg; j++) {
      const u = (j / widthSeg) * Math.PI * 2

      const x = (a + b * v * Math.cos(u / 2)) * Math.cos(u)
      const y = (a + b * v * Math.cos(u / 2)) * Math.sin(u)
      const z = c * v * Math.sin(u / 2)

      positions[posIdx] = x
      positions[posIdx + 1] = y
      positions[posIdx + 2] = z
      posIdx += 3

      const colorT = (j / widthSeg + i / heightSeg) / 2
      const color = lerpColor(colorT)
      colors[colIdx] = color.r
      colors[colIdx + 1] = color.g
      colors[colIdx + 2] = color.b
      colIdx += 3
    }
  }

  geometry.attributes.position.needsUpdate = true
  geometry.attributes.color.needsUpdate = true
  geometry.computeVertexNormals()
}

export const parametricEquationText = `x = (a + b·v·cos(u/2)) · cos(u)
y = (a + b·v·cos(u/2)) · sin(u)
z = c·v·sin(u/2)
u ∈ [0, 2π], v ∈ [-1, 1]`

export const wireframeVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const wireframeFragmentShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    uv.x = mod(uv.x + uTime * uSpeed, 1.0);
    uv.y = mod(uv.y + uTime * uSpeed * 0.5, 1.0);

    float lineWidth = 0.008;
    float gridX = abs(fract(uv.x * 30.0) - 0.5) * 2.0;
    float gridY = abs(fract(uv.y * 30.0) - 0.5) * 2.0;

    float grid = 1.0 - min(gridX, gridY);
    grid = smoothstep(1.0 - lineWidth, 1.0, grid);

    if (grid < 0.1) {
      discard;
    }

    gl_FragColor = vec4(1.0, 1.0, 1.0, grid * uOpacity);
  }
`
