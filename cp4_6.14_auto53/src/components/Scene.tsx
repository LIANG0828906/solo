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
const SPRING_DURATION = 0.2;
const SHADOW_CAPTURE_SIZE = 1024;

function calculateSunPosition(azimuth: number, altitude: number): [number, number, number] {
  const azimuthRad = (azimuth * Math.PI) / 180;
  const altitudeRad = (altitude * Math.PI) / 180;
  const x = SUN_DISTANCE * Math.cos(altitudeRad) * Math.sin(azimuthRad);
  const y = SUN_DISTANCE * Math.sin(altitudeRad);
  const z = SUN_DISTANCE * Math.cos(altitudeRad) * Math.cos(azimuthRad);
  return [x, y, z];
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function BuildingMesh({ building, isSelected, onClick, onDragEnd, onDragStart, onDragFinish }: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const dragPlane = useRef<THREE.Plane | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef(new THREE.Vector3());
  const animStartPos = useRef(new THREE.Vector3());
  const animTargetPos = useRef(new THREE.Vector3());
  const animProgress = useRef(1);
  const animating = useRef(false);

  useEffect(() => {
    if (!groupRef.current || isDragging || animating.current) return;
    groupRef.current.position.set(building.position[0], building.position[1], building.position[2]);
  }, [building.position, building.size[1], isDragging]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (animating.current && animProgress.current < 1) {
      animProgress.current = Math.min(1, animProgress.current + delta / SPRING_DURATION);
      const t = easeOutCubic(animProgress.current);
      groupRef.current.position.lerpVectors(animStartPos.current, animTargetPos.current, t);
      if (animProgress.current >= 1) {
        animating.current = false;
        groupRef.current.position.copy(animTargetPos.current);
      }
    }
  });

  const startSpringAnimation = (from: THREE.Vector3, to: THREE.Vector3) => {
    animStartPos.current.copy(from);
    animTargetPos.current.copy(to);
    animProgress.current = 0;
    animating.current = true;
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    onClick();
    if (!isSelected || !groupRef.current) return;

    setIsDragging(true);
    onDragStart();
    try { e.target.setPointerCapture(e.pointerId); } catch(_) {}

    dragPlane.current = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = e.point.clone();
    hitPoint.y = 0;
    const currentXZ = new THREE.Vector3(groupRef.current.position.x, 0, groupRef.current.position.z);
    dragOffset.current.copy(currentXZ).sub(hitPoint);
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
    if (!isDragging || !groupRef.current) return;
    e.stopPropagation();
    setIsDragging(false);
    onDragFinish();

    const pos = groupRef.current.position;
    const snappedX = Math.round(pos.x * 2) / 2;
    const snappedZ = Math.round(pos.z * 2) / 2;
    const from = new THREE.Vector3(pos.x, building.position[1], pos.z);
    const to = new THREE.Vector3(snappedX, building.position[1], snappedZ);
    startSpringAnimation(from, to);
    onDragEnd(snappedX, snappedZ);
  };

  const edgeColor = isSelected ? '#f97316' : '#64748b';

  return (
    <group ref={groupRef} position={[building.position[0], building.position[1], building.position[2]]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <boxGeometry args={building.size} />
        <meshStandardMaterial
          color={building.color}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      <Edges
        threshold={15}
        color={edgeColor}
        scale={1.002}
        lineWidth={isSelected ? 2 : 1}
      />
    </group>
  );
}

function SunLight({ sunParams, lightRef }: { sunParams: SunParams; lightRef: React.MutableRefObject<THREE.DirectionalLight | null> }) {
  const shadowCameraSize = 35;
  const shadowMapSize = 2048;

  useFrame(() => {
    if (!lightRef.current) return;
    const [x, y, z] = calculateSunPosition(sunParams.azimuth, sunParams.altitude);
    lightRef.current.position.set(x, y, z);
    lightRef.current.target.position.set(0, 0, 0);
    lightRef.current.target.updateMatrixWorld();
  });

  useEffect(() => {
    if (!lightRef.current) return;
    const light = lightRef.current;
    const intensityFactor = Math.max(0.2, sunParams.altitude / 90);
    light.intensity = 0.8 + intensityFactor * 1.2;
    light.shadow.bias = -0.0001 - (sunParams.shadowIntensity - 0.2) * 0.001;
    light.shadow.normalBias = 0.008 + (sunParams.shadowIntensity - 0.2) * 0.035;
    light.shadow.radius = sunParams.shadowSoftness;
    light.shadow.camera.left = -shadowCameraSize;
    light.shadow.camera.right = shadowCameraSize;
    light.shadow.camera.top = shadowCameraSize;
    light.shadow.camera.bottom = -shadowCameraSize;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 200;
    light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    if (light.shadow.map) {
      light.shadow.map.setSize(shadowMapSize, shadowMapSize);
    }
  }, [sunParams]);

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
      shadow-bias={-0.0003}
      shadow-normalBias={0.02}
      shadow-radius={sunParams.shadowSoftness}
    />
  );
}

function GroundTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#3a5a3a');
    gradient.addColorStop(1, '#2a4a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      const pos = (i / 20) * canvas.width;
      ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(canvas.width, pos); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function Ground({ sunParams }: { sunParams: SunParams }) {
  const groundMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const texture = GroundTexture();

  useEffect(() => {
    if (groundMatRef.current && groundMatRef.current.userData.shadowMaterial) {
      (groundMatRef.current.userData.shadowMaterial as THREE.ShaderMaterial).uniforms.uShadowIntensity.value = sunParams.shadowIntensity;
    }
  }, [sunParams.shadowIntensity]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial
        ref={groundMatRef}
        map={texture}
        color="#3a5a3a"
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

const ShadowColorContext = createContext<SunParams>({
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
  const { gl } = useThree();
  const orthoCam = useMemo(() => {
    const size = GROUND_SIZE / 2;
    const cam = new THREE.OrthographicCamera(-size, size, size, -size, 0.1, 200);
    cam.position.set(0, 80, 0.01);
    cam.lookAt(0, 0, 0);
    return cam;
  }, []);

  const renderTarget = useMemo(() => new THREE.WebGLRenderTarget(SHADOW_CAPTURE_SIZE, SHADOW_CAPTURE_SIZE, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    colorSpace: THREE.LinearSRGBColorSpace
  }), []);

  const shadowScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const azimuthRad = (sunParams.azimuth * Math.PI) / 180;
    const altitudeRad = (sunParams.altitude * Math.PI) / 180;
    const dir = new THREE.Vector3(
      -Math.sin(azimuthRad) * Math.cos(altitudeRad),
      -Math.sin(altitudeRad),
      -Math.cos(azimuthRad) * Math.cos(altitudeRad)
    ).normalize();

    const captureLight = new THREE.DirectionalLight(0x000000, 1);
    captureLight.position.copy(dir).multiplyScalar(60);
    captureLight.castShadow = true;
    captureLight.shadow.mapSize.set(SHADOW_CAPTURE_SIZE, SHADOW_CAPTURE_SIZE);
    captureLight.shadow.camera.left = -GROUND_SIZE / 2;
    captureLight.shadow.camera.right = GROUND_SIZE / 2;
    captureLight.shadow.camera.top = GROUND_SIZE / 2;
    captureLight.shadow.camera.bottom = -GROUND_SIZE / 2;
    captureLight.shadow.camera.near = 0.5;
    captureLight.shadow.camera.far = 200;
    captureLight.shadow.bias = -0.0005;
    captureLight.shadow.radius = sunParams.shadowSoftness;
    scene.add(captureLight);

    const amb = new THREE.AmbientLight(0xffffff, 1);
    scene.add(amb);

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
      scene.add(mesh);
    });

    (scene as any).userData = { captureLight, buildings: [] };
    return scene;
  }, [sunParams.shadowSoftness]);

  useEffect(() => {
    const sceneMeshes = shadowScene.children.filter(c => (c as any).userData?.buildingId);
    sceneMeshes.forEach(m => shadowScene.remove(m));

    const azimuthRad = (sunParams.azimuth * Math.PI) / 180;
    const altitudeRad = (sunParams.altitude * Math.PI) / 180;
    const dir = new THREE.Vector3(
      -Math.sin(azimuthRad) * Math.cos(altitudeRad),
      -Math.sin(altitudeRad),
      -Math.cos(azimuthRad) * Math.cos(altitudeRad)
    ).normalize();

    const captureLight = (shadowScene as any).userData.captureLight as THREE.DirectionalLight;
    if (captureLight) {
      captureLight.position.copy(dir).multiplyScalar(60);
      captureLight.shadow.radius = sunParams.shadowSoftness;
      captureLight.shadow.bias = -0.0005 - (sunParams.shadowIntensity - 0.2) * 0.001;
    }

    buildings.forEach(b => {
      const geo = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.position[0], b.position[1], b.position[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      (mesh as any).userData.buildingId = b.id;
      shadowScene.add(mesh);
    });
  }, [buildings, sunParams.azimuth, sunParams.altitude, sunParams.shadowSoftness, sunParams.shadowIntensity, shadowScene]);

  const pixelBuffer = useRef<Uint8Array | null>(null);
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 3 !== 0) return;
    if (!shadowCanvasRef.current) return;

    try {
      const prevTarget = gl.getRenderTarget();
      gl.setRenderTarget(renderTarget);
      gl.setClearColor(0xffffff, 1);
      gl.clear(true, true, true);
      gl.render(shadowScene, orthoCam);
      gl.setRenderTarget(prevTarget);

      if (!pixelBuffer.current || pixelBuffer.current.length !== SHADOW_CAPTURE_SIZE * SHADOW_CAPTURE_SIZE * 4) {
        pixelBuffer.current = new Uint8Array(SHADOW_CAPTURE_SIZE * SHADOW_CAPTURE_SIZE * 4);
      }

      gl.readRenderTargetPixels(renderTarget, 0, 0, SHADOW_CAPTURE_SIZE, SHADOW_CAPTURE_SIZE, pixelBuffer.current);

      const targetCanvas = shadowCanvasRef.current;
      if (targetCanvas.width !== SHADOW_CAPTURE_SIZE) {
        targetCanvas.width = SHADOW_CAPTURE_SIZE;
        targetCanvas.height = SHADOW_CAPTURE_SIZE;
      }

      const tctx = targetCanvas.getContext('2d');
      if (tctx) {
        const imgData = tctx.createImageData(SHADOW_CAPTURE_SIZE, SHADOW_CAPTURE_SIZE);
        const pixels = pixelBuffer.current;
        const dst = imgData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          const lum = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const alpha = Math.floor(Math.min(255, lum * sunParams.shadowIntensity * 1.4 * 255));
          dst[i] = 0;
          dst[i + 1] = 0;
          dst[i + 2] = 0;
          dst[i + 3] = alpha;
        }
        tctx.putImageData(imgData, 0, 0);
      }
    } catch(_) {}
  });

  return null;
}

