import * as THREE from 'three'
import type { WeatherType } from '../core/EventBus'

interface WeatherLightConfig {
  ambientIntensity: number
  ambientColor: THREE.Color
  directionalIntensity: number
  directionalColor: THREE.Color
  shadowSoftness: number
  fogColor: THREE.Color
  fogDensity: number
  skyColor: THREE.Color
}

const weatherConfigs: Record<WeatherType, WeatherLightConfig> = {
  sunny: {
    ambientIntensity: 1.0,
    ambientColor: new THREE.Color(0xffffff),
    directionalIntensity: 1.2,
    directionalColor: new THREE.Color(0xfffaf0),
    shadowSoftness: 0,
    fogColor: new THREE.Color(0x87ceeb),
    fogDensity: 0.002,
    skyColor: new THREE.Color(0x87ceeb)
  },
  cloudy: {
    ambientIntensity: 0.6,
    ambientColor: new THREE.Color(0xb0bec5),
    directionalIntensity: 0.5,
    directionalColor: new THREE.Color(0xe0e0e0),
    shadowSoftness: 0.5,
    fogColor: new THREE.Color(0x90a4ae),
    fogDensity: 0.008,
    skyColor: new THREE.Color(0x78909c)
  },
  rain: {
    ambientIntensity: 0.3,
    ambientColor: new THREE.Color(0x546e7a),
    directionalIntensity: 0.2,
    directionalColor: new THREE.Color(0x78909c),
    shadowSoftness: 0.9,
    fogColor: new THREE.Color(0x37474f),
    fogDensity: 0.015,
    skyColor: new THREE.Color(0x263238)
  },
  dusk: {
    ambientIntensity: 0.5,
    ambientColor: new THREE.Color(0xff8a65),
    directionalIntensity: 0.8,
    directionalColor: new THREE.Color(0xffcc80),
    shadowSoftness: 0.6,
    fogColor: new THREE.Color(0xff7043),
    fogDensity: 0.01,
    skyColor: new THREE.Color(0xff5722)
  }
}

export class LightSystem {
  public ambientLight: THREE.AmbientLight
  public directionalLight: THREE.DirectionalLight
  private scene: THREE.Scene

  private currentConfig: WeatherLightConfig
  private targetConfig: WeatherLightConfig
  private transitionProgress: number = 1
  private transitionDuration: number = 1
  private isTransitioning: boolean = false

  constructor(scene: THREE.Scene) {
    this.scene = scene

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1)
    scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    this.directionalLight.position.set(60, 100, 40)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.width = 1024
    this.directionalLight.shadow.mapSize.height = 1024
    this.directionalLight.shadow.camera.near = 0.5
    this.directionalLight.shadow.camera.far = 300
    this.directionalLight.shadow.camera.left = -80
    this.directionalLight.shadow.camera.right = 80
    this.directionalLight.shadow.camera.top = 80
    this.directionalLight.shadow.camera.bottom = -80
    this.directionalLight.shadow.bias = -0.0001
    scene.add(this.directionalLight)

    this.currentConfig = { ...weatherConfigs.sunny }
    this.targetConfig = { ...weatherConfigs.sunny }

    this.applyConfig(this.currentConfig)
  }

  setWeather(weather: WeatherType): void {
    this.targetConfig = { ...weatherConfigs[weather] }
    this.currentConfig = this.getCurrentSnapshot()
    this.transitionProgress = 0
    this.isTransitioning = true
  }

  update(deltaTime: number): void {
    if (!this.isTransitioning) return

    this.transitionProgress += deltaTime / this.transitionDuration
    if (this.transitionProgress >= 1) {
      this.transitionProgress = 1
      this.isTransitioning = false
      this.currentConfig = { ...this.targetConfig }
    }

    const t = this.easeInOutCubic(this.transitionProgress)
    const current = this.lerpConfig(this.currentConfig, this.targetConfig, t)

    this.applyConfig(current)
  }

  private applyConfig(config: WeatherLightConfig): void {
    this.ambientLight.intensity = config.ambientIntensity
    this.ambientLight.color.copy(config.ambientColor)

    this.directionalLight.intensity = config.directionalIntensity
    this.directionalLight.color.copy(config.directionalColor)

    if (config.shadowSoftness > 0.5) {
      this.directionalLight.shadow.radius = config.shadowSoftness * 5
    } else {
      this.directionalLight.shadow.radius = config.shadowSoftness * 2
    }

    if (this.scene.fog) {
      ;(this.scene.fog as THREE.FogExp2).color.copy(config.fogColor)
      ;(this.scene.fog as THREE.FogExp2).density = config.fogDensity
    }

    this.scene.background = config.skyColor
  }

  private getCurrentSnapshot(): WeatherLightConfig {
    return {
      ambientIntensity: this.ambientLight.intensity,
      ambientColor: this.ambientLight.color.clone(),
      directionalIntensity: this.directionalLight.intensity,
      directionalColor: this.directionalLight.color.clone(),
      shadowSoftness: this.directionalLight.shadow.radius / 5,
      fogColor: this.scene.fog ? (this.scene.fog as THREE.FogExp2).color.clone() : new THREE.Color(),
      fogDensity: this.scene.fog ? (this.scene.fog as THREE.FogExp2).density : 0,
      skyColor: (this.scene.background as THREE.Color).clone()
    }
  }

  private lerpConfig(a: WeatherLightConfig, b: WeatherLightConfig, t: number): WeatherLightConfig {
    return {
      ambientIntensity: a.ambientIntensity + (b.ambientIntensity - a.ambientIntensity) * t,
      ambientColor: a.ambientColor.clone().lerp(b.ambientColor, t),
      directionalIntensity: a.directionalIntensity + (b.directionalIntensity - a.directionalIntensity) * t,
      directionalColor: a.directionalColor.clone().lerp(b.directionalColor, t),
      shadowSoftness: a.shadowSoftness + (b.shadowSoftness - a.shadowSoftness) * t,
      fogColor: a.fogColor.clone().lerp(b.fogColor, t),
      fogDensity: a.fogDensity + (b.fogDensity - a.fogDensity) * t,
      skyColor: a.skyColor.clone().lerp(b.skyColor, t)
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  getShadowSoftness(): number {
    return this.targetConfig.shadowSoftness
  }
}
