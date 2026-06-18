import { useRef, useMemo, useEffect } from 'react'
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useOceanStore } from './oceanStore'
import { getParticlesAtTime, getTotalParticles, getParticleById, RenderParticle } from './oceanData'

const EARTH_RADIUS = 10

function EarthGrid() {
  const meridians = useMemo(() => {
    const segments = 36
    const points: THREE.Vector3[][] = []
    for (let i = 0; i < 12; i++) {
      const lon = (i / 12) * 360 - 180
      const line: THREE.Vector3[] = []
      for (let j = 0; j <= segments; j++) {
        const lat = (j / segments) * 180 - 90
        const phi = (90 - lat) * (Math.PI / 180)
        const theta = (lon + 180) * (Math.PI / 180)
        line.push(new THREE.Vector3(
          -EARTH_RADIUS * Math.sin(phi) * Math.cos(theta),
          EARTH_RADIUS * Math.cos(phi),
          EARTH_RADIUS * Math.sin(phi) * Math.sin(theta)
        ))
      }
      points.push(line)
    }
    return points
  }, [])

  const parallels = useMemo(() => {
    const segments = 72
    const points: THREE.Vector3[][] = []
    for (let i = 1; i < 9; i++) {
      const lat = (i / 9) * 180 - 90
      const line: THREE.Vector3[] = []
      for (let j = 0; j <= segments; j++) {
        const lon = (j / segments) * 360 - 180
        const phi = (90 - lat) * (Math.PI / 180)
        const theta = (lon + 180) * (Math.PI / 180)
        line.push(new THREE.Vector3(
          -EARTH_RADIUS * Math.sin(phi) * Math.cos(theta),
          EARTH_RADIUS * Math.cos(phi),
          EARTH_RADIUS * Math.sin(phi) * Math.sin(theta)
        ))
      }
      points.push(line)
    }
    return points
  }, [])

  return (
    <group>
      {meridians.map((line, i) => (
        <line key={`m-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(line.flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#4A4A4A" transparent opacity={0.3} />
        </line>
      ))}
      {parallels.map((line, i) => (
        <line key={`p-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(line.flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#4A4A4A" transparent opacity={0.3} />
        </line>
      ))}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 0.998, 64, 64]} />
        <meshBasicMaterial
          color="#0A0E27"
          transparent
          opacity={0.5}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

interface OceanParticlesProps {
  onParticleClick: (particle: RenderParticle) => void
}

function OceanParticles({ onParticleClick }: OceanParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const selectParticle = useOceanStore(state => state.selectParticle)
  const tick = useOceanStore(state => state.tick)
  const { viewport } = useThree()

  const totalCount = getTotalParticles()

  const posArrayRef = useRef<Float32Array>(new Float32Array(totalCount * 3))
  const colorArrayRef = useRef<Float32Array>(new Float32Array(totalCount * 3))
  const pSizeArrayRef = useRef<Float32Array>(new Float32Array(totalCount))

  const particlesRef = useRef<RenderParticle[]>([])
  const idIndexMapRef = useRef<Map<string, number>>(new Map())

  useFrame((_, delta) => {
    tick(Math.min(delta, 0.1))

    const state = useOceanStore.getState()
    const particles = getParticlesAtTime(state.currentTime)
    particlesRef.current = particles
    const selId = state.selectedParticleId
    const pixelRatio = viewport.dpr

    if (idIndexMapRef.current.size === 0) {
      particles.forEach((p, i) => idIndexMapRef.current.set(p.id, i))
    }

    const posArr = posArrayRef.current
    const colArr = colorArrayRef.current
    const szArr = pSizeArrayRef.current

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const isSelected = p.id === selId

      posArr[i * 3] = p.position.x
      posArr[i * 3 + 1] = p.position.y
      posArr[i * 3 + 2] = p.position.z

      colArr[i * 3] = p.color.r
      colArr[i * 3 + 1] = p.color.g
      colArr[i * 3 + 2] = p.color.b

      szArr[i] = (isSelected ? 12 : p.size) * pixelRatio
    }

    if (pointsRef.current) {
      const geo = pointsRef.current.geometry
      ;(geo.attributes.position as THREE.BufferAttribute).needsUpdate = true
      ;(geo.attributes.color as THREE.BufferAttribute).needsUpdate = true
      ;(geo.attributes.pSize as THREE.BufferAttribute).needsUpdate = true
      geo.computeBoundingSphere()
    }
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const idx = e.index
    if (idx !== undefined && idx >= 0 && idx < particlesRef.current.length) {
      const p = particlesRef.current[idx]
      const selectedId = useOceanStore.getState().selectedParticleId
      if (selectedId === p.id) {
        selectParticle(null)
      } else {
        selectParticle(p.id)
        onParticleClick(p)
      }
    }
  }

  return (
    <points
      ref={pointsRef}
      onClick={handleClick}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={totalCount}
          array={posArrayRef.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={totalCount}
          array={colorArrayRef.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-pSize"
          count={totalCount}
          array={pSizeArrayRef.current}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexColors
        transparent
        depthTest={true}
        depthWrite={true}
        vertexShader={`
          attribute vec3 color;
          attribute float pSize;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = pSize;
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;
            float alpha = 1.0 - smoothstep(0.75, 1.0, r);
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
      />
    </points>
  )
}

function SelectedParticleHalo() {
  const selectedId = useOceanStore(state => state.selectedParticleId)
  const currentTime = useOceanStore(state => state.currentTime)
  const haloRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (selectedId && haloRef.current) {
      const particle = getParticleById(selectedId, currentTime)
      if (particle) {
        haloRef.current.position.copy(particle.position)
        haloRef.current.lookAt(0, 0, 0)
      }
    }
  })

  if (!selectedId) return null
  const particle = getParticleById(selectedId, currentTime)
  if (!particle) return null

  return (
    <mesh ref={haloRef} position={particle.position}>
      <circleGeometry args={[1.2, 32]} />
      <meshBasicMaterial
        color="#FFFFFF"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}

interface OceanSceneProps {
  onParticleClick: (particle: RenderParticle) => void
}

export default function OceanRenderer({ onParticleClick }: OceanSceneProps) {
  return (
    <>
      <color attach="background" args={['#0A0E27']} />
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight position={[20, 15, 20]} intensity={0.8} color="#ffffff" />
      <Stars
        radius={200}
        depth={80}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
      <EarthGrid />
      <OceanParticles onParticleClick={onParticleClick} />
      <SelectedParticleHalo />
      <OrbitControls
        enablePan={false}
        minDistance={16}
        maxDistance={80}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
      />
    </>
  )
}
