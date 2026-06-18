import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useJointStore } from '../store/useJointStore';
import { getJointConfig, JOINTS, JointKey, isAngleSafe } from '../utils/anatomyData';

const degToRad = (deg: number) => (deg * Math.PI) / 180;

interface BoneProps {
  start: [number, number, number];
  end: [number, number, number];
  radius?: number;
  color?: string;
}

function Bone({ start, end, radius = 0.08, color = '#e0e0e0' }: BoneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);

  const { position, quaternion, length } = useMemo(() => {
    const startV = new THREE.Vector3(...start);
    const endV = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(endV, startV);
    const length = direction.length();
    const position = new THREE.Vector3()
      .addVectors(startV, endV)
      .multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    return { position, quaternion, length };
  }, [start, end]);

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radius, radius, length, 6);
    geo.translate(0, 0, 0);
    return geo;
  }, [radius, length]);

  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(geometry),
    [geometry]
  );

  return (
    <group position={position} quaternion={quaternion}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.6}
          roughness={0.8}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments ref={lineRef} geometry={edgesGeometry}>
        <lineBasicMaterial color="#9e9e9e" transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}

interface JointBallProps {
  position: [number, number, number];
  color: string;
  radius?: number;
}

function JointBall({ position, color, radius = 0.1 }: JointBallProps) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 12, 12]} />
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

interface ArcTrajectoryProps {
  center: [number, number, number];
  startAngle: number;
  endAngle: number;
  axis: 'x' | 'y' | 'z';
  radius: number;
  color: string;
  planeNormal?: [number, number, number];
}

