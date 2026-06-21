import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBody, CelestialBodyData } from './CelestialBody';
import { PhysicsEngine } from './PhysicsEngine';

interface StarSystemProps {
  bodies: CelestialBodyData[];
  selectedBodyId: string | null;
  onSelectBody: (id: string | null) => void;
}

function velocityToColor(speed: number, maxSpeed: number = 5): THREE.Color {
  const t = Math.min(speed / maxSpeed, 1);
  const color = new THREE.Color();
  color.setHSL(0.65 - t * 0.65, 1, 0.5 + t * 0.2);
  return color;
}

export function StarSystem({ bodies, selectedBodyId, onSelectBody }: StarSystemProps) {
  const physicsEngineRef = useRef<PhysicsEngine>(new PhysicsEngine());
  const celestialBodiesRef = useRef<CelestialBody[]>([]);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const trailsRef = useRef<Map<string, THREE.Line>>(new Map());
  const glowMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const highlightRingRef = useRef<THREE.Mesh | null>(null);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const newBodies: CelestialBody[] = [];
    const existingIds = new Set(celestialBodiesRef.current.map(b => b.id));
    const newIds = new Set(bodies.map(b => b.id));

    bodies.forEach(bodyData => {
      if (bodyData.id && existingIds.has(bodyData.id)) {
        const existing = celestialBodiesRef.current.find(b => b.id === bodyData.id);
        if (existing) {
          existing.mass = bodyData.mass;
          existing.color = bodyData.color;
          existing.name = bodyData.name || existing.name;
          newBodies.push(existing);
        }
      } else {
        const newBody = new CelestialBody(bodyData);
        newBody.scale = 0;
        newBody.targetScale = 1;
        newBodies.push(newBody);
      }
    });

    celestialBodiesRef.current = newBodies;
    physicsEngineRef.current.setBodies(newBodies);
    forceUpdate({});
  }, [bodies]);

  useFrame((state, delta) => {
    const clampedDelta = Math.min(delta, 0.05);
    const physicsSteps = 2;
    const stepDelta = clampedDelta / physicsSteps;

    for (let i = 0; i < physicsSteps; i++) {
      physicsEngineRef.current.update(stepDelta);
    }

    celestialBodiesRef.current.forEach(body => {
      body.addTrailPoint();

      if (body.scale < body.targetScale) {
        body.scale = Math.min(body.scale + delta * 3, body.targetScale);
      }

      const mesh = meshesRef.current.get(body.id);
      if (mesh) {
        mesh.position.copy(body.position);
        mesh.scale.setScalar(body.getRadius() * body.scale * 2);
      }

      const glowMesh = glowMeshesRef.current.get(body.id);
      if (glowMesh) {
        glowMesh.position.copy(body.position);
        glowMesh.scale.setScalar(body.getRadius() * body.scale * 3);
      }

      const trail = trailsRef.current.get(body.id);
      if (trail && body.trail.length > 1) {
        const positions = trail.geometry.attributes.position as THREE.BufferAttribute;
        const colors = trail.geometry.attributes.color as THREE.BufferAttribute;
        
        const trailLength = body.trail.length;
        for (let i = 0; i < trailLength; i++) {
          const point = body.trail[i];
          positions.setXYZ(i, point.x, point.y, point.z);
          
          const speedFactor = i / Math.max(trailLength - 1, 1);
          const color = velocityToColor(body.getSpeed() * (0.5 + speedFactor * 0.5));
          colors.setXYZ(i, color.r, color.g, color.b);
        }
        positions.count = trailLength;
        colors.count = trailLength;
        positions.needsUpdate = true;
        colors.needsUpdate = true;
        trail.geometry.setDrawRange(0, trailLength);
      }

      if (body.type === 'star' && mesh) {
        mesh.rotation.y += delta * 0.1;
      }
    });

    if (selectedBodyId && highlightRingRef.current) {
      const body = celestialBodiesRef.current.find(b => b.id === selectedBodyId);
      if (body) {
        highlightRingRef.current.position.copy(body.position);
        const scale = body.getRadius() * 2.5;
        highlightRingRef.current.scale.setScalar(scale);
        highlightRingRef.current.rotation.x = Math.PI / 2;
        highlightRingRef.current.rotation.z += delta * 0.5;
      }
    }
  });

  const handleBodyClick = useCallback((id: string, event: any) => {
    event.stopPropagation();
    onSelectBody(selectedBodyId === id ? null : id);
  }, [selectedBodyId, onSelectBody]);

  const bodyMeshes = useMemo(() => {
    return celestialBodiesRef.current.map(body => {
      const color = new THREE.Color(body.color);
      
      return (
        <group key={body.id}>
          <mesh
            onClick={(e) => handleBodyClick(body.id, e)}
            onPointerOver={(e) => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
            ref={(mesh) => {
              if (mesh) meshesRef.current.set(body.id, mesh);
            }}
          >
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={body.type === 'star' ? 1 : 0.3}
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
          
          <mesh
            ref={(mesh) => {
              if (mesh) glowMeshesRef.current.set(body.id, mesh);
            }}
          >
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={body.type === 'star' ? 0.4 : 0.15}
              side={THREE.BackSide}
            />
          </mesh>

          <line
            ref={(line) => {
              if (line) trailsRef.current.set(body.id, line);
            }}
          >
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={200}
                array={new Float32Array(200 * 3)}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                count={200}
                array={new Float32Array(200 * 3)}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              vertexColors
              transparent
              opacity={0.6}
              linewidth={2}
            />
          </line>
        </group>
      );
    });
  }, [celestialBodiesRef.current.length, handleBodyClick]);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#ffdd88" distance={500} />
      
      <Stars
        radius={300}
        depth={60}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {bodyMeshes}

      {selectedBodyId && (
        <mesh ref={highlightRingRef}>
          <ringGeometry args={[0.9, 1, 64]} />
          <meshBasicMaterial
            color="#6c63ff"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  );
}
