import { useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { ASSET_CATEGORIES, getAssetsByCategory } from '../data/assets';
import { useUIStore } from '../store/uiStore';
import { useDragDrop } from '../hooks/useDragDrop';
import type { AssetItem } from '../types/board';

export default function AssetLibrary() {
  const { showAssetLibrary, toggleAssetLibrary } = useUIStore();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { handleDragStart } = useDragDrop(() => {});
  const assets = getAssetsByCategory(activeCategory);

  if (!showAssetLibrary) return null;

  return (
    <div
      className="asset-library-overlay md:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleAssetLibrary(false);
      }}
    >
      <div className="asset-library md:static" style={{ height: isCollapsed ? '60px' : undefined }}>
        <div className="asset-library-header">
          <button
            className="asset-library-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <span className="asset-library-title">素材库</span>
          <button
            className="asset-library-close-btn"
            onClick={() => toggleAssetLibrary(false)}
          >
            <X size={20} />
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div className="asset-categories">
              {ASSET_CATEGORIES.map((category) => (
                <button
                  key={category}
                  className={`asset-category-btn ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="asset-grid">
              {assets.map((asset: AssetItem) => (
                <div
                  key={asset.id}
                  className="asset-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'asset', asset })}
                >
                  <img
                    src={asset.thumbnail}
                    alt={asset.name}
                    className="asset-thumbnail"
                    draggable={false}
                  />
                  <div className="asset-name">{asset.name}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .asset-library-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 100;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .asset-library {
          width: 100%;
          max-height: 70vh;
          background: var(--color-glass);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid var(--color-border);
          border-radius: 16px 16px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.12);
        }

        body.dark .asset-library {
          background: var(--color-glass-dark);
        }

        .asset-library-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          min-height: 60px;
          border-bottom: 1px solid var(--color-border);
        }

        .asset-library-collapse-btn,
        .asset-library-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color var(--transition-fast);
          color: var(--color-text-light);
        }

        .asset-library-collapse-btn:hover,
        .asset-library-close-btn:hover {
          background: rgba(33, 150, 243, 0.1);
          color: var(--color-text);
        }

        body.dark .asset-library-collapse-btn,
        body.dark .asset-library-close-btn {
          color: var(--color-text-light);
        }

        body.dark .asset-library-collapse-btn:hover,
        body.dark .asset-library-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-text-dark);
        }

        .asset-library-title {
          font-size: 18px;
          font-weight: 600;
          font-family: var(--font-display);
        }

        .asset-categories {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          overflow-x: auto;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .asset-category-btn {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          background: transparent;
          color: var(--color-text-light);
          transition: all var(--transition-fast);
          border: 1px solid transparent;
        }

        .asset-category-btn:hover {
          background: rgba(33, 150, 243, 0.08);
          color: var(--color-text);
        }

        .asset-category-btn.active {
          background: var(--color-primary);
          color: #ffffff;
          border-color: var(--color-primary);
        }

        body.dark .asset-category-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-text-dark);
        }

        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
          padding: 16px;
          overflow-y: auto;
          flex: 1;
        }

        .asset-card {
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid var(--color-border);
          cursor: grab;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
        }

        body.dark .asset-card {
          background: rgba(255, 255, 255, 0.05);
        }

        .asset-card:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          border-color: var(--color-primary);
          z-index: 1;
        }

        .asset-card:hover .asset-name {
          opacity: 1;
          transform: translateY(0);
        }

        .asset-card:active {
          cursor: grabbing;
        }

        .asset-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }

        .asset-name {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px 10px;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
          color: #ffffff;
          font-size: 12px;
          text-align: center;
          opacity: 0;
          transform: translateY(100%);
          transition: opacity var(--transition-fast), transform var(--transition-fast);
          pointer-events: none;
        }

        @media (min-width: 769px) {
          .asset-library-overlay {
            display: none;
          }

          .asset-library {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-height: 45vh;
            z-index: 50;
          }

          .asset-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 16px;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
