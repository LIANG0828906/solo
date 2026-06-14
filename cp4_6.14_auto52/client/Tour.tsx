import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import type { Artwork, ExhibitionData } from './App';

interface TourProps {
  exhibition: ExhibitionData | null;
}

const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 15;
const WALL_HEIGHT = 4;
const PLAYER_SPEED = 0.1;
const DETECTION_RANGE = 3;

function AudioWaveform({ isPlaying, themeColor }: { isPlaying: boolean; themeColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef<number[]>([]);
  const targetBarsRef = useRef<number[]>([]);
  const barCount = 48;

  useEffect(() => {
    for (let i = 0; i < barCount; i++) {
      barsRef.current[i] = 0.2;
      targetBarsRef.current[i] = 0.2;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
      const height = canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, width, height);

      const barWidth = 4 * (window.devicePixelRatio || 1);
      const gap = 2 * (window.devicePixelRatio || 1);
      const totalBars = Math.floor(width / (barWidth + gap));
      const startX = (width - totalBars * (barWidth + gap) + gap) / 2;

      for (let i = 0; i < totalBars; i++) {
        if (isPlaying) {
          const idx = i % barCount;
          const noise = Math.sin(Date.now() * 0.005 + i * 0.5) * 0.3 + Math.sin(Date.now() * 0.008 + i * 0.3) * 0.2;
          targetBarsRef.current[idx] = 0.3 + Math.abs(noise);
        } else {
          targetBarsRef.current[i % barCount] = 0.2;
        }

        barsRef.current[i % barCount] += (targetBarsRef.current[i % barCount] - barsRef.current[i % barCount]) * 0.15;

        const barH = barsRef.current[i % barCount] * height;
        const x = startX + i * (barWidth + gap);
        const y = (height - barH) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
        gradient.addColorStop(0, themeColor);
        gradient.addColorStop(1, themeColor + '80');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        const radius = window.devicePixelRatio || 1;
        ctx.roundRect(x, y, barWidth, barH, radius);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, themeColor]);

  return (
    <canvas
      ref={canvasRef}
      className="audio-waveform"
      style={{
        width: '100%',
        height: '40px',
        borderRadius: '8px',
        display: 'block'
      }}
    />
  );
}

function FirstPersonControls({
  position,
  setPosition,
  rotation,
  setRotation
}: {
  position: THREE.Vector3;
  setPosition: (pos: THREE.Vector3) => void;
  rotation: { x: number; y: number };
  setRotation: (rot: { x: number; y: number }) => void;
}) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const rotationRef = useRef(rotation);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;

      setRotation(prev => ({
        x: Math.max(-Math.PI / 6, Math.min(Math.PI / 3, prev.x - dy * 0.002)),
        y: prev.y - dx * 0.002
      }));

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      gl.domElement.removeEventListener('mousedown', handleMouseUp);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl.domElement, setRotation]);

  useFrame(() => {
    const dir = new THREE.Vector3();

    if (keys.current['w']) dir.z -= 1;
    if (keys.current['s']) dir.z += 1;
    if (keys.current['a']) dir.x -= 1;
    if (keys.current['d']) dir.x += 1;

    if (dir.length() > 0) {
      dir.normalize();
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationRef.current.y);

      const newPos = positionRef.current.clone();
      newPos.add(dir.multiplyScalar(PLAYER_SPEED));

      const margin = 1;
      newPos.x = Math.max(margin, Math.min(ROOM_WIDTH - margin, newPos.x));
      newPos.z = Math.max(margin, Math.min(ROOM_HEIGHT - margin, newPos.z));

      setPosition(newPos);
    }

    camera.position.set(positionRef.current.x, 1.6, positionRef.current.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = rotationRef.current.y;
    camera.rotation.x = rotationRef.current.x;
  });

  return null;
}

