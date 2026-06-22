import { useRef, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore, type GeometryItem, type LightItem } from '@/store/editorStore';

const GEOMETRY_CACHE: Record<string, THREE.BufferGeometry> = {};

const getCachedGeometry = (type: GeometryItem['type']) => {
  if (!GEOMETRY_CACHE[type]) {
    switch (type) {
      case 'box':
        GEOMETRY_CACHE[type] = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        GEOMETRY_CACHE[type] = new THREE.SphereGeometry(0.6, 32, 32);
        break;
      case 'cylinder':
        GEOMETRY_CACHE[type] = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32);
        break;
      case 'torus':
        GEOMETRY_CACHE[type] = new THREE.TorusGeometry(0.5, 0.2, 16, 48);
        break;
      case 'cone':
        GEOMETRY_CACHE[type] = new THREE.ConeGeometry(0.6, 1.2, 32);
        break;
    }
  }
  return GEOMETRY_CACHE[type];
};

const getMaterial = (item: GeometryItem) => {
  const { type, params } = item.material;
  const color = new THREE.Color(params.color);
  const envIntensity = params.ambientIntensity;

  switch (type) {
    case 'metal':
      return new THREE.MeshStandardMaterial({
        color,
        metalness: params.metalness ?? 0.8,
        roughness: params.roughness ?? 0.3,
        envMapIntensity: envIntensity,
      });
    case 'glossy':
      return new THREE.MeshPhysicalMaterial({
        color,
        clearcoat: params.specularIntensity ?? 1,
        clearcoatRoughness: 1 - (params.specularSharpness ?? 0.5),
        envMapIntensity: envIntensity,
        roughness: 0.2,
        metalness: 0.1,
      });
    case 'transparent':
      return new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: params.opacity ?? 0.7,
        ior: params.ior ?? 1.5,
        transmission: 0.6,
        thickness: 0.5,
        envMapIntensity: envIntensity,
        roughness: 0.1,
      });
    default:
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.0,
        envMapIntensity: envIntensity,
      });
  }
};

interface GeometryMeshProps {
  item: GeometryItem;
  meshRef: React.RefObject<THREE.Mesh>;
  onSelect: (id: string) => void;
}

const GeometryMesh = ({ item, meshRef, onSelect }: GeometryMeshProps) => {
  const updateTransform = useEditorStore((s) => s.updateTransform);
  const selectedId = useEditorStore((s) => s.selectedId);
  const isSelected = selectedId === item.id;
  const materialRef = useRef<THREE.Material | null>(null);

  useEffect(() => {
    if (meshRef.current) {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      const mat = getMaterial(item);
      materialRef.current = mat;
      meshRef.current.material = mat;
    }
  }, [item.material, meshRef]);

  useFrame(() => {
    if (meshRef.current && isSelected) {
      const obj = meshRef.current;
      const posChanged =
        Math.abs(obj.position.x - item.position[0]) > 0.001 ||
        Math.abs(obj.position.y - item.position[1]) > 0.001 ||
        Math.abs(obj.position.z - item.position[2]) > 0.001;
      const rotChanged =
        Math.abs(THREE.MathUtils.radToDeg(obj.rotation.x) - item.rotation[0]) > 0.05 ||
        Math.abs(THREE.MathUtils.radToDeg(obj.rotation.y) - item.rotation[1]) > 0.05 ||
        Math.abs(THREE.MathUtils.radToDeg(obj.rotation.z) - item.rotation[2]) > 0.05;
      const scaleChanged = Math.abs(obj.scale.x - item.scale) > 0.001;

      if (posChanged || rotChanged || scaleChanged) {
        updateTransform(item.id, {
          position: [obj.position.x, obj.position.y, obj.position.z],
          rotation: [
            THREE.MathUtils.radToDeg(obj.rotation.x),
            THREE.MathUtils.radToDeg(obj.rotation.y),
            THREE.MathUtils.radToDeg(obj.rotation.z),
          ],
          scale: obj.scale.x,
        });
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={item.position}
      rotation={[
        THREE.MathUtils.degToRad(item.rotation[0]),
        THREE.MathUtils.degToRad(item.rotation[1]),
        THREE.MathUtils.degToRad(item.rotation[2]),
      ]}
      scale={item.scale}
      castShadow
      receiveShadow
      geometry={getCachedGeometry(item.type)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
    />
  );
};

interface LightMarkerProps {
  light: LightItem;
  meshRef: React.RefObject<THREE.Mesh>;
  onSelect: (id: string) => void;
}

const LightMarker = ({ light, meshRef, onSelect }: LightMarkerProps) => {
  const updateLight = useEditorStore((s) => s.updateLight);
  const selectedLightId = useEditorStore((s) => s.selectedLightId);
  const isSelected = selectedLightId === light.id;
  const lightRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.color.set(light.color);
      lightRef.current.intensity = light.intensity;
      lightRef.current.decay = light.decay;
    }
  }, [light.color, light.intensity, light.decay]);

  useFrame(() => {
    if (meshRef.current && isSelected && lightRef.current) {
      const obj = meshRef.current;
      const posChanged =
        Math.abs(obj.position.x - light.position[0]) > 0.001 ||
        Math.abs(obj.position.y - light.position[1]) > 0.001 ||
        Math.abs(obj.position.z - light.position[2]) > 0.001;

      if (posChanged) {
        const newPos: [number, number, number] = [obj.position.x, obj.position.y, obj.position.z];
        updateLight(light.id, { position: newPos });
        lightRef.current.position.copy(obj.position);
      }
    }
  });

  return (
    <>
      <mesh
        ref={meshRef}
        position={light.position}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(light.id);
        }}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={light.color} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={light.position}
        color={light.color}
        intensity={light.intensity}
        decay={light.decay}
        distance={25}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
    </>
  );
};

