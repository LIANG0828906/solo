import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { ParticleData } from './store';
import { useParticleStore, type PresetType } from './store';
import {
  CONTAINER_SIZE,
  HALF_SIZE,
  TRAIL_LENGTH,
  createParticle,
  initPreset,
  resizeParticles,
  startPresetTransition,
  applyTransition,
  stepSimulation,
  getSpeed,
  speedToColor,
  type EngineConfig,
} from './SimulationEngine';

interface SceneProps {
  onFpsUpdate: (fps: number) => void;
}

const PARTICLE_RADIUS = 0.08;
const SELECTED_SCALE = 1.5;
const TRAIL_MAX_LEN = 0.5;

function makeEngineCfg(
  state: ReturnType<typeof useParticleStore.getState>,
  removeList: Set<number>,
): EngineConfig {
  return {
    particleCount: state.particleCount,
    vortexStrength: state.vortexStrength,
    viscosity: state.viscosity,
    initialVelocity: { ...state.initialVelocity },
    activePreset: state.activePreset,
    presetTransitioning: state.presetTransitioning,
    removeList,
  };
}

function ParticleSystem({ onFpsUpdate }: SceneProps) {
  const particlesRef = useRef<ParticleData[]>([]);
  const removeListRef = useRef<Set<number>>(new Set());
  const lastCountRef = useRef<number>(-1);
  const lastPresetRef = useRef<PresetType | null>(null);
  const transitionRef = useRef<{
    targetPos: Float32Array[];
    targetVel: Float32Array[];
    startTime: number;
    duration: number;
  } | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trailGroupRef = useRef<THREE.Group>(null);
  const trailLinesRef = useRef<THREE.Line[]>([]);
  const selectedMeshRef = useRef<THREE.Mesh>(null);
  const velocityArrowRef = useRef<THREE.ArrowHelper>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  const [, forceRender] = useState(0);

  const { camera } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVecRef = useRef(new THREE.Vector2());
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const selectedParticleId = useParticleStore((s) => s.selectedParticleId);
  const selectParticle = useParticleStore((s) => s.selectParticle);
  const activePreset = useParticleStore((s) => s.activePreset);

  useEffect(() => {
    selectedIdRef.current = selectedParticleId;
  }, [selectedParticleId]);

  useEffect(() => {
    const initial: ParticleData[] = [];
    const n = useParticleStore.getState().particleCount;
    for (let i = 0; i < n; i++) initial.push(createParticle());
    const cfg = makeEngineCfg(useParticleStore.getState(), new Set());
    initPreset(initial, 'laminar', cfg);
    particlesRef.current = initial;
    lastCountRef.current = n;
    lastPresetRef.current = null;
    forceRender((v) => v + 1);

    const unsub = useParticleStore.subscribe((state, prev) => {
      const cfg = makeEngineCfg(state, removeListRef.current);
      const particles = particlesRef.current;

      if (state.particleCount !== lastCountRef.current) {
        const resized = resizeParticles(particles, state.particleCount, cfg);
        particlesRef.current = resized;
        lastCountRef.current = state.particleCount;
        rebuildTrailLines(resized.length);
      }

      if (state.activePreset !== lastPresetRef.current && state.activePreset) {
        const curLen = particlesRef.current.length;
        const target = state.particleCount;
        if (curLen !== target) {
          const resized = resizeParticles(particlesRef.current, target, cfg);
          particlesRef.current = resized;
          lastCountRef.current = target;
          rebuildTrailLines(target);
        }
        const trans = startPresetTransition(particlesRef.current, state.activePreset, cfg);
        transitionRef.current = {
          targetPos: trans.targetPos,
          targetVel: trans.targetVel,
          startTime: performance.now(),
          duration: 1500,
        };
        lastPresetRef.current = state.activePreset;
      }
    });
    return unsub;
  }, []);

  function rebuildTrailLines(count: number) {
    const group = trailGroupRef.current;
    if (!group) return;
    while (group.children.length > 0) {
      const c = group.children[0];
      group.remove(c);
      if (c instanceof THREE.Line) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material.dispose();
      }
    }
    const lines: THREE.Line[] = [];
    for (let i = 0; i < count; i++) {
      const positions = new Float32Array(TRAIL_LENGTH * 3);
      const colors = new Float32Array(TRAIL_LENGTH * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        linewidth: 1,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      group.add(line);
      lines.push(line);
    }
    trailLinesRef.current = lines;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      rebuildTrailLines(particlesRef.current.length);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
    }
    function handleDoubleClick(e: MouseEvent) {
      const canvasEl = document.querySelector('.canvas-container canvas') as HTMLCanvasElement | null;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      mouseVecRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVecRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseVecRef.current, camera);

      const mesh = meshRef.current;
      if (!mesh) return;
      const hits = raycasterRef.current.intersectObject(mesh, false);
      if (hits.length > 0 && typeof hits[0].instanceId === 'number') {
        const idx = hits[0].instanceId;
        const p = particlesRef.current[idx];
        if (p && p.alive) {
          selectParticle(p.id);
        }
      } else {
        selectParticle(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdRef.current !== null) {
        removeListRef.current.add(selectedIdRef.current);
        selectParticle(null);
        setTimeout(() => {
          particlesRef.current = particlesRef.current.filter((p) => p.alive);
          const state = useParticleStore.getState();
          const cfg = makeEngineCfg(state, removeListRef.current);
          particlesRef.current = resizeParticles(particlesRef.current, state.particleCount, cfg);
          lastCountRef.current = particlesRef.current.length;
          removeListRef.current.clear();
          rebuildTrailLines(particlesRef.current.length);
        }, 50);
      }
    }
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('dblclick', handleDoubleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [camera, selectParticle]);

  const lastFrameRef = useRef(performance.now());
  const fpsAccumRef = useRef(0);
  const fpsCountRef = useRef(0);
  const lastFpsUpdate = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    const dt = (now - lastFrameRef.current) / 1000;
    lastFrameRef.current = now;

    fpsAccumRef.current += dt;
    fpsCountRef.current++;
    if (now - lastFpsUpdate.current > 400) {
      const fps = fpsCountRef.current / fpsAccumRef.current;
      onFpsUpdate(fps);
      fpsAccumRef.current = 0;
      fpsCountRef.current = 0;
      lastFpsUpdate.current = now;
    }

    const state = useParticleStore.getState();
    const cfg = makeEngineCfg(state, removeListRef.current);
    const particles = particlesRef.current;

    if (transitionRef.current) {
      const t = transitionRef.current;
      const prog = Math.min(1, (now - t.startTime) / t.duration);
      applyTransition(particles, t.targetPos, t.targetVel, prog);
      if (prog >= 1) transitionRef.current = null;
    } else {
      stepSimulation(particles, dt, cfg);
    }

    const mesh = meshRef.current;
    const preset = state.activePreset;
    let selectedIndex = -1;

    if (mesh && particles.length > 0) {
      const count = Math.min(particles.length, mesh.count);
      const colorBuf = mesh.instanceColor;
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        if (!p) continue;
        if (p.id === selectedIdRef.current) selectedIndex = i;

        dummy.position.set(p.position[0], p.position[1], p.position[2]);
        const scale = p.id === selectedIdRef.current ? SELECTED_SCALE : 1;
        dummy.scale.setScalar(scale);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        const speed = getSpeed(p.velocity);
        const rgb = new Float32Array(3);
        speedToColor(speed, rgb, preset);
        if (p.id === selectedIdRef.current) {
          tmpColor.setRGB(1, 0.85, 0.3);
        } else {
          tmpColor.setRGB(rgb[0], rgb[1], rgb[2]);
        }
        if (colorBuf) mesh.setColorAt(i, tmpColor);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (colorBuf) colorBuf.needsUpdate = true;
    }

    const trailLines = trailLinesRef.current;
    for (let i = 0; i < trailLines.length; i++) {
      const line = trailLines[i];
      const p = particles[i];
      if (!line || !p) continue;
      const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = line.geometry.getAttribute('color') as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const colArr = colAttr.array as Float32Array;

      const speed = getSpeed(p.velocity);
      const rgb = new Float32Array(3);
      speedToColor(speed, rgb, preset);
      if (p.id === selectedIdRef.current) {
        rgb[0] = 1;
        rgb[1] = 0.85;
        rgb[2] = 0.3;
      }

      const px = p.position[0];
      const py = p.position[1];
      const pz = p.position[2];

      for (let t = 0; t < TRAIL_LENGTH; t++) {
        const alpha = 1 - t / TRAIL_LENGTH;
        const tp = p.trail[t];
        const dirX = tp[0] - px;
        const dirY = tp[1] - py;
        const dirZ = tp[2] - pz;
        const dist = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        let fx = tp[0];
        let fy = tp[1];
        let fz = tp[2];
        if (dist > TRAIL_MAX_LEN) {
          const k = TRAIL_MAX_LEN / dist;
          fx = px + dirX * k;
          fy = py + dirY * k;
          fz = pz + dirZ * k;
        }
        posArr[t * 3] = fx;
        posArr[t * 3 + 1] = fy;
        posArr[t * 3 + 2] = fz;
        colArr[t * 3] = rgb[0];
        colArr[t * 3 + 1] = rgb[1];
        colArr[t * 3 + 2] = rgb[2];
        (line.material as THREE.LineBasicMaterial).opacity = alpha * 0.75;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      line.geometry.computeBoundingSphere();
    }

    if (selectedMeshRef.current && velocityArrowRef.current) {
      const selP = selectedIndex >= 0 ? particles[selectedIndex] : null;
      if (selP && selP.id === selectedIdRef.current) {
        selectedMeshRef.current.visible = true;
        selectedMeshRef.current.position.set(selP.position[0], selP.position[1], selP.position[2]);
        selectedMeshRef.current.scale.setScalar(SELECTED_SCALE * 1.05);
        velocityArrowRef.current.visible = true;
        velocityArrowRef.current.position.set(selP.position[0], selP.position[1], selP.position[2]);
        tmpVec.set(selP.velocity[0], selP.velocity[1], selP.velocity[2]);
        const s = tmpVec.length();
        if (s > 0.001) {
          tmpVec.normalize();
          velocityArrowRef.current.setDirection(tmpVec);
          velocityArrowRef.current.setLength(Math.min(1.8, s * 0.5), 0.15, 0.08);
        }
      } else {
        selectedMeshRef.current.visible = false;
        velocityArrowRef.current.visible = false;
      }
    }
  });

  const maxInstanced = 3000;
  const sphereGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(PARTICLE_RADIUS, 10, 8);
    return g;
  }, []);
  const instancedMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: false,
      roughness: 0.3,
      metalness: 0.4,
      emissiveIntensity: 0.15,
    });
  }, []);

  return (
    <>
      <color attach="background" args={[0.039, 0.055, 0.153]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 10, 6]} intensity={0.85} color={[0.4, 0.75, 1.0]} />
      <directionalLight position={[-6, -4, -8]} intensity={0.55} color={[0.75, 0.45, 1.0]} />
      <pointLight position={[0, 0, 0]} intensity={0.35} color={[0.3, 0.9, 1.0]} distance={18} />

      <group>
        <mesh>
          <boxGeometry args={[CONTAINER_SIZE, CONTAINER_SIZE, CONTAINER_SIZE]} />
          <meshBasicMaterial
            color={[0.02, 0.1, 0.3]}
            transparent
            opacity={0.04}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(CONTAINER_SIZE, CONTAINER_SIZE, CONTAINER_SIZE)]} />
          <lineBasicMaterial color={[0.0, 0.83, 1.0]} transparent opacity={0.55} />
        </lineSegments>

        {Array.from({ length: 4 }).map((_, i) => {
          const t = (i + 1) / 5;
          const coord = -HALF_SIZE + CONTAINER_SIZE * t;
          const axisColor = new THREE.Color(0x00d4ff).multiplyScalar(0.2);
          return (
            <group key={`grid-${i}`}>
              <lineSegments>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={4 * 2}
                    array={new Float32Array([
                      coord, -HALF_SIZE, -HALF_SIZE,
                      coord, HALF_SIZE, -HALF_SIZE,
                      coord, -HALF_SIZE, HALF_SIZE,
                      coord, HALF_SIZE, HALF_SIZE,
                      -HALF_SIZE, coord, -HALF_SIZE,
                      HALF_SIZE, coord, -HALF_SIZE,
                      -HALF_SIZE, coord, HALF_SIZE,
                      HALF_SIZE, coord, HALF_SIZE,
                    ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={axisColor} transparent opacity={0.3} />
              </lineSegments>
              <lineSegments>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={4 * 2}
                    array={new Float32Array([
                      -HALF_SIZE, -HALF_SIZE, coord,
                      HALF_SIZE, -HALF_SIZE, coord,
                      -HALF_SIZE, HALF_SIZE, coord,
                      HALF_SIZE, HALF_SIZE, coord,
                    ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={axisColor} transparent opacity={0.3} />
              </lineSegments>
            </group>
          );
        })}
      </group>

      <instancedMesh
        ref={meshRef}
        args={[sphereGeo, instancedMat, maxInstanced]}
        frustumCulled={false}
      >
        <instancedBufferAttribute
          attach="instanceColor"
          args={[new Float32Array(maxInstanced * 3), 3]}
        />
      </instancedMesh>

      <group ref={trailGroupRef} />

      <mesh ref={selectedMeshRef} visible={false}>
        <sphereGeometry args={[PARTICLE_RADIUS, 14, 12]} />
        <meshBasicMaterial
          color={[1.0, 0.85, 0.3]}
          transparent
          opacity={0.9}
        />
      </mesh>

      <arrowHelper
        ref={velocityArrowRef}
        args={[
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, 0),
          1,
          0xffdd55,
          0.15,
          0.08,
        ]}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
        panSpeed={0.6}
        zoomSpeed={0.9}
        minDistance={6}
        maxDistance={40}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </>
  );
}

export default function ParticleSceneWrapper({ onFpsUpdate }: SceneProps) {
  return (
    <Canvas
      className="canvas-container"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [9, 8, 14], fov: 50, near: 0.1, far: 200 }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0, 0);
      }}
    >
      <ParticleSystem onFpsUpdate={onFpsUpdate} />
    </Canvas>
  );
}