function ArtworkMesh({
  artwork,
  isHighlighted,
  themeColor
}: {
  artwork: Artwork;
  isHighlighted: boolean;
  themeColor: string;
}) {
  const glowRef = useRef<THREE.Mesh>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [intensity, setIntensity] = useState(0);
  const textureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    const target = isHighlighted ? 1.5 : 0;
    const startIntensity = intensity;
    const startTime = performance.now();
    const duration = 500;
    let rafId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setIntensity(startIntensity + (target - startIntensity) * eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isHighlighted]);

  const position = useMemo(() => {
    if (!artwork.position) return new THREE.Vector3(0, 1.5, 0);

    const { x, y, wall } = artwork.position;
    switch (wall) {
      case 'north':
        return new THREE.Vector3(x, 1.5, 0.05);
      case 'south':
        return new THREE.Vector3(x, 1.5, ROOM_HEIGHT - 0.05);
      case 'west':
        return new THREE.Vector3(0.05, 1.5, y);
      case 'east':
        return new THREE.Vector3(ROOM_WIDTH - 0.05, 1.5, y);
      default:
        return new THREE.Vector3(x, 1.5, y);
    }
  }, [artwork.position]);

  const rotation = useMemo(() => {
    if (!artwork.position) return [0, 0, 0];

    const { wall } = artwork.position;
    switch (wall) {
      case 'north':
        return [0, 0, 0];
      case 'south':
        return [0, Math.PI, 0];
      case 'west':
        return [0, Math.PI / 2, 0];
      case 'east':
        return [0, -Math.PI / 2, 0];
      default:
        return [0, 0, 0];
    }
  }, [artwork.position]);

  return (
    <group position={position} rotation={rotation as any}>
      <mesh ref={glowRef} position={[0, 0, -0.02]}>
        <planeGeometry args={[2.2, 1.7]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={intensity * 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={meshRef} position={[0, 0, 0.01]}>
        <planeGeometry args={[2, 1.5]} />
        <meshBasicMaterial
          color={isHighlighted ? '#ffffff' : '#dddddd'}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Text
        position={[0, -1.2, 0.02]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {artwork.name}
      </Text>
    </group>
  );
}

function Room({
  backgroundColor,
  backgroundMode,
  backgroundGradientEnd
}: {
  backgroundColor: string;
  backgroundMode: 'solid' | 'gradient';
  backgroundGradientEnd?: string;
}) {
  const endColor = backgroundGradientEnd || backgroundColor;

  const makeGradient = (topColor: string, bottomColor: string, width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx!.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx!.fillStyle = gradient;
    ctx!.fillRect(0, 0, 2, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(width / 2, 1);
    return texture;
  };

  const northTexture = useMemo(
    () => makeGradient(endColor, backgroundColor, ROOM_WIDTH, WALL_HEIGHT),
    [backgroundColor, endColor]
  );
  const eastTexture = useMemo(
    () => makeGradient(endColor, backgroundColor, ROOM_HEIGHT, WALL_HEIGHT),
    [backgroundColor, endColor]
  );
  const southTexture = useMemo(
    () => makeGradient(endColor, backgroundColor, ROOM_WIDTH, WALL_HEIGHT),
    [backgroundColor, endColor]
  );
  const westTexture = useMemo(
    () => makeGradient(endColor, backgroundColor, ROOM_HEIGHT, WALL_HEIGHT),
    [backgroundColor, endColor]
  );

  const useTextures = backgroundMode === 'gradient';

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROOM_WIDTH / 2, 0, ROOM_HEIGHT / 2]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color={backgroundColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0]}>
        <planeGeometry args={[ROOM_WIDTH, WALL_HEIGHT]} />
        <meshStandardMaterial
          map={useTextures ? northTexture : undefined}
          color={useTextures ? '#ffffff' : backgroundColor}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[ROOM_WIDTH / 2, WALL_HEIGHT / 2, ROOM_HEIGHT]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[ROOM_WIDTH, WALL_HEIGHT]} />
        <meshStandardMaterial
          map={useTextures ? southTexture : undefined}
          color={useTextures ? '#ffffff' : backgroundColor}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, WALL_HEIGHT / 2, ROOM_HEIGHT / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_HEIGHT, WALL_HEIGHT]} />
        <meshStandardMaterial
          map={useTextures ? westTexture : undefined}
          color={useTextures ? '#ffffff' : backgroundColor}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[ROOM_WIDTH, WALL_HEIGHT / 2, ROOM_HEIGHT / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_HEIGHT, WALL_HEIGHT]} />
        <meshStandardMaterial
          map={useTextures ? eastTexture : undefined}
          color={useTextures ? '#ffffff' : backgroundColor}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[ROOM_WIDTH / 2, WALL_HEIGHT, ROOM_HEIGHT / 2]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color={endColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function getArtworkWorldPosition(artwork: Artwork): THREE.Vector3 {
  if (!artwork.position) return new THREE.Vector3(0, 1.5, 0);
  const { x, y, wall } = artwork.position;
  switch (wall) {
    case 'north':
      return new THREE.Vector3(x, 1.5, 0.1);
    case 'south':
      return new THREE.Vector3(x, 1.5, ROOM_HEIGHT - 0.1);
    case 'west':
      return new THREE.Vector3(0.1, 1.5, y);
    case 'east':
      return new THREE.Vector3(ROOM_WIDTH - 0.1, 1.5, y);
    default:
      return new THREE.Vector3(x, 1.5, y);
  }
}

function Tour({ exhibition }: TourProps) {
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(ROOM_WIDTH / 2, 1.6, ROOM_HEIGHT / 2));
  const [playerRot, setPlayerRot] = useState({ x: 0, y: 0 });
  const [nearbyArtwork, setNearbyArtwork] = useState<Artwork | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [visitStartTime] = useState(Date.now());
  const [artworkStayTimes, setArtworkStayTimes] = useState<Record<string, number>>({});
  const [currentArtworkId, setCurrentArtworkId] = useState<string | null>(null);
  const [currentArtworkStartTime, setCurrentArtworkStartTime] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const playerPosRef = useRef(playerPos);
  const nearbyArtworkRef = useRef(nearbyArtwork);
  const artworksRef = useRef<Artwork[]>([]);

  const artworks = exhibition?.artworks || [];
  const backgroundColor = exhibition?.backgroundColor || '#1e293b';
  const backgroundMode = exhibition?.backgroundMode || 'solid';
  const backgroundGradientEnd = exhibition?.backgroundGradientEnd || '#334155';
  const themeColor = '#6366f1';

  useEffect(() => {
    artworksRef.current = artworks;
  }, [artworks]);

  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    nearbyArtworkRef.current = nearbyArtwork;
  }, [nearbyArtwork]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const initVisitor = async () => {
      try {
        const res = await axios.post('/api/visitors', {});
        setVisitorId(res.data.id);
      } catch (err) {
        console.error('创建访客记录失败:', err);
      }
    };
    initVisitor();
  }, []);

  useEffect(() => {
    if (nearbyArtwork?.id === currentArtworkId) return;

    if (currentArtworkId && currentArtworkStartTime) {
      const stayed = (Date.now() - currentArtworkStartTime) / 1000;
      setArtworkStayTimes(prev => ({
        ...prev,
        [currentArtworkId]: (prev[currentArtworkId] || 0) + stayed
      }));
    }

    if (nearbyArtwork) {
      setCurrentArtworkId(nearbyArtwork.id);
      setCurrentArtworkStartTime(Date.now());
    } else {
      setCurrentArtworkId(null);
      setCurrentArtworkStartTime(null);
    }
  }, [nearbyArtwork?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (visitorId) {
        const duration = Math.floor((Date.now() - visitStartTime) / 1000);
        const viewedCount = Object.keys(artworkStayTimes).filter(
          key => (artworkStayTimes[key] || 0) >= 2
        ).length;
        const totalArtworks = artworks.length || 1;
        const completionRate = Math.floor((viewedCount / totalArtworks) * 100);

        const finalStayTimes = { ...artworkStayTimes };
        if (currentArtworkId && currentArtworkStartTime) {
          const currentStayed = (Date.now() - currentArtworkStartTime) / 1000;
          finalStayTimes[currentArtworkId] =
            (finalStayTimes[currentArtworkId] || 0) + currentStayed;
        }

        axios
          .put(`/api/visitors/${visitorId}`, {
            duration,
            artworkStayTimes: finalStayTimes,
            completionRate
          })
          .catch(() => {});
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    visitorId,
    artworkStayTimes,
    visitStartTime,
    artworks.length,
    currentArtworkId,
    currentArtworkStartTime
  ]);

  useFrame(() => {
    let closest: Artwork | null = null;
    let closestDist = Infinity;

    const currentPos = playerPosRef.current;
    const list = artworksRef.current;

    for (let i = 0; i < list.length; i++) {
      const artwork = list[i];
      if (!artwork.position) continue;
      const artworkPos = getArtworkWorldPosition(artwork);
      const dist = currentPos.distanceTo(artworkPos);
      if (dist < DETECTION_RANGE && dist < closestDist) {
        closestDist = dist;
        closest = artwork;
      }
    }

    if (closest?.id !== nearbyArtworkRef.current?.id) {
      setNearbyArtwork(closest);
      setIsPlaying(false);
    }
  });

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
  };

  if (isMobile) {
    return (
      <div className="mobile-view" style={{ padding: '80px 20px 20px', overflowY: 'auto', height: '100%' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '20px', color: 'var(--text-primary)' }}>
          {exhibition?.name || '虚拟展览'}
        </h2>
        <div className="mobile-artwork-grid">
          {artworks.map((artwork) => (
            <div
              key={artwork.id}
              className="mobile-artwork-card"
              onClick={() => setSelectedArtwork(artwork)}
            >
              <img src={artwork.image} alt={artwork.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
              <div className="mobile-artwork-info">
                <div className="mobile-artwork-name">{artwork.name}</div>
                <div className="mobile-artwork-artist">{artwork.artist}</div>
              </div>
            </div>
          ))}
        </div>

        {selectedArtwork && (
          <div className="modal-overlay" onClick={() => setSelectedArtwork(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedArtwork.image}
                alt={selectedArtwork.name}
                style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
              />
              <h2 style={{ marginBottom: '4px', color: 'var(--text-primary)' }}>
                {selectedArtwork.name}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
                {selectedArtwork.artist}
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {selectedArtwork.description}
              </p>

              {selectedArtwork.audioTracks.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div className="audio-player">
                    <AudioWaveform isPlaying={isPlaying} themeColor={themeColor} />
                    <div className="audio-controls">
                      <button className="play-btn" onClick={handlePlayAudio}>
                        {isPlaying ? '⏸' : '▶'}
                      </button>
                      <span className="audio-time">音频导览</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => setSelectedArtwork(null)}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tour-container">
      <div className="tour-canvas">
        <Canvas
          camera={{ fov: 75, near: 0.1, far: 1000 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.6} />
          <pointLight
            position={[ROOM_WIDTH / 2, WALL_HEIGHT - 0.5, ROOM_HEIGHT / 2]}
            intensity={1}
            color="#ffffff"
          />
          <pointLight
            position={[ROOM_WIDTH / 4, WALL_HEIGHT - 0.5, ROOM_HEIGHT / 4]}
            intensity={0.5}
          />
          <pointLight
            position={[(ROOM_WIDTH * 3) / 4, WALL_HEIGHT - 0.5, (ROOM_HEIGHT * 3) / 4]}
            intensity={0.5}
          />

          <Room
            backgroundColor={backgroundColor}
            backgroundMode={backgroundMode}
            backgroundGradientEnd={backgroundGradientEnd}
          />

          {artworks.map((artwork) =>
            artwork.position ? (
              <ArtworkMesh
                key={artwork.id}
                artwork={artwork}
                isHighlighted={nearbyArtwork?.id === artwork.id}
                themeColor={themeColor}
              />
            ) : null
          )}

          <FirstPersonControls
            position={playerPos}
            setPosition={setPlayerPos}
            rotation={playerRot}
            setRotation={setPlayerRot}
          />
        </Canvas>
      </div>

      <div className="tour-ui">
        {nearbyArtwork && (
          <div className="artwork-detail-card">
            <h3>{nearbyArtwork.name}</h3>
            <div className="artist">{nearbyArtwork.artist}</div>
            <p className="description">{nearbyArtwork.description}</p>

            {nearbyArtwork.audioTracks.length > 0 && (
              <div className="audio-player">
                <AudioWaveform isPlaying={isPlaying} themeColor={themeColor} />
                <div className="audio-controls">
                  <button className="play-btn" onClick={handlePlayAudio}>
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <span className="audio-time">
                    {isPlaying ? '正在播放语音导览...' : '点击播放语音导览'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="control-hint">
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> 移动 · 鼠标拖拽 旋转视角 · 靠近作品自动显示详情
      </div>
    </div>
  );
}

export default Tour;
