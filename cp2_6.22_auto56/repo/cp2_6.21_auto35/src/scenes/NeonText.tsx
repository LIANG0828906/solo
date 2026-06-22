import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { useEditorStore } from '@/store/useEditorStore'

const FONT_URL = 'https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json'

function hexToRgb(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

interface GradientMaterialProps {
  color: string
  glowIntensity: number
  thickness: number
}

function useGradientMaterial({ color, glowIntensity, thickness }: GradientMaterialProps) {
  return useMemo(() => {
    const baseColor = hexToRgb(color)
    const whiteColor = new THREE.Color('#ffffff')

    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: glowIntensity,
      metalness: 0.3,
      roughness: 0.2,
      side: THREE.DoubleSide,
    })

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uBaseColor = { value: baseColor }
      shader.uniforms.uWhiteColor = { value: whiteColor }
      shader.uniforms.uGlow = { value: glowIntensity }

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           varying vec3 vLocalPos;
           varying float vYNorm;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vLocalPos = position;
           vYNorm = 0.0;`,
        )

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform vec3 uBaseColor;
           uniform vec3 uWhiteColor;
           uniform float uGlow;
           varying vec3 vLocalPos;
           varying float vYNorm;`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
           float yNorm = clamp((vLocalPos.y + 0.8) / 1.6, 0.0, 1.0);
           vec3 gradientEmissive = mix(uBaseColor, uWhiteColor, smoothstep(0.3, 0.9, yNorm));
           totalEmissiveRadiance = gradientEmissive * uGlow;`,
        )
    }

    return material
  }, [color, glowIntensity, thickness])
}

interface CharMeshProps {
  char: string
  font: Font
  thickness: number
  size: number
  color: string
  glowIntensity: number
  rotationY: number
  xOffset: number
  charIndex: number
}

function CharMesh({
  char,
  font,
  thickness,
  size,
  color,
  glowIntensity,
  rotationY,
  xOffset,
  charIndex,
}: CharMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const material = useGradientMaterial({ color, glowIntensity, thickness })

  const geometry = useMemo(() => {
    if (char === ' ') return null

    const geo = new TextGeometry(char, {
      font,
      size,
      height: thickness,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: thickness * 0.6,
      bevelSize: thickness * 0.35,
      bevelOffset: 0,
      bevelSegments: 8,
    })
    geo.computeBoundingBox()
    geo.center()
    geo.translate(0, 0, 0)

    const positions = geo.attributes.position
    const colors: number[] = []
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }

    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      const t = maxY !== minY ? (y - minY) / (maxY - minY) : 0.5
      const baseColor = hexToRgb(color)
      const whiteColor = new THREE.Color('#ffffff')
      const mixed = baseColor.clone().lerp(whiteColor, Math.pow(Math.max(0, (t - 0.3) / 0.7), 1.2))
      colors.push(mixed.r, mixed.g, mixed.b)
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [char, font, thickness, size, color])

  useEffect(() => {
    return () => {
      geometry?.dispose()
    }
  }, [geometry])

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.needsUpdate = true
    }
  })

  if (!geometry || char === ' ') return null

  return (
    <mesh
      ref={meshRef}
      position={[xOffset, 1, 0]}
      rotation={[0, rotationY, 0]}
      geometry={geometry}
      material={material}
      castShadow
    />
  )
}

interface NeonTextProps {
  externalGlowOverride?: number | null
}

export function NeonText({ externalGlowOverride }: NeonTextProps) {
  const text = useEditorStore((s) => s.text)
  const color = useEditorStore((s) => s.color)
  const thickness = useEditorStore((s) => s.thickness)
  const twist = useEditorStore((s) => s.twist)
  const baseGlow = useEditorStore((s) => s.glowIntensity)
  const shutterFlash = useEditorStore((s) => s.shutterFlash)

  const font = useLoader(FontLoader, FONT_URL)

  const effectiveGlow = shutterFlash !== null && shutterFlash !== undefined
    ? shutterFlash
    : (externalGlowOverride !== null && externalGlowOverride !== undefined
      ? externalGlowOverride
      : baseGlow)

  const size = 0.8

  const charData = useMemo(() => {
    if (!font) return []
    const chars = text.split('')
    const spacing = size * 0.75
    const totalWidth = (chars.length - 1) * spacing
    const startX = -totalWidth / 2
    const tiltRad = THREE.MathUtils.degToRad(15)

    return chars.map((char, i) => {
      const x = startX + i * spacing
      const twistBase = THREE.MathUtils.degToRad(twist)
      const charCount = chars.length || 1
      const twistAmount = charCount > 1
        ? (i / (charCount - 1) - 0.5) * 2 * twistBase
        : 0
      const rotationY = tiltRad + twistAmount
      return { char, x, rotationY, index: i }
    })
  }, [text, font, twist, size])

  if (!font) return null

  return (
    <group>
      {charData.map(({ char, x, rotationY, index }) => (
        <CharMesh
          key={`${char}-${index}-${text}`}
          char={char}
          font={font}
          thickness={thickness}
          size={size}
          color={color}
          glowIntensity={effectiveGlow}
          rotationY={rotationY}
          xOffset={x}
          charIndex={index}
        />
      ))}
    </group>
  )
}
