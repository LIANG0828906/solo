import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { PowerLevel } from '../types';
import { POWER_LEVEL_CONFIG } from '../types';
import { getTerrainHeight } from './Terrain';

interface PreviewSphereProps {
  mousePosition: [number, number] | null;
  powerLevel: PowerLevel;
  camera: THREE.Camera | null;
  canvas: HTMLCanvasElement | null;
}

export function PreviewSphere({ mousePosition, powerLevel, camera, canvas }: PreviewSphereProps) {
  const sphereRef = useMemo(() => {
    const config = POWER_LEVEL_CONFIG[powerLevel];
    const radius = config.rotorDiameter / 2;

    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x44ff88,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
      wireframeLinewidth: 1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;

    return mesh;
  }, [powerLevel]);

  useFrame(() => {
    if (!mousePosition || !camera || !canvas) {
      sphereRef.visible = false;
      return;
    }

    const raycaster = new THREE.Raycaster();
    const ndcX = (mousePosition[0] / canvas.clientWidth) * 2 - 1;
    const ndcY = -(mousePosition[1] / canvas.clientHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersectPoint);

    if (intersectPoint) {
      const terrainHeight = getTerrainHeight(intersectPoint.x, intersectPoint.z);
      const config = POWER_LEVEL_CONFIG[powerLevel];
      sphereRef.position.set(
        intersectPoint.x,
        terrainHeight + config.hubHeight,
        intersectPoint.z
      );
      sphereRef.visible = true;

      const pulse = 0.2 + 0.1 * Math.sin(Date.now() * 0.005);
      (sphereRef.material as THREE.MeshBasicMaterial).opacity = 0.2 + pulse;
    } else {
      sphereRef.visible = false;
    }
  });

  return <primitive object={sphereRef} />;
}
