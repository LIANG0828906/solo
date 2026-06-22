import { useEffect, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, Line, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAttackStore, startSimulation } from '../data/generator';
import { EARTH_RADIUS, geoCoordToVec3, createArcCurve } from '../visualization/scene';
import ControlPanel from './ControlPanel';

function generateEarthTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#0a1a30');
  oceanGrad.addColorStop(0.5, '#0d2545');
  oceanGrad.addColorStop(1, '#0a1a30');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1e5575';
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
  ctx.lineWidth = 1.5;

  const continents = [
    { x: 200, y: 180, w: 280, h: 200 },
    { x: 540, y: 140, w: 200, h: 320 },
    { x: 820, y: 100, w: 420, h: 280 },
    { x: 980, y: 400, w: 280, h: 380 },
    { x: 1280, y: 180, w: 220, h: 170 },
    { x: 1420, y: 330, w: 340, h: 220 },
    { x: 1620, y: 150, w: 300, h: 220 },
    { x: 280, y: 520, w: 220, h: 320 },
    { x: 80, y: 780, w: 180, h: 120 },
  ];

  for (const cont of continents) {
    ctx.beginPath();
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const noise =
        0.75 +
        Math.sin(t * 3 + cont.x * 0.01) * 0.12 +
        Math.cos(t * 5 + cont.y * 0.01) * 0.08 +
        Math.sin(t * 7 + cont.w) * 0.05;
      const rX = (cont.w / 2) * noise;
      const rY = (cont.h / 2) * noise;
      const x = cont.x + cont.w / 2 + Math.cos(t) * rX;
      const y = cont.y + cont.h / 2 + Math.sin(t) * rY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 24; i++) {
    const x = (i / 24) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i <= 12; i++) {
    const y = (i / 12) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  return canvas;
}

function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#00d4ff') },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);
          float pulse = 0.8 + sin(uTime * 1.5) * 0.2;
          vec3 color = uColor * fresnel * pulse;
          float alpha = fresnel * 0.6 * pulse;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh ref={meshRef} scale={[1.12, 1.12, 1.12]}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
}

function Earth() {
  const texture = useMemo(() => {
    const canvas = generateEarthTexture();
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 8;
    return tex;
  }, []);

  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group>
      <Sphere ref={meshRef} args={[EARTH_RADIUS, 64, 64]}>
        <meshStandardMaterial
          map={texture}
          color="#b0d0ff"
          emissive="#0c2040"
          emissiveIntensity={0.6}
          roughness={0.6}
          metalness={0.15}
        />
      </Sphere>
      <Atmosphere />
      <Sphere args={[EARTH_RADIUS * 1.02, 64, 64]}>
        <meshBasicMaterial
          color="#ff0040"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>
    </group>
  );
}

function StarfieldLayer() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.015;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.008) * 0.08;
      const parallax = new THREE.Vector3(
        camera.position.x * 0.02,
        camera.position.y * 0.02,
        0,
      );
      groupRef.current.position.copy(parallax);
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={80} depth={30} count={1000} factor={4} saturation={0.3} fade speed={0.3} />
    </group>
  );
}

function BackgroundGradient() {
  const meshRef = useRef<THREE.Mesh>(null);

  const gradientMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color('#1a0030') },
        uBottomColor: { value: new THREE.Color('#0a1628') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        varying vec2 vUv;
        void main() {
          vec3 color = mix(uBottomColor, uTopColor, vUv.y);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh ref={meshRef} scale={[200, 200, 200]}>
      <sphereGeometry args={[1, 32, 32]} />
      <primitive object={gradientMaterial} attach="material" />
    </mesh>
  );
}

