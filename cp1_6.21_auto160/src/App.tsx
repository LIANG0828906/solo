import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { TerrainEditor } from './terrain/TerrainEditor';
import { WavePropagation, WaveFront } from './analysis/WavePropagation';
import { HeatmapRenderer } from './analysis/HeatmapRenderer';
import { useCaveContext } from './context/CaveContext';
import axios from 'axios';

const terrainEditor = new TerrainEditor(4);
const wavePropagation = new WavePropagation();
const heatmapRenderer = new HeatmapRenderer();

interface Preset {
  id: string;
  name: string;
  createdAt: string;
  sourcePosition: { x: number; y: number; z: number };
  sourceFrequency: number;
  sourceIntensity: number;
  wallRoughness: number;
  caveData: number[] | null;
}

function CaveMesh() {
  const { state, dispatch } = useCaveContext();
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.IcosahedronGeometry | null>(null);
  const dragging = useRef<{ vertexIndex: number; plane: THREE.Plane; offset: THREE.Vector3 } | null>(null);
  const selectedRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  const groupRef = useRef<THREE.Group>(null);
  const [selectedVertices, setSelectedVertices] = useState<Set<number>>(new Set());
  const [dragNormal, setDragNormal] = useState<{ origin: THREE.Vector3; dir: THREE.Vector3 } | null>(null);
  const [helperSpherePos, setHelperSpherePos] = useState<THREE.Vector3 | null>(null);
  const initialPositions = useRef<Float32Array | null>(null);

  useEffect(() => {
    const geo = terrainEditor.getGeometry();
    geometryRef.current = geo;
    const positions = new Float32Array(geo.attributes.position.array);
    dispatch({ type: 'SET_CAVE_POSITIONS', payload: positions });
    initialPositions.current = new Float32Array(positions);

    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).vertexColors = true;
    }
  }, [dispatch]);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!geometryRef.current) return;
    e.stopPropagation();
    const point = e.point;
    const nearest = terrainEditor.findNearestVertex(point, 1.5);

    if (nearest >= 0) {
      const normal = terrainEditor.getVertexNormal(nearest);
      const vertexPos = terrainEditor.getVertexPosition(nearest);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, vertexPos);
      const ray = e.ray;
      const intersection = new THREE.Vector3();
      ray.intersectPlane(plane, intersection);
      const offset = vertexPos.clone().sub(intersection || vertexPos);

      const multi = e.shiftKey;
      terrainEditor.selectVertex(nearest, multi);
      const newSelected = new Set(terrainEditor.getSelectedVertices());
      setSelectedVertices(newSelected);

      dragging.current = { vertexIndex: nearest, plane, offset };

      setDragNormal({ origin: vertexPos.clone(), dir: normal.clone() });
      setHelperSpherePos(vertexPos.clone());
    }
  }, []);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !geometryRef.current) return;
    e.stopPropagation();
    const ray = e.ray;
    const intersection = new THREE.Vector3();
    ray.intersectPlane(dragging.current.plane, intersection);
    if (intersection) {
      const newPos = intersection.add(dragging.current.offset);
      const currentPos = terrainEditor.getVertexPosition(dragging.current.vertexIndex);
      const offset = newPos.sub(currentPos);
      terrainEditor.moveSelectedVertices(offset);

      const geo = terrainEditor.getGeometry();
      dispatch({ type: 'SET_CAVE_POSITIONS', payload: new Float32Array(geo.attributes.position.array) });

      const vPos = terrainEditor.getVertexPosition(dragging.current.vertexIndex);
      const vNormal = terrainEditor.getVertexNormal(dragging.current.vertexIndex);
      setDragNormal({ origin: vPos.clone(), dir: vNormal.clone() });
      setHelperSpherePos(vPos.clone());
    }
  }, [dispatch]);

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
    setDragNormal(null);
    setHelperSpherePos(null);
  }, []);

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        geometry={terrainEditor.getGeometry()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <meshStandardMaterial
          color="#5A4A3A"
          vertexColors
          roughness={state.wallRoughness}
          metalness={0.05}
          bumpScale={0.3}
          side={THREE.BackSide}
        />
      </mesh>
      {dragNormal && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array([
                dragNormal.origin.x, dragNormal.origin.y, dragNormal.origin.z,
                dragNormal.origin.x + dragNormal.dir.x * 2,
                dragNormal.origin.y + dragNormal.dir.y * 2,
                dragNormal.origin.z + dragNormal.dir.z * 2,
              ])}
              count={2}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#3B82F6" linewidth={2} />
        </line>
      )}
      {helperSpherePos && (
        <mesh position={helperSpherePos}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#3B82F6" transparent opacity={0.3} />
        </mesh>
      )}
      {Array.from(selectedVertices).map((idx) => {
        const pos = terrainEditor.getVertexPosition(idx);
        return (
          <mesh key={idx} position={pos}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#60A5FA" transparent opacity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

function SoundSource() {
  const { state, dispatch } = useCaveContext();
  const meshRef = useRef<THREE.Mesh>(null);
  const dragging = useRef(false);
  const planeRef = useRef<THREE.Plane>(new THREE.Plane());
  const [glowScale, setGlowScale] = useState(1);

  const position = useMemo(
    () => new THREE.Vector3(state.sourcePosition.x, state.sourcePosition.y, state.sourcePosition.z),
    [state.sourcePosition]
  );

  useFrame((_, delta) => {
    setGlowScale((prev) => 1 + Math.sin(Date.now() * 0.003) * 0.15);
  });

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    dragging.current = true;
    const camera = e.camera;
    const normal = new THREE.Vector3();
    camera.getWorldDirection(normal);
    planeRef.current.setFromNormalAndCoplanarPoint(normal, position);
  }, [position]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    e.stopPropagation();
    const intersection = new THREE.Vector3();
    e.ray.intersectPlane(planeRef.current, intersection);
    if (intersection) {
      dispatch({
        type: 'SET_SOURCE_POSITION',
        payload: { x: intersection.x, y: intersection.y, z: intersection.z },
      });
    }
  }, [dispatch]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={position} scale={glowScale}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.15} />
      </mesh>
      <pointLight position={position} color="#FFD700" intensity={2} distance={8} />
    </group>
  );
}

