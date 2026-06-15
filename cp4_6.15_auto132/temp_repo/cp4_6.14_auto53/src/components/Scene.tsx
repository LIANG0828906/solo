import { forwardRef, useRef, useEffect, useImperativeHandle, useMemo, useState, createContext } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingBlock } from '../data/buildingData';
import { SunParams, SceneRef } from '../App';

interface SceneProps {
  buildings: BuildingBlock[];
  selectedBuildingId: string | null;
  onBuildingClick: (id: string | null) => void;
  sunParams: SunParams;
  isDragging: boolean;
  onDraggingChange: (v: boolean) => void;
  onBuildingUpdate: (id: string, updates: Partial<BuildingBlock>) => void;
  shadowCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

interface BuildingMeshProps {
  building: BuildingBlock;
  isSelected: boolean;
  onClick: () => void;
  onDragEnd: (newX: number, newZ: number) => void;
  onDragStart: () => void;
  onDragFinish: () => void;
}

const SUN_DISTANCE = 50;
const GROUND_SIZE = 80;
const SHADOW_CAPTURE_SIZE = 1024;

function calculateSunPosition(azimuth: number, altitude: number): [number, number, number] {
  const azimuthRad = (azimuth * Math.PI) / 180;
  const altitudeRad = (altitude * Math.PI) / 180;
  const x = SUN_DISTANCE * Math.cos(altitudeRad) * Math.sin(azimuthRad);
  const y = SUN_DISTANCE * Math.sin(altitudeRad);
  const z = SUN_DISTANCE * Math.cos(altitudeRad) * Math.cos(azimuthRad);
  return [x, y, z];
}

class CriticallyDampedSpring {
  private _current = new THREE.Vector3();
  private _target = new THREE.Vector3();
  private _velocity = new THREE.Vector3();
  private _lambda: number;
  private _settled = false;

  constructor(period: number = 0.2) {
    this._lambda = 4 * Math.PI / period;
  }

  setCurrent(v: THREE.Vector3) {
    this._current.copy(v);
    this._target.copy(v);
    this._velocity.set(0, 0, 0);
    this._settled = true;
  }

  setTarget(v: THREE.Vector3) {
    if (!this._target.equals(v)) {
      this._target.copy(v);
      this._settled = false;
    }
  }

  isSettled() {
    return this._settled;
  }

