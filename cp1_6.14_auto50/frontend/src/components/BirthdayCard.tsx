import { useRef, useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Text, Float, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface Blessing {
  id: string;
  nickname: string;
  content: string;
  mediaType?: 'image' | 'video';
  mediaData?: string;
  likes: number;
  createdAt: string;
}

interface BirthdayCardProps {
  activityId: string;
  birthdayPerson: string;
  blessings: Blessing[];
  onClose: () => void;
}

const CARD_WIDTH = 3.2;
const CARD_HEIGHT = 4.2;
const CARD_DEPTH = 0.04;
const GOLD = '#FFD93D';
const RED = '#FF6B6B';
const CREAM = '#FFF8E1';
const PACIFICO_FONT =
  'https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

interface PageBendProps {
  progress: number;
  frontColor: string;
  backColor: string;
  side: 'right' | 'left';
}

function PageBend({ progress, frontColor, backColor, side }: PageBendProps) {
  const geometryRef = useRef<THREE.PlaneGeometry>(null);
  const ref = useRef<THREE.Mesh>(null);

  const positionsRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    const geom = geometryRef.current;
    if (!geom) return;
    const pos = geom.attributes.position.array as Float32Array;
    positionsRef.current = new Float32Array(pos);
  }, []);

  useFrame(() => {
    const geom = geometryRef.current;
    if (!geom || !positionsRef.current) return;
    const pos = geom.attributes.position.array as Float32Array;
    const original = positionsRef.current;
    const W = CARD_WIDTH;
    const H = CARD_HEIGHT;
    const SEG_W = 40;
    const SEG_H = 40;
    const bendAmount = Math.sin(progress * Math.PI) * 0.35;
    const p = easeInOutCubic(progress);
    const dir = side === 'right' ? 1 : -1;

    for (let i = 0; i < pos.length; i += 3) {
      const ox = original[i];
      const oy = original[i + 1];
      let x = ox;
      let y = oy;
      let z = 0;
      const u = (ox + W / 2) / W;
      const sideU = side === 'right' ? u : 1 - u;
      z = Math.sin(sideU * Math.PI) * bendAmount;
      const angle = p * Math.PI * dir;
      const pivot = side === 'right' ? -W / 2 : W / 2;
      const relX = x - pivot;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      x = pivot + relX * cos - z * sin;
      z = relX * sin + z * cos;
      pos[i] = x;
      pos[i + 1] = y;
      pos[i + 2] = z;
    }
    geom.attributes.position.needsUpdate = true;
    geom.computeVertexNormals();
  });

  return (
    <group>
      <mesh ref={ref}>
        <planeGeometry
          ref={geometryRef}
          args={[CARD_WIDTH, CARD_HEIGHT, 40, 40]}
        />
        <meshStandardMaterial
          color={frontColor}
          side={THREE.DoubleSide}
          transparent
          opacity={0.98}
        />
      </mesh>
    </group>
  );
}

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 120;

  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3 - 0.5;
    }
    return arr;
  }, []);

  const colors = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    const c1 = new THREE.Color(GOLD);
    const c2 = new THREE.Color(RED);
    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const c = c1.clone().lerp(c2, t);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, []);

  const offsets = useMemo(() => {
    const arr = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) arr[i] = Math.random() * Math.PI * 2;
    return arr;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < particleCount; i++) {
      const ox = positions[i * 3];
      const oy = positions[i * 3 + 1];
      const oz = positions[i * 3 + 2];
      pos[i * 3] = ox + Math.sin(t * 0.5 + offsets[i]) * 0.15;
      pos[i * 3 + 1] = oy + Math.cos(t * 0.3 + offsets[i]) * 0.2 + ((t + offsets[i]) * 0.05) % 0.5;
      pos[i * 3 + 2] = oz + Math.sin(t * 0.4 + offsets[i]) * 0.1;
      if (pos[i * 3 + 1] > CARD_HEIGHT) {
        pos[i * 3 + 1] = -CARD_HEIGHT;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Confetti() {
  const groupRef = useRef<THREE.Group>(null);
  const pieces = useMemo(() => {
    const arr: { sx: number; sy: number; sz: number; color: string; off: number; radius: number; axis: THREE.Vector3 }[] = [];
    const palette = ['#FF6B6B', '#FFD93D', '#FFF8E1', '#FF8E8E', '#FFE66D'];
    for (let i = 0; i < 40; i++) {
      arr.push({
        sx: 0.04 + Math.random() * 0.04,
        sy: 0.08 + Math.random() * 0.08,
        sz: 0.01,
        color: palette[Math.floor(Math.random() * palette.length)],
        off: Math.random() * Math.PI * 2,
        radius: 1.2 + Math.random() * 1.5,
        axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const p = pieces[i];
      const angle = t * 0.6 + p.off;
      child.position.set(
        Math.cos(angle) * p.radius,
        Math.sin(angle * 0.8 + p.off) * 1.5,
        Math.sin(angle) * p.radius
      );
      child.rotation.x = t * 1.5 + p.off;
      child.rotation.y = t * 2 + p.off * 0.5;
    });
  });

  return (
    <group ref={groupRef}>
      {pieces.map((p, i) => (
        <mesh key={i}>
          <boxGeometry args={[p.sx, p.sy, p.sz]} />
          <meshStandardMaterial color={p.color} />
        </mesh>
      ))}
    </group>
  );
}

function GlowText({
  children,
  position,
  fontSize,
  color,
  glowColor,
}: {
  children: string;
  position: [number, number, number];
  fontSize: number;
  color: string;
  glowColor: string;
}) {
  return (
    <group>
      {[0.03, 0.06, 0.09].map((offset, i) => (
        <Text
          key={i}
          position={position}
          fontSize={fontSize}
          color={glowColor}
          anchorX="center"
          anchorY="middle"
          font={PACIFICO_FONT}
          maxWidth={CARD_WIDTH * 0.8}
          opacity={0.25 - i * 0.07}
        >
          {children}
        </Text>
      ))}
      <Text
        position={position}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={PACIFICO_FONT}
        maxWidth={CARD_WIDTH * 0.8}
      >
        {children}
      </Text>
    </group>
  );
}

function CoverPage() {
  return (
    <group position={[-CARD_WIDTH / 2, 0, 0.01]}>
      <mesh position={[CARD_WIDTH / 2, 0, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial color={RED} metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[CARD_WIDTH / 2, 0, -0.001]}>
        <planeGeometry args={[CARD_WIDTH - 0.12, CARD_HEIGHT - 0.12]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.15} />
      </mesh>
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.15}>
        <GlowText
          position={[CARD_WIDTH / 2, 0.6, 0.02]}
          fontSize={0.48}
          color={GOLD}
          glowColor="#FFEE99"
        >
          生日快乐
        </GlowText>
      </Float>
      <Text
        position={[CARD_WIDTH / 2, -0.35, 0.02]}
        fontSize={0.24}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_WIDTH * 0.7}
      >
        Happy Birthday
      </Text>
      <Text
        position={[CARD_WIDTH / 2, -0.95, 0.02]}
        fontSize={0.2}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_WIDTH * 0.7}
        font={PACIFICO_FONT}
      >
        To: {null}
      </Text>
    </group>
  );
}

function StaticCover({ birthdayPerson }: { birthdayPerson: string }) {
  return (
    <group position={[-CARD_WIDTH / 2, 0, 0.01]}>
      <mesh position={[CARD_WIDTH / 2, 0, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial color={RED} metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[CARD_WIDTH / 2, 0, -0.001]}>
        <planeGeometry args={[CARD_WIDTH - 0.12, CARD_HEIGHT - 0.12]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.15} />
      </mesh>
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.15}>
        <GlowText
          position={[CARD_WIDTH / 2, 0.7, 0.02]}
          fontSize={0.48}
          color={GOLD}
          glowColor="#FFEE99"
        >
          生日快乐
        </GlowText>
      </Float>
      <Text
        position={[CARD_WIDTH / 2, -0.1, 0.02]}
        fontSize={0.22}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_WIDTH * 0.7}
      >
        Happy Birthday
      </Text>
      <Text
        position={[CARD_WIDTH / 2, -1.0, 0.02]}
        fontSize={0.22}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_WIDTH * 0.7}
        font={PACIFICO_FONT}
      >
        To: {birthdayPerson}
      </Text>
    </group>
  );
}

