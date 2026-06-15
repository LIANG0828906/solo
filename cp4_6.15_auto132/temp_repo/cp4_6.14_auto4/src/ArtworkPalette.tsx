import React, { memo } from 'react';
import type { Artwork } from './types';

interface ArtworkPaletteProps {
  artworks: Artwork[];
  placedArtworkIds: Set<string>;
  onDragStart: (artwork: Artwork, e: React.MouseEvent) => void;
}

const ArtworkPalette: React.FC<ArtworkPaletteProps> = memo(({ artworks, placedArtworkIds, onDragStart }) => {
  const availableArtworks = artworks.filter(a => !placedArtworkIds.has(a.id));

  return (
    <div className="w-full md:w-72 bg-gallery-bg/80 backdrop-blur-sm rounded-lg shadow-gallery border border-gallery-accent/20 p-4 flex flex-col h-full max-h-[300px] md:max-h-none">
      <h2 className="text-gallery-accent font-bold text-base mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        展品调色板
      </h2>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {availableArtworks.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            所有展品已放置
          </div>
        ) : (
          availableArtworks.map(artwork => (
            <div
              key={artwork.id}
              draggable
              onMouseDown={(e) => onDragStart(artwork, e)}
              className="group bg-gallery-bg/60 rounded-lg p-3 cursor-grab active:cursor-grabbing 
                         border border-transparent hover:border-gallery-accent/50
                         transition-all duration-200 ease-gallery
                         hover:scale-105 hover:shadow-gallery-hover"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: artwork.color }}
                >
                  {artwork.title.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-sm font-medium truncate">
                    {artwork.title}
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5">
                    {artwork.width} × {artwork.height} px
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  );
});

ArtworkPalette.displayName = 'ArtworkPalette';

export default ArtworkPalette;
