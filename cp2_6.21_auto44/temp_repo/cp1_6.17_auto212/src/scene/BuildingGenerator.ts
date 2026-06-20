import * as THREE from 'three'

export interface BuildingData {
  position: THREE.Vector3
  width: number
  depth: number
  height: number
  color: THREE.Color
  roofRotation: number
  roofSize: number
}

export interface DensityConfig {
  heightMin: number
  heightMax: number
  colorStart: string
  colorEnd: string
  spacing: number
  buildingCount: number
}

const densityConfigs: Record<'low' | 'medium' | 'high', DensityConfig> = {
  low: {
    heightMin: 10,
    heightMax: 40,
    colorStart: '#A0AEC0',
    colorEnd: '#CBD5E0',
    spacing: 16,
    buildingCount: 35
  },
  medium: {
    heightMin: 30,
    heightMax: 80,
    colorStart: '#718096',
    colorEnd: '#4A5568',
    spacing: 10,
    buildingCount: 80
  },
  high: {
    heightMin: 60,
    heightMax: 120,
    colorStart: '#2D3748',
    colorEnd: '#1A202C',
    spacing: 6.5,
    buildingCount: 130
  }
}

export class BuildingGenerator {
  private gridSize: number = 100

  generate(density: number): BuildingData[] {
    const config = this.getDensityConfig(density)
    const buildings: BuildingData[] = []

    const halfGrid = this.gridSize / 2
    const spacing = config.spacing

    const positions: { x: number; z: number }[] = []
    const rows = Math.floor(this.gridSize / spacing)

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows; j++) {
        const x = -halfGrid + spacing / 2 + i * spacing + (Math.random() - 0.5) * spacing * 0.3
        const z = -halfGrid + spacing / 2 + j * spacing + (Math.random() - 0.5) * spacing * 0.3

        if (Math.abs(x) < halfGrid - 2 && Math.abs(z) < halfGrid - 2) {
          positions.push({ x, z })
        }
      }
    }

    const shuffled = positions.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(config.buildingCount, shuffled.length))

    const colorStart = new THREE.Color(config.colorStart)
    const colorEnd = new THREE.Color(config.colorEnd)

    for (const pos of selected) {
      const sizeFactor = 0.6 + Math.random() * 0.8
      const baseSize = spacing * 0.55
      const width = baseSize * sizeFactor + Math.random() * 2
      const depth = baseSize * sizeFactor + Math.random() * 2

      const heightVariation = Math.random()
      const height = config.heightMin + Math.pow(heightVariation, 1.5) * (config.heightMax - config.heightMin)

      const colorMix = Math.random()
      const color = colorStart.clone().lerp(colorEnd, colorMix)

      const roofRotation = Math.random() * Math.PI
      const roofSize = Math.min(width, depth) * 0.3 + Math.random() * 1.5

      buildings.push({
        position: new THREE.Vector3(pos.x, height / 2, pos.z),
        width,
        depth,
        height,
        color,
        roofRotation,
        roofSize
      })
    }

    return buildings
  }

  getDensityConfig(density: number): DensityConfig {
    if (density <= 33) {
      const t = density / 33
      return this.lerpConfig(densityConfigs.low, densityConfigs.medium, t * 0.3)
    } else if (density <= 66) {
      const t = (density - 33) / 33
      return this.lerpConfig(densityConfigs.medium, densityConfigs.high, t * 0.5)
    } else {
      const t = (density - 66) / 34
      return this.lerpConfig(densityConfigs.high, densityConfigs.high, t)
    }
  }

  private lerpConfig(a: DensityConfig, b: DensityConfig, t: number): DensityConfig {
    const colorStart = new THREE.Color(a.colorStart).lerp(new THREE.Color(b.colorStart), t)
    const colorEnd = new THREE.Color(a.colorEnd).lerp(new THREE.Color(b.colorEnd), t)

    return {
      heightMin: a.heightMin + (b.heightMin - a.heightMin) * t,
      heightMax: a.heightMax + (b.heightMax - a.heightMax) * t,
      colorStart: '#' + colorStart.getHexString(),
      colorEnd: '#' + colorEnd.getHexString(),
      spacing: a.spacing + (b.spacing - a.spacing) * t,
      buildingCount: Math.round(a.buildingCount + (b.buildingCount - a.buildingCount) * t)
    }
  }
}
