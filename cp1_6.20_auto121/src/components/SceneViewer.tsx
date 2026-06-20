import { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, EffectComposer, Bloom, Vignette } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { Room } from '@/components/Room';
import { LightingSystem } from '@/components/LightingSystem';
import { FurnitureItem } from '@/components/FurnitureItem';
import { DragPreview } from '@/components/DragPreview';

const ROOM_HALF_WIDTH = 6;
const ROOM_HALF_DEPTH = 5;

function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

function SceneInteraction() {
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const pointer = useRef(new THREE.Vector2());
  const isShiftDown = useRef(false);
  const draggingExisting = useRef<string | null>(null);
  const dragOffset = useRef<[number, number]>([0, 0]);

  const isDraggingNew = useAppStore((s) => s.isDraggingNew);
  const previewPosition = useAppStore((s) => s.previewPosition);
  const selectedInstanceId = useAppStore((s) => s.selectedInstanceId);
  const furnitureInstances = useAppStore((s) => s.furnitureInstances);

  const setPreviewPosition = useAppStore((s) => s.setPreviewPosition);
  const addFurniture = useAppStore((s) => s.addFurniture);
  const setDraggingNew = useAppStore((s) => s.setDraggingNew);
  const selectInstance = useAppStore((s) => s.selectInstance);
  const updateFurniture = useAppStore((s) => s.updateFurniture);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftDown.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftDown.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = domElement.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(pointer.current, camera);

      if (isDraggingNew) {
        const intersectPoint = new THREE.Vector3();
        const hit = raycaster.current.ray.intersectPlane(groundPlane.current, intersectPoint);

        if (hit) {
          let x = intersectPoint.x;
          let z = intersectPoint.z;

          x = Math.max(-ROOM_HALF_WIDTH + 0.5, Math.min(ROOM_HALF_WIDTH - 0.5, x));
          z = Math.max(-ROOM_HALF_DEPTH + 0.5, Math.min(ROOM_HALF_DEPTH - 0.5, z));

          x = snapToGrid(x, 0.1);
          z = snapToGrid(z, 0.1);

          setPreviewPosition([x, 0, z]);
        }
      }

      if (draggingExisting.current) {
        const intersectPoint = new THREE.Vector3();
        const hit = raycaster.current.ray.intersectPlane(groundPlane.current, intersectPoint);

        if (hit) {
          let x = intersectPoint.x + dragOffset.current[0];
          let z = intersectPoint.z + dragOffset.current[1];

          x = Math.max(-ROOM_HALF_WIDTH + 0.5, Math.min(ROOM_HALF_WIDTH - 0.5, x));
          z = Math.max(-ROOM_HALF_DEPTH + 0.5, Math.min(ROOM_HALF_DEPTH - 0.5, z));

          x = snapToGrid(x, 0.1);
          z = snapToGrid(z, 0.1);

          updateFurniture(draggingExisting.current, {
            position: [x, 0, z],
          });
        }
      }
    };

    const handlePointerUp = () => {
      if (isDraggingNew && previewPosition) {
        addFurniture(isDraggingNew, previewPosition);
        setDraggingNew(null);
        setPreviewPosition(null);
      }

      draggingExisting.current = null;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (isDraggingNew) return;

      const rect = domElement.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(pointer.current, camera);

      const meshes: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (obj.userData?.furnitureInstanceId && (obj as THREE.Mesh).isMesh) {
          meshes.push(obj);
        }
      });

      const intersects = raycaster.current.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let hitInstance: THREE.Object3D | null = intersects[0].object;
        while (hitInstance && !hitInstance.userData?.furnitureInstanceId) {
          hitInstance = hitInstance.parent;
        }

        if (hitInstance) {
          const instanceId = hitInstance.userData.furnitureInstanceId;

          if (isShiftDown.current && selectedInstanceId === instanceId) {
            const inst = furnitureInstances.find((i) => i.instanceId === instanceId);
            if (inst) {
              updateFurniture(instanceId, {
                rotationY: inst.rotationY + Math.PI / 4,
              });
            }
            return;
          }

          if (!isShiftDown.current && selectedInstanceId === instanceId) {
            const intersectPoint = new THREE.Vector3();
            const hit = raycaster.current.ray.intersectPlane(groundPlane.current, intersectPoint);

            if (hit) {
              const inst = furnitureInstances.find((i) => i.instanceId === instanceId);
              if (inst) {
                dragOffset.current = [
                  inst.position[0] - intersectPoint.x,
                  inst.position[2] - intersectPoint.z,
                ];
              }
              draggingExisting.current = instanceId;
            }
          }

          selectInstance(instanceId);
        }
      } else {
        selectInstance(null);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (!selectedInstanceId) return;

      const inst = furnitureInstances.find((i) => i.instanceId === selectedInstanceId);
      if (!inst) return;

      event.preventDefault();

      let newScale = inst.scale;
      if (event.deltaY > 0) {
        newScale = inst.scale / 1.08;
      } else {
        newScale = inst.scale * 1.08;
      }

      newScale = Math.max(0.5, Math.min(2.5, newScale));

      updateFurniture(selectedInstanceId, { scale: newScale });
    };

    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('wheel', handleWheel);
    };
  }, [
    camera,
    gl,
    scene,
    isDraggingNew,
    previewPosition,
    selectedInstanceId,
    furnitureInstances,
    setPreviewPosition,
    addFurniture,
    setDraggingNew,
    selectInstance,
    updateFurniture,
  ]);

  return null;
}

function FurnitureWithUserdata() {
  const furnitureInstances = useAppStore((s) => s.furnitureInstances);
  const selectedInstanceId = useAppStore((s) => s.selectedInstanceId);

  return (
    <>
      {furnitureInstances.map((inst) => (
        <group
          key={inst.instanceId}
          userData={{ furnitureInstanceId: inst.instanceId }}
        >
          <FurnitureItem
            instance={inst}
            isSelected={selectedInstanceId === inst.instanceId}
          />
        </group>
      ))}
    </>
  );
}

export function SceneViewer() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [6, 5, 8], fov: 60, near: 0.1, far: 100 }}
    >
      <color attach="background" args={['#eef2f5']} />
      <Room />
      <LightingSystem />
      <FurnitureWithUserdata />
      <DragPreview />
      <SceneInteraction />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3}
        maxDistance={18}
        minPolarAngle={Math.PI / 12}
        maxPolarAngle={Math.PI * 0.48}
      />
      <EffectComposer disableNormalPass>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette offset={0.2} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  );
}
