import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Terrain, getTerrainHeight } from './components/Terrain';
import { TurbineMesh, TurbineMeshHandle } from './components/TurbineMesh';
import { WakeStreamline } from './components/WakeStreamline';
import { windSimEngine } from './WindSimEngine';
import { useSimulatorStore } from './store';
import type { Turbine, PowerLevel } from './types';
import { POWER_LEVEL_CONFIG } from './types';

interface SceneContentProps {
  onCanvasReady: (canvas: HTMLCanvasElement, camera: THREE.Camera) => void;
}

function SceneContent({ onCanvasReady }: SceneContentProps) {
  const { gl, camera } = useThree();
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef<[number, number] | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const previewSphereRef = useRef<THREE.Mesh | null>(null);
  const turbineRefs = useRef<Map<string, TurbineMeshHandle>>(new Map());
  const lastSimulationTime = useRef(0);

  const {
    turbines,
    windParams,
    powerLevel,
    selectedTurbineId,
    addTurbine,
    removeTurbine,
    selectTurbine,
    updateSimulation,
  } = useSimulatorStore();

  useEffect(() => {
    const canvas = gl.domElement;
    if (canvas && camera) {
      onCanvasReady(canvas, camera);
    }
  }, [gl, camera, onCanvasReady]);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosition.current = [e.clientX - rect.left, e.clientY - rect.top];
    };

    const handleMouseLeave = () => {
      mousePosition.current = null;
    };

    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera);

      const turbineMeshes = Array.from(turbineRefs.current.keys());
      const turbineObjects: THREE.Object3D[] = [];
      turbineMeshes.forEach((id) => {
        const turbine = turbines.find((t) => t.id === id);
        if (turbine) {
          const obj = new THREE.Object3D();
          obj.position.set(...turbine.position);
          obj.userData.turbineId = id;
          turbineObjects.push(obj);
        }
      });

      const turbineIntersects = raycaster.current.intersectObjects(turbineObjects, true);
      if (turbineIntersects.length > 0) {
        let obj: THREE.Object3D | null = turbineIntersects[0].object;
        while (obj && !obj.userData.turbineId) {
          obj = obj.parent;
        }
        if (obj && obj.userData.turbineId) {
          return;
        }
      }

      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(groundPlane, intersectPoint);

      if (intersectPoint) {
        const terrainHeight = getTerrainHeight(intersectPoint.x, intersectPoint.z);
        const size = 400;
        if (
          Math.abs(intersectPoint.x) < size / 2 - 20 &&
          Math.abs(intersectPoint.z) < size / 2 - 20
        ) {
          addTurbine([intersectPoint.x, terrainHeight, intersectPoint.z]);
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl, camera, turbines, addTurbine]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTurbineId) {
          removeTurbine(selectedTurbineId);
        }
      }
      if (e.key === 'Escape') {
        selectTurbine(null);
      }
    },
    [selectedTurbineId, removeTurbine, selectTurbine]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    windSimEngine.setTurbines(turbines);
    windSimEngine.setWindParams(windParams);
    const result = windSimEngine.simulate();
    updateSimulation(result.turbineStates, result.totalPower);
  }, [turbines, windParams, updateSimulation]);

  const windVector = useMemo((): [number, number] => {
    const rad = (windParams.direction * Math.PI) / 180;
    return [-Math.sin(rad), -Math.cos(rad)];
  }, [windParams.direction]);

  const { previewGeometry, previewMaterial } = useMemo(() => {
    const config = POWER_LEVEL_CONFIG[powerLevel];
    const radius = config.rotorDiameter / 2;
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x44ff88,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    });
    return { geometry, material };
  }, [powerLevel]);

  useFrame(() => {
    const now = performance.now();
    if (now - lastSimulationTime.current > 500) {
      windSimEngine.setTurbines(turbines);
      windSimEngine.setWindParams(windParams);
      const result = windSimEngine.simulate();
      updateSimulation(result.turbineStates, result.totalPower);
      lastSimulationTime.current = now;
    }

    if (previewSphereRef.current && mousePosition.current && gl.domElement) {
      const canvas = gl.domElement;
      const ndcX = (mousePosition.current[0] / canvas.clientWidth) * 2 - 1;
      const ndcY = -(mousePosition.current[1] / canvas.clientHeight) * 2 + 1;

      raycaster.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(groundPlane, intersectPoint);

      if (intersectPoint) {
        const terrainHeight = getTerrainHeight(intersectPoint.x, intersectPoint.z);
        const config = POWER_LEVEL_CONFIG[powerLevel];
        previewSphereRef.current.position.set(
          intersectPoint.x,
          terrainHeight + config.hubHeight,
          intersectPoint.z
        );
        previewSphereRef.current.visible = true;

        const pulse = 0.2 + 0.1 * Math.sin(now * 0.005);
        previewMaterial.opacity = 0.2 + pulse;
      } else {
        previewSphereRef.current.visible = false;
      }
    } else if (previewSphereRef.current) {
      previewSphereRef.current.visible = false;
    }
  });

  const handleTurbineClick = useCallback(
    (turbineId: string) => {
      selectTurbine(selectedTurbineId === turbineId ? null : turbineId);
    },
    [selectedTurbineId, selectTurbine]
  );

  const setTurbineRef = useCallback((id: string, ref: TurbineMeshHandle | null) => {
    if (ref) {
      turbineRefs.current.set(id, ref);
    } else {
      turbineRefs.current.delete(id);
    }
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[100, 150, 100]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={500}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
      />
      <hemisphereLight args={[0x87ceeb, 0x2d2d44, 0.5]} />

      <fog attach="fog" args={['#1a1a2e', 200, 600]} />

      <Terrain
        size={400}
        segments={128}
        onTerrainClick={(position) => {
          const size = 400;
          if (Math.abs(position[0]) < size / 2 - 20 && Math.abs(position[2]) < size / 2 - 20) {
            addTurbine(position);
          }
        }}
      />

      <mesh ref={previewSphereRef} geometry={previewGeometry} material={previewMaterial} />

      {turbines.map((turbine: Turbine) => (
        <TurbineMesh
          key={turbine.id}
          ref={(ref) => setTurbineRef(turbine.id, ref)}
          turbine={turbine}
          windDirection={windParams.direction}
          windSpeed={windParams.speed}
          isSelected={selectedTurbineId === turbine.id}
          onClick={() => handleTurbineClick(turbine.id)}
        />
      ))}

      {turbines.map((turbine: Turbine) => (
        <WakeStreamline
          key={`wake-${turbine.id}`}
          turbine={turbine}
          windDirection={windParams.direction}
          windSpeed={windParams.speed}
          getStreamlinePoints={windSimEngine.getWakeStreamlinePoints.bind(windSimEngine)}
        />
      ))}

      <WindArrow direction={windParams.direction} speed={windParams.speed} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={30}
        maxDistance={400}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, 10, 0]}
      />

      <Stats className="stats-panel" />
    </>
  );
}

