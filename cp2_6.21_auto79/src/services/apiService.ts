import axios from 'axios'
import type {
  StructureType,
  StructureParams,
  DeformationResponse,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

export async function fetchDeformation(
  structureType: StructureType,
  params: StructureParams
): Promise<DeformationResponse> {
  try {
    const response = await api.post<DeformationResponse>('/deform', {
      structure_type: structureType,
      pressure_direction: params.pressureDirection,
      stress_magnitude: params.stressMagnitude,
      rock_hardness: params.rockHardness,
    })
    return response.data
  } catch (error) {
    console.warn('Backend unavailable, using local fallback simulation', error)
    return localSimulateDeformation(structureType, params)
  }
}

function generateInitialLayers(): { vertices: number[]; indices: number[]; layerIndex: number }[] {
  const layers = []
  const W = 20
  const D = 12
  const segsW = 40
  const segsD = 24
  const numLayers = 10
  const thickness = 0.6

  for (let l = 0; l < numLayers; l++) {
    const yBase = -numLayers * thickness / 2 + l * thickness
    const vertices: number[] = []
    const indices: number[] = []

    for (let j = 0; j <= segsD; j++) {
      for (let i = 0; i <= segsW; i++) {
        const x = -W / 2 + (i / segsW) * W
        const z = -D / 2 + (j / segsD) * D
        const y = yBase + (Math.random() - 0.5) * 0.02
        vertices.push(x, y, z)
      }
    }

    for (let j = 0; j < segsD; j++) {
      for (let i = 0; i < segsW; i++) {
        const a = j * (segsW + 1) + i
        const b = a + 1
        const c = a + (segsW + 1)
        const d = c + 1
        indices.push(a, c, b, b, c, d)
      }
    }

    layers.push({ vertices, indices, layerIndex: l })
  }
  return layers
}

function localSimulateDeformation(
  structureType: StructureType,
  params: StructureParams
): DeformationResponse {
  const layers = generateInitialLayers()
  const thickness = 0.6
  const hardnessFactor = 1 / Math.max(1, params.rockHardness)
  const stress = params.stressMagnitude * hardnessFactor
  const dirRad = (params.pressureDirection * Math.PI) / 180
  const dirX = Math.cos(dirRad)
  const dirZ = Math.sin(dirRad)

  const deformedLayers = layers.map((layer) => {
    const verts = [...layer.vertices]
    const W = 20
    const amp = stress * 1.5

    for (let i = 0; i < verts.length; i += 3) {
      const x = verts[i]
      const y = verts[i + 1]
      const z = verts[i + 2]
      const proj = x * dirX + z * dirZ
      let dy = 0
      let dx = 0
      let dz = 0

      const layerOffset = (layer.layerIndex - 4.5) * 0.1

      switch (structureType) {
        case 'anticline':
          dy = Math.cos((proj / W) * Math.PI * 1.5) * amp * (1 + layerOffset)
          break
        case 'syncline':
          dy = -Math.cos((proj / W) * Math.PI * 1.5) * amp * (1 + layerOffset)
          break
        case 'normal_fault':
          if (proj > 0) {
            dy = -amp * 0.6 * (1 + layerOffset)
            dx = dirX * amp * 0.3
            dz = dirZ * amp * 0.3
          }
          break
        case 'reverse_fault':
          if (proj > 0) {
            dy = amp * 0.6 * (1 + layerOffset)
            dx = -dirX * amp * 0.3
            dz = -dirZ * amp * 0.3
          }
          break
        case 'strike_slip_fault':
          if (proj > 0) {
            dx = -dirZ * amp * 0.8
            dz = dirX * amp * 0.8
          } else {
            dx = dirZ * amp * 0.8
            dz = -dirX * amp * 0.8
          }
          break
      }

      verts[i] = x + dx
      verts[i + 1] = y + dy
      verts[i + 2] = z + dz
    }

    const colors = generateLayerColors(layer.layerIndex, params.rockHardness, verts.length / 3)

    return {
      vertices: verts,
      indices: layer.indices,
      colors,
      layerIndex: layer.layerIndex,
    }
  })

  return { layers: deformedLayers, layerThickness: thickness }
}

function generateLayerColors(layerIndex: number, hardness: number, vertexCount: number): number[] {
  const baseColors = [
    [0.29, 0.17, 0.04],
    [0.35, 0.22, 0.08],
    [0.42, 0.28, 0.12],
    [0.48, 0.33, 0.16],
    [0.54, 0.38, 0.20],
    [0.60, 0.44, 0.25],
    [0.66, 0.50, 0.30],
    [0.72, 0.57, 0.36],
    [0.78, 0.64, 0.43],
    [0.83, 0.72, 0.59],
  ]
  const base = baseColors[layerIndex] || baseColors[0]
  const hardnessT = Math.min(1, Math.max(0, (hardness - 1) / 9))
  const darken = 1 - hardnessT * 0.35

  const colors: number[] = []
  for (let i = 0; i < vertexCount; i++) {
    const noise = 0.95 + Math.random() * 0.1
    colors.push(
      Math.min(1, base[0] * darken * noise),
      Math.min(1, base[1] * darken * noise),
      Math.min(1, base[2] * darken * noise)
    )
  }
  return colors
}

export { localSimulateDeformation }
