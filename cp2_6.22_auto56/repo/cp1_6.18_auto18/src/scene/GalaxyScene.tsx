import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { StarData, PlanetData } from './StarSystem'

interface GalaxySceneProps {
  stars: StarData[]
  brightnessThreshold: number
  showPlanets: boolean
  showLabels: boolean
  showOrbits: boolean
  selectedStarId: string | null
  onSelectStar: (id: string | null) => void
  onHoverPlanet: (planet: PlanetData | null, screenPos?: { x: number; y: number }) => void
  onHoverStar: (star: StarData | null, screenPos?: { x: number; y: number }) => void
}

interface StarMeshProps {
  star: StarData
  selected: boolean
  dimmed: boolean
  showPlanets: boolean
  showLabels: boolean
  showOrbits: boolean
  onClick: () => void
  onPointerOver: (e: any) => void
  onPointerOut: () => void
  onPlanetHover: (planet: PlanetData | null, screenPos?: { x: number; y: number }) => void
  timeRef: React.MutableRefObject<number>
}

const StarMesh: React.FC<StarMeshProps> = ({
  star,
  selected,
  dimmed,
  showPlanets,
  showLabels,
  showOrbits,
  onClick,
  onPointerOver,
  onPointerOut,
  onPlanetHover,
  timeRef,
}) => {
  const starRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [targetScale, setTargetScale] = useState(1)
  const opacity = dimmed ? 0.2 : 1
  const planetRefs = useRef<Map<string, THREE.Mesh>>(new Map())
  const { camera, gl } = useThree()

  useEffect(() => {
    setTargetScale(selected ? 1.2 / star.radius : 1)
  }, [selected, star.radius])

  useFrame((_, delta) => {
    if (starRef.current) {
      starRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2)
    }
    if (glowRef.current) {
      glowRef.current.scale.lerp(new THREE.Vector3(targetScale * 2.2, targetScale * 2.2, targetScale * 2.2), delta * 2)
    }

    star.planets.forEach((planet) => {
      const speed = selected ? planet.orbitSpeed * 3 : planet.orbitSpeed
      planet.orbitAngle += delta * speed
      const mesh = planetRefs.current.get(planet.id)
      if (mesh) {
        mesh.position.x = Math.cos(planet.orbitAngle) * planet.orbitRadius
        mesh.position.z = Math.sin(planet.orbitAngle) * planet.orbitRadius
      }
    })
  })

  const handlePlanetPointerOver = (planet: PlanetData, e: any) => {
    e.stopPropagation()
    const mesh = planetRefs.current.get(planet.id)
    if (mesh) {
      const vector = new THREE.Vector3()
      mesh.getWorldPosition(vector)
      vector.project(camera)
      const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth
      const y = (-vector.y * 0.5 + 0.5) * gl.domElement.clientHeight
      onPlanetHover(planet, { x, y })
    }
  }

  const getOrbitGeometry = (orbitRadius: number) => {
    const points: THREE.Vector3[] = []
    const segments = 128
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius))
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    return geometry
  }

  return (
    <group position={star.position}>
      <mesh
        ref={glowRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          onPointerOver(e)
        }}
        onPointerOut={onPointerOut}
      >
        <sphereGeometry args={[star.radius * 2.2, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={(selected ? 0.25 : 0.15) * opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh
        ref={starRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          onPointerOver(e)
        }}
        onPointerOut={onPointerOut}
      >
        <sphereGeometry args={[star.radius, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
      </mesh>

      {showOrbits && star.planets.map((planet) => (
        <line key={`orbit-${planet.id}`}>
          <primitive object={getOrbitGeometry(planet.orbitRadius)} attach="geometry" />
          <lineBasicMaterial
            color={selected ? '#FFD54F' : '#ffffff'}
            transparent
            opacity={(selected ? 0.35 : 0.12) * opacity}
          />
        </line>
      ))}

      {showPlanets &&
        star.planets.map((planet) => (
          <mesh
            key={planet.id}
            ref={(el) => {
              if (el) planetRefs.current.set(planet.id, el)
            }}
            position={[
              Math.cos(planet.orbitAngle) * planet.orbitRadius,
              0,
              Math.sin(planet.orbitAngle) * planet.orbitRadius,
            ]}
            onPointerOver={(e) => handlePlanetPointerOver(planet, e)}
            onPointerOut={() => onPlanetHover(null)}
            onClick={(e) => e.stopPropagation()}
          >
            <sphereGeometry args={[planet.radius, 16, 16]} />
            <meshBasicMaterial color={planet.color} transparent opacity={opacity} />
          </mesh>
        ))}

      {showLabels && (
        <Html
          position={[0, star.radius * (selected ? 1.2 / star.radius + 0.8 : 2), 0]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(51,51,51,0.75)',
              color: '#ffffff',
              fontSize: 12,
              fontFamily: "'Segoe UI', sans-serif",
              padding: '4px 10px',
              borderRadius: 6,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(126,87,194,0.3)',
              opacity: opacity,
              transition: 'opacity 0.3s ease',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontWeight: 600 }}>{star.name}</div>
            <div style={{ fontSize: 10, opacity: 0.8, color: '#B39DDB' }}>{star.spectralType}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

const BackgroundStars: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, sizes, opacities, phases } = useMemo(() => {
    const count = 500
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const opacities = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 80 + Math.random() * 40
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
      sizes[i] = 1 + Math.random() * 2
      opacities[i] = 0.2 + Math.random() * 0.6
      phases[i] = Math.random() * Math.PI * 2
    }
    return { positions, sizes, opacities, phases }
  }, [])

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aOpacity;
        attribute float aPhase;
        varying float vOpacity;
        uniform float uTime;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(uTime * (2.0 / 1.5 + aPhase) + aPhase) * 0.3 + 0.7;
          gl_PointSize = aSize * twinkle * (300.0 / -mvPosition.z);
          vOpacity = aOpacity * twinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useFrame((state) => {
    shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00008
    }
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    return geo
  }, [positions, sizes, opacities, phases])

  return <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />
}

const GalaxyDisk: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null)
  const { positions, colors } = useMemo(() => {
    const count = 600
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const arm = Math.floor(Math.random() * 4)
      const angleOffset = (arm * Math.PI * 2) / 4
      const radius = Math.random() * 12
      const spinAngle = radius * 0.5 + angleOffset
      const scatter = (1 - radius / 14) * 0.6 + 0.1
      const angle = spinAngle + (Math.random() - 0.5) * scatter
      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.3
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5 * (1 - radius / 14)
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.3

      const t = radius / 12
      const r = 0.15 + t * 0.25
      const g = 0.2 + t * 0.35
      const b = 0.55 + t * 0.4
      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }
    return { positions, colors }
  }, [])

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0003
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

