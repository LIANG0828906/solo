import { Canvas, useThree } from '@react-three/fiber';
import { useStore } from '@/store/useStore';
import { FurnitureModel } from './FurnitureModel';
import { useEffect, useCallback, useRef, useState } from 'react';

function SceneContent({ containerWidth, containerHeight }: { containerWidth: number; containerHeight: number }) {
  const { camera } = useThree();

  useEffect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      const cam = camera as any;
      cam.left = -containerWidth / 2;
      cam.right = containerWidth / 2;
      cam.top = containerHeight / 2;
      cam.bottom = -containerHeight / 2;
      cam.updateProjectionMatrix();
    }
  }, [camera, containerWidth, containerHeight]);

  return null;
}

export default function Scene3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const imageUrl = useStore((s) => s.imageUrl);
  const placedFurniture = useStore((s) => s.placedFurniture);
  const selectedId = useStore((s) => s.selectedId);
  const removeFurniture = useStore((s) => s.removeFurniture);
  const selectFurniture = useStore((s) => s.selectFurniture);
  const updateFurniturePosition = useStore((s) => s.updateFurniturePosition);
  const updateFurnitureScale = useStore((s) => s.updateFurnitureScale);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        removeFurniture(selectedId);
      } else if (e.key === 'Escape') {
        selectFurniture(null);
      }
    },
    [selectedId, removeFurniture, selectFurniture]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!selectedId) return;
      e.preventDefault();
      const furniture = placedFurniture.find((f) => f.id === selectedId);
      if (!furniture) return;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(2.0, Math.max(0.5, furniture.scale + delta));
      updateFurnitureScale(selectedId, Math.round(newScale * 10) / 10);
    },
    [selectedId, placedFurniture, updateFurnitureScale]
  );

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  if (!imageUrl) return null;

  const { w, h } = dims;

  const onDrag = (id: string, newX: number, newY: number) => {
    if (w === 0 || h === 0) return;
    updateFurniturePosition(
      id,
      Math.max(0, Math.min(1, (newX + w / 2) / w)),
      Math.max(0, Math.min(1, (-newY + h / 2) / h))
    );
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 10, pointerEvents: 'auto' }}
    >
      {w > 0 && h > 0 && (
        <Canvas
          orthographic
          camera={{
            left: -w / 2,
            right: w / 2,
            top: h / 2,
            bottom: -h / 2,
            near: 0.1,
            far: 10000,
          }}
          style={{ position: 'absolute', inset: 0 }}
          shadows
        >
          <SceneContent containerWidth={w} containerHeight={h} />
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[200, 400, 300]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          {placedFurniture.map((f) => (
            <FurnitureModel
              key={f.id}
              modelId={f.modelId}
              position={[
                f.x * w - w / 2,
                -(f.y * h - h / 2),
                0,
              ]}
              scale={f.scale}
              isSelected={f.id === selectedId}
              onSelect={() => selectFurniture(f.id)}
              onDrag={(newX: number, newY: number) => onDrag(f.id, newX, newY)}
            />
          ))}
        </Canvas>
      )}
    </div>
  );
}