  update(dt: number): THREE.Vector3 {
    if (this._settled) return this._current;
    const lambda = this._lambda;
    const diff = new THREE.Vector3().subVectors(this._target, this._current);
    const velDiff = this._velocity.clone();
    const step = lambda * dt;
    const exp = Math.exp(-step);
    const v1 = new THREE.Vector3().multiplyVectors(
      diff.clone().multiplyScalar(1 + step).add(velDiff.clone().multiplyScalar(dt)),
      new THREE.Vector3(exp, exp, exp)
    );
    const v2 = new THREE.Vector3().multiplyVectors(
      velDiff.clone().multiplyScalar(-step).add(diff.clone().multiplyScalar(-lambda * lambda * dt)),
      new THREE.Vector3(exp, exp, exp)
    );
    this._current.copy(this._target.clone().sub(v1));
    this._velocity.copy(v2);
    const posTol = 0.0005;
    const velTol = 0.005;
    if (
      Math.abs(diff.x) < posTol && Math.abs(diff.y) < posTol && Math.abs(diff.z) < posTol &&
      Math.abs(this._velocity.x) < velTol && Math.abs(this._velocity.y) < velTol && Math.abs(this._velocity.z) < velTol
    ) {
      this._current.copy(this._target);
      this._velocity.set(0, 0, 0);
      this._settled = true;
    }
    return this._current;
  }
}

function BuildingMesh({ building, isSelected, onClick, onDragEnd, onDragStart, onDragFinish }: BuildingMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dragPlane = useRef<THREE.Plane | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef(new THREE.Vector3());
  const springRef = useRef<CriticallyDampedSpring | null>(null);
  const prevBuildingPos = useRef<[number, number, number]>(building.position);

  if (!springRef.current) {
    springRef.current = new CriticallyDampedSpring(0.2);
    springRef.current.setCurrent(new THREE.Vector3(...building.position));
  }

  useEffect(() => {
    if (!groupRef.current || !springRef.current) return;
    const prev = prevBuildingPos.current;
    const next = building.position;
    const prevDifferent = prev[0] !== next[0] || prev[1] !== next[1] || prev[2] !== next[2];
    if (prevDifferent && !isDragging) {
      if (!springRef.current.isSettled()) {
        springRef.current.setTarget(new THREE.Vector3(...next));
      } else {
        springRef.current.setCurrent(new THREE.Vector3(...prev));
        springRef.current.setTarget(new THREE.Vector3(...next));
      }
    }
    prevBuildingPos.current = [next[0], next[1], next[2]];
  }, [building.position, isDragging]);

  useFrame((_, delta) => {
    if (!groupRef.current || !springRef.current) return;
    const clampedDelta = Math.min(delta, 1 / 30);
    if (!isDragging) {
      const pos = springRef.current.update(clampedDelta);
      const cur = groupRef.current.position;
      cur.x = pos.x;
      cur.y = pos.y;
      cur.z = pos.z;
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    onClick();
    if (!isSelected || !groupRef.current || !springRef.current) return;
    setIsDragging(true);
    onDragStart();
    try { e.target.setPointerCapture(e.pointerId); } catch(_) {}
    dragPlane.current = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = e.point.clone();
    hitPoint.y = 0;
    const currentXZ = new THREE.Vector3(groupRef.current.position.x, 0, groupRef.current.position.z);
    dragOffset.current.copy(currentXZ).sub(hitPoint);
    springRef.current.setCurrent(new THREE.Vector3().copy(groupRef.current.position));
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging || !dragPlane.current || !groupRef.current) return;
    e.stopPropagation();
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(e.pointer, e.camera);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane.current, intersect);
    if (intersect) {
      intersect.add(dragOffset.current);
      groupRef.current.position.set(
        Math.max(-20, Math.min(20, intersect.x)),
        building.position[1],
        Math.max(-20, Math.min(20, intersect.z))
      );
    }
  };

  const handlePointerUp = (e: any) => {
    if (!isDragging || !groupRef.current || !springRef.current) return;
    e.stopPropagation();
    setIsDragging(false);
    onDragFinish();

    const pos = groupRef.current.position;
    const snappedX = Math.round(pos.x * 2) / 2;
    const snappedZ = Math.round(pos.z * 2) / 2;
    const from = new THREE.Vector3(pos.x, building.position[1], pos.z);
    const to = new THREE.Vector3(snappedX, building.position[1], snappedZ);
    springRef.current.setCurrent(from);
    springRef.current.setTarget(to);
    prevBuildingPos.current = [snappedX, building.position[1], snappedZ];
    onDragEnd(snappedX, snappedZ);
  };

  const edgeColor = isSelected ? '#f97316' : '#64748b';

  return (
    <group ref={groupRef} position={[building.position[0], building.position[1], building.position[2]]}>
      <mesh
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <boxGeometry args={building.size} />
        <meshStandardMaterial color={building.color} roughness={0.7} metalness={0.1} />
      </mesh>
      <Edges threshold={15} color={edgeColor} scale={1.002} lineWidth={isSelected ? 2 : 1} />
    </group>
  );
}

function SunLight({ sunParams, lightRef }: { sunParams: SunParams; lightRef: React.MutableRefObject<THREE.DirectionalLight | null> }) {
  const shadowCameraSize = 35;
  const shadowMapSize = 2048;

  useFrame(() => {
    if (!lightRef.current) return;
    const [x, y, z] = calculateSunPosition(sunParams.azimuth, sunParams.altitude);
    const light = lightRef.current;
    light.position.set(x, y, z);
    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();
    light.intensity = 0.8 + (sunParams.altitude / 90) * 1.2;
    if (light.shadow) {
      const softness = Math.max(0, Math.min(5, sunParams.shadowSoftness));
      const intensity = Math.max(0.2, Math.min(1, sunParams.shadowIntensity));
      light.shadow.radius = softness;
      light.shadow.bias = -0.00005 - (intensity - 0.2) * 0.0012;
      light.shadow.normalBias = 0.005 + (intensity - 0.2) * 0.04;
      if (softness >= 3) {
        const s = shadowMapSize;
        if (light.shadow.mapSize.width !== s) light.shadow.mapSize.set(s, s);
      }
    }
  });

  useEffect(() => {
    if (!lightRef.current) return;
    const light = lightRef.current;
    light.castShadow = true;
    light.color.set('#ffffff');
    light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    light.shadow.camera.left = -shadowCameraSize;
    light.shadow.camera.right = shadowCameraSize;
    light.shadow.camera.top = shadowCameraSize;
    light.shadow.camera.bottom = -shadowCameraSize;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 200;
    light.shadow.radius = sunParams.shadowSoftness;
    light.shadow.bias = -0.00005 - (sunParams.shadowIntensity - 0.2) * 0.0012;
    light.shadow.normalBias = 0.005 + (sunParams.shadowIntensity - 0.2) * 0.04;
  }, [sunParams.shadowSoftness, sunParams.shadowIntensity]);

  return (
    <directionalLight
      ref={lightRef}
      color="#ffffff"
      intensity={1.5}
      castShadow
      shadow-mapSize-width={shadowMapSize}
      shadow-mapSize-height={shadowMapSize}
      shadow-camera-near={0.1}
      shadow-camera-far={200}
      shadow-camera-left={-shadowCameraSize}
      shadow-camera-right={shadowCameraSize}
      shadow-camera-top={shadowCameraSize}
      shadow-camera-bottom={-shadowCameraSize}
      shadow-bias={-0.0005}
      shadow-normalBias={0.02}
      shadow-radius={sunParams.shadowSoftness}
    />
  );
}

function GroundTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#3a5a3a'); g.addColorStop(1, '#2a4a2a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      const p = (i / 20) * canvas.width;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(canvas.width, p); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function Ground() {
  const texture = GroundTexture();
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial map={texture} color="#3a5a3a" roughness={1} metalness={0} />
    </mesh>
  );
}