function WaveFronts() {
  const { state } = useCaveContext();
  const groupRef = useRef<THREE.Group>(null);
  const sourcePos = useMemo(
    () => new THREE.Vector3(state.sourcePosition.x, state.sourcePosition.y, state.sourcePosition.z),
    [state.sourcePosition]
  );

  useFrame((_, delta) => {
    wavePropagation.setSource(sourcePos, state.sourceFrequency, state.sourceIntensity);
    wavePropagation.setRoughness(state.wallRoughness);
    wavePropagation.update(delta);

    if (!groupRef.current) return;
    const waveFronts = wavePropagation.getWaveFronts();

    const children = groupRef.current.children;
    for (let i = children.length - 1; i >= 0; i--) {
      groupRef.current.remove(children[i]);
    }

    for (const wf of waveFronts) {
      if (wf.radius < 0.1) continue;

      const geo = new THREE.SphereGeometry(wf.radius, 24, 24);
      const progress = wf.radius / wf.maxRadius;
      const alpha = wf.isReflection
        ? 0.4 * (1 - progress)
        : 0.6 * (1 - progress);

      const mat = new THREE.MeshBasicMaterial({
        color: wf.isReflection ? 0x00BFFF : new THREE.Color().lerpColors(
          new THREE.Color('#FF4500'),
          new THREE.Color('#FFD700'),
          progress
        ),
        transparent: true,
        opacity: Math.max(0.05, alpha),
        side: THREE.DoubleSide,
        wireframe: wf.isReflection,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(wf.origin);
      groupRef.current.add(mesh);
    }
  });

  return <group ref={groupRef} />;
}

function HeatmapOverlay() {
  const { state } = useCaveContext();
  const meshRef = useRef<THREE.Mesh>(null);
  const updatedRef = useRef(false);

  useFrame(() => {
    const geo = terrainEditor.getGeometry();
    const pressureField = wavePropagation.getPressureField();

    if (pressureField.length > 0 && geo.attributes.color) {
      heatmapRenderer.update(geo.attributes.color as THREE.BufferAttribute, pressureField);
    }
  });

  return null;
}

function ReflectionArcs() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    const waveFronts = wavePropagation.getWaveFronts();
    for (const wf of waveFronts) {
      if (wf.isReflection && wf.reflectedFrom && wf.reflectionNormal && wf.radius > 0.3 && wf.radius < 3) {
        const curve = new THREE.EllipseCurve(0, 0, 0.5, 0.5, 0, Math.PI * 0.5, false, 0);
        const points = curve.getPoints(16);
        const geo = new THREE.BufferGeometry().setFromPoints(
          points.map((p) => new THREE.Vector3(p.x, p.y, 0))
        );
        const mat = new THREE.LineDashedMaterial({
          color: 0x00BFFF,
          transparent: true,
          opacity: 0.4,
          dashSize: 0.1,
          gapSize: 0.05,
        });
        const line = new THREE.Line(geo, mat);
        line.computeLineDistances();
        line.position.copy(wf.reflectedFrom);
        line.lookAt(wf.reflectedFrom.clone().add(wf.reflectionNormal));
        groupRef.current.add(line);
      }
    }
  });

  return <group ref={groupRef} />;
}

