import type { GeometryItemData, LightsConfig } from '../store/sceneStore'

export interface ExportedConfig {
  version: string
  exportedAt: string
  geometries: Array<{
    id: string
    type: string
    name: string
    position: { x: number; y: number; z: number }
    rotationDegrees: { x: number; y: number; z: number }
    scale: { x: number; y: number; z: number }
    material: {
      color: string
      roughness: number
      metalness: number
    }
  }>
  lights: {
    ambient: {
      intensity: number
    }
    point: {
      position: { x: number; y: number; z: number }
      intensity: number
    }
  }
  metadata: {
    geometryCount: number
  }
}

export const exportConfig = (
  geometries: GeometryItemData[],
  lights: LightsConfig
): ExportedConfig => {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    geometries: geometries.map((g) => ({
      id: g.id,
      type: g.type,
      name: g.name,
      position: { ...g.position },
      rotationDegrees: { ...g.rotation },
      scale: { ...g.scale },
      material: { ...g.material },
    })),
    lights: {
      ambient: {
        intensity: lights.ambientIntensity,
      },
      point: {
        position: { ...lights.pointPosition },
        intensity: lights.pointIntensity,
      },
    },
    metadata: {
      geometryCount: geometries.length,
    },
  }
}

export const exportToJsonString = (
  geometries: GeometryItemData[],
  lights: LightsConfig
): string => {
  const config = exportConfig(geometries, lights)
  return JSON.stringify(config, null, 2)
}

export const downloadJson = (content: string, filename: string = 'sculpture-config.json') => {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  }
}
