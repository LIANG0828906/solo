import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { PipeNetworkGenerator, NetworkObject } from './pipeline/PipeNetworkGenerator';
import { PipeInteractionManager, PropertyDict } from './interaction/PipeInteractionManager';
import { CameraController } from './camera/CameraController';
import InfoPanel from './ui/InfoPanel';
import ControlPanel from './ui/ControlPanel';
import {
  mockPipelines,
  PIPELINE_COLORS,
  PIPELINE_TYPE_NAMES,
  getSegmentById,
} from './data/mockData';

interface SceneProps {
  onObjectClick: (id: string | null, type: 'node' | 'segment' | null) => void;
  onObjectHover: (id: string | null) => void;
  setGenerator: (gen: PipeNetworkGenerator) => void;
  setInteractionManager: (im: PipeInteractionManager) => void;
  setCameraController: (cc: CameraController) => void;
  selectedTourPipeline: string;
  isTouring: boolean;
  setIsTouring: (v: boolean) => void;
}

const PipelineScene: React.FC<SceneProps> = ({
  onObjectClick,
  onObjectHover,
  setGenerator,
  setInteractionManager,
  setCameraController,
  selectedTourPipeline,
  isTouring,
  setIsTouring,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const abnormalMarkersRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const generatorRef = useRef<PipeNetworkGenerator | null>(null);
  const interactionRef = useRef<PipeInteractionManager | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const initialized = useRef(false);
  const allObjectsMapRef = useRef<Map<string, NetworkObject>>(new Map());

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const generator = new PipeNetworkGenerator();
    const network = generator.generateNetwork(mockPipelines);
    generatorRef.current = generator;
    setGenerator(generator);

    network.objects.forEach((obj) => {
      allObjectsMapRef.current.set(obj.id, obj);
    });

    if (groupRef.current) {
      network.objects.forEach((obj) => {
        groupRef.current!.add(obj.mesh);
      });
    }

    const interactionMgr = new PipeInteractionManager();
    interactionMgr.setObjects(generator.getObjectsForRaycasting());
    interactionRef.current = interactionMgr;
    setInteractionManager(interactionMgr);
  }, [setGenerator, setInteractionManager]);

  useEffect(() => {
    if (!controlsRef.current || cameraControllerRef.current) return;

    const cc = new CameraController(camera as THREE.PerspectiveCamera, controlsRef.current);
    cameraControllerRef.current = cc;
    setCameraController(cc);
  }, [camera, setCameraController]);

  useEffect(() => {
    if (!cameraControllerRef.current || !isTouring) return;

    const pipeline = mockPipelines.find((p) => p.id === selectedTourPipeline);
    if (pipeline) {
      cameraControllerRef.current.startTour(pipeline, 2);
      cameraControllerRef.current.setOnTourComplete(() => {
        setIsTouring(false);
      });
    }

    return () => {
      if (cameraControllerRef.current) {
        cameraControllerRef.current.stopTour();
      }
    };
  }, [isTouring, selectedTourPipeline, setIsTouring]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactionRef.current || !camera) return;
      interactionRef.current.updateMouse(e.clientX, e.clientY, gl.domElement);
    };

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (!interactionRef.current || !camera || !generatorRef.current) return;

      interactionRef.current.updateMouse(e.clientX, e.clientY, gl.domElement);
      const id = interactionRef.current.detectClick(camera);

      if (id) {
        const netObj = allObjectsMapRef.current.get(id);
        if (netObj) {
          onObjectClick(id, netObj.type);
        }
      } else {
        onObjectClick(null, null);
      }
    };

    gl.domElement.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('click', handleClick);

    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [camera, gl, onObjectClick]);

  useFrame(() => {
    const delta = clockRef.current.getDelta();

    if (cameraControllerRef.current) {
      cameraControllerRef.current.update(delta);
    }

    if (interactionRef.current && camera && generatorRef.current) {
      const hoveredId = interactionRef.current.detectHover(camera);
      if (hoveredId !== hoveredIdRef.current) {
        if (hoveredIdRef.current) {
          generatorRef.current.highlightObject(hoveredIdRef.current, false);
        }
        if (hoveredId) {
          generatorRef.current.highlightObject(hoveredId, true);
        }
        hoveredIdRef.current = hoveredId;
        onObjectHover(hoveredId);
        document.body.style.cursor = hoveredId ? 'pointer' : 'default';
      }
    }

    if (abnormalMarkersRef.current) {
      const time = clockRef.current.elapsedTime;
      abnormalMarkersRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshBasicMaterial;
        const pulse = (Math.sin(time * 4 + i * 0.5) + 1) / 2;
        material.opacity = 0.3 + pulse * 0.7;
      });
    }
  });

  const abnormalMarkers = useMemo(() => {
    const markers: { position: [number, number, number]; id: string }[] = [];

    for (const pipeline of mockPipelines) {
      for (const segment of pipeline.segments) {
        if (segment.isAbnormal) {
          const fromNode = pipeline.nodes.find((n) => n.id === segment.fromNode);
          const toNode = pipeline.nodes.find((n) => n.id === segment.toNode);
          if (fromNode && toNode) {
            markers.push({
              position: [
                (fromNode.x + toNode.x) / 2,
                (fromNode.y + toNode.y) / 2,
                (fromNode.z + toNode.z) / 2,
              ],
              id: segment.id,
            });
          }
        }
      }
    }
    return markers;
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#8888FF" />

      <Grid
        position={[0, -5, 0]}
        args={[50, 50]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#333355"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#444466"
        fadeDistance={60}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1A1A2E" transparent opacity={0.3} />
      </mesh>

      <group ref={groupRef} />

      <group ref={abnormalMarkersRef}>
        {abnormalMarkers.map((marker) => (
          <mesh key={marker.id} position={marker.position} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.5, 0.05, 16, 32]} />
            <meshBasicMaterial color="#FF0000" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2 + 0.2}
      />
    </>
  );
};

const App: React.FC = () => {
  const [generator, setGenerator] = useState<PipeNetworkGenerator | null>(null);
  const [interactionManager, setInteractionManager] = useState<PipeInteractionManager | null>(null);
  const [, setCameraController] = useState<CameraController | null>(null);
  const [infoPanelVisible, setInfoPanelVisible] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<PropertyDict>({});
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'node' | 'segment' | null>(null);

  const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({
    water: true,
    gas: true,
    power: true,
    communication: true,
    drainage: true,
  });
  const [opacity, setOpacity] = useState(1);
  const [isTouring, setIsTouring] = useState(false);
  const [selectedTourPipeline, setSelectedTourPipeline] = useState(mockPipelines[0]?.id || '');

  const pipelineTypeOptions = useMemo(() => {
    return Object.entries(PIPELINE_COLORS).map(([type, color]) => ({
      type,
      name: PIPELINE_TYPE_NAMES[type] || type,
      color,
      visible: visibleTypes[type] ?? true,
    }));
  }, [visibleTypes]);

  const tourPipelineOptions = useMemo(() => {
    return mockPipelines.map((p) => ({ id: p.id, name: p.name }));
  }, []);

  const handleTypeToggle = useCallback(
    (type: string, visible: boolean) => {
      setVisibleTypes((prev) => ({ ...prev, [type]: visible }));
      if (generator) {
        generator.setVisibility(type, visible);
      }
    },
    [generator],
  );

  const handleOpacityChange = useCallback(
    (value: number) => {
      setOpacity(value);
      if (generator) {
        generator.setOpacity(value);
      }
    },
    [generator],
  );

  const handleObjectHover = useCallback(() => {}, []);

  const handleObjectClick = useCallback(
    (id: string | null, type: 'node' | 'segment' | null) => {
      if (!id || !type || !interactionManager || !generator) {
        setInfoPanelVisible(false);
        setSelectedId(null);
        setSelectedType(null);
        return;
      }

      setSelectedId(id);
      setSelectedType(type);

      const network = generator.generateNetwork(mockPipelines);
      const allObjectsMap = new Map<string, NetworkObject>();
      network.objects.forEach((o) => allObjectsMap.set(o.id, o));

      const props = interactionManager.getObjectProperties(id, type, allObjectsMap);
      setSelectedProperties(props);

      const segResult = getSegmentById(id);
      setIsAbnormal(segResult?.segment.isAbnormal || false);
      setInfoPanelVisible(true);
    },
    [interactionManager, generator],
  );

  const handleTourToggle = useCallback(() => {
    setIsTouring((prev) => !prev);
  }, []);

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setInfoPanelVisible(false);
      setSelectedId(null);
    }
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#1E1E2E',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
      onClick={handleBackgroundClick}
    >
      <Canvas
        camera={{ position: [25, 25, 25], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#1E1E2E');
          scene.fog = new THREE.Fog('#1E1E2E', 40, 80);
        }}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <PipelineScene
          onObjectClick={handleObjectClick}
          onObjectHover={handleObjectHover}
          setGenerator={setGenerator}
          setInteractionManager={setInteractionManager}
          setCameraController={setCameraController}
          selectedTourPipeline={selectedTourPipeline}
          isTouring={isTouring}
          setIsTouring={setIsTouring}
        />
      </Canvas>

      <ControlPanel
        pipelineTypes={pipelineTypeOptions}
        opacity={opacity}
        isTouring={isTouring}
        onTypeToggle={handleTypeToggle}
        onOpacityChange={handleOpacityChange}
        onTourToggle={handleTourToggle}
        selectedTourPipeline={selectedTourPipeline}
        onTourPipelineChange={setSelectedTourPipeline}
        tourPipelineOptions={tourPipelineOptions}
      />

      <InfoPanel
        visible={infoPanelVisible}
        properties={selectedProperties}
        isAbnormal={isAbnormal}
      />
    </div>
  );
};

export default App;
