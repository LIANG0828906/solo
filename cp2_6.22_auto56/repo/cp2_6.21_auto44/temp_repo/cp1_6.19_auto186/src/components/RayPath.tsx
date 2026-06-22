import { useMemo } from 'react';
import * as THREE from 'three';
import { RayPath as RayPathType } from '../types';

interface RayPathProps {
  path: RayPathType;
  index: number;
  totalCount: number;
}

const START_COLOR = new THREE.Color(0xFF4500);
const END_COLOR = new THREE.Color(0x1E90FF);

const RayPathComponent = ({ path, index, totalCount }: RayPathProps) => {
  const { positions, colors } = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    path.points.forEach((p, i) => {
      positions.push(p.x, p.y, p.z);

      const t = i / (path.points.length - 1 || 1);
      const color = new THREE.Color().lerpColors(START_COLOR, END_COLOR, t);

      colors.push(color.r, color.g, color.b);
    });

    return { positions, colors };
  }, [path.points]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }, [positions, colors]);

  const arrowElement = useMemo(() => {
    if (path.points.length < 2) return null;

    const midIndex = Math.min(1, path.points.length - 1);
    const start = new THREE.Vector3(
      path.points[0]?.x || 0,
      path.points[0]?.y || 0,
      path.points[0]?.z || 0
    );
    const end = new THREE.Vector3(
      path.points[midIndex]?.x || 0,
      path.points[midIndex]?.y || 0,
      path.points[midIndex]?.z || 0
    );
    const dir = end.clone().sub(start).normalize();
    const arrowLength = path.isValid ? 0.4 : 0.2;
    const headLength = path.isValid ? 0.2 : 0.1;
    const headWidth = path.isValid ? 0.12 : 0.06;

    const arrowColor = path.isValid ? 0x1E90FF : 0x6495ED;

    return {
      dir,
      origin: start.clone().add(dir.clone().multiplyScalar(0.5)),
      length: arrowLength,
      color: arrowColor,
      headLength,
      headWidth,
    };
  }, [path.points, path.isValid]);

  const opacity = path.isValid ? 0.85 : 0.45;

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial 
          vertexColors 
          transparent 
          opacity={opacity}
        />
      </line>

      {arrowElement && (
        <arrowHelper
          args={[
            arrowElement.dir,
            arrowElement.origin,
            arrowElement.length,
            arrowElement.color,
            arrowElement.headLength,
            arrowElement.headWidth,
          ]}
        />
      )}
    </group>
  );
};

export default RayPathComponent;
