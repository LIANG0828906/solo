import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useClimateStore } from '@/store/useClimateStore'
import { useViewPreset } from '@/hooks/useViewPreset'
import ClimateLayer from '@/components/ClimateLayer'
import AtmosphereEffect from '@/components/AtmosphereEffect'
import * as THREE from 'three'
import type { Group, Mesh } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const earthFragmentShader = `
  uniform vec3 oceanColor;
  uniform vec3 landColor;
  uniform vec3 emissiveColor;
  uniform float emissiveIntensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  void main() {
    vec3 normal = normalize(vNormal);
    
    vec2 uv = vUv;
    uv.x *= 3.0;
    uv.y *= 1.5;
    
    float continentNoise = fbm(uv + vec2(0.5, 0.2));
    float detailNoise = fbm(uv * 4.0) * 0.3;
    float landMask = smoothstep(0.45, 0.55, continentNoise + detailNoise * 0.5);
    
    float lat = vPosition.y;
    float polarIce = smoothstep(0.85, 0.95, abs(lat));
    vec3 iceColor = vec3(0.95, 0.97, 1.0);
    
    vec3 baseLand = mix(landColor, iceColor, polarIce);
    
    float oceanDetail = fbm(uv * 6.0) * 0.1;
    vec3 oceanDeep = oceanColor * 0.7;
    vec3 oceanShallow = oceanColor + vec3(0.1, 0.15, 0.2);
    vec3 finalOcean = mix(oceanDeep, oceanShallow, oceanDetail + 0.3);
    
    vec3 finalColor = mix(finalOcean, baseLand, landMask);
    
    vec3 finalEmissive = emissiveColor * emissiveIntensity * landMask * 0.3;
    
    gl_FragColor = vec4(finalColor + finalEmissive, 1.0);
  }
`

export default function Earth() {
  const earthRef = useRef<Group>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const earthMeshRef = useRef<Mesh>(null)
  const autoRotate = useClimateStore((state) => state.autoRotate)

  useViewPreset(controlsRef)

  useFrame((_state, delta) => {
    if (earthRef.current && autoRotate) {
      earthRef.current.rotation.y += delta * 0.1
    }
  })

  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        oceanColor: { value: new THREE.Color('#1e88e5') },
        landColor: { value: new THREE.Color('#22c55e') },
        emissiveColor: { value: new THREE.Color('#60a5fa') },
        emissiveIntensity: { value: 0.2 },
      },
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
    })
  }, [])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} />
      <directionalLight position={[-5, 2, -5]} intensity={0.4} />

      <group ref={earthRef}>
        <mesh ref={earthMeshRef}>
          <sphereGeometry args={[1, 64, 64]} />
          <primitive object={earthMaterial} attach="material" />
        </mesh>

        <ClimateLayer />
        <AtmosphereEffect />
      </group>

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2.5}
        maxDistance={15}
        enablePan={false}
      />
    </>
  )
}
