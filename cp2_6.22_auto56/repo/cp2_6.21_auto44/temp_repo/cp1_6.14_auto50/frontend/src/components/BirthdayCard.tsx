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
const GOLD = '#FFD93D';
const RED = '#FF6B6B';
const CREAM = '#FFF8E1';
const PACIFICO_FONT =
  'https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function createPageTexture(blessing: Blessing | null, pageNum: number, totalPages: number, birthdayPerson?: string): THREE.CanvasTexture {
  const w = 512;
  const h = 672;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  if (!blessing) {
    ctx.fillStyle = RED;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,217,61,0.15)';
    ctx.fillRect(20, 20, w - 40, h - 40);
    ctx.textAlign = 'center';
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 60px Pacifico, cursive';
    ctx.fillText('生日快乐', w / 2, h * 0.35);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '28px sans-serif';
    ctx.fillText('Happy Birthday', w / 2, h * 0.45);
    if (birthdayPerson) {
      ctx.font = 'italic 24px Pacifico, cursive';
      ctx.fillText('To: ' + birthdayPerson, w / 2, h * 0.65);
    }
  } else {
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,107,107,0.04)';
    ctx.fillRect(12, 12, w - 24, h - 24);
    ctx.textAlign = 'center';
    ctx.fillStyle = RED;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('— ' + blessing.nickname + ' —', w / 2, 60);
    ctx.fillStyle = '#333333';
    ctx.font = '22px sans-serif';
    wrapText(ctx, blessing.content, w / 2, 120, w - 80, 28);
    ctx.fillStyle = '#999';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${pageNum} / ${totalPages}`, w - 30, h - 20);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const lines = text.split('\n');
  let cy = y;
  for (const line of lines) {
    let currentLine = '';
    for (const char of line) {
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        ctx.fillText(currentLine, x, cy);
        currentLine = char;
        cy += lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    ctx.fillText(currentLine, x, cy);
    cy += lineHeight;
  }
}

interface FlippingPageProps {
  progress: number;
  frontTexture: THREE.Texture | null;
  backTexture: THREE.Texture | null;
  side: 'right' | 'left';
}

function FlippingPage({ progress, frontTexture, backTexture, side }: FlippingPageProps) {
  const geometryRef = useRef<THREE.PlaneGeometry>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const frontMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const backMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    const geom = geometryRef.current;
    if (!geom) return;
    positionsRef.current = new Float32Array(geom.attributes.position.array as Float32Array);
  }, []);

  useEffect(() => {
    if (frontMatRef.current && frontTexture) {
      frontMatRef.current.map = frontTexture;
      frontMatRef.current.needsUpdate = true;
    }
  }, [frontTexture]);

  useEffect(() => {
    if (backMatRef.current && backTexture) {
      backMatRef.current.map = backTexture;
      backMatRef.current.needsUpdate = true;
    }
  }, [backTexture]);

  useFrame(() => {
    const geom = geometryRef.current;
    if (!geom || !positionsRef.current) return;
    const pos = geom.attributes.position.array as Float32Array;
    const original = positionsRef.current;
    const W = CARD_WIDTH;

    const bendPeak = Math.sin(progress * Math.PI) * 0.4;
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
      z = Math.sin(sideU * Math.PI) * bendPeak;
      const angle = p * Math.PI * dir;
      const pivot = side === 'right' ? -W / 2 : W / 2;
      const relX = x - pivot;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      x = pivot + relX * cosA - z * sinA;
      z = relX * sinA + z * cosA;
      pos[i] = x;
      pos[i + 1] = y;
      pos[i + 2] = z;
    }
    geom.attributes.position.needsUpdate = true;
    geom.computeVertexNormals();
  });

  return (
    <group>
      <mesh>
        <planeGeometry ref={geometryRef} args={[CARD_WIDTH, CARD_HEIGHT, 40, 40]} />
        <meshStandardMaterial
          ref={frontMatRef}
          side={THREE.FrontSide}
          transparent
          opacity={0.98}
          color={CREAM}
        />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT, 40, 40]} />
        <meshStandardMaterial
          ref={backMatRef}
          side={THREE.FrontSide}
          transparent
          opacity={0.98}
          color={RED}
        />
      </mesh>
    </group>
  );
}

function Particles({ cardWidth, cardHeight }: { cardWidth: number; cardHeight: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = useMemo(() => {
    const area = cardWidth * cardHeight;
    return Math.max(60, Math.min(300, Math.floor(area * 20)));
  }, [cardWidth, cardHeight]);

  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * cardWidth * 2.2;
      arr[i * 3 + 1] = (Math.random() - 0.5) * cardHeight * 1.8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3 - 0.5;
    }
    return arr;
  }, [particleCount, cardWidth, cardHeight]);

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
  }, [particleCount]);

  const offsets = useMemo(() => {
    const arr = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) arr[i] = Math.random() * Math.PI * 2;
    return arr;
  }, [particleCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < particleCount; i++) {
      const ox = positions[i * 3];
      const oy = positions[i * 3 + 1];
      const oz = positions[i * 3 + 2];
      pos[i * 3] = ox + Math.sin(t * 0.5 + offsets[i]) * 0.12;
      pos[i * 3 + 1] = oy + Math.cos(t * 0.3 + offsets[i]) * 0.18 + ((t * 0.04 + offsets[i]) % 0.4);
      pos[i * 3 + 2] = oz + Math.sin(t * 0.4 + offsets[i]) * 0.08;
      if (pos[i * 3 + 1] > cardHeight) pos[i * 3 + 1] = -cardHeight;
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
        size={0.07}
        vertexColors
        transparent
        opacity={0.85}
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
    const arr: { sx: number; sy: number; sz: number; color: string; off: number; radius: number }[] = [];
    const palette = ['#FF6B6B', '#FFD93D', '#FFF8E1', '#FF8E8E', '#FFE66D'];
    for (let i = 0; i < 35; i++) {
      arr.push({
        sx: 0.04 + Math.random() * 0.04,
        sy: 0.08 + Math.random() * 0.08,
        sz: 0.01,
        color: palette[Math.floor(Math.random() * palette.length)],
        off: Math.random() * Math.PI * 2,
        radius: 1.2 + Math.random() * 1.5,
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

function GlowText({ children, position, fontSize, color, glowColor }: {
  children: string; position: [number, number, number]; fontSize: number; color: string; glowColor: string;
}) {
  return (
    <group>
      {[0.03, 0.06, 0.09].map((_, i) => (
        <Text key={i} position={position} fontSize={fontSize} color={glowColor}
          anchorX="center" anchorY="middle" font={PACIFICO_FONT} maxWidth={CARD_WIDTH * 0.8}
          opacity={0.25 - i * 0.07}>
          {children}
        </Text>
      ))}
      <Text position={position} fontSize={fontSize} color={color} anchorX="center" anchorY="middle"
        font={PACIFICO_FONT} maxWidth={CARD_WIDTH * 0.8}>
        {children}
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
        <GlowText position={[CARD_WIDTH / 2, 0.7, 0.02]} fontSize={0.48} color={GOLD} glowColor="#FFEE99">
          生日快乐
        </GlowText>
      </Float>
      <Text position={[CARD_WIDTH / 2, -0.1, 0.02]} fontSize={0.22} color="#FFFFFF"
        anchorX="center" anchorY="middle" maxWidth={CARD_WIDTH * 0.7}>
        Happy Birthday
      </Text>
      <Text position={[CARD_WIDTH / 2, -1.0, 0.02]} fontSize={0.22} color="#FFFFFF"
        anchorX="center" anchorY="middle" maxWidth={CARD_WIDTH * 0.7} font={PACIFICO_FONT}>
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
      <Text position={[CARD_WIDTH / 2, 0.9, 0.01]} fontSize={0.28} color={RED}
        anchorX="center" anchorY="middle" maxWidth={CARD_WIDTH * 0.8} font={PACIFICO_FONT}>
        Thank You
      </Text>
      <Text position={[CARD_WIDTH / 2, 0.1, 0.01]} fontSize={0.18} color="#333333"
        anchorX="center" anchorY="middle" maxWidth={CARD_WIDTH * 0.75} lineHeight={1.8}>
        {'感谢每一位\n送来祝福的朋友\n❤️'}
      </Text>
      <Text position={[CARD_WIDTH / 2, -1.0, 0.01]} fontSize={0.16} color={RED}
        anchorX="center" anchorY="middle" maxWidth={CARD_WIDTH * 0.8} font={PACIFICO_FONT}>
        With Love
      </Text>
    </group>
  );
}

function BlessingPageContent({ blessing, visible, pageIndex, total }: {
  blessing: Blessing; visible: boolean; pageIndex: number; total: number;
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

  useFrame((_, delta) => {
    if (!visible) return;
    lastUpdateRef.current += delta;
    if (lastUpdateRef.current > 0.04 && charIndexRef.current < blessing.content.length) {
      lastUpdateRef.current = 0;
      charIndexRef.current = Math.min(charIndexRef.current + 2, blessing.content.length);
      setDisplayedText(blessing.content.slice(0, charIndexRef.current));
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
      img.onerror = () => { textureRef.current = null; setMediaReady(true); };
      img.src = blessing.mediaData;
    } else {
      setMediaReady(true);
    }
  }, [blessing.mediaType, blessing.mediaData]);

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
          <Text position={[CARD_WIDTH / 2, 1.5, 0.01]} fontSize={0.14} color={RED}
            anchorX="center" anchorY="middle" maxWidth={CARD_WIDTH * 0.85}>
            — {blessing.nickname} —
          </Text>
          <Text position={[CARD_WIDTH / 2, 0.5, 0.01]} fontSize={0.15} color="#333333"
            anchorX="center" anchorY="middle" maxWidth={CARD_WIDTH * 0.82} lineHeight={1.6}>
            {displayedText}
          </Text>
          {blessing.mediaType === 'image' && textureRef.current && (
            <mesh position={[CARD_WIDTH / 2, -0.9, 0.01]} scale={mediaReady ? [1, 1, 1] : [0, 0, 0]}>
              <planeGeometry args={[1.7, 1.28]} />
              <meshBasicMaterial map={textureRef.current} transparent />
            </mesh>
          )}
        </>
      )}
      <Text position={[CARD_WIDTH * 0.92, -CARD_HEIGHT * 0.45, 0.01]} fontSize={0.09} color="#999"
        anchorX="right" anchorY="bottom">
        {pageIndex + 1} / {total}
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
}

function CardScene({ birthdayPerson, blessings, autoPlayRef, recordingRef }: CardSceneProps) {
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

  const flippingPageTextures = useMemo(() => {
    const textures: (THREE.CanvasTexture | null)[] = [];
    textures.push(createPageTexture(null, 1, totalPages, birthdayPerson));
    blessingPages.forEach((b, i) => {
      textures.push(createPageTexture(b, i + 2, totalPages));
    });
    textures.push(null);
    return textures;
  }, [blessingPages, totalPages, birthdayPerson]);

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
      const t = Math.min(1, flipTimerRef.current / dur);
      setFlipProgress(t);
      if (t >= 1) {
        const next = flipDirectionRef.current === 'next' ? currentPage + 1 : currentPage - 1;
        setCurrentPage(next);
        setIsFlipping(false);
        setFlipProgress(0);
        flipTimerRef.current = 0;
        holdTimerRef.current = 0;
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
      if (e.point.x > 0) goNext();
      else goPrev();
    },
    [goNext, goPrev]
  );

  const isNextFlip = flipDirectionRef.current === 'next';
  const fromPage = isNextFlip ? currentPage : currentPage - 1;
  const toPage = isNextFlip ? currentPage + 1 : currentPage;

  const renderPageContent = (idx: number): React.ReactNode => {
    if (idx === 0) return <StaticCover birthdayPerson={birthdayPerson} />;
    if (idx === totalPages - 1) return <EndPage />;
    const blessingIdx = idx - 1;
    if (blessingIdx < 0 || blessingIdx >= blessingPages.length) return null;
    return (
      <BlessingPageContent
        blessing={blessingPages[blessingIdx]}
        visible={!isFlipping || (idx !== fromPage && idx !== toPage)}
        pageIndex={blessingIdx}
        total={blessingPages.length}
      />
    );
  };

  const fromTexture = fromPage >= 0 && fromPage < flippingPageTextures.length ? flippingPageTextures[fromPage] : null;
  const backTexture = toPage >= 0 && toPage < flippingPageTextures.length ? flippingPageTextures[toPage] : null;

  const revealPageIdx = isNextFlip ? currentPage + 1 : currentPage - 1;

  return (
    <group onPointerDown={handlePointerDown}>
      <BackPage />

      {!isFlipping && renderPageContent(currentPage)}

      {isFlipping && (
        <>
          {revealPageIdx >= 0 && revealPageIdx < totalPages && (
            <group position={[0, 0, -0.005]}>
              {renderPageContent(revealPageIdx)}
            </group>
          )}
          <FlippingPage
            progress={flipProgress}
            frontTexture={fromTexture}
            backTexture={backTexture}
            side={isNextFlip ? 'right' : 'left'}
          />
        </>
      )}

      <Particles cardWidth={CARD_WIDTH} cardHeight={CARD_HEIGHT} />
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
    <div style={{
      position: 'absolute', top: 12, left: 12,
      background: 'rgba(0,0,0,0.7)', color: 'white',
      padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem',
      fontFamily: 'var(--font-body)', zIndex: 20, pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#FF6B6B',
          animation: 'pulse 1s infinite', display: 'inline-block',
        }} />
        <span>REC</span>
        <span style={{ marginLeft: 8 }}>{Math.floor(elapsed)}s / {maxSec}s</span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
          <div style={{ width: `${Math.max(secProgress, sizeProgress) * 100}%`, height: '100%', background: '#FF6B6B', borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
        {(size / 1024 / 1024).toFixed(2)}MB / 5MB
      </div>
    </div>
  );
}

function createSilentAudioStream(): MediaStream | null {
  try {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    const dest = audioCtx.createMediaStreamDestination();
    gainNode.connect(dest);
    return dest.stream;
  } catch {
    return null;
  }
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
  const intervalsRef = useRef<number[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const cleanup = useCallback(() => {
    intervalsRef.current.forEach(id => clearInterval(id));
    timeoutsRef.current.forEach(id => clearTimeout(id));
    intervalsRef.current = [];
    timeoutsRef.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const handleDownload = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRecording(true);
    recordingRef.current = true;
    autoPlayRef.current = true;
    setElapsed(0);
    setRecSize(0);

    let videoStream: MediaStream | null = null;
    try {
      videoStream = canvas.captureStream(30);
    } catch {
      setRecording(false);
      recordingRef.current = false;
      alert('当前浏览器不支持 canvas 录屏');
      return;
    }

    const audioStream = createSilentAudioStream();
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => videoStream!.addTrack(track));
    }

    let mime = '';
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    for (const c of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(c)) { mime = c; break; }
      } catch {}
    }

    const chunks: BlobPart[] = [];
    let totalSize = 0;
    const maxSize = 5 * 1024 * 1024;
    const maxDuration = 30000;
    const startTime = Date.now();
    let currentBitrate = 1500000;

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(videoStream, {
        mimeType: mime || undefined,
        videoBitsPerSecond: currentBitrate,
      });
    } catch {
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
      }
    };

    const stopRecording = () => {
      if (!recordingRef.current) return;
      recordingRef.current = false;
      try {
        if (recorder && recorder.state !== 'inactive') recorder.stop();
      } catch {}
      cleanup();
    };

    recorder.onstop = () => {
      if (chunks.length === 0) {
        setRecording(false);
        return;
      }
      const blob = new Blob(chunks, { type: mime || 'video/webm' });

      const tryConvertToMp4 = async () => {
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const response = await fetch('/api/video/convert', {
            method: 'POST',
            body: arrayBuffer,
            headers: { 'Content-Type': 'video/webm' },
          });
          if (response.ok) {
            return await response.blob();
          }
        } catch {}
        return null;
      };

      tryConvertToMp4().then(mp4Blob => {
        const finalBlob = mp4Blob || blob;
        const ext = mp4Blob ? 'mp4' : 'webm';
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        const safeName = birthdayPerson.replace(/[^\w\u4e00-\u9fa5-]/g, '_');
        a.href = url;
        a.download = `birthday-card-${safeName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        setRecording(false);
      });
    };

    try {
      recorder.start(250);
    } catch {
      setRecording(false);
      recordingRef.current = false;
      return;
    }

    const timerId = window.setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 200);
    intervalsRef.current.push(timerId);

    const checkId = window.setInterval(() => {
      if (!recordingRef.current) return;
      const elapsedMs = Date.now() - startTime;
      const remainingMs = Math.max(1000, maxDuration - elapsedMs);
      const projectedSize = totalSize * (maxDuration / Math.max(1, elapsedMs));
      if (projectedSize > maxSize * 0.9) {
        const adjustedBitrate = Math.max(250000, Math.floor(currentBitrate * (maxSize * 0.85 / projectedSize)));
        if (adjustedBitrate !== currentBitrate) {
          currentBitrate = adjustedBitrate;
          try {
            recorder.videoBitsPerSecond = adjustedBitrate;
          } catch {}
        }
      }
      if (totalSize >= maxSize * 0.95 || elapsedMs >= maxDuration) {
        stopRecording();
      }
    }, 500);
    intervalsRef.current.push(checkId);

    const timeoutId = window.setTimeout(() => stopRecording(), maxDuration);
    timeoutsRef.current.push(timeoutId);
  }, [birthdayPerson, cleanup]);

  useEffect(() => {
    return () => { cleanup(); if (recordingRef.current) recordingRef.current = false; };
  }, [cleanup]);

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.92)', position: 'fixed', inset: 0 }}>
      <div style={{
        position: 'absolute', top: 20, right: 20,
        display: 'flex', gap: 12, zIndex: 10, flexWrap: 'wrap',
      }}>
        <button className="btn btn-secondary" onClick={handleDownload} disabled={recording}
          style={{ fontSize: '0.85rem' }}>
          {recording ? '🎬 录制中...' : '⬇️ 下载纪念贺卡'}
        </button>
        <button className="btn btn-primary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
          ✕ 关闭
        </button>
      </div>

      {recording && <RecordingOverlay elapsed={elapsed} size={recSize} />}

      <div style={{
        width: '92vw', height: '88vh', maxWidth: 960, maxHeight: 760,
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 20px 80px rgba(255,107,107,0.4)',
      }}>
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', fontSize: '1.2rem' }}>
            加载3D贺卡中...
          </div>
        }>
          <Canvas
            ref={canvasRef}
            gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance', alpha: false }}
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
            <CardScene birthdayPerson={birthdayPerson} blessings={blessings}
              autoPlayRef={autoPlayRef} recordingRef={recordingRef} />
            <OrbitControls enableZoom enablePan={false} minDistance={3.5} maxDistance={10}
              autoRotate={false} enableDamping dampingFactor={0.08} />
          </Canvas>
        </Suspense>
      </div>

      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textAlign: 'center',
        fontFamily: 'var(--font-body)',
      }}>
        点击卡片右侧翻到下一页 · 点击左侧翻到上一页 · 拖拽旋转 · 滚轮缩放
      </div>
    </div>
  );
}
