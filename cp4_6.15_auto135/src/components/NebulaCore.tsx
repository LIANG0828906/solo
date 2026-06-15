import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useNebulaStore, colorPalettes } from '../store/useNebulaStore';

interface ParticleData {
  baseRadius: number;
  basePhi: number;
  baseTheta: number;
  spiralSpeed: number;
  spiralOffset: number;
  verticalSpeed: number;
  verticalOffset: number;
  sizeMultiplier: number;
  colorIndex: number;
}

const MAX_PARTICLES = 3000;
const LOD_THRESHOLD_FAR = 3.0;
const LOD_SKIP_RATE_FAR = 2;

export function NebulaCore() {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const frameCountRef = useRef(0);

  const particleCount = useNebulaStore((state) => state.particleCount);
  const colorPalette = useNebulaStore((state) => state.colorPalette);
  const rotationSpeed = useNebulaStore((state) => state.rotationSpeed);
  const spreadRadius = useNebulaStore((state) => state.spreadRadius);
  const particleSize = useNebulaStore((state) => state.particleSize);
  const trailLength = useNebulaStore((state) => state.trailLength);
  const isPlaying = useNebulaStore((state) => state.isPlaying);

  const seedRef = useRef(Math.random());
  const seed = seedRef.current;

  const particleData = useMemo<ParticleData[]>(() => {
    const data: ParticleData[] = [];
    let s = seed;
    function seededRandom() {
      s = (s * 16807 + 0.5) % 2147483647;
      return s / 2147483647;
    }
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const u = seededRandom();
      const v = seededRandom();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const radius = Math.pow(seededRandom(), 0.5) * spreadRadius;

      data.push({
        baseRadius: radius,
        basePhi: phi,
        baseTheta: theta,
        spiralSpeed: 0.3 + seededRandom() * 0.7,
        spiralOffset: seededRandom() * Math.PI * 2,
        verticalSpeed: 0.2 + seededRandom() * 0.5,
        verticalOffset: seededRandom() * Math.PI * 2,
        sizeMultiplier: 0.5 + seededRandom() * 1.5,
        colorIndex: seededRandom()
      });
    }
    return data;
  }, [spreadRadius, seed]);

  const positions = useMemo(() => new Float32Array(MAX_PARTICLES * 3), []);
  const colors = useMemo(() => new Float32Array(MAX_PARTICLES * 3), []);
  const sizes = useMemo(() => new Float32Array(MAX_PARTICLES), []);

  const paletteColors = useMemo(() => {
    const palette = colorPalettes[colorPalette];
    return palette.colors.map((c) => new THREE.Color(c));
  }, [colorPalette]);

  useEffect(() => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
    const sizeAttr = geometry.attributes.size as THREE.BufferAttribute;

    const count = Math.min(particleCount, MAX_PARTICLES);

    for (let i = 0; i < count; i++) {
      const data = particleData[i];
      const r = data.baseRadius;
      const phi = data.basePhi;
      const theta = data.baseTheta;

      positionAttr.setXYZ(i,
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      const normalizedRadius = data.baseRadius / spreadRadius;
      const colorIdx = Math.min(
        Math.floor(normalizedRadius * paletteColors.length),
        paletteColors.length - 1
      );
      const colorNext = Math.min(colorIdx + 1, paletteColors.length - 1);
      const colorT = (normalizedRadius * paletteColors.length) % 1;

      const color = new THREE.Color().lerpColors(
        paletteColors[colorIdx],
        paletteColors[colorNext],
        colorT
      );
      colorAttr.setXYZ(i, color.r, color.g, color.b);
      sizeAttr.setX(i, particleSize * data.sizeMultiplier);
    }

    for (let i = count; i < MAX_PARTICLES; i++) {
      positionAttr.setXYZ(i, 0, 0, 0);
      sizeAttr.setX(i, 0);
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    geometry.setDrawRange(0, count);
  }, [particleData, particleCount, paletteColors, particleSize, spreadRadius]);

  useEffect(() => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry;
    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;

    const count = Math.min(particleCount, MAX_PARTICLES);
    for (let i = 0; i < count; i++) {
      const data = particleData[i];
      const normalizedRadius = data.baseRadius / spreadRadius;
      const colorIdx = Math.min(
        Math.floor(normalizedRadius * paletteColors.length),
        paletteColors.length - 1
      );
      const colorNext = Math.min(colorIdx + 1, paletteColors.length - 1);
      const colorT = (normalizedRadius * paletteColors.length) % 1;

      const color = new THREE.Color().lerpColors(
        paletteColors[colorIdx],
        paletteColors[colorNext],
        colorT
      );
      colorAttr.setXYZ(i, color.r, color.g, color.b);
    }
    colorAttr.needsUpdate = true;
  }, [colorPalette, paletteColors, particleData, particleCount, spreadRadius]);

  useFrame((state, delta) => {
    if (!pointsRef.current || !isPlaying) return;

    frameCountRef.current++;
    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
    const time = state.clock.elapsedTime;
    const count = Math.min(particleCount, MAX_PARTICLES);

    const camDist = camera.position.length();
    const skipRate = camDist > LOD_THRESHOLD_FAR ? LOD_SKIP_RATE_FAR : 1;
    const isSkipFrame = frameCountRef.current % skipRate !== 0;

    for (let i = 0; i < count; i++) {
      if (isSkipFrame && i % skipRate !== 0) continue;

      const data = particleData[i];
      const spiralAngle = time * data.spiralSpeed * 0.5 + data.spiralOffset;
      const verticalWave = Math.sin(time * data.verticalSpeed + data.verticalOffset) * 0.15;

      const r = data.baseRadius * (1 + verticalWave * 0.3);
      const theta = data.baseTheta + spiralAngle * 0.3;
      const phi = data.basePhi + Math.sin(spiralAngle * 0.5) * 0.1;

      positionAttr.setXYZ(i,
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) + verticalWave * r,
        r * Math.sin(phi) * Math.sin(theta)
      );
    }

    positionAttr.needsUpdate = true;

    if (groupRef.current) {
      groupRef.current.rotation.y += (rotationSpeed * Math.PI / 180) * delta;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <group ref={groupRef}>
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={MAX_PARTICLES}
              array={positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={MAX_PARTICLES}
              array={colors}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={MAX_PARTICLES}
              array={sizes}
              itemSize={1}
            />
          </bufferGeometry>
          <shaderMaterial
            vertexShader={`
              attribute float size;
              varying vec3 vColor;
              varying float vAlpha;
              void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float dist = -mvPosition.z;
                gl_PointSize = size * 300.0 / max(dist, 0.1);
                vAlpha = smoothstep(8.0, 2.0, dist);
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              varying vec3 vColor;
              varying float vAlpha;
              void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                alpha = pow(alpha, 1.5);
                vec3 glow = vColor * (1.0 + (1.0 - dist) * 2.0);
                gl_FragColor = vec4(glow, alpha * 0.8 * vAlpha);
              }
            `}
            vertexColors
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        <NebulaGlow
          particleCount={particleCount}
          particleData={particleData}
          spreadRadius={spreadRadius}
          paletteColors={paletteColors}
          trailLength={trailLength}
          particleSize={particleSize}
        />
      </group>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={5}
        enablePan={false}
      />
    </>
  );
}

interface NebulaGlowProps {
  particleCount: number;
  particleData: ParticleData[];
  spreadRadius: number;
  paletteColors: THREE.Color[];
  trailLength: number;
  particleSize: number;
}

function NebulaGlow({ particleCount, particleData, spreadRadius, paletteColors, trailLength, particleSize }: NebulaGlowProps) {
  const glowPointsRef = useRef<THREE.Points>(null);
  const isPlaying = useNebulaStore((state) => state.isPlaying);

  const glowCount = Math.min(Math.floor(particleCount * 0.3), 900);

  const glowPositions = useMemo(() => new Float32Array(glowCount * 3), [glowCount]);
  const glowColors = useMemo(() => new Float32Array(glowCount * 3), [glowCount]);

  const glowSizeValue = useMemo(() => (particleSize * 600).toFixed(1), [particleSize]);

  useEffect(() => {
    if (!glowPointsRef.current) return;
    const geometry = glowPointsRef.current.geometry;
    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < glowCount; i++) {
      const dataIndex = Math.min(i * 3, particleData.length - 1);
      const data = particleData[dataIndex];
      const normalizedRadius = data.baseRadius / spreadRadius;
      const colorIdx = Math.min(
        Math.floor(normalizedRadius * paletteColors.length),
        paletteColors.length - 1
      );
      const color = paletteColors[colorIdx];
      colorAttr.setXYZ(i, color.r * 0.5, color.g * 0.5, color.b * 0.5);
    }

    colorAttr.needsUpdate = true;
    geometry.setDrawRange(0, glowCount);
  }, [glowCount, particleData, paletteColors, spreadRadius]);

  useFrame((state) => {
    if (!glowPointsRef.current || !isPlaying) return;

    const geometry = glowPointsRef.current.geometry;
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
    const time = state.clock.elapsedTime;
    const trailFactor = trailLength * 2;

    for (let i = 0; i < glowCount; i++) {
      const dataIndex = Math.min(i * 3, particleData.length - 1);
      const data = particleData[dataIndex];

      const spiralAngle = time * data.spiralSpeed * 0.3 + data.spiralOffset;
      const verticalWave = Math.sin(time * data.verticalSpeed + data.verticalOffset) * 0.2;

      const r = data.baseRadius * 1.1;
      const theta = data.baseTheta + spiralAngle * 0.2;
      const phi = data.basePhi + Math.sin(spiralAngle * 0.3) * 0.15;

      const trailOffset = trailFactor * 0.1;
      positionAttr.setXYZ(i,
        r * Math.sin(phi) * Math.cos(theta - trailOffset),
        r * Math.cos(phi) + verticalWave * r,
        r * Math.sin(phi) * Math.sin(theta - trailOffset)
      );
    }

    positionAttr.needsUpdate = true;
  });

  const glowVertShader = useMemo(() => `
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = ${glowSizeValue} / -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `, [glowSizeValue]);

  return (
    <points ref={glowPointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={glowCount}
          array={glowPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={glowCount}
          array={glowColors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={glowVertShader}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            alpha = pow(alpha, 0.8) * 0.4;
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
