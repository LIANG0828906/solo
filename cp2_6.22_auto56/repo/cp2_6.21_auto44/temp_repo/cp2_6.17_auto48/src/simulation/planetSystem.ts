import * as THREE from 'three'
import { Planet, PlanetConfig } from './planet'
import { usePlanetariumStore, PlanetData } from '@/store/store'

const EARTH_ORBIT_PERIOD_SECONDS = 30
const EARTH_ROTATION_PERIOD_SECONDS = 24
const ORBIT_SCALE_FACTOR = 0.1
const SIZE_SCALE_FACTOR = 0.02
const SUN_BASE_RADIUS = 3

const planetConfigs: PlanetConfig[] = [
  {
    name: '太阳',
    radius: SUN_BASE_RADIUS,
    orbitRadius: 0,
    orbitSpeed: 0,
    rotationSpeed: (2 * Math.PI) / (25.4 * EARTH_ROTATION_PERIOD_SECONDS),
    tiltAngle: 7.25,
    color: '#FDB813',
    orbitPeriod: 0,
    rotationPeriod: 25.4,
    distanceFromSun: 0,
    isSun: true,
    initialAngle: 0,
  },
  {
    name: '水星',
    radius: 2440 * SIZE_SCALE_FACTOR,
    orbitRadius: 0.39 * 10 * ORBIT_SCALE_FACTOR,
    orbitSpeed: (2 * Math.PI) / (EARTH_ORBIT_PERIOD_SECONDS * 0.24),
    rotationSpeed: (2 * Math.PI) / (EARTH_ROTATION_PERIOD_SECONDS * 58.6),
    tiltAngle: 0.03,
    color: '#B5B5B5',
    orbitPeriod: 0.24,
    rotationPeriod: 58.6,
    distanceFromSun: 0.39,
    initialAngle: 0.2,
  },
  {
    name: '金星',
    radius: 6052 * SIZE_SCALE_FACTOR,
    orbitRadius: 0.72 * 10 * ORBIT_SCALE_FACTOR,
    orbitSpeed: (2 * Math.PI) / (EARTH_ORBIT_PERIOD_SECONDS * 0.62),
    rotationSpeed: -(2 * Math.PI) / (EARTH_ROTATION_PERIOD_SECONDS * 243),
    tiltAngle: 177.4,
    color: '#E6C229',
    orbitPeriod: 0.62,
    rotationPeriod: 243,
    distanceFromSun: 0.72,
    initialAngle: 1.5,
  },
  {
    name: '地球',
    radius: 6371 * SIZE_SCALE_FACTOR,
    orbitRadius: 1.0 * 10 * ORBIT_SCALE_FACTOR,
    orbitSpeed: (2 * Math.PI) / EARTH_ORBIT_PERIOD_SECONDS,
    rotationSpeed: (2 * Math.PI) / EARTH_ROTATION_PERIOD_SECONDS,
    tiltAngle: 23.5,
    color: '#2E86AB',
    orbitPeriod: 1.0,
    rotationPeriod: 1.0,
    distanceFromSun: 1.0,
    hasGrid: true,
    initialAngle: 2.8,
  },
  {
    name: '火星',
    radius: 3390 * SIZE_SCALE_FACTOR,
    orbitRadius: 1.52 * 10 * ORBIT_SCALE_FACTOR,
    orbitSpeed: (2 * Math.PI) / (EARTH_ORBIT_PERIOD_SECONDS * 1.88),
    rotationSpeed: (2 * Math.PI) / (EARTH_ROTATION_PERIOD_SECONDS * 1.03),
    tiltAngle: 25.19,
    color: '#C1440E',
    orbitPeriod: 1.88,
    rotationPeriod: 1.03,
    distanceFromSun: 1.52,
    initialAngle: 4.1,
  },
  {
    name: '木星',
    radius: 69911 * SIZE_SCALE_FACTOR * 0.3,
    orbitRadius: 5.2 * 10 * ORBIT_SCALE_FACTOR,
    orbitSpeed: (2 * Math.PI) / (EARTH_ORBIT_PERIOD_SECONDS * 11.86),
    rotationSpeed: (2 * Math.PI) / (EARTH_ROTATION_PERIOD_SECONDS * 0.41),
    tiltAngle: 3.13,
    color: '#C88B3A',
    orbitPeriod: 11.86,
    rotationPeriod: 0.41,
    distanceFromSun: 5.2,
    initialAngle: 5.5,
  },
  {
    name: '土星',
    radius: 58232 * SIZE_SCALE_FACTOR * 0.3,
    orbitRadius: 9.58 * 10 * ORBIT_SCALE_FACTOR,
    orbitSpeed: (2 * Math.PI) / (EARTH_ORBIT_PERIOD_SECONDS * 29.46),
    rotationSpeed: (2 * Math.PI) / (EARTH_ROTATION_PERIOD_SECONDS * 0.45),
    tiltAngle: 26.73,
    color: '#E8D4A8',
    orbitPeriod: 29.46,
    rotationPeriod: 0.45,
    distanceFromSun: 9.58,
    hasRing: true,
    initialAngle: 0.8,
  },
  {
    name: '天王星',
    radius: 25362 * SIZE_SCALE_FACTOR * 0.4,
    orbitRadius: 19.2 * 10 * ORBIT_SCALE_FACTOR,
    orbitSpeed: (2 * Math.PI) / (EARTH_ORBIT_PERIOD_SECONDS * 84.01),
    rotationSpeed: -(2 * Math.PI) / (EARTH_ROTATION_PERIOD_SECONDS * 0.72),
    tiltAngle: 98,
    color: '#D1E7E7',
    orbitPeriod: 84.01,
    rotationPeriod: 0.72,
    distanceFromSun: 19.2,
    initialAngle: 3.2,
  },
  {
    name: '海王星',
    radius: 24622 * SIZE_SCALE_FACTOR * 0.4,
    orbitRadius: 30.05 * 10 * ORBIT_SCALE_FACTOR,
    orbitSpeed: (2 * Math.PI) / (EARTH_ORBIT_PERIOD_SECONDS * 164.8),
    rotationSpeed: (2 * Math.PI) / (EARTH_ROTATION_PERIOD_SECONDS * 0.67),
    tiltAngle: 28.3,
    color: '#3B5DF6',
    orbitPeriod: 164.8,
    rotationPeriod: 0.67,
    distanceFromSun: 30.05,
    initialAngle: 4.7,
  },
]

