import { useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { useAppStore } from '@/store/useAppStore'
import { themeConfigs, hslToRgb, getHueFromFrequency } from '@/utils/colorUtils'
import { calculateFrequencyBands, mapRange } from '@/utils/audioUtils'
import type { ThemeType, ParticleData, FrequencyBands } from '@/types'

interface UseParticleAnimationProps {
  sceneRef: React.MutableRefObject<THREE.Scene | null>
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>
}

export function useParticleAnimation({
  sceneRef,
  cameraRef,
  rendererRef,
}: UseParticleAnimationProps) {
  const particlesRef = useRef<THREE.Points | null>(null)
  const particleDataRef = useRef<ParticleData | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const fpsRef = useRef<{ count: number; lastTime: number; value: number }>({
    count: 0,
    lastTime: performance.now(),
    value: 60,
  })
  const backgroundRef = useRef<{ r: number; g: number; b: number }>({ r: 0.04, g: 0.04, b: 0.1 })
  const currentHuesRef = useRef<Float32Array | null>(null)

  const particleCount = useAppStore((state) => state.particleCount)
  const speedMultiplier = useAppStore((state) => state.speedMultiplier)
  const colorSaturation = useAppStore((state) => state.colorSaturation)
  const glowIntensity = useAppStore((state) => state.glowIntensity)
  const currentTheme = useAppStore((state) => state.currentTheme)
  const frequencyData = useAppStore((state) => state.frequencyData)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const audioCurrentTime = useAppStore((state) => state.currentTime)

  const initializeParticles = useCallback(
    (count: number) => {
      const scene = sceneRef.current
      if (!scene) return

      if (particlesRef.current) {
        scene.remove(particlesRef.current)
        particlesRef.current.geometry.dispose()
        ;(particlesRef.current.material as THREE.Material).dispose()
      }

      const basePosition = new Float32Array(count * 3)
      const phaseOffset = new Float32Array(count)
      const currentPosition = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      const sizes = new Float32Array(count)
      const currentHues = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const radius = Math.cbrt(Math.random()) * 30

        const x = radius * Math.sin(phi) * Math.cos(theta)
        const y = radius * Math.sin(phi) * Math.sin(theta)
        const z = radius * Math.cos(phi)

        basePosition[i * 3] = x
        basePosition[i * 3 + 1] = y
        basePosition[i * 3 + 2] = z

        currentPosition[i * 3] = x
        currentPosition[i * 3 + 1] = y
        currentPosition[i * 3 + 2] = z

        phaseOffset[i] = Math.random() * Math.PI * 2
        currentHues[i] = Math.random() * 360

        const color = hslToRgb(currentHues[i], colorSaturation / 100, 0.6)
        colors[i * 3] = color[0]
        colors[i * 3 + 1] = color[1]
        colors[i * 3 + 2] = color[2]

        sizes[i] = 1.0
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(currentPosition, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      const material = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const particles = new THREE.Points(geometry, material)
      scene.add(particles)

      particlesRef.current = particles
      particleDataRef.current = {
        basePosition,
        phaseOffset,
        currentPosition,
        colors,
        sizes,
      }
      currentHuesRef.current = currentHues
    },
    [sceneRef, colorSaturation],
  )

  const updateRendererPixelRatio = useCallback(
    (count: number) => {
      const renderer = rendererRef.current
      if (!renderer) return
      let ratio = window.devicePixelRatio || 1
      if (count > 50000) {
        ratio = 0.5
      } else if (count > 30000) {
        ratio = 0.75
      }
      renderer.setPixelRatio(Math.min(ratio, window.devicePixelRatio || 1))
    },
    [rendererRef],
  )

  const animateThemeChange = useCallback(
    (newTheme: ThemeType) => {
      const scene = sceneRef.current
      if (!scene) return

      const config = themeConfigs[newTheme]
      const newBgColor = new THREE.Color(config.backgroundColor)

      gsap.to(backgroundRef.current, {
        r: newBgColor.r,
        g: newBgColor.g,
        b: newBgColor.b,
        duration: 1,
        ease: 'power2.inOut',
        onUpdate: () => {
          scene.background = new THREE.Color(
            `rgb(${Math.round(backgroundRef.current.r * 255)}, ${Math.round(backgroundRef.current.g * 255)}, ${Math.round(backgroundRef.current.b * 255)})`,
          )
        },
      })
    },
    [sceneRef],
  )

  const updateParticles = useCallback(
    (time: number) => {
      if (!particlesRef.current || !particleDataRef.current || !currentHuesRef.current) return

      const deltaTime = Math.min((time - lastTimeRef.current) / 16.67, 3)
      lastTimeRef.current = time

      const sampleRate = 44100
      const bands: FrequencyBands = calculateFrequencyBands(frequencyData, sampleRate)
      const config = themeConfigs[currentTheme]

      const baseSpeed = mapRange(bands.low, 0, 1, 0.5, 3.0) * speedMultiplier * deltaTime
      const yAmplitude = mapRange(bands.mid, 0, 1, 0, 5)
      const sizeScale = mapRange(bands.high, 0, 1, config.sizeRange[0], config.sizeRange[1])

      const positions = particleDataRef.current.currentPosition
      const basePos = particleDataRef.current.basePosition
      const phases = particleDataRef.current.phaseOffset
      const colors = particleDataRef.current.colors
      const sizes = particleDataRef.current.sizes
      const currentHues = currentHuesRef.current
      const saturation = colorSaturation / 100

      const targetHue = getHueFromFrequency(bands, config.colorRange, colorSaturation)

      const count = Math.min(particleCount, positions.length / 3)

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const phase = phases[i]

        positions[i3 + 2] = basePos[i3 + 2] + Math.sin(time * 0.001 + phase) * baseSpeed

        const yOffset = Math.sin(time * 0.002 + phase * 2) * yAmplitude
        positions[i3 + 1] = basePos[i3 + 1] + yOffset

        const sizeVariation = 1 + Math.sin(time * 0.003 + phase * 3) * 0.2
        sizes[i] = sizeScale * sizeVariation

        const hueDiff = targetHue - currentHues[i]
        const normalizedDiff = ((hueDiff + 540) % 360) - 180
        currentHues[i] += normalizedDiff * 0.05 * deltaTime
        if (currentHues[i] < 0) currentHues[i] += 360
        if (currentHues[i] >= 360) currentHues[i] -= 360

        const lightness = 0.5 + bands.high * 0.2
        const color = hslToRgb(currentHues[i], saturation, lightness)
        colors[i3] = color[0]
        colors[i3 + 1] = color[1]
        colors[i3 + 2] = color[2]
      }

      const geometry = particlesRef.current.geometry
      geometry.attributes.position.needsUpdate = true
      geometry.attributes.color.needsUpdate = true
      geometry.attributes.size.needsUpdate = true

      const material = particlesRef.current.material as THREE.PointsMaterial
      material.opacity = 0.8 + glowIntensity * 0.2
    },
    [frequencyData, currentTheme, particleCount, speedMultiplier, colorSaturation, glowIntensity],
  )

  const animate = useCallback(
    (time: number) => {
      animationFrameRef.current = requestAnimationFrame(animate)

      fpsRef.current.count++
      if (time - fpsRef.current.lastTime >= 1000) {
        fpsRef.current.value = fpsRef.current.count
        fpsRef.current.count = 0
        fpsRef.current.lastTime = time
      }

      const scene = sceneRef.current
      const camera = cameraRef.current
      const renderer = rendererRef.current

      if (particlesRef.current && camera && renderer && scene) {
        updateParticles(time)
        renderer.render(scene, camera)
      }
    },
    [sceneRef, cameraRef, rendererRef, updateParticles],
  )

  const startAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    lastTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [animate])

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const getFps = useCallback(() => fpsRef.current.value, [])

  useEffect(() => {
    initializeParticles(particleCount)
    updateRendererPixelRatio(particleCount)
  }, [particleCount, initializeParticles, updateRendererPixelRatio])

  useEffect(() => {
    animateThemeChange(currentTheme)
  }, [currentTheme, animateThemeChange])

  useEffect(() => {
    return () => {
      stopAnimation()
    }
  }, [stopAnimation])

  return {
    particles: particlesRef.current,
    startAnimation,
    stopAnimation,
    getFps,
    initializeParticles,
  }
}
