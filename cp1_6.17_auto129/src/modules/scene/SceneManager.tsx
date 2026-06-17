import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  useBioStore,
  SPECIES_CONFIGS,
  getActivityStateName,
} from '../bio/BioManager';
import { useSceneViewStore, useInteraction, defaultOrbitControlsProps } from '../interaction/InteractionController';
import type { SpeciesConfig, Organism } from '../../utils/types';

export const SCENE_WIDTH = 600;
export const SCENE_DEPTH = 400;
export const VENT_POSITION: [number, number, number] = [0, 0, 0];

function SeafloorTerrain() {
  const isSectionView = useSceneViewStore((s) => s.isSectionView);
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_DEPTH, 80, 60);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);
      let height = 0;
      height += Math.sin(x * 0.02) * Math.cos(z * 0.02) * 6;
      height += Math.sin(x * 0.05 + 1) * Math.sin(z * 0.04) * 3;
      height += (Math.random() - 0.5) * 1.5;
      if (distFromCenter < 40) {
        const craterFactor = Math.max(0, 1 - distFromCenter / 40);
        height -= craterFactor * craterFactor * 15;
      }
      if (distFromCenter > 180) {
        const slopeFactor = Math.min(1, (distFromCenter - 180) / 100);
        height -= slopeFactor * slopeFactor * 20;
      }
      positions.setY(i, height);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  if (isSectionView) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#1a2f3d"
        roughness={0.95}
        metalness={0.05}
        flatShading
      />
    </mesh>
  );
}

function HydrothermalVent() {
  const groupRef = useRef<THREE.Group>(null);
  const isSectionView = useSceneViewStore((s) => s.isSectionView);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.01);
    }
  });

  return (
    <group ref={groupRef} position={VENT_POSITION}>
      <mesh position={[0, 10, 0]}>
        <coneGeometry args={[8, 20, 16, 1, false]} />
        <shaderMaterial
          vertexShader={`
            varying vec3 vPosition;
            void main() {
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vPosition;
            void main() {
              float t = clamp((vPosition.y + 10.0) / 20.0, 0.0, 1.0);
              vec3 color1 = vec3(0.173, 0.243, 0.314);
              vec3 color2 = vec3(0.906, 0.298, 0.235);
              vec3 color = mix(color1, color2, t);
              gl_FragColor = vec4(color, 1.0);
            }
          `}
        />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[12, 14, 1, 16]} />
        <meshStandardMaterial color="#2C3E50" roughness={0.8} />
      </mesh>
      {!isSectionView && (
        <pointLight
          position={[0, 22, 0]}
          color="#E67E22"
          intensity={0.8}
          distance={120}
          decay={2}
        />
      )}
    </group>
  );
}

interface SmokeParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

function SmokeParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particlesData = useRef<SmokeParticle[]>([]);
  const MAX_PARTICLES = 600;
  const PARTICLES_PER_SECOND = 200;
  const PARTICLE_LIFETIME = 3;
  let spawnAccumulator = 0;

  const [positions, sizes, opacities] = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const siz = new Float32Array(MAX_PARTICLES);
    const opa = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      pos[i * 3 + 1] = -1000;
      opa[i] = 0;
    }
    return [pos, siz, opa];
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    return geo;
  }, [positions, sizes, opacities]);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;
    const opacityAttr = geometry.getAttribute('opacity') as THREE.BufferAttribute;

    spawnAccumulator += delta * PARTICLES_PER_SECOND;
    while (spawnAccumulator >= 1 && particlesData.current.length < MAX_PARTICLES) {
      spawnAccumulator -= 1;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.5;
      particlesData.current.push({
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          21 + Math.random() * 2,
          Math.sin(angle) * radius,
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          10 + Math.random() * 8,
          (Math.random() - 0.5) * 1.5,
        ),
        life: PARTICLE_LIFETIME,
        maxLife: PARTICLE_LIFETIME,
        size: 1.5 + Math.random() * 2.5,
      });
    }

    for (let i = particlesData.current.length - 1; i >= 0; i--) {
      const p = particlesData.current[i];
      p.life -= delta;
      if (p.life <= 0) {
        particlesData.current.splice(i, 1);
        continue;
      }
      p.position.x += p.velocity.x * delta + Math.sin(Date.now() * 0.001 + i) * 0.3 * delta;
      p.position.y += p.velocity.y * delta * (0.5 + p.life / p.maxLife);
      p.position.z += p.velocity.z * delta + Math.cos(Date.now() * 0.001 + i) * 0.3 * delta;
      p.velocity.y -= delta * 0.5;
      p.velocity.x *= 0.99;
      p.velocity.z *= 0.99;
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < particlesData.current.length) {
        const p = particlesData.current[i];
        const lifeRatio = p.life / p.maxLife;
        posAttr.array[i * 3] = p.position.x;
        posAttr.array[i * 3 + 1] = p.position.y;
        posAttr.array[i * 3 + 2] = p.position.z;
        sizeAttr.array[i] = p.size * (1 + (1 - lifeRatio) * 3);
        opacityAttr.array[i] = lifeRatio * 0.3;
      } else {
        posAttr.array[i * 3 + 1] = -1000;
        opacityAttr.array[i] = 0;
      }
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexColors={false}
        uniforms={{
          uSize: { value: 3.0 },
          uColor: { value: new THREE.Color('#0a0a0a') },
        }}
        vertexShader={`
          attribute float size;
          attribute float opacity;
          varying float vOpacity;
          uniform float uSize;
          void main() {
            vOpacity = opacity;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          uniform vec3 uColor;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = vOpacity * (1.0 - smoothstep(0.3, 0.5, dist));
            gl_FragColor = vec4(uColor, alpha);
          }
        `}
      />
    </points>
  );
}

function SectionGrid() {
  const isSectionView = useSceneViewStore((s) => s.isSectionView);
  if (!isSectionView) return null;

  const gridSize = 200;
  const gridDivisions = 40;

  return (
    <group position={[0, 30, 0]}>
      <mesh>
        <planeGeometry args={[gridSize, gridSize, gridDivisions, gridDivisions]} />
        <shaderMaterial
          transparent
          side={THREE.DoubleSide}
          vertexShader={`
            varying vec2 vUv;
            varying float vDist;
            void main() {
              vUv = uv;
              vDist = length(position.xy);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            varying float vDist;
            void main() {
              float grid = 0.0;
              float lineWidth = 0.01;
              vec2 g = abs(fract(vUv * 40.0) - 0.5);
              grid = max(step(0.5 - lineWidth, g.x), step(0.5 - lineWidth, g.y));
              float t = clamp(vDist / 100.0, 0.0, 1.0);
              vec3 colorHot = vec3(0.906, 0.298, 0.235);
              vec3 colorWarm = vec3(0.953, 0.690, 0.243);
              vec3 colorCool = vec3(0.204, 0.596, 0.859);
              vec3 color;
              if (t < 0.5) {
                color = mix(colorHot, colorWarm, t * 2.0);
              } else {
                color = mix(colorWarm, colorCool, (t - 0.5) * 2.0);
              }
              float alpha = grid * 0.6 * (1.0 - t * 0.5);
              gl_FragColor = vec4(color, alpha);
            }
          `}
        />
      </mesh>
    </group>
  );
}

interface OrganismMeshProps {
  organism: Organism;
  speciesConfig: SpeciesConfig;
  onClick: () => void;
}

