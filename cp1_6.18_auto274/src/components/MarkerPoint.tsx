import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Marker } from '../types';

interface MarkerPointProps {
  marker: Marker;
  isSelected: boolean;
  isPulsing: boolean;
  isPlayback?: boolean;
  onClick: () => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toTimeString().slice(0, 8);
}

export function MarkerPoint({
  marker,
  isSelected,
  isPulsing,
  isPlayback = false,
  onClick,
  onEdit,
  onDelete,
}: MarkerPointProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(marker.text);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const glowSize = 0.3 + 0.2 * Math.sin(time * 2);
    
    if (glowRef.current) {
      glowRef.current.scale.setScalar(glowSize * 2);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + 0.1 * Math.sin(time * 2);
    }

    if (meshRef.current) {
      let scale = 1;
      if (isPulsing) {
        scale = 1.3;
      } else if (isSelected) {
        scale = 1.1;
      }
      meshRef.current.scale.setScalar(scale);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editText.trim()) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  const opacity = isPlayback ? 0.4 : 1;

  return (
    <group position={[marker.position.x, marker.position.y, marker.position.z]}>
      <mesh
        ref={glowRef}
        scale={1}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.2 * opacity}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.5 * opacity}
          transparent
          opacity={opacity}
        />
      </mesh>

      <Html
        position={[0, 0.5, 0]}
        center
        style={{ pointerEvents: 'auto' }}
        zIndexRange={[100, 0]}
      >
        <div
          className={`marker-label ${isSelected ? 'selected' : ''} ${isPlayback ? 'playback' : ''}`}
          style={{
            width: '150px',
            minHeight: '60px',
            background: '#2C3E50',
            color: '#FFFFFF',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: isSelected ? 'none' : 'slideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            opacity: isPlayback ? 0.4 : 1,
            transform: isPlayback ? 'scale(0.9)' : 'scale(1)',
            transition: 'opacity 0.3s, transform 0.3s',
          }}
        >
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, 100))}
                maxLength={100}
                autoFocus
                style={{
                  width: '100%',
                  minHeight: '40px',
                  background: '#34495E',
                  border: '1px solid #3498DB',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '12px',
                  padding: '4px',
                  resize: 'none',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '2px 6px',
                    background: '#1ABC9C',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(marker.text);
                  }}
                  style={{
                    flex: 1,
                    padding: '2px 6px',
                    background: '#7F8C8D',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <div onClick={(e) => { e.stopPropagation(); onClick(); }}>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: '#FFD700',
                  fontSize: '11px',
                }}
              >
                {marker.author} · {formatTime(marker.createdAt)}
              </div>
              <div
                style={{
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                  maxHeight: '60px',
                  overflow: 'hidden',
                }}
              >
                {marker.text}
              </div>
              {isSelected && !isPlayback && (
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '6px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '3px 6px',
                      background: '#3498DB',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    style={{
                      flex: 1,
                      padding: '3px 6px',
                      background: '#E74C3C',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    删除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Html>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .marker-label.selected {
          border: 1px solid #FFD700;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
        }
      `}</style>
    </group>
  );
}
