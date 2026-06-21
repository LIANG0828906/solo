import { useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { EffectComposer, Afterimage, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useSimulationStore } from '@/store/useSimulationStore'
import { ParticleSystem, computeParticleTrajectory } from '@/physics/particleSystem'

const vertexShader = `
  attribute float size;
  attribute vec4 color;
  varying vec4 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (220.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec4 vColor;
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.05, dist);
    gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
  }
`

function Particles() {
  const pointsRef = useRef<THREE.Points>(null)
  const systemRef = useRef(new ParticleSystem())
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const emitters = useSimulationStore((s) => s.emitters)
  const physics = useSimulationStore((s) => s.physics)
  const addEmitter = useSimulationStore((s) => s.addEmitter)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const maxParticles = 15000
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxParticles * 3), 3))
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxParticles * 4), 4))
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(maxParticles), 1))
    geo.setDrawRange(0, 0)
    return geo
  }, [])

  useFrame((_, delta) => {
    const system = systemRef.current
    const dt = Math.min(delta, 0.05)

    computeParticleTrajectory(system, emitters, physics, dt)

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute

    posAttr.array.set(system.renderPositions.subarray(0, system.aliveCount * 3))
    posAttr.needsUpdate = true
    posAttr.updateRange = { offset: 0, count: system.aliveCount * 3 }

    colAttr.array.set(system.renderColors.subarray(0, system.aliveCount * 4))
    colAttr.needsUpdate = true
    colAttr.updateRange = { offset: 0, count: system.aliveCount * 4 }

    sizeAttr.array.set(system.renderSizes.subarray(0, system.aliveCount))
    sizeAttr.needsUpdate = true
    sizeAttr.updateRange = { offset: 0, count: system.aliveCount }

    geometry.setDrawRange(0, system.aliveCount)
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function GroundPlane() {
  const addEmitter = useSimulationStore((s) => s.addEmitter)
  const emitters = useSimulationStore((s) => s.emitters)

  const handleClick = useCallback(
    (e: THREE.Event & { point?: THREE.Vector3; stopPropagation: () => void }) => {
      if (emitters.length >= 3) return
      e.stopPropagation()
      if (e.point) {
        addEmitter([e.point.x, 0, e.point.z])
      }
    },
    [addEmitter, emitters.length]
  )

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

function GridFloor() {
  return (
    <group>
      <gridHelper args={[60, 60, '#1a2744', '#1a2744']} position={[0, 0, 0]} />
      <gridHelper args={[60, 12, '#2a3a5c', '#2a3a5c']} position={[0, 0, 0]} />
    </group>
  )
}

function EmitterMarkers() {
  const emitters = useSimulationStore((s) => s.emitters)
  const activeEmitterId = useSimulationStore((s) => s.activeEmitterId)
  const setActiveEmitter = useSimulationStore((s) => s.setActiveEmitter)

  return (
    <group>
      {emitters.map((em, idx) => (
        <group key={em.id} position={em.position}>
          <mesh
            onClick={(e) => {
              e.stopPropagation()
              setActiveEmitter(em.id)
            }}
          >
            <octahedronGeometry args={[0.25, 0]} />
            <meshStandardMaterial
              color={em.colorStart}
              emissive={em.colorStart}
              emissiveIntensity={activeEmitterId === em.id ? 2 : 0.8}
              wireframe={activeEmitterId !== em.id}
            />
          </mesh>
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.2}
            color="#8892a4"
            anchorX="center"
            anchorY="bottom"
          >
            {`E${idx + 1}`}
          </Text>
        </group>
      ))}
    </group>
  )
}

function ClickHint() {
  const emitters = useSimulationStore((s) => s.emitters)
  if (emitters.length > 0) return null

  return (
    <Text
      position={[0, 1.5, 0]}
      fontSize={0.35}
      color="#5a6478"
      anchorX="center"
      anchorY="middle"
    >
      点击地面放置发射器
    </Text>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <Particles />
      <GroundPlane />
      <GridFloor />
      <EmitterMarkers />
      <ClickHint />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={50}
        maxPolarAngle={Math.PI * 0.85}
      />
      <EffectComposer>
        <Afterimage damp={0.88} />
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

export default function ParticleScene() {
  return (
    <Canvas
      camera={{ position: [0, 8, 16], fov: 55, near: 0.1, far: 200 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      style={{ background: '#1a1a2e' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#1a1a2e')
      }}
    >
      <Scene />
    </Canvas>
  )
}
