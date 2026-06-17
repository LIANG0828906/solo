import React, { useMemo } from 'react';
import { GridConfig } from '../engine/types';

interface CityGridProps {
  config: GridConfig;
}

export const CityGrid: React.FC<CityGridProps> = ({ config }) => {
  const { sizeX, sizeZ, roadLength, roadWidth, intersectionSize } = config;
  const totalWidth = (sizeX - 1) * roadLength;
  const totalDepth = (sizeZ - 1) * roadLength;
  const offsetX = -totalWidth / 2;
  const offsetZ = -totalDepth / 2;

  const roads = useMemo(() => {
    const roadElements: React.ReactNode[] = [];

    for (let gx = 0; gx < sizeX; gx++) {
      for (let gz = 0; gz < sizeZ - 1; gz++) {
        const centerX = offsetX + gx * roadLength;
        const centerZ = offsetZ + (gz + 0.5) * roadLength;
        const roadKey = `road_ns_${gx}_${gz}`;

        roadElements.push(
          <mesh key={roadKey} position={[centerX, 0.01, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[roadWidth, roadLength - intersectionSize]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        );

        const sidewalkOffset = (roadWidth / 2) + 1.5;
        roadElements.push(
          <mesh key={`${roadKey}_sidewalk_left`} position={[centerX - sidewalkOffset, 0.02, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, roadLength - intersectionSize]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        );
        roadElements.push(
          <mesh key={`${roadKey}_sidewalk_right`} position={[centerX + sidewalkOffset, 0.02, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, roadLength - intersectionSize]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        );

        for (let lane = 1; lane < 4; lane++) {
          const laneOffset = (lane - 2) * 3;
          const dashLength = 2;
          const dashGap = 3;
          const segmentCount = Math.floor((roadLength - intersectionSize) / (dashLength + dashGap));

          for (let d = 0; d < segmentCount; d++) {
            const zPos = -(roadLength - intersectionSize) / 2 + d * (dashLength + dashGap) + dashLength / 2;
            roadElements.push(
              <mesh
                key={`${roadKey}_lane_${lane}_dash_${d}`}
                position={[centerX + laneOffset, 0.03, centerZ + zPos]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[0.15, dashLength]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            );
          }
        }
      }
    }

    for (let gx = 0; gx < sizeX - 1; gx++) {
      for (let gz = 0; gz < sizeZ; gz++) {
        const centerX = offsetX + (gx + 0.5) * roadLength;
        const centerZ = offsetZ + gz * roadLength;
        const roadKey = `road_ew_${gx}_${gz}`;

        roadElements.push(
          <mesh key={roadKey} position={[centerX, 0.01, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[roadLength - intersectionSize, roadWidth]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        );

        const sidewalkOffset = (roadWidth / 2) + 1.5;
        roadElements.push(
          <mesh key={`${roadKey}_sidewalk_top`} position={[centerX, 0.02, centerZ - sidewalkOffset]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[roadLength - intersectionSize, 3]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        );
        roadElements.push(
          <mesh key={`${roadKey}_sidewalk_bottom`} position={[centerX, 0.02, centerZ + sidewalkOffset]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[roadLength - intersectionSize, 3]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        );

        for (let lane = 1; lane < 4; lane++) {
          const laneOffset = (lane - 2) * 3;
          const dashLength = 2;
          const dashGap = 3;
          const segmentCount = Math.floor((roadLength - intersectionSize) / (dashLength + dashGap));

          for (let d = 0; d < segmentCount; d++) {
            const xPos = -(roadLength - intersectionSize) / 2 + d * (dashLength + dashGap) + dashLength / 2;
            roadElements.push(
              <mesh
                key={`${roadKey}_lane_${lane}_dash_${d}`}
                position={[centerX + xPos, 0.03, centerZ + laneOffset]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[dashLength, 0.15]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            );
          }
        }
      }
    }

    return roadElements;
  }, [sizeX, sizeZ, roadLength, roadWidth, intersectionSize, offsetX, offsetZ]);

  const intersections = useMemo(() => {
    const intersectionElements: React.ReactNode[] = [];

    for (let gx = 0; gx < sizeX; gx++) {
      for (let gz = 0; gz < sizeZ; gz++) {
        const centerX = offsetX + gx * roadLength;
        const centerZ = offsetZ + gz * roadLength;
        const key = `intersection_${gx}_${gz}`;

        intersectionElements.push(
          <mesh key={key} position={[centerX, 0.01, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[intersectionSize, intersectionSize]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        );

        intersectionElements.push(
          <mesh key={`${key}_island`} position={[centerX, 0.1, centerZ]}>
            <cylinderGeometry args={[3, 3, 0.2, 32]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
        );
      }
    }

    return intersectionElements;
  }, [sizeX, sizeZ, roadLength, intersectionSize, offsetX, offsetZ]);

  const streetLights = useMemo(() => {
    const lightElements: React.ReactNode[] = [];

    for (let gx = 0; gx < sizeX; gx++) {
      for (let gz = 0; gz < sizeZ - 1; gz++) {
        const centerX = offsetX + gx * roadLength;
        const startZ = offsetZ + gz * roadLength + intersectionSize / 2;
        const endZ = offsetZ + (gz + 1) * roadLength - intersectionSize / 2;
        const spacing = 20;
        const count = Math.floor((endZ - startZ) / spacing) + 1;

        for (let i = 0; i < count; i++) {
          const z = startZ + i * spacing;
          const offsetRoad = roadWidth / 2 + 3;

          lightElements.push(
            <group key={`light_ns_${gx}_${gz}_${i}_l`} position={[centerX - offsetRoad, 0, z]}>
              <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.1, 0.15, 6, 8]} />
                <meshStandardMaterial color="#444444" />
              </mesh>
              <mesh position={[0, 6, 0]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshStandardMaterial color="#FFFF99" emissive="#FFFF99" emissiveIntensity={1.5} />
              </mesh>
            </group>
          );

          lightElements.push(
            <group key={`light_ns_${gx}_${gz}_${i}_r`} position={[centerX + offsetRoad, 0, z]}>
              <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.1, 0.15, 6, 8]} />
                <meshStandardMaterial color="#444444" />
              </mesh>
              <mesh position={[0, 6, 0]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshStandardMaterial color="#FFFF99" emissive="#FFFF99" emissiveIntensity={1.5} />
              </mesh>
            </group>
          );
        }
      }
    }

    for (let gx = 0; gx < sizeX - 1; gx++) {
      for (let gz = 0; gz < sizeZ; gz++) {
        const centerZ = offsetZ + gz * roadLength;
        const startX = offsetX + gx * roadLength + intersectionSize / 2;
        const endX = offsetX + (gx + 1) * roadLength - intersectionSize / 2;
        const spacing = 20;
        const count = Math.floor((endX - startX) / spacing) + 1;

        for (let i = 0; i < count; i++) {
          const x = startX + i * spacing;
          const offsetRoad = roadWidth / 2 + 3;

          lightElements.push(
            <group key={`light_ew_${gx}_${gz}_${i}_t`} position={[x, 0, centerZ - offsetRoad]}>
              <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.1, 0.15, 6, 8]} />
                <meshStandardMaterial color="#444444" />
              </mesh>
              <mesh position={[0, 6, 0]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshStandardMaterial color="#FFFF99" emissive="#FFFF99" emissiveIntensity={1.5} />
              </mesh>
            </group>
          );

          lightElements.push(
            <group key={`light_ew_${gx}_${gz}_${i}_b`} position={[x, 0, centerZ + offsetRoad]}>
              <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.1, 0.15, 6, 8]} />
                <meshStandardMaterial color="#444444" />
              </mesh>
              <mesh position={[0, 6, 0]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshStandardMaterial color="#FFFF99" emissive="#FFFF99" emissiveIntensity={1.5} />
              </mesh>
            </group>
          );
        }
      }
    }

    return lightElements;
  }, [sizeX, sizeZ, roadLength, roadWidth, intersectionSize, offsetX, offsetZ]);

  const ground = useMemo(() => {
    const groundWidth = totalWidth + 100;
    const groundDepth = totalDepth + 100;

    return (
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[groundWidth, groundDepth]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    );
  }, [totalWidth, totalDepth]);

  return (
    <group>
      {ground}
      {roads}
      {intersections}
      {streetLights}
    </group>
  );
};
