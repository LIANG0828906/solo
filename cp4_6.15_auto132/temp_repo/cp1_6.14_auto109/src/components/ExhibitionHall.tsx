import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float, Environment, ContactShadows, Text, Sparkles } from '@react-three/drei';
import axios from 'axios';
import * as THREE from 'three';
import { ArrowLeft, Sparkles as SparklesIcon, Award, Info, Clock, Star } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { getArtifactById } from '../data/artifacts';
import type { RestorationRecord } from '../types';

const BG_THEMES: Record<string, { top: string; middle: string; bottom: string; sunColor: string; floor: string; accent: string }> = {
  'egypt-sunset': {
    top: '#1a0a00',
    middle: '#7a3a0a',
    bottom: '#fbbf24',
    sunColor: '#fde68a',
    floor: '#b45309',
    accent: '#f59e0b',
  },
  'greek-aegean': {
    top: '#001f3f',
    middle: '#003d6b',
    bottom: '#67e8f9',
    sunColor: '#e0f2fe',
    floor: '#0891b2',
    accent: '#22d3ee',
  },
  'china-palace': {
    top: '#1a0505',
    middle: '#5a0e0e',
    bottom: '#dc2626',
    sunColor: '#fecaca',
    floor: '#7f1d1d',
    accent: '#f87171',
  },
  'maya-jungle': {
    top: '#02100a',
    middle: '#14532d',
    bottom: '#22c55e',
    sunColor: '#bbf7d0',
    floor: '#166534',
    accent: '#4ade80',
  },
  'roman-colosseum': {
    top: '#1a0a05',
    middle: '#6b2e15',
    bottom: '#f4a460',
    sunColor: '#fef3c7',
    floor: '#92400e',
    accent: '#f97316',
  },
  'mesopotamia-ziggurat': {
    top: '#0a0810',
    middle: '#3b2a52',
    bottom: '#c4a66a',
    sunColor: '#f0e6c8',
    floor: '#713f12',
    accent: '#a78bfa',
  },
};

function SkyGradient({ theme }: { theme: keyof typeof BG_THEMES }) {
  const t = BG_THEMES[theme] ?? BG_THEMES['egypt-sunset'];
  const { scene } = useThree();
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, t.top);
    grad.addColorStop(0.4, t.middle);
    grad.addColorStop(0.75, t.bottom);
    grad.addColorStop(1, t.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 512);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    scene.background = tex;
    return () => {
      tex.dispose();
    };
  }, [theme, scene, t]);

  const sunRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (sunRef.current) {
      const s = 2 + Math.sin(clock.elapsedTime * 0.3) * 0.15;
      sunRef.current.scale.setScalar(s);
    }
  });

  return (
    <>
      <mesh ref={sunRef} position={[-10, 14, -28]}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color={t.sunColor} />
      </mesh>
      <pointLight position={[-10, 12, -28]} intensity={1.4} color={t.sunColor} distance={90} />
    </>
  );
}

function Pedestal({ theme }: { theme: keyof typeof BG_THEMES }) {
  const t = BG_THEMES[theme] ?? BG_THEMES['egypt-sunset'];
  return (
    <group position={[0, -1.35, 0]}>
      <mesh position={[0, 0.95, 0]} receiveShadow>
        <cylinderGeometry args={[1.35, 1.6, 0.35, 48]} />
        <meshStandardMaterial color={t.floor} metalness={0.2} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.65, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.35, 0.3, 48]} />
        <meshStandardMaterial color={'#1a1410'} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.12, 0]} receiveShadow>
        <cylinderGeometry args={[1.28, 1.28, 0.05, 48]} />
        <meshStandardMaterial color={'#fef3c7'} metalness={0.4} roughness={0.3} emissive={t.accent} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color={t.floor} roughness={0.9} metalness={0.05} />
      </mesh>
    </group>
  );
}

interface ArtifactMeshProps {
  record: RestorationRecord;
}

