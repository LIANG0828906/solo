import React, { useState, useCallback } from 'react';
import { Material, MaterialCategory } from '../types';
import { useAppStore } from '../store';
import { useColorScheme } from '../hooks/useColorScheme';
import { playDropSound } from '../utils/audioUtils';

interface MaterialPanelProps {
  thumbnailSize: number;
  columns: number;
}

const CATEGORIES: { id: MaterialCategory; name: string; color: string }[] = [
  { id: 'petal', name: '花瓣', color: 'linear-gradient(135deg, #d4a0d2, #f8c8dc)' },
  { id: 'leaf', name: '叶片', color: 'linear-gradient(135deg, #7cba7c, #4a7c4a)' },
  { id: 'stem', name: '草茎', color: 'linear-gradient(135deg, #d2b48c, #daa520)' },
];

export const MaterialPanel: React.FC<MaterialPanelProps> = ({ thumbnailSize, columns }) => {
  const { materials, addMaterial, paperSize } = useAppStore();
  const { mapMaterialColor } = useColorScheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const groupedMaterials = materials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {} as Record<MaterialCategory, Material[]>);

  const handleDragStart = useCallback(
    (e: React.DragEvent, material: Material) => {
      setDraggingId(material.id);
      e.dataTransfer.setData('materialId', material.id);
      e.dataTransfer.effectAllowed = 'copy';

      const dragImage = document.createElement('div');
      dragImage.style.width = `${thumbnailSize}px`;
      dragImage.style.height = `${thumbnailSize}px`;
      dragImage.style.opacity = '0';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    },
    [thumbnailSize]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const materialId = e.dataTransfer.getData('materialId');
      if (!materialId) return;

      const paperElement = document.getElementById('paper-canvas');
      if (!paperElement) return;

      const rect = paperElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= paperSize.width && y >= 0 && y <= paperSize.height) {
        const material = materials.find((m) => m.id === materialId);
        if (material) {
          const initialColor = mapMaterialColor(material.baseColor);
          addMaterial(materialId, x, y, initialColor);
          playDropSound();
        }
      }
    },
    [addMaterial, materials, mapMaterialColor, paperSize]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  React.useEffect(() => {
    const paperElement = document.getElementById('paper-canvas');
    if (paperElement) {
      paperElement.addEventListener('drop', handleDrop as unknown as EventListener);
      paperElement.addEventListener('dragover', handleDragOver as unknown as EventListener);
      return () => {
        paperElement.removeEventListener('drop', handleDrop as unknown as EventListener);
        paperElement.removeEventListener('dragover', handleDragOver as unknown as EventListener);
      };
    }
  }, [handleDrop, handleDragOver]);

  return (
    <div
      className="p-4 rounded-lg overflow-y-auto"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(4px)',
        boxShadow: '2px 2px 8px rgba(141, 110, 99, 0.3)',
        borderRadius: '8px',
      }}
    >
      <h2
        className="text-lg mb-4 text-center"
        style={{
          fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
          color: '#3e2723',
          fontWeight: 'bold',
        }}
      >
        素材库
      </h2>

      {CATEGORIES.map((category) => (
        <div key={category.id} className="mb-4">
          <div
            className="text-sm mb-2 px-2 py-1 rounded"
            style={{
              fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
              color: '#3e2723',
              background: category.color,
              opacity: 0.8,
            }}
          >
            {category.name}
          </div>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
            }}
          >
            {groupedMaterials[category.id]?.map((material) => (
              <div
                key={material.id}
                className="relative cursor-grab active:cursor-grabbing"
                style={{
                  width: thumbnailSize,
                  height: thumbnailSize,
                  transform: hoveredId === material.id ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                  opacity: draggingId === material.id ? 0.5 : 1,
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, material)}
                onDragEnd={handleDragEnd}
                onMouseEnter={() => setHoveredId(material.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div
                  className="w-full h-full rounded-full overflow-hidden border-2"
                  style={{
                    borderColor: hoveredId === material.id ? '#3e2723' : 'rgba(62, 39, 35, 0.3)',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <svg
                    viewBox={material.viewBox}
                    width="100%"
                    height="100%"
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    <path
                      d={material.svgPath}
                      fill={mapMaterialColor(material.baseColor)}
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="0.5"
                    />
                  </svg>
                </div>

                {hoveredId === material.id && (
                  <div
                    className="absolute whitespace-nowrap px-2 py-1 rounded text-xs"
                    style={{
                      top: '50%',
                      left: '100%',
                      transform: 'translateY(-50%)',
                      marginLeft: '8px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#000',
                      fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      zIndex: 100,
                    }}
                  >
                    {material.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
