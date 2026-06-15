
import { useAppStore } from '../store/useStore';
import { Walnut } from '../types';
import { drawWalnut } from '../utils/walnutRenderer';
import { useEffect, useRef } from 'react';
import './FavoritesSidebar.css';

interface FavoritesSidebarProps {
  onSelectWalnut: (walnut: Walnut) => void;
}

export function FavoritesSidebar({ onSelectWalnut }: FavoritesSidebarProps) {
  const favorites = useAppStore(state => state.favorites);
  const isOpen = useAppStore(state => state.isFavoritesOpen);
  const setIsFavoritesOpen = useAppStore(state => state.setIsFavoritesOpen);

  const canvasRefs = useRef<Map<string, HTMLCanvasElement | null>>(new Map());
  const animationRefs = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    favorites.forEach(walnut => {
      const canvas = canvasRefs.current.get(walnut.id);
      if (canvas && !animationRefs.current.has(walnut.id)) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let rotation = 0;
        const animate = () => {
          rotation += 0.5;
          if (rotation >= 360) rotation = 0;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawWalnut(ctx, {
            rotationY: rotation,
            rotationX: 10,
            scale: 1,
            textureSeed: walnut.textureSeed,
            size: 40,
          });
          
          const id = requestAnimationFrame(animate);
          animationRefs.current.set(walnut.id, id);
        };
        
        animate();
      }
    });

    return () => {
      animationRefs.current.forEach(id => cancelAnimationFrame(id));
      animationRefs.current.clear();
    };
  }, [favorites, isOpen]);

  const toggleSidebar = () => {
    setIsFavoritesOpen(!isOpen);
  };

  return (
    <aside className={`favorites-sidebar ${isOpen ? 'open' : ''}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isOpen ? '›' : '藏'}
      </button>
      
      <div className="sidebar-content">
        <h3 className="sidebar-title">收藏架</h3>
        
        {favorites.length === 0 ? (
          <p className="empty-text">暂无收藏</p>
        ) : (
          <div className="favorites-list">
            {favorites.map(walnut => (
              <div 
                key={walnut.id}
                className="favorite-item"
                onClick={() => onSelectWalnut(walnut)}
                title={walnut.name}
              >
                <canvas
                  ref={el => canvasRefs.current.set(walnut.id, el)}
                  width={50}
                  height={50}
                />
                {isOpen && (
                  <span className="favorite-name">{walnut.name}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