function WindArrow({ direction, speed }: { direction: number; speed: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const opacity = 0.4 + (speed / 20) * 0.4;

  const arrowLength = 50 + speed * 3;
  const arrowHeight = 80;

  const { coneGeometry, shaftGeometry } = useMemo(() => {
    const coneGeo = new THREE.ConeGeometry(8, 15, 8);
    coneGeo.translate(0, arrowLength / 2, 0);
    coneGeo.rotateX(Math.PI / 2);

    const shaftGeo = new THREE.CylinderGeometry(2, 2, arrowLength, 8);
    shaftGeo.translate(0, 0, 0);
    shaftGeo.rotateX(Math.PI / 2);

    return { coneGeometry: coneGeo, shaftGeometry: shaftGeo };
  }, [arrowLength]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = (direction * Math.PI) / 180;
    }
  });

  return (
    <group ref={groupRef} position={[0, arrowHeight, 0]}>
      <mesh geometry={shaftGeometry}>
        <meshBasicMaterial color={0xffdd44} transparent opacity={opacity} />
      </mesh>
      <mesh geometry={coneGeometry} position={[0, 0, arrowLength / 2 + 7]}>
        <meshBasicMaterial color={0xffdd44} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

interface TurbineSceneProps {
  onCanvasReady?: (canvas: HTMLCanvasElement, camera: THREE.Camera) => void;
}

export function TurbineScene({ onCanvasReady }: TurbineSceneProps) {
  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement, camera: THREE.Camera) => {
      onCanvasReady?.(canvas, camera);
    },
    [onCanvasReady]
  );

  return (
    <Canvas
      shadows
      camera={{ position: [0, 80, 150], fov: 60, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a1a2e' }}
    >
      <SceneContent onCanvasReady={handleCanvasReady} />
    </Canvas>
  );
}