const ShadowParamsContext = createContext<SunParams>({
  azimuth: 0, altitude: 0, shadowSoftness: 0, shadowIntensity: 0.5, shadowColor: '#1a1a2e'
});

function ShadowCapturePass({
  buildings,
  sunParams,
  shadowCanvasRef
}: {
  buildings: BuildingBlock[];
  sunParams: SunParams;
  shadowCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}) {
  const { gl, scene: mainScene } = useThree();
  const initializedRef = useRef(false);

  useEffect(() => {
    console.log('[ShadowPass] Component MOUNTED, mainScene:', !!mainScene);
    return () => console.log('[ShadowPass] Component UNMOUNTED');
  }, [mainScene]);

  const orthoCam = useMemo(() => {
    console.log('[ShadowPass] Creating ortho camera');
    const s = GROUND_SIZE / 2;
    const cam = new THREE.OrthographicCamera(-s, s, s, -s, 0.1, 200);
    cam.position.set(0, 80, 0.001);
    cam.up.set(0, 0, -1);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    return cam;
  }, []);

  const renderTarget = useMemo(() => new THREE.WebGLRenderTarget(SHADOW_CAPTURE_SIZE, SHADOW_CAPTURE_SIZE, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    colorSpace: THREE.LinearSRGBColorSpace
  }), []);

  const pixelBuffer = useRef<Uint8Array | null>(null);
  const flipBuffer = useRef<Uint8Array | null>(null);
  const scratchCanvas = useRef<HTMLCanvasElement | null>(null);
  const scratchCtx = useRef<CanvasRenderingContext2D | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const buildingMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const frameCounter = useRef(0);
  const lastLogFrame = useRef(0);

  const shadowScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const amb = new THREE.AmbientLight(0xffffff, 1);
    scene.add(amb);

    const captureLight = new THREE.DirectionalLight(0x000000, 1);
    captureLight.castShadow = true;
    captureLight.shadow.mapSize.set(SHADOW_CAPTURE_SIZE, SHADOW_CAPTURE_SIZE);
    const hs = GROUND_SIZE / 2;
    captureLight.shadow.camera.left = -hs;
    captureLight.shadow.camera.right = hs;
    captureLight.shadow.camera.top = hs;
    captureLight.shadow.camera.bottom = -hs;
    captureLight.shadow.camera.near = 0.5;
    captureLight.shadow.camera.far = 200;
    captureLight.shadow.bias = -0.001;
    captureLight.shadow.radius = sunParams.shadowSoftness;
    scene.add(captureLight);
    sunLightRef.current = captureLight;

    const groundGeo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    buildings.forEach(b => {
      const geo = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.position[0], b.position[1], b.position[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      (mesh as any).userData.buildingId = b.id;
      buildingMeshesRef.current.set(b.id, mesh);
      scene.add(mesh);
    });

    initializedRef.current = true;
    console.log('[ShadowPass] shadowScene initialized');
    return scene;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;
    const azimuthRad = (sunParams.azimuth * Math.PI) / 180;
    const altitudeRad = (sunParams.altitude * Math.PI) / 180;
    const dir = new THREE.Vector3(
      -Math.sin(azimuthRad) * Math.cos(altitudeRad),
      -Math.sin(altitudeRad),
      -Math.cos(azimuthRad) * Math.cos(altitudeRad)
    ).normalize();

    if (sunLightRef.current) {
      sunLightRef.current.position.copy(dir).multiplyScalar(60);
      sunLightRef.current.target.position.set(0, 0, 0);
      sunLightRef.current.target.updateMatrixWorld();
      sunLightRef.current.shadow.radius = sunParams.shadowSoftness;
      sunLightRef.current.shadow.bias = -0.0005 - (sunParams.shadowIntensity - 0.2) * 0.0015;
      sunLightRef.current.shadow.normalBias = 0.006 + (sunParams.shadowIntensity - 0.2) * 0.03;
    }

    const keep = new Set(buildings.map(b => b.id));
    for (const [id, mesh] of buildingMeshesRef.current.entries()) {
      if (!keep.has(id)) {
        shadowScene.remove(mesh);
        (mesh.geometry as THREE.BufferGeometry).dispose();
        (mesh.material as THREE.Material).dispose();
        buildingMeshesRef.current.delete(id);
      }
    }
    buildings.forEach(b => {
      const mesh = buildingMeshesRef.current.get(b.id);
      if (mesh) {
        mesh.position.set(b.position[0], b.position[1], b.position[2]);
        if (mesh.geometry instanceof THREE.BoxGeometry) {
          const ps = mesh.geometry.parameters;
          if (ps.width !== b.size[0] || ps.height !== b.size[1] || ps.depth !== b.size[2]) {
            mesh.geometry.dispose();
            mesh.geometry = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
          }
        }
      } else {
        const geo = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const newMesh = new THREE.Mesh(geo, mat);
        newMesh.position.set(b.position[0], b.position[1], b.position[2]);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        (newMesh as any).userData.buildingId = b.id;
        buildingMeshesRef.current.set(b.id, newMesh);
        shadowScene.add(newMesh);
      }
    });
  }, [buildings, sunParams, shadowScene]);

  useFrame(() => {
    if (!shadowCanvasRef.current) {
      if (frameCounter.current === 0) console.log('[ShadowPass] shadowCanvasRef.current is null!');
      frameCounter.current++;
      return;
    }
    if (!pixelBuffer.current) {
      pixelBuffer.current = new Uint8Array(SHADOW_CAPTURE_SIZE * SHADOW_CAPTURE_SIZE * 4);
      flipBuffer.current = new Uint8Array(SHADOW_CAPTURE_SIZE * SHADOW_CAPTURE_SIZE * 4);
      console.log('[ShadowPass] buffers initialized');
    }
    try {
      const captureLight = sunLightRef.current;
      if (captureLight && (!captureLight.shadow.map || captureLight.shadow.map.width !== SHADOW_CAPTURE_SIZE)) {
        captureLight.shadow.mapSize.set(SHADOW_CAPTURE_SIZE, SHADOW_CAPTURE_SIZE);
        if (captureLight.shadow.map) captureLight.shadow.map.dispose();
        captureLight.shadow.map = null;
      }
      const prevTarget = gl.getRenderTarget();
      const prevClearColor = new THREE.Color();
      gl.getClearColor(prevClearColor);
      const prevClearAlpha = gl.getClearAlpha();

      gl.setRenderTarget(renderTarget);
      gl.setClearColor(0xffffff, 1);
      gl.clear(true, true, true);
      gl.render(shadowScene, orthoCam);
      gl.readRenderTargetPixels(renderTarget, 0, 0, SHADOW_CAPTURE_SIZE, SHADOW_CAPTURE_SIZE, pixelBuffer.current);
      gl.setRenderTarget(prevTarget);
      gl.setClearColor(prevClearColor, prevClearAlpha);

      const H = SHADOW_CAPTURE_SIZE;
      const W = SHADOW_CAPTURE_SIZE;
      const src = pixelBuffer.current!;
      const dst = flipBuffer.current!;
      for (let y = 0; y < H; y++) {
        const srcRow = y * W * 4;
        const dstRow = (H - 1 - y) * W * 4;
        for (let x = 0; x < W * 4; x++) {
          dst[dstRow + x] = src[srcRow + x];
        }
      }
      const buf = dst;
      const intensity = Math.max(0.2, Math.min(1, sunParams.shadowIntensity));
      let nonWhite = 0;
      for (let i = 0; i < buf.length; i += 4) {
        const r = buf[i], g = buf[i + 1], b = buf[i + 2];
        const lum = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (lum > 0.02) nonWhite++;
        const alpha = Math.min(1, lum * intensity * 1.6);
        buf[i] = 0;
        buf[i + 1] = 0;
        buf[i + 2] = 0;
        buf[i + 3] = Math.floor(alpha * 255);
      }

      const target = shadowCanvasRef.current;
      if (target.width !== SHADOW_CAPTURE_SIZE) {
        target.width = SHADOW_CAPTURE_SIZE;
        target.height = SHADOW_CAPTURE_SIZE;
      }
      const tctx = target.getContext('2d');
      if (!tctx) return;
      if (!scratchCanvas.current) {
        scratchCanvas.current = document.createElement('canvas');
        scratchCanvas.current.width = SHADOW_CAPTURE_SIZE;
        scratchCanvas.current.height = SHADOW_CAPTURE_SIZE;
        scratchCtx.current = scratchCanvas.current.getContext('2d');
      }
      const sctx = scratchCtx.current!;
      const imgData = sctx.createImageData(SHADOW_CAPTURE_SIZE, SHADOW_CAPTURE_SIZE);
      imgData.data.set(buf);
      sctx.putImageData(imgData, 0, 0);
      tctx.clearRect(0, 0, SHADOW_CAPTURE_SIZE, SHADOW_CAPTURE_SIZE);
      tctx.drawImage(scratchCanvas.current, 0, 0);

      frameCounter.current++;
      if (frameCounter.current === 1 || frameCounter.current - lastLogFrame.current >= 300 || nonWhite > 0 && lastLogFrame.current === 0) {
        console.log(`[ShadowPass] frame=${frameCounter.current}, shadowPixels=${nonWhite}, canvas=${target.width}x${target.height}`);
        lastLogFrame.current = frameCounter.current;
      }
    } catch (err: any) {
      console.log('[ShadowPass] ERROR:', err?.message || String(err));
    }
  });

  return (
    <group>
      <mesh position={[0, -1000, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function SceneContent({
  buildings,
  selectedBuildingId,
  onBuildingClick,
  sunParams,
  onBuildingUpdate,
  onDraggingChange,
  shadowCanvasRef
}: Omit<SceneProps, 'isDragging'>) {
  const controlsRef = useRef<any>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const { gl, scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color('#1e293b');
    scene.fog = new THREE.Fog('#1e293b', 60, 150);
  }, [scene]);

  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);

  const handleDragStart = () => {
    onDraggingChange(true);
    if (controlsRef.current) controlsRef.current.enabled = false;
  };
  const handleDragFinish = () => {
    onDraggingChange(false);
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  return (
    <ShadowParamsContext.Provider value={sunParams}>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 3, 0]}
        makeDefault
      />
      <ambientLight intensity={0.45} color="#e2e8f0" />
      <hemisphereLight args={['#87ceeb', '#2d4a2d', 0.35]} />
      <SunLight sunParams={sunParams} lightRef={directionalLightRef} />
      <Ground />
      <gridHelper args={[GROUND_SIZE, 40, '#475569', '#334155']} position={[0, 0.01, 0]} />
      <axesHelper args={[5]} position={[0, 0.02, 0]} />
      <ShadowCapturePass buildings={buildings} sunParams={sunParams} shadowCanvasRef={shadowCanvasRef} />
      {buildings.map(building => (
        <BuildingMesh
          key={building.id}
          building={building}
          isSelected={selectedBuildingId === building.id}
          onClick={() => onBuildingClick(building.id)}
          onDragStart={handleDragStart}
          onDragFinish={handleDragFinish}
          onDragEnd={(x, z) => {
            const cb = buildings.find(b => b.id === building.id);
            if (cb) onBuildingUpdate(building.id, { position: [x, cb.position[1], z] });
          }}
        />
      ))}
    </ShadowParamsContext.Provider>
  );
}

const Scene = forwardRef<SceneRef, SceneProps>((props, ref) => {
  useImperativeHandle(ref, () => ({
    updateSun: (_params: SunParams) => {},
    updateBuilding: (_id: string, _updates: Partial<BuildingBlock>) => {},
    getShadowCanvas: () => props.shadowCanvasRef.current
  }));

  return (
    <Canvas
      shadows
      camera={{ position: [25, 20, 25], fov: 50, near: 0.1, far: 500 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      onPointerMissed={() => props.onBuildingClick(null)}
    >
      <SceneContent {...props} />
    </Canvas>
  );
});

Scene.displayName = 'Scene';
export default Scene;
