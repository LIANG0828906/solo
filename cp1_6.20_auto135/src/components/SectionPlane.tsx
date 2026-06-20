import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Stratum } from '@utils/geologyData';
import type { SectionCut } from '../App';

export interface SectionRegion {
  stratumId: string;
  topDepth: number;
  bottomDepth: number;
}

export interface SectionInfo {
  axis: 'x' | 'y' | 'z';
  position: number;
  regions: SectionRegion[];
  minDepth: number;
  maxDepth: number;
}

interface SectionPlaneProps {
  modelSize: { x: number; y: number; z: number };
  strata: Stratum[];
  sectionCut: SectionCut | null;
  onSectionInfo: (info: SectionInfo | null) => void;
}

function computeSectionInfo(
  sectionCut: SectionCut,
  strata: Stratum[],
  modelSize: { x: number; y: number; z: number }
): SectionInfo {
  const totalThickness = strata.reduce((sum, s) => sum + s.thickness, 0);
  const regions: SectionRegion[] = [];

  let cumulativeDepth = 0;
  for (const stratum of strata) {
    regions.push({
      stratumId: stratum.id,
      topDepth: cumulativeDepth,
      bottomDepth: cumulativeDepth + stratum.thickness
    });
    cumulativeDepth += stratum.thickness;
  }

  return {
    axis: sectionCut.axis,
    position: sectionCut.position,
    regions,
    minDepth: 0,
    maxDepth: totalThickness
  };
}

const SectionPlane: React.FC<SectionPlaneProps> = ({
  modelSize,
  strata,
  sectionCut,
  onSectionInfo
}) => {
  useEffect(() => {
    if (sectionCut && sectionCut.enabled) {
      const info = computeSectionInfo(sectionCut, strata, modelSize);
      onSectionInfo(info);
    } else {
      onSectionInfo(null);
    }
  }, [sectionCut, strata, modelSize, onSectionInfo]);

  const planeData = useMemo(() => {
    if (!sectionCut || !sectionCut.enabled) return null;

    let geometry: THREE.BufferGeometry;
    let position: [number, number, number];
    let rotation: [number, number, number];
    let width: number;
    let height: number;

    if (sectionCut.axis === 'x') {
      width = modelSize.y;
      height = modelSize.z;
      position = [sectionCut.position, modelSize.z / 2, modelSize.y / 2];
      rotation = [0, 0, 0];
    } else if (sectionCut.axis === 'y') {
      width = modelSize.x;
      height = modelSize.z;
      position = [modelSize.x / 2, modelSize.z / 2, sectionCut.position];
      rotation = [0, Math.PI / 2, 0];
    } else {
      width = modelSize.x;
      height = modelSize.y;
      position = [modelSize.x / 2, sectionCut.position, modelSize.y / 2];
      rotation = [Math.PI / 2, 0, 0];
    }

    geometry = new THREE.PlaneGeometry(width, height, 1, 1);

    return { geometry, position, rotation };
  }, [sectionCut, modelSize]);

  if (!planeData) return null;

  return (
    <group>
      <mesh
        position={planeData.position}
        rotation={planeData.rotation}
      >
        <primitive object={planeData.geometry} attach="geometry" />
        <meshBasicMaterial
          color="#5B9BD5"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments
        position={planeData.position}
        rotation={planeData.rotation}
      >
        <edgesGeometry args={[planeData.geometry]} />
        <lineBasicMaterial color="#5B9BD5" linewidth={2} />
      </lineSegments>
    </group>
  );
};

export default SectionPlane;
