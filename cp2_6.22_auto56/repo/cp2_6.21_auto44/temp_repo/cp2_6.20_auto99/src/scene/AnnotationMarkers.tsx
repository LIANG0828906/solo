import { useRef, useEffect, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { X } from 'lucide-react';
import { useGeoStore, Annotation, getRockInfo } from '@/store/useGeoStore';

interface AnnotationMarkersProps {
  annotations: Annotation[];
  onRemove: (id: string) => void;
}

function AnnotationMarker({ annotation, onRemove }: { annotation: Annotation; onRemove: (id: string) => void }) {
  const getRockColor = (type: string) => {
    switch (type) {
      case 'sedimentary': return 'text-cyan-400';
      case 'metamorphic': return 'text-yellow-400';
      case 'igneous': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <group position={[annotation.position.x, annotation.position.y, annotation.position.z]}>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
      
      <Html
        position={[0, 0.8, 0]}
        center
        distanceFactor={10}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="bg-[#1e2029] rounded-lg shadow-2xl border border-[#2a2d3a] p-3 min-w-[160px] relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(annotation.id);
            }}
            className="absolute top-1.5 right-1.5 text-[#6b7280] hover:text-[#e0e6f0] transition-colors p-0.5"
          >
            <X size={12} />
          </button>
          
          <div className={`text-sm font-semibold ${getRockColor(annotation.rockType)} mb-1.5 pr-4`}>
            {annotation.rockName}
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">密度</span>
              <span className="text-[#e0e6f0] font-mono">{annotation.density.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">坐标</span>
              <span className="text-[#e0e6f0] font-mono text-[10px]">
                {annotation.position.x.toFixed(1)}, {annotation.position.y.toFixed(1)}, {annotation.position.z.toFixed(1)}
              </span>
            </div>
          </div>
          
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1e2029] border-r border-b border-[#2a2d3a] rotate-45" />
        </div>
      </Html>
    </group>
  );
}

export function AnnotationMarkers({ annotations, onRemove }: AnnotationMarkersProps) {
  if (annotations.length === 0) return null;

  return (
    <>
      {annotations.map(ann => (
        <AnnotationMarker key={ann.id} annotation={ann} onRemove={onRemove} />
      ))}
    </>
  );
}

export default AnnotationMarkers;
