import { useRef, useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Sparkles, Float, OrbitControls } from '@react-three/drei';
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

function CoverPage({ birthdayPerson }: { birthdayPerson: string }) {
  return (
    <group>
      <mesh position={[0, 0, CARD_DEPTH / 2 + 0.001]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.1}>
        <Text
          position={[0, 0.6, CARD_DEPTH / 2 + 0.01]}
          fontSize={0.45}
          color={GOLD}
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2"
          maxWidth={CARD_WIDTH * 0.8}
        >
          生日快乐
        </Text>
      </Float>
      <Text
        position={[0, -0.4, CARD_DEPTH / 2 + 0.01]}
        fontSize={0.22}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_WIDTH * 0.7}
      >
        {birthdayPerson}
      </Text>
      <Sparkles
        count={40}
        scale={[CARD_WIDTH * 0.8, CARD_HEIGHT * 0.7, 0.3]}
        position={[0, 0, CARD_DEPTH / 2 + 0.15]}
        size={2}
        speed={0.4}
        color={GOLD}
      />
    </group>
  );
}

function BlessingPage({
  blessing,
  visible,
  pageIndex,
  totalBlessingPages,
}: {
  blessing: Blessing;
  visible: boolean;
  pageIndex: number;
  totalBlessingPages: number;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = `${blessing.nickname}\n\n${blessing.content}`;
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
  }, [visible]);

  useFrame((_, delta) => {
    if (!visible) return;
    lastUpdateRef.current += delta;
    if (lastUpdateRef.current > 0.05 && charIndexRef.current < fullText.length) {
      lastUpdateRef.current = 0;
      charIndexRef.current = Math.min(charIndexRef.current + 1, fullText.length);
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
      img.src = blessing.mediaData;
    }
  }, [blessing.mediaType, blessing.mediaData]);

  return (
    <group position={[-CARD_WIDTH / 2, 0, 0]}>
      <mesh position={[CARD_WIDTH / 2, 0, -0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial color={CREAM} />
      </mesh>
      {visible && (
        <>
          <Text
            position={[CARD_WIDTH / 2, 1.2, 0.001]}
            fontSize={0.16}
            color="#333333"
            anchorX="center"
            anchorY="middle"
            maxWidth={CARD_WIDTH * 0.75}
            lineHeight={1.5}
          >
            {displayedText}
          </Text>
          {blessing.mediaType === 'image' && textureRef.current && (
            <mesh
              position={[CARD_WIDTH / 2, -0.8, 0.002]}
              scale={mediaReady ? [1, 1, 1] : [0, 0, 0]}
            >
              <planeGeometry args={[1.6, 1.2]} />
              <meshStandardMaterial map={textureRef.current} transparent />
            </mesh>
          )}
        </>
      )}
      <Text
        position={[CARD_WIDTH * 0.9, -CARD_HEIGHT * 0.45, 0.001]}
        fontSize={0.1}
        color="#999"
        anchorX="right"
        anchorY="bottom"
      >
        {pageIndex + 1} / {totalBlessingPages}
      </Text>
    </group>
  );
}

function CardScene({
  birthdayPerson,
  blessings,
}: {
  birthdayPerson: string;
  blessings: Blessing[];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const flipProgressRef = useRef(0);
  const isFlippingRef = useRef(false);
  const autoFlipTimerRef = useRef(0);
  const pageFlippedRef = useRef<Set<number>>(new Set());

  const blessingPages = useMemo(() => {
    return blessings.slice(0, 20);
  }, [blessings]);

  const totalPages = 1 + blessingPages.length;
  const isFlipping = isFlippingRef.current;

  const goToNextPage = useCallback(() => {
    if (isFlippingRef.current) return;
    if (currentPage >= totalPages - 1) return;
    isFlippingRef.current = true;
    flipProgressRef.current = 0;
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (isFlippingRef.current) return;
    if (currentPage <= 0) return;
    setCurrentPage(prev => prev - 1);
    pageFlippedRef.current.delete(currentPage);
  }, [currentPage]);

  useFrame((_, delta) => {
    if (isFlippingRef.current) {
      flipProgressRef.current += delta * 1.5;
      if (flipProgressRef.current >= 1) {
        flipProgressRef.current = 0;
        isFlippingRef.current = false;
        pageFlippedRef.current.add(currentPage);
        setCurrentPage(prev => prev + 1);
      }
    } else {
      autoFlipTimerRef.current += delta;
      if (autoFlipTimerRef.current > 2 && currentPage < totalPages - 1) {
        autoFlipTimerRef.current = 0;
        goToNextPage();
      }
    }
  });

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const x = e.point.x;
    if (x > 0) {
      goToNextPage();
    } else {
      goToPrevPage();
    }
  }, [goToNextPage, goToPrevPage]);

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
      <CoverPage birthdayPerson={birthdayPerson} />

      {currentPage === 0 && isFlippingRef.current && (
        <FlippingPage progress={flipProgressRef.current} />
      )}

      {blessingPages.map((blessing, i) => {
        const pageVisible = currentPage === i + 1;
        const flipped = pageFlippedRef.current.has(i) || currentPage > i + 1;
        return (
          <group key={blessing.id} position={[0, 0, flipped ? -0.01 * (i + 1) : 0.01 * (i + 1)]}>
            <BlessingPage
              blessing={blessing}
              visible={pageVisible}
              pageIndex={i}
              totalBlessingPages={blessingPages.length}
            />
          </group>
        );
      })}

      {currentPage > 0 && !blessingPages[currentPage - 1] && currentPage <= blessingPages.length && (
        <EndPage visible={currentPage === totalPages - 1} />
      )}

      {blessingPages.length === 0 && currentPage === 1 && (
        <EndPage visible={true} />
      )}

      <Sparkles
        count={60}
        scale={[5, 5, 2]}
        position={[0, 0, 1]}
        size={3}
        speed={0.3}
        color={GOLD}
      />
    </group>
  );
}

