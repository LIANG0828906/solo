import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { SceneLight, EnvConfig, HdrPreset, SpotLight, PointLight, DirectionalLight } from '../modules/SceneController';

export interface SceneCanvasHandle {
  getRenderer: () => THREE.WebGLRenderer | null;
  getScene: () => THREE.Scene | null;
  getCamera: () => THREE.Camera | null;
}

interface SceneCanvasProps {
  lights: SceneLight[];
  env: EnvConfig;
}

function LightRenderer({ light }: { light: SceneLight }) {
  const spotRef = useRef<THREE.SpotLight>(null);
  const pointRef = useRef<THREE.PointLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const dirCamLeftRef = useRef(-10);
  const dirCamRightRef = useRef(10);
  const dirCamTopRef = useRef(10);
  const dirCamBottomRef = useRef(-10);
  const dirCamNearRef = useRef(0.5);
  const dirCamFarRef = useRef(50);

  useEffect(() => {
    if (light.type === 'spot' && spotRef.current && targetRef.current) {
      const spot = light as SpotLight;
      targetRef.current.position.set(spot.target.x, spot.target.y, spot.target.z);
      spotRef.current.target = targetRef.current;
    }
    if (light.type === 'directional' && dirRef.current) {
      const cam = dirRef.current.shadow.camera as THREE.OrthographicCamera;
      cam.left = dirCamLeftRef.current;
      cam.right = dirCamRightRef.current;
      cam.top = dirCamTopRef.current;
      cam.bottom = dirCamBottomRef.current;
      cam.near = dirCamNearRef.current;
      cam.far = dirCamFarRef.current;
      cam.updateProjectionMatrix();
    }
  }, [light]);

  const shadowMapSize = new THREE.Vector2(1024, 1024);

  if (light.type === 'spot') {
    const spot = light as SpotLight;
    return (
      <>
        <spotLight
          ref={spotRef}
          color={light.color}
          intensity={light.intensity}
          position={[light.position.x, light.position.y, light.position.z]}
          angle={(spot.angle * Math.PI) / 180}
          penumbra={0.3}
          decay={2}
          distance={30}
          castShadow
          shadow-mapSize={shadowMapSize}
          shadow-bias={-0.0001}
        />
        <object3D ref={targetRef} position={[spot.target.x, spot.target.y, spot.target.z]} />
      </>
    );
  }

  if (light.type === 'point') {
    const point = light as PointLight;
    return (
      <pointLight
        ref={pointRef}
        color={light.color}
        intensity={light.intensity}
        position={[light.position.x, light.position.y, light.position.z]}
        distance={point.distance}
        decay={2}
        castShadow
        shadow-mapSize={shadowMapSize}
        shadow-bias={-0.0001}
      />
    );
  }

  const dir = light as DirectionalLight;
  const dirVec = new THREE.Vector3(dir.direction.x, dir.direction.y, dir.direction.z).normalize();
  return (
    <directionalLight
      ref={dirRef}
      color={light.color}
      intensity={light.intensity}
      position={[dirVec.x * 5, dirVec.y * 5 + 3, dirVec.z * 5]}
      castShadow
      shadow-mapSize={shadowMapSize}
      shadow-bias={-0.0001}
      shadow-camera-left={dirCamLeftRef.current}
      shadow-camera-right={dirCamRightRef.current}
      shadow-camera-top={dirCamTopRef.current}
      shadow-camera-bottom={dirCamBottomRef.current}
      shadow-camera-near={dirCamNearRef.current}
      shadow-camera-far={dirCamFarRef.current}
    />
  );
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#555b66" roughness={0.9} metalness={0.1} transparent opacity={0.95} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[10, 10]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9ca3af"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
    </group>
  );
}

function TestObjects() {
  return (
    <>
      <mesh position={[-2, 0.8, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.8, 64, 64]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[2, 0.6, 0]} castShadow receiveShadow rotation={[0, 0, 0]}>
        <torusKnotGeometry args={[0.6, 0.3, 128, 32]} />
        <meshStandardMaterial color="#a855f7" roughness={0.4} metalness={0.5} />
      </mesh>
    </>
  );
}

interface SceneContentProps {
  lights: SceneLight[];
  env: EnvConfig;
}

function SceneContent({ lights, env }: SceneContentProps) {
  const { scene } = useThree();
  const [blendOpacity, setBlendOpacity] = useState(1);
  const [currentPreset, setCurrentPreset] = useState<HdrPreset>(env.hdrPreset);

  useEffect(() => {
    if (env.hdrPreset !== currentPreset) {
      setBlendOpacity(0);
      const start = performance.now();
      const duration = 500;
      const animate = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        setBlendOpacity(t);
        if (t < 1) requestAnimationFrame(animate);
        else setCurrentPreset(env.hdrPreset);
      };
      setCurrentPreset(env.hdrPreset);
      requestAnimationFrame(animate);
    }
  }, [env.hdrPreset, currentPreset]);

  useEffect(() => {
    const bgColors: Record<HdrPreset, string> = {
      studio: '#1f2937',
      sunset: '#2d1b3d',
      forest: '#0f2419',
      night: '#0a0f1a',
    };
    scene.background = new THREE.Color(bgColors[env.hdrPreset]);
  }, [env.hdrPreset, scene]);

  return (
    <>
      <ambientLight intensity={env.ambientIntensity} />
      {lights.map((light) => (
        <LightRenderer key={light.id} light={light} />
      ))}
      <Ground />
      <TestObjects />
      <Environment preset={currentPreset} background={false} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={3}
        maxDistance={20}
        target={[0, 0.5, 0]}
      />
      {env.bloomEnabled && (
        <EffectComposer>
          <Bloom
            intensity={env.bloomIntensity}
            luminanceThreshold={0.4}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}

const SceneCanvasInner = forwardRef<SceneCanvasHandle, SceneCanvasProps>(({ lights, env }, ref) => {
  const { gl, scene, camera } = useThree();

  useImperativeHandle(ref, () => ({
    getRenderer: () => gl,
    getScene: () => scene,
    getCamera: () => camera,
  }));

  useFrame(() => {});

  return <SceneContent lights={lights} env={env} />;
});
SceneCanvasInner.displayName = 'SceneCanvasInner';

export default function SceneCanvas(
  props: SceneCanvasProps & { canvasRef?: React.RefObject<SceneCanvasHandle> },
) {
  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      camera={{ position: [5, 4, 7], fov: 50 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneCanvasInner {...props} ref={props.canvasRef} />
    </Canvas>
  );
}
