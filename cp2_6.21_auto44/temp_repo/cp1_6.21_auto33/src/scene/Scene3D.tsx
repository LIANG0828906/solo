import React, { useRef, useMemo, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import {
  sceneManager,
  SelectedRayInfo,
} from './SceneManager';
import { RaySegment } from '../refraction/RefractionEngine';
import {
  MATERIALS,
  LIGHT_BEAM,
  PRISM_DEFAULTS,
  DEFAULT_CAMERA,
} from '../utils/constants';

interface Scene3DProps {
  onRaySelect: (info: SelectedRayInfo | null) => void;
}

export const Scene3D: React.FC<Scene3DProps> = ({ onRaySelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [config, setConfig] = useState(sceneManager.getConfig());
  const [glowPulse, setGlowPulse] = useState(0);
  const groupRef = useRef<THREE.Group>(null);

  React.useEffect(() => {
    return sceneManager.onChange(() => {
      setConfig(sceneManager.getConfig());
      setGlowPulse(1);
      setTimeout(() => setGlowPulse(0), 400);
    });
  }, []);

  React.useEffect(() => {
    return sceneManager.onRaySelected((info) => {
      onRaySelect(info);
    });
  }, [onRaySelect]);

  const refractiveIndex = MATERIALS[config.material].refractiveIndex;

  const refraction = useMemo(() => {
    return sceneManager.calculateRefraction();
  }, [config]);

  const lightPos = useMemo(() => {
    return sceneManager.getLightSourcePosition();
  }, [config.incidentAngle, config.lightDistance]);

  useFrame((state, delta) => {
    if (groupRef.current && config.shape === 'prism') {
      const rot = groupRef.current.rotation;
      sceneManager.setPrismRotation(new THREE.Euler(rot.x, rot.y, rot.z));
    }
  });

  const gridHelper = useMemo(() => {
    return {
      args: [20, 20] as [number, number],
      position: [0, -2, 0] as [number, number, number],
    };
  }, []);

  const handleRayClick = (
    e: ThreeEvent<MouseEvent>,
    index: number,
    segments: RaySegment[]
  ) => {
    e.stopPropagation();
    sceneManager.selectRay(index, segments);
  };

  const handleSceneClick = () => {
    sceneManager.selectRay(null, []);
  };

  const createPrismGeometry = () => {
    const size = PRISM_DEFAULTS.prismSize;
    const h = (size * Math.sqrt(3)) / 2;
    const depth = size * 0.8;

    const shape = new THREE.Shape();
    shape.moveTo(0, h / 2);
    shape.lineTo(-size / 2, -h / 2);
    shape.lineTo(size / 2, -h / 2);
    shape.closePath();

    const extrudeSettings = {
      depth: depth,
      bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings).translate(
      0,
      0,
      -depth / 2
    );
  };

  const prismMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x89cff0,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.9,
      transparent: true,
      opacity: 0.3,
      ior: refractiveIndex,
      thickness: 1,
      envMapIntensity: 1,
      emissive: 0x89cff0,
      emissiveIntensity: glowPulse * 0.5,
      side: THREE.DoubleSide,
    });
  }, [refractiveIndex, glowPulse]);

  const sphereMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x89cff0,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.95,
      transparent: true,
      opacity: 0.25,
      ior: refractiveIndex,
      thickness: 2,
      envMapIntensity: 1,
      emissive: 0x89cff0,
      emissiveIntensity: glowPulse * 0.5,
      side: THREE.DoubleSide,
    });
  }, [refractiveIndex, glowPulse]);

  const selectedIndex = sceneManager.getSelectedRayIndex();

  return (
    <>
      <color attach="background" args={[0x0f0c29]} />
      <fog attach="fog" args={[0x0f0c29, 15, 40]} />

      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, 5, -10]} intensity={0.4} color={0x89cff0} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.5}
        color={0xffffff}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={20}
        target={[0, 0, 0]}
      />

      <gridHelper
        args={gridHelper.args}
        position={gridHelper.position}
      >
        <lineBasicMaterial
          attach="material"
          color="#555555"
          transparent
          opacity={0.3}
        />
      </gridHelper>

      <group onClick={handleSceneClick}>
        <group ref={groupRef}>
          {config.shape === 'prism' ? (
            <mesh ref={meshRef} material={prismMaterial} geometry={createPrismGeometry()} />
          ) : (
            <mesh ref={meshRef} material={sphereMaterial}>
              <sphereGeometry args={[PRISM_DEFAULTS.sphereRadius, 64, 64]} />
            </mesh>
          )}
        </group>

        <mesh position={lightPos.toArray()}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={1}
          />
        </mesh>

        <Line
          points={[
            refraction.whiteRayStart,
            refraction.whiteRayEnd,
          ]}
          color="#ffffff"
          lineWidth={4}
          transparent
          opacity={0.6}
        />

        <mesh
          position={lightPos.toArray()}
          rotation={[0, 0, -Math.atan2(
            lightPos.x - refraction.whiteRayEnd.x,
            lightPos.y - refraction.whiteRayEnd.y
          )]}
        >
          <cylinderGeometry
            args={[LIGHT_BEAM.diameter / 2, LIGHT_BEAM.diameter / 2,
              lightPos.distanceTo(refraction.whiteRayEnd), 16, 1, true]}
            attach="geometry"
          />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        {refraction.segments.map((seg, index) => {
          const isSelected = selectedIndex === index;
          return (
            <group key={index}>
              <Line
                points={[seg.start, seg.end]}
                color={seg.color}
                lineWidth={isSelected ? 3 : 2}
                transparent
                opacity={0.85}
                onClick={(e) => handleRayClick(e, index, refraction.segments)}
              />
              <mesh
                position={seg.start.clone().add(seg.end).multiplyScalar(0.5).toArray()}
                rotation={[
                  0,
                  0,
                  Math.atan2(
                    seg.end.y - seg.start.y,
                    seg.end.x - seg.start.x
                  ) - Math.PI / 2,
                ]}
                onClick={(e) => handleRayClick(e, index, refraction.segments)}
              >
                <cylinderGeometry
                  args={[
                    LIGHT_BEAM.segmentDiameter / 2,
                    LIGHT_BEAM.segmentDiameter / 2,
                    seg.start.distanceTo(seg.end),
                    8,
                    1,
                    true,
                  ]}
                  attach="geometry"
                />
                <meshBasicMaterial
                  color={seg.color}
                  transparent
                  opacity={isSelected ? 0.6 : 0.35}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.5}
        />
      </EffectComposer>
    </>
  );
};
