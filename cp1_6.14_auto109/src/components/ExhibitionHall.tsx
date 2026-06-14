import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import { ArrowLeft, Star, Clock, Sparkles, Award, Info } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { getArtifactById } from '../data/artifacts';
import type { RestorationRecord } from '../types';

const BG_GRADIENTS: Record<string, string> = {
  'egypt-sunset':
    'linear-gradient(180deg,#1a0a00 0%,#7a3a0a 35%,#d97706 65%,#fbbf24 90%,#fde68a 100%)',
  'greek-aegean':
    'linear-gradient(180deg,#001f3f 0%,#003d6b 30%,#0891b2 55%,#67e8f9 78%,#e0f2fe 100%)',
  'china-palace':
    'linear-gradient(180deg,#1a0505 0%,#5a0e0e 25%,#991b1b 55%,#dc2626 80%,#fecaca 100%)',
  'maya-jungle':
    'linear-gradient(180deg,#02100a 0%,#14532d 30%,#166534 55%,#22c55e 80%,#bbf7d0 100%)',
  'roman-colosseum':
    'linear-gradient(180deg,#1a0a05 0%,#6b2e15 30%,#a8552b 55%,#f4a460 80%,#fef3c7 100%)',
  'mesopotamia-ziggurat':
    'linear-gradient(180deg,#0a0810 0%,#3b2a52 30%,#6b5a8f 55%,#c4a66a 80%,#f0e6c8 100%)',
};

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
    <div className="min-h-screen w-full relative overflow-hidden text-amber-50"
      style={{
        background:
          'radial-gradient(ellipse at 30% 10%, rgba(253,224,71,0.08), transparent 50%),radial-gradient(ellipse at 80% 100%, rgba(14,165,233,0.1), transparent 55%),linear-gradient(135deg,#0a0a12 0%,#13121a 40%,#1a1720 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 50], fov: 60 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent' }}
        >
          <Stars radius={100} depth={50} count={2000} factor={3} saturation={0} fade speed={0.5} />
        </Canvas>
      </div>

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

      <main className="relative z-10 max-w-7xl mx-auto px-5 pb-16 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 backdrop-blur-md h-[640px] overflow-y-auto space-y-3">
          <h2 className="font-[Cinzel] text-sm text-amber-200/80 font-semibold tracking-wider mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" /> 藏品列表
          </h2>
          {records.length === 0 && (
            <div className="flex flex-col items-center justify-center h-80 text-center px-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/10 flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-amber-300/60" />
              </div>
              <p className="font-[Lora] text-amber-200/60 text-sm leading-relaxed mb-4">
                暂无修复完成的文物。完成一次挖掘与修复之旅后，您的藏品将在此陈列。
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
            <RecordCard key={r.id} record={r} selected={selectedId === r.id || (!selectedId && selected?.id === r.id)} onClick={() => setSelectedId(r.id)} />
          ))}
        </aside>

        <section className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
          {selected ? (
            <ArtworkViewer record={selected} />
          ) : (
            <div className="h-[640px] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-60">🏺</div>
                <p className="font-[Lora] text-amber-200/60">选择一件文物开始欣赏</p>
              </div>
            </div>
          )}
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
  const art = getArtifactById(record.artifactId);
  const bg = art ? BG_GRADIENTS[art.backgroundType] ?? BG_GRADIENTS['egypt-sunset'] : BG_GRADIENTS['egypt-sunset'];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-3 transition-all duration-200 hover:scale-[1.01] group ${
        selected
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/15 border border-amber-400/40 shadow-lg shadow-amber-900/40'
          : 'bg-white/[0.03] border border-white/5 hover:border-amber-400/30 hover:bg-white/[0.07]'
      }`}
    >
      <div className="flex gap-3">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
          style={{ background: bg }}
        >
          <div className="text-2xl">🏺</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-[Cinzel] text-amber-100 text-sm font-semibold truncate">
            {record.artifactName}
          </div>
          <div className="flex items-center gap-0.5 mt-0.5 mb-1">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                size={12}
                fill={i <= record.stars ? '#fde047' : 'none'}
                stroke={i <= record.stars ? '#facc15' : '#5c4a2f'}
                strokeWidth={1.5}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 font-[Lora] text-[11px] text-amber-200/60">
            <span className="flex items-center gap-0.5">
              <Clock size={10} /> {Math.floor(record.digTime / 60)}:{(record.digTime % 60).toString().padStart(2, '0')}
            </span>
            <span>·</span>
            <span>{record.integrity}%完整度</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ArtworkViewer({ record }: { record: RestorationRecord }) {
  const art = getArtifactById(record.artifactId);
  const bg = art ? BG_GRADIENTS[art.backgroundType] ?? BG_GRADIENTS['egypt-sunset'] : BG_GRADIENTS['egypt-sunset'];

  return (
    <div className="h-[640px] relative">
      <div className="absolute inset-0" style={{ background: bg }} />
      <div className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.3), transparent 60%)',
        }}
      />
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="rounded-xl bg-black/40 backdrop-blur px-4 py-2.5 border border-white/15">
          <div className="font-[Cinzel] text-xl text-amber-50 font-bold">{record.artifactName}</div>
          {art && <div className="font-[Lora] text-[11px] text-amber-200/70 mt-0.5">{art.era} · {art.region.toUpperCase()}</div>}
        </div>
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur px-3 py-2 rounded-xl border border-white/15">
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              size={20}
              fill={i <= record.stars ? '#fde047' : 'rgba(92,74,47,0.5)'}
              stroke={i <= record.stars ? '#facc15' : 'rgba(202,172,120,0.4)'}
              strokeWidth={1.8}
              style={{
                filter: i <= record.stars ? 'drop-shadow(0 0 6px rgba(253,224,71,0.7))' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 1, 4.2], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 2]} intensity={1.1} castShadow />
          <pointLight position={[-3, 2, 3]} intensity={0.7} color="#fde68a" />
          <pointLight position={[0, -2, 2]} intensity={0.35} color="#93c5fd" />
          <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
            <ArtifactModel artifactId={record.artifactId} />
          </Float>
          <OrbitControls
            enablePan={false}
            minDistance={2.4}
            maxDistance={8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI * 0.85}
            makeDefault
          />
        </Canvas>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-2">
          <InfoTile label="完整度" value={`${record.integrity}%`} />
          <InfoTile label="修复准确率" value={`${record.restorationAccuracy}%`} />
          <InfoTile
            label="挖掘用时"
            value={`${Math.floor(record.digTime / 60)}:${(record.digTime % 60).toString().padStart(2, '0')}`}
          />
          <InfoTile label="使用工具" value={toolText(record.tool)} />
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/45 backdrop-blur border border-white/15 px-3 py-2.5">
      <div className="font-[Lora] text-[10px] text-amber-200/60 tracking-wider">{label}</div>
      <div className="font-[Cinzel] text-amber-50 text-base font-semibold mt-0.5">{value}</div>
    </div>
  );
}

const toolText = (t: string) => (t === 'brush' ? '软毛刷' : t === 'shovel' ? '考古铲' : '吸尘器');

function ArtifactModel({ artifactId }: { artifactId: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const artifact = getArtifactById(artifactId);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.25;
    }
  });
  const palette = artifact?.fragments.map((f) => f.color) ?? ['#d4a574', '#c2956a'];
  const cols = artifact?.fragments[0] ? Math.max(...artifact.fragments.map(f => f.index)) + 1 : 4;
  void cols;
  return (
    <group ref={meshRef}>
      <mesh castShadow receiveShadow position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.3, 1.5, 0.12, 48]} />
        <meshStandardMaterial color="#2a2118" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.18, 1.18, 0.02, 48]} />
        <meshStandardMaterial color="#1a1410" metalness={0.6} roughness={0.25} />
      </mesh>
      <group position={[0, -0.2, 0]} scale={[0.9, 0.9, 0.9]}>
        {artifact ? (
          artifact.fragments.map((f, i) => {
            const angle = (i / artifact.fragments.length) * Math.PI * 2;
            const radius = 0.25;
            const px = Math.cos(angle) * radius * ((i % 2) ? 0.4 : 1);
            const pz = Math.sin(angle) * radius * ((i % 2) ? 0.4 : 1);
            return (
              <Float key={f.id} speed={1.6 + i * 0.1} rotationIntensity={0.5} floatIntensity={0.35}>
                <mesh
                  position={[px, (i - artifact.fragments.length / 2) * 0.15, pz]}
                  rotation={[i * 0.25, i * 0.4, i * 0.15]}
                  castShadow
                  receiveShadow
                >
                  <dodecahedronGeometry args={[0.28 + (i % 3) * 0.05, 0]} />
                  <meshStandardMaterial
                    color={palette[i % palette.length]}
                    roughness={0.45}
                    metalness={0.15}
                    flatShading
                  />
                </mesh>
                <mesh
                  position={[px, (i - artifact.fragments.length / 2) * 0.15 + 0.02, pz]}
                  rotation={[i * 0.25, i * 0.4, i * 0.15]}
                >
                  <dodecahedronGeometry args={[0.29 + (i % 3) * 0.05, 0]} />
                  <meshBasicMaterial color={palette[i % palette.length]} transparent opacity={0.15} />
                </mesh>
              </Float>
            );
          })
        ) : (
          <mesh castShadow>
            <icosahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color="#d4a574" flatShading />
          </mesh>
        )}
      </group>
      <spotLight
        position={[0, 3, 0]}
        angle={0.55}
        penumbra={0.8}
        intensity={2.2}
        color="#fff8e7"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      >
        <Html zIndexRange={[0, 0]} position={[0, 2.4, 0]} center>
          <div
            className="pointer-events-none"
            style={{
              width: '60px',
              height: '8px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse,rgba(255,248,220,0.8),transparent 70%)',
              filter: 'blur(2px)',
            }}
          />
        </Html>
      </spotLight>
    </group>
  );
}
