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
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    gl_FragColor = vec4(glowColor, fresnel * 0.4);
  }
`

export default function AtmosphereEffect() {
  const atmosphereRef = useRef<Mesh>(null)
  const cloudsRef = useRef<Points>(null)
  const dataType = useClimateStore((state) => state.dataType)

  const glowColor = useMemo(() => {
    switch (dataType) {
      case 'temperature':
        return '#ff6b4a'
      case 'precipitation':
        return '#4ade80'
      case 'wind':
        return '#a78bfa'
      default:
        return '#60a5fa'
    }
  }, [dataType])

  const cloudParticles = useMemo(() => {
    const count = 200
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const lat = (Math.random() - 0.5) * 180
      const lon = Math.random() * 360 - 180
      const radius = 1.05 + Math.random() * 0.03
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lon + 180) * (Math.PI / 180)
      positions[i * 3] = -radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.cos(phi)
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    }
    return positions
  }, [])

  useFrame((_state, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02
    }
  })

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(glowColor) },
      },
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })
  }, [glowColor])

  return (
    <>
      <mesh ref={atmosphereRef} scale={1.08}>
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
          size={0.03}
          color="#ffffff"
          transparent
          opacity={0.3}
          sizeAttenuation
        />
      </points>
    </>
  )
}
