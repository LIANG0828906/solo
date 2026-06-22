import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingModel } from './BuildingModel';
import { MarkerPoint } from './MarkerPoint';
import { MarkerCloud } from './MarkerCloud';
import { useMarkersStore } from '../store/markersStore';
import { addMarker, editMarker, deleteMarker } from '../utils/socket';
import type { Marker } from '../types';

const FULL_MARKER_LIMIT = 150;
const MAX_MARKERS = 200;

function SceneContent({ onAddMarker }: { onAddMarker: (position: THREE.Vector3) => void }) {
  const {
    markers,
    playbackMarkers,
    playbackTime,
    selectedMarkerId,
    pulseMarkerIds,
    setSelectedMarker,
    roomId,
  } = useMarkersStore();

  const isPlaybackMode = playbackTime !== null;

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const planeRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const buildingGroupRef = useRef<THREE.Group>(null);
  const [hoverPosition, setHoverPosition] = useState<THREE.Vector3 | null>(null);

  const { camera, gl, scene } = useThree();

  const fullMarkers = useMemo(
    () => markers.slice(0, FULL_MARKER_LIMIT),
    [markers]
  );
  const cloudMarkers = useMemo(
    () => markers.slice(FULL_MARKER_LIMIT, MAX_MARKERS),
    [markers]
  );

  const handleClick = (event: any) => {
    event.stopPropagation();
    const { point } = event;
    onAddMarker(point.clone());
  };

  const handlePointerMove = (event: any) => {
    const { point } = event;
    setHoverPosition(point.clone());
  };

  const handlePointerOut = () => {
    setHoverPosition(null);
  };

  const handleMarkerClick = (markerId: string) => {
    if (isPlaybackMode) return;
    setSelectedMarker(selectedMarkerId === markerId ? null : markerId);
  };

  const handleEditMarker = (markerId: string, text: string) => {
    if (!roomId) return;
    editMarker(roomId, markerId, text);
  };

  const handleDeleteMarker = (markerId: string) => {
    if (!roomId) return;
    deleteMarker(roomId, markerId);
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={['#87CEEB', '#362d26', 0.3]} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#9B59B6" />

      <group
        ref={buildingGroupRef}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <BuildingModel />
      </group>

      {hoverPosition && !isPlaybackMode && (
        <mesh position={[hoverPosition.x, hoverPosition.y + 0.2, hoverPosition.z]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.5} />
        </mesh>
      )}

      {fullMarkers.map((marker) => (
        <MarkerPoint
          key={marker.id}
          marker={marker}
          isSelected={selectedMarkerId === marker.id}
          isPulsing={pulseMarkerIds.has(marker.id)}
          onClick={() => handleMarkerClick(marker.id)}
          onEdit={(text) => handleEditMarker(marker.id, text)}
          onDelete={() => handleDeleteMarker(marker.id)}
        />
      ))}

      {cloudMarkers.length > 0 && <MarkerCloud markers={cloudMarkers} />}

      {isPlaybackMode && playbackMarkers.length > 0 && (
        <group>
          {playbackMarkers.slice(0, FULL_MARKER_LIMIT).map((marker) => (
            <MarkerPoint
              key={`playback-${marker.id}`}
              marker={marker}
              isSelected={false}
              isPulsing={false}
              isPlayback
              onClick={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
          {playbackMarkers.length > FULL_MARKER_LIMIT && (
            <MarkerCloud
              markers={playbackMarkers.slice(FULL_MARKER_LIMIT, MAX_MARKERS)}
              isPlayback
            />
          )}
        </group>
      )}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={25}
        target={[0, 4, 0]}
        makeDefault
      />
    </>
  );
}

export function SceneViewer() {
  const [newMarkerPosition, setNewMarkerPosition] = useState<THREE.Vector3 | null>(null);
  const [newMarkerText, setNewMarkerText] = useState('');
  const { roomId, playbackTime } = useMarkersStore();
  const isPlaybackMode = playbackTime !== null;

  const handleAddMarker = (position: THREE.Vector3) => {
    if (isPlaybackMode) return;
    setNewMarkerPosition(position);
    setNewMarkerText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarkerPosition || !newMarkerText.trim() || !roomId) return;
    addMarker(roomId, {
      x: newMarkerPosition.x,
      y: newMarkerPosition.y,
      z: newMarkerPosition.z,
    }, newMarkerText.trim());
    setNewMarkerPosition(null);
    setNewMarkerText('');
  };

  const handleCancel = () => {
    setNewMarkerPosition(null);
    setNewMarkerText('');
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [12, 10, 12], fov: 50 }}
        style={{ background: '#1A1A2E' }}
        gl={{ antialias: true, alpha: false }}
      >
        <fog attach="fog" args={['#1A1A2E', 20, 40]} />
        <SceneContent onAddMarker={handleAddMarker} />
      </Canvas>

      {newMarkerPosition && (
        <div
          className="marker-input-card"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(30, 39, 58, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            width: '300px',
            zIndex: 100,
            animation: 'slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <h3
            style={{
              color: '#fff',
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            添加批注
          </h3>
          <form onSubmit={handleSubmit}>
            <textarea
              value={newMarkerText}
              onChange={(e) => setNewMarkerText(e.target.value.slice(0, 100))}
              placeholder="输入批注内容（最多100字）..."
              maxLength={100}
              autoFocus
              style={{
                width: '100%',
                minHeight: '80px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                padding: '10px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
                marginBottom: '12px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <span>点击模型表面添加标记</span>
              <span>{newMarkerText.length}/100</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!newMarkerText.trim()}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: newMarkerText.trim() ? 'linear-gradient(135deg, #3498DB, #9B59B6)' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: newMarkerText.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                提交
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        
        .marker-input-card {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
}
