import { useRef, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Ring, Html } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer, RenderPass, BloomEffect, EffectPass, KernelSize } from 'postprocessing'
import { useSimulationStore } from '@/store/useSimulationStore'
import { ParticleSystem, computeParticleTrajectory } from '@/physics/particleSystem'
import { AfterimagePass } from './AfterimagePass'

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

  const emitters = useSimulationStore((s) => s.emitters)
  const physics = useSimulationStore((s) => s.physics)

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
    posAttr.addUpdateRange(0, system.aliveCount * 3)

    colAttr.array.set(system.renderColors.subarray(0, system.aliveCount * 4))
    colAttr.needsUpdate = true
    colAttr.addUpdateRange(0, system.aliveCount * 4)

    sizeAttr.array.set(system.renderSizes.subarray(0, system.aliveCount))
    sizeAttr.needsUpdate = true
    sizeAttr.addUpdateRange(0, system.aliveCount)

    geometry.setDrawRange(0, system.aliveCount)
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function PostProcessing({ trailLength }: { trailLength: number }) {
  const { gl, scene, camera, size } = useThree()
  const composerRef = useRef<EffectComposer | null>(null)
  const afterimagePassRef = useRef<AfterimagePass | null>(null)

  useEffect(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: 0,
    })
    composer.setSize(size.width, size.height)

    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const afterimagePass = new AfterimagePass()
    composer.addPass(afterimagePass)
    afterimagePassRef.current = afterimagePass

    const bloomEffect = new BloomEffect({
      intensity: 0.6,
      luminanceThreshold: 0.2,
      luminanceSmoothing: 0.9,
      kernelSize: KernelSize.MEDIUM,
      mipmapBlur: true,
    })
    const effectPass = new EffectPass(camera, bloomEffect)
    composer.addPass(effectPass)

    composerRef.current = composer

    return () => {
      composer.dispose()
    }
  }, [gl, scene, camera, size])

  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height)
    }
  }, [size.width, size.height])

  useEffect(() => {
    if (afterimagePassRef.current) {
      const minDamp = 0.5
      const maxDamp = 0.96
      const t = (trailLength - 0.1) / 1.9
      const damp = minDamp + Math.pow(t, 0.7) * (maxDamp - minDamp)
      afterimagePassRef.current.damp = damp
    }
  }, [trailLength])

  useFrame((_, delta) => {
    if (composerRef.current) {
      composerRef.current.render(delta)
    }
  }, 1)

  return null
}

