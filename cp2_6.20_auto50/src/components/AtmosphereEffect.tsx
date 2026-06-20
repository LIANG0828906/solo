import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useClimateStore } from '@/store/useClimateStore'
import * as THREE from 'three'
import type { Mesh, Points } from 'three'

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const atmosphereFragmentShader = `
  uniform vec3 glowColor;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
    gl_FragColor = vec4(glowColor, fresnel * 0.5);
  }
`

export default function AtmosphereEffect() {
  const atmosphereRef = useRef<Mesh>(null)
  const cloudsRef = useRef<Points>(null)
  const dataType = useClimateStore((state) => state.dataType)
  const targetColorRef = useRef(new THREE.Color('#60a5fa'))

  targetColorRef.current.set(
    dataType === 'temperature'
      ? '#ff6b4a'
      : dataType === 'precipitation'
      ? '#4ade80'
      : dataType === 'wind'
      ? '#a78bfa'
      : '#60a5fa'
  )

  const cloudParticles = useMemo(() => {
    const count = 200
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const lat = (Math.random() - 0.5) * 180
      const lon = Math.random() * 360 - 180
      const radius = 1.08 + Math.random() * 0.05
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lon + 180) * (Math.PI / 180)
      positions[i * 3] = -radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.cos(phi)
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    }
    return positions
  }, [])

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color('#ff6b4a') },
      },
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useFrame((_state, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02
    }
    const mat = atmosphereRef.current?.material as THREE.ShaderMaterial | undefined
    if (mat?.uniforms?.glowColor) {
      mat.uniforms.glowColor.value.lerp(targetColorRef.current, Math.min(1, delta * 4))
    }
  })

  return (
    <>
      <mesh ref={atmosphereRef} scale={1.25}>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>

      <points ref={cloudsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={200}
            array={cloudParticles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color="#ffffff"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
    </>
  )
}