function EndPage() {
  return (
    <group position={[-CARD_WIDTH / 2, 0, 0]}>
      <mesh position={[CARD_WIDTH / 2, 0, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial color={CREAM} />
      </mesh>
      <Text
        position={[CARD_WIDTH / 2, 0.9, 0.01]}
        fontSize={0.28}
        color={RED}
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_WIDTH * 0.8}
        font={PACIFICO_FONT}
      >
        Thank You
      </Text>
      <Text
        position={[CARD_WIDTH / 2, 0.1, 0.01]}
        fontSize={0.18}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_WIDTH * 0.75}
        lineHeight={1.8}
      >
        感谢每一位
送来祝福的朋友
❤️
      </Text>
      <Text
        position={[CARD_WIDTH / 2, -1.0, 0.01]}
        fontSize={0.16}
        color={RED}
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_WIDTH * 0.8}
        font={PACIFICO_FONT}
      >
        With Love
      </Text>
    </group>
  );
}

function BlessingPageContent({
  blessing,
  visible,
  pageIndex,
  total,
}: {
  blessing: Blessing;
  visible: boolean;
  pageIndex: number;
  total: number;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const charIndexRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const textureRef = useRef<THREE.Texture | null>(null);
  const [mediaReady, setMediaReady] = useState(false);

  useEffect(() => {
    if (visible) {
      charIndexRef.current = 0;
      setDisplayedText('');
      lastUpdateRef.current = 0;
    }
  }, [visible, blessing.id]);

  const fullText = `${blessing.nickname}\n\n${blessing.content}`;

  useFrame((_, delta) => {
    if (!visible) return;
    lastUpdateRef.current += delta;
    if (lastUpdateRef.current > 0.04 && charIndexRef.current < fullText.length) {
      lastUpdateRef.current = 0;
      charIndexRef.current = Math.min(charIndexRef.current + 2, fullText.length);
      setDisplayedText(fullText.slice(0, charIndexRef.current));
    }
  });

  useEffect(() => {
    if (blessing.mediaType === 'image' && blessing.mediaData) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.needsUpdate = true;
        textureRef.current = tex;
        setMediaReady(true);
      };
      img.onerror = () => {
        textureRef.current = null;
        setMediaReady(true);
      };
      img.src = blessing.mediaData;
    } else {
      setMediaReady(true);
    }
  }, [blessing.mediaType, blessing.mediaData]);

  const page = pageIndex + 1;
  const pageNum = `${page} / ${total}`;

  return (
    <group position={[-CARD_WIDTH / 2, 0, 0]}>
      <mesh position={[CARD_WIDTH / 2, 0, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial color={CREAM} />
      </mesh>
      <mesh position={[CARD_WIDTH / 2, 0, -0.001]}>
        <planeGeometry args={[CARD_WIDTH - 0.1, CARD_HEIGHT - 0.1]} />
        <meshBasicMaterial color={RED} transparent opacity={0.04} />
      </mesh>
      {visible && mediaReady && (
        <>
          <Text
            position={[CARD_WIDTH / 2, 1.5, 0.01]}
            fontSize={0.14}
            color={RED}
            anchorX="center"
            anchorY="middle"
            maxWidth={CARD_WIDTH * 0.85}
          >
            — {blessing.nickname} —
          </Text>
          <Text
            position={[CARD_WIDTH / 2, 0.5, 0.01]}
            fontSize={0.15}
            color="#333333"
            anchorX="center"
            anchorY="middle"
            maxWidth={CARD_WIDTH * 0.82}
            lineHeight={1.6}
          >
            {displayedText.split('\n').slice(2).join('\n')}
          </Text>
          {blessing.mediaType === 'image' && textureRef.current && (
            <mesh
              position={[CARD_WIDTH / 2, -0.9, 0.01]}
              scale={mediaReady ? [1, 1, 1] : [0, 0, 0]}
            >
              <planeGeometry args={[1.7, 1.28]} />
              <meshBasicMaterial map={textureRef.current} transparent />
            </mesh>
          )}
        </>
      )}
      <Text
        position={[CARD_WIDTH * 0.92, -CARD_HEIGHT * 0.45, 0.01]}
        fontSize={0.09}
        color="#999"
        anchorX="right"
        anchorY="bottom"
      >
        {pageNum}
      </Text>
    </group>
  );
}

function BackPage() {
  return (
    <group position={[-CARD_WIDTH / 2, 0, 0]}>
      <mesh position={[CARD_WIDTH / 2, 0, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial color={RED} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[CARD_WIDTH / 2, 0, -0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH - 0.12, CARD_HEIGHT - 0.12]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

interface CardSceneProps {
  birthdayPerson: string;
  blessings: Blessing[];
  autoPlayRef: React.MutableRefObject<boolean>;
  recordingRef: React.MutableRefObject<boolean>;
  onFlipComplete?: () => void;
}

function CardScene({ birthdayPerson, blessings, autoPlayRef, recordingRef, onFlipComplete }: CardSceneProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [flipProgress, setFlipProgress] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const flipDirectionRef = useRef<'next' | 'prev'>('next');
  const flipTimerRef = useRef(0);
  const holdTimerRef = useRef(0);
  const startedRef = useRef(false);

  const blessingPages = useMemo(() => blessings.slice(0, 15), [blessings]);
  const totalPages = 1 + blessingPages.length + 1;
  const pageDurations = useMemo(() => {
    const arr: number[] = [];
    arr.push(2.5);
    blessingPages.forEach((b) => {
      const charCount = (b.nickname + b.content).length;
      arr.push(Math.min(4.5, Math.max(2.5, charCount * 0.035 + 2)));
    });
    arr.push(3);
    return arr;
  }, [blessingPages]);

  const goNext = useCallback(() => {
    if (isFlipping) return;
    if (currentPage >= totalPages - 1) return;
    flipDirectionRef.current = 'next';
    setIsFlipping(true);
  }, [isFlipping, currentPage, totalPages]);

  const goPrev = useCallback(() => {
    if (isFlipping) return;
    if (currentPage <= 0) return;
    flipDirectionRef.current = 'prev';
    setIsFlipping(true);
  }, [isFlipping, currentPage]);

  useFrame((_, delta) => {
    if (!startedRef.current) {
      startedRef.current = true;
      holdTimerRef.current = 0;
    }
    if (isFlipping) {
      flipTimerRef.current += delta;
      const dur = 0.9;
      let t = flipTimerRef.current / dur;
      if (t >= 1) {
        t = 1;
        setFlipProgress(1);
        const next =
          flipDirectionRef.current === 'next' ? currentPage + 1 : currentPage - 1;
        setCurrentPage(next);
        setIsFlipping(false);
        setFlipProgress(0);
        flipTimerRef.current = 0;
        holdTimerRef.current = 0;
        if (flipDirectionRef.current === 'next' && next >= totalPages - 1) {
          onFlipComplete?.();
        }
      } else {
        setFlipProgress(t);
      }
    } else if (autoPlayRef.current) {
      holdTimerRef.current += delta;
      const dur = pageDurations[currentPage] ?? 3;
      if (holdTimerRef.current > dur && currentPage < totalPages - 1) {
        goNext();
      }
    }
  });

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const x = e.point.x;
      if (x > 0) goNext();
      else goPrev();
    },
    [goNext, goPrev]
  );

  const isNextFlip = flipDirectionRef.current === 'next';
  const flippingPageIndex = isNextFlip ? currentPage : currentPage - 1;

  const renderPageContent = (idx: number): React.ReactNode => {
    if (idx === 0) return <StaticCover birthdayPerson={birthdayPerson} />;
    if (idx === totalPages - 1) return <EndPage />;
    const blessingIdx = idx - 1;
    return (
      <BlessingPageContent
        blessing={blessingPages[blessingIdx]}
        visible={!isFlipping || idx !== flippingPageIndex}
        pageIndex={blessingIdx}
        total={blessingPages.length}
      />
    );
  };

  return (
    <group onPointerDown={handlePointerDown}>
      <BackPage />
      {currentPage > 0 && renderPageContent(currentPage)}
      {currentPage === 0 && <StaticCover birthdayPerson={birthdayPerson} />}
      {isFlipping && (
        <PageBend
          progress={flipProgress}
          frontColor={isNextFlip ? CREAM : RED}
          backColor={isNextFlip ? RED : CREAM}
          side={isNextFlip ? 'right' : 'left'}
        />
      )}
      {!isFlipping && currentPage < totalPages - 1 && (
        <mesh position={[CARD_WIDTH / 2 + 0.02, 0, 0]}>
          <planeGeometry args={[0.04, CARD_HEIGHT]} />
          <meshStandardMaterial color="#333333" transparent opacity={0.08} />
        </mesh>
      )}
      <Particles />
      <Confetti />
    </group>
  );
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 5.8);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

interface RecordingOverlayProps {
  elapsed: number;
  size: number;
}

function RecordingOverlay({ elapsed, size }: RecordingOverlayProps) {
  const maxSec = 30;
  const maxBytes = 5 * 1024 * 1024;
  const secProgress = Math.min(1, elapsed / maxSec);
  const sizeProgress = Math.min(1, size / maxBytes);
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: '0.8rem',
        fontFamily: 'var(--font-body)',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#FF6B6B',
            animation: 'pulse 1s infinite',
            display: 'inline-block',
          }}
        />
        <span>REC</span>
        <span style={{ marginLeft: 8 }}>{Math.floor(elapsed)}s / {maxSec}s</span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
          <div style={{ width: `${secProgress * 100}%`, height: '100%', background: '#FF6B6B', borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
        {(size / 1024 / 1024).toFixed(2)}MB / 5MB ({Math.floor(sizeProgress * 100)}%)
      </div>
    </div>
  );
}

export default function BirthdayCard({
  activityId,
  birthdayPerson,
  blessings,
  onClose,
}: BirthdayCardProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recSize, setRecSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoPlayRef = useRef(true);
  const recordingRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const sizeCheckIntervalRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const stopRecordingFnRef = useRef<(() => void) | null>(null);

  const handleDownload = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRecording(true);
    recordingRef.current = true;
    autoPlayRef.current = true;
    setElapsed(0);
    setRecSize(0);

    let stream: MediaStream | null = null;
    try {
      stream = canvas.captureStream(30);
    } catch (e) {
      setRecording(false);
      recordingRef.current = false;
      alert('当前浏览器不支持 canvas 录屏');
      return;
    }

    let mime = '';
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    for (const c of candidates) {
      try {
        if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(c)) {
          mime = c;
          break;
        }
      } catch {}
    }

    const chunks: BlobPart[] = [];
    let totalSize = 0;
    const maxSize = 5 * 1024 * 1024;
    const maxDuration = 30000;

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: mime || undefined,
        videoBitsPerSecond: 1500000,
      });
    } catch (e) {
      setRecording(false);
      recordingRef.current = false;
      return;
    }
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
        totalSize += e.data.size;
        setRecSize(totalSize);
        if (totalSize >= maxSize) {
          stopRecording();
        }
      }
    };

    const stopRecording = () => {
      if (!recordingRef.current) return;
      recordingRef.current = false;
      stopRecordingFnRef.current = null;
      try {
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
      } catch {}
      if (sizeCheckIntervalRef.current != null) {
        clearInterval(sizeCheckIntervalRef.current);
        sizeCheckIntervalRef.current = null;
      }
      if (timerIntervalRef.current != null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
    stopRecordingFnRef.current = stopRecording;

    recorder.onstop = () => {
      if (chunks.length === 0) {
        setRecording(false);
        return;
      }
      const blob = new Blob(chunks, { type: mime || 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = birthdayPerson.replace(/[^\w\u4e00-\u9fa5-]/g, '_');
      a.href = url;
      a.download = `birthday-card-${safeName}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      setRecording(false);
    };

    try {
      recorder.start(250);
    } catch {
      setRecording(false);
      recordingRef.current = false;
      return;
    }

    const start = Date.now();
    timerIntervalRef.current = window.setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 200);

    sizeCheckIntervalRef.current = window.setInterval(() => {
      if (totalSize >= maxSize) stopRecording();
      if (Date.now() - start >= maxDuration) stopRecording();
    }, 200);

    setTimeout(() => stopRecording(), maxDuration);
  }, [birthdayPerson]);

  useEffect(() => {
    return () => {
      if (stopRecordingFnRef.current) stopRecordingFnRef.current();
    };
  }, []);

  return (
    <div
      className="modal-overlay"
      style={{ background: 'rgba(0,0,0,0.92)', position: 'fixed', inset: 0 }}
    >
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          gap: 12,
          zIndex: 10,
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={handleDownload}
          disabled={recording}
          style={{ fontSize: '0.85rem' }}
        >
          {recording ? '🎬 录制中...' : '⬇️ 下载纪念贺卡'}
        </button>
        <button className="btn btn-primary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
          ✕ 关闭
        </button>
      </div>

      {recording && <RecordingOverlay elapsed={elapsed} size={recSize} />}

      <div
        style={{
          width: '92vw',
          height: '88vh',
          maxWidth: 960,
          maxHeight: 760,
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 20px 80px rgba(255,107,107,0.4)',
        }}
      >
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'white',
                fontSize: '1.2rem',
              }}
            >
              加载3D贺卡中...
            </div>
          }
        >
          <Canvas
            ref={canvasRef}
            gl={{
              preserveDrawingBuffer: true,
              antialias: true,
              powerPreference: 'high-performance',
              alpha: false,
            }}
            dpr={[1, 1.5]}
            style={{ width: '100%', height: '100%', background: '#1a1a2e' }}
            frameloop="always"
          >
            <color attach="background" args={['#1a1a2e']} />
            <fog attach="fog" args={['#1a1a2e', 6, 14]} />
            <CameraSetup />
            <ambientLight intensity={0.55} />
            <directionalLight position={[5, 5, 5]} intensity={0.9} color="#ffffff" />
            <pointLight position={[-3, 3, 4]} intensity={0.6} color={GOLD} />
            <pointLight position={[3, -2, 3]} intensity={0.4} color={RED} />
            <Stars radius={30} depth={20} count={800} factor={3} fade speed={0.5} />
            <CardScene
              birthdayPerson={birthdayPerson}
              blessings={blessings}
              autoPlayRef={autoPlayRef}
              recordingRef={recordingRef}
            />
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={3.5}
              maxDistance={10}
              autoRotate={false}
              enableDamping
              dampingFactor={0.08}
            />
          </Canvas>
        </Suspense>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.8rem',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
        }}
      >
        点击卡片右侧翻到下一页 · 点击左侧翻到上一页 · 拖拽可旋转视角 · 滚轮缩放
      </div>
    </div>
  );
}
