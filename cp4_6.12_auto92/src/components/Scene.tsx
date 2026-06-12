import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useControlStore } from '../stores/controlStore';

function Ground() {
  const meshRef = useRef<THREE.Mesh>(null);
  const basePositions = useRef<Float32Array | null>(null);
  const geo = useMemo(() => new THREE.CircleGeometry(30, 64), []);

  useEffect(() => {
    if (meshRef.current) {
      const pos = meshRef.current.geometry.attributes.position;
      basePositions.current = new Float32Array(pos.array);
    }
  }, []);

  useFrame(() => {
    if (meshRef.current && basePositions.current) {
      const pos = meshRef.current.geometry.attributes.position;
      const time = performance.now() * 0.001;
      for (let i = 0; i < pos.count; i++) {
        const bx = basePositions.current[i * 3];
        const by = basePositions.current[i * 3 + 1];
        if (bx !== 0 || by !== 0) {
          const z = Math.sin(bx * 0.3 + time) * Math.cos(by * 0.3 + time * 0.7) * 0.15;
          pos.setZ(i, z);
        }
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} geometry={geo} receiveShadow>
      <meshStandardMaterial color="#7ea04d" roughness={0.9} />
    </mesh>
  );
}

function Seed({ visible, progress }: { visible: boolean; progress: number }) {
  const scale = progress < 0.03 ? 1 : Math.max(0, 1 - (progress - 0.03) / 0.07);
  return (
    <mesh position={[0, 0.25, 0]} visible={visible} scale={[scale, scale, scale]} castShadow>
      <sphereGeometry args={[0.25, 16, 16]} />
      <meshStandardMaterial color="#5c3a21" roughness={0.8} />
    </mesh>
  );
}

function buildStemCurve(adjustedHeight: number, lightBias: number): THREE.CubicBezierCurve3 {
  return new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(lightBias * 0.3, adjustedHeight * 0.33, 0),
    new THREE.Vector3(lightBias * 0.6, adjustedHeight * 0.66, 0),
    new THREE.Vector3(lightBias, adjustedHeight, 0)
  );
}

function buildStemLines(stemCurve: THREE.CubicBezierCurve3, stemRadius: number): THREE.BufferGeometry {
  const pts = stemCurve.getPoints(40);
  const linePositions: number[] = [];
  for (let idx = 0; idx < pts.length; idx++) {
    const t = idx / pts.length;
    const pt = pts[idx];
    const r = stemRadius * (1 - t * 0.5);
    const nextIdx = Math.min(idx + 1, pts.length - 1);
    const npt = pts[nextIdx];
    const nr = stemRadius * (1 - (nextIdx / pts.length) * 0.5);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const dx = Math.cos(a);
      const dz = Math.sin(a);
      linePositions.push(pt.x + dx * r, pt.y, pt.z + dz * r);
      linePositions.push(npt.x + dx * nr, npt.y, npt.z + dz * nr);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  return geo;
}

interface StemProps {
  progress: number;
  lightIntensity: number;
  temperature: number;
  soilMoisture: number;
}

function Stem({ progress, lightIntensity, temperature, soilMoisture }: StemProps) {
  const groupRef = useRef<THREE.Group>(null);

  const lightBias = ((lightIntensity - 50) / 100) * 0.8;
  const optimalTemp = 25;
  const tempFactor = 1 - Math.abs(temperature - optimalTemp) / 30;
  const growSpeed = Math.max(0.3, tempFactor);
  const stemHeight = 6 * progress;
  const adjustedHeight = stemHeight * growSpeed;

  const stemCurve = useMemo(() => buildStemCurve(adjustedHeight, lightBias), [adjustedHeight, lightBias]);

  const tubeGeo = useMemo(() => {
    if (adjustedHeight < 0.05) return null;
    return new THREE.TubeGeometry(stemCurve, 32, 0.12, 8, false);
  }, [stemCurve, adjustedHeight]);

  const lineGeo = useMemo(() => {
    if (adjustedHeight < 0.1) return null;
    return buildStemLines(stemCurve, 0.12);
  }, [stemCurve, adjustedHeight]);

  const tipPoint = useMemo(() => stemCurve.getPoint(1), [stemCurve]);

  const moistureFactor = soilMoisture / 100;

  return (
    <group ref={groupRef}>
      {tubeGeo && (
        <mesh geometry={tubeGeo} castShadow>
          <meshStandardMaterial color="#2e7d32" roughness={0.7} />
        </mesh>
      )}
      {lineGeo && (
        <lineSegments geometry={lineGeo}>
          <lineBasicMaterial color="#1b5e20" />
        </lineSegments>
      )}
      {progress > 0.3 && (
        <Branches
          stemCurve={stemCurve}
          progress={progress}
          lightIntensity={lightIntensity}
          moistureFactor={moistureFactor}
          tipPoint={tipPoint}
          temperature={temperature}
          soilMoisture={soilMoisture}
        />
      )}
    </group>
  );
}

interface BranchesProps {
  stemCurve: THREE.CubicBezierCurve3;
  progress: number;
  lightIntensity: number;
  moistureFactor: number;
  tipPoint: THREE.Vector3;
  temperature: number;
  soilMoisture: number;
}

interface BranchData {
  origin: THREE.Vector3;
  end: THREE.Vector3;
  side: number;
  curve: THREE.CubicBezierCurve3;
}

function Branches({ stemCurve, progress, lightIntensity, moistureFactor, tipPoint, temperature, soilMoisture }: BranchesProps) {
  const branchCount = Math.floor(Math.max(0, (progress - 0.3) / 0.1));
  const leafCount = Math.min(branchCount, Math.floor((lightIntensity / 20) * moistureFactor) + 1);

  const branches = useMemo(() => {
    const result: BranchData[] = [];
    for (let i = 0; i < branchCount; i++) {
      const t = 0.35 + (i / Math.max(branchCount, 1)) * 0.55;
      const origin = stemCurve.getPoint(Math.min(t, 0.95));
      const side = i % 2 === 0 ? 1 : -1;
      const angle = (Math.PI / 4) * side + ((lightIntensity - 50) / 100) * 0.3 * side;
      const len = 1.5 * progress * (0.6 + moistureFactor * 0.4);
      const end = new THREE.Vector3(
        origin.x + Math.cos(angle) * len * side,
        origin.y + len * 0.5,
        origin.z + Math.sin(angle) * len * 0.3
      );
      const curve = new THREE.CubicBezierCurve3(
        origin,
        new THREE.Vector3(
          origin.x + (end.x - origin.x) * 0.3,
          origin.y + (end.y - origin.y) * 0.6,
          origin.z
        ),
        new THREE.Vector3(
          origin.x + (end.x - origin.x) * 0.7,
          origin.y + (end.y - origin.y) * 0.8,
          end.z
        ),
        end
      );
      result.push({ origin, end, side, curve });
    }
    return result;
  }, [stemCurve, branchCount, lightIntensity, moistureFactor, progress]);

  return (
    <>
      {branches.map((b, i) => (
        <BranchMesh key={i} branch={b} hasLeaf={i < leafCount} curlFactor={1 - moistureFactor} leafWidth={0.3 + moistureFactor * 0.3} />
      ))}
      {progress > 0.85 && (
        <Flower
          position={tipPoint}
          lightIntensity={lightIntensity}
          soilMoisture={soilMoisture}
          temperature={temperature}
          progress={progress}
        />
      )}
    </>
  );
}

function BranchMesh({ branch, hasLeaf, curlFactor, leafWidth }: { branch: BranchData; hasLeaf: boolean; curlFactor: number; leafWidth: number }) {
  const tubeGeo = useMemo(() => new THREE.TubeGeometry(branch.curve, 16, 0.06, 6, false), [branch.curve]);

  return (
    <group>
      <mesh geometry={tubeGeo} castShadow>
        <meshStandardMaterial color="#388e3c" roughness={0.7} />
      </mesh>
      {hasLeaf && (
        <Leaf position={branch.end} curlFactor={curlFactor} leafWidth={leafWidth} side={branch.side} />
      )}
    </group>
  );
}

interface LeafProps {
  position: THREE.Vector3;
  curlFactor: number;
  leafWidth: number;
  side: number;
}

function Leaf({ position, curlFactor, leafWidth, side }: LeafProps) {
  const leafGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const w = leafWidth;
    const h = 0.8;
    shape.moveTo(0, 0);
    shape.bezierCurveTo(w * 0.5, h * 0.3, w * 0.5, h * 0.7, 0, h);
    shape.bezierCurveTo(-w * 0.5, h * 0.7, -w * 0.5, h * 0.3, 0, 0);

    const geo = new THREE.ShapeGeometry(shape, 8);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const normalizedY = y / h;
      pos.setZ(i, curlFactor * normalizedY * normalizedY * 0.5);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [leafWidth, curlFactor]);

  const leafColor = useMemo(() => {
    const green = new THREE.Color('#81c784');
    const darkGreen = new THREE.Color('#388e3c');
    return green.clone().lerp(darkGreen, curlFactor * 0.5);
  }, [curlFactor]);

  return (
    <group position={position} rotation={[0, side * 0.3, side * 0.5]}>
      <mesh geometry={leafGeo} rotation={[-Math.PI / 2 + 0.3, 0, 0]} castShadow>
        <meshStandardMaterial color={leafColor} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
    </group>
  );
}

interface FlowerProps {
  position: THREE.Vector3;
  lightIntensity: number;
  soilMoisture: number;
  temperature: number;
  progress: number;
}

function Flower({ position, lightIntensity, soilMoisture, temperature, progress }: FlowerProps) {
  const groupRef = useRef<THREE.Group>(null);

  const shouldBloom = lightIntensity > 70 && soilMoisture >= 60 && soilMoisture <= 80 && temperature >= 20 && temperature <= 30;
  const bloomProgress = shouldBloom ? Math.min((progress - 0.85) / 0.15, 1) : 0;

  useFrame(() => {
    if (groupRef.current && bloomProgress > 0) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  const petalGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.2, 0.15, 0.25, 0.4, 0, 0.55);
    shape.bezierCurveTo(-0.25, 0.4, -0.2, 0.15, 0, 0);
    return new THREE.ShapeGeometry(shape, 8);
  }, []);

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const delay = i * 0.1;
        const petalProgress = Math.max(0, Math.min(1, (bloomProgress * 2 - delay) * 1.5));
        if (petalProgress <= 0) return null;
        return (
          <group key={i} position={[0, 0.1, 0]} rotation={[0, angle + petalProgress * 0.1, 0]}>
            <mesh
              geometry={petalGeo}
              rotation={[-Math.PI / 2 + 0.3 * petalProgress, 0, 0]}
              scale={[petalProgress, petalProgress, petalProgress]}
            >
              <meshStandardMaterial color="#ff80ab" side={THREE.DoubleSide} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
      {bloomProgress > 0.3 && (
        <mesh position={[0, 0.12, 0]} castShadow>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#fdd835" roughness={0.4} emissive="#fdd835" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  );
}

function Plant() {
  const lightIntensity = useControlStore((s) => s.lightIntensity);
  const soilMoisture = useControlStore((s) => s.soilMoisture);
  const temperature = useControlStore((s) => s.temperature);
  const growthProgress = useControlStore((s) => s.growthProgress);
  const isGrowing = useControlStore((s) => s.isGrowing);
  const groupRef = useRef<THREE.Group>(null);

  const growStartTimeRef = useRef<number | null>(null);
  const growthDuration = 10;

  useEffect(() => {
    if (isGrowing) {
      growStartTimeRef.current = performance.now() / 1000;
    }
  }, [isGrowing]);

  useFrame(() => {
    if (isGrowing && growStartTimeRef.current !== null) {
      const elapsed = performance.now() / 1000 - growStartTimeRef.current;
      const optimalTemp = 25;
      const tempFactor = 1 - Math.abs(temperature - optimalTemp) / 30;
      const speedMul = 0.5 + tempFactor * 0.8;
      const rawProgress = Math.min(elapsed / growthDuration * speedMul, 1);

      const store = useControlStore.getState();
      const current = store.growthProgress;
      const smoothed = current + (rawProgress - current) * 0.05;

      store.setGrowthProgress(Math.min(smoothed, 1));

      if (smoothed < 0.05) {
        store.setPlantStage('sprouting');
      } else if (smoothed < 0.3) {
        store.setPlantStage('stem');
      } else if (smoothed < 0.85) {
        store.setPlantStage('branching');
      } else {
        store.setPlantStage('flowering');
      }
    }
  });

  const progress = growthProgress;
  const showSeed = progress < 0.1;

  return (
    <group ref={groupRef}>
      <Seed visible={showSeed} progress={progress} />
      {progress > 0.02 && (
        <Stem
          progress={progress}
          lightIntensity={lightIntensity}
          temperature={temperature}
          soilMoisture={soilMoisture}
        />
      )}
    </group>
  );
}

const Scene: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <hemisphereLight args={['#b3e5fc', '#7ea04d', 0.3]} />
      <Ground />
      <Plant />
    </>
  );
};

export default Scene;
