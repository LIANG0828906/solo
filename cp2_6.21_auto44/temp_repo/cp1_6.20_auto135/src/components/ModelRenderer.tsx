import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Stratum, Fault } from '@utils/geologyData';
import type { SectionCut } from '../App';

interface ModelRendererProps {
  strata: Stratum[];
  faults: Fault[];
  modelSize: { x: number; y: number; z: number };
  sectionCut: SectionCut | null;
}

interface HeightMap {
  getHeight: (x: number, y: number) => number;
  getStratumId: (x: number, y: number, depth: number) => string;
}

function createHeightMap(
  strata: Stratum[],
  faults: Fault[],
  modelSize: { x: number; y: number; z: number }
): HeightMap {
  const totalThickness = strata.reduce((sum, s) => sum + s.thickness, 0);

  const getFaultDisplacement = (x: number, y: number): number => {
    let totalDisp = 0;
    for (const fault of faults) {
      const strikeRad = (fault.strike * Math.PI) / 180;
      const dipRad = (fault.dip * Math.PI) / 180;
      const faultX = fault.position * modelSize.x;
      const faultY = 0.5 * modelSize.y;

      const dx = x - faultX;
      const dy = y - faultY;

      const perpDist = dx * Math.cos(strikeRad) + dy * Math.sin(strikeRad);
      const parallelDist = -dx * Math.sin(strikeRad) + dy * Math.cos(strikeRad);

      const faultWidth = modelSize.x * 0.15;
      const alongStrikeLimit = modelSize.y * 0.6;

      if (Math.abs(parallelDist) > alongStrikeLimit) continue;

      const influence = Math.exp(-Math.pow(perpDist / faultWidth, 2));
      const alongInfluence = 1 - Math.pow(parallelDist / alongStrikeLimit, 2);
      const disp = fault.type === 'normal' ? -fault.throw : fault.throw;

      totalDisp += disp * influence * Math.max(0, alongInfluence);
    }
    return totalDisp;
  };

  const getStratumBaseDepth = (index: number): number => {
    let depth = 0;
    for (let i = 0; i < index; i++) {
      depth += strata[i].thickness;
    }
    return depth;
  };

  return {
    getHeight: (x: number, y: number) => {
      return getFaultDisplacement(x, y);
    },
    getStratumId: (x: number, y: number, depth: number): string => {
      const disp = getFaultDisplacement(x, y);
      const adjustedDepth = depth - disp;

      let cumulative = 0;
      for (const stratum of strata) {
        cumulative += stratum.thickness;
        if (adjustedDepth <= cumulative) {
          return stratum.id;
        }
      }
      return strata[strata.length - 1].id;
    }
  };
}