function ArtifactMesh({ record }: ArtifactMeshProps) {
  const artifact = getArtifactById(record.artifactId);
  const groupRef = useRef<THREE.Group>(null);
  const piecesRef = useRef<THREE.Group | null>(null);
  const palette = artifact?.fragments.map((f) => f.color) ?? ['#d4a574', '#c2956a', '#b8865b', '#a67b4d'];

  useFrame(({ clock }) => {
    if (piecesRef.current) {
      piecesRef.current.rotation.y = clock.elapsedTime * 0.35;
      piecesRef.current.position.y = 0.7 + Math.sin(clock.elapsedTime * 1.1) * 0.08;
      piecesRef.current.children.forEach((ch, i) => {
        const ang = clock.elapsedTime * 0.5 + i * 0.8;
        ch.position.y = (i - (artifact?.fragmentCount ?? 6) / 2) * 0.18 + Math.sin(ang) * 0.03;
        ch.rotation.x = Math.sin(ang * 0.6 + i) * 0.25;
        ch.rotation.z = Math.cos(ang * 0.4 + i) * 0.15;
      });
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.25;
    }
  });

  const frags = artifact?.fragments ?? [];

  return (
    <group ref={groupRef}>
      <group ref={piecesRef} position={[0, 0.7, 0]}>
        {frags.map((f, i) => {
          const n = i + 1;
          const angle = (i / frags.length) * Math.PI * 2;
          const radius = 0.22 + (i % 2) * 0.1;
          return (
            <Float key={f.id} speed={1.3 + i * 0.08} rotationIntensity={0.55} floatIntensity={0.5}>
              <mesh
                position={[
                  Math.cos(angle) * radius,
                  (i - frags.length / 2) * 0.18,
                  Math.sin(angle) * radius,
                ]}
                rotation={[i * 0.3, i * 0.5, i * 0.2]}
                castShadow
                receiveShadow
              >
                {n % 4 === 0 ? (
                  <dodecahedronGeometry args={[0.26 + (i % 3) * 0.04, 0]} />
                ) : n % 4 === 1 ? (
                  <icosahedronGeometry args={[0.24 + (i % 3) * 0.04, 0]} />
                ) : n % 4 === 2 ? (
                  <octahedronGeometry args={[0.27 + (i % 2) * 0.03, 0]} />
                ) : (
                  <boxGeometry args={[0.32 + (i % 2) * 0.04, 0.36, 0.26]} />
                )}
                <meshStandardMaterial
                  color={palette[i % palette.length]}
                  roughness={0.55}
                  metalness={0.2}
                  flatShading
                  emissive={palette[i % palette.length]}
                  emissiveIntensity={0.05}
                />
              </mesh>
              <mesh
                position={[
                  Math.cos(angle) * radius,
                  (i - frags.length / 2) * 0.18,
                  Math.sin(angle) * radius,
                ]}
              >
                <sphereGeometry args={[0.36, 16, 16]} />
                <meshBasicMaterial
                  color={palette[i % palette.length]}
                  transparent
                  opacity={0.08}
                />
              </mesh>
            </Float>
          );
        })}
      </group>
      <pointLight
        position={[0, 1.2, 0]}
        intensity={1.3}
        color={(artifact && BG_THEMES[artifact.backgroundType]?.accent) || '#fde68a'}
        distance={4.5}
      />
      <ContactShadows position={[0, 0.08, 0]} opacity={0.6} scale={7} blur={2.5} far={3.5} />
    </group>
  );
}

function GalleryInfoPanel({ record }: { record: RestorationRecord }) {
  const artifact = getArtifactById(record.artifactId);
  return (
    <Float speed={1} rotationIntensity={0} floatIntensity={0.35}>
      <group position={[2.8, 0.8, 1.5]} rotation={[0, -0.6, 0]}>
        <mesh position={[0, 0.8, 0]}>
          <planeGeometry args={[2.1, 1.65, 1, 1]} />
          <meshStandardMaterial color={'#1a1410'} roughness={0.4} metalness={0.35} transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.8, 0.001]}>
          <planeGeometry args={[2.02, 1.57, 1, 1]} />
          <meshBasicMaterial color={'#2a1e12'} side={THREE.DoubleSide} />
        </mesh>
        <Text
          position={[0, 1.42, 0.01]}
          fontSize={0.14}
          color={'#fde68a'}
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/cinzel/v16/8vIU7ww63mVu7gtR-kwKxNvkNOjw-tbnTYscAQ.woff"
        >
          {record.artifactName}
        </Text>
        <Text
          position={[0, 1.25, 0.01]}
          fontSize={0.07}
          color={'#fbbf24'}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          {artifact?.era ?? ''}
        </Text>
        <Text
          position={[-0.9, 0.95, 0.01]}
          fontSize={0.07}
          color={'#d4a574'}
          anchorX="left"
          anchorY="middle"
        >
          完整度：{record.integrity}%
        </Text>
        <Text
          position={[-0.9, 0.82, 0.01]}
          fontSize={0.07}
          color={'#d4a574'}
          anchorX="left"
          anchorY="middle"
        >
          准确率：{record.restorationAccuracy}%
        </Text>
        <Text
          position={[-0.9, 0.69, 0.01]}
          fontSize={0.07}
          color={'#d4a574'}
          anchorX="left"
          anchorY="middle"
        >
          用时：{Math.floor(record.digTime / 60)}:{(record.digTime % 60).toString().padStart(2, '0')}
        </Text>
        <Text
          position={[-0.9, 0.52, 0.01]}
          fontSize={0.07}
          color={'#fde68a'}
          anchorX="left"
          anchorY="middle"
        >
          {'★'.repeat(record.stars)}{'☆'.repeat(3 - record.stars)}
        </Text>
        <mesh position={[0, 0.002, 0]}>
          <boxGeometry args={[0.06, 1.65, 0.06]} />
          <meshStandardMaterial color={'#78350f'} metalness={0.3} roughness={0.7} />
        </mesh>
      </group>
    </Float>
  );
}