function InterferencePattern() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    const waveFronts = wavePropagation.getWaveFronts().filter((w) => !w.isReflection && w.radius > 1);
    if (waveFronts.length < 2) return;

    const sourcePos = waveFronts[0]?.origin;
    if (!sourcePos) return;

    const checkPoints: THREE.Vector3[] = [];
    for (let x = -6; x <= 6; x += 1.5) {
      for (let y = -6; y <= 6; y += 1.5) {
        for (let z = -6; z <= 6; z += 1.5) {
          const p = new THREE.Vector3(x, y, z);
          if (p.length() < 7 && p.length() > 1) {
            checkPoints.push(p);
          }
        }
      }
    }

    const maxShow = 80;
    let shown = 0;
    for (const point of checkPoints) {
      if (shown >= maxShow) break;
      let totalAmp = 0;
      let contributing = 0;
      for (const wf of waveFronts.slice(0, 10)) {
        const dist = point.distanceTo(wf.origin);
        const phaseDist = Math.abs(dist - wf.radius);
        if (phaseDist < 1.5) {
          const amp = Math.cos((dist - wf.radius) * 8) * Math.exp(-0.2 * wf.age);
          totalAmp += amp;
          contributing++;
        }
      }
      if (contributing >= 2) {
        const intensity = Math.abs(totalAmp) / contributing;
        if (intensity > 0.15) {
          const geo = new THREE.SphereGeometry(0.08, 4, 4);
          const mat = new THREE.MeshBasicMaterial({
            color: totalAmp > 0 ? 0xFFFFFF : 0x1E293B,
            transparent: true,
            opacity: Math.min(0.5, intensity),
            depthWrite: false,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.copy(point);
          groupRef.current.add(mesh);
          shown++;
        }
      }
    }
  });

  return <group ref={groupRef} />;
}

function CameraController() {
  const { state } = useCaveContext();
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(20, 20, 20));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const animating = useRef(false);
  const animStartPos = useRef(new THREE.Vector3());
  const animEndPos = useRef(new THREE.Vector3());
  const animProgress = useRef(0);

  const initialCameraPos = useMemo(() => new THREE.Vector3(20, 20, 20), []);
  const initialLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    const src = new THREE.Vector3(state.sourcePosition.x, state.sourcePosition.y, state.sourcePosition.z);

    if (state.viewMode === 'free') {
      animStartPos.current.copy(camera.position);
      animEndPos.current.copy(initialCameraPos);
      animProgress.current = 0;
      animating.current = true;
    } else if (state.viewMode === 'follow') {
      const dir = src.clone().normalize().multiplyScalar(5);
      const camPos = src.clone().add(dir);
      animStartPos.current.copy(camera.position);
      animEndPos.current.copy(camPos);
      targetLookAt.current.copy(src);
      animProgress.current = 0;
      animating.current = true;
    } else if (state.viewMode === 'overhead') {
      const angle = 70 * (Math.PI / 180);
      const dist = 25;
      const camPos = new THREE.Vector3(0, dist * Math.sin(angle), dist * Math.cos(angle));
      animStartPos.current.copy(camera.position);
      animEndPos.current.copy(camPos);
      targetLookAt.current.set(0, 0, 0);
      animProgress.current = 0;
      animating.current = true;
    }
  }, [state.viewMode, state.sourcePosition]);

  useFrame((_, delta) => {
    if (state.viewMode === 'follow') {
      const src = new THREE.Vector3(state.sourcePosition.x, state.sourcePosition.y, state.sourcePosition.z);
      const dir = src.clone().normalize().multiplyScalar(5);
      const camTarget = src.clone().add(dir);
      camera.position.lerp(camTarget, 0.05);
      camera.lookAt(src);
    } else if (animating.current) {
      animProgress.current = Math.min(1, animProgress.current + delta * 2);
      const t = cubicEase(animProgress.current);
      camera.position.lerpVectors(animStartPos.current, animEndPos.current, t);

      if (state.viewMode === 'overhead') {
        camera.lookAt(0, 0, 0);
      }

      if (animProgress.current >= 1) {
        animating.current = false;
      }
    }
  });

  return null;
}