function GroundPlane() {
  const addEmitter = useSimulationStore((s) => s.addEmitter)
  const emitters = useSimulationStore((s) => s.emitters)
  const addPlacementEffect = useSimulationStore((s) => s.addPlacementEffect)

  const handleClick = useCallback(
    (e: THREE.Event & { point?: THREE.Vector3; stopPropagation: () => void }) => {
      if (emitters.length >= 3) return
      e.stopPropagation()
      if (e.point) {
        const pos: [number, number, number] = [e.point.x, 0, e.point.z]
        const nextIdx = emitters.length
        const colors = ['#e94560', '#00d2ff', '#f7971e']
        addEmitter(pos)
        addPlacementEffect(pos, colors[nextIdx])
      }
    },
    [addEmitter, addPlacementEffect, emitters.length]
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

function PlacementEffect({ effect, onComplete }: {
  effect: { id: string; position: [number, number, number]; timestamp: number; color: string }
  onComplete: (id: string) => void
}) {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const startTime = useRef(Date.now())

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000
    const duration = 0.3

    if (elapsed >= duration) {
      onComplete(effect.id)
      return
    }

    const t = elapsed / duration
    const easeOut = 1 - Math.pow(1 - t, 3)

    if (ring1Ref.current) {
      const s = 0.3 + easeOut * 2.5
      ring1Ref.current.scale.set(s, s, s)
      const mat = ring1Ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - t) * 0.8
    }

    if (ring2Ref.current) {
      const s = 0.2 + easeOut * 1.8
      ring2Ref.current.scale.set(s, s, s)
      const mat = ring2Ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - t) * 0.5
    }

    if (haloRef.current) {
      const s = 0.5 + easeOut * 3
      haloRef.current.scale.set(s, s, s)
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - t) * 0.25
    }
  })

  return (
    <group position={effect.position}>
      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={0.5}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial
          color={effect.color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <Ring
        ref={ring1Ref as any}
        args={[0.4, 0.45, 48]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
        scale={0.3}
      >
        <meshBasicMaterial
          color={effect.color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Ring>

      <Ring
        ref={ring2Ref as any}
        args={[0.2, 0.25, 48]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
        scale={0.2}
      >
        <meshBasicMaterial
          color={effect.color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Ring>
    </group>
  )
}

function PlacementEffects() {
  const effects = useSimulationStore((s) => s.placementEffects)
  const clearPlacementEffect = useSimulationStore((s) => s.clearPlacementEffect)

  return (
    <group>
      {effects.map((effect) => (
        <PlacementEffect
          key={effect.id}
          effect={effect}
          onComplete={clearPlacementEffect}
        />
      ))}
    </group>
  )
}

function EmitterMarker({ emitter, isActive, isHovered, onClick, onPointerOver, onPointerOut }: {
  emitter: { id: string; position: [number, number, number]; velocity: [number, number, number]; colorStart: string; colorEnd: string; lifetime: number; emitRate: number; active: boolean; gradientMode: string }
  isActive: boolean
  isHovered: boolean
  onClick: () => void
  onPointerOver: () => void
  onPointerOut: () => void
}) {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const pulsePhase = useRef(Math.random() * Math.PI * 2)

  useFrame((_, delta) => {
    pulsePhase.current += delta * 2
    const t = (Math.sin(pulsePhase.current) + 1) * 0.5

    if (ring1Ref.current) {
      const s = 0.6 + t * 0.3
      ring1Ref.current.scale.set(s, s, s)
      const mat = ring1Ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - t) * (isActive ? 0.8 : isHovered ? 0.6 : 0.4)
    }

    if (ring2Ref.current) {
      const s = 0.4 + (1 - t) * 0.3
      ring2Ref.current.scale.set(s, s, s)
      const mat = ring2Ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = t * (isActive ? 0.6 : isHovered ? 0.45 : 0.3)
    }

    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = (isHovered ? 0.25 : 0.15) + t * 0.15
    }
  })

  const vel = emitter.velocity
  const velLength = Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1] + vel[2] * vel[2])
  const arrowLength = Math.max(0.3, velLength * 0.25)
  const arrowRotation: [number, number, number] = [
    0,
    Math.atan2(vel[0], vel[2]),
    -Math.asin(Math.max(-1, Math.min(1, vel[1] / Math.max(velLength, 0.001))))
  ]

  return (
    <group
      position={emitter.position}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={(e) => { e.stopPropagation(); onPointerOver() }}
      onPointerOut={(e) => { e.stopPropagation(); onPointerOut() }}
    >
      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.2, 48]} />
        <meshBasicMaterial
          color={emitter.colorStart}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <Ring
        ref={ring1Ref as any}
        args={[0.45, 0.5, 64]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <meshBasicMaterial
          color={emitter.colorStart}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Ring>

      <Ring
        ref={ring2Ref as any}
        args={[0.25, 0.3, 64]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <meshBasicMaterial
          color={emitter.colorStart}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Ring>

      <group position={[0, 0.3, 0]} rotation={arrowRotation}>
        <mesh position={[0, 0, arrowLength / 2]}>
          <cylinderGeometry args={[0.03, 0.03, arrowLength, 8]} />
          <meshBasicMaterial
            color={emitter.colorStart}
            transparent
            opacity={0.7}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0, arrowLength + 0.08]}>
          <coneGeometry args={[0.08, 0.16, 8]} />
          <meshBasicMaterial
            color={emitter.colorStart}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
      </group>

      <mesh position={[0, 0.3, 0]}>
        <octahedronGeometry args={[isActive ? 0.22 : 0.18, 0]} />
        <meshStandardMaterial
          color={emitter.colorStart}
          emissive={emitter.colorStart}
          emissiveIntensity={isActive ? 2.5 : isHovered ? 1.5 : 1}
          wireframe={!isActive}
          transparent
          opacity={emitter.active ? 1 : 0.4}
        />
      </mesh>

      {isActive && (
        <mesh position={[0, 0.3, 0]}>
          <octahedronGeometry args={[0.35, 0]} />
          <meshBasicMaterial
            color={emitter.colorStart}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      <Text
        position={[0, 1, 0]}
        fontSize={0.22}
        color={isActive ? emitter.colorStart : '#8892a4'}
        anchorX="center"
        anchorY="bottom"
        fontWeight={600}
      >
        {isActive ? '● 选中' : ''}
      </Text>

      {isHovered && (
        <Html
          position={[0, 1.4, 0]}
          center
          distanceFactor={6}
          zIndexRange={[100, 0]}
        >
          <div
            style={{
              backgroundColor: 'rgba(20, 24, 40, 0.95)',
              border: `1px solid ${emitter.colorStart}`,
              borderRadius: '8px',
              padding: '10px 14px',
              minWidth: '160px',
              fontFamily: 'var(--font-ui)',
              boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 20px ${emitter.colorStart}20`,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                color: emitter.colorStart,
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${emitter.colorStart}, ${emitter.colorEnd})`,
                }}
              />
              发射器信息
            </div>
            <div style={{ color: '#a0a8b8', fontSize: '11px', lineHeight: '1.7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>生命周期:</span>
                <span style={{ color: '#ffffff', fontWeight: 500 }}>{emitter.lifetime.toFixed(1)}s</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>发射速率:</span>
                <span style={{ color: '#ffffff', fontWeight: 500 }}>{emitter.emitRate}/s</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>渐变模式:</span>
                <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '10px' }}>
                  {emitter.gradientMode === 'linear' ? '线性' : '指数'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span>颜色渐变:</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      backgroundColor: emitter.colorStart,
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                  <span style={{ color: '#5a6478', fontSize: '10px' }}>→</span>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      backgroundColor: emitter.colorEnd,
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

function EmitterMarkers() {
  const emitters = useSimulationStore((s) => s.emitters)
  const activeEmitterId = useSimulationStore((s) => s.activeEmitterId)
  const hoveredEmitterId = useSimulationStore((s) => s.hoveredEmitterId)
  const setActiveEmitter = useSimulationStore((s) => s.setActiveEmitter)
  const setHoveredEmitter = useSimulationStore((s) => s.setHoveredEmitter)

  return (
    <group>
      {emitters.map((em) => (
        <EmitterMarker
          key={em.id}
          emitter={em}
          isActive={activeEmitterId === em.id}
          isHovered={hoveredEmitterId === em.id}
          onClick={() => setActiveEmitter(em.id)}
          onPointerOver={() => setHoveredEmitter(em.id)}
          onPointerOut={() => setHoveredEmitter(null)}
        />
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
  const trailLength = useSimulationStore((s) => s.physics.trailLength)

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <Particles />
      <GroundPlane />
      <GridFloor />
      <EmitterMarkers />
      <PlacementEffects />
      <ClickHint />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={50}
        maxPolarAngle={Math.PI * 0.85}
      />
      <PostProcessing trailLength={trailLength} />
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
