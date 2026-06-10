import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useHunyuanStore, PLANETS, CONSTELLATIONS } from '@/stores/hunyuanStore'

interface StarData {
  lon: number
  lat: number
  radius: number
  brightness: number
  size: number
  constellationIndex: number
}

function generateStars(): StarData[] {
  const stars: StarData[] = []
  const count = 365

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const lon = 2 * Math.PI * u
    const lat = Math.acos(2 * v - 1) - Math.PI / 2
    const radius = 6 + Math.random() * 4
    const brightness = 0.5 + Math.random() * 0.5
    const size = 0.05 + Math.random() * 0.1

    stars.push({
      lon,
      lat,
      radius,
      brightness,
      size,
      constellationIndex: i % CONSTELLATIONS.length,
    })
  }

  return stars
}

function calculateDeviation(
  stars: StarData[],
  equatorialAngle: number,
  horizonAngle: number,
  skyRotation: number
): { averageDeviation: number; currentConstellation: string; planetPositions: string[] } {
  const idealEquatorial = 23.4
  const idealHorizon = 45

  let totalDeviation = 0

  stars.forEach((star) => {
    const xIdeal = star.radius * Math.cos(star.lat) * Math.cos(star.lon)
    const yIdeal = star.radius * Math.sin(star.lat)
    const zIdeal = star.radius * Math.cos(star.lat) * Math.sin(star.lon)

    const eqRad = THREE.MathUtils.degToRad(equatorialAngle - idealEquatorial)
    const horRad = THREE.MathUtils.degToRad(horizonAngle - idealHorizon)
    const rotRad = skyRotation

    const x1 = xIdeal * Math.cos(eqRad) - yIdeal * Math.sin(eqRad)
    const y1 = xIdeal * Math.sin(eqRad) + yIdeal * Math.cos(eqRad)
    const z1 = zIdeal

    const x2 = x1 * Math.cos(horRad) + z1 * Math.sin(horRad)
    const y2 = y1
    const z2 = -x1 * Math.sin(horRad) + z1 * Math.cos(horRad)

    const x3 = x2 * Math.cos(rotRad) - z2 * Math.sin(rotRad)
    const y3 = y2
    const z3 = x2 * Math.sin(rotRad) + z2 * Math.cos(rotRad)

    const dx = x3 - xIdeal
    const dy = y3 - yIdeal
    const dz = z3 - zIdeal

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const angularDeviation = 2 * Math.asin(Math.min(1, distance / (2 * star.radius)))
    totalDeviation += THREE.MathUtils.radToDeg(angularDeviation) * 60
  })

  const averageDeviation = totalDeviation / stars.length

  const centerLon = ((skyRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const centerIndex = Math.floor((centerLon / (Math.PI * 2)) * CONSTELLATIONS.length)
  const currentConstellation = CONSTELLATIONS[centerIndex % CONSTELLATIONS.length]

  const planetPositions = PLANETS.map((planet, idx) => {
    const angle = planet.initialAngle + skyRotation * 57.3 * (idx + 1) * 0.1
    const constIdx = Math.floor(((angle % 360) + 360) % 360 / 360 * CONSTELLATIONS.length)
    return `${planet.name}在${CONSTELLATIONS[constIdx].slice(0, 2)}`
  })

  return { averageDeviation, currentConstellation, planetPositions }
}

export default function StarField() {
  const equatorialAngle = useHunyuanStore((state) => state.equatorialAngle)
  const horizonAngle = useHunyuanStore((state) => state.horizonAngle)
  const skyRotation = useHunyuanStore((state) => state.skyRotation)
  const setAverageDeviation = useHunyuanStore((state) => state.setAverageDeviation)
  const setCurrentSkyRegion = useHunyuanStore((state) => state.setCurrentSkyRegion)
  const setCurrentPlanetPosition = useHunyuanStore((state) => state.setCurrentPlanetPosition)

  const stars = useMemo(() => generateStars(), [])
  const pointsRef = useRef<THREE.Points>(null)
  const planetGroupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(stars.length * 3)
    const colors = new Float32Array(stars.length * 3)
    const sizes = new Float32Array(stars.length)

    stars.forEach((star, i) => {
      const x = star.radius * Math.cos(star.lat) * Math.cos(star.lon)
      const y = star.radius * Math.sin(star.lat)
      const z = star.radius * Math.cos(star.lat) * Math.sin(star.lon)

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      colors[i * 3] = 1
      colors[i * 3 + 1] = 1
      colors[i * 3 + 2] = 1

      sizes[i] = star.size
    })

    return { positions, colors, sizes }
  }, [stars])

  useEffect(() => {
    const { averageDeviation, currentConstellation, planetPositions } = calculateDeviation(
      stars,
      equatorialAngle,
      horizonAngle,
      skyRotation
    )
    setAverageDeviation(averageDeviation)
    setCurrentSkyRegion(currentConstellation)
    setCurrentPlanetPosition(planetPositions[5])
  }, [stars, equatorialAngle, horizonAngle, skyRotation, setAverageDeviation, setCurrentSkyRegion, setCurrentPlanetPosition])

  useFrame((_, delta) => {
    timeRef.current += delta

    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry
      const posAttr = geometry.attributes.position as THREE.BufferAttribute
      const posArray = posAttr.array as Float32Array

      const eqRad = THREE.MathUtils.degToRad(equatorialAngle - 23.4)
      const horRad = THREE.MathUtils.degToRad(horizonAngle - 45)
      const rotRad = skyRotation

      stars.forEach((star, i) => {
        const x0 = star.radius * Math.cos(star.lat) * Math.cos(star.lon)
        const y0 = star.radius * Math.sin(star.lat)
        const z0 = star.radius * Math.cos(star.lat) * Math.sin(star.lon)

        const x1 = x0 * Math.cos(eqRad) - y0 * Math.sin(eqRad)
        const y1 = x0 * Math.sin(eqRad) + y0 * Math.cos(eqRad)
        const z1 = z0

        const x2 = x1 * Math.cos(horRad) + z1 * Math.sin(horRad)
        const y2 = y1
        const z2 = -x1 * Math.sin(horRad) + z1 * Math.cos(horRad)

        const x3 = x2 * Math.cos(rotRad) - z2 * Math.sin(rotRad)
        const y3 = y2
        const z3 = x2 * Math.sin(rotRad) + z2 * Math.cos(rotRad)

        posArray[i * 3] = x3
        posArray[i * 3 + 1] = y3
        posArray[i * 3 + 2] = z3
      })

      posAttr.needsUpdate = true
    }

    if (planetGroupRef.current) {
      planetGroupRef.current.children.forEach((child, idx) => {
        const planet = PLANETS[idx]
        const angle = timeRef.current * planet.speed * 60 + THREE.MathUtils.degToRad(planet.initialAngle)
        const orbitRadius = planet.orbitRadius
        const x = Math.cos(angle) * orbitRadius
        const z = Math.sin(angle) * orbitRadius
        const y = Math.sin(angle * 0.5) * 0.5

        child.position.set(x, y, z)
        child.rotation.y += delta * 0.5
      })
    }
  })

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={stars.length}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={stars.length}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <group ref={planetGroupRef}>
        {PLANETS.map((planet, idx) => (
          <group key={planet.name}>
            <mesh>
              <sphereGeometry args={[planet.radius, 32, 32]} />
              <meshStandardMaterial
                color={planet.color}
                emissive={planet.color}
                emissiveIntensity={0.5}
                transparent
                opacity={0.9}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[planet.radius * 1.5, 32, 32]} />
              <meshBasicMaterial
                color={planet.color}
                transparent
                opacity={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>

      {PLANETS.map((planet) => (
        <mesh key={`orbit-${planet.name}`} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[planet.orbitRadius, 0.02, 8, 128]} />
          <meshBasicMaterial
            color={planet.color}
            transparent
            opacity={0.15}
          />
        </mesh>
      ))}
    </group>
  )
}
