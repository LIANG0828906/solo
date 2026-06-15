import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { BellData, WaveParticle } from './types';
import { BELLS, COLORS } from './constants';

interface BellSceneProps {
  onBellStrike: (bellId: number) => void;
  activeBellId: number | null;
  autoPlayBellId: number | null;
}

function hexToRgb(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function BellShape({ size }: { size: number }) {
  const geometry = useMemo(() => {
    const height = size / 100;
    const topRadius = height * 0.35;
    const bottomRadius = height * 0.5;
    const thickness = 0.05;
    const segments = 32;

    const bellShape = new THREE.Shape();
    bellShape.moveTo(0, 0);
    bellShape.quadraticCurveTo(topRadius, height * 0.1, topRadius * 0.9, height * 0.3);
    bellShape.quadraticCurveTo(bottomRadius * 0.95, height * 0.7, bottomRadius, height);
    bellShape.lineTo(bottomRadius - thickness, height);
    bellShape.quadraticCurveTo((bottomRadius - thickness) * 0.95, height * 0.7, (topRadius - thickness) * 0.9, height * 0.3);
    bellShape.quadraticCurveTo(topRadius - thickness, height * 0.1, thickness, 0);
    bellShape.lineTo(0, 0);

    const extrudeSettings = {
      steps: 1,
      depth: 0.02,
      bevelEnabled: false,
    };

    const geom = new THREE.ExtrudeGeometry(bellShape, extrudeSettings);
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, -height / 2, 0);

    const lathePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = t * height;
      let r;
      if (t < 0.3) {
        r = topRadius * (1 - t * 0.5);
      } else if (t < 0.7) {
        r = topRadius * 0.8 + (bottomRadius - topRadius * 0.8) * ((t - 0.3) / 0.4);
      } else {
        r = bottomRadius;
      }
      lathePoints.push(new THREE.Vector2(r, y));
    }
    const latheGeom = new THREE.LatheGeometry(lathePoints, segments);
    latheGeom.translate(0, -height / 2, 0);
    latheGeom.computeVertexNormals();

    return latheGeom;
  }, [size]);

  return <primitive object={new THREE.Mesh(geometry)} attach="geometry" />;
}