const SceneContent = () => {
  const geometryList = useEditorStore((s) => s.geometryList);
  const lightList = useEditorStore((s) => s.lightList);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedLightId = useEditorStore((s) => s.selectedLightId);
  const transformMode = useEditorStore((s) => s.transformMode);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const setSelectedLightId = useEditorStore((s) => s.setSelectedLightId);
  const orbitRef = useRef<any>(null);
  const { camera, scene } = useThree();

  const meshRefs = useRef<Map<string, React.RefObject<THREE.Mesh>>>(new Map());
  const lightMeshRefs = useRef<Map<string, React.RefObject<THREE.Mesh>>>(new Map());

  const [, forceRender] = useState(0);

  useEffect(() => {
    camera.position.set(6, 5, 8);
    camera.lookAt(0, 0, 0);
    scene.background = new THREE.Color('#1a1a2e');
    scene.shadowMap.enabled = true;
    scene.shadowMap.type = THREE.PCFSoftShadowMap;
    forceRender((v) => v + 1);
  }, [camera, scene]);

  geometryList.forEach((item) => {
    if (!meshRefs.current.has(item.id)) {
      meshRefs.current.set(item.id, { current: null });
    }
  });

  lightList.forEach((light) => {
    if (!lightMeshRefs.current.has(light.id)) {
      lightMeshRefs.current.set(light.id, { current: null });
    }
  });

  const getSelectedRef = () => {
    if (selectedId) {
      const ref = meshRefs.current.get(selectedId);
      return ref?.current || null;
    }
    if (selectedLightId) {
      const ref = lightMeshRefs.current.get(selectedLightId);
      return ref?.current || null;
    }
    return null;
  };

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 10, 7]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
      />

      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3a3a5a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#4a4a6a"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
        onClick={() => {
          setSelectedId(null);
          setSelectedLightId(null);
        }}
      >
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.3} />
      </mesh>

      {geometryList.map((item) => {
        const ref = meshRefs.current.get(item.id)!;
        return (
          <GeometryMesh
            key={item.id}
            item={item}
            meshRef={ref}
            onSelect={setSelectedId}
          />
        );
      })}

      {lightList.map((light) => {
        const ref = lightMeshRefs.current.get(light.id)!;
        return (
          <LightMarker
            key={light.id}
            light={light}
            meshRef={ref}
            onSelect={setSelectedLightId}
          />
        );
      })}

      <TransformControlsLayer
        selectedObject={getSelectedRef()}
        transformMode={transformMode}
        orbitRef={orbitRef}
      />

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 + 0.1}
      />
    </>
  );
};

interface TransformControlsLayerProps {
  selectedObject: THREE.Object3D | null;
  transformMode: 'translate' | 'rotate';
  orbitRef: React.RefObject<any>;
}

const TransformControlsLayer = ({
  selectedObject,
  transformMode,
  orbitRef,
}: TransformControlsLayerProps) => {
  const controlsRef = useRef<any>(null);
  const [currentObject, setCurrentObject] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    setCurrentObject(selectedObject);
  }, [selectedObject]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onDraggingChange = (event: any) => {
      if (orbitRef.current) {
        orbitRef.current.enabled = !event.value;
      }
    };

    controls.addEventListener('dragging-changed', onDraggingChange);
    return () => {
      controls.removeEventListener('dragging-changed', onDraggingChange);
    };
  }, [orbitRef]);

  if (!currentObject) return null;

  return (
    <TransformControls
      ref={controlsRef}
      object={currentObject}
      mode={transformMode}
      size={0.9}
      showX
      showY
      showZ
    />
  );
};

const SceneCanvas = () => {
  return (
    <Canvas
      shadows
      camera={{ fov: 50, near: 0.1, far: 1000, position: [6, 5, 8] }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <SceneContent />
    </Canvas>
  );
};

export default SceneCanvas;
