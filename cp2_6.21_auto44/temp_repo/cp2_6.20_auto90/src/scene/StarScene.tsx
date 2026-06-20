import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useStarStore, getSpectralColor, Star, Constellation, Planet } from './StarDataStore'

const SCALE = 100
const MAX_LABELS = 50
const LABEL_MAG_THRESHOLD = 3.0
const LABEL_CAMERA_DISTANCE = 200

const raDecToVector3 = (ra: number, dec: number, radius: number = SCALE): THREE.Vector3 => {
  const raRad = (ra * Math.PI) / 12
  const decRad = (dec * Math.PI) / 180
  const x = radius * Math.cos(decRad) * Math.cos(raRad)
  const y = radius * Math.sin(decRad)
  const z = radius * Math.cos(decRad) * Math.sin(raRad)
  return new THREE.Vector3(x, y, z)
}

const StarLabel = ({ star, isSelected, isHovered }: {
  star: Star
  isSelected: boolean
  isHovered: boolean
}) => {
  const { camera } = useThree()
  const position = useMemo(() => raDecToVector3(star.ra, star.dec, SCALE), [star.ra, star.dec])
  const [opacity, setOpacity] = useState(0)
  const opacityRef = useRef(0)

  useFrame(() => {
    const starWorldPos = position.clone()
    const camWorldPos = new THREE.Vector3()
    camera.getWorldPosition(camWorldPos)
    const dist = camWorldPos.distanceTo(starWorldPos)
    const maxDist = LABEL_CAMERA_DISTANCE * 2
    const minDist = LABEL_CAMERA_DISTANCE * 0.5
    let newOpacity = 0
    if (dist <= minDist) {
      newOpacity = 1
    } else if (dist >= maxDist) {
      newOpacity = 0
    } else {
      newOpacity = 1 - (dist - minDist) / (maxDist - minDist)
      newOpacity = Math.pow(newOpacity, 1.5)
    }
    
    if (Math.abs(newOpacity - opacityRef.current) > 0.01) {
      opacityRef.current = newOpacity
      setOpacity(newOpacity)
    }
  })

  const showDetail = isSelected || isHovered
  const baseOpacity = Math.min(1, opacity)

  if (baseOpacity <= 0.01) return null

  return (
    <Html
      position={[position.x, position.y + 1.5, position.z]}
      center
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          transform: showDetail ? 'scale(1.3)' : 'scale(1)',
          transition: 'transform 0.2s ease-out',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: showDetail ? '#ff6b35' : 'rgba(255, 255, 255, 0.85)',
            fontSize: showDetail ? '14px' : '12px',
            fontWeight: showDetail ? 700 : 500,
            textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.6)',
            opacity: baseOpacity,
            transition: 'all 0.2s ease-out',
            letterSpacing: '0.5px',
          }}
        >
          {star.name}
        </div>

        {showDetail && (
          <div
            style={{
              marginTop: '2px',
              padding: '3px 8px',
              background: 'rgba(10, 14, 39, 0.85)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 107, 53, 0.5)',
              borderRadius: '4px',
              opacity: baseOpacity,
            }}
          >
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>
              {star.nameEn}
            </div>
            <div
              style={{
                fontSize: '10px',
                display: 'flex',
                gap: '6px',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getSpectralColor(star.spectralType),
                  alignSelf: 'center',
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                {star.spectralType}型
              </span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' }}>
                {star.magnitude.toFixed(2)}m
              </span>
            </div>
          </div>
        )}
      </div>
    </Html>
  )
}