export class PlanetSystem {
  private planets: Planet[] = []
  private scene: THREE.Scene
  private timeScale: number = 1
  private targetTimeScale: number = 1
  private timeScaleTransitionDuration: number = 0.3
  private transitionStartTime: number = 0
  private startScale: number = 1
  private isTransitioning: boolean = false
  private isFlying: boolean = false

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.initPlanets()
    this.syncToStore()
  }

  private initPlanets(): void {
    planetConfigs.forEach((config) => {
      const planet = new Planet(config)
      this.planets.push(planet)

      planet.createMesh()

      if (planet.tiltGroup) {
        this.scene.add(planet.tiltGroup)
      } else if (planet.mesh) {
        this.scene.add(planet.mesh)
      }

      if (!config.isSun) {
        planet.createOrbitLine()
        if (planet.orbitLine) {
          this.scene.add(planet.orbitLine)
        }
      }
    })
  }

  update(deltaTime: number): void {
    const { timeScale: storeTimeScale, targetTimeScale, camera } =
      usePlanetariumStore.getState()

    if (this.targetTimeScale !== targetTimeScale) {
      this.startTimeScaleTransition(targetTimeScale)
    }

    if (this.isTransitioning) {
      this.updateTimeScaleTransition(deltaTime)
    }

    if (camera.isFlying !== this.isFlying) {
      this.isFlying = camera.isFlying
    }

    if (this.isFlying) {
      return
    }

    this.planets.forEach((planet) => {
      planet.update(deltaTime, this.timeScale)
    })

    this.syncToStore()
  }

  private startTimeScaleTransition(target: number): void {
    this.startScale = this.timeScale
    this.targetTimeScale = target
    this.isTransitioning = true
    this.transitionStartTime = 0
  }

  private updateTimeScaleTransition(deltaTime: number): void {
    this.transitionStartTime += deltaTime

    const progress = Math.min(
      this.transitionStartTime / this.timeScaleTransitionDuration,
      1
    )

    this.timeScale =
      this.startScale + (this.targetTimeScale - this.startScale) * progress

    usePlanetariumStore.getState().updateTimeScaleProgress(progress)

    if (progress >= 1) {
      this.isTransitioning = false
      this.timeScale = this.targetTimeScale
    }
  }

  private syncToStore(): void {
    const planetData: PlanetData[] = this.planets.map((planet) => ({
      name: planet.config.name,
      radius: planet.config.radius,
      orbitRadius: planet.config.orbitRadius,
      orbitSpeed: planet.config.orbitSpeed,
      rotationSpeed: planet.config.rotationSpeed,
      tiltAngle: planet.config.tiltAngle,
      color: planet.config.color,
      orbitPeriod: planet.config.orbitPeriod,
      rotationPeriod: planet.config.rotationPeriod,
      distanceFromSun: planet.config.distanceFromSun,
      hasRing: planet.config.hasRing,
      isSun: planet.config.isSun,
      mesh: planet.mesh,
      orbitLine: planet.orbitLine,
      tiltGroup: planet.tiltGroup,
      currentAngle: planet.currentAngle,
    }))

    usePlanetariumStore.getState().updatePlanets(planetData)
  }

  getPlanetByName(name: string): Planet | undefined {
    return this.planets.find((p) => p.config.name === name)
  }

  getAllPlanets(): Planet[] {
    return this.planets
  }

  getTimeScale(): number {
    return this.timeScale
  }

  dispose(): void {
    this.planets.forEach((planet) => {
      if (planet.tiltGroup) {
        this.scene.remove(planet.tiltGroup)
      }
      if (planet.orbitLine) {
        this.scene.remove(planet.orbitLine)
      }
      planet.dispose()
    })
    this.planets = []
  }
}
