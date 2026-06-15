import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { TrajectoryPoint } from '../data/ParticleGenerator';
import { createUniverse, evolveUniverse } from '../data/ParticleGenerator';
import { useUniverseStore } from '../../store/universeStore';

const PARTICLE_COUNT = 5000;
const ANIMATION_DURATION = 5;
const BOX_SELECT_THRESHOLD = 5;

interface ParticleSystemProps {
  sceneRef: React.MutableRefObject<THREE.Points | null>;
}

function ParticleSystem({ sceneRef }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const haloInnerRef = useRef<THREE.Points | null>(null);
  const haloOuterRef = useRef<THREE.Points | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const elapsedTime = useRef(0);
  const { camera, gl } = useThree();

  const {
    particles,
    setParticles,
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

  const particleBuffers = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const siz = new Float32Array(PARTICLE_COUNT);
    const opa = new Float32Array(PARTICLE_COUNT);

    particles.forEach((particle, i) => {
      pos[i * 3] = particle.position.x;
      pos[i * 3 + 1] = particle.position.y;
      pos[i * 3 + 2] = particle.position.z;

      const isSelected = selectedParticleIds.includes(particle.id);
      const brightness = isSelected ? 1.8 : 1;
      col[i * 3] = particle.color.r * brightness;
      col[i * 3 + 1] = particle.color.g * brightness;
      col[i * 3 + 2] = particle.color.b * brightness;

      siz[i] = isSelected ? particle.size * 1.6 : particle.size;
      opa[i] = particle.opacity;
    });

    return { positions: pos, colors: col, sizes: siz, opacities: opa };
  }, [particles, selectedParticleIds]);

  const haloInnerBuffers = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
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

  const haloOuterBuffers = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
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
    elapsedTime.current += delta;

    const latest = useUniverseStore.getState();
    const {
      animationPhase: phase,
      animationTime,
      timeProgress: progress,
      timeProgress: storeTimeProgress,
      particles: latestParticles,
    } = latest;

    type PhaseType = 'idle' | 'explosion' | 'expanding' | 'stable';
    let nextAnimationTime = animationTime;
    let nextTimeProgress = progress;
    let nextPhase: PhaseType = phase;
    let evolved: typeof latestParticles | null = null;

    if (phase === 'explosion' || phase === 'expanding') {
      nextAnimationTime = animationTime + delta;

      if (nextAnimationTime >= ANIMATION_DURATION) {
        nextAnimationTime = ANIMATION_DURATION;
        nextTimeProgress = 1;
        nextPhase = 'stable';
      } else {
        nextTimeProgress = nextAnimationTime / ANIMATION_DURATION;
        if (phase === 'explosion' && nextAnimationTime > 0.5) {
          nextPhase = 'expanding';
        }
      }

      evolved = evolveUniverse(
        latestParticles,
        nextTimeProgress,
        delta,
        nextPhase
      );
    } else if (phase === 'stable') {
      const hasOpacityTransition = latestParticles.some(
        (p) => Math.abs(p.opacity - p.targetOpacity) > 0.001
      );
      const manualTimeChange =
        Math.abs(progress - storeTimeProgress) > 0.00001 ||
        latestParticles.length === 0;
      if (hasOpacityTransition || manualTimeChange || latestParticles.length === 0) {
        evolved = evolveUniverse(
          latestParticles,
          storeTimeProgress,
          delta,
          phase
        );
      }
    }

    if (
      nextAnimationTime !== animationTime ||
      nextTimeProgress !== progress ||
      nextPhase !== phase ||
      evolved
    ) {
      useUniverseStore.setState((prev) => ({
        animationTime: nextAnimationTime,
        timeProgress: nextTimeProgress,
        animationPhase: nextPhase,
        particles: evolved || prev.particles,
      }));
    }

    if (
      haloInnerRef.current?.material &&
      'uniforms' in haloInnerRef.current.material
    ) {
      (haloInnerRef.current.material as THREE.ShaderMaterial).uniforms.time.value =
        elapsedTime.current;
    }
    if (
      haloOuterRef.current?.material &&
      'uniforms' in haloOuterRef.current.material
    ) {
      (haloOuterRef.current.material as THREE.ShaderMaterial).uniforms.time.value =
        elapsedTime.current;
    }
  });

  const lineBuffers = useMemo(() => {
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    for (let p = 0; p < particles.length; p++) {
      const particle = particles[p];
      const traj = particle.trajectory as TrajectoryPoint[];
      if (traj.length < 2 || particle.opacity < 0.05) continue;

      for (let i = 0; i < traj.length - 1; i++) {
        const p1 = traj[i];
        const p2 = traj[i + 1];
        if (!p1 || !p2) continue;
        const avgAlpha = (p1.alpha + p2.alpha) * 0.5;
        if (avgAlpha <= 0.001) continue;

        linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        const r = particle.color.r;
        const g = particle.color.g;
        const b = particle.color.b;
        lineColors.push(
          r * p1.alpha,
          g * p1.alpha,
          b * p1.alpha,
          r * p2.alpha,
          g * p2.alpha,
          b * p2.alpha
        );
      }
    }

    return {
      positions: new Float32Array(linePositions),
      colors: new Float32Array(lineColors),
      count: linePositions.length / 3,
    };
  }, [particles]);

  const getParticleAtPoint = useCallback(
    (clientX: number, clientY: number): string | null => {
      if (!pointsRef.current) return null;

      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      raycaster.current.params.Points.threshold = 1.5;

      const intersects = raycaster.current.intersectObject(pointsRef.current);

      if (intersects.length > 0) {
        const index = intersects[0].index;
        if (index !== undefined && index >= 0 && index < particleIds.length) {
          const particle = particles[index];
          if (particle && particle.opacity > 0.3) {
            return particleIds[index];
          }
        }
      }
      return null;
    },
    [camera, gl, particleIds, particles]
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
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
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

  const handlePointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!isBoxSelecting) return;
      if (!boxSelection.start || !boxSelection.end) {
        setIsBoxSelecting(false);
        return;
      }

      try {
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }

      const dx = Math.abs(boxSelection.end.x - boxSelection.start.x);
      const dy = Math.abs(boxSelection.end.y - boxSelection.start.y);

      if (dx < BOX_SELECT_THRESHOLD && dy < BOX_SELECT_THRESHOLD) {
        setIsBoxSelecting(false);
        setBoxSelection({ start: null, end: null });
        return;
      }

      const rect = gl.domElement.getBoundingClientRect();
      const startX = Math.min(boxSelection.start.x, boxSelection.end.x);
      const endX = Math.max(boxSelection.start.x, boxSelection.end.x);
      const startY = Math.min(boxSelection.start.y, boxSelection.end.y);
      const endY = Math.max(boxSelection.start.y, boxSelection.end.y);

      const selectedIds: string[] = [];
      const tmpVec = new THREE.Vector3();

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        if (particle.opacity <= 0.5) continue;
        tmpVec.set(particle.position.x, particle.position.y, particle.position.z);
        tmpVec.project(camera);

        const screenX = ((tmpVec.x + 1) / 2) * rect.width + rect.left;
        const screenY = ((-tmpVec.y + 1) / 2) * rect.height + rect.top;

        if (
          screenX >= startX &&
          screenX <= endX &&
          screenY >= startY &&
          screenY <= endY
        ) {
          selectedIds.push(particleIds[i]);
        }
      }

      selectParticlesInBox(selectedIds);
      setIsBoxSelecting(false);
      setBoxSelection({ start: null, end: null });
    },
    [
      isBoxSelecting,
      boxSelection,
      particles,
      particleIds,
      camera,
      gl,
      selectParticlesInBox,
      setIsBoxSelecting,
      setBoxSelection,
    ]
  );

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
            gl_PointSize = size * 320.0 / max(1.0, -mvPosition.z) * pixelRatio;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            if (vOpacity < 0.01) discard;
            vec2 uv = gl_PointCoord - vec2(0.5);
            float dist = length(uv);
            if (dist > 0.5) discard;
            float core = 1.0 - smoothstep(0.0, 0.2, dist);
            float halo = 1.0 - smoothstep(0.15, 0.5, dist);
            float alpha = (core * 0.9 + halo * 0.1) * vOpacity;
            gl_FragColor = vec4(vColor * (1.0 + core * 0.4), alpha);
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
        opacity: 1,
      }),
    []
  );

  const haloInnerMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          pixelRatio: { value: window.devicePixelRatio },
        },
        vertexShader: `
          uniform float time;
          uniform float pixelRatio;
          varying float vPulse;
          void main() {
            float pulse = 0.7 + 0.3 * sin(time * 3.0);
            vPulse = pulse;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (14.0 + 4.0 * pulse) * 320.0 / max(1.0, -mvPosition.z) * pixelRatio;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vPulse;
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float dist = length(uv);
            if (dist > 0.5) discard;
            float ring = smoothstep(0.5, 0.35, dist) * (1.0 - smoothstep(0.25, 0.35, dist));
            float inner = smoothstep(0.3, 0.0, dist) * 0.3;
            float alpha = (ring * 0.9 + inner) * (0.4 + 0.35 * vPulse);
            vec3 col = mix(vec3(0.5, 0.85, 1.0), vec3(1.0, 1.0, 1.0), vPulse);
            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  const haloOuterMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          pixelRatio: { value: window.devicePixelRatio },
        },
        vertexShader: `
          uniform float time;
          uniform float pixelRatio;
          varying float vPulse;
          void main() {
            float pulse = 0.5 + 0.5 * sin(time * 2.0 + 1.2);
            vPulse = pulse;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (26.0 + 10.0 * pulse) * 320.0 / max(1.0, -mvPosition.z) * pixelRatio;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vPulse;
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float dist = length(uv);
            if (dist > 0.5) discard;
            float ring = smoothstep(0.5, 0.4, dist) * (1.0 - smoothstep(0.42, 0.5, dist));
            float alpha = ring * (0.25 + 0.2 * vPulse);
            vec3 col = mix(vec3(0.3, 0.7, 1.0), vec3(0.7, 0.9, 1.0), vPulse);
            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  const hasSelection = selectedParticleIds.length > 0;

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
            array={particleBuffers.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={particleBuffers.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={PARTICLE_COUNT}
            array={particleBuffers.sizes}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-opacity"
            count={PARTICLE_COUNT}
            array={particleBuffers.opacities}
            itemSize={1}
          />
        </bufferGeometry>
        <primitive object={pointMaterial} attach="material" />
      </points>

      {lineBuffers.count > 0 && (
        <lineSegments ref={linesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={lineBuffers.count}
              array={lineBuffers.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={lineBuffers.count}
              array={lineBuffers.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <primitive object={lineMaterial} attach="material" />
        </lineSegments>
      )}

      {hasSelection && (
        <>
          <points ref={haloOuterRef} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={PARTICLE_COUNT}
                array={haloOuterBuffers}
                itemSize={3}
              />
            </bufferGeometry>
            <primitive object={haloOuterMaterial} attach="material" />
          </points>
          <points ref={haloInnerRef} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={PARTICLE_COUNT}
                array={haloInnerBuffers}
                itemSize={3}
              />
            </bufferGeometry>
            <primitive object={haloInnerMaterial} attach="material" />
          </points>
        </>
      )}
    </group>
  );
}

function Singularity() {
  const { animationPhase, animationTime } = useUniverseStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      if (animationPhase === 'explosion' && animationTime < 0.6) {
        const s = 1 + animationTime * 5 + Math.sin(t * 20) * 0.1;
        meshRef.current.scale.setScalar(s);
        meshRef.current.visible = true;
        const mat = meshRef.current.material as THREE.MeshBasicMaterial;
        const fade = Math.max(0, 1 - animationTime / 0.6);
        mat.opacity = fade;
        mat.color.setRGB(1, 0.9 + fade * 0.1, 0.85 + fade * 0.15);
      } else {
        meshRef.current.visible = false;
      }
    }
    if (glowRef.current) {
      if (animationPhase === 'explosion' && animationTime < 0.6) {
        const s = 3 + animationTime * 25;
        glowRef.current.scale.setScalar(s);
        glowRef.current.visible = true;
        const mat = glowRef.current.material as THREE.MeshBasicMaterial;
        const fade = Math.max(0, 1 - animationTime / 0.6);
        mat.opacity = fade * 0.4;
      } else {
        glowRef.current.visible = false;
      }
    }
    if (lightRef.current) {
      if (animationPhase === 'explosion' && animationTime < 0.6) {
        lightRef.current.visible = true;
        const fade = Math.max(0, 1 - animationTime / 0.6);
        lightRef.current.intensity = 2 + fade * 25;
        lightRef.current.distance = 150 + fade * 300;
      } else {
        lightRef.current.visible = false;
      }
    }
  });

  if (animationPhase === 'stable') return null;

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.6, 48, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ccf0ff"
          transparent
          opacity={0.4}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color="#fff8ee"
        intensity={2}
        distance={300}
        decay={1.5}
      />
    </group>
  );
}

interface SceneProps {
  sceneRef: React.MutableRefObject<THREE.Points | null>;
}

export default function ParticleScene({ sceneRef }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 0]} intensity={0.9} color="#e0f0ff" distance={350} />
      <Stars radius={320} depth={80} count={6000} factor={4.5} saturation={0} fade speed={0.7} />
      <fog attach="fog" args={['#0a0a12', 60, 350]} />
      <ParticleSystem sceneRef={sceneRef} />
      <Singularity />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.7}
        zoomSpeed={0.8}
        minDistance={40}
        maxDistance={450}
      />
    </>
  );
}

export { ParticleScene };
