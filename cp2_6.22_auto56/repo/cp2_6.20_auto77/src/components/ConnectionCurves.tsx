import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Link, MechanismProp, TriggerType } from '../types';
import { useStore } from '../store';

function ConnectionCurve({ link, props }: { link: Link; props: MechanismProp[] }) {
  const source = props.find((p) => p.id === link.sourceId);
  const target = props.find((p) => p.id === link.targetId);
  if (!source || !target) return null;

  const color = link.triggerType === TriggerType.Continuous ? '#4488ff' : '#ff8844';

  const curve = useMemo(() => {
    const s = new THREE.Vector3(source.position[0], source.position[1] + 0.5, source.position[2]);
    const e = new THREE.Vector3(target.position[0], target.position[1] + 0.5, target.position[2]);
    const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
    mid.y += 2;
    return new THREE.QuadraticBezierCurve3(s, mid, e);
  }, [source.position[0], source.position[1], source.position[2], target.position[0], target.position[1], target.position[2]]);

  const points = useMemo(() => curve.getPoints(30), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <group>
      <line geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.7} linewidth={2} />
      </line>
      <mesh position={curve.getPoint(0.98)}>
        <coneGeometry args={[0.12, 0.3, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export function ConnectionCurves() {
  const links = useStore((s) => s.links);
  const props = useStore((s) => s.props);

  return (
    <group>
      {links.map((link) => (
        <ConnectionCurve key={link.id} link={link} props={props} />
      ))}
    </group>
  );
}
