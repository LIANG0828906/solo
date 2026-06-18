import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../../store/sceneStore';
import { createGroundTexture, generateObstacles } from '../terrain';

const Terrain: React.FC = () => {
  const setObstacles = useSceneStore((s) => s.setObstacles);
  const terrainSize = useSceneStore((s) => s.terrainSize);
  const resetSignal = useSceneStore((s) => s.stats.count);

  const { groundMaterial, obstaclesData } = useMemo(() => {
    const texture = createGroundTexture();
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0.0,
    });
    const obstacles = generateObstacles(terrainSize, 35);
    return { groundMaterial: material, obstaclesData: obstacles };
  }, [terrainSize, resetSignal]);

  useEffect(() => {
    setObstacles(obstaclesData);
  }, [obstaclesData, setObstacles]);

  const groundGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(terrainSize, terrainSize, 32, 32);
  }, [terrainSize]);

  const obstacleMeshes = useMemo(() => {
    return obstaclesData.map((obs, idx) => {
      let mesh: THREE.Mesh;

      if (obs.type === 'rock') {
        const geo = new THREE.DodecahedronGeometry(obs.radius, 0);
        const positions = geo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = positions.getZ(i);
          const scale = 0.85 + Math.random() * 0.3;
          positions.setXYZ(
            i,
            x * scale,
            y * scale * (0.6 + Math.random() * 0.5),
            z * scale
          );
        }
        geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(
            0.08 + Math.random() * 0.05,
            0.15,
            0.35 + Math.random() * 0.15
          ),
          roughness: 0.9,
          metalness: 0.05,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(obs.position);
        mesh.position.y = obs.height * 0.5;
        mesh.rotation.set(
          Math.random() * 0.5,
          Math.random() * Math.PI,
          Math.random() * 0.5
        );
      } else if (obs.type === 'grass') {
        const geo = new THREE.CylinderGeometry(
          obs.radius * 0.6,
          obs.radius,
          obs.height,
          5,
          1
        );
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(
            0.28 + Math.random() * 0.08,
            0.55,
            0.3 + Math.random() * 0.15
          ),
          roughness: 0.8,
          metalness: 0,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(obs.position);
        mesh.position.y = obs.height * 0.5;
        mesh.rotation.z = (Math.random() - 0.5) * 0.2;
        mesh.rotation.x = (Math.random() - 0.5) * 0.2;
      } else {
        const leafShape = new THREE.Shape();
        const r = obs.radius;
        leafShape.moveTo(0, -r);
        leafShape.quadraticCurveTo(r * 1.1, -r * 0.3, 0, r);
        leafShape.quadraticCurveTo(-r * 1.1, -r * 0.3, 0, -r);
        const geo = new THREE.ExtrudeGeometry(leafShape, {
          depth: obs.height,
          bevelEnabled: true,
          bevelThickness: 0.01,
          bevelSize: 0.02,
          bevelSegments: 1,
        });
        const hue =
          Math.random() < 0.5
            ? 0.25 + Math.random() * 0.1
            : 0.08 + Math.random() * 0.05;
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(hue, 0.45, 0.3 + Math.random() * 0.1),
          roughness: 0.85,
          metalness: 0,
          side: THREE.DoubleSide,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(obs.position);
        mesh.position.y = 0.01;
        mesh.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.15;
        mesh.rotation.z = Math.random() * Math.PI;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return { mesh, key: `obs-${idx}` };
    });
  }, [obstaclesData]);

  return (
    <group>
      <mesh
        geometry={groundGeometry}
        material={groundMaterial}
        rotation-x={-Math.PI / 2}
        receiveShadow
      />
      {obstacleMeshes.map(({ mesh, key }) => (
        <primitive key={key} object={mesh} />
      ))}
    </group>
  );
};

export default Terrain;
