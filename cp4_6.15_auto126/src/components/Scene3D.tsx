import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { TopologyResult, InteractionMode } from '@/utils/topologyCalculator';
import { easeOutBack, lerp } from '@/utils/topologyCalculator';

interface Scene3DProps {
  topologyData: TopologyResult | null;
  speed: number;
  interactionMode: InteractionMode;
  selectedKnotId: string | null;
  onKnotSelect: (knotId: string | null) => void;
  knotCenters: Record<string, [number, number, number]>;
  onKnotCenterChange: (knotId: string, center: [number, number, number]) => void;
  autoRotate: boolean;
}

export interface Scene3DHandle {
  getCanvas: () => HTMLCanvasElement | null;
  captureScreenshot: () => string | null;
}

const TRANSITION_DURATION = 0.35;
const PATH_SAMPLES = 400;

interface ParticleSystemProps {
  topologyData: TopologyResult;
  speed: number;
  interactionMode: InteractionMode;
  selectedKnotId: string | null;
  onKnotSelect: (knotId: string | null) => void;
  knotCenters: Record<string, [number, number, number]>;
  onKnotCenterChange: (knotId: string, center: [number, number, number]) => void;
  onFpsUpdate?: (fps: number) => void;
  onCaptureRefReady?: (fn: () => string | null) => void;
}

function buildStaticPathGeometry(pathCache: Record<string, [number, number, number][]>, knot: { id: string; colorHex: number }) {
  const path = pathCache[knot.id];
  if (!path || path.length < 2) return { positions: new Float32Array(0), colors: new Float32Array(0), vertexCount: 0 };
  const segCount = path.length - 1;
  const positions = new Float32Array(segCount * 6);
  const colors = new Float32Array(segCount * 8);
  const r = ((knot.colorHex >> 16) & 255) / 255;
  const g = ((knot.colorHex >> 8) & 255) / 255;
  const b = (knot.colorHex & 255) / 255;
  for (let i = 0; i < segCount; i++) {
    const p0 = path[i];
    const p1 = path[i + 1];
    positions[6 * i] = p0[0]; positions[6 * i + 1] = p0[1]; positions[6 * i + 2] = p0[2];
    positions[6 * i + 3] = p1[0]; positions[6 * i + 4] = p1[1]; positions[6 * i + 5] = p1[2];
    colors[8 * i] = r; colors[8 * i + 1] = g; colors[8 * i + 2] = b; colors[8 * i + 3] = 0.35;
    colors[8 * i + 4] = r; colors[8 * i + 5] = g; colors[8 * i + 6] = b; colors[8 * i + 7] = 0.35;
  }
  return { positions, colors, vertexCount: segCount * 2 };
}

