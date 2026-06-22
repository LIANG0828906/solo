import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { ParticleData } from '../PhysicsEngine'
import { useParticleStore } from '../store'
import { interpolateColor } from '../utils/colorUtils'

interface SceneProps {
  onFpsUpdate: (fps: number) => void
}

interface ParticleMeshProps {
  particles: ParticleData[]
}

const ParticleMesh: React.FC<ParticleMeshProps> = React.memo(({ particles }) => {
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const { colorStart, colorEnd, colorCurve } = useParticleStore.getState()

  const [maxParticles, maxTrailPoints] = useMemo(() => {
    const MAX_P = 1000
    const TRAIL_LEN = 20
    return [MAX_P, TRAIL_LEN]
  }, [])

  const positions = useMemo(
    () => new Float32Array(maxParticles * 3),
    [maxParticles]
  )
  const colors = useMemo(
    () => new Float32Array(maxParticles * 3),
    [maxParticles]
  )
  const sizes = useMemo(
    () => new Float32Array(maxParticles),
    [maxParticles]
  )

  const linePositions = useMemo(
    () => new Float32Array(maxParticles * maxTrailPoints * 2 * 3),
    [maxParticles, maxTrailPoints]
  )
  const lineColors = useMemo(
    () => new Float32Array(maxParticles * maxTrailPoints * 2 * 3),
    [maxParticles, maxTrailPoints]
  )

  useFrame(() => {
    if (!pointsRef.current || !linesRef.current) return

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
    const colorAttr = pointsRef.current.geometry.getAttribute('color') as THREE.BufferAttribute
    const sizeAttr = pointsRef.current.geometry.getAttribute('aSize') as THREE.BufferAttribute

    const linePosAttr = linesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
    const lineColorAttr = linesRef.current.geometry.getAttribute('color') as THREE.BufferAttribute

    const { colorStart: cs, colorEnd: ce, colorCurve: cc } = useParticleStore.getState()

    let lineIndex = 0
    const maxLines = maxParticles * maxTrailPoints

    for (let i = 0; i < maxParticles; i++) {
      const idx = i * 3
      if (i < particles.length) {
        const p = particles[i]
        const t = 1 - (p.life / p.maxLife)
        const color = interpolateColor(cs, ce, t, cc)

        positions[idx] = p.x
        positions[idx + 1] = p.y
        positions[idx + 2] = p.z

        colors[idx] = color.r / 255
        colors[idx + 1] = color.g / 255
        colors[idx + 2] = color.b / 255

        sizes[i] = p.size

        for (let j = 0; j < p.trail.length - 1 && lineIndex < maxLines; j++) {
          const t1 = p.trail[j]
          const t2 = p.trail[j + 1]
          const trailProgress = j / (p.trail.length - 1)
          const lineT = 1 - (p.life / p.maxLife)
          const lineColor = interpolateColor(cs, ce, lineT, cc)

          const alpha1 = 1 - trailProgress
          const alpha2 = 1 - (trailProgress + 1 / p.trail.length)

          const lposIdx = lineIndex * 6
          linePositions[lposIdx] = t1.x
          linePositions[lposIdx + 1] = t1.y
          linePositions[lposIdx + 2] = t1.z
          linePositions[lposIdx + 3] = t2.x
          linePositions[lposIdx + 4] = t2.y
          linePositions[lposIdx + 5] = t2.z

          const lcolIdx = lineIndex * 6
          lineColors[lcolIdx] = (lineColor.r / 255) * alpha1
          lineColors[lcolIdx + 1] = (lineColor.g / 255) * alpha1
          lineColors[lcolIdx + 2] = (lineColor.b / 255) * alpha1
          lineColors[lcolIdx + 3] = (lineColor.r / 255) * alpha2
          lineColors[lcolIdx + 4] = (lineColor.g / 255) * alpha2
          lineColors[lcolIdx + 5] = (lineColor.b / 255) * alpha2

          lineIndex++
        }
      } else {
        positions[idx] = 0
        positions[idx + 1] = -1000
        positions[idx + 2] = 0
        colors[idx] = 0
        colors[idx + 1] = 0
        colors[idx + 2] = 0
        sizes[i] = 0
      }
    }

    for (let i = lineIndex; i < maxLines; i++) {
      const lposIdx = i * 6
      linePositions[lposIdx] = 0
      linePositions[lposIdx + 1] = -1000
      linePositions[lposIdx + 2] = 0
      linePositions[lposIdx + 3] = 0
      linePositions[lposIdx + 4] = -1000
      linePositions[lposIdx + 5] = 0
    }

    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
    linePosAttr.needsUpdate = true
    lineColorAttr.needsUpdate = true
  })

  const pointsGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    return geom
  }, [positions, colors, sizes])

  const linesGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))
    return geom
  }, [linePositions, lineColors])

  const pointsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float aSize;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  const linesMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  return (
    <>
      <points ref={pointsRef} geometry={pointsGeometry} material={pointsMaterial} />
      <lineSegments ref={linesRef} geometry={linesGeometry} material={linesMaterial} />
    </>
  )
})

ParticleMesh.displayName = 'ParticleMesh'

const FPSMonitor: React.FC<{ onFpsUpdate: (fps: number) => void }> = ({ onFpsUpdate }) => {
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  useFrame(() => {
    frameCount.current++
    const now = performance.now()
    if (now - lastTime.current >= 500) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current))
      onFpsUpdate(fps)
      frameCount.current = 0
      lastTime.current = now
    }
  })

  return null
}

const InnerScene: React.FC<SceneProps> = ({ onFpsUpdate }) => {
  const [particles, setParticles] = useState<ParticleData[]>([])

  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.data.type === 'particles') {
      setParticles(e.data.payload.particles)
      useParticleStore.getState().setParticleCount(e.data.payload.count)
    } else if (e.data.type === 'count') {
      useParticleStore.getState().setParticleCount(e.data.payload.count)
    }
  }, [])

  useEffect(() => {
    const worker = (window as any).__particleWorker
    if (worker) {
      worker.addEventListener('message', handleMessage)
    }
    return () => {
      if (worker) {
        worker.removeEventListener('message', handleMessage)
      }
    }
  }, [handleMessage])

  useEffect(() => {
    const worker = (window as any).__particleWorker
    const state = useParticleStore.getState()
    if (worker) {
      worker.postMessage({
        type: 'setParams',
        payload: {
          gravity: state.gravity,
          windX: state.windX,
          windY: state.windY,
          windZ: state.windZ,
          drag: state.drag,
        },
      })
    }
  }, [])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <Grid
        position={[0, 0, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3D3D5C"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#6C63FF"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />
      <ParticleMesh particles={particles} />
      <FPSMonitor onFpsUpdate={onFpsUpdate} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={100}
        makeDefault
      />
    </>
  )
}

export const ParticleScene: React.FC<SceneProps> = (props) => {
  return (
    <Canvas
      camera={{ position: [10, 8, 15], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0A0A1A' }}
    >
      <InnerScene {...props} />
    </Canvas>
  )
}
