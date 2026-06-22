import React, { useState } from 'react';
import { assetManager } from '../AssetManager';
import { AssetItem } from '../AssetManager';

type Category = 'sprite' | 'prop' | 'bubble';

const CATEGORY_LABELS: Record<Category, string> = {
  sprite: '精灵',
  prop: '道具',
  bubble: '气泡',
};

export const AssetPanel: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('sprite');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const assets = assetManager.getByCategory(activeCategory);

  const handleDragStart = (e: React.DragEvent, asset: AssetItem) => {
    e.dataTransfer.setData('assetId', asset.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAssetClick = (assetId: string) => {
    setSelectedAssetId(prev => prev === assetId ? null : assetId);
  };

  const getDisplaySize = (asset: AssetItem) => {
    if (asset.category === 'sprite') return { width: 42, height: 42 };
    if (asset.category === 'prop') return { width: 32, height: 32 };
    return { width: 64, height: 32 };
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        width: 220,
        background: '#2A2C30',
        borderRadius: 8,
      }}
    >
      <div className="flex border-b" style={{ borderColor: '#3A3D42' }}>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
          <button
            key={cat}
            className="flex-1 py-2 text-sm transition-all duration-200"
            style={{
              color: activeCategory === cat ? '#F5A623' : '#E0E0E0',
              background: activeCategory === cat ? '#3A3D42' : 'transparent',
              borderBottom: activeCategory === cat ? '2px solid #F5A623' : '2px solid transparent',
            }}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin' }}>
        <div className="grid grid-cols-2 gap-2">
          {assets.map(asset => {
            const isSelected = selectedAssetId === asset.id;
            const size = getDisplaySize(asset);
            const textureUrl = assetManager.getTextureUrl(asset.id);

            return (
              <div
                key={asset.id}
                draggable
                className="flex flex-col items-center p-2 cursor-grab active:cursor-grabbing transition-all duration-200"
                style={{
                  borderRadius: 4,
                  border: isSelected ? '2px solid #F5A623' : '2px solid transparent',
                  background: isSelected ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.03)',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
                onClick={() => handleAssetClick(asset.id)}
                onDragStart={(e) => handleDragStart(e, asset)}
              >
                <div
                  style={{
                    width: size.width,
                    height: size.height,
                    backgroundImage: `url(${textureUrl})`,
                    backgroundSize: '100% 100%',
                    imageRendering: 'pixelated',
                  }}
                />
                <span
                  className="mt-1 text-xs text-center"
                  style={{ color: '#E0E0E0' }}
                >
                  {asset.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
