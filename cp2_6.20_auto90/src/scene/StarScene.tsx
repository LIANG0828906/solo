import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useStarStore, getSpectralColor, Star, Constellation, Planet } from './StarDataStore'

const SCALE = 100

const raDecToVector3 = (ra: number, dec: number, radius: number = SCALE): THREE.Vector3 => {
  const raRad = (ra * Math.PI) / 12
  const decRad = (dec * Math.PI) / 180
  const x = radius * Math.cos(decRad) * Math.cos(raRad)
  const y = radius * Math.sin(decRad)
  const z = radius * Math.cos(decRad) * Math.sin(raRad)
  return new THREE.Vector3(x, y, z)
}

const StarPoint = ({ star, isSelected, isFiltered, onClick }: {
  star: Star
  isSelected: boolean
  isFiltered: boolean
  onClick: () => void
}) => {
  const meshRef = useRef<THREE.Points>(null)
  const color = getSpectralColor(star.spectralType)
  const size = Math.max(0.5, Math.min(3, (5 - star.magnitude) * 0.5))

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(3)
    const pos = raDecToVector3(star.ra, star.dec, SCALE)
    positions[0] = pos.x
    positions[1] = pos.y
    positions[2] = pos.z
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [star.ra, star.dec])

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.PointsMaterial
      const twinkle = 0.8 + 0.2 * Math.sin(state.clock.elapsedTime * 2 + star.id)
      material.opacity = isFiltered ? 0.2 : (isSelected ? 1 : twinkle)
    }
  })

  return (
    <points
      ref={meshRef}
      geometry={geometry}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <pointsMaterial
        size={isSelected ? size * 2 : size}
        color={isFiltered ? '#666666' : color}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

const ConstellationLines = ({ constellation, isHighlighted, stars }: {
  constellation: Constellation
  isHighlighted: boolean
  stars: Star[]
}) => {
  const lines = useMemo(() => {
    const constellationStars = stars.filter(s => s.constellationId === constellation.id)
    if (constellationStars.length < 2) return null

    const starMap = new Map<string, Star>()
    constellationStars.forEach(s => {
      starMap.set(s.nameEn.toLowerCase(), s)
      starMap.set(s.name, s)
    })

    const points: THREE.Vector3[] = []
    
    if (constellationStars.length >= 2) {
      for (let i = 0; i < constellationStars.length - 1; i++) {
        points.push(raDecToVector3(constellationStars[i].ra, constellationStars[i].dec, SCALE))
        points.push(raDecToVector3(constellationStars[i + 1].ra, constellationStars[i + 1].dec, SCALE))
      }
    }

    if (points.length === 0) return null

    const positions = new Float32Array(points.length * 3)
    points.forEach((p, i) => {
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [constellation, stars])

  if (!lines) return null

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial
        color={isHighlighted ? '#ff6b35' : '#ffffff'}
        transparent
        opacity={isHighlighted ? 1 : 0.4}
      />
    </lineSegments>
  )
}

const PlanetOrbit = ({ planet, isSelected, onClick }: {
  planet: Planet
  isSelected: boolean
  onClick: () => void
}) => {
  const orbitScale = 5

  const orbitGeometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      -planet.semiMajorAxis * planet.eccentricity * orbitScale,
      0,
      planet.semiMajorAxis * orbitScale,
      planet.semiMajorAxis * orbitScale * Math.sqrt(1 - planet.eccentricity * planet.eccentricity),
      0,
      2 * Math.PI,
      false,
      0
    )
    const points = curve.getPoints(128)
    const positions = new Float32Array(points.length * 3)
    points.forEach((p, i) => {
      positions[i * 3] = p.x
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = p.y
    })
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [planet.semiMajorAxis, planet.eccentricity])

  const planetRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (planetRef.current) {
      const time = state.clock.elapsedTime * useStarStore.getState().timeSpeed * 0.1
      const angle = (time / planet.orbitalPeriod) * Math.PI * 2
      const x = planet.semiMajorAxis * orbitScale * Math.cos(angle) - planet.semiMajorAxis * planet.eccentricity * orbitScale
      const z = planet.semiMajorAxis * orbitScale * Math.sin(angle) * Math.sqrt(1 - planet.eccentricity * planet.eccentricity)
      planetRef.current.position.set(x, 0, z)
    }
  })

  return (
    <group>
      <lineSegments geometry={orbitGeometry}>
        <lineBasicMaterial
          color={planet.color}
          transparent
          opacity={isSelected ? 0.8 : 0.3}
        />
      </lineSegments>
      <mesh
        ref={planetRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <sphereGeometry args={[isSelected ? 0.4 : 0.25, 16, 16]} />
        <meshBasicMaterial color={planet.color} />
      </mesh>
    </group>
  )
}

