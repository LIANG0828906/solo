import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CONSTELLATIONS, POLARIS, BACKGROUND_STARS } from '@/data/constellations'
import { useAppStore } from '@/store/useAppStore'

interface StarBackgroundProps {
  particleLimit?: number
}

export default function StarBackground({ particleLimit = 200 }: StarBackgroundProps) {
  const starsRef = useRef<THREE.Points>(null)
  const constellationRef = useRef<THREE.Group>(null)
  const polarisRef = useRef<THREE.Mesh>(null)
  const backgroundRef = useRef<THREE.Points>(null)
  const currentMonth = useAppStore(state => state.currentMonth)

  const { bgPositions, bgColors, bgSizes } = useMemo(() => {
    const totalStars = Math.min(BACKGROUND_STARS.length, particleLimit * 2)
    const positions = new Float32Array(totalStars * 3)
    const colors = new Float32Array(totalStars * 3)
    const sizes = new Float32Array(totalStars)

    BACKGROUND_STARS.slice(0, totalStars).forEach((star, i) => {
      positions[i * 3] = star.position[0]
      positions[i * 3 + 1] = star.position[1]
      positions[i * 3 + 2] = star.position[2]
      
      const brightness = star.brightness
      colors[i * 3] = 0.8 + brightness * 0.2
      colors[i * 3 + 1] = 0.85 + brightness * 0.15
      colors[i * 3 + 2] = 1.0
      
      sizes[i] = star.size
    })

    return { bgPositions: positions, bgColors: colors, bgSizes: sizes }
  }, [particleLimit])

  const constellationStars = useMemo(() => {
    const stars: { position: [number, number, number]; size: number; color: [number, number, number] }[] = []
    CONSTELLATIONS.forEach(constellation => {
      constellation.stars.forEach(star => {
        stars.push({
          position: star.position,
          size: star.size,
          color: [1.0, 0.9, 0.7],
        })
      })
    })
    return stars.slice(0, particleLimit)
  }, [particleLimit])

  const { constellationPositions, constellationColors, constellationSizes } = useMemo(() => {
    const positions = new Float32Array(constellationStars.length * 3)
    const colors = new Float32Array(constellationStars.length * 3)
    const sizes = new Float32Array(constellationStars.length)

    constellationStars.forEach((star, i) => {
      positions[i * 3] = star.position[0]
      positions[i * 3 + 1] = star.position[1]
      positions[i * 3 + 2] = star.position[2]
      
      colors[i * 3] = star.color[0]
      colors[i * 3 + 1] = star.color[1]
      colors[i * 3 + 2] = star.color[2]
      
      sizes[i] = star.size
    })

    return { constellationPositions: positions, constellationColors: colors, constellationSizes: sizes }
  }, [constellationStars])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    const rotationSpeed = (currentMonth / 11) * 0.1 + 0.02

    if (backgroundRef.current) {
      backgroundRef.current.rotation.y += delta * rotationSpeed * 0.3
    }

    if (constellationRef.current) {
      constellationRef.current.rotation.y = (currentMonth / 11) * Math.PI * 2 + time * 0.01
    }

    if (polarisRef.current) {
      const scale = 1 + Math.sin(time * 2) * 0.1
      polarisRef.current.scale.set(scale, scale, scale)
      
      const material = polarisRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.8 + Math.sin(time * 3) * 0.2
    }

    if (starsRef.current) {
      const positions = starsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        const twinkle = Math.sin(time * 2 + i * 0.1) * 0.02
        positions[i + 1] += twinkle * 0.01
      }
      starsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  useEffect(() => {
    if (constellationRef.current) {
      const targetRotation = (currentMonth / 11) * Math.PI * 2
      const startRotation = constellationRef.current.rotation.y
      const duration = 500
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        
        if (constellationRef.current) {
          constellationRef.current.rotation.y = startRotation + (targetRotation - startRotation) * easeProgress
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }
  }, [currentMonth])

  return (
    <group>
      <points ref={backgroundRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={bgPositions.length / 3}
            array={bgPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={bgColors.length / 3}
            array={bgColors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={bgSizes.length}
            array={bgSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      <group ref={constellationRef}>
        <points ref={starsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={constellationPositions.length / 3}
              array={constellationPositions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={constellationColors.length / 3}
              array={constellationColors}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={constellationSizes.length}
              array={constellationSizes}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.08}
            vertexColors
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>

        <mesh ref={polarisRef} position={POLARIS.position}>
          <sphereGeometry args={[POLARIS.size, 16, 16]} />
          <meshBasicMaterial
            color="#fffacd"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh position={POLARIS.position}>
          <sphereGeometry args={[POLARIS.size * 2, 16, 16]} />
          <meshBasicMaterial
            color="#fffacd"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  )
}
