import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { createUniverse, evolveUniverse } from '../data/ParticleGenerator';
import { useUniverseStore } from '../../store/universeStore';

const PARTICLE_COUNT = 5000;
const ANIMATION_DURATION = 5;

interface ParticleSystemProps {
  sceneRef: React.MutableRefObject<THREE.Points | null>;
}

function ParticleSystem({ sceneRef }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const haloRef = useRef<THREE.Points | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const { camera, gl } = useThree();

  const {
    particles,
    setParticles,
    updateParticles,
    setAnimationPhase,
    selectedParticleIds,
    selectParticle,
    selectParticlesInBox,
    setBoxSelection,
    setIsBoxSelecting,
    isBoxSelecting,
    boxSelection,
  } = useUniverseStore();

  const particleIds = useMemo(() => particles.map((p) => p.id), [particles]);

  const { positions, colors, sizes, opacities } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const siz = new Float32Array(PARTICLE_COUNT);
    const opa = new Float32Array(PARTICLE_COUNT);

    particles.forEach((particle, i) => {
      pos[i * 3] = particle.position.x;
      pos[i * 3 + 1] = particle.position.y;
      pos[i * 3 + 2] = particle.position.z;

      const isSelected = selectedParticleIds.includes(particle.id);
      const brightness = isSelected ? 1.5 : 1;
      col[i * 3] = particle.color.r * brightness;
      col[i * 3 + 1] = particle.color.g * brightness;
      col[i * 3 + 2] = particle.color.b * brightness;

      siz[i] = isSelected ? particle.size * 1.8 : particle.size;
      opa[i] = particle.opacity;
    });

    return { positions: pos, colors: col, sizes: siz, opacities: opa };
  }, [particles, selectedParticleIds]);

  const lineData = useMemo(() => {
    const maxTrajectoryLength = 10;
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    particles.forEach((particle) => {
      const traj = particle.trajectory;
      for (let i = 0; i < traj.length - 1; i++) {
        const alpha = i / maxTrajectoryLength;
        linePositions.push(traj[i].x, traj[i].y, traj[i].z);
        linePositions.push(traj[i + 1].x, traj[i + 1].y, traj[i + 1].z);
        lineColors.push(
          particle.color.r * alpha,
          particle.color.g * alpha,
          particle.color.b * alpha
        );
        lineColors.push(
          particle.color.r * (alpha + 0.1),
          particle.color.g * (alpha + 0.1),
          particle.color.b * (alpha + 0.1)
        );
      }
    });

    return {
      positions: new Float32Array(linePositions),
      colors: new Float32Array(lineColors),
    };
  }, [particles]);

  const haloPositions = useMemo(() => {
    const pos = new Float32Array(selectedParticleIds.length * 3);
    selectedParticleIds.forEach((id, i) => {
      const particle = particles.find((p) => p.id === id);
      if (particle) {
        pos[i * 3] = particle.position.x;
        pos[i * 3 + 1] = particle.position.y;
        pos[i * 3 + 2] = particle.position.z;
      }
    });
    return pos;
  }, [selectedParticleIds, particles]);

  useEffect(() => {
    const initialParticles = createUniverse(PARTICLE_COUNT);
    setParticles(initialParticles);
    setAnimationPhase('explosion');
  }, [setParticles, setAnimationPhase]);

  useEffect(() => {
    if (pointsRef.current) {
      sceneRef.current = pointsRef.current;
    }
  }, [sceneRef]);

  useFrame((_, delta) => {
    const { animationPhase: phase, animationTime, timeProgress: progress } = useUniverseStore.getState();
    
    if (phase === 'idle') return;

    let newTime = animationTime + delta;
    let newProgress = progress;
    let newPhase = phase;

    if (phase === 'explosion') {
      if (newTime >= ANIMATION_DURATION) {
        newTime = ANIMATION_DURATION;
        newPhase = 'stable';
        newProgress = 1;
      } else {
          newProgress = newTime / ANIMATION_DURATION;
          if (newTime > 0.5 && phase === 'explosion') {
            newPhase = 'expanding';
          }
        }

      useUniverseStore.setState({
        animationTime: newTime,
        timeProgress: newProgress,
        animationPhase: newPhase,
      });

      const evolved = evolveUniverse(particles, newProgress, delta, newPhase);
      updateParticles(evolved);
    } else if (phase === 'expanding') {
      if (newTime >= ANIMATION_DURATION) {
        newTime = ANIMATION_DURATION;
        newPhase = 'stable';
        newProgress = 1;
      } else {
        newProgress = newTime / ANIMATION_DURATION;
      }

      useUniverseStore.setState({
        animationTime: newTime,
        timeProgress: newProgress,
        animationPhase: newPhase,
      });

      const evolved = evolveUniverse(particles, newProgress, delta, newPhase);
      updateParticles(evolved);
    }

    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
      const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
      const sizeAttr = geometry.attributes.size as THREE.BufferAttribute;
      const opacityAttr = geometry.attributes.opacity as THREE.BufferAttribute;

      particles.forEach((particle, i) => {
        positionAttr.array[i * 3] = particle.position.x;
        positionAttr.array[i * 3 + 1] = particle.position.y;
        positionAttr.array[i * 3 + 2] = particle.position.z;

        const isSelected = selectedParticleIds.includes(particle.id);
        const brightness = isSelected ? 1.5 : 1;
        colorAttr.array[i * 3] = particle.color.r * brightness;
        colorAttr.array[i * 3 + 1] = particle.color.g * brightness;
        colorAttr.array[i * 3 + 2] = particle.color.b * brightness;

        sizeAttr.array[i] = isSelected ? particle.size * 1.8 : particle.size;
        opacityAttr.array[i] = particle.opacity;
      });

      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
      opacityAttr.needsUpdate = true;
    }

    if (haloRef.current && selectedParticleIds.length > 0) {
      const haloGeometry = haloRef.current.geometry;
      const haloPosAttr = haloGeometry.attributes.position as THREE.BufferAttribute;
      selectedParticleIds.forEach((id, i) => {
        const particle = particles.find((p) => p.id === id);
        if (particle) {
          haloPosAttr.array[i * 3] = particle.position.x;
          haloPosAttr.array[i * 3 + 1] = particle.position.y;
          haloPosAttr.array[i * 3 + 2] = particle.position.z;
        }
      });
      haloPosAttr.needsUpdate = true;
    }
  });

  const getParticleAtPoint = useCallback(
    (clientX: number, clientY: number): string | null => {
      if (!pointsRef.current) return null;

      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);

      const intersects = raycaster.current.intersectObject(pointsRef.current);

      if (intersects.length > 0) {
        const index = intersects[0].index;
        if (index !== undefined) {
          return particleIds[index];
        }
      }
      return null;
    },
    [camera, gl, particleIds]
  );

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (isBoxSelecting) return;
      const particleId = getParticleAtPoint(event.clientX, event.clientY);
      selectParticle(particleId);
    },
    [getParticleAtPoint, isBoxSelecting, selectParticle]
  );

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!event.shiftKey) return;
      setIsBoxSelecting(true);
      setBoxSelection({
        start: { x: event.clientX, y: event.clientY },
        end: { x: event.clientX, y: event.clientY },
      });
    },
    [setIsBoxSelecting, setBoxSelection]
  );

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!isBoxSelecting) return;
      setBoxSelection({
        ...boxSelection,
        end: { x: event.clientX, y: event.clientY },
      });
    },
    [isBoxSelecting, boxSelection, setBoxSelection]
  );

  const handlePointerUp = useCallback(() => {
    if (!isBoxSelecting || !boxSelection.start || !boxSelection.end) {
      setIsBoxSelecting(false);
      return;
    }

    const rect = gl.domElement.getBoundingClientRect();
    const startX = Math.min(boxSelection.start.x, boxSelection.end.x);
    const endX = Math.max(boxSelection.start.x, boxSelection.end.x);
    const startY = Math.min(boxSelection.start.y, boxSelection.end.y);
    const endY = Math.max(boxSelection.start.y, boxSelection.end.y);

    const selectedIds: string[] = [];

    particles.forEach((particle, i) => {
      const vector = new THREE.Vector3(
        particle.position.x,
        particle.position.y,
        particle.position.z
      );
      vector.project(camera);

      const screenX = (vector.x + 1) / 2 * rect.width + rect.left;
      const screenY = (-vector.y + 1) / 2 * rect.height + rect.top;

      if (
        screenX >= startX &&
        screenX <= endX &&
        screenY >= startY &&
        screenY <= endY &&
        particle.visible &&
        particle.opacity > 0.5
      ) {
        selectedIds.push(particleIds[i]);
      }
    });

    selectParticlesInBox(selectedIds);
    setIsBoxSelecting(false);
    setBoxSelection({ start: null, end: null });
  }, [isBoxSelecting, boxSelection, particles, particleIds, camera, gl, selectParticlesInBox, setIsBoxSelecting, setBoxSelection]);

  const pointMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          pixelRatio: { value: window.devicePixelRatio },
        },
        vertexShader: `
          attribute float size;
          attribute float opacity;
          varying vec3 vColor;
          varying float vOpacity;
          uniform float pixelRatio;
          void main() {
            vColor = color;
            vOpacity = opacity;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * 300.0 / -mvPosition.z * pixelRatio;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(vColor, alpha * vOpacity);
          }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  const haloMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          pixelRatio: { value: window.devicePixelRatio },
        },
        vertexShader: `
          uniform float time;
          uniform float pixelRatio;
          varying float vOpacity;
          void main() {
            vOpacity = 0.3 + 0.2 * sin(time * 3.0);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 8.0 * 300.0 / -mvPosition.z * pixelRatio;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vOpacity;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = smoothstep(0.5, 0.3, dist) * vOpacity;
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  return (
    <group>
      <points
        ref={pointsRef}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={PARTICLE_COUNT}
            array={sizes}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-opacity"
            count={PARTICLE_COUNT}
            array={opacities}
            itemSize={1}
          />
        </bufferGeometry>
        <primitive object={pointMaterial} attach="material" />
      </points>

      {lineData.positions.length > 0 && (
        <lineSegments ref={linesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={lineData.positions.length / 3}
              array={lineData.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={lineData.colors.length / 3}
              array={lineData.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <primitive object={lineMaterial} attach="material" />
        </lineSegments>
      )}

      {selectedParticleIds.length > 0 && (
        <points ref={haloRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={selectedParticleIds.length}
              array={haloPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <primitive object={haloMaterial} attach="material" />
        </points>
      )}
    </group>
  );
}

function Singularity() {
  const { animationPhase, animationTime } = useUniverseStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!meshRef.current || !lightRef.current) return;

    if (animationPhase === 'explosion' && animationTime < 0.5) {
      const scale = 1 + animationTime * 4;
      meshRef.current.scale.setScalar(scale);
      lightRef.current.intensity = 2 + animationTime * 10;
      meshRef.current.visible = true;
    } else if (animationPhase === 'explosion' && animationTime >= 0.5) {
      const fadeOut = 1 - (animationTime - 0.5) * 2;
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, fadeOut);
      lightRef.current.intensity = Math.max(0, 10 * fadeOut);
    } else {
      meshRef.current.visible = false;
      lightRef.current.visible = false;
    }
  });

  if (animationPhase === 'stable') return null;

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1} />
      </mesh>
      <pointLight ref={lightRef} color="#ffffff" intensity={2} distance={200} />
    </group>
  );
}

interface SceneProps {
  sceneRef: React.MutableRefObject<THREE.Points | null>;
}

export default function ParticleScene({ sceneRef }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#e0f0ff" distance={300} />
      <Stars radius={300} depth={60} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#0a0a12', 50, 300]} />
      <ParticleSystem sceneRef={sceneRef} />
      <Singularity />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={50}
        maxDistance={400}
      />
    </>
  );
}

export { ParticleScene };
