import { useMemo } from 'react'
import { Sun } from './Sun'
import { Planet } from './Planet'
import { OrbitLine } from './OrbitLine'
import { StarField } from './StarField'
import { useStore } from '@/store/useStore'
import { useTweenCamera } from '@/hooks/useTweenCamera'
import type { PlanetData } from '@/types'

const EARTH_YEAR_SECONDS = 30
const EARTH_ORBITAL_PERIOD = 365

export function SolarSystem() {
  const { planets, selectedPlanetId, viewMode, showOrbits, selectPlanet } = useStore()
  const { tweenTo } = useTweenCamera()

  const sunData = planets[0]
  const planetList = planets.slice(1)

  const getDisplayRadius = (planet: PlanetData) => {
    if (viewMode === 'size') {
      return planet.relativeRadius * 25
    }
    return 0.03
  }

  const getDisplayDistance = (planet: PlanetData, index: number) => {
    if (viewMode === 'distance') {
      return planet.relativeDistance
    }
    return 2 + index * 1.5
  }

  const getOrbitalSpeed = (planet: PlanetData) => {
    if (planet.orbitalPeriod === 0) return 0
    const earthAngularSpeed = (Math.PI * 2) / EARTH_YEAR_SECONDS
    const ratio = EARTH_ORBITAL_PERIOD / planet.orbitalPeriod
    return earthAngularSpeed * ratio
  }

  const rotationSpeeds = useMemo(
    () => planetList.map(() => (Math.PI * 2) / (2 + Math.random() * 8)),
    [planetList.length]
  )

  const handlePlanetClick = (planet: PlanetData) => {
    selectPlanet(planet.id)
  }

  const handlePlanetDoubleClick = (planet: PlanetData, index: number) => {
    const distance = getDisplayDistance(planet, index)
    const angle = Math.random() * Math.PI * 2
    const camDistance = getDisplayRadius(planet) * 2 + 2
    const targetPos: [number, number, number] = [
      Math.cos(angle) * camDistance,
      camDistance * 0.3,
      Math.sin(angle) * camDistance,
    ]
    const lookAt: [number, number, number] = [
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance,
    ]
    targetPos[0] += lookAt[0]
    targetPos[2] += lookAt[2]
    tweenTo(targetPos, lookAt, 1000)
    selectPlanet(planet.id)
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />

      <StarField />

      <Sun radius={viewMode === 'size' ? sunData.relativeRadius : 0.15} />

      {planetList.map((planet, index) => {
        const distance = getDisplayDistance(planet, index)
        return (
          <OrbitLine
            key={`orbit-${planet.id}`}
            radius={distance}
            visible={showOrbits}
          />
        )
      })}

      {planetList.map((planet, index) => (
        <Planet
          key={planet.id}
          planet={planet}
          radius={getDisplayRadius(planet)}
          distance={getDisplayDistance(planet, index)}
          orbitalSpeed={getOrbitalSpeed(planet)}
          rotationSpeed={rotationSpeeds[index]}
          isSelected={selectedPlanetId === planet.id}
          onClick={() => handlePlanetClick(planet)}
          onDoubleClick={() => handlePlanetDoubleClick(planet, index)}
        />
      ))}
    </>
  )
}
