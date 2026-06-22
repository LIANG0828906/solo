import { useRef, useState, useCallback } from 'react';
import { GalleryScene } from './components/GalleryScene';
import { ToolPanel } from './components/ToolPanel';
import { DataPanel } from './components/DataPanel';
import { useGalleryStore } from './store/galleryStore';
import { snapToGrid, WALL_GRID_SIZE, GALLERY_DIMENSIONS } from './utils/helpers';
import type { WallType } from './types';

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingWall, setPendingWall] = useState<WallType | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number; z: number } | null>(null);
  const { addArtwork } = useGalleryStore();

  const handleWallClick = useCallback((wall: WallType, position: { x: number; y: number; z: number }) => {
    setPendingWall(wall);
    setPendingPosition(position);
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingWall || !pendingPosition) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;

      const { width, depth, height } = GALLERY_DIMENSIONS;
      let snappedX = pendingPosition.x;
      let snappedY = pendingPosition.y;
      let snappedZ = pendingPosition.z;
      let rotationY = 0;

      switch (pendingWall) {
        case 'north':
          snappedX = snapToGrid(pendingPosition.x, WALL_GRID_SIZE);
          snappedY = snapToGrid(pendingPosition.y, WALL_GRID_SIZE);
          snappedZ = -depth / 2 + 0.03;
          rotationY = 0;
          break;
        case 'south':
          snappedX = snapToGrid(pendingPosition.x, WALL_GRID_SIZE);
          snappedY = snapToGrid(pendingPosition.y, WALL_GRID_SIZE);
          snappedZ = depth / 2 - 0.03;
          rotationY = Math.PI;
          break;
        case 'east':
          snappedX = width / 2 - 0.03;
          snappedY = snapToGrid(pendingPosition.y, WALL_GRID_SIZE);
          snappedZ = snapToGrid(pendingPosition.z, WALL_GRID_SIZE);
          rotationY = -Math.PI / 2;
          break;
        case 'west':
          snappedX = -width / 2 + 0.03;
          snappedY = snapToGrid(pendingPosition.y, WALL_GRID_SIZE);
          snappedZ = snapToGrid(pendingPosition.z, WALL_GRID_SIZE);
          rotationY = Math.PI / 2;
          break;
      }

      addArtwork({
        type: 'painting',
        position: { x: snappedX, y: snappedY, z: snappedZ },
        rotation: { x: 0, y: rotationY, z: 0 },
        imageUrl,
        wall: pendingWall,
      });

      setPendingWall(null);
      setPendingPosition(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [pendingWall, pendingPosition, addArtwork]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GalleryScene onWallClick={handleWallClick} />
      <ToolPanel />
      <DataPanel />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default App;