function ParticleSystem({
  topologyData,
  speed,
  interactionMode,
  selectedKnotId,
  onKnotSelect,
  knotCenters,
  onKnotCenterChange,
  onFpsUpdate,
  onCaptureRefReady,
}: ParticleSystemProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const posAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const colorAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const sizeAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const highlightsRef = useRef<Record<string, THREE.Mesh>>({});
  const staticPathRefs = useRef<Record<string, THREE.LineSegments>>({});
  const transitionStartRef = useRef<number>(-1);
  const prevPositionsRef = useRef<Float32Array | null>(null);
  const particlesSnapshotRef = useRef<any[]>([]);
  const pathCacheSnapRef = useRef<Record<string, [number, number, number][]>>({});
  const lastFrameTime = useRef<number>(performance.now());
  const fpsAccumulator = useRef<{ count: number; sum: number }>({ count: 0, sum: 0 });
  const [, forceRender] = useState(0);

  const { camera, gl, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const draggingKnotRef = useRef<{ id: string; offset: THREE.Vector3; plane: THREE.Plane } | null>(null);

  useEffect(() => {
    if (onCaptureRefReady) {
      onCaptureRefReady(() => {
        try {
          gl.render(scene, camera);
          return gl.domElement.toDataURL('image/png');
        } catch (e) {
          console.error(e);
          return null;
        }
      });
    }
  }, [gl, scene, camera, onCaptureRefReady]);

  useEffect(() => {
    const particles = topologyData.particles;
    const count = particles.length;

    particlesSnapshotRef.current = particles.map((p: any) => ({
      ...p,
      position: [...p.position] as [number, number, number],
      targetPosition: [...p.targetPosition] as [number, number, number],
    }));
    pathCacheSnapRef.current = {};
    for (const key of Object.keys(topologyData.pathCache)) {
      pathCacheSnapRef.current[key] = topologyData.pathCache[key].map(
        (pt: [number, number, number]) => [...pt] as [number, number, number]
      );
    }

    if (particlesRef.current) {
      const geo = particlesRef.current.geometry;
      const oldCount = posAttrRef.current?.count ?? 0;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 4);
      const sizes = new Float32Array(count);
      const prevPositions = prevPositionsRef.current;
      for (let i = 0; i < count; i++) {
        const p: any = particlesSnapshotRef.current[i];
        if (prevPositions && i < oldCount && i * 3 + 2 < prevPositions.length) {
          positions[3 * i] = prevPositions[3 * i];
          positions[3 * i + 1] = prevPositions[3 * i + 1];
          positions[3 * i + 2] = prevPositions[3 * i + 2];
        } else {
          positions[3 * i] = p.position[0];
          positions[3 * i + 1] = p.position[1];
          positions[3 * i + 2] = p.position[2];
        }
        const r = ((p.colorHex >> 16) & 255) / 255;
        const g = ((p.colorHex >> 8) & 255) / 255;
        const b = (p.colorHex & 255) / 255;
        colors[4 * i] = r; colors[4 * i + 1] = g; colors[4 * i + 2] = b; colors[4 * i + 3] = 1.0;
        sizes[i] = p.size;
      }
      prevPositionsRef.current = positions;
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      posAttrRef.current = geo.attributes.position as THREE.BufferAttribute;
      colorAttrRef.current = geo.attributes.color as THREE.BufferAttribute;
      sizeAttrRef.current = geo.attributes.aSize as THREE.BufferAttribute;
      posAttrRef.current.needsUpdate = true;
      colorAttrRef.current.needsUpdate = true;
      sizeAttrRef.current.needsUpdate = true;
    }

    transitionStartRef.current = performance.now();
    forceRender(x => x + 1);
  }, [topologyData]);

  useFrame((state, delta) => {
    const now = performance.now();
    const frameTime = now - lastFrameTime.current;
    lastFrameTime.current = now;
    if (onFpsUpdate) {
      const inst = 1000 / Math.max(1, frameTime);
      fpsAccumulator.current.count += 1;
      fpsAccumulator.current.sum += inst;
      if (fpsAccumulator.current.count >= 20) {
        onFpsUpdate(Math.round(fpsAccumulator.current.sum / fpsAccumulator.current.count));
        fpsAccumulator.current = { count: 0, sum: 0 };
      }
    }

    const snap: any[] = particlesSnapshotRef.current;
    if (!snap || snap.length === 0 || !posAttrRef.current) return;

    let transitionT = 1;
    if (transitionStartRef.current > 0) {
      const elapsed = (now - transitionStartRef.current) / 1000;
      transitionT = Math.min(1, elapsed / TRANSITION_DURATION);
      if (transitionT >= 1) transitionStartRef.current = -1;
    }
    const easeT = transitionT < 1 ? easeOutBack(transitionT) : 1;

    const baseProgress = 0.12 * speed * delta;
    const perKnotOffsets: Record<string, number> = {
      'knot-0': baseProgress,
      'knot-1': -baseProgress * 0.9,
      'knot-2': baseProgress * 1.1,
      'knot-3': -baseProgress,
    };

    for (const p of snap) {
      const dp = perKnotOffsets[p.knotId] ?? baseProgress;
      let prog = (p.pathProgress + dp) % 1;
      if (prog < 0) prog += 1;
      p.pathProgress = prog;
      const path = pathCacheSnapRef.current[p.knotId];
      if (path && path.length > 1) {
        const totalPts = path.length;
        const rawIdx = prog * (totalPts - 1);
        const i0 = Math.floor(rawIdx);
        const i1 = Math.min(i0 + 1, totalPts - 1);
        const f = rawIdx - i0;
        const p0 = path[i0];
        const p1 = path[i1];
        p.targetPosition = [
          p0[0] + (p1[0] - p0[0]) * f,
          p0[1] + (p1[1] - p0[1]) * f,
          p0[2] + (p1[2] - p0[2]) * f,
        ];
      }
    }

    const posArr = posAttrRef.current.array as Float32Array;
    const colArr = colorAttrRef.current?.array as Float32Array | undefined;
    const sizeArr = sizeAttrRef.current?.array as Float32Array | undefined;

    for (let i = 0; i < snap.length; i++) {
      const p = snap[i];
      const ox = prevPositionsRef.current ? prevPositionsRef.current[3 * i] : p.targetPosition[0];
      const oy = prevPositionsRef.current ? prevPositionsRef.current[3 * i + 1] : p.targetPosition[1];
      const oz = prevPositionsRef.current ? prevPositionsRef.current[3 * i + 2] : p.targetPosition[2];
      const x = lerp(ox, p.targetPosition[0], easeT);
      const y = lerp(oy, p.targetPosition[1], easeT);
      const z = lerp(oz, p.targetPosition[2], easeT);
      p.position = [x, y, z];
      posArr[3 * i] = x; posArr[3 * i + 1] = y; posArr[3 * i + 2] = z;

      if (colArr) {
        let alpha = 1;
        if (transitionT < 1) alpha = 0.3 + 0.7 * transitionT;
        if (interactionMode === 'play') {
          const flicker = 0.85 + 0.15 * Math.sin(now * 0.01 + i * 0.37) + 0.08 * (Math.random() - 0.5);
          alpha *= Math.max(0.5, Math.min(1.15, flicker));
        }
        if (selectedKnotId && selectedKnotId !== p.knotId) alpha *= 0.3;
        colArr[4 * i + 3] = alpha;
      }

      if (sizeArr) {
        let s = p.size;
        if (selectedKnotId === p.knotId) s *= 1.4;
        sizeArr[i] = s;
      }
    }
    posAttrRef.current.needsUpdate = true;
    if (colorAttrRef.current) colorAttrRef.current.needsUpdate = true;
    if (sizeAttrRef.current) sizeAttrRef.current.needsUpdate = true;

    for (const k of topologyData.knots) {
      const mesh = highlightsRef.current[k.id];
      if (!mesh) continue;
      const c = knotCenters[k.id] ?? k.center;
      mesh.position.set(c[0], c[1], c[2]);
      mesh.visible = selectedKnotId === k.id;
      const scale = 1 + 0.08 * Math.sin(now * 0.004);
      mesh.scale.setScalar(scale);
    }

    for (const k of topologyData.knots) {
      const line = staticPathRefs.current[k.id];
      if (!line) continue;
      const mat = line.material as THREE.LineBasicMaterial;
      if (selectedKnotId && selectedKnotId !== k.id) {
        mat.opacity = 0.1;
      } else if (selectedKnotId === k.id) {
        mat.opacity = 0.7;
      } else {
        mat.opacity = 0.35;
      }
    }
  });

  useEffect(() => {
    const canvas = gl.domElement;
    const handlePointerDown = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      if (particlesRef.current) {
        const hits = raycaster.intersectObject(particlesRef.current, false);
        if (hits.length > 0) {
          const idx = hits[0].index ?? 0;
          const p = particlesSnapshotRef.current[idx];
          if (p) {
            onKnotSelect(selectedKnotId === p.knotId ? null : p.knotId);
            if (interactionMode === 'edit') {
              const worldPt = hits[0].point.clone();
              const plane = new THREE.Plane();
              const normal = new THREE.Vector3();
              camera.getWorldDirection(normal);
              plane.setFromNormalAndCoplanarPoint(normal.negate(), worldPt);
              draggingKnotRef.current = {
                id: p.knotId,
                offset: new THREE.Vector3().subVectors(
                  worldPt,
                  new THREE.Vector3(
                    knotCenters[p.knotId]?.[0] ?? 0,
                    knotCenters[p.knotId]?.[1] ?? 0,
                    knotCenters[p.knotId]?.[2] ?? 0,
                  ),
                ),
                plane,
              };
            }
            return;
          }
        }
      }
      if (ev.button === 0 && !draggingKnotRef.current) {
        onKnotSelect(null);
      }
    };
    const handlePointerMove = (ev: PointerEvent) => {
      if (!draggingKnotRef.current) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(draggingKnotRef.current.plane, hit)) {
        const final = hit.sub(draggingKnotRef.current.offset);
        onKnotCenterChange(draggingKnotRef.current.id, [final.x, final.y, final.z]);
      }
    };
    const handlePointerUp = () => { draggingKnotRef.current = null; };
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl, camera, raycaster, pointer, onKnotSelect, selectedKnotId, interactionMode, knotCenters, onKnotCenterChange]);

  const staticPaths = useMemo(() => {
    return topologyData.knots.map(k => {
      const { positions, colors, vertexCount } = buildStaticPathGeometry(topologyData.pathCache, k);
      return { k, positions, colors, vertexCount };
    });
  }, [topologyData]);

  const positionsInit = useMemo(() => {
    const count = Math.max(1, topologyData.particles.length);
    return new Float32Array(count * 3);
  }, [topologyData.particles.length]);

  return (
    <group>
      <points ref={particlesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positionsInit.length / 3} array={positionsInit} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors={false}
          vertexShader={`
            attribute vec4 color;
            attribute float aSize;
            varying vec4 vColor;
            void main() {
              vColor = color;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_Position = projectionMatrix * mv;
              gl_PointSize = aSize * 780.0 / max(0.1, -mv.z);
            }
          `}
          fragmentShader={`
            varying vec4 vColor;
            void main() {
              vec2 uv = gl_PointCoord - vec2(0.5);
              float d = length(uv);
              if (d > 0.5) discard;
              float glow = smoothstep(0.5, 0.0, d);
              float core = smoothstep(0.22, 0.0, d);
              vec3 col = vColor.rgb * (0.55 * glow + 0.85 * core);
              float a = min(1.0, glow * vColor.a + core * 0.6);
              gl_FragColor = vec4(col, a);
            }
          `}
        />
      </points>

      {staticPaths.map(({ k, positions, colors, vertexCount }) => (
        <lineSegments
          key={`path-${k.id}`}
          ref={el => { if (el) staticPathRefs.current[k.id] = el; }}
          frustumCulled={false}
        >
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={vertexCount} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={vertexCount} array={colors} itemSize={4} />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={0.35}
          />
        </lineSegments>
      ))}

      {topologyData.knots.map(k => (
        <mesh
          key={`hl-${k.id}`}
          ref={el => { if (el) highlightsRef.current[k.id] = el; }}
          visible={selectedKnotId === k.id}
          position={knotCenters[k.id] ?? k.center}
        >
          <ringGeometry args={[2.9, 3.1, 64]} />
          <meshBasicMaterial
            color={k.colorHex}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function SceneContent({
  topologyData,
  speed,
  interactionMode,
  selectedKnotId,
  onKnotSelect,
  knotCenters,
  onKnotCenterChange,
  autoRotate,
  onFpsUpdate,
  onCaptureRefReady,
}: Omit<ParticleSystemProps, 'topologyData'> & { topologyData: TopologyResult | null; autoRotate: boolean }) {
  return (
    <>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={6}
        maxDistance={40}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
      />
      <ambientLight intensity={0.6} color={0x404070} />
      <pointLight position={[10, 6, 10]} intensity={1.3} color={0x00d4ff} distance={50} />
      <pointLight position={[-10, 5, -8]} intensity={1.1} color={0xff2d95} distance={50} />
      <pointLight position={[6, -8, -10]} intensity={1.0} color={0x3dffa2} distance={50} />
      <pointLight position={[-6, -5, 8]} intensity={0.9} color={0xffb347} distance={50} />

      <Stars radius={160} depth={80} count={3500} factor={4} saturation={0.25} fade speed={0.3} />

      {topologyData && (
        <ParticleSystem
          topologyData={topologyData}
          speed={speed}
          interactionMode={interactionMode}
          selectedKnotId={selectedKnotId}
          onKnotSelect={onKnotSelect}
          knotCenters={knotCenters}
          onKnotCenterChange={onKnotCenterChange}
          onFpsUpdate={onFpsUpdate}
          onCaptureRefReady={onCaptureRefReady}
        />
      )}
    </>
  );
}

const Scene3D = forwardRef<Scene3DHandle, Scene3DProps>(function Scene3D(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureFnRef = useRef<(() => string | null) | null>(null);
  const [fps, setFps] = useState(60);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    captureScreenshot: () => {
      if (captureFnRef.current) return captureFnRef.current();
      if (canvasRef.current) {
        try { return canvasRef.current.toDataURL('image/png'); } catch { return null; }
      }
      return null;
    },
  }));

  const onCaptureRefReady = (fn: () => string | null) => { captureFnRef.current = fn; };

  return (
    <>
      <Canvas
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 10], fov: 55, near: 0.1, far: 400 }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); canvasRef.current = gl.domElement; }}
        dpr={[1, 1.75]}
      >
        <SceneContent {...props} onFpsUpdate={setFps} onCaptureRefReady={onCaptureRefReady} />
      </Canvas>
      <div className="fps-counter">FPS {fps.toString().padStart(2, '0')}</div>
    </>
  );
});

export default Scene3D;
