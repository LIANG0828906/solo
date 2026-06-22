import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFlowStore, Particle } from '@/store/flowStore'
import { updateParticlesPhysics } from '@/simulation/physicsEngine'

interface ClickBurst {
  position: THREE.Vector3
  startTime: number
  sprite: THREE.Sprite | null
}

const ParticleSystem = () => {
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const burstSpritesRef = useRef<ClickBurst[]>([])

  const {
    particles,
    gravityVector,
    windVector,
    targetWindVector,
    windTransitionStartTime,
    clickPosition,
    specialEffect,
    effectStartTime,
    updateParticles,
  } = useFlowStore()

  const particleCount = particles.length

  const { positions, colors, sizes, opacities, linePositions, lineColors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const opacities = new Float32Array(particleCount)

    let totalLineSegments = 0
    for (const p of particles) {
      if (p.history.length >= 2) {
        totalLineSegments += p.history.length - 1
      }
    }

    const linePositions = new Float32Array(totalLineSegments * 2 * 3)
    const lineColors = new Float32Array(totalLineSegments * 2 * 3)

    let lineIndex = 0

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i]

      positions[i * 3] = p.position.x
      positions[i * 3 + 1] = p.position.y
      positions[i * 3 + 2] = p.position.z

      colors[i * 3] = p.color.r
      colors[i * 3 + 1] = p.color.g
      colors[i * 3 + 2] = p.color.b

      sizes[i] = p.size
      opacities[i] = p.opacity

      if (p.history.length >= 2) {
        for (let j = 0; j < p.history.length - 1; j++) {
          const idx = lineIndex * 2 * 3

          linePositions[idx] = p.history[j].x
          linePositions[idx + 1] = p.history[j].y
          linePositions[idx + 2] = p.history[j].z

          linePositions[idx + 3] = p.history[j + 1].x
          linePositions[idx + 4] = p.history[j + 1].y
          linePositions[idx + 5] = p.history[j + 1].z

          const alpha = (j / (p.history.length - 1)) * 0.3
          lineColors[idx] = p.color.r
          lineColors[idx + 1] = p.color.g
          lineColors[idx + 2] = p.color.b

          lineColors[idx + 3] = p.color.r
          lineColors[idx + 4] = p.color.g
          lineColors[idx + 5] = p.color.b

          void alpha
          lineIndex++
        }
      }
    }

    return { positions, colors, sizes, opacities, linePositions, lineColors }
  }, [particles])

  useEffect(() => {
    if (clickPosition) {
      const burst: ClickBurst = {
        position: clickPosition.clone(),
        startTime: performance.now(),
        sprite: null,
      }
      burstSpritesRef.current.push(burst)
    }
  }, [clickPosition])

  useFrame((state, delta) => {
    void delta
    const currentTime = performance.now()

    if (particles.length > 0) {
      const result = updateParticlesPhysics(
        particles,
        {
          gravityVector,
          windVector,
          targetWindVector,
          windTransitionStartTime,
          clickPosition,
          specialEffect,
          effectStartTime,
        },
        currentTime
      )
      updateParticles(() => result.particles)
    }

    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
      const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute
      const sizeAttr = geometry.getAttribute('aSize') as THREE.BufferAttribute
      const opacityAttr = geometry.getAttribute('aOpacity') as THREE.BufferAttribute

      for (let i = 0; i < particleCount; i++) {
        const p = particles[i]
        if (!p) continue

        posAttr.array[i * 3] = p.position.x
        posAttr.array[i * 3 + 1] = p.position.y
        posAttr.array[i * 3 + 2] = p.position.z

        colorAttr.array[i * 3] = p.color.r
        colorAttr.array[i * 3 + 1] = p.color.g
        colorAttr.array[i * 3 + 2] = p.color.b

        sizeAttr.array[i] = p.size
        opacityAttr.array[i] = p.opacity
      }

      posAttr.needsUpdate = true
      colorAttr.needsUpdate = true
      sizeAttr.needsUpdate = true
      opacityAttr.needsUpdate = true
    }

    if (linesRef.current) {
      const geometry = linesRef.current.geometry
      const linePosAttr = geometry.getAttribute('position') as THREE.BufferAttribute
      const lineColorAttr = geometry.getAttribute('color') as THREE.BufferAttribute

      let lineIndex = 0
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i]
        if (!p || p.history.length < 2) continue

        for (let j = 0; j < p.history.length - 1; j++) {
          const idx = lineIndex * 2 * 3

          linePosAttr.array[idx] = p.history[j].x
          linePosAttr.array[idx + 1] = p.history[j].y
          linePosAttr.array[idx + 2] = p.history[j].z

          linePosAttr.array[idx + 3] = p.history[j + 1].x
          linePosAttr.array[idx + 4] = p.history[j + 1].y
          linePosAttr.array[idx + 5] = p.history[j + 1].z

          lineColorAttr.array[idx] = p.color.r
          lineColorAttr.array[idx + 1] = p.color.g
          lineColorAttr.array[idx + 2] = p.color.b

          lineColorAttr.array[idx + 3] = p.color.r
          lineColorAttr.array[idx + 4] = p.color.g
          lineColorAttr.array[idx + 5] = p.color.b

          lineIndex++
        }
      }

      linePosAttr.needsUpdate = true
      lineColorAttr.needsUpdate = true
    }

    burstSpritesRef.current = burstSpritesRef.current.filter((burst) => {
      const elapsed = currentTime - burst.startTime
      if (elapsed > 1000) {
        if (burst.sprite) {
          burst.sprite.parent?.remove(burst.sprite)
        }
        return false
      }
      return true
    })
  })

  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1))
    return geo
  }, [positions, colors, sizes, opacities])

  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))
    return geo
  }, [linePositions, lineColors])

  const pointsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aOpacity;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vColor = color;
          vOpacity = aOpacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          vec3 finalColor = vColor + glow * 0.5;
          gl_FragColor = vec4(finalColor, vOpacity * glow);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  const linesMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      linewidth: 2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  useEffect(() => {
    return () => {
      pointsGeometry.dispose()
      linesGeometry.dispose()
      pointsMaterial.dispose()
      linesMaterial.dispose()
    }
  }, [pointsGeometry, linesGeometry, pointsMaterial, linesMaterial])

  return (
    <group>
      <points ref={pointsRef} geometry={pointsGeometry} material={pointsMaterial} />
      <lineSegments ref={linesRef} geometry={linesGeometry} material={linesMaterial} />
    </group>
  )
}

export default ParticleSystem
