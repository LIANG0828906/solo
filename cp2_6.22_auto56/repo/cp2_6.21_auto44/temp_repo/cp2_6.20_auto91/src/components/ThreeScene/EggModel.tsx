import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EGG_CONFIGS } from '../../utils/constants';

interface EggModelProps {
  eggType: string;
  progress: number;
  isIncubating: boolean;
}

interface CrackCurveData {
  curve: THREE.CatmullRomCurve3;
  progressThreshold: number;
  delay: number;
}

const EggModel = ({ eggType, progress, isIncubating }: EggModelProps) => {
  const eggRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const crackMeshesRef = useRef<THREE.Mesh[]>([]);

  const config = EGG_CONFIGS[eggType] || EGG_CONFIGS.phoenix;

  const crackData: CrackCurveData[] = useMemo(() => {
    const cracks: CrackCurveData[] = [];
    const startPoint = new THREE.Vector3(0, 0.3, 0);
    const numMainCracks = 10;

    for (let i = 0; i < numMainCracks; i++) {
      const theta = (i / numMainCracks) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const phi = Math.random() * 0.5 + 0.15;

      const r = 0.62;
      const endX = r * Math.sin(phi) * Math.cos(theta);
      const endY = r * Math.sin(phi) * Math.sin(theta) * 1.3;
      const endZ = r * Math.cos(phi);
      const endPoint = new THREE.Vector3(endX, endY, endZ);

      const controlPoints: THREE.Vector3[] = [startPoint.clone()];
      const numControls = 2 + Math.floor(Math.random() * 2);

      for (let j = 1; j < numControls; j++) {
        const t = j / numControls;
        const basePoint = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08
        );
        controlPoints.push(basePoint.add(offset));
      }
      controlPoints.push(endPoint);

      const mainCurve = new THREE.CatmullRomCurve3(controlPoints);
      const mainThreshold = 10 + (i / numMainCracks) * 70;

      cracks.push({
        curve: mainCurve,
        progressThreshold: mainThreshold,
        delay: 0,
      });

      const numBranches = Math.floor(Math.random() * 2) + 1;
      for (let b = 0; b < numBranches; b++) {
        const branchT = 0.3 + Math.random() * 0.4;
        const branchStart = mainCurve.getPointAt(branchT);

        const tangent = mainCurve.getTangentAt(branchT).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        let perpendicular = new THREE.Vector3().crossVectors(tangent, up).normalize();
        if (perpendicular.length() < 0.1) {
          perpendicular = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(1, 0, 0)).normalize();
        }
        const rotateAngle = Math.random() * Math.PI * 2;
        perpendicular.applyAxisAngle(tangent, rotateAngle);

        const branchDir = new THREE.Vector3()
          .addVectors(tangent.multiplyScalar(0.4), perpendicular.multiplyScalar(0.9))
          .normalize();

        const branchLength = 0.1 + Math.random() * 0.2;
        const branchEnd = branchStart.clone().add(branchDir.multiplyScalar(branchLength));

        const midOffset = new THREE.Vector3(
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04
        );

        const branchCurve = new THREE.CatmullRomCurve3([
          branchStart,
          branchStart.clone().lerp(branchEnd, 0.5).add(midOffset),
          branchEnd,
        ]);

        cracks.push({
          curve: branchCurve,
          progressThreshold: mainThreshold,
          delay: branchT * 0.5,
        });
      }
    }

    return cracks;
  }, []);

  const updateCrackGeometry = (mesh: THREE.Mesh, curve: THREE.CatmullRomCurve3, t: number) => {
    if (t <= 0.01) {
      mesh.visible = false;
      return;
    }

    const clampedT = Math.min(1, Math.max(0, t));
    const subPoints: THREE.Vector3[] = [];
    const numPoints = Math.max(2, Math.floor(64 * clampedT));

    for (let i = 0; i <= numPoints; i++) {
      const pt = curve.getPointAt((i / numPoints) * clampedT);
      subPoints.push(pt);
    }

    if (subPoints.length < 2) {
      mesh.visible = false;
      return;
    }

    const subCurve = new THREE.CatmullRomCurve3(subPoints);
    const geometry = new THREE.TubeGeometry(subCurve, Math.max(8, Math.floor(32 * clampedT)), 0.015, 8, false);

    mesh.geometry.dispose();
    mesh.geometry = geometry;
    mesh.visible = true;
  };

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (eggRef.current) {
      const floatOffset = Math.sin(time * 1.5) * 0.05;
      eggRef.current.position.y = floatOffset;

      if (isIncubating) {
        eggRef.current.rotation.y += 0.005;
      }
    }

    if (glowRef.current) {
      const glowIntensity = 0.3 + Math.sin(time * 2) * 0.1 + (progress / 100) * 0.5;
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = glowIntensity * 0.4;
    }

    crackMeshesRef.current.forEach((mesh, index) => {
      const crack = crackData[index];
      if (!crack || !mesh) return;

      if (progress >= crack.progressThreshold) {
        const rawProgress = (progress - crack.progressThreshold) / 20 - crack.delay;
        const crackProgress = Math.min(1, Math.max(0, rawProgress));
        updateCrackGeometry(mesh, crack.curve, crackProgress);
      } else {
        mesh.visible = false;
      }
    });
  });

  const eggColor = new THREE.Color(config.color);
  const glowColor = new THREE.Color(config.glowColor);
  const crackColor = new THREE.Color('#1a1a2e');

  return (
    <group ref={eggRef}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh scale={[1, 1.3, 1]}>
        <sphereGeometry args={[0.58, 64, 64]} />
        <meshStandardMaterial
          color={eggColor}
          metalness={0.4}
          roughness={0.4}
          emissive={glowColor}
          emissiveIntensity={0.1 + (progress / 100) * 0.3}
        />
      </mesh>

      {crackData.map((_, index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (el) crackMeshesRef.current[index] = el;
          }}
          visible={false}
        >
          <meshStandardMaterial
            color={crackColor}
            emissive={crackColor}
            emissiveIntensity={0.8}
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>
      ))}

      <pointLight
        position={[0, 0, 0]}
        color={glowColor}
        intensity={0.5 + (progress / 100) * 1.5}
        distance={3}
      />
    </group>
  );
};

export default EggModel;
