import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFireflyStore } from '../store/fireflyStore'

const FIREFLY_COUNT = 120

const COOL_COLOR = new THREE.Color('#74B9FF')
const WARM_COLOR = new THREE.Color('#E17055')

function createParticleTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  )
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.25)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export default function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)
  const texture = useMemo(() => createParticleTexture(), [])
  const fireflies = useFireflyStore((s) => s.fireflies)

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(FIREFLY_COUNT * 3)
    const colors = new Float32Array(FIREFLY_COUNT * 3)
    const sizes = new Float32Array(FIREFLY_COUNT)
    return { positions, colors, sizes }
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    const geo = pointsRef.current.geometry
    const posAttr = geo.attributes.position as THREE.BufferAttribute
    const colAttr = geo.attributes.color as THREE.BufferAttribute
    const sizeAttr = geo.attributes.size as THREE.BufferAttribute

    const list = fireflies
    for (let i = 0; i < list.length; i++) {
      const f = list[i]
      const i3 = i * 3

      posAttr.array[i3] = f.position.x
      posAttr.array[i3 + 1] = f.position.y
      posAttr.array[i3 + 2] = f.position.z

      const brightness = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(f.phase))
      const color = new THREE.Color().lerpColors(COOL_COLOR, WARM_COLOR, f.fatigue)
      color.multiplyScalar(brightness)

      colAttr.array[i3] = color.r
      colAttr.array[i3 + 1] = color.g
      colAttr.array[i3 + 2] = color.b

      sizeAttr.array[i] = f.size
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={FIREFLY_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={FIREFLY_COUNT}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={FIREFLY_COUNT}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        uniforms={{
          uTexture: { value: texture },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        }}
        vertexShader={`
          attribute float size;
          uniform float uPixelRatio;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          uniform sampler2D uTexture;
          varying vec3 vColor;
          void main() {
            vec4 tex = texture2D(uTexture, gl_PointCoord);
            if (tex.a < 0.01) discard;
            gl_FragColor = vec4(vColor, 1.0) * tex;
          }
        `}
      />
    </points>
  )
}