const StarPoint = ({ star, isSelected, isFiltered, isHovered, onClick, onHover }: {
  star: Star
  isSelected: boolean
  isFiltered: boolean
  isHovered: boolean
  onClick: () => void
  onHover: (hovered: boolean) => void
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
      const baseOpacity = isFiltered ? 0.2 : (isSelected ? 1 : twinkle)
      material.opacity = isHovered ? 1 : baseOpacity
      material.size = isHovered || isSelected ? size * 1.6 : size
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
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        onHover(false)
      }}
    >
      <pointsMaterial
        size={size}
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
    const points: THREE.Vector3[] = []

    if (constellation.lineVertices && constellation.lineVertices.length > 0) {
      for (const vertexPair of constellation.lineVertices) {
        if (vertexPair.length >= 2) {
          const [ra1, dec1] = vertexPair[0]
          const [ra2, dec2] = vertexPair[1]
          points.push(raDecToVector3(ra1, dec1, SCALE))
          points.push(raDecToVector3(ra2, dec2, SCALE))
        }
      }
    } else {
      const constellationStars = stars.filter(s => s.constellationId === constellation.id)
      if (constellationStars.length < 2) return null

      if (constellation.lines && constellation.lines.length > 0) {
        for (const lineIndices of constellation.lines) {
          if (lineIndices.length >= 2) {
            const idx1 = lineIndices[0] - 1
            const idx2 = lineIndices[1] - 1
            if (idx1 >= 0 && idx1 < constellationStars.length &&
                idx2 >= 0 && idx2 < constellationStars.length) {
              points.push(raDecToVector3(constellationStars[idx1].ra, constellationStars[idx1].dec, SCALE))
              points.push(raDecToVector3(constellationStars[idx2].ra, constellationStars[idx2].dec, SCALE))
            }
          }
        }
      }

      if (points.length === 0 && constellationStars.length >= 2) {
        for (let i = 0; i < constellationStars.length - 1; i++) {
          points.push(raDecToVector3(constellationStars[i].ra, constellationStars[i].dec, SCALE))
          points.push(raDecToVector3(constellationStars[i + 1].ra, constellationStars[i + 1].dec, SCALE))
        }
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
  const inclinationRad = (planet.inclination || 0) * Math.PI / 180
  const initialAngleRad = (planet.initialAngle || 0) * Math.PI / 180

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
    const inclSin = Math.sin(inclinationRad)
    const inclCos = Math.cos(inclinationRad)
    points.forEach((p, i) => {
      const x = p.x
      const yRaw = 0
      const z = p.y
      positions[i * 3] = x
      positions[i * 3 + 1] = z * inclSin + yRaw * inclCos
      positions[i * 3 + 2] = z * inclCos - yRaw * inclSin
    })
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [planet.semiMajorAxis, planet.eccentricity, inclinationRad])

  const planetRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (planetRef.current) {
      const time = state.clock.elapsedTime * useStarStore.getState().timeSpeed * 0.1
      const angle = initialAngleRad + (time / planet.orbitalPeriod) * Math.PI * 2
      const x = planet.semiMajorAxis * orbitScale * Math.cos(angle) - planet.semiMajorAxis * planet.eccentricity * orbitScale
      const zRaw = planet.semiMajorAxis * orbitScale * Math.sin(angle) * Math.sqrt(1 - planet.eccentricity * planet.eccentricity)
      const y = zRaw * Math.sin(inclinationRad)
      const z = zRaw * Math.cos(inclinationRad)
      planetRef.current.position.set(x, y, z)
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
  const [hoveredStarId, setHoveredStarId] = useState<number | null>(null)

  const brightStarsForLabels = useMemo(() => {
    return stars
      .filter(s => s.magnitude < LABEL_MAG_THRESHOLD)
      .sort((a, b) => a.magnitude - b.magnitude)
      .slice(0, MAX_LABELS)
  }, [stars])

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
          isHovered={hoveredStarId === star.id}
          onClick={() => {
            setSelectedStar(star.id)
            setSelectedConstellation(star.constellationId)
            setSelectedPlanet(null)
          }}
          onHover={(hovered) => {
            setHoveredStarId(hovered ? star.id : null)
          }}
        />
      ))}

      {brightStarsForLabels.map((star) => (
        <StarLabel
          key={`label-${star.id}`}
          star={star}
          isSelected={selectedStarId === star.id}
          isHovered={hoveredStarId === star.id}
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
