import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GeometryConfig, FrequencyBand } from '@/types';
import { useAudioStore } from '@/store/audioStore';
import {
  exponentialSmooth,
  getAudioResponseColor,
  clamp,
  lerp,
} from '@/utils/animation';
import { SCENE_CONSTANTS } from '@/utils/constants';

interface GeometrySculptureProps {
  config: GeometryConfig;
}

const createGeometryLOD = (
  type: GeometryConfig['type'],
  size: number
): THREE.LOD => {
  const lod = new THREE.LOD();

  let highGeom: THREE.BufferGeometry;
  let midGeom: THREE.BufferGeometry;
  let lowGeom: THREE.BufferGeometry;

  switch (type) {
    case 'icosahedron':
      highGeom = new THREE.IcosahedronGeometry(size, 4);
      midGeom = new THREE.IcosahedronGeometry(size, 2);
      lowGeom = new THREE.IcosahedronGeometry(size, 1);
      break;
    case 'torus':
      highGeom = new THREE.TorusGeometry(size, size * 0.4, 32, 100);
      midGeom = new THREE.TorusGeometry(size, size * 0.4, 16, 50);
      lowGeom = new THREE.TorusGeometry(size, size * 0.4, 8, 24);
      break;
    case 'octahedron':
      highGeom = new THREE.OctahedronGeometry(size, 4);
      midGeom = new THREE.OctahedronGeometry(size, 2);
      lowGeom = new THREE.OctahedronGeometry(size, 0);
      break;
    default:
      highGeom = new THREE.IcosahedronGeometry(size, 4);
      midGeom = new THREE.IcosahedronGeometry(size, 2);
      lowGeom = new THREE.IcosahedronGeometry(size, 1);
  }

  const checkFaceCount = (geom: THREE.BufferGeometry) => {
    const faceCount = geom.index
      ? geom.index.count / 3
      : geom.attributes.position.count / 3;
    return Math.min(faceCount, SCENE_CONSTANTS.MAX_FACES_PER_GEOMETRY);
  };

  checkFaceCount(highGeom);

  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    metalness: 0.3,
    roughness: 0.4,
    emissive: '#000000',
    emissiveIntensity: 0.5,
  });

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    wireframe: true,
    transparent: true,
    opacity: 0.8,
  });

  lod.addLevel(new THREE.Mesh(highGeom, material), 0);
  lod.addLevel(new THREE.Mesh(midGeom, material), 10);
  lod.addLevel(new THREE.Mesh(lowGeom, wireframeMaterial), 20);

  return lod;
};

export function GeometrySculpture({ config }: GeometrySculptureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lodRef = useRef<THREE.LOD>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const [orbitAngle, setOrbitAngle] = useState(config.orbitOffset);
  const [currentScale, setCurrentScale] = useState(config.baseSize);
  const [currentZ, setCurrentZ] = useState(0);
  const [currentColor, setCurrentColor] = useState(config.baseColor);
  const [smoothedResponse, setSmoothedResponse] = useState(0);

  const bandEnergy = useAudioStore(
    (state) => state[config.frequencyBand as keyof typeof state] as number
  );
  const beatDetected = useAudioStore((state) => state.beatDetected);

  const lod = useMemo(() => {
    return createGeometryLOD(config.type, 1);
  }, [config.type]);

  useEffect(() => {
    if (lodRef.current) {
      while (lodRef.current.children.length > 0) {
        lodRef.current.remove(lodRef.current.children[0]);
      }
      lod.levels.forEach((level) => {
        if (level.object) {
          lodRef.current?.add(level.object.clone());
        }
      });
    }
  }, [lod]);

  useFrame((state, delta) => {
    if (!groupRef.current || !config.enabled) return;

    const responseIntensity = bandEnergy * config.responseSensitivity;

    const newSmoothedResponse = exponentialSmooth(
      smoothedResponse,
      responseIntensity,
      config.responseSmoothness,
      delta
    );
    setSmoothedResponse(newSmoothedResponse);

    const newOrbitAngle = orbitAngle + config.orbitSpeed * delta;
    setOrbitAngle(newOrbitAngle);

    const eccentricity = clamp(config.orbitEccentricity, 0, 0.9);
    const x =
      config.orbitRadius * Math.cos(newOrbitAngle) * (1 - eccentricity * 0.5);
    const z =
      config.orbitRadius *
      Math.sin(newOrbitAngle) *
      (1 - eccentricity * 0.5) *
      (1 - eccentricity);

    const audioZOffset = newSmoothedResponse * config.zFloatAmplitude * 2;
    const newZ = lerp(currentZ, audioZOffset, 1 - Math.exp(-delta * 5));
    setCurrentZ(newZ);

    groupRef.current.position.x = x;
    groupRef.current.position.z = z;
    groupRef.current.position.y = newZ;

    const baseRotationSpeed = config.rotationSpeed;
    const beatBoost = beatDetected ? 1.5 : 1;
    groupRef.current.rotation.x +=
      baseRotationSpeed.x * delta * beatBoost * (1 + newSmoothedResponse);
    groupRef.current.rotation.y +=
      baseRotationSpeed.y * delta * beatBoost * (1 + newSmoothedResponse);
    groupRef.current.rotation.z +=
      baseRotationSpeed.z * delta * beatBoost * (1 + newSmoothedResponse);

    const targetScale =
      config.baseSize * (1 + newSmoothedResponse * config.scaleMultiplier);
    const newScale = exponentialSmooth(
      currentScale,
      targetScale,
      config.responseSmoothness * 0.5,
      delta
    );
    setCurrentScale(newScale);
    groupRef.current.scale.setScalar(newScale);

    const newColor = getAudioResponseColor(
      config.baseColor,
      newSmoothedResponse,
      config.colorShiftIntensity
    );
    setCurrentColor(newColor);

    if (lodRef.current) {
      lodRef.current.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          if (material.isMeshStandardMaterial) {
            material.color.set(newColor);
            material.emissive.set(newColor);
            material.emissiveIntensity = 0.3 + newSmoothedResponse * 0.8;
            material.wireframe = config.materialMode === 'wireframe';
            if (config.materialMode === 'wireframe') {
              material.opacity = 0.6 + newSmoothedResponse * 0.4;
              material.transparent = true;
            } else {
              material.opacity = 1;
              material.transparent = false;
            }
          }
        }
      });
    }

    state;
  });

  if (!config.enabled) return null;

  return (
    <group ref={groupRef}>
      <primitive object={lod} ref={lodRef} />
    </group>
  );
}