function GalleryScene({ record }: { record: RestorationRecord | null }) {
  const artifact = record ? getArtifactById(record.artifactId) : null;
  const theme = (artifact?.backgroundType as keyof typeof BG_THEMES) ?? 'egypt-sunset';
  void artifact;
  return (
    <>
      <SkyGradient theme={theme} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 6]} intensity={0.9} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-6, 4, -3]} intensity={0.3} color={BG_THEMES[theme]?.accent} />
      <Pedestal theme={theme} />
      {record && <ArtifactMesh record={record} />}
      {record && <GalleryInfoPanel record={record} />}
      <Sparkles count={40} scale={[12, 7, 12]} size={2} speed={0.4} color={BG_THEMES[theme]?.accent} />
      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={10}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2 - 0.08}
        autoRotate={!record}
        autoRotateSpeed={0.6}
      />
      <Environment preset="sunset" />
    </>
  );
}

export default function ExhibitionHall() {
  const navigate = useNavigate();
  const records = useGameStore((s) => s.restorationRecords);
  const setRecords = useGameStore((s) => s.setRecords);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/records');
        if (res.data?.success) {
          setRecords(res.data.data ?? []);
        }
      } catch (_e) {
        void _e;
      }
    })();
  }, [setRecords]);

  const selected = useMemo(
    () => records.find((r) => r.id === selectedId) ?? records[0] ?? null,
    [records, selectedId]
  );

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden text-amber-50"
      style={{
        background:
          'radial-gradient(ellipse at 30% 10%, rgba(253,224,71,0.08), transparent 50%),radial-gradient(ellipse at 80% 100%, rgba(14,165,233,0.1), transparent 55%),linear-gradient(135deg,#0a0a12 0%,#13121a 40%,#1a1720 100%)',
      }}
    >
      <header className="relative z-10 max-w-7xl mx-auto px-5 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 h-10 rounded-xl bg-white/5 backdrop-blur hover:bg-white/10 text-amber-100 transition-all duration-200 hover:scale-105 border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-[Lora] text-sm">返回</span>
        </button>
        <div className="text-center">
          <h1 className="font-[Cinzel] text-2xl font-bold tracking-wider bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 bg-clip-text text-transparent">
            历史收藏展览柜
          </h1>
          <p className="font-[Lora] text-xs text-amber-200/50 mt-0.5 tracking-widest">
            ARCHAEOLOGICAL GALLERY
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 h-10 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
          <Award className="w-4 h-4 text-amber-300" />
          <span className="font-[Cinzel] text-sm text-amber-100">藏品 {records.length}</span>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-5 pb-16 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 backdrop-blur-md h-[680px] overflow-y-auto space-y-3">
          <h2 className="font-[Cinzel] text-sm text-amber-200/80 font-semibold tracking-wider mb-2 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-amber-300" /> 藏品列表
          </h2>
          {records.length === 0 && (
            <div className="flex flex-col items-center justify-center h-80 text-center px-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/10 flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-amber-300/60" />
              </div>
              <p className="font-[Lora] text-amber-200/60 text-sm leading-relaxed mb-4">
                暂无修复完成的文物。完成一次挖掘与修复之旅后，您的藏品将在此 3D 展厅中熠熠生辉。
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-[Cinzel] text-sm font-semibold hover:scale-105 transition-transform"
              >
                开始探索
              </button>
            </div>
          )}
          {records.map((r) => (
            <RecordCard
              key={r.id}
              record={r}
              selected={selected?.id === r.id}
              onClick={() => setSelectedId(r.id)}
            />
          ))}
        </aside>

        <section
          className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          style={{ height: '680px' }}
        >
          <Canvas
            shadows
            camera={{ position: [0, 1.8, 5.2], fov: 45 }}
            dpr={[1, 1.8]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
          >
            <GalleryScene record={selected} />
          </Canvas>
          {selected && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
              <div className="rounded-xl bg-black/55 backdrop-blur px-4 py-2.5 border border-white/15">
                <div className="font-[Cinzel] text-lg text-amber-100 font-bold">{selected.artifactName}</div>
                <div className="font-[Lora] text-[11px] text-amber-200/70 mt-0.5">
                  {getArtifactById(selected.artifactId)?.era} ·{' '}
                  {(getArtifactById(selected.artifactId)?.region ?? '').toUpperCase()}
                </div>
              </div>
              <div className="rounded-xl bg-black/55 backdrop-blur px-3 py-2 border border-white/15 flex items-center gap-1.5">
                {[1, 2, 3].map((i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i <= selected.stars ? '#fde047' : 'rgba(92,74,47,0.45)'}
                    stroke={i <= selected.stars ? '#facc15' : 'rgba(202,172,120,0.45)'}
                    strokeWidth={1.8}
                    style={
                      i <= selected.stars
                        ? { filter: 'drop-shadow(0 0 5px rgba(253,224,71,0.65))' }
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}
          <div className="absolute bottom-4 right-4 z-10 rounded-xl bg-black/50 backdrop-blur px-4 py-2 border border-white/10">
            <div className="flex items-center gap-3 font-[Lora] text-[11px] text-amber-200/70">
              <span>🖱 拖拽旋转</span>
              <span>·</span>
              <span>滚轮缩放</span>
              <span>·</span>
              <span>支持触控</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function RecordCard({
  record,
  selected,
  onClick,
}: {
  record: RestorationRecord;
  selected: boolean;
  onClick: () => void;
}) {
  const artifact = getArtifactById(record.artifactId);
  const theme = (artifact?.backgroundType as keyof typeof BG_THEMES) ?? 'egypt-sunset';
  const t = BG_THEMES[theme];
  const bgGrad = `linear-gradient(160deg, ${t.top}, ${t.middle} 55%, ${t.bottom})`;
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left rounded-xl p-3 transition-all duration-200 hover:scale-[1.01] group',
        selected
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/15 border border-amber-400/40 shadow-lg shadow-amber-900/40'
          : 'bg-white/[0.03] border border-white/5 hover:border-amber-400/30 hover:bg-white/[0.07]',
      ].join(' ')}
    >
      <div className="flex gap-3">
        <div
          className="w-16 h-20 rounded-lg overflow-hidden shrink-0 relative"
          style={{ background: bgGrad }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 45%)',
            }}
          />
          <div
            className="absolute bottom-1 right-1 text-xl"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
          >
            🏺
          </div>
          <div
            className="absolute inset-x-0 bottom-0 h-1.5"
            style={{ background: t.accent, opacity: 0.85 }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-[Cinzel] text-amber-100 text-sm font-semibold truncate">
            {record.artifactName}
          </div>
          {artifact && (
            <div className="font-[Lora] text-[10px] text-amber-300/70 mt-0.5 truncate">
              {artifact.era}
            </div>
          )}
          <div className="flex items-center gap-0.5 mt-1.5 mb-1.5">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                size={11}
                fill={i <= record.stars ? '#fde047' : 'none'}
                stroke={i <= record.stars ? '#facc15' : '#5c4a2f'}
                strokeWidth={1.6}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 font-[Lora] text-[10px] text-amber-200/60">
            <span className="flex items-center gap-0.5">
              <Clock size={9} /> {Math.floor(record.digTime / 60)}:
              {(record.digTime % 60).toString().padStart(2, '0')}
            </span>
            <span>·</span>
            <span>{record.integrity}%完整</span>
          </div>
        </div>
      </div>
    </button>
  );
}