function createStratumGeometry(
  stratum: Stratum,
  index: number,
  strata: Stratum[],
  faults: Fault[],
  modelSize: { x: number; y: number; z: number },
  resolution: number = 30
): THREE.BufferGeometry {
  const heightMap = createHeightMap(strata, faults, modelSize);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const totalThickness = strata.reduce((sum, s) => sum + s.thickness, 0);
  const topDepth = strata.slice(0, index).reduce((sum, s) => sum + s.thickness, 0);
  const bottomDepth = topDepth + stratum.thickness;

  const stepX = modelSize.x / resolution;
  const stepY = modelSize.y / resolution;

  for (let layer = 0; layer < 2; layer++) {
    const baseDepth = layer === 0 ? topDepth : bottomDepth;
    for (let iy = 0; iy <= resolution; iy++) {
      for (let ix = 0; ix <= resolution; ix++) {
        const x = ix * stepX;
        const y = iy * stepY;
        const disp = heightMap.getHeight(x, y);

        const depthFactor = (baseDepth + Math.abs(disp) * 0.1) / totalThickness;
        const z = modelSize.z - baseDepth + disp * (1 - depthFactor * 0.5);

        positions.push(x, z, y);
        normals.push(0, layer === 0 ? 1 : -1, 0);
        uvs.push(ix / resolution, iy / resolution);
      }
    }
  }

  const vertsPerLayer = (resolution + 1) * (resolution + 1);

  for (let layer = 0; layer < 2; layer++) {
    const layerOffset = layer * vertsPerLayer;
    for (let iy = 0; iy < resolution; iy++) {
      for (let ix = 0; ix < resolution; ix++) {
        const a = layerOffset + iy * (resolution + 1) + ix;
        const b = a + 1;
        const c = a + (resolution + 1);
        const d = c + 1;

        if (layer === 0) {
          indices.push(a, c, b);
          indices.push(b, c, d);
        } else {
          indices.push(a, b, c);
          indices.push(b, d, c);
        }
      }
    }
  }

  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < resolution; i++) {
      let a1: number, b1: number, a2: number, b2: number;

      if (side === 0) {
        a1 = i;
        b1 = i + 1;
        a2 = vertsPerLayer + i;
        b2 = vertsPerLayer + i + 1;
      } else if (side === 1) {
        a1 = resolution + i * (resolution + 1);
        b1 = resolution + (i + 1) * (resolution + 1);
        a2 = vertsPerLayer + resolution + i * (resolution + 1);
        b2 = vertsPerLayer + resolution + (i + 1) * (resolution + 1);
      } else if (side === 2) {
        a1 = resolution * (resolution + 1) + i;
        b1 = resolution * (resolution + 1) + i + 1;
        a2 = vertsPerLayer + resolution * (resolution + 1) + i;
        b2 = vertsPerLayer + resolution * (resolution + 1) + i + 1;
      } else {
        a1 = i * (resolution + 1);
        b1 = (i + 1) * (resolution + 1);
        a2 = vertsPerLayer + i * (resolution + 1);
        b2 = vertsPerLayer + (i + 1) * (resolution + 1);
      }

      indices.push(a1, a2, b1);
      indices.push(b1, a2, b2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createFaultGeometry(
  fault: Fault,
  modelSize: { x: number; y: number; z: number }
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  const strikeRad = (fault.strike * Math.PI) / 180;
  const dipRad = (fault.dip * Math.PI) / 180;

  const faultX = fault.position * modelSize.x;
  const centerY = modelSize.y * 0.5;

  const alongLen = modelSize.y * 0.8;
  const downLen = modelSize.z * 1.2;
  const width = 2;

  const alongDir = new THREE.Vector3(
    Math.sin(strikeRad),
    0,
    Math.cos(strikeRad)
  );

  const dipDir = new THREE.Vector3(
    Math.cos(strikeRad) * Math.sin(dipRad),
    -Math.cos(dipRad),
    -Math.sin(strikeRad) * Math.sin(dipRad)
  );

  const normal = new THREE.Vector3().crossVectors(alongDir, dipDir).normalize().multiplyScalar(width);

  const corners: THREE.Vector3[] = [];

  for (const side of [-1, 1]) {
    const offset = normal.clone().multiplyScalar(side * 0.5);
    for (const alongT of [-1, 1]) {
      for (const downT of [0, 1]) {
        const pos = new THREE.Vector3(faultX, modelSize.z * 0.8, centerY);
        pos.add(alongDir.clone().multiplyScalar(alongT * alongLen * 0.5));
        pos.add(dipDir.clone().multiplyScalar(downT * downLen));
        pos.add(offset);
        corners.push(pos);
      }
    }
  }

  for (const corner of corners) {
    positions.push(corner.x, corner.y, corner.z);
  }

  const faces = [
    [0, 1, 3], [0, 3, 2],
    [4, 7, 5], [4, 6, 7],
    [0, 4, 5], [0, 5, 1],
    [2, 7, 6], [2, 3, 7],
    [0, 2, 6], [0, 6, 4],
    [1, 5, 7], [1, 7, 3]
  ];

  for (const face of faces) {
    indices.push(...face);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

const ModelRenderer: React.FC<ModelRendererProps> = ({
  strata,
  faults,
  modelSize,
  sectionCut
}) => {
  const clipPlanes = useMemo(() => {
    if (!sectionCut || !sectionCut.enabled) return [];

    const plane = new THREE.Plane();
    if (sectionCut.axis === 'x') {
      plane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(sectionCut.position, 0, 0)
      );
    } else if (sectionCut.axis === 'y') {
      plane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, sectionCut.position)
      );
    } else {
      plane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, sectionCut.position, 0)
      );
    }
    return [plane];
  }, [sectionCut]);

  const stratumData = useMemo(() => {
    return strata.map((stratum, index) => {
      const geometry = createStratumGeometry(
        stratum,
        index,
        strata,
        faults,
        modelSize,
        25
      );

      const wireframeGeometry = new THREE.WireframeGeometry(geometry);

      return {
        stratum,
        geometry,
        wireframeGeometry
      };
    });
  }, [strata, faults, modelSize]);

  const faultData = useMemo(() => {
    return faults.map((fault) => ({
      fault,
      geometry: createFaultGeometry(fault, modelSize)
    }));
  }, [faults, modelSize]);

  return (
    <group position={[0, 0, 0]}>
      {stratumData.map(({ stratum, geometry, wireframeGeometry }, idx) => (
        <group key={stratum.id}>
          <mesh geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial
              color={stratum.color}
              side={THREE.DoubleSide}
              roughness={0.8}
              metalness={0.1}
              transparent={false}
              clippingPlanes={clipPlanes}
              clipShadows={true}
            />
          </mesh>
          <mesh geometry={wireframeGeometry}>
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.1 + stratum.textureDensity * 0.2}
              wireframe
              clippingPlanes={clipPlanes}
            />
          </mesh>
        </group>
      ))}

      {faultData.map(({ fault, geometry }) => (
        <group key={fault.id}>
          <mesh geometry={geometry}>
            <meshStandardMaterial
              color="#808080"
              side={THREE.DoubleSide}
              transparent
              opacity={0.5}
              clippingPlanes={clipPlanes}
            />
          </mesh>
          <lineSegments geometry={new THREE.EdgesGeometry(geometry)}>
            <lineDashedMaterial
              color="#ffffff"
              dashSize={5}
              gapSize={3}
              linewidth={2}
              transparent
              opacity={0.8}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
};

export default ModelRenderer;
