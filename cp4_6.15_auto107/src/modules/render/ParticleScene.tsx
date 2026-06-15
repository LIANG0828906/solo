import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createUniverse,
  MAX_TRAJECTORY_LENGTH,
  evolveParticleWriteBuffers,
  particleMatchesFilter,
} from '../data/ParticleGenerator';
import { useUniverseStore } from '../../store/universeStore';

const PARTICLE_COUNT = 5000;
const LINE_SEGS_PER_PARTICLE = MAX_TRAJECTORY_LENGTH - 1;

export default function ParticleScene() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const haloInnerRef = useRef<THREE.Points>(null);
  const haloOuterRef = useRef<THREE.Points>(null);
  const haloInnerMaterial = useRef<THREE.ShaderMaterial | null>(null);
  const haloOuterMaterial = useRef<THREE.ShaderMaterial | null>(null);
  const particleMaterial = useRef<THREE.ShaderMaterial | null>(null);
  const lineMaterial = useRef<THREE.ShaderMaterial | null>(null);

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const mouseDownPos = useRef(new THREE.Vector2());
  const dragStartScreen = useRef<{ x: number; y: number } | null>(null);
  const elapsedTime = useRef(0);
  const frameCount = useRef(0);
  const { camera, gl } = useThree();

  const {
    setInitialParticles,
    setAnimationPhase,
    setTimeProgress,
    setAnimationTime,
    selectParticle,
    clearSelection,
    selectParticlesInBox,
    setBoxSelection,
    setIsBoxSelecting,
  } = useUniverseStore();

  const posAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const colAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const sizeAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const opacityAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const linePosAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const lineColAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const haloPosAttrRef = useRef<THREE.BufferAttribute | null>(null);

  const posBufferRef = useRef<Float32Array | null>(null);
  const colorBufferRef = useRef<Float32Array | null>(null);
  const sizeBufferRef = useRef<Float32Array | null>(null);
  const opacityBufferRef = useRef<Float32Array | null>(null);
  const linePosBufferRef = useRef<Float32Array | null>(null);
  const lineColorBufferRef = useRef<Float32Array | null>(null);
  const haloPosBufferRef = useRef<Float32Array>(new Float32Array(0));
  const haloIdBufferRef = useRef<Uint32Array>(new Uint32Array(0));
  const idToIndexRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const particles = createUniverse(PARTICLE_COUNT);
    const idMap = new Map<string, number>();
    particles.forEach((p, i) => idMap.set(p.id, i));
    idToIndexRef.current = idMap;

    const N = particles.length;
    const posBuf = new Float32Array(N * 3);
    const colBuf = new Float32Array(N * 3);
    const sizeBuf = new Float32Array(N);
    const opacityBuf = new Float32Array(N);
    const linePosBuf = new Float32Array(N * LINE_SEGS_PER_PARTICLE * 6);
    const lineColBuf = new Float32Array(N * LINE_SEGS_PER_PARTICLE * 8);
    posBufferRef.current = posBuf;
    colorBufferRef.current = colBuf;
    sizeBufferRef.current = sizeBuf;
    opacityBufferRef.current = opacityBuf;
    linePosBufferRef.current = linePosBuf;
    lineColorBufferRef.current = lineColBuf;

    requestAnimationFrame(() => {
      const pointGeo = pointsRef.current?.geometry;
      if (pointGeo) {
        pointGeo.setAttribute('position', new THREE.BufferAttribute(posBuf, 3));
        pointGeo.setAttribute('color', new THREE.BufferAttribute(colBuf, 3));
        pointGeo.setAttribute('aSize', new THREE.BufferAttribute(sizeBuf, 1));
        pointGeo.setAttribute('aOpacity', new THREE.BufferAttribute(opacityBuf, 1));
        posAttrRef.current = pointGeo.getAttribute('position') as THREE.BufferAttribute;
        colAttrRef.current = pointGeo.getAttribute('color') as THREE.BufferAttribute;
        sizeAttrRef.current = pointGeo.getAttribute('aSize') as THREE.BufferAttribute;
        opacityAttrRef.current = pointGeo.getAttribute('aOpacity') as THREE.BufferAttribute;
      }
      const lineGeo = linesRef.current?.geometry;
      if (lineGeo) {
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePosBuf, 3));
        lineGeo.setAttribute('aLineColor', new THREE.BufferAttribute(lineColBuf, 4));
        linePosAttrRef.current = lineGeo.getAttribute('position') as THREE.BufferAttribute;
        lineColAttrRef.current = lineGeo.getAttribute('aLineColor') as THREE.BufferAttribute;
      }
    });

    setInitialParticles(particles);
    setAnimationPhase('idle');
    setTimeout(() => setAnimationPhase('explosion'), 800);
  }, [setInitialParticles, setAnimationPhase]);

  useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.shiftKey) {
        setIsBoxSelecting(true);
        dragStartScreen.current = { x: e.clientX, y: e.clientY };
        setBoxSelection({
          start: { x: e.clientX, y: e.clientY },
          end: { x: e.clientX, y: e.clientY },
        });
      } else {
        mouseDownPos.current.set(e.clientX, e.clientY);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const state = useUniverseStore.getState();
      if (state.isBoxSelecting && dragStartScreen.current) {
        setBoxSelection({
          start: dragStartScreen.current,
          end: { x: e.clientX, y: e.clientY },
        });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const state = useUniverseStore.getState();

      if (state.isBoxSelecting && dragStartScreen.current) {
        const rect = domElement.getBoundingClientRect();
        const ndcStart = new THREE.Vector2(
          ((dragStartScreen.current.x - rect.left) / rect.width) * 2 - 1,
          -((dragStartScreen.current.y - rect.top) / rect.height) * 2 + 1
        );
        const ndcEnd = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const minNdc = new THREE.Vector2(
          Math.min(ndcStart.x, ndcEnd.x),
          Math.min(ndcStart.y, ndcEnd.y)
        );
        const maxNdc = new THREE.Vector2(
          Math.max(ndcStart.x, ndcEnd.x),
          Math.max(ndcStart.y, ndcEnd.y)
        );
        const selectedIds: string[] = [];
        const particles = state.initialParticles;
        const pos = posBufferRef.current;
        if (pos) {
          const v = new THREE.Vector3();
          for (let i = 0; i < particles.length; i++) {
            v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
            v.project(camera);
            if (
              v.x >= minNdc.x &&
              v.x <= maxNdc.x &&
              v.y >= minNdc.y &&
              v.y <= maxNdc.y &&
              v.z >= -1 &&
              v.z <= 1
            ) {
              selectedIds.push(particles[i].id);
            }
          }
        }
        selectParticlesInBox(selectedIds);
        setIsBoxSelecting(false);
        setBoxSelection({ start: null, end: null });
        dragStartScreen.current = null;
        return;
      }

      const movedFar =
        Math.abs(e.clientX - mouseDownPos.current.x) > 3 ||
        Math.abs(e.clientY - mouseDownPos.current.y) > 3;
      if (movedFar) return;

      const rect = domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!pointsRef.current) {
        clearSelection();
        return;
      }
      raycaster.current.setFromCamera(mouse.current, camera);
      raycaster.current.params.Points = { threshold: 1.5 };
      const intersects = raycaster.current.intersectObject(pointsRef.current);
      if (intersects.length > 0) {
        const idx = intersects[0].index;
        if (idx !== undefined) {
          const p = state.initialParticles[idx];
          if (p) selectParticle(p.id);
        }
      } else {
        clearSelection();
      }
    };

    const handleContextMenu = (e: Event) => e.preventDefault();

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [camera, gl.domElement, clearSelection, selectParticle, selectParticlesInBox, setBoxSelection, setIsBoxSelecting]);

  useFrame((_, deltaTime) => {
    frameCount.current++;
    elapsedTime.current += deltaTime;

    const state = useUniverseStore.getState();
    const { initialParticles, filters, selectedParticleIds, animationPhase, timeProgress: userTimeProgress } = state;
    const N = initialParticles.length;
    if (N === 0) return;

    const pb = posBufferRef.current!;
    const cb = colorBufferRef.current!;
    const sb = sizeBufferRef.current!;
    const ob = opacityBufferRef.current!;
    const lpb = linePosBufferRef.current!;
    const lcb = lineColorBufferRef.current!;

    if (pointsRef.current && (!posAttrRef.current || posAttrRef.current.array !== pb)) {
      const g = pointsRef.current.geometry;
      g.setAttribute('position', new THREE.BufferAttribute(pb, 3));
      g.setAttribute('color', new THREE.BufferAttribute(cb, 3));
      g.setAttribute('aSize', new THREE.BufferAttribute(sb, 1));
      g.setAttribute('aOpacity', new THREE.BufferAttribute(ob, 1));
      posAttrRef.current = g.getAttribute('position') as THREE.BufferAttribute;
      colAttrRef.current = g.getAttribute('color') as THREE.BufferAttribute;
      sizeAttrRef.current = g.getAttribute('aSize') as THREE.BufferAttribute;
      opacityAttrRef.current = g.getAttribute('aOpacity') as THREE.BufferAttribute;
      if (frameCount.current < 3) {
        console.log('[Cosmos] Rebound particle attrs, N=' + N);
      }
    }
    if (linesRef.current && (!linePosAttrRef.current || linePosAttrRef.current.array !== lpb)) {
      const g = linesRef.current.geometry;
      g.setAttribute('position', new THREE.BufferAttribute(lpb, 3));
      g.setAttribute('aLineColor', new THREE.BufferAttribute(lcb, 4));
      linePosAttrRef.current = g.getAttribute('position') as THREE.BufferAttribute;
      lineColAttrRef.current = g.getAttribute('aLineColor') as THREE.BufferAttribute;
    }

    let phase = animationPhase;
    let timeProgress = userTimeProgress;
    let newAnimTime = state.animationTime + deltaTime;

    if (phase === 'explosion') {
      timeProgress = Math.min(1, newAnimTime / 3.0);
      if (newAnimTime >= 3.0) {
        phase = 'expanding';
      }
    } else if (phase === 'expanding') {
      const subT = (newAnimTime - 3.0) / 5.0;
      timeProgress = Math.min(1, 0.55 + subT * 0.45);
      if (newAnimTime >= 8.0) {
        phase = 'stable';
        timeProgress = 1;
        newAnimTime = 8.0;
      }
    }

    if (frameCount.current === 3) {
      if (N > 0) {
        console.log(
          `[Cosmos] F3 Phase=${phase}, animT=${newAnimTime.toFixed(2)}, prog=${timeProgress.toFixed(3)}, p[0].final=(${initialParticles[0].finalPosition.x.toFixed(1)},${initialParticles[0].finalPosition.y.toFixed(1)},${initialParticles[0].finalPosition.z.toFixed(1)})`
        );
      }
    }
    if (frameCount.current === 600) {
      let transitioning = 0;
      let nonZero = 0;
      for (let i = 0; i < N; i++) {
        if (ob[i] > 0.01) nonZero++;
        if (ob[i] < 0.99 && ob[i] > 0.01) transitioning++;
      }
      console.log(
        `[Cosmos] F600 Phase=${phase}, nonZeroOpacity=${nonZero}, transitioning=${transitioning}`
      );
    }

    const dt = Math.min(deltaTime, 0.05);

    type PhaseType = 'idle' | 'explosion' | 'expanding' | 'stable';
    for (let i = 0; i < N; i++) {
      const p = initialParticles[i];
      const matches = particleMatchesFilter(p, filters);
      evolveParticleWriteBuffers(
        i,
        p,
        timeProgress,
        dt,
        phase as PhaseType,
        matches,
        pb,
        cb,
        sb,
        ob,
        lpb,
        lcb
      );
    }

    if (posAttrRef.current) posAttrRef.current.needsUpdate = true;
    if (colAttrRef.current) colAttrRef.current.needsUpdate = true;
    if (sizeAttrRef.current) sizeAttrRef.current.needsUpdate = true;
    if (opacityAttrRef.current) opacityAttrRef.current.needsUpdate = true;
    if (linePosAttrRef.current) linePosAttrRef.current.needsUpdate = true;
    if (lineColAttrRef.current) lineColAttrRef.current.needsUpdate = true;

    const haloCount = selectedParticleIds.length;
    const idMap = idToIndexRef.current;
    let haloChanged = false;

    const prevHaloIds = haloIdBufferRef.current;
    if (prevHaloIds.length !== haloCount) haloChanged = true;
    else {
      for (let i = 0; i < haloCount; i++) {
        const id = selectedParticleIds[i];
        if (idMap.get(id) !== prevHaloIds[i]) {
          haloChanged = true;
          break;
        }
      }
    }

    if (haloChanged) {
      const newIds = new Uint32Array(haloCount);
      const newPos = new Float32Array(haloCount * 3);
      for (let i = 0; i < haloCount; i++) {
        const id = selectedParticleIds[i];
        const idx = idMap.get(id);
        newIds[i] = idx ?? 0;
        if (idx !== undefined) {
          newPos[i * 3] = pb[idx * 3];
          newPos[i * 3 + 1] = pb[idx * 3 + 1];
          newPos[i * 3 + 2] = pb[idx * 3 + 2];
        }
      }
      haloPosBufferRef.current = newPos;
      haloIdBufferRef.current = newIds;

      const newAttr = new THREE.BufferAttribute(newPos, 3);
      if (haloInnerRef.current) {
        haloInnerRef.current.geometry.setAttribute('position', newAttr);
      }
      if (haloOuterRef.current) {
        haloOuterRef.current.geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(newPos.slice(), 3)
        );
      }
    } else {
      const hp = haloPosBufferRef.current;
      for (let i = 0; i < haloCount; i++) {
        const idx = prevHaloIds[i];
        hp[i * 3] = pb[idx * 3];
        hp[i * 3 + 1] = pb[idx * 3 + 1];
        hp[i * 3 + 2] = pb[idx * 3 + 2];
      }
      if (haloInnerRef.current) {
        const a = haloInnerRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
        if (a) a.needsUpdate = true;
      }
      if (haloOuterRef.current) {
        const a = haloOuterRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
        if (a) a.needsUpdate = true;
      }
    }

    const haloTime = elapsedTime.current;
    if (haloInnerMaterial.current) haloInnerMaterial.current.uniforms.time.value = haloTime;
    if (haloOuterMaterial.current) haloOuterMaterial.current.uniforms.time.value = haloTime;

    if (phase !== animationPhase || timeProgress !== userTimeProgress || newAnimTime !== state.animationTime) {
      setAnimationPhase(phase as any);
      setTimeProgress(timeProgress);
      setAnimationTime(newAnimTime);
    }
  });

  const particleGeometryProps = useMemo(() => ({}), []);
  const lineGeometryProps = useMemo(() => ({}), []);
  const haloGeometryProps = useMemo(() => ({}), []);

  return (
    <>
      <points ref={pointsRef} frustumCulled={false} {...particleGeometryProps}>
        <bufferGeometry>
          <bufferAttribute
            ref={(el) => {
              if (el) posAttrRef.current = el;
              else if (posAttrRef.current && posBufferRef.current) {
                // noop
              }
            }}
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={new Float32Array(PARTICLE_COUNT * 3)}
            itemSize={3}
            args={[new Float32Array(PARTICLE_COUNT * 3), 3]}
          />
          <bufferAttribute
            ref={(el) => {
              if (el) colAttrRef.current = el;
            }}
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={new Float32Array(PARTICLE_COUNT * 3)}
            itemSize={3}
            args={[new Float32Array(PARTICLE_COUNT * 3), 3]}
          />
          <bufferAttribute
            ref={(el) => {
              if (el) sizeAttrRef.current = el;
            }}
            attach="attributes-aSize"
            count={PARTICLE_COUNT}
            array={new Float32Array(PARTICLE_COUNT)}
            itemSize={1}
            args={[new Float32Array(PARTICLE_COUNT), 1]}
          />
          <bufferAttribute
            ref={(el) => {
              if (el) opacityAttrRef.current = el;
            }}
            attach="attributes-aOpacity"
            count={PARTICLE_COUNT}
            array={new Float32Array(PARTICLE_COUNT)}
            itemSize={1}
            args={[new Float32Array(PARTICLE_COUNT), 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={(m) => {
            particleMaterial.current = m;
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            attribute float aSize;
            attribute float aOpacity;
            varying vec3 vColor;
            varying float vOpacity;
            void main() {
              vColor = color;
              vOpacity = aOpacity;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = aSize * 1600.0 / -mvPosition.z;
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vOpacity;
            void main() {
              vec2 uv = gl_PointCoord - vec2(0.5);
              float d = length(uv);
              float halo = smoothstep(0.5, 0.15, d);
              float core = smoothstep(0.25, 0.0, d);
              float alpha = (halo * 0.85 + core * 0.7) * vOpacity;
              vec3 col = vColor * (0.85 + core * 0.55);
              if (alpha < 0.01) discard;
              gl_FragColor = vec4(col, alpha);
            }
          `}
          vertexColors
        />
      </points>

      <lineSegments ref={linesRef} frustumCulled={false} {...lineGeometryProps}>
        <bufferGeometry>
          <bufferAttribute
            ref={(el) => {
              if (el) linePosAttrRef.current = el;
            }}
            attach="attributes-position"
            count={PARTICLE_COUNT * LINE_SEGS_PER_PARTICLE * 2}
            array={new Float32Array(PARTICLE_COUNT * LINE_SEGS_PER_PARTICLE * 6)}
            itemSize={3}
            args={[new Float32Array(PARTICLE_COUNT * LINE_SEGS_PER_PARTICLE * 6), 3]}
          />
          <bufferAttribute
            ref={(el) => {
              if (el) lineColAttrRef.current = el;
            }}
            attach="attributes-color"
            count={PARTICLE_COUNT * LINE_SEGS_PER_PARTICLE * 2}
            array={new Float32Array(PARTICLE_COUNT * LINE_SEGS_PER_PARTICLE * 8)}
            itemSize={4}
            args={[new Float32Array(PARTICLE_COUNT * LINE_SEGS_PER_PARTICLE * 8), 4]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={(m) => {
            lineMaterial.current = m;
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            attribute vec4 aLineColor;
            varying vec4 vLineColor;
            void main() {
              vLineColor = aLineColor;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec4 vLineColor;
            void main() {
              gl_FragColor = vLineColor;
              if (gl_FragColor.a < 0.01) discard;
            }
          `}
        />
      </lineSegments>

      <points ref={haloInnerRef} frustumCulled={false} {...haloGeometryProps}>
        <bufferGeometry>
          <bufferAttribute
            ref={(el) => {
              if (el) haloPosAttrRef.current = el;
            }}
            attach="attributes-position"
            count={0}
            array={new Float32Array(0)}
            itemSize={3}
            args={[new Float32Array(0), 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={(m) => {
            haloInnerMaterial.current = m;
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ time: { value: 0 } }}
          vertexShader={`
            uniform float time;
            varying float vPulse;
            void main() {
              vPulse = 0.5 + 0.5 * sin(time * 3.0);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              float s = (14.0 + 4.0 * sin(time * 3.0)) * 1600.0 / -mvPosition.z;
              gl_PointSize = s;
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying float vPulse;
            void main() {
              vec2 uv = gl_PointCoord - vec2(0.5);
              float d = length(uv);
              float ring = smoothstep(0.5, 0.35, d) - smoothstep(0.35, 0.2, d);
              float inner = smoothstep(0.2, 0.0, d);
              float alpha = (ring * 0.9 + inner * 0.3) * (0.4 + 0.35 * vPulse);
              vec3 col = mix(vec3(0.4, 0.95, 1.0), vec3(1.0, 1.0, 1.0), vPulse);
              if (alpha < 0.01) discard;
              gl_FragColor = vec4(col, alpha);
            }
          `}
        />
      </points>

      <points ref={haloOuterRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={0}
            array={new Float32Array(0)}
            itemSize={3}
            args={[new Float32Array(0), 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={(m) => {
            haloOuterMaterial.current = m;
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ time: { value: 0 } }}
          vertexShader={`
            uniform float time;
            varying float vPulse;
            void main() {
              vPulse = 0.5 + 0.5 * sin(time * 2.0 + 1.2);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              float s = (26.0 + 10.0 * sin(time * 2.0 + 1.2)) * 1600.0 / -mvPosition.z;
              gl_PointSize = s;
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying float vPulse;
            void main() {
              vec2 uv = gl_PointCoord - vec2(0.5);
              float d = length(uv);
              float ring = smoothstep(0.5, 0.4, d) - smoothstep(0.4, 0.28, d);
              float alpha = ring * (0.25 + 0.2 * vPulse);
              vec3 col = mix(vec3(0.3, 0.75, 1.0), vec3(0.6, 0.9, 1.0), vPulse);
              if (alpha < 0.01) discard;
              gl_FragColor = vec4(col, alpha);
            }
          `}
        />
      </points>

      <Singularity />
    </>
  );
}

function Singularity() {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const glowMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const tRef = useRef(0);
  const activeRef = useRef(true);

  useEffect(() => {
    const tm = setTimeout(() => {
      activeRef.current = false;
    }, 1200);
    return () => clearTimeout(tm);
  }, []);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;
    const showSingularity = t < 1.0 && activeRef.current;
    const k = Math.max(0, 1 - t);
    if (coreRef.current) coreRef.current.visible = showSingularity;
    if (glowRef.current) glowRef.current.visible = showSingularity;
    if (lightRef.current) lightRef.current.visible = showSingularity;

    if (materialRef.current) {
      materialRef.current.uniforms.glow.value = 0.5 + 0.5 * Math.sin(t * 60);
      materialRef.current.uniforms.time.value = t;
    }
    if (glowMatRef.current) {
      glowMatRef.current.uniforms.k.value = k;
      glowMatRef.current.uniforms.time.value = t;
    }
    if (lightRef.current) {
      lightRef.current.distance = 40 * k;
      lightRef.current.intensity = 5 * k;
      lightRef.current.decay = 2;
    }
    if (coreRef.current) {
      const s = 3 + 25 * (1 - k);
      coreRef.current.scale.setScalar(s);
    }
    if (glowRef.current) {
      const s = 3 + 350 * (1 - k);
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            glow: { value: 1 },
            time: { value: 0 },
          }}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float glow;
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              float r = length(vPosition);
              float core = smoothstep(1.0, 0.3, r);
              float innerBand = 0.6 + 0.4 * sin(time * 20.0 + vPosition.y * 10.0);
              vec3 col = mix(vec3(1.0, 0.95, 0.7), vec3(1.0, 0.4, 0.1), core) * innerBand;
              float fres = pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
              float alpha = (core + fres * 0.6) * glow;
              if (alpha < 0.02) discard;
              gl_FragColor = vec4(col, alpha);
            }
          `}
        />
      </mesh>
      <mesh ref={glowRef} scale={[1, 1, 1]}>
        <sphereGeometry args={[1, 16, 16]} />
        <shaderMaterial
          ref={glowMatRef}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            k: { value: 1 },
            time: { value: 0 },
          }}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float k;
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              float r = length(vPosition);
              float radial = 1.0 - r;
              float colShift = 0.5 + 0.5 * sin(time * 8.0);
              vec3 col = mix(vec3(1.0, 0.8, 0.3), vec3(1.0, 0.3, 0.05), colShift);
              float alpha = pow(max(0.0, radial), 2.2) * k * 0.9;
              if (alpha < 0.01) discard;
              gl_FragColor = vec4(col, alpha);
            }
          `}
        />
      </mesh>
      <pointLight ref={lightRef} color="#ffb470" distance={20} intensity={3} decay={2} />
    </group>
  );
}