function PatinaMaterial({ color, isHovered }: { color: string; isHovered: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    baseColor: { value: hexToRgb(color) },
    patinaColor: { value: new THREE.Color('#2d5a3d') },
    time: { value: 0 },
    glowIntensity: { value: isHovered ? 0.2 : 0 },
  }), [color, isHovered]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.glowIntensity.value = isHovered ? 0.2 : 0;
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vNoise;

        uniform float time;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vNoise = snoise(position * 2.0 + vec3(time * 0.1));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vNoise;

        uniform vec3 baseColor;
        uniform vec3 patinaColor;
        uniform float glowIntensity;

        void main() {
          float noiseVal = vNoise * 0.5 + 0.5;
          float patinaMask = smoothstep(0.3, 0.7, noiseVal + vUv.y * 0.3);
          vec3 finalColor = mix(baseColor, patinaColor, patinaMask * 0.5);

          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          finalColor += fresnel * glowIntensity * vec3(1.0, 0.9, 0.6);

          float highlight = pow(max(dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))), 0.0), 8.0);
          finalColor += highlight * 0.2;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `}
    />
  );
}

function Bell({
  bell,
  isActive,
  onStrike,
}: {
  bell: BellData;
  isActive: boolean;
  onStrike: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const swingRef = useRef({ angle: 0, velocity: 0, isSwinging: false });

  const k = 0.8;
  const d = 0.2;

  const triggerStrike = useCallback(() => {
    swingRef.current.angle = 0.087;
    swingRef.current.velocity = 0;
    swingRef.current.isSwinging = true;
    onStrike();
  }, [onStrike]);

  useFrame(() => {
    if (groupRef.current && swingRef.current.isSwinging) {
      const { angle, velocity } = swingRef.current;
      const acceleration = -k * angle - d * velocity;
      const newVelocity = velocity + acceleration * 0.016;
      const newAngle = angle + newVelocity * 0.016;
      swingRef.current.angle = newAngle;
      swingRef.current.velocity = newVelocity;
      groupRef.current.rotation.z = newAngle;
      if (Math.abs(newAngle) < 0.001 && Math.abs(newVelocity) < 0.001) {
        swingRef.current.isSwinging = false;
        groupRef.current.rotation.z = 0;
      }
    }
  });

  useEffect(() => {
    if (isActive) {
      triggerStrike();
    }
  }, [isActive, triggerStrike]);

  const bellHeight = bell.size / 100;

  return (
    <group position={bell.position}>
      <mesh position={[0, bellHeight / 2 + 0.1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <group
        ref={groupRef}
        position={[0, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          triggerStrike();
        }}
      >
        <mesh>
          <BellShape size={bell.size} />
          <PatinaMaterial color={bell.color} isHovered={isHovered} />
        </mesh>
        <Text
          position={[0, -bellHeight * 0.1, 0.31]}
          fontSize={isHovered ? 0.08 : 0.05}
          color="#f0d080"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/notoserifsc/v19/H4chBXePl9DZ0Xe7gG9cyOj7oqOZVw.woff"
        >
          {bell.inscription}
        </Text>
      </group>
    </group>
  );
}

function Mallet({ targetBell }: { targetBell: BellData | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentTarget, setCurrentTarget] = useState<BellData | null>(null);
  const animRef = useRef({ progress: 0, isMoving: false, phase: 'idle' });

  useEffect(() => {
    if (targetBell) {
      setCurrentTarget(targetBell);
      animRef.current.progress = 0;
      animRef.current.isMoving = true;
      animRef.current.phase = 'forward';
    }
  }, [targetBell]);

  useFrame((_, delta) => {
    if (!groupRef.current || !currentTarget || !animRef.current.isMoving) return;

    const speed = 5;
    const { progress, phase } = animRef.current;

    if (phase === 'forward') {
      animRef.current.progress = Math.min(progress + delta * speed, 1);
      if (animRef.current.progress >= 1) {
        animRef.current.phase = 'backward';
      }
    } else if (phase === 'backward') {
      animRef.current.progress = Math.max(progress - delta * speed, 0);
      if (animRef.current.progress <= 0) {
        animRef.current.isMoving = false;
        animRef.current.phase = 'idle';
      }
    }

    const t = animRef.current.progress;
    const easeT = 1 - Math.pow(1 - t, 3);

    const startPos = new THREE.Vector3(4, 3, 0);
    const targetPos = new THREE.Vector3(
      currentTarget.position[0] + 0.5,
      currentTarget.position[1],
      currentTarget.position[2]
    );
    const currentPos = startPos.clone().lerp(targetPos, easeT);

    const direction = targetPos.clone().sub(startPos).normalize();
    const angle = Math.atan2(direction.y, direction.x);

    groupRef.current.position.copy(currentPos);
    groupRef.current.rotation.z = angle - Math.PI / 2;
  });

  return (
    <group ref={groupRef} position={[4, 3, 0]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 12]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#8b0000" roughness={0.8} />
      </mesh>
    </group>
  );
}

function WaveRings({ particles }: { particles: WaveParticle[] }) {
  return (
    <group>
      {particles.map((p) => (
        <mesh key={p.id} position={p.position} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[p.radius * 0.9, p.radius, 64]} />
          <meshBasicMaterial
            color="#ffd700"
            transparent
            opacity={p.opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function BellFrame() {
  const frameColor = '#3e2723';
  const postRadius = 0.08;
  const beamRadius = 0.1;

  return (
    <group>
      <mesh position={[-3.2, 3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[postRadius, postRadius, 6, 12]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      <mesh position={[3.2, 3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[postRadius, postRadius, 6, 12]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 5.8, 0]}>
        <cylinderGeometry args={[beamRadius, beamRadius, 7, 12]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 4.8, 0]}>
        <cylinderGeometry args={[beamRadius, beamRadius, 6.5, 12]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.0, 0]}>
        <cylinderGeometry args={[beamRadius, beamRadius, 6.5, 12]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
    </mesh>
  );
}

function SceneContent({
  onBellStrike,
  activeBellId,
  autoPlayBellId,
  waveParticles,
  targetBell,
}: {
  onBellStrike: (bellId: number) => void;
  activeBellId: number | null;
  autoPlayBellId: number | null;
  waveParticles: WaveParticle[];
  targetBell: BellData | null;
}) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      <spotLight
        position={[0, 8, 3]}
        angle={0.4}
        penumbra={0.5}
        intensity={1}
        castShadow
        target-position={[0, 3, 0]}
      />
      <Ground />
      <BellFrame />
      {BELLS.map((bell) => (
        <Bell
          key={bell.id}
          bell={bell}
          isActive={autoPlayBellId === bell.id}
          onStrike={() => onBellStrike(bell.id)}
        />
      ))}
      <Mallet targetBell={targetBell} />
      <WaveRings particles={waveParticles} />
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

interface SceneWrapperProps extends BellSceneProps {
  waveParticles: WaveParticle[];
  targetBell: BellData | null;
}

function BellSceneComponent({
  onBellStrike,
  activeBellId,
  autoPlayBellId,
  waveParticles,
  targetBell,
}: SceneWrapperProps) {
  return (
    <Canvas
      camera={{ position: [0, 3, 10], fov: 50 }}
      shadows
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={[COLORS.background]} />
      <fog attach="fog" args={[COLORS.background, 10, 25]} />
      <SceneContent
        onBellStrike={onBellStrike}
        activeBellId={activeBellId}
        autoPlayBellId={autoPlayBellId}
        waveParticles={waveParticles}
        targetBell={targetBell}
      />
    </Canvas>
  );
}

export const BellScene = React.memo(BellSceneComponent);
