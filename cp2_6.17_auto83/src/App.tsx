import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { PixelCanvas } from './components/PixelCanvas';
import { PixelList } from './components/PixelList';
import { usePixelStore } from './pixelBoard/store';
import { connectCollaboration, disconnectCollaboration, collaborationChannel } from './collaboration/channel';
import { pixelStorage } from './utils/storage';
import { GRID_SIZE } from './pixelBoard/types';
import { v4 as uuidv4 } from 'uuid';
import type { Pixel } from './pixelBoard/types';

const App: React.FC = () => {
  const { pixels, undo, setPixels, userId } = usePixelStore();
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      try {
        await pixelStorage.init();
        const savedPixels = await pixelStorage.loadPixels();
        if (savedPixels.length > 0) {
          setPixels(savedPixels);
        }
      } catch (e) {
        console.warn('Failed to load from IndexedDB:', e);
      }

      connectCollaboration();
    };

    init();

    return () => {
      disconnectCollaboration();
      pixelStorage.close();
    };
  }, [setPixels]);

  useEffect(() => {
    if (hasInitialized.current && pixelStorage['db']) {
      pixelStorage.savePixels(pixels).catch((e) => {
        console.warn('Failed to save to IndexedDB:', e);
      });
    }
  }, [pixels]);

  const handleUndo = useCallback(() => {
    const removedPixel = undo();
    if (removedPixel) {
      collaborationChannel.sendUndo(removedPixel.id);
    }
  }, [undo]);

  const handleSave = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

    for (const pixel of pixels) {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(pixel.x, pixel.y, 1, 1);
    }

    const link = document.createElement('a');
    link.download = `pixelpalette-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [pixels]);

  const handleLoad = useCallback((file: File) => {
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = GRID_SIZE;
        canvas.height = GRID_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsLoading(false);
          return;
        }

        ctx.drawImage(img, 0, 0, GRID_SIZE, GRID_SIZE);
        const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
        const data = imageData.data;

        const newPixels: Pixel[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const idx = (y * GRID_SIZE + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a > 128 && !(r === 224 && g === 224 && b === 224)) {
              const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
              newPixels.push({
                id: uuidv4(),
                x,
                y,
                color,
                timestamp: Date.now(),
                ownerId: userId,
              });
            }
          }
        }

        setPixels(newPixels);
        setIsLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [setPixels, userId]);

  return (
    <div className="app">
      <Toolbar
        onUndo={handleUndo}
        onSave={handleSave}
        onLoad={handleLoad}
        isLoading={isLoading}
      />
      <div className="main-content">
        <PixelCanvas />
      </div>
      <PixelList />
    </div>
  );
};

export default App;
