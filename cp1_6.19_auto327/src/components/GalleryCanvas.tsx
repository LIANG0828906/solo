import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useGalleryStore } from '../store';
import type { Artwork } from '../types';

interface ArtworkItemProps {
  artwork: Artwork;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

function ArtworkItem({
  artwork,
  isSelected,
  onSelect,
  onDragEnd,
  canvasRef,
}: ArtworkItemProps) {
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number }; point: { x: number; y: number } }
  ) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 1200 / rect.width;
    const scaleY = 700 / rect.height;

    const x = (info.point.x - rect.left) * scaleX - artwork.width / 2;
    const y = (info.point.y - rect.top) * scaleY - artwork.height / 2;

    onDragEnd(artwork.id, Math.round(x), Math.round(y));
  };

  return (
    <motion.div
      layout
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: artwork.x,
        y: artwork.y,
        width: artwork.width,
        height: artwork.height,
        rotate: artwork.rotation,
        boxShadow: isSelected
          ? '0 8px 32px rgba(0,0,0,0.3)'
          : '0 4px 16px rgba(0,0,0,0.15)',
      }}
      whileDrag={{
        scale: 1.05,
        zIndex: 100,
        cursor: 'grabbing',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.1,
      }}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(artwork.id);
      }}
      style={{
        position: 'absolute',
        backgroundColor: artwork.color,
        borderRadius: '4px',
        cursor: 'grab',
        boxSizing: 'border-box',
        border: isSelected ? '3px solid #8B4513' : '2px solid rgba(255,255,255,0.3)',
        transition: 'border 0.2s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '85%',
          height: '85%',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '12px',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
        }}
      >
        Artwork
      </div>
    </motion.div>
  );
}

export function GalleryCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    artworks,
    selectedId,
    layout,
    selectArtwork,
    updatePosition,
    saveHistory,
    setMouseCoords,
  } = useGalleryStore();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = layout.canvasWidth / rect.width;
    const scaleY = layout.canvasHeight / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    setMouseCoords(x, y);
  };

  const handleCanvasClick = () => {
    selectArtwork(null);
  };

  const handleDragEnd = (id: string, x: number, y: number) => {
    updatePosition(id, x, y);
    saveHistory();
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        minHeight: 'calc(100vh - 100px)',
        backgroundColor: '#1A1A1A',
      }}
    >
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: `${layout.canvasWidth}px`,
          aspectRatio: `${layout.canvasWidth} / ${layout.canvasHeight}`,
          backgroundColor: '#F5E6D3',
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(139, 69, 19, 0.02) 10px,
              rgba(139, 69, 19, 0.02) 20px
            )
          `,
          borderRadius: '8px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          overflow: 'hidden',
        }}
      >
        {artworks.map((artwork) => (
          <ArtworkItem
            key={artwork.id}
            artwork={artwork}
            isSelected={selectedId === artwork.id}
            onSelect={selectArtwork}
            onDragEnd={handleDragEnd}
            canvasRef={canvasRef}
          />
        ))}
      </div>
    </div>
  );
}
