import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import AudioWaveform from './AudioWaveform';

interface Artwork {
  id: string;
  name: string;
  artist: string;
  description: string;
  image: string;
  audioTracks: string[];
  position?: { x: number; y: number; wall: string };
  order?: number;
}

interface TourProps {
  exhibition: any;
}

const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 15;
const WALL_HEIGHT = 4;
const PLAYER_SPEED = 0.1;
const DETECTION_RANGE = 3;

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
  const isLocked = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      isLocked.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      isLocked.current = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return;
      
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      
      setRotation(prev => ({
        x: Math.max(-Math.PI / 6, Math.min(Math.PI / 3, prev.x - dy * 0.002)),
        y: prev.y - dx * 0.002,
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
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl.domElement, setRotation]);

  useFrame(() => {
    const dir = new THREE.Vector3();
    
    if (keys.current['w']) {
      dir.z -= 1;
    }
    if (keys.current['s']) {
      dir.z += 1;
    }
    if (keys.current['a']) {
      dir.x -= 1;
    }
    if (keys.current['d']) {
      dir.x += 1;
    }
    
    if (dir.length() > 0) {
      dir.normalize();
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
      
      const newPos = position.clone();
      newPos.add(dir.multiplyScalar(PLAYER_SPEED));
      
      const margin = 1;
      newPos.x = Math.max(margin, Math.min(ROOM_WIDTH - margin, newPos.x));
      newPos.z = Math.max(margin, Math.min(ROOM_HEIGHT - margin, newPos.z));
      
      setPosition(newPos);
    }
    
    camera.position.set(position.x, 1.6, position.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = rotation.y;
    camera.rotation.x = rotation.x;
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
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    const target = isHighlighted ? 1.5 : 0;
    const duration = 500;
    const startTime = Date.now();
    const startIntensity = intensity;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setIntensity(startIntensity + (target - startIntensity) * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [isHighlighted]);

  const position = useMemo(() => {
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
      <mesh ref={glowRef} scale={1 + intensity * 0.1}>
        <planeGeometry args={[2.2, 1.7]} />
        <meshBasicMaterial 
          color="#ffd700" 
          transparent 
          opacity={intensity * 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh ref={meshRef}>
        <planeGeometry args={[2, 1.5]} />
        <meshBasicMaterial 
          color={isHighlighted ? '#ffffff' : '#cccccc'}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <Text
        position={[0, -1.2, 0.01]}
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
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROOM_WIDTH / 2, 0, ROOM_HEIGHT / 2]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color={backgroundColor} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh position={[ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0]}>
        <planeGeometry args={[ROOM_WIDTH, WALL_HEIGHT]} />
        <meshStandardMaterial color={backgroundMode === 'gradient' ? backgroundGradientEnd : backgroundColor} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh position={[ROOM_WIDTH / 2, WALL_HEIGHT / 2, ROOM_HEIGHT]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[ROOM_WIDTH, WALL_HEIGHT]} />
        <meshStandardMaterial color={backgroundColor} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh position={[0, WALL_HEIGHT / 2, ROOM_HEIGHT / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_HEIGHT, WALL_HEIGHT]} />
        <meshStandardMaterial color={backgroundColor} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh position={[ROOM_WIDTH, WALL_HEIGHT / 2, ROOM_HEIGHT / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_HEIGHT, WALL_HEIGHT]} />
        <meshStandardMaterial color={backgroundMode === 'gradient' ? backgroundGradientEnd : backgroundColor} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[ROOM_WIDTH / 2, WALL_HEIGHT, ROOM_HEIGHT / 2]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color={backgroundMode === 'gradient' ? backgroundGradientEnd : backgroundColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Tour({ exhibition }: TourProps) {
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(ROOM_WIDTH / 2, 1.6, ROOM_HEIGHT / 2));
  const [playerRot, setPlayerRot] = useState({ x: 0, y: 0 });
  const [nearbyArtwork, setNearbyArtwork] = useState<Artwork | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [visitStartTime] = useState(Date.now());
  const [artworkStayTimes, setArtworkStayTimes] = useState<Record<string, number>>({});
  const [currentArtworkStartTime, setCurrentArtworkStartTime] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  const artworks = exhibition?.artworks || [];
  const backgroundColor = exhibition?.backgroundColor || '#1e293b';
  const backgroundMode = exhibition?.backgroundMode || 'solid';
  const backgroundGradientEnd = exhibition?.backgroundGradientEnd || '#334155';

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
    if (!nearbyArtwork) {
      if (currentArtworkStartTime && nearbyArtwork === null) {
        const stayed = (Date.now() - currentArtworkStartTime) / 1000;
        setArtworkStayTimes(prev => ({
          ...prev,
          [nearbyArtwork?.id || '']: (prev[nearbyArtwork?.id || ''] || 0) + stayed,
        }));
      }
      setCurrentArtworkStartTime(null);
      return;
    }
    
    setCurrentArtworkStartTime(Date.now());
  }, [nearbyArtwork?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (visitorId) {
        const duration = Math.floor((Date.now() - visitStartTime) / 1000);
        const viewedCount = Object.keys(artworkStayTimes).length;
        const totalArtworks = artworks.length || 1;
        const completionRate = Math.floor((viewedCount / totalArtworks) * 100);
        
        axios.put(`/api/visitors/${visitorId}`, {
          duration,
          artworkStayTimes,
          completionRate,
        }).catch(() => {});
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [visitorId, artworkStayTimes, visitStartTime, artworks.length]);

  useEffect(() => {
    let closest: Artwork | null = null;
    let closestDist = Infinity;
    
    artworks.forEach((artwork: Artwork) => {
      if (!artwork.position) return;
      
      let artworkPos: THREE.Vector3;
      const { x, y, wall } = artwork.position;
      
      switch (wall) {
        case 'north':
          artworkPos = new THREE.Vector3(x, 1.5, 0.1);
          break;
        case 'south':
          artworkPos = new THREE.Vector3(x, 1.5, ROOM_HEIGHT - 0.1);
          break;
        case 'west':
          artworkPos = new THREE.Vector3(0.1, 1.5, y);
          break;
        case 'east':
          artworkPos = new THREE.Vector3(ROOM_WIDTH - 0.1, 1.5, y);
          break;
        default:
          artworkPos = new THREE.Vector3(x, 1.5, y);
      }
      
      const dist = playerPos.distanceTo(artworkPos);
      if (dist < DETECTION_RANGE && dist < closestDist) {
        closestDist = dist;
        closest = artwork;
      }
    });
    
    if (closest?.id !== nearbyArtwork?.id) {
      setNearbyArtwork(closest);
      setIsPlaying(false);
    }
  }, [playerPos, artworks, nearbyArtwork?.id]);

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
  };

  if (isMobile) {
    return (
      <div className="mobile-view" style={{ paddingTop: '80px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>{exhibition?.name || '虚拟展览'}</h2>
        <div className="mobile-artwork-grid">
          {artworks.map((artwork: Artwork) => (
            <div 
              key={artwork.id}
              className="mobile-artwork-card"
              onClick={() => setSelectedArtwork(artwork)}
            >
              <img src={artwork.image} alt={artwork.name} />
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
              <h2 style={{ marginBottom: '4px' }}>{selectedArtwork.name}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>{selectedArtwork.artist}</p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedArtwork.description}</p>
              
              {selectedArtwork.audioTracks.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div className="audio-player">
                    <AudioWaveform isPlaying={isPlaying} themeColor="#6366f1" />
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
          <pointLight position={[ROOM_WIDTH / 2, WALL_HEIGHT - 0.5, ROOM_HEIGHT / 2]} intensity={0.8} />
          
          <Room 
            backgroundColor={backgroundColor}
            backgroundMode={backgroundMode}
            backgroundGradientEnd={backgroundGradientEnd}
          />
          
          {artworks.map((artwork: Artwork) => (
            artwork.position && (
              <ArtworkMesh 
                key={artwork.id} 
                artwork={artwork} 
                isHighlighted={nearbyArtwork?.id === artwork.id}
                themeColor="#6366f1"
              />
            )
          ))}
          
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
                <AudioWaveform isPlaying={isPlaying} themeColor="#6366f1" />
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
        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动 · 
        鼠标拖拽 旋转视角 · 
        靠近作品自动显示详情
      </div>
    </div>
  );
}

export default Tour;