function AttackPoint({ position, color, scale = 1 }: {
  position: THREE.Vector3;
  color: string;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const brightColor = useMemo(() => new THREE.Color(color).multiplyScalar(1.8), [color]);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(time * 3 + position.x * 10) * 0.35;
    const glowPulse = 0.8 + Math.sin(time * 2 + position.y * 10) * 0.4;
    const colorFlicker = 0.6 + Math.sin(time * 4 + position.z * 10) * 0.4;

    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale * pulse);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      tempColor.copy(baseColor).lerp(brightColor, colorFlicker);
      mat.color.copy(tempColor);
      mat.emissive.copy(tempColor);
      mat.emissiveIntensity = 0.5 + colorFlicker * 0.8;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(scale * 2.5 * glowPulse);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 * glowPulse;
      tempColor.copy(baseColor).lerp(brightColor, colorFlicker);
      mat.color.copy(tempColor);
    }
    if (outerGlowRef.current) {
      outerGlowRef.current.scale.setScalar(scale * 4 * (0.7 + Math.sin(time * 1.5) * 0.3));
      const mat = outerGlowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 * (0.7 + Math.sin(time * 1.5) * 0.3);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function AttackArc({ source, target, index }: {
  source: THREE.Vector3;
  target: THREE.Vector3;
  index: number;
}) {
  const lineRef = useRef<any>(null);
  const flowRef = useRef<THREE.Mesh>(null);
  const appearProgress = useRef(0);
  const prevSource = useRef<THREE.Vector3>(source.clone());
  const prevTarget = useRef<THREE.Vector3>(target.clone());
  const currentSource = useRef<THREE.Vector3>(source.clone());
  const currentTarget = useRef<THREE.Vector3>(target.clone());

  const { curve } = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(source, target).multiplyScalar(0.5);
    const dist = source.distanceTo(target);
    const arcHeight = 0.6 + dist * 0.2;

    const midNorm = mid.clone().normalize();
    const control = midNorm.multiplyScalar(EARTH_RADIUS + arcHeight);

    const curveObj = new THREE.QuadraticBezierCurve3(source, control, target);
    return { curve: curveObj };
  }, [source, target]);

  const linePoints = useMemo(() => curve.getPoints(40), [curve]);

  useFrame((state, delta) => {
    const t = (state.clock.elapsedTime * 0.3 + index * 0.15) % 1;

    if (appearProgress.current < 1) {
      appearProgress.current = Math.min(1, appearProgress.current + delta * 2);
    }

    currentSource.current.lerp(source, Math.min(1, delta * 4));
    currentTarget.current.lerp(target, Math.min(1, delta * 4));

    if (flowRef.current) {
      const pos = curve.getPoint(t);
      flowRef.current.position.copy(pos);
      flowRef.current.lookAt(curve.getPoint(Math.min(t + 0.05, 1)));
      flowRef.current.scale.setScalar(appearProgress.current);
      const mat = flowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 5 + index) * 0.5;
      mat.opacity = 0.8 * pulse * appearProgress.current;
    }

    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 1.5 + index * 0.5) * 0.3;
      mat.opacity = (0.25 + pulse * 0.25) * appearProgress.current;
    }
  });

  const flowGeom = useMemo(() => new THREE.ConeGeometry(0.03, 0.12, 8), []);

  return (
    <group>
      <Line
        ref={lineRef}
        points={linePoints}
        color="#ff0040"
        lineWidth={1.5}
        transparent
        opacity={0.4}
        toneMapped={false}
      />
      <mesh ref={flowRef} geometry={flowGeom}>
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.9}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function AttacksLayer() {
  const events = useAttackStore((s) => s.events);
  const filterType = useAttackStore((s) => s.filterType);

  const filtered = useMemo(() => {
    if (filterType === 'ALL') return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  const sourcePoints = useMemo(() => {
    const map = new Map<string, { pos: THREE.Vector3; bw: number }>();
    for (const e of filtered) {
      const pos = geoCoordToVec3(e.source, EARTH_RADIUS + 0.04);
      const key = `${e.source.lat.toFixed(0)}-${e.source.lng.toFixed(0)}`;
      if (!map.has(key) || map.get(key)!.bw < e.bandwidth) {
        map.set(key, { pos, bw: e.bandwidth });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  const targetPoints = useMemo(() => {
    const map = new Map<string, { pos: THREE.Vector3; bw: number }>();
    for (const e of filtered) {
      const pos = geoCoordToVec3(e.target, EARTH_RADIUS + 0.04);
      const key = `${e.target.lat.toFixed(0)}-${e.target.lng.toFixed(0)}`;
      if (!map.has(key) || map.get(key)!.bw < e.bandwidth) {
        map.set(key, { pos, bw: e.bandwidth });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  const displayEvents = useMemo(() => filtered.slice(0, 25), [filtered]);

  return (
    <group>
      {displayEvents.map((event, i) => {
        const src = geoCoordToVec3(event.source, EARTH_RADIUS + 0.04);
        const tgt = geoCoordToVec3(event.target, EARTH_RADIUS + 0.04);
        return <AttackArc key={event.id} source={src} target={tgt} index={i} />;
      })}

      {sourcePoints.map((p, i) => (
        <AttackPoint
          key={`src-${i}`}
          position={p.pos}
          color="#ff0040"
          scale={Math.max(0.35, Math.min(1.5, p.bw / 200))}
        />
      ))}

      {targetPoints.map((p, i) => (
        <AttackPoint
          key={`tgt-${i}`}
          position={p.pos}
          color="#00d4ff"
          scale={Math.max(0.3, Math.min(1.2, p.bw / 280))}
        />
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#0a0a1a']} />
      <fog attach="fog" args={['#1a0030', 15, 80]} />

      <ambientLight intensity={0.2} color="#4466aa" />
      <directionalLight position={[5, 3, 5]} intensity={0.7} color="#aaccff" />
      <pointLight position={[-5, -2, -5]} intensity={0.25} color="#ff0040" />
      <pointLight position={[0, 4, 3]} intensity={0.3} color="#00d4ff" />

      <BackgroundGradient />
      <StarfieldLayer />
      <Earth />
      <AttacksLayer />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.4}
        zoomSpeed={0.7}
        autoRotate
        autoRotateSpeed={0.3}
      />

      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export default function App() {
  useEffect(() => {
    startSimulation();
    return () => {};
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: '#0a0a1a',
      }}
    >
      <Canvas
        camera={{ position: [0, 0.8, 5.5], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 'bold',
              letterSpacing: '4px',
              fontFamily: "'Share Tech Mono', monospace",
              color: '#ff0040',
              textShadow: '0 0 25px rgba(255, 0, 64, 0.6)',
            }}
          >
            CYBER GLOBE
          </h1>
          <p
            style={{
              margin: '6px 0 0 0',
              fontSize: '12px',
              letterSpacing: '3px',
              fontFamily: "'Share Tech Mono', monospace",
              color: 'rgba(0, 212, 255, 0.8)',
            }}
          >
            GLOBAL DDoS ATTACK VISUALIZATION
          </p>
        </div>
        <div
          style={{
            pointerEvents: 'auto',
            textAlign: 'right',
            fontFamily: "'Share Tech Mono', monospace",
          }}
        >
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
            SOURCE: <span style={{ color: '#ff0040', textShadow: '0 0 8px rgba(255,0,64,0.5)' }}>●</span> RED
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
            TARGET: <span style={{ color: '#00d4ff', textShadow: '0 0 8px rgba(0,212,255,0.5)' }}>●</span> BLUE
          </div>
        </div>
      </div>

      <ControlPanel />
    </div>
  );
}
