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

const TRANSITION_DURATION = 0.3;

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
  const groupsRef = useRef<Record<string, THREE.LineSegments>>({});
  const highlightsRef = useRef<Record<string, THREE.Mesh>>({});
  const transitionStartRef = useRef<number>(-1);
  const prevPositionsRef = useRef<Float32Array | null>(null);
  const particlesSnapshotRef = useRef<any[]>([]);
  const pathCacheSnapRef = useRef<Record<string, [number, number, number][]>>({});
  const lastFrameTime = useRef<number>(performance.now());
  const fpsAccumulator = useRef<{ count: number; sum: number }>({ count: 0, sum: 0 });
  const trailRingRef = useRef<Record<string, { buffer: Float32Array; colors: Float32Array; head: number; count: number; capacity: number }>>({});
  const [, forceRender] = useState(0);

  const { camera, gl, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const draggingKnotRef = useRef<{ id: string; offset: THREE.Vector3; plane: THREE.Plane } | null>(null);

  const trailCapacity = 360;

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
    pathCacheSnapRef.current = { ...topologyData.pathCache };

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
        colors[4 * i] = r;
        colors[4 * i + 1] = g;
        colors[4 * i + 2] = b;
        colors[4 * i + 3] = 1.0;
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

    for (const k of topologyData.knots) {
      if (!trailRingRef.current[k.id]) {
        const cap = trailCapacity;
        trailRingRef.current[k.id] = {
          buffer: new Float32Array(cap * 6),
          colors: new Float32Array(cap * 8),
          head: 0,
          count: 0,
          capacity: cap,
        };
      }
    }
    const validIds = new Set(topologyData.knots.map(k => k.id));
    for (const id of Object.keys(trailRingRef.current)) {
      if (!validIds.has(id)) {
        delete trailRingRef.current[id];
      }
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
    const easeT = easeOutBack(transitionT);

    const baseProgress = 0.12 * speed * delta;
    const perKnotProgressOffsets: Record<string, number> = {
      'knot-0': baseProgress,
      'knot-1': -baseProgress * 0.9,
      'knot-2': baseProgress * 1.1,
      'knot-3': -baseProgress,
    };

    for (const p of snap) {
      const dp = perKnotProgressOffsets[p.knotId] ?? baseProgress;
      let prog = (p.pathProgress + dp) % 1;
      if (prog < 0) prog += 1;
      p.pathProgress = prog;
      const samples = 400;
      const path = pathCacheSnapRef.current[p.knotId];
      if (path) {
        const c = knotCenters[p.knotId];
        const rawIdx = prog * samples;
        const i0 = Math.floor(rawIdx) % samples;
        const i1 = (i0 + 1) % samples;
        const f = rawIdx - Math.floor(rawIdx);
        const p0 = path[i0];
        const p1 = path[i1];
        const origC = topologyData.pathCache[p.knotId][i0];
        const dx = c ? c[0] - origC[0] : 0;
        const dy = c ? c[1] - origC[1] : 0;
        const dz = c ? c[2] - origC[2] : 0;
        p.targetPosition = [
          (p0[0] + (p1[0] - p0[0]) * f) + dx,
          (p0[1] + (p1[1] - p0[1]) * f) + dy,
          (p0[2] + (p1[2] - p0[2]) * f) + dz,
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
      posArr[3 * i] = x;
      posArr[3 * i + 1] = y;
      posArr[3 * i + 2] = z;

      if (colArr) {
        let alpha = 1;
        if (transitionT < 1) {
          alpha = 0.3 + 0.7 * transitionT;
        }
        if (interactionMode === 'play') {
          const flicker = 0.85 + 0.15 * Math.sin(now * 0.01 + i * 0.37) + 0.08 * (Math.random() - 0.5);
          alpha *= Math.max(0.5, Math.min(1.15, flicker));
        }
        if (selectedKnotId && selectedKnotId !== p.knotId) {
          alpha *= 0.3;
        }
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
      const ring = trailRingRef.current[k.id];
      if (!ring) continue;
      const knotParticles: any[] = [];
      for (let i = 0; i < snap.length; i++) {
        if (snap[i].knotId === k.id) knotParticles.push(snap[i]);
      }
      if (knotParticles.length < 2) continue;
      const step = Math.max(1, Math.floor(knotParticles.length / 4));
      for (let s = 0; s < knotParticles.length; s += step) {
        const sp = knotParticles[s];
        const nxt = knotParticles[(s + 1) % knotParticles.length];
        const a = ring.head;
        ring.buffer[6 * a] = sp.position[0];
        ring.buffer[6 * a + 1] = sp.position[1];
        ring.buffer[6 * a + 2] = sp.position[2];
        ring.buffer[6 * a + 3] = nxt.position[0];
        ring.buffer[6 * a + 4] = nxt.position[1];
        ring.buffer[6 * a + 5] = nxt.position[2];
        const r = ((k.colorHex >> 16) & 255) / 255;
        const g = ((k.colorHex >> 8) & 255) / 255;
        const b = (k.colorHex & 255) / 255;
        const selectedMul = selectedKnotId && selectedKnotId !== k.id ? 0.25 : 1;
        ring.colors[8 * a] = r;
        ring.colors[8 * a + 1] = g;
        ring.colors[8 * a + 2] = b;
        ring.colors[8 * a + 3] = 0.55 * selectedMul;
        ring.colors[8 * a + 4] = r;
        ring.colors[8 * a + 5] = g;
        ring.colors[8 * a + 6] = b;
        ring.colors[8 * a + 7] = 0.55 * selectedMul;
        ring.head = (a + 1) % ring.capacity;
        if (ring.count < ring.capacity) ring.count++;
      }

      const line = groupsRef.current[k.id];
      if (line) {
        const lgeo = line.geometry as THREE.BufferGeometry;
        const posAttr = lgeo.attributes.position as THREE.BufferAttribute;
        const colAttr = lgeo.attributes.color as THREE.BufferAttribute;
        const lposArr = posAttr.array as Float32Array;
        const lcolArr = colAttr.array as Float32Array;
        const cap = ring.capacity;
        for (let i = 0; i < cap; i++) {
          const ageIdx = (ring.head - ring.count + i + cap) % cap;
          const relative = ring.count === 0 ? 0 : i / ring.count;
          lposArr[6 * i] = ring.buffer[6 * ageIdx];
          lposArr[6 * i + 1] = ring.buffer[6 * ageIdx + 1];
          lposArr[6 * i + 2] = ring.buffer[6 * ageIdx + 2];
          lposArr[6 * i + 3] = ring.buffer[6 * ageIdx + 3];
          lposArr[6 * i + 4] = ring.buffer[6 * ageIdx + 4];
          lposArr[6 * i + 5] = ring.buffer[6 * ageIdx + 5];
          const fade = Math.pow(relative, 1.6);
          const baseAlpha = ring.colors[8 * ageIdx + 3] * fade;
          lcolArr[8 * i] = ring.colors[8 * ageIdx];
          lcolArr[8 * i + 1] = ring.colors[8 * ageIdx + 1];
          lcolArr[8 * i + 2] = ring.colors[8 * ageIdx + 2];
          lcolArr[8 * i + 3] = baseAlpha;
          lcolArr[8 * i + 4] = ring.colors[8 * ageIdx + 4];
          lcolArr[8 * i + 5] = ring.colors[8 * ageIdx + 5];
          lcolArr[8 * i + 6] = ring.colors[8 * ageIdx + 6];
          lcolArr[8 * i + 7] = baseAlpha;
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        lgeo.setDrawRange(0, ring.count * 2);
      }
    }

    for (const k of topologyData.knots) {
      const mesh = highlightsRef.current[k.id];
      if (!mesh) continue;
      const c = knotCenters[k.id] ?? k.center;
      mesh.position.set(c[0], c[1], c[2]);
      mesh.visible = selectedKnotId === k.id;
      const scale = 1 + 0.08 * Math.sin(now * 0.004);
      mesh.scale.setScalar(scale);
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
        onKnotCenterChange(
          draggingKnotRef.current.id,
          [final.x, final.y, final.z],
        );
      }
    };
    const handlePointerUp = () => {
      draggingKnotRef.current = null;
    };
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl, camera, raycaster, pointer, onKnotSelect, selectedKnotId, interactionMode, knotCenters, onKnotCenterChange]);

  const trails = useMemo(() => {
    return topologyData.knots.map(k => {
      const positions = new Float32Array(trailCapacity * 6);
      const colors = new Float32Array(trailCapacity * 8);
      const r = ((k.colorHex >> 16) & 255) / 255;
      const g = ((k.colorHex >> 8) & 255) / 255;
      const b = (k.colorHex & 255) / 255;
      for (let i = 0; i < trailCapacity; i++) {
        colors[8 * i] = r; colors[8 * i + 1] = g; colors[8 * i + 2] = b; colors[8 * i + 3] = 0;
        colors[8 * i + 4] = r; colors[8 * i + 5] = g; colors[8 * i + 6] = b; colors[8 * i + 7] = 0;
      }
      return { k, positions, colors };
    });
  }, [topologyData.knots]);

  const positionsInit = useMemo(() => {
    const count = Math.max(1, topologyData.particles.length);
    return new Float32Array(count * 3);
  }, [topologyData.particles.length]);

  return (
    <group>
      <points
        ref={particlesRef}
        frustumCulled={false}
      >
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

      {trails.map(({ k, positions, colors }) => (
        <lineSegments
          key={k.id}
          ref={el => { if (el) groupsRef.current[k.id] = el; }}
          frustumCulled={false}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={colors.length / 4}
              array={colors}
              itemSize={4}
            />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            linewidth={1}
            opacity={1}
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

      <Stars
        radius={160}
        depth={80}
        count={3500}
        factor={4}
        saturation={0.25}
        fade
        speed={0.3}
      />

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
        try {
          return canvasRef.current.toDataURL('image/png');
        } catch (e) {
          console.error(e);
          return null;
        }
      }
      return null;
    },
  }));

  const onCaptureRefReady = (fn: () => string | null) => {
    captureFnRef.current = fn;
  };

  return (
    <>
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0, 14], fov: 55, near: 0.1, far: 400 }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          canvasRef.current = gl.domElement;
        }}
        dpr={[1, 1.75]}
      >
        <SceneContent
          {...props}
          onFpsUpdate={setFps}
          onCaptureRefReady={onCaptureRefReady}
        />
      </Canvas>
      <div className="fps-counter">FPS {fps.toString().padStart(2, '0')}</div>
    </>
  );
});

export default Scene3D;