const Sun = () => {
  return (
    <mesh>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshBasicMaterial color="#ffdd00" />
    </mesh>
  )
}

const SceneContent = () => {
  const { stars, constellations, planets, selectedStarId, selectedConstellationId, selectedPlanetId, showOrbits, setSelectedStar, setSelectedConstellation, setSelectedPlanet, isStarFiltered } = useStarStore()
  const groupRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()
  const targetPosition = useRef<THREE.Vector3 | null>(null)
  const isAnimating = useRef(false)

  useEffect(() => {
    if (selectedStarId) {
      const star = stars.find(s => s.id === selectedStarId)
      if (star) {
        const pos = raDecToVector3(star.ra, star.dec, SCALE)
        const dir = pos.clone().normalize()
        const targetCamPos = dir.multiplyScalar(150)
        targetPosition.current = targetCamPos
        isAnimating.current = true
      }
    }
  }, [selectedStarId, stars])

  useFrame((state, delta) => {
    if (groupRef.current && !controlsRef.current?.isUserInteracting && !isAnimating.current) {
      groupRef.current.rotation.y += delta * (2 * Math.PI) / 60
    }

    if (isAnimating.current && targetPosition.current && controlsRef.current) {
      const controls = controlsRef.current
      const target = targetPosition.current
      
      controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.05)
      camera.position.lerp(target, 0.05)
      
      const dist = camera.position.distanceTo(target)
      if (dist < 1) {
        isAnimating.current = false
        targetPosition.current = null
      }
    }
  })

  return (
    <group ref={groupRef}>
      <Stars radius={300} depth={60} count={5000} factor={7} saturation={0} fade speed={1} />
      
      {stars.map((star) => (
        <StarPoint
          key={star.id}
          star={star}
          isSelected={selectedStarId === star.id}
          isFiltered={isStarFiltered(star)}
          onClick={() => {
            setSelectedStar(star.id)
            setSelectedConstellation(star.constellationId)
            setSelectedPlanet(null)
          }}
        />
      ))}

      {constellations.map((constellation) => (
        <ConstellationLines
          key={constellation.id}
          constellation={constellation}
          isHighlighted={selectedConstellationId === constellation.id}
          stars={stars}
        />
      ))}

      {showOrbits && (
        <group>
          <Sun />
          {planets.map((planet) => (
            <PlanetOrbit
              key={planet.id}
              planet={planet}
              isSelected={selectedPlanetId === planet.id}
              onClick={() => {
                setSelectedPlanet(planet.id)
                setSelectedStar(null)
                setSelectedConstellation(null)
              }}
            />
          ))}
        </group>
      )}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={20}
        maxDistance={300}
        enableDamping
        dampingFactor={0.05}
      />
    </group>
  )
}

const CoordinateDisplay = () => {
  const { camera } = useThree()
  const [coords, setCoords] = useState({ ra: '0h 0m', dec: '+0°', fov: 60 })

  useFrame(() => {
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    
    const radius = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z)
    const dec = Math.asin(dir.y / radius) * (180 / Math.PI)
    let ra = Math.atan2(dir.z, dir.x) * (180 / Math.PI) / 15
    
    if (ra < 0) ra += 24
    
    const raHours = Math.floor(ra)
    const raMinutes = Math.floor((ra - raHours) * 60)
    const decDeg = Math.floor(dec)
    const decSign = dec >= 0 ? '+' : '-'
    
    setCoords({
      ra: `${raHours}h ${raMinutes}m`,
      dec: `${decSign}${Math.abs(decDeg)}°`,
      fov: Math.round((camera as THREE.PerspectiveCamera).fov)
    })
  })

  return (
    <Html position={[0, -30, -80]} style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '8px',
        padding: '12px 20px',
        color: 'white',
        fontSize: '14px',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap'
      }}>
        <div>赤经: {coords.ra}</div>
        <div>赤纬: {coords.dec}</div>
        <div>视场: {coords.fov}°</div>
      </div>
    </Html>
  )
}

const StarScene = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 150], fov: 60 }}
      style={{ background: '#0a0e27' }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.1} />
      <SceneContent />
      <CoordinateDisplay />
    </Canvas>
  )
}

export default StarScene
