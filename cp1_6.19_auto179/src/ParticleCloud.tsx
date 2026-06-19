import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleConfig } from './types';

interface ParticleCloudProps {
  config: ParticleConfig;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
}

function generateSpherePositions(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * Math.cbrt(Math.random());
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

function generateColors(
  count: number,
  primaryColor: string,
  secondaryColor: string
): Float32Array {
  const colors = new Float32Array(count * 3);
  const primary = hexToRgb(primaryColor);
  const secondary = hexToRgb(secondaryColor);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const mix = Math.random();
    colors[i3] = primary.r + (secondary.r - primary.r) * mix;
    colors[i3 + 1] = primary.g + (secondary.g - primary.g) * mix;
    colors[i3 + 2] = primary.b + (secondary.b - primary.b) * mix;
  }
  return colors;
}

function generateOpacities(count: number, baseOpacity: number): Float32Array {
  const opacities = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    opacities[i] = baseOpacity + Math.random() * (1.0 - baseOpacity);
  }
  return opacities;
}

type AnimationPhase = 'expand' | 'idle' | 'contract';

export default function ParticleCloud({ config }: ParticleCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { scene } = useThree();

  const particleCount = config.particleCount;
  const sphereRadius = config.sphereRadius;

  const basePositionsRef = useRef<Float32Array | null>(null);
  const startPositionsRef = useRef<Float32Array | null>(null);
  const baseOpacitiesRef = useRef<Float32Array | null>(null);

  const animationPhaseRef = useRef<AnimationPhase>('expand');
  const animationStartTimeRef = useRef<number>(performance.now());
  const prevConfigRef = useRef<ParticleConfig>(config);

  const initialized = useRef<boolean>(false);

  const { colors } = useMemo(() => {
    return {
      colors: generateColors(particleCount, config.primaryColor, config.secondaryColor),
    };
  }, [particleCount, config.primaryColor, config.secondaryColor]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      opacities[i] = config.baseOpacity + Math.random() * (1.0 - config.baseOpacity);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    return geo;
  }, [particleCount, colors, config.baseOpacity]);

  useEffect(() => {
    if (!initialized.current) {
      const basePositions = generateSpherePositions(particleCount, sphereRadius);
      basePositionsRef.current = basePositions;
      baseOpacitiesRef.current = generateOpacities(particleCount, config.baseOpacity);
      startPositionsRef.current = new Float32Array(particleCount * 3);

      animationPhaseRef.current = 'expand';
      animationStartTimeRef.current = performance.now();
      initialized.current = true;
    }
  }, [particleCount, sphereRadius, config.baseOpacity]);

  useEffect(() => {
    if (!initialized.current) return;
    
    if (prevConfigRef.current.primaryColor !== config.primaryColor) {
      if (pointsRef.current && basePositionsRef.current && startPositionsRef.current) {
        const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;
        if (startPositionsRef.current.length === posArray.length) {
          startPositionsRef.current.set(posArray);
        }
      }

      basePositionsRef.current = generateSpherePositions(particleCount, sphereRadius);
      baseOpacitiesRef.current = generateOpacities(particleCount, config.baseOpacity);

      animationPhaseRef.current = 'contract';
      animationStartTimeRef.current = performance.now();
    }
    prevConfigRef.current = config;
  }, [config.primaryColor, particleCount, sphereRadius, config.baseOpacity, config]);

  useEffect(() => {
    if (pointsRef.current) {
      const colorAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
      if (colorAttr.array.length === colors.length) {
        colorAttr.array.set(colors);
        colorAttr.needsUpdate = true;
      }
    }
  }, [colors]);

  useFrame((state, delta) => {
    if (!pointsRef.current || !basePositionsRef.current) return;

    const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positionsAttr.array as Float32Array;
    const opacityAttr = pointsRef.current.geometry.attributes.opacity as THREE.BufferAttribute;
    const opacityArray = opacityAttr.array as Float32Array;

    const now = performance.now();
    const elapsed = (now - animationStartTimeRef.current) / 1000;
    const currentPhase = animationPhaseRef.current;
    const basePos = basePositionsRef.current;
    const baseOpacities = baseOpacitiesRef.current;

    if (!baseOpacities) return;

    if (currentPhase === 'contract') {
      const duration = 0.5;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * progress * (3 - 2 * progress);

      const startPos = startPositionsRef.current;
      if (startPos) {
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          posArray[i3] = startPos[i3] * (1 - eased);
          posArray[i3 + 1] = startPos[i3 + 1] * (1 - eased);
          posArray[i3 + 2] = startPos[i3 + 2] * (1 - eased);
        }
      }

      positionsAttr.needsUpdate = true;

      if (progress >= 1) {
        animationPhaseRef.current = 'expand';
        animationStartTimeRef.current = performance.now();
      }
    } else if (currentPhase === 'expand') {
      const duration = 1.2;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        posArray[i3] = basePos[i3] * eased;
        posArray[i3 + 1] = basePos[i3 + 1] * eased;
        posArray[i3 + 2] = basePos[i3 + 2] * eased;
      }

      positionsAttr.needsUpdate = true;

      if (progress >= 1) {
        animationPhaseRef.current = 'idle';
        animationStartTimeRef.current = performance.now();
      }
    } else {
      const time = state.clock.elapsedTime;
      const speed = config.speed;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        const bx = basePos[i3];
        const by = basePos[i3 + 1];
        const bz = basePos[i3 + 2];

        let x = bx;
        let y = by;
        let z = bz;

        switch (config.motionMode) {
          case 'vortex': {
            const angle = time * speed;
            const radius = Math.sqrt(bx * bx + by * by);
            const currentAngle = Math.atan2(by, bx) + angle;
            x = radius * Math.cos(currentAngle);
            y = radius * Math.sin(currentAngle);
            z = bz + Math.sin(time * speed * 0.5 + i * 0.01) * 0.3;
            break;
          }
          case 'breathing': {
            const breathPhase = (time * Math.PI * 2) / config.cyclePeriod;
            const scale = 1 + Math.sin(breathPhase) * 0.15;
            x = bx * scale;
            y = by * scale;
            z = bz * scale;
            break;
          }
          case 'sinking': {
            const offset = (time * speed * 2) % (sphereRadius * 2);
            y = by - offset;
            if (y < -sphereRadius) {
              y += sphereRadius * 2;
            }
            break;
          }
          case 'mixed': {
            const vortexAngle = time * speed * 0.5;
            const radius = Math.sqrt(bx * bx + by * by);
            const currentAngle = Math.atan2(by, bx) + vortexAngle;
            const breathPhase = (time * Math.PI * 2) / config.cyclePeriod;
            const breathScale = 1 + Math.sin(breathPhase + i * 0.001) * 0.1;

            x = radius * Math.cos(currentAngle) * breathScale;
            y = radius * Math.sin(currentAngle) * breathScale;
            z = bz * breathScale + Math.sin(time * speed + i * 0.01) * 0.5;
            break;
          }
        }

        if (config.hasJitter) {
          x += (Math.random() - 0.5) * config.jitterAmount * delta * 10;
          y += (Math.random() - 0.5) * config.jitterAmount * delta * 10;
          z += (Math.random() - 0.5) * config.jitterAmount * delta * 10;
        }

        posArray[i3] = x;
        posArray[i3 + 1] = y;
        posArray[i3 + 2] = z;
      }

      positionsAttr.needsUpdate = true;

      if (config.hasTwinkle) {
        for (let i = 0; i < particleCount; i++) {
          const twinkle = Math.sin(time * 2 + i * 0.1) * 0.3 + 0.7;
          opacityArray[i] = baseOpacities[i] * twinkle;
        }
        opacityAttr.needsUpdate = true;

        if (config.motionMode === 'mixed') {
          const colorAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
          const colorArray = colorAttr.array as Float32Array;
          const primaryRgb = hexToRgb(config.primaryColor);
          const secondaryRgb = hexToRgb(config.secondaryColor);
          for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const twinkleIntensity = Math.sin(time * 3 + i * 0.15) * 0.5 + 0.5;
            colorArray[i3] = primaryRgb.r + (secondaryRgb.r - primaryRgb.r) * twinkleIntensity;
            colorArray[i3 + 1] = primaryRgb.g + (secondaryRgb.g - primaryRgb.g) * twinkleIntensity;
            colorArray[i3 + 2] = primaryRgb.b + (secondaryRgb.b - primaryRgb.b) * twinkleIntensity;
          }
          colorAttr.needsUpdate = true;
        }
      }

      if (config.motionMode === 'sinking') {
        for (let i = 0; i < particleCount; i++) {
          const y = posArray[i * 3 + 1];
          const depthFactor = (y + sphereRadius) / (sphereRadius * 2);
          const dimFactor = 0.4 + depthFactor * 0.6;
          opacityArray[i] = baseOpacities[i] * dimFactor;
        }
        opacityAttr.needsUpdate = true;
      }
    }
  });

  useEffect(() => {
    const light = new THREE.PointLight(config.primaryColor, 0.5, 50);
    light.position.set(0, 0, 0);
    scene.add(light);
    return () => {
      scene.remove(light);
    };
  }, [config.primaryColor, scene]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={1.0}
        vertexColors
        sizeAttenuation
      />
    </points>
  );
}
