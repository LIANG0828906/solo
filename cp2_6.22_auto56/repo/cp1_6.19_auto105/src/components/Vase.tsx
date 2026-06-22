import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  vaseDimensions,
  generateBowlGeometry,
  generateInnerBowlGeometry,
  generateBlueWhiteTexture,
  generateCutawayGeometry,
  BODY_THICKNESS,
} from '@/models/vaseModel';
import { useStore } from '@/store/useStore';
import { easeOutCubic } from '@/animation/transition';

export function Vase() {
  const groupRef = useRef<THREE.Group>(null);
  const cutawayGroupLeftRef = useRef<THREE.Group>(null);
  const cutawayGroupRightRef = useRef<THREE.Group>(null);

  const mode = useStore((state) => state.mode);
  const repairProgress = useStore((state) => state.repairProgress);
  const isCutaway = useStore((state) => state.isCutaway);
  const cutawayProgress = useStore((state) => state.cutawayProgress);
  const platformRotation = useStore((state) => state.platformRotation);
  const isUserInteracting = useStore((state) => state.isUserInteracting);

  const outerGeometry = useMemo(
    () => generateBowlGeometry(vaseDimensions),
    []
  );

  const innerGeometry = useMemo(
    () => generateInnerBowlGeometry(vaseDimensions, BODY_THICKNESS),
    []
  );

  const damagedTexture = useMemo(
    () => generateBlueWhiteTexture(true, 0),
    []
  );

  const repairedTexture = useMemo(
    () => generateBlueWhiteTexture(false, 0),
    []
  );

  const cutawayGeometries = useMemo(
    () => generateCutawayGeometry(vaseDimensions, BODY_THICKNESS),
    []
  );

  const innerTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#F0EBE0';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#1A5BB5';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;

    for (let i = 0; i < 4; i++) {
      const y = (i + 1) * 100;
      ctx.beginPath();
      for (let x = 0; x < 512; x += 15) {
        const wave = Math.sin((x + i * 25) * 0.025) * 2;
        if (x === 0) {
          ctx.moveTo(x, y + wave);
        } else {
          ctx.lineTo(x, y + wave);
        }
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  useFrame((_, delta) => {
    if (!isUserInteracting && !isCutaway) {
      const rotation = platformRotation + delta * 0.15;
      useStore.getState().setPlatformRotation(rotation);
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = platformRotation;
    }

    const easedCutaway = easeOutCubic(cutawayProgress);
    const cutawayOffset = easedCutaway * 3;

    if (cutawayGroupLeftRef.current) {
      cutawayGroupLeftRef.current.position.x = -cutawayOffset;
      cutawayGroupLeftRef.current.visible = cutawayProgress > 0.01;
    }
    if (cutawayGroupRightRef.current) {
      cutawayGroupRightRef.current.position.x = cutawayOffset;
      cutawayGroupRightRef.current.visible = cutawayProgress > 0.01;
    }
  });

  useEffect(() => {
    const progress = mode === 'repaired' ? 1 : 0;
    const currentProgress = repairProgress;
    let animationId: number;
    let startTime: number | null = null;
    const duration = 2000;

    if (Math.abs(progress - currentProgress) < 0.001) return;

    useStore.getState().setRepairAnimating(true);

    const animate = (time: number) => {
      if (startTime === null) startTime = time;
      const elapsed = time - startTime;
      let t = Math.min(elapsed / duration, 1);
      t = easeOutCubic(t);

      const newProgress = currentProgress + (progress - currentProgress) * t;
      useStore.getState().setRepairProgress(newProgress);

      if (t < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        useStore.getState().setRepairAnimating(false);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [mode]);

  useEffect(() => {
    const progress = isCutaway ? 1 : 0;
    const currentProgress = cutawayProgress;
    let animationId: number;
    let startTime: number | null = null;
    const duration = 1500;

    if (Math.abs(progress - currentProgress) < 0.001) return;

    useStore.getState().setCutawayAnimating(true);

    const animate = (time: number) => {
      if (startTime === null) startTime = time;
      const elapsed = time - startTime;
      let t = Math.min(elapsed / duration, 1);
      t = easeOutCubic(t);

      const newProgress = currentProgress + (progress - currentProgress) * t;
      useStore.getState().setCutawayProgress(newProgress);

      if (t < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        useStore.getState().setCutawayAnimating(false);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isCutaway]);

  const porcelainMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: damagedTexture,
      roughness: 0.3,
      metalness: 0.05,
    });
  }, [damagedTexture]);

  useEffect(() => {
    const material = porcelainMaterial;
    const blendFactor = repairProgress;

    if (blendFactor > 0.5) {
      material.map = repairedTexture;
    } else {
      material.map = damagedTexture;
    }
    material.needsUpdate = true;

    material.roughness = 0.3 - blendFactor * 0.1;
    material.metalness = 0.05 + blendFactor * 0.05;
  }, [repairProgress, porcelainMaterial, damagedTexture, repairedTexture]);

  const innerMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: innerTexture,
      roughness: 0.4,
      metalness: 0.02,
      side: THREE.FrontSide,
    });
  }, [innerTexture]);

  const outerGlazeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xB0C4DE,
      transparent: true,
      opacity: 0.7,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
  }, []);

  const coreMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xFFFFF0,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }, []);

  const innerGlazeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xE8E8E8,
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
  }, []);

  return (
    <group ref={groupRef} position={[0, -3, 0]}>
      <group visible={cutawayProgress < 0.99}>
        <mesh
          geometry={outerGeometry}
          material={porcelainMaterial}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={innerGeometry}
          material={innerMaterial}
        />
      </group>

      <group ref={cutawayGroupLeftRef} visible={false}>
        <mesh geometry={cutawayGeometries.outerSlice} material={outerGlazeMaterial} />
        <mesh geometry={cutawayGeometries.coreSlice} material={coreMaterial} />
        <mesh geometry={cutawayGeometries.innerSlice} material={innerGlazeMaterial} />
      </group>

      <group ref={cutawayGroupRightRef} visible={false} scale={[-1, 1, 1]}>
        <mesh geometry={cutawayGeometries.outerSlice} material={outerGlazeMaterial} />
        <mesh geometry={cutawayGeometries.coreSlice} material={coreMaterial} />
        <mesh geometry={cutawayGeometries.innerSlice} material={innerGlazeMaterial} />
      </group>
    </group>
  );
}
