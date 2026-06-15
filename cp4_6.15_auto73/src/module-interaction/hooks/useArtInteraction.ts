import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useGalleryStore } from '@/store/useGalleryStore';

interface UseArtInteractionOptions {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  frameMeshes: THREE.Mesh[];
  enabled?: boolean;
}

interface UseArtInteractionReturn {
  selectedArtworkId: string | null;
  hoveredArtworkId: string | null;
}

export function useArtInteraction({
  scene,
  camera,
  frameMeshes,
  enabled = true,
}: UseArtInteractionOptions): UseArtInteractionReturn {
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const frameMeshesRef = useRef<THREE.Mesh[]>([]);
  const originalMaterialsRef = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());

  const {
    selectedArtworkId,
    hoveredArtworkId,
    setSelectedArtwork,
    setHoveredArtwork,
  } = useGalleryStore();

  useEffect(() => {
    frameMeshesRef.current = frameMeshes;

    frameMeshes.forEach((mesh) => {
      const artworkId = mesh.userData.artworkId;
      if (artworkId && !originalMaterialsRef.current.has(artworkId)) {
        originalMaterialsRef.current.set(artworkId, mesh.material);
      }
    });
  }, [frameMeshes]);

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

  const applyHoverEffect = useCallback((mesh: THREE.Mesh, isHovered: boolean) => {
    const artworkId = mesh.userData.artworkId;
    if (!artworkId) return;

    const originalMaterial = originalMaterialsRef.current.get(artworkId);
    if (!originalMaterial) return;

    const materials = Array.isArray(originalMaterial) ? originalMaterial : [originalMaterial];

    materials.forEach((mat) => {
      if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
        if (isHovered) {
          mat.emissive?.setHex(0x8b5cf6);
          mat.emissiveIntensity = 0.4;
        } else {
          mat.emissive?.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !camera || !scene) return;

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const intersects = raycasterRef.current.intersectObjects(frameMeshesRef.current, true);

      if (intersects.length > 0) {
        const artworkId = getArtworkIdFromMesh(intersects[0].object);
        if (artworkId && artworkId !== hoveredArtworkId) {
          if (hoveredArtworkId) {
            const prevMesh = frameMeshesRef.current.find(
              (m) => m.userData.artworkId === hoveredArtworkId
            );
            if (prevMesh) {
              applyHoverEffect(prevMesh, false);
            }
          }

          const currentMesh = frameMeshesRef.current.find(
            (m) => m.userData.artworkId === artworkId
          );
          if (currentMesh) {
            applyHoverEffect(currentMesh, true);
          }

          setHoveredArtwork(artworkId);
          document.body.style.cursor = 'pointer';
        }
      } else if (hoveredArtworkId) {
        const prevMesh = frameMeshesRef.current.find(
          (m) => m.userData.artworkId === hoveredArtworkId
        );
        if (prevMesh) {
          applyHoverEffect(prevMesh, false);
        }
        setHoveredArtwork(null);
        document.body.style.cursor = 'default';
      }
    },
    [enabled, camera, scene, hoveredArtworkId, getArtworkIdFromMesh, applyHoverEffect, setHoveredArtwork]
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !camera || !scene) return;

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const intersects = raycasterRef.current.intersectObjects(frameMeshesRef.current, true);

      if (intersects.length > 0) {
        const artworkId = getArtworkIdFromMesh(intersects[0].object);
        if (artworkId) {
          setSelectedArtwork(selectedArtworkId === artworkId ? null : artworkId);
        }
      }
    },
    [enabled, camera, scene, selectedArtworkId, getArtworkIdFromMesh, setSelectedArtwork]
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
        const prevMesh = frameMeshesRef.current.find(
          (m) => m.userData.artworkId === hoveredArtworkId
        );
        if (prevMesh) {
          applyHoverEffect(prevMesh, false);
        }
      }
      document.body.style.cursor = 'default';
    };
  }, [enabled, scene, handleMouseMove, handleClick, hoveredArtworkId, applyHoverEffect]);

  return {
    selectedArtworkId,
    hoveredArtworkId,
  };
}
