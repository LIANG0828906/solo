import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioStore } from '@/store/audioStore'

const PARTICLE_COUNT = 600

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aBand;
  attribute vec3 aBasePosition;

  uniform float uLowAvg;
  uniform float uMidAvg;
  uniform float uHighAvg;
  uniform float uBeat;
  uniform float uVolume;
  uniform float uTime;

  varying vec3 vColor;

  void main() {
    float bandValue;
    vec3 bandColor;

    if (aBand < 0.2) {
      bandValue = uLowAvg;
      bandColor = vec3(1.0, 0.2, 0.4);
    } else if (aBand < 0.6) {
      bandValue = uMidAvg;
      bandColor = vec3(0.0, 0.898, 1.0);
    } else {
      bandValue = uHighAvg;
      bandColor = vec3(0.702, 0.533, 1.0);
    }

    float displacement = bandValue * 2.5 + uVolume * 1.5;
    vec3 dir = normalize(aBasePosition);
    vec3 displaced = aBasePosition + dir * displacement;

    float wave = sin(uTime * 2.0 + aBand * 20.0) * 0.15;
    displaced.y += wave;
    displaced.x += sin(uTime * 1.5 + aBand * 15.0) * 0.1;

    float beatPulse = uBeat * 0.8;
    displaced += dir * beatPulse * 0.5;

    vec3 baseColor = mix(vec3(0.702, 0.533, 1.0), bandColor, bandValue);
    float beatGlow = uBeat * 0.4;
    vColor = baseColor + vec3(beatGlow * 0.5, beatGlow * 0.3, beatGlow * 0.7);

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    float sizeScale = 1.0 + bandValue * 1.5 + uBeat * 0.5;
    gl_PointSize = aSize * sizeScale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    float glow = exp(-dist * 4.0) * 0.6;

    vec3 finalColor = vColor + vColor * glow;
    gl_FragColor = vec4(finalColor, alpha * 0.9);
  }
`

export function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  const uniformsRef = useRef({
    uLowAvg: { value: 0 },
    uMidAvg: { value: 0 },
    uHighAvg: { value: 0 },
    uBeat: { value: 0 },
    uVolume: { value: 0 },
    uTime: { value: 0 },
  })

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const basePositions = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const bands = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const radius = 2 + Math.random() * 5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z

      basePositions[i3] = x
      basePositions[i3 + 1] = y
      basePositions[i3 + 2] = z

      sizes[i] = 3 + Math.random() * 9

      bands[i] = i / PARTICLE_COUNT
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('aBasePosition', new THREE.BufferAttribute(basePositions, 3))
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geom.setAttribute('aBand', new THREE.BufferAttribute(bands, 1))

    return geom
  }, [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: uniformsRef.current,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useFrame((_state, delta) => {
    const state = useAudioStore.getState()
    const freq = state.frequencyData
    const beat = state.beat
    const volume = state.volume

    const freqLen = freq.length
    const lowBand = Math.floor(freqLen * 0.2)
    const midBand = Math.floor(freqLen * 0.6)

    let lowSum = 0
    let midSum = 0
    let highSum = 0
    for (let i = 0; i < lowBand; i++) lowSum += freq[i]
    for (let i = lowBand; i < midBand; i++) midSum += freq[i]
    for (let i = midBand; i < freqLen; i++) highSum += freq[i]
    const lowAvg = lowSum / Math.max(lowBand, 1) / 255
    const midAvg = midSum / Math.max(midBand - lowBand, 1) / 255
    const highAvg = highSum / Math.max(freqLen - midBand, 1) / 255

    uniformsRef.current.uLowAvg.value = lowAvg
    uniformsRef.current.uMidAvg.value = midAvg
    uniformsRef.current.uHighAvg.value = highAvg
    uniformsRef.current.uBeat.value = beat
    uniformsRef.current.uVolume.value = volume
    uniformsRef.current.uTime.value += delta

    void pointsRef
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