function ArcTrajectory({
  center,
  startAngle,
  endAngle,
  axis,
  radius,
  color
}: ArcTrajectoryProps) {
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const dotRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const startRad = degToRad(startAngle);
    const endRad = degToRad(endAngle);
    const steps = 48;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = startRad + (endRad - startRad) * t;
      let point: THREE.Vector3;

      if (axis === 'x') {
        point = new THREE.Vector3(
          center[0],
          center[1] + radius * Math.cos(angle),
          center[2] + radius * Math.sin(angle)
        );
      } else if (axis === 'y') {
        point = new THREE.Vector3(
          center[0] + radius * Math.sin(angle),
          center[1],
          center[2] + radius * Math.cos(angle)
        );
      } else {
        point = new THREE.Vector3(
          center[0] + radius * Math.sin(angle),
          center[1] + radius * Math.cos(angle),
          center[2]
        );
      }
      points.push(point);
    }

    setPoints(points);
  }, [center, startAngle, endAngle, axis, radius]);

  useFrame(({ clock }) => {
    if (dotRef.current) {
      const pulse = 0.6 + 0.4 * Math.sin(clock.elapsedTime * Math.PI * 2);
      (dotRef.current.material as THREE.MeshPhysicalMaterial).opacity = pulse;
    }
  });

  const endPoint = points.length > 0 ? points[points.length - 1] : null;

  if (points.length < 2) return null;

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={3}
        transparent
        opacity={0.35}
      />
      {endPoint && (
        <mesh
          ref={dotRef}
          key={`${endPoint.x}-${endPoint.y}-${endPoint.z}`}
          position={[endPoint.x, endPoint.y, endPoint.z]}
        >
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}

function Skeleton() {
  const groupRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const wristRef = useRef<THREE.Group>(null);
  const hipRef = useRef<THREE.Group>(null);
  const kneeRef = useRef<THREE.Group>(null);
  const ankleRef = useRef<THREE.Group>(null);

  const { angles, targetAngles, setAngle, addHistoryPoint } = useJointStore();

  useEffect(() => {
    JOINTS.forEach((joint) => {
      let ref: React.RefObject<THREE.Group>;
      switch (joint.key) {
        case 'shoulder':
          ref = shoulderRef;
          break;
        case 'elbow':
          ref = elbowRef;
          break;
        case 'wrist':
          ref = wristRef;
          break;
        case 'hip':
          ref = hipRef;
          break;
        case 'knee':
          ref = kneeRef;
          break;
        case 'ankle':
          ref = ankleRef;
          break;
      }

      if (ref && ref.current) {
        const obj = { value: angles[joint.key] };
        gsap.to(obj, {
          value: targetAngles[joint.key],
          duration: 0.3,
          ease: 'power3.out',
          onUpdate: () => {
            const rad = degToRad(obj.value);
            if (ref.current) {
              ref.current.rotation.set(
                joint.rotationAxis === 'x' ? rad : 0,
                joint.rotationAxis === 'y' ? rad : 0,
                joint.rotationAxis === 'z' ? rad : 0
              );
            }
            setAngle(joint.key, obj.value);
          },
          onComplete: () => {
            setAngle(joint.key, targetAngles[joint.key]);
          }
        });
      }
    });
  }, [targetAngles, setAngle]);

  useEffect(() => {
    const interval = setInterval(() => {
      JOINTS.forEach((joint) => {
        addHistoryPoint(joint.key, angles[joint.key]);
      });
    }, 250);
    return () => clearInterval(interval);
  }, [angles, addHistoryPoint]);

  const jointData = useMemo(() => {
    return {
      shoulder: {
        position: [0, 1.8, 0] as [number, number, number],
        config: getJointConfig('shoulder'),
        arcRadius: 0.7,
        refAngle: angles.shoulder
      },
      elbow: {
        position: [0.65, 1.55, 0] as [number, number, number],
        config: getJointConfig('elbow'),
        arcRadius: 0.45,
        refAngle: angles.elbow
      },
      wrist: {
        position: [0.65, 1.1, 0] as [number, number, number],
        config: getJointConfig('wrist'),
        arcRadius: 0.3,
        refAngle: angles.wrist
      },
      hip: {
        position: [0.2, 1.0, 0] as [number, number, number],
        config: getJointConfig('hip'),
        arcRadius: 0.6,
        refAngle: angles.hip
      },
      knee: {
        position: [0.2, 0.4, 0] as [number, number, number],
        config: getJointConfig('knee'),
        arcRadius: 0.45,
        refAngle: angles.knee
      },
      ankle: {
        position: [0.2, -0.15, 0] as [number, number, number],
        config: getJointConfig('ankle'),
        arcRadius: 0.25,
        refAngle: angles.ankle
      }
    };
  }, [angles]);

  return (
    <group ref={groupRef} position={[-0.1, 0, 0]} scale={1.1}>
      <Bone start={[0, 2.1, 0]} end={[0, 1.85, 0]} radius={0.11} />
      <group position={[0, 2.25, 0]}>
        <mesh>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshPhysicalMaterial
            color="#e0e0e0"
            transparent
            opacity={0.6}
            roughness={0.8}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.SphereGeometry(0.18, 12, 12)]} />
          <lineBasicMaterial color="#9e9e9e" transparent opacity={0.5} />
        </lineSegments>
      </group>

      <Bone start={[-0.22, 1.85, 0]} end={[0.22, 1.85, 0]} radius={0.075} />
      <Bone start={[0, 1.85, 0]} end={[0, 1.05, 0]} radius={0.13} />
      <Bone start={[-0.18, 1.05, 0]} end={[0.18, 1.05, 0]} radius={0.085} />

      <group ref={shoulderRef} position={jointData.shoulder.position}>
        <JointBall
          position={[0, 0, 0]}
          color={jointData.shoulder.config.color}
          radius={0.09}
        />
        <group>
          <Bone start={[0, 0, 0]} end={[0.65, -0.3, 0]} radius={0.065} />
          <group ref={elbowRef} position={[0.65, -0.3, 0]}>
            <JointBall
              position={[0, 0, 0]}
              color={jointData.elbow.config.color}
              radius={0.075}
            />
            <group>
              <Bone start={[0, 0, 0]} end={[0, -0.45, 0]} radius={0.055} />
              <group ref={wristRef} position={[0, -0.45, 0]}>
                <JointBall
                  position={[0, 0, 0]}
                  color={jointData.wrist.config.color}
                  radius={0.06}
                />
                <Bone
                  start={[0, 0, 0]}
                  end={[0, -0.18, 0]}
                  radius={0.045}
                />
              </group>
            </group>
          </group>
        </group>
      </group>

      <Bone start={[-0.6, 1.8, 0]} end={[-1.1, 1.4, 0]} radius={0.055} />
      <Bone start={[-1.1, 1.4, 0]} end={[-1.1, 1.0, 0]} radius={0.045} />

      <group ref={hipRef} position={jointData.hip.position}>
        <JointBall
          position={[0, 0, 0]}
          color={jointData.hip.config.color}
          radius={0.095}
        />
        <group>
          <Bone start={[0, 0, 0]} end={[0, -0.6, 0]} radius={0.075} />
          <group ref={kneeRef} position={[0, -0.6, 0]}>
            <JointBall
              position={[0, 0, 0]}
              color={jointData.knee.config.color}
              radius={0.075}
            />
            <group>
              <Bone start={[0, 0, 0]} end={[0, -0.55, 0]} radius={0.065} />
              <group ref={ankleRef} position={[0, -0.55, 0]}>
                <JointBall
                  position={[0, 0, 0]}
                  color={jointData.ankle.config.color}
                  radius={0.06}
                />
                <Bone
                  start={[0, 0, 0]}
                  end={[0, -0.15, 0.05]}
                  radius={0.05}
                />
              </group>
            </group>
          </group>
        </group>
      </group>

      <group position={[-0.2, 1.0, 0]}>
        <Bone start={[0, 0, 0]} end={[0, -0.6, 0]} radius={0.075} />
        <group position={[0, -0.6, 0]}>
          <Bone start={[0, 0, 0]} end={[0, -0.55, 0]} radius={0.065} />
          <group position={[0, -0.55, 0]}>
            <Bone start={[0, 0, 0]} end={[0, -0.15, 0.05]} radius={0.05} />
          </group>
        </group>
      </group>

      {JOINTS.map((joint) => {
        const data = jointData[joint.key as JointKey];
        const config = data.config;
        const range = config.range;
        const angle = data.refAngle;
        const isSafe = isAngleSafe(angle, range);
        const arcColor = isSafe ? config.color : '#FF4444';

        let startAngle = 90;
        let endAngle = 90 - angle;

        if (joint.rotationAxis === 'x') {
          startAngle = 0;
          endAngle = angle;
        }

        return (
          <ArcTrajectory
            key={joint.key}
            center={data.position}
            startAngle={Math.min(startAngle, endAngle)}
            endAngle={Math.max(startAngle, endAngle)}
            axis={joint.rotationAxis}
            radius={data.arcRadius}
            color={arcColor}
          />
        );
      })}
    </group>
  );
}

function GroundGrid() {
  return (
    <gridHelper
      args={[8, 16, '#3a3a5a', '#2a2a4a']}
      position={[0, -1.2, 0]}
    />
  );
}

export function Scene() {
  return (
    <div className="scene-container">
      <Canvas
        camera={{ position: [2.8, 1.8, 3.8], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#1a1a2e' }}
      >
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 8, 18]} />

        <ambientLight intensity={0.45} />
        <directionalLight
          position={[5, 6, 5]}
          intensity={0.9}
          castShadow
        />
        <directionalLight
          position={[-4, 3, -3]}
          intensity={0.35}
          color="#8888ff"
        />
        <pointLight position={[0, 2.5, 2]} intensity={0.5} color="#ffffff" />

        <GroundGrid />
        <Skeleton />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
          target={[0, 0.8, 0]}
        />
      </Canvas>
    </div>
  );
}

export default Scene;
