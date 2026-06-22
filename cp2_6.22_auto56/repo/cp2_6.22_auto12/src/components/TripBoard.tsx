import { useTripStore } from '../store/useTripStore';
import { TripCard } from './TripCard';
import { EmptyState } from './EmptyState';
import { useUiStore } from '../store/useUiStore';
import { useEffect, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';

export const TripBoard = () => {
  const { getFilteredTrips, trips } = useTripStore();
  const { setShowCreateTripModal } = useUiStore();
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight - 300 : 600,
  });
  
  const filteredTrips = getFilteredTrips();
  const shouldUseVirtualScroll = trips.length > 20;
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight - 300,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const getColumnCount = () => {
    if (windowSize.width < 768) return 1;
    if (windowSize.width < 1024) return 2;
    if (windowSize.width < 1280) return 3;
    return 4;
  };
  
  const columnCount = getColumnCount();
  const cardWidth = Math.min((windowSize.width - 80) / columnCount, 320);
  const cardHeight = 340;
  const rowCount = Math.ceil(filteredTrips.length / columnCount);
  
  if (filteredTrips.length === 0 && trips.length === 0) {
    return <EmptyState onCreateClick={() => setShowCreateTripModal(true)} />;
  }
  
  if (filteredTrips.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-warm-700 mb-2">没有找到匹配的旅行</h3>
        <p className="text-warm-500">尝试调整搜索条件或清除筛选</p>
      </div>
    );
  }
  
  if (shouldUseVirtualScroll) {
    const Cell = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
      const index = rowIndex * columnCount + columnIndex;
      if (index >= filteredTrips.length) return null;
      
      return (
        <div style={{ ...style, padding: '12px' }}>
          <TripCard trip={filteredTrips[index]} index={index} />
        </div>
      );
    };
    
    return (
      <div className="animate-fade-in">
        <p className="text-sm text-warm-500 mb-4">
          找到 <span className="font-semibold text-primary-600">{filteredTrips.length}</span> 个旅行计划
        </p>
        <Grid
          columnCount={columnCount}
          columnWidth={cardWidth + 24}
          height={windowSize.height}
          rowCount={rowCount}
          rowHeight={cardHeight + 24}
          width={windowSize.width - 48}
          itemData={filteredTrips}
          className="custom-scrollbar"
        >
          {Cell}
        </Grid>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <p className="text-sm text-warm-500 mb-4">
        找到 <span className="font-semibold text-primary-600">{filteredTrips.length}</span> 个旅行计划
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTrips.map((trip, index) => (
          <TripCard key={trip.id} trip={trip} index={index} />
        ))}
      </div>
    </div>
  );
};
