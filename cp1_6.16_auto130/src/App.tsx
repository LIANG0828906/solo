import React, { useEffect, useRef, useCallback } from 'react';
import ControlPanel from './ControlPanel';
import ArtCanvas from './ArtCanvas';
import useStore, { FavoriteItem } from './store';
import { generateArt, renderElements } from './artGenerator';
import './styles.css';

const App: React.FC = () => {
  const loadFavorites = useStore((s) => s.loadFavorites);
  const favorites = useStore((s) => s.favorites);
  const params = useStore((s) => s.params);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    const timer = setTimeout(() => {
      favorites.forEach((fav) => {
        const canvas = document.querySelector(
          `[data-fav-id="${fav.id}"]`
        ) as HTMLCanvasElement | null;
        if (canvas && !canvas.dataset.rendered) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const elements = generateArt({
              lineDensity: fav.params.lineDensity,
              shapeComplexity: fav.params.shapeComplexity,
              hueShift: fav.params.hueShift,
              opacity: fav.params.opacity,
              primaryColor: fav.params.primaryColor,
              canvasWidth: 48,
              canvasHeight: 36,
              seed: fav.hash.split('').reduce((a, c) => a + c.charCodeAt(0), 0),
            });
            ctx.clearRect(0, 0, 48, 36);
            ctx.fillStyle = fav.params.bgColor;
            ctx.fillRect(0, 0, 48, 36);
            for (const el of elements) {
              ctx.save();
              ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity));
              if (el.type === 'circle' && el.radius) {
                const r = el.radius * 0.2;
                ctx.beginPath();
                ctx.arc(el.x * 0.15, el.y * 0.1, r, 0, Math.PI * 2);
                ctx.fillStyle = el.fillColor;
                ctx.fill();
              } else if (el.type === 'rect') {
                const w = (el.width ?? 20) * 0.2;
                const h = (el.height ?? 20) * 0.2;
                ctx.fillStyle = el.fillColor;
                ctx.fillRect(el.x * 0.15 - w / 2, el.y * 0.1 - h / 2, w, h);
              }
              ctx.restore();
            }
            canvas.dataset.rendered = '1';
          }
        }
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [favorites]);

  return (
    <div className="app-layout">
      <ControlPanel />
      <ArtCanvas />
    </div>
  );
};

export default App;
