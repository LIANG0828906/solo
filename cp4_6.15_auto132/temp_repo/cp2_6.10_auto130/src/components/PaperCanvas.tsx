import React, { useCallback, useRef } from 'react';
import { useAppStore } from '../store';
import { useColorScheme } from '../hooks/useColorScheme';
import { PlacedMaterial } from './PlacedMaterial';
import { GridOverlay } from './GridOverlay';
import { snapToGrid } from '../utils/colorUtils';

interface PaperCanvasProps {
  width: number;
  height: number;
  gridSize: number;
  snapDistance: number;
}

export const PaperCanvas: React.FC<PaperCanvasProps> = ({
  width,
  height,
  gridSize,
  snapDistance,
}) => {
  const {
    materials,
    placedMaterials,
    selectedId,
    selectMaterial,
    gridVisible,
    colorScheme,
    addMaterial,
  } = useAppStore();
  const { currentScheme, mapMaterialColor } = useColorScheme(colorScheme);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        selectMaterial(null);
      }
    },
    [selectMaterial]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const materialId = e.dataTransfer.getData('materialId');
      if (!materialId || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      if (x >= 0 && x <= width && y >= 0 && y <= height) {
        if (gridVisible) {
          const snapped = snapToGrid(x, y, gridSize, snapDistance);
          x = snapped.x;
          y = snapped.y;
        }

        const material = materials.find((m) => m.id === materialId);
        if (material) {
          const initialColor = mapMaterialColor(material.baseColor);
          addMaterial(materialId, x, y, initialColor);
        }
      }
    },
    [width, height, gridVisible, gridSize, snapDistance, materials, addMaterial, mapMaterialColor]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div
      id="paper-canvas"
      ref={canvasRef}
      className="relative overflow-hidden"
      style={{
        width,
        height,
        background: currentScheme.paperBg,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
        borderRadius: '2px',
        transition: 'background-color 0.5s ease',
      }}
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(0,0,0,0.05) 0%, transparent 50%)
          `,
        }}
      />

      <GridOverlay
        visible={gridVisible}
        width={width}
        height={height}
        gridSize={gridSize}
      />

      {placedMaterials.map((placed) => {
        const material = materials.find((m) => m.id === placed.materialId);
        if (!material) return null;
        return (
          <PlacedMaterial
            key={placed.id}
            placed={placed}
            material={material}
            gridSize={gridSize}
            snapDistance={snapDistance}
            gridEnabled={gridVisible}
            paperSize={{ width, height }}
          />
        );
      })}
    </div>
  );
};
