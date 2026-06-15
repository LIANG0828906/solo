import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useNebulaStore, colorPalettes, ColorPalette } from '../store/useNebulaStore';

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

export function NebulaCore() {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const particleCount = useNebulaStore((state) => state.particleCount);
  const colorPalette = useNebulaStore((state) => state.colorPalette);
  const rotationSpeed = useNebulaStore((state) => state.rotationSpeed);
  const spreadRadius = useNebulaStore((state) => state.spreadRadius);
  const particleSize = useNebulaStore((state) => state.particleSize);
  const trailLength = useNebulaStore((state) => state.trailLength);
  const isPlaying = useNebulaStore((state) => state.isPlaying);

  const particleData = useMemo<ParticleData[]>(() => {
    const data: ParticleData[] = [];
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const radius = Math.pow(Math.random(), 0.5) * spreadRadius;

      data.push({
        baseRadius: radius,
        basePhi: phi,
        baseTheta: theta,
        spiralSpeed: 0.3 + Math.random() * 0.7,
        spiralOffset: Math.random() * Math.PI * 2,
        verticalSpeed: 0.2 + Math.random() * 0.5,
        verticalOffset: Math.random() * Math.PI * 2,
        sizeMultiplier: 0.5 + Math.random() * 1.5,
        colorIndex: Math.random()
      });
    }
    return data;
  }, [particleCount, spreadRadius]);

  const positions = useMemo(() => {
    return new Float32Array(particleCount * 3);
  }, [particleCount]);

  const colors = useMemo(() => {
    return new Float32Array(particleCount * 3);
  }, [particleCount]);

  const sizes = useMemo(() => {
    return new Float32Array(particleCount);
  }, [particleCount]);

  const paletteColors = useMemo(() => {
    const palette = colorPalettes[colorPalette];
    return palette.colors.map((c) => new THREE.Color(c));
  }, [colorPalette]);

  useEffect(() => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.attributes.position;
    const colorAttr = geometry.attributes.color;
    const sizeAttr = geometry.attributes.size;

    for (let i = 0; i < particleCount; i++) {
      const data = particleData[i];
      const r = data.baseRadius;
      const phi = data.basePhi;
      const theta = data.baseTheta;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positionAttr.setXYZ(i, x, y, z);

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

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }, [particleData, particleCount, paletteColors, particleSize, spreadRadius]);

  useFrame((state, delta) => {
    if (!pointsRef.current || !isPlaying) return;

    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.attributes.position;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < particleCount; i++) {
      const data = particleData[i];

      const spiralAngle = time * data.spiralSpeed * 0.5 + data.spiralOffset;
      const verticalWave = Math.sin(time * data.verticalSpeed + data.verticalOffset) * 0.15;

      const r = data.baseRadius * (1 + verticalWave * 0.3);
      const theta = data.baseTheta + spiralAngle * 0.3;
      const phi = data.basePhi + Math.sin(spiralAngle * 0.5) * 0.1;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) + verticalWave * r;
      const z = r * Math.sin(phi) * Math.sin(theta);

      positionAttr.setXYZ(i, x, y, z);
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
              count={particleCount}
              array={positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={particleCount}
              array={colors}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={particleCount}
              array={sizes}
              itemSize={1}
            />
          </bufferGeometry>
          <shaderMaterial
            vertexShader={`
              attribute float size;
              varying vec3 vColor;
              void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * 300.0 / -mvPosition.z;
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              varying vec3 vColor;
              void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                alpha = pow(alpha, 1.5);
                vec3 glow = vColor * (1.0 + (1.0 - dist) * 2.0);
                gl_FragColor = vec4(glow, alpha * 0.8);
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
}

function NebulaGlow({ particleCount, particleData, spreadRadius, paletteColors }: NebulaGlowProps) {
  const glowPointsRef = useRef<THREE.Points>(null);
  const isPlaying = useNebulaStore((state) => state.isPlaying);
  const trailLength = useNebulaStore((state) => state.trailLength);
  const particleSize = useNebulaStore((state) => state.particleSize);

  const glowCount = Math.floor(particleCount * 0.3);

  const glowPositions = useMemo(() => {
    return new Float32Array(glowCount * 3);
  }, [glowCount]);

  const glowColors = useMemo(() => {
    return new Float32Array(glowCount * 3);
  }, [glowCount]);

  useFrame((state, delta) => {
    if (!glowPointsRef.current || !isPlaying) return;

    const geometry = glowPointsRef.current.geometry;
    const positionAttr = geometry.attributes.position;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < glowCount; i++) {
      const data = particleData[i * 3];
      const trailFactor = trailLength * 2;

      const spiralAngle = time * data.spiralSpeed * 0.3 + data.spiralOffset;
      const verticalWave = Math.sin(time * data.verticalSpeed + data.verticalOffset) * 0.2;

      const r = data.baseRadius * 1.1;
      const theta = data.baseTheta + spiralAngle * 0.2;
      const phi = data.basePhi + Math.sin(spiralAngle * 0.3) * 0.15;

      const trailOffset = trailFactor * 0.1;
      const x = r * Math.sin(phi) * Math.cos(theta - trailOffset);
      const y = r * Math.cos(phi) + verticalWave * r;
      const z = r * Math.sin(phi) * Math.sin(theta - trailOffset);

      positionAttr.setXYZ(i, x, y, z);
    }

    positionAttr.needsUpdate = true;
  });

  useEffect(() => {
    if (!glowPointsRef.current) return;
    const geometry = glowPointsRef.current.geometry;
    const colorAttr = geometry.attributes.color;

    for (let i = 0; i < glowCount; i++) {
      const data = particleData[i * 3];
      const normalizedRadius = data.baseRadius / spreadRadius;
      const colorIdx = Math.min(
        Math.floor(normalizedRadius * paletteColors.length),
        paletteColors.length - 1
      );
      const color = paletteColors[colorIdx];
      colorAttr.setXYZ(i, color.r * 0.5, color.g * 0.5, color.b * 0.5);
    }

    colorAttr.needsUpdate = true;
  }, [glowCount, particleData, paletteColors, spreadRadius]);

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
        vertexShader={`
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = ${(particleSize * 600).toFixed(1)} / -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
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