function ShadowOverlay({ sunParams }: { sunParams: SunParams }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => {
    const color = new THREE.Color(sunParams.shadowColor);
    return {
      uShadowColor: { value: new THREE.Vector3(color.r, color.g, color.b) },
      uShadowIntensity: { value: sunParams.shadowIntensity }
    };
  }, []);

  useEffect(() => {
    if (matRef.current) {
      const c = new THREE.Color(sunParams.shadowColor);
      matRef.current.uniforms.uShadowColor.value.set(c.r, c.g, c.b);
      matRef.current.uniforms.uShadowIntensity.value = sunParams.shadowIntensity;
      matRef.current.needsUpdate = true;
    }
  }, [sunParams]);

  const vertShader = `
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragShader = `
    uniform vec3 uShadowColor;
    uniform float uShadowIntensity;
    varying vec3 vWorldPos;
    void main() {
      float edgeFade = 1.0 - smoothstep(30.0, 38.0, length(vWorldPos.xz));
      float alpha = uShadowIntensity * 0.5 * edgeFade;
      gl_FragColor = vec4(uShadowColor, alpha);
    }
  `;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.05, 0]}
      renderOrder={998}
    >
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
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
    <ShadowColorContext.Provider value={sunParams}>
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
      <Ground sunParams={sunParams} />
      <ShadowOverlay sunParams={sunParams} />
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
    </ShadowColorContext.Provider>
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
