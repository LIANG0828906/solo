import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';

interface UseArtInteractionOptions {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  interactiveObjects: THREE.Object3D[];
  enabled?: boolean;
  galleryBuilderRef?: React.MutableRefObject<any>;
  onHover?: (artworkId: string | null) => void;
  onSelect?: (artworkId: string | null) => void;
}

interface UseArtInteractionReturn {
  selectedArtworkId: string | null;
  hoveredArtworkId: string | null;
}

export function useArtInteraction({
  scene,
  camera,
  interactiveObjects,
  enabled = true,
  galleryBuilderRef,
  onHover,
  onSelect,
}: UseArtInteractionOptions): UseArtInteractionReturn {
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const interactiveObjectsRef = useRef<THREE.Object3D[]>([]);

  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
  const [hoveredArtworkId, setHoveredArtworkId] = useState<string | null>(null);

  useEffect(() => {
    interactiveObjectsRef.current = interactiveObjects;
  }, [interactiveObjects]);

  const getArtworkIdFromMesh = useCallback((mesh: THREE.Object3D): string | null => {
    let current: THREE.Object3D | null = mesh;
    while (current) {
      if (current.userData?.artworkId) {
        return current.userData.artworkId;
      }
      current = current.parent;
    }
    return null;
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !camera || !scene) return;

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const intersects = raycasterRef.current.intersectObjects(interactiveObjectsRef.current, true);

      if (intersects.length > 0) {
        const artworkId = getArtworkIdFromMesh(intersects[0].object);
        if (artworkId && artworkId !== hoveredArtworkId) {
          galleryBuilderRef?.current?.setHoveredArtwork(artworkId);
          onHover?.(artworkId);
          setHoveredArtworkId(artworkId);
          document.body.style.cursor = 'pointer';
        }
      } else if (hoveredArtworkId) {
        galleryBuilderRef?.current?.setHoveredArtwork(null);
        onHover?.(null);
        setHoveredArtworkId(null);
        document.body.style.cursor = 'default';
      }
    },
    [enabled, camera, scene, hoveredArtworkId, getArtworkIdFromMesh, galleryBuilderRef, onHover]
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !camera || !scene) return;

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const intersects = raycasterRef.current.intersectObjects(interactiveObjectsRef.current, true);

      if (intersects.length > 0) {
        const artworkId = getArtworkIdFromMesh(intersects[0].object);
        if (artworkId) {
          const newSelectedId = selectedArtworkId === artworkId ? null : artworkId;
          galleryBuilderRef?.current?.setSelectedArtwork(newSelectedId);
          onSelect?.(newSelectedId);
          setSelectedArtworkId(newSelectedId);
        }
      }
    },
    [enabled, camera, scene, selectedArtworkId, getArtworkIdFromMesh, galleryBuilderRef, onSelect]
  );

  useEffect(() => {
    if (!enabled || !scene) return;

    const canvas = scene.userData.canvas as HTMLCanvasElement;
    if (!canvas) return;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);

      if (hoveredArtworkId) {
        galleryBuilderRef?.current?.setHoveredArtwork(null);
        onHover?.(null);
      }
      document.body.style.cursor = 'default';
    };
  }, [enabled, scene, handleMouseMove, handleClick, hoveredArtworkId, galleryBuilderRef, onHover]);

  return {
    selectedArtworkId,
    hoveredArtworkId,
  };
}
