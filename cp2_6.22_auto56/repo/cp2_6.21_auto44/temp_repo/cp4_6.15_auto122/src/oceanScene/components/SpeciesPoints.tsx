import { useRef, useEffect, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../store';
import type { RenderableSpecies } from '../../types';

const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();
const tempPos = new THREE.Vector3();
const tempScale = new THREE.Vector3();
const dummyObj = new THREE.Object3D();

interface AnimState {
  id: string;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  currentScale: number;
  targetScale: number;
  currentOpacity: number;
  targetOpacity: number;
  basePulsePhase: number;
  colorStr: string;
  speciesData: RenderableSpecies;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function SpeciesPoints() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const renderableData = useOceanStore((s) => s.renderableData);
  const setHoveredSpecies = useOceanStore((s) => s.setHoveredSpecies);
  const setSelectedSpecies = useOceanStore((s) => s.setSelectedSpecies);
  const selectedSpecies = useOceanStore((s) => s.selectedSpecies);
  const hoveredSpecies = useOceanStore((s) => s.hoveredSpecies);

  const MAX_INSTANCES = 2000;
  const animStatesRef = useRef<AnimState[]>([]);
  const hoveredIdRef = useRef<number | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  useEffect(() => {
    const prevStates = animStatesRef.current;
    const newStates: AnimState[] = [];

    for (let i = 0; i < renderableData.length; i++) {
      const d = renderableData[i];
      const prev = prevStates[i];
      const targetPos = new THREE.Vector3(...d.position);
      const startPos = prev ? prev.currentPos.clone() : targetPos.clone();
      const startScale = prev ? prev.currentScale : d.scale;
      const startOpacity = prev ? prev.currentOpacity : d.opacity;

      newStates.push({
        id: d.speciesId + '-' + i,
        currentPos: startPos,
        targetPos,
        currentScale: startScale,
        targetScale: d.scale,
        currentOpacity: startOpacity,
        targetOpacity: d.opacity,
        basePulsePhase: Math.random() * Math.PI * 2,
        colorStr: d.color,
        speciesData: d,
      });
    }
    animStatesRef.current = newStates;
    hoveredIdRef.current = null;
    selectedIdRef.current = null;
  }, [renderableData]);

  useFrame((state, delta) => {
    if (!meshRef.current || !glowRef.current) return;
    const mesh = meshRef.current;
    const glow = glowRef.current;
    const t = state.clock.elapsedTime;

    const hoveredId = hoveredSpecies ? renderableData.findIndex(
      (r, idx) =>
        animStatesRef.current[idx]?.speciesData.speciesId === hoveredSpecies.speciesId &&
        Math.abs(animStatesRef.current[idx]?.speciesData.depth - hoveredSpecies.depth) < 8
    ) : -1;
    const selectedId = selectedSpecies ? renderableData.findIndex(
      (r, idx) =>
        animStatesRef.current[idx]?.speciesData.speciesId === selectedSpecies.speciesId &&
        Math.abs(animStatesRef.current[idx]?.speciesData.depth - selectedSpecies.depth) < 8
    ) : -1;

    const transitionT = Math.min(1, delta * 2.4);
    const easedTrans = easeInOutCubic(Math.min(1, transitionT * 1.8));

    for (let i = 0; i < renderableData.length; i++) {
      const anim = animStatesRef.current[i];
      if (!anim) continue;

      anim.currentPos.lerp(anim.targetPos, easedTrans * 0.32);
      anim.currentScale = lerp(anim.currentScale, anim.targetScale, easedTrans * 0.35);
      anim.currentOpacity = lerp(anim.currentOpacity, anim.targetOpacity, easedTrans * 0.35);

      const isHovered = i === hoveredId;
      const isSelected = i === selectedId;
      const pulse =
        1 +
        Math.sin(t * 2 + anim.basePulsePhase) * 0.05 +
        (isHovered ? 0.22 : 0) +
        (isSelected ? 0.35 : 0);
      const displayScale = Math.max(0.05, anim.currentScale * pulse);

      dummyObj.position.copy(anim.currentPos);
      dummyObj.scale.setScalar(displayScale);
      dummyObj.rotation.set(0, t * 0.3 + anim.basePulsePhase, 0);
      dummyObj.updateMatrix();

      mesh.setMatrixAt(i, dummyObj.matrix);
      tempColor.set(anim.colorStr);
      if (isHovered) tempColor.lerp(new THREE.Color('#ffffff'), 0.35);
      if (isSelected) tempColor.lerp(new THREE.Color('#ffffff'), 0.55);
      mesh.setColorAt(i, tempColor);

      const glowScale = displayScale * (isSelected ? 3.2 : isHovered ? 2.6 : 2.0);
      dummyObj.scale.setScalar(glowScale);
      dummyObj.updateMatrix();
      glow.setMatrixAt(i, dummyObj.matrix);
      tempColor.set(anim.colorStr);
      glow.setColorAt(i, tempColor);
    }

    for (let i = renderableData.length; i < MAX_INSTANCES; i++) {
      dummyObj.position.set(0, -9999, 0);
      dummyObj.scale.setScalar(0);
      dummyObj.updateMatrix();
      mesh.setMatrixAt(i, dummyObj.matrix);
      glow.setMatrixAt(i, dummyObj.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true;

    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.55 + Math.sin(t * 1.6) * 0.12;
  });

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.55, 1), []);
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(0.55, 14, 10), []);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const anim = animStatesRef.current[e.instanceId];
    if (anim) {
      hoveredIdRef.current = e.instanceId;
      setHoveredSpecies(anim.speciesData);
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'pointer';
      }
    }
  };

  const handlePointerOut = () => {
    hoveredIdRef.current = null;
    setHoveredSpecies(null);
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'default';
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const anim = animStatesRef.current[e.instanceId];
    if (anim) {
      selectedIdRef.current = e.instanceId;
      setSelectedSpecies(anim.speciesData);
    }
  };

  return (
    <>
      <instancedMesh
        ref={glowRef}
        args={[glowGeometry, undefined as unknown as THREE.Material | THREE.Material[], MAX_INSTANCES]}
      >
        <meshBasicMaterial
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined as unknown as THREE.Material | THREE.Material[], MAX_INSTANCES]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshStandardMaterial
          transparent
          opacity={0.92}
          roughness={0.22}
          metalness={0.08}
          emissive="#00e5ff"
          emissiveIntensity={0.55}
          blending={THREE.NormalBlending}
        />
      </instancedMesh>
    </>
  );
}
