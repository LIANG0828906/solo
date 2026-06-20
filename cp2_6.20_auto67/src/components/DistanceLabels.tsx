import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text as TroikaText } from 'troika-three-text';
import { useStarStore } from '@/store/starStore';
import { formatDistance } from '@/utils/coordinates';
import * as THREE from 'three';

export function DistanceLabels() {
  const textRefs = useRef<Map<string, TroikaText>>(new Map());
  const groupRef = useRef<THREE.Group>(null);

  const constellationLines = useStarStore((state) => state.constellationLines);
  const getStarById = useStarStore((state) => state.getStarById);

  const lineData = useMemo(() => {
    return constellationLines.map((line) => {
      const startStar = getStarById(line.startStarId);
      const endStar = getStarById(line.endStarId);
      if (!startStar || !endStar) return null;

      const midX = (startStar.x + endStar.x) / 2;
      const midY = (startStar.y + endStar.y) / 2;
      const midZ = (startStar.z + endStar.z) / 2;

      return {
        id: line.id,
        position: [midX, midY, midZ] as [number, number, number],
        distance: line.distance,
      };
    }).filter(Boolean) as {
      id: string;
      position: [number, number, number];
      distance: number;
    }[];
  }, [constellationLines, getStarById]);

  useEffect(() => {
    if (!groupRef.current) return;

    textRefs.current.forEach((text) => {
      if (text.parent) {
        text.parent.remove(text);
      }
      text.dispose();
    });
    textRefs.current.clear();

    lineData.forEach(({ id, position, distance }) => {
      const text = new TroikaText();
      text.position.set(position[0], position[1], position[2]);
      text.text = formatDistance(distance);
      text.fontSize = 0.8;
      text.color = new THREE.Color('#e8e8f0');
      text.anchorX = 'center';
      text.anchorY = 'middle';
      text.outlineWidth = 0.02;
      text.outlineColor = new THREE.Color('#000000');
      text.outlineOpacity = 0.8;
      text.renderOrder = 1000;
      text.sync();
      if (text.material) {
        (text.material as THREE.Material).depthTest = false;
      }
      groupRef.current?.add(text);
      textRefs.current.set(id, text);
    });

    return () => {
      textRefs.current.forEach((text) => {
        if (text.parent) {
          text.parent.remove(text);
        }
        text.dispose();
      });
      textRefs.current.clear();
    };
  }, [lineData]);

  useFrame(({ camera }) => {
    textRefs.current.forEach((textMesh) => {
      if (textMesh) {
        textMesh.quaternion.copy(camera.quaternion);
      }
    });
  });

  return <group ref={groupRef} />;
}