function FlippingPage({ progress }: { progress: number }) {
  const springProgress = springInterpolation(progress);
  const rotationY = -springProgress * Math.PI;

  return (
    <group position={[0, 0, 0.02]} rotation={[0, rotationY, 0]}>
      <mesh>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial color={CREAM} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -0.001]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial color={RED} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function springInterpolation(t: number): number {
  const eased = 1 - Math.pow(1 - t, 3);
  const bounce = t < 0.8 ? 0 : Math.sin((t - 0.8) * Math.PI * 5) * 0.03 * (1 - t);
  return Math.min(1, eased + bounce);
}

function EndPage({ visible }: { visible: boolean }) {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = '感谢每一位\n送来祝福的朋友\n\n ❤️';
  const charRef = useRef(0);
  const timerRef = useRef(0);

  useFrame((_, delta) => {
    if (!visible) return;
    timerRef.current += delta;
    if (timerRef.current > 0.06 && charRef.current < fullText.length) {
      timerRef.current = 0;
      charRef.current++;
      setDisplayedText(fullText.slice(0, charRef.current));
    }
  });

  return (
    <group position={[-CARD_WIDTH / 2, 0, 0]}>
      <mesh position={[CARD_WIDTH / 2, 0, -0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial color={CREAM} />
      </mesh>
      {visible && (
        <Text
          position={[CARD_WIDTH / 2, 0.3, 0.001]}
          fontSize={0.22}
          color={RED}
          anchorX="center"
          anchorY="middle"
          maxWidth={CARD_WIDTH * 0.7}
          lineHeight={1.8}
        >
          {displayedText}
        </Text>
      )}
    </group>
  );
}

type ThreeEvent<T> = { stopPropagation: () => void; point: THREE.Vector3 };

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

export default function BirthdayCard({ activityId, birthdayPerson, blessings, onClose }: BirthdayCardProps) {
  const [recording, setRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRecording(true);
    const stream = canvas.captureStream(30);
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `birthday-card-${birthdayPerson}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setRecording(false);
    };

    recorder.start();
    setTimeout(() => {
      recorder.stop();
    }, 30000);
  }, [birthdayPerson]);

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 10,
      }}>
        <button
          className="btn btn-secondary"
          onClick={handleDownload}
          disabled={recording}
          style={{ fontSize: '0.85rem' }}
        >
          {recording ? '🎬 录制中 (最长30s)...' : '⬇️ 下载纪念贺卡'}
        </button>
        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{ fontSize: '0.85rem' }}
        >
          ✕ 关闭
        </button>
      </div>

      <div style={{
        width: '90vw',
        height: '85vh',
        maxWidth: '900px',
        position: 'relative',
      }}>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'white',
            fontSize: '1.2rem',
          }}>
            加载3D贺卡中...
          </div>
        }>
          <Canvas
            ref={canvasRef}
            gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' }}
            dpr={[1, 1.5]}
            style={{ width: '100%', height: '100%' }}
          >
            <CameraSetup />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <pointLight position={[-3, 3, 4]} intensity={0.4} color={GOLD} />
            <CardScene birthdayPerson={birthdayPerson} blessings={blessings} />
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={3}
              maxDistance={10}
              autoRotate={false}
            />
          </Canvas>
        </Suspense>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '0.8rem',
        textAlign: 'center',
      }}>
        点击卡片右侧翻到下一页 · 点击左侧翻到上一页 · 自动翻页每2秒
      </div>
    </div>
  );
}