function OrganismMesh({ organism, speciesConfig, onClick }: OrganismMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const geometry = useMemo(() => {
    if (speciesConfig.geometryType === 'box') {
      const geo = new THREE.BoxGeometry(
        organism.scale * 0.8,
        organism.scale * 1.5,
        organism.scale * 0.8,
      );
      const positions = geo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.2);
        positions.setY(i, positions.getY(i) + (Math.random() - 0.5) * 0.2);
        positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.2);
      }
      geo.computeVertexNormals();
      return geo;
    }
    const geo = new THREE.SphereGeometry(organism.scale * 0.8, 12, 10);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const v = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i),
      );
      const len = v.length();
      v.normalize().multiplyScalar(len * (1 + (Math.random() - 0.5) * 0.25));
      positions.setX(i, v.x);
      positions.setY(i, v.y);
      positions.setZ(i, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, [organism.scale, speciesConfig.geometryType]);

  return (
    <group position={organism.position} rotation={organism.rotation}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <meshStandardMaterial
          color={speciesConfig.color}
          emissive={speciesConfig.color}
          emissiveIntensity={hovered ? 0.4 : 0.15}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      <pointLight
        color={speciesConfig.color}
        intensity={0.2}
        distance={15 + organism.scale * 2}
        decay={2}
      />
    </group>
  );
}

function InfoBubbles() {
  const infoBubbles = useBioStore((s) => s.infoBubbles);
  const organisms = useBioStore((s) => s.organisms);

  return (
    <>
      {infoBubbles.map((bubble) => {
        const organism = organisms.find((o) => o.id === bubble.organismId);
        const scale = organism?.scale || 3;
        return (
          <Html
            key={bubble.id}
            position={[
              bubble.position[0],
              bubble.position[1] + scale,
              bubble.position[2],
            ]}
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                opacity: bubble.opacity,
                transition: 'opacity 0.2s',
                background: 'rgba(0, 20, 40, 0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#E0E0E0',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '14px' }}>
                {bubble.content.name}
              </div>
              <div style={{ opacity: 0.8 }}>种群数量：{bubble.content.count}</div>
              <div style={{ opacity: 0.8 }}>
                当前状态：{getActivityStateName(bubble.content.activityState)}
              </div>
            </div>
          </Html>
        );
      })}
    </>
  );
}

function Organisms() {
  const organisms = useBioStore((s) => s.organisms);
  const addInfoBubble = useBioStore((s) => s.addInfoBubble);
  const initOrganisms = useBioStore((s) => s.initOrganisms);
  const updateOrganisms = useBioStore((s) => s.updateOrganisms);
  const updateInfoBubbles = useBioStore((s) => s.updateInfoBubbles);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      initOrganisms(VENT_POSITION);
      isInitialized.current = true;
    }
  }, [initOrganisms]);

  useFrame((_, delta) => {
    updateOrganisms(delta, { width: SCENE_WIDTH, depth: SCENE_DEPTH });
    updateInfoBubbles();
  });

  return (
    <>
      {organisms.map((organism) => {
        const config = SPECIES_CONFIGS.find((c) => c.id === organism.speciesId);
        if (!config) return null;
        return (
          <OrganismMesh
            key={organism.id}
            organism={organism}
            speciesConfig={config}
            onClick={() => addInfoBubble(organism.id)}
          />
        );
      })}
      <InfoBubbles />
    </>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight color="#4A6B8A" intensity={0.4} />
    </>
  );
}

function SceneFog() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x0d1b2a, 0.003);
    scene.background = new THREE.Color(0x0a1128);
  }, [scene]);
  return null;
}

export function SceneManager() {
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  useInteraction(orbitControlsRef);

  const updateEnvironmentData = useBioStore((s) => s.updateEnvironmentData);
  const envInitialized = useRef(false);

  useEffect(() => {
    if (!envInitialized.current) {
      updateEnvironmentData();
      envInitialized.current = true;
    }
    const interval = setInterval(updateEnvironmentData, 1000);
    return () => clearInterval(interval);
  }, [updateEnvironmentData]);

  return (
    <>
      <SceneFog />
      <SceneLighting />
      <OrbitControls
        ref={orbitControlsRef}
        target={[0, 10, 0]}
        {...defaultOrbitControlsProps}
      />
      <SeafloorTerrain />
      <HydrothermalVent />
      <SmokeParticles />
      <SectionGrid />
      <Organisms />
    </>
  );
}

export function useScene() {
  return {
    sceneWidth: SCENE_WIDTH,
    sceneDepth: SCENE_DEPTH,
    ventPosition: VENT_POSITION,
  };
}