const GalaxyScene: React.FC<GalaxySceneProps> = ({
  stars,
  brightnessThreshold,
  showPlanets,
  showLabels,
  showOrbits,
  selectedStarId,
  onSelectStar,
  onHoverPlanet,
  onHoverStar,
}) => {
  const timeRef = useRef(0)
  const { camera, gl } = useThree()
  const keysRef = useRef({ w: false, a: false, s: false, d: false })
  const targetCameraPos = useRef<THREE.Vector3 | null>(null)
  const targetCameraLook = useRef<THREE.Vector3 | null>(null)
  const isAnimatingRef = useRef(false)
  const animProgressRef = useRef(0)
  const animStartPosRef = useRef(new THREE.Vector3())
  const animStartLookRef = useRef(new THREE.Vector3())

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k in keysRef.current) {
        keysRef.current[k as keyof typeof keysRef.current] = true
      }
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k in keysRef.current) {
        keysRef.current[k as keyof typeof keysRef.current] = false
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const selectedStar = selectedStarId ? stars.find((s) => s.id === selectedStarId) : null

  useEffect(() => {
    if (selectedStar) {
      const [sx, sy, sz] = selectedStar.position
      const starPos = new THREE.Vector3(sx, sy, sz)
      const dir = new THREE.Vector3().subVectors(camera.position, starPos).normalize()
      const targetPos = starPos.clone().add(dir.multiplyScalar(2))

      animStartPosRef.current.copy(camera.position)
      animStartLookRef.current.set(sx, sy, sz)
      targetCameraPos.current = targetPos
      targetCameraLook.current = starPos
      animProgressRef.current = 0
      isAnimatingRef.current = true
    } else if (selectedStarId === null && targetCameraPos.current) {
      animStartPosRef.current.copy(camera.position)
      const currentLook = new THREE.Vector3()
      camera.getWorldDirection(currentLook)
      animStartLookRef.current.copy(camera.position).add(currentLook.multiplyScalar(10))
      targetCameraPos.current = new THREE.Vector3(0, 8, 22)
      targetCameraLook.current = new THREE.Vector3(0, 0, 0)
      animProgressRef.current = 0
      isAnimatingRef.current = true
    }
  }, [selectedStarId])

  const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  useFrame((_, delta) => {
    timeRef.current += delta

    if (isAnimatingRef.current && targetCameraPos.current && targetCameraLook.current) {
      const duration = 1.2
      animProgressRef.current = Math.min(animProgressRef.current + delta / duration, 1)
      const t = easeInOutCubic(animProgressRef.current)

      camera.position.lerpVectors(animStartPosRef.current, targetCameraPos.current, t)
      const newLook = new THREE.Vector3().lerpVectors(animStartLookRef.current, targetCameraLook.current, t)
      camera.lookAt(newLook)

      if (animProgressRef.current >= 1) {
        isAnimatingRef.current = false
        targetCameraPos.current = null
        targetCameraLook.current = null
      }
    } else if (!isAnimatingRef.current && !selectedStarId) {
      const panSpeed = 5 * delta
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      if (keysRef.current.w) camera.position.addScaledVector(forward, panSpeed)
      if (keysRef.current.s) camera.position.addScaledVector(forward, -panSpeed)
      if (keysRef.current.a) camera.position.addScaledVector(right, -panSpeed)
      if (keysRef.current.d) camera.position.addScaledVector(right, panSpeed)
    }
  })

  const handleStarPointerOver = (star: StarData, _e: any) => {
    const vector = new THREE.Vector3(star.position[0], star.position[1], star.position[2])
    vector.project(camera)
    const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth
    const y = (-vector.y * 0.5 + 0.5) * gl.domElement.clientHeight
    onHoverStar(star, { x, y })
  }

  const visibleStars = stars.filter((s) => s.brightness >= brightnessThreshold)

  return (
    <group onClick={() => onSelectStar(null)}>
      <BackgroundStars />
      <GalaxyDisk />
      {visibleStars.map((star) => (
        <StarMesh
          key={star.id}
          star={star}
          selected={selectedStarId === star.id}
          dimmed={selectedStarId !== null && selectedStarId !== star.id}
          showPlanets={showPlanets}
          showLabels={showLabels}
          showOrbits={showOrbits}
          onClick={() => onSelectStar(star.id)}
          onPointerOver={(e) => handleStarPointerOver(star, e)}
          onPointerOut={() => onHoverStar(null)}
          onPlanetHover={onHoverPlanet}
          timeRef={timeRef}
        />
      ))}
    </group>
  )
}

export default GalaxyScene