function cubicEase(t: number): number {
  const c1 = 0.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.3} color="#475569" />
      <directionalLight position={[10, 15, 10]} intensity={0.6} color="#94A3B8" />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#64748B" distance={20} />
    </>
  );
}

function Scene() {
  const { state } = useCaveContext();
  const controlsRef = useRef<any>(null);
  const controlsEnabled = state.viewMode === 'free';

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = controlsEnabled;
    }
  }, [controlsEnabled]);

  useEffect(() => {
    const geo = terrainEditor.getGeometry();
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const normalAttr = geo.attributes.normal as THREE.BufferAttribute;
    wavePropagation.setCaveGeometry(
      new Float32Array(posAttr.array),
      new Float32Array(normalAttr.array)
    );
  }, [state.cavePositions]);

  return (
    <>
      <CameraController />
      {controlsEnabled && (
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={50}
        />
      )}
      <SceneLighting />
      <CaveMesh />
      <SoundSource />
      <WaveFronts />
      <ReflectionArcs />
      <InterferencePattern />
      <HeatmapOverlay />
      <Stars radius={60} depth={50} count={800} factor={2} saturation={0} fade speed={0} />
    </>
  );
}

function ControlPanel() {
  const { state, dispatch } = useCaveContext();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    try {
      const res = await axios.get('/api/presets');
      setPresets(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleSavePreset = useCallback(async () => {
    if (!presetName.trim()) return;
    const caveData = state.cavePositions ? Array.from(state.cavePositions) : null;
    try {
      await axios.post('/api/presets', {
        name: presetName.trim(),
        caveData,
        sourcePosition: state.sourcePosition,
        sourceFrequency: state.sourceFrequency,
        sourceIntensity: state.sourceIntensity,
        wallRoughness: state.wallRoughness,
      });
      setPresetName('');
      loadPresets();
    } catch {}
  }, [presetName, state, loadPresets]);

  const handleLoadPreset = useCallback(async (id: string) => {
    setLoading(id);
    try {
      const res = await axios.get(`/api/presets/${id}`);
      const data = res.data;
      if (data.caveData) {
        terrainEditor.applyCaveData(new Float32Array(data.caveData));
      }
      dispatch({
        type: 'LOAD_PRESET',
        payload: {
          cavePositions: data.caveData ? new Float32Array(data.caveData) : null,
          sourcePosition: data.sourcePosition,
          sourceFrequency: data.sourceFrequency,
          sourceIntensity: data.sourceIntensity,
          wallRoughness: data.wallRoughness,
          viewMode: state.viewMode,
        },
      });
    } catch {} finally {
      setLoading(null);
    }
  }, [dispatch, state.viewMode]);

  const handleDeletePreset = useCallback(async (id: string) => {
    try {
      await axios.delete(`/api/presets/${id}`);
      loadPresets();
    } catch {}
    setDeleteConfirm(null);
  }, [loadPresets]);

  const handleResetView = useCallback(() => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'free' });
  }, [dispatch]);

  const handleFrequencyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const freq = Math.round(200 * Math.pow(10, (val / 100) * Math.log10(2000 / 200)));
    dispatch({ type: 'SET_SOURCE_FREQUENCY', payload: freq });
  }, [dispatch]);

  const frequencySliderValue = useMemo(() => {
    return Math.round((Math.log10(state.sourceFrequency / 200) / Math.log10(10)) * 100);
  }, [state.sourceFrequency]);

  return (
    <div style={{
      position: 'fixed',
      left: 16,
      top: 16,
      bottom: 16,
      width: 280,
      background: 'rgba(15,23,42,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 12,
      padding: 20,
      color: '#E2E8F0',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 13,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      overflowY: 'auto',
      zIndex: 100,
      border: '1px solid rgba(59,130,246,0.15)',
    }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#F8FAFC', letterSpacing: 1 }}>
        溶洞回声控制
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ color: '#94A3B8', fontSize: 12 }}>声源频率: {state.sourceFrequency}Hz</label>
        <input
          type="range"
          min={0}
          max={100}
          value={frequencySliderValue}
          onChange={handleFrequencyChange}
          style={{
            width: '100%',
            accentColor: '#3B82F6',
            background: 'linear-gradient(to right, #1E293B, #3B82F6)',
            height: 6,
            borderRadius: 3,
            cursor: 'pointer',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ color: '#94A3B8', fontSize: 12 }}>声源强度: {state.sourceIntensity}dB</label>
        <input
          type="range"
          min={50}
          max={120}
          step={1}
          value={state.sourceIntensity}
          onChange={(e) => dispatch({ type: 'SET_SOURCE_INTENSITY', payload: Number(e.target.value) })}
          style={{
            width: '100%',
            accentColor: '#3B82F6',
            background: 'linear-gradient(to right, #1E293B, #3B82F6)',
            height: 6,
            borderRadius: 3,
            cursor: 'pointer',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ color: '#94A3B8', fontSize: 12 }}>壁面粗糙度: {state.wallRoughness.toFixed(1)}</label>
        <input
          type="range"
          min={0.1}
          max={0.9}
          step={0.1}
          value={state.wallRoughness}
          onChange={(e) => dispatch({ type: 'SET_WALL_ROUGHNESS', payload: Number(e.target.value) })}
          style={{
            width: '100%',
            accentColor: '#3B82F6',
            background: 'linear-gradient(to right, #1E293B, #3B82F6)',
            height: 6,
            borderRadius: 3,
            cursor: 'pointer',
          }}
        />
      </div>

      <button
        onClick={handleResetView}
        style={{
          padding: '10px 16px',
          background: '#1E293B',
          color: '#E2E8F0',
          border: '1px solid #334155',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          transition: 'transform 0.1s, background 0.2s',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        重置视角
      </button>

      <div style={{ borderTop: '1px solid rgba(51,65,85,0.5)', paddingTop: 12 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#CBD5E1' }}>保存预设</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="预设名称"
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#E2E8F0',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSavePreset}
            style={{
              padding: '8px 16px',
              background: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              transition: 'background 0.2s, transform 0.1s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2563EB')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#3B82F6')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            保存
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid rgba(51,65,85,0.5)', paddingTop: 12 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#CBD5E1' }}>已保存预设</h3>
        {presets.length === 0 && (
          <div style={{ color: '#64748B', fontSize: 12 }}>暂无预设</div>
        )}
        {presets.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 10px',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background 0.2s',
              marginBottom: 4,
              position: 'relative',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={() => handleLoadPreset(p.id)}
          >
            {loading === p.id && (
              <div style={{
                width: 16, height: 16, border: '2px solid rgba(59,130,246,0.3)',
                borderTopColor: '#3B82F6', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', marginRight: 8, flexShrink: 0,
              }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                {new Date(p.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
            {deleteConfirm === p.id ? (
              <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeletePreset(p.id); }}
                  style={{
                    padding: '2px 6px', background: '#EF4444', color: '#FFF', border: 'none',
                    borderRadius: 4, fontSize: 11, cursor: 'pointer',
                  }}
                >
                  确认
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                  style={{
                    padding: '2px 6px', background: '#334155', color: '#CBD5E1', border: 'none',
                    borderRadius: 4, fontSize: 11, cursor: 'pointer',
                  }}
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p.id); }}
                style={{
                  background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer',
                  fontSize: 16, lineHeight: 1, padding: 4, opacity: 0.6,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(51,65,85,0.5)', paddingTop: 12 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#CBD5E1' }}>视角模式</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <ViewModeButton
            active={state.viewMode === 'free'}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'free' })}
            title="自由视角"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
          />
          <ViewModeButton
            active={state.viewMode === 'follow'}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'follow' })}
            title="声源跟随"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            }
          />
          <ViewModeButton
            active={state.viewMode === 'overhead'}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'overhead' })}
            title="俯瞰视角"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 3v18" />
              </svg>
            }
          />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1E293B;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 8px rgba(59,130,246,0.6);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          width: 20px;
          height: 20px;
        }
      `}</style>
    </div>
  );
}

function ViewModeButton({
  active,
  onClick,
  title,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        background: active ? 'rgba(59,130,246,0.15)' : '#0F172A',
        border: active ? '2px solid #3B82F6' : '2px solid #334155',
        borderRadius: 8,
        cursor: 'pointer',
        color: active ? '#3B82F6' : '#94A3B8',
        transition: 'all 0.2s',
      }}
    >
      {icon}
    </button>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}>
      <Canvas
        camera={{ position: [20, 20, 20], fov: 50, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0F172A']} />
        <fog attach="fog" args={['#0F172A', 30, 80]} />
        <Scene />
      </Canvas>
      <ControlPanel />
    </div>
  );
}
