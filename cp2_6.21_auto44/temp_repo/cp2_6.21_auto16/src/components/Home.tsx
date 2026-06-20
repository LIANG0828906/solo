import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/store';
import * as api from '@/api';
import AuctionCard from './AuctionCard';

export default function Home() {
  const { artworks, loading, setArtworks } = useStore();
  const [columns, setColumns] = useState<number>(3);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const data = await api.getArtworks();
        setArtworks(data);
      } catch (err) {
        console.error('Failed to fetch artworks:', err);
      }
    };

    fetchArtworks();
  }, [setArtworks]);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(1);
      } else if (width < 1024) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const getColumnArtworks = (columnIndex: number) => {
    return artworks.filter((_, index) => index % columns === columnIndex);
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <h1 className="home-title">精选艺术品拍卖</h1>
        <p className="home-subtitle">发现独一无二的艺术珍品</p>
      </div>

      {loading && artworks.length === 0 ? (
        <div className="home-loading">加载中...</div>
      ) : (
        <div className="masonry-container" ref={containerRef}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="masonry-column">
              {getColumnArtworks(colIndex).map((artwork) => (
                <AuctionCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
