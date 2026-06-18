import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore, Point3D, ColorTheme } from '@/store/appStore';

const THEME_COLORS: Record<ColorTheme, { nodeFrom: string; nodeTo: string; lineFrom: string; lineTo: string; particleFrom: string; particleTo: string }> = {
  cool: {
    nodeFrom: '#00D2FF',
    nodeTo: '#3A7BD5',
    lineFrom: '#00D2FF',
    lineTo: '#3A7BD5',
    particleFrom: '#8A2BE2',
    particleTo: '#00BFFF',
  },
  warm: {
    nodeFrom: '#FF6B6B',
    nodeTo: '#FFD700',
    lineFrom: '#FF6B6B',
    lineTo: '#FFD700',
    particleFrom: '#FF4500',
    particleTo: '#FFD700',
  },
  nature: {
    nodeFrom: '#00FF88',
    nodeTo: '#C0C0C0',
    lineFrom: '#00FF88',
    lineTo: '#C0C0C0',
    particleFrom: '#32CD32',
    particleTo: '#E0E0E0',
  },
};

const hexToRgb = (hex: string): THREE.Color => new THREE.Color(hex);

interface OctahedronNodeProps {
  position: [number, number, number];
  colorFrom: THREE.Color;
  colorTo: THREE.Color;
  glowIntensity: number;
  index: number;
}

const OctahedronNode: React.FC<OctahedronNodeProps> = ({ position, colorFrom, colorTo, glowIntensity, index }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const t = (index % 10) / 10;
  const color = useMemo(() => colorFrom.clone().lerp(colorTo, t), [colorFrom, colorTo, t]);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
      const pulse = 1 + Math.sin(performance.now() * 0.002 + index) * 0.05;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.08, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={glowIntensity * 0.8}
        metalness={0.3}
        roughness={0.2}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

interface LineEdgesProps {
  nodes: Point3D[];
  edges: [number, number][];
  colorFrom: THREE.Color;
  colorTo: THREE.Color;
  glowIntensity: number;
}

const LineEdges: React.FC<LineEdgesProps> = ({ nodes, edges, colorFrom, colorTo, glowIntensity }) => {
  const lineRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    edges.forEach((edge, i) => {
      const a = nodes[edge[0]];
      const b = nodes[edge[1]];
      if (!a || !b) return;
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const t = (i % 10) / 10;
      const c = colorFrom.clone().lerp(colorTo, t);
      colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [nodes, edges, colorFrom, colorTo]);

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.7 + glowIntensity * 0.3} linewidth={1} />
    </lineSegments>
  );
};

interface ParticlesProps {
  nodes: Point3D[];
  colorFrom: THREE.Color;
  colorTo: THREE.Color;
  glowIntensity: number;
}

const Particles: React.FC<ParticlesProps> = ({ nodes, colorFrom, colorTo, glowIntensity }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 500;

  const { positions, baseIndices, offsets, speeds } = useMemo(() => {
    const pos: number[] = new Array(particleCount * 3).fill(0);
    const baseIdx: number[] = [];
    const off: number[] = [];
    const spd: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      baseIdx.push(Math.floor(Math.random() * Math.max(nodes.length, 1)));
      off.push((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
      spd.push(0.05 + Math.random() * 0.1);
    }
    return { positions: pos, baseIndices: baseIdx, offsets: off, speeds: spd };
  }, [nodes.length]);

  const colors = useMemo(() => {
    const cols: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const c = colorFrom.clone().lerp(colorTo, t);
      cols.push(c.r, c.g, c.b);
    }
    return cols;
  }, [colorFrom, colorTo, particleCount]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  useFrame(() => {
    if (!pointsRef.current || nodes.length === 0) return;
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const time = performance.now() * 0.001;

    for (let i = 0; i < particleCount; i++) {
      const nodeIdx = baseIndices[i] % nodes.length;
      const node = nodes[nodeIdx];
      if (!node) continue;
      const ox = offsets[i * 3];
      const oy = offsets[i * 3 + 1];
      const oz = offsets[i * 3 + 2];
      const speed = speeds[i];
      const phase = time * speed;
      const range = 0.05;
      arr[i * 3] = node.x + Math.sin(phase + ox * 10) * range;
      arr[i * 3 + 1] = node.y + Math.cos(phase * 1.3 + oy * 10) * range;
      arr[i * 3 + 2] = node.z + Math.sin(phase * 0.7 + oz * 10) * range;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.6 + glowIntensity * 0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

interface RotatingGroupProps {
  children: React.ReactNode;
  speed: number;
}

const RotatingGroup: React.FC<RotatingGroupProps> = ({ children, speed }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += speed * delta * 60;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

const SceneBackground: React.FC = () => {
  return (
    <mesh scale={[50, 50, 50]} position={[0, 0, -20]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        side={THREE.DoubleSide}
        uniforms={{
          uColorA: { value: new THREE.Color('#0B0B2B') },
          uColorB: { value: new THREE.Color('#1A1A4E') },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          varying vec2 vUv;
          void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            float t = smoothstep(0.0, 0.7, dist);
            vec3 color = mix(uColorB, uColorA, t);
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
};

export const Scene: React.FC = () => {
  const nodes = useAppStore((s) => s.latticeNodes);
  const edges = useAppStore((s) => s.latticeEdges);
  const rotationSpeed = useAppStore((s) => s.rotationSpeed);
  const glowIntensity = useAppStore((s) => s.glowIntensity);
  const colorTheme = useAppStore((s) => s.colorTheme);
  const isGenerated = useAppStore((s) => s.isGenerated);

  const theme = THEME_COLORS[colorTheme];
  const nodeFrom = hexToRgb(theme.nodeFrom);
  const nodeTo = hexToRgb(theme.nodeTo);
  const lineFrom = hexToRgb(theme.lineFrom);
  const lineTo = hexToRgb(theme.lineTo);
  const particleFrom = hexToRgb(theme.particleFrom);
  const particleTo = hexToRgb(theme.particleTo);

  return (
    <div className="scene-container">
      <Canvas
        camera={{ position: [5, 3, 5], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <SceneBackground />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color={theme.nodeFrom} />

        <RotatingGroup speed={rotationSpeed}>
          {isGenerated && nodes.length > 0 && (
            <>
              <LineEdges nodes={nodes} edges={edges} colorFrom={lineFrom} colorTo={lineTo} glowIntensity={glowIntensity} />
              {nodes.map((node, i) => (
                <OctahedronNode
                  key={i}
                  position={[node.x, node.y, node.z]}
                  colorFrom={nodeFrom}
                  colorTo={nodeTo}
                  glowIntensity={glowIntensity}
                  index={i}
                />
              ))}
              <Particles nodes={nodes} colorFrom={particleFrom} colorTo={particleTo} glowIntensity={glowIntensity} />
            </>
          )}
        </RotatingGroup>

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={2} maxDistance={20} />
      </Canvas>

      {!isGenerated && (
        <div className="scene-placeholder">
          <div className="placeholder-icon">💎</div>
          <div className="placeholder-text">在左侧绘制轮廓并点击生成</div>
          <div className="placeholder-sub">3D 动态晶格雕塑将在此展示</div>
        </div>
      )}
    </div>
  );
};
