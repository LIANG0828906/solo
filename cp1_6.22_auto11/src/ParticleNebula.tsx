import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_PARTICLES = 50000

interface ParticleNebulaProps {
  particleCount: number
  colorSpeed: number
  rotationSpeed: number
  flowDirection: { x: number; y: number; z: number }
  onParticleClick: (point: THREE.Vector3) => void
}

const vertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float alpha;
  attribute float randomOffset;
  attribute float particleIndex;
  
  uniform float uTime;
  uniform float uColorSpeed;
  uniform vec3 uFlowDirection;
  uniform float uRotationSpeed;
  uniform float uParticleCount;
  uniform float uMaxParticles;
  
  uniform vec3 uRippleCenter;
  uniform float uRippleRadius;
  uniform float uRippleProgress;
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRippleEffect;
  
  void main() {
    float visibility = step(particleIndex, uParticleCount);
    if (visibility < 0.5) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }
    
    vec3 pos = position;
    
    float angle = uTime * uRotationSpeed;
    float cosA = cos(angle);
    float sinA = sin(angle);
    float x = pos.x * cosA - pos.z * sinA;
    float z = pos.x * sinA + pos.z * cosA;
    pos.x = x;
    pos.z = z;
    
    float flowOffset = uTime * 0.3 + randomOffset * 6.28;
    pos += uFlowDirection * sin(flowOffset) * 0.5;
    pos.y += sin(flowOffset * 0.7 + randomOffset * 3.14) * 0.2;
    
    float distToRipple = distance(pos, uRippleCenter);
    float rippleFront = uRippleProgress * uRippleRadius;
    float rippleBand = 1.5;
    float rippleWave = 1.0 - abs(distToRipple - rippleFront) / rippleBand;
    rippleWave = clamp(rippleWave, 0.0, 1.0);
    float rippleIntensity = sin(rippleWave * 3.14159);
    vRippleEffect = rippleIntensity * uRippleProgress;
    
    vec3 rippleDir = normalize(pos - uRippleCenter + 0.001);
    float disperseAmount = vRippleEffect * 3.0;
    pos += rippleDir * disperseAmount;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + vRippleEffect * 1.5);
    
    float colorShift = sin(uTime * uColorSpeed + randomOffset * 6.28) * 0.5 + 0.5;
    vColor = mix(customColor, customColor * 1.3, colorShift * 0.3);
    
    vec3 whiteColor = vec3(1.0, 1.0, 1.0);
    vColor = mix(vColor, whiteColor, vRippleEffect * 0.95);
    
    vAlpha = alpha * (1.0 + vRippleEffect * 1.5);
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRippleEffect;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5 || vAlpha < 0.01) {
      discard;
    }
    
    float softness = 1.0 - smoothstep(0.0, 0.5, dist);
    float glow = 1.0 - dist * 1.5;
    glow = max(glow, 0.0);
    
    vec3 finalColor = vColor * (0.6 + glow * 0.8);
    float finalAlpha = vAlpha * softness * (0.7 + glow * 0.5);
    
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`

export default function ParticleNebula({
  particleCount,
  colorSpeed,
  rotationSpeed,
  flowDirection,
  onParticleClick,
}: ParticleNebulaProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const hitSphereRef = useRef<THREE.Mesh>(null)
  const { clock } = useThree()
  
  const rippleRef = useRef({
    active: false,
    center: new THREE.Vector3(),
    radius: 5,
    startTime: 0,
    duration: 2,
  })

  const { positions, colors, sizes, alphas, randomOffsets, particleIndices } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const colors = new Float32Array(MAX_PARTICLES * 3)
    const sizes = new Float32Array(MAX_PARTICLES)
    const alphas = new Float32Array(MAX_PARTICLES)
    const randomOffsets = new Float32Array(MAX_PARTICLES)
    const particleIndices = new Float32Array(MAX_PARTICLES)

    const colorPalette = [
      new THREE.Color(0x9333ea),
      new THREE.Color(0x3b82f6),
      new THREE.Color(0xec4899),
      new THREE.Color(0xfbbf24),
    ]

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const i3 = i * 3
      
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.pow(Math.random(), 0.5) * 10

      positions[i3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = r * Math.cos(phi)

      const distFromCenter = r / 10
      const colorIndex = Math.floor(distFromCenter * (colorPalette.length - 1))
      const colorT = (distFromCenter * (colorPalette.length - 1)) % 1
      const baseColor = colorPalette[Math.min(colorIndex, colorPalette.length - 1)]
      const nextColor = colorPalette[Math.min(colorIndex + 1, colorPalette.length - 1)]
      const color = baseColor.clone().lerp(nextColor, colorT)
      
      const hueShift = (Math.random() - 0.5) * 0.08
      color.offsetHSL(hueShift, 0, (Math.random() - 0.5) * 0.2)
      
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      sizes[i] = 0.1 + Math.random() * 0.4

      alphas[i] = Math.max(0.15, 1.0 - distFromCenter * 0.75)

      randomOffsets[i] = Math.random()
      
      particleIndices[i] = i
    }

    return { positions, colors, sizes, alphas, randomOffsets, particleIndices }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geo.setAttribute('randomOffset', new THREE.BufferAttribute(randomOffsets, 1))
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(particleIndices, 1))
    geo.setDrawRange(0, particleCount)
    return geo
  }, [positions, colors, sizes, alphas, randomOffsets, particleIndices, particleCount])

  useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.setDrawRange(0, particleCount)
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uParticleCount.value = particleCount
    }
  }, [particleCount])

  const triggerRipple = useCallback((point: THREE.Vector3) => {
    rippleRef.current = {
      active: true,
      center: point.clone(),
      radius: 5,
      startTime: clock.elapsedTime,
      duration: 2,
    }
    onParticleClick(point)
  }, [clock, onParticleClick])

  useFrame(() => {
    if (materialRef.current) {
      const time = clock.elapsedTime
      materialRef.current.uniforms.uTime.value = time
      materialRef.current.uniforms.uColorSpeed.value = colorSpeed
      materialRef.current.uniforms.uRotationSpeed.value = rotationSpeed
      materialRef.current.uniforms.uFlowDirection.value.set(
        flowDirection.x,
        flowDirection.y,
        flowDirection.z
      )
      
      if (rippleRef.current.active) {
        const elapsed = time - rippleRef.current.startTime
        const progress = Math.min(elapsed / rippleRef.current.duration, 1.0)
        materialRef.current.uniforms.uRippleProgress.value = progress
        materialRef.current.uniforms.uRippleCenter.value.copy(rippleRef.current.center)
        materialRef.current.uniforms.uRippleRadius.value = rippleRef.current.radius
        
        if (progress >= 1.0) {
          rippleRef.current.active = false
        }
      } else {
        materialRef.current.uniforms.uRippleProgress.value = 0
      }
    }
  })

  const handleSphereClick = useCallback((event: any) => {
    event.stopPropagation()
    triggerRipple(event.point)
  }, [triggerRipple])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorSpeed: { value: colorSpeed },
    uRotationSpeed: { value: rotationSpeed },
    uFlowDirection: { value: new THREE.Vector3(flowDirection.x, flowDirection.y, flowDirection.z) },
    uParticleCount: { value: particleCount },
    uMaxParticles: { value: MAX_PARTICLES },
    uRippleCenter: { value: new THREE.Vector3() },
    uRippleRadius: { value: 5 },
    uRippleProgress: { value: 0 },
  }), [colorSpeed, rotationSpeed, flowDirection, particleCount])

  return (
    <group>
      <points ref={pointsRef} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <mesh ref={hitSphereRef} onClick={handleSphereClick}>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
