import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SeedItem, Stats } from '../../types';
import { api } from '../api';
import SearchFilter from './SearchFilter';
import StatsBanner from './StatsBanner';
import SeedCard from './SeedCard';

interface HomePageProps {
  currentUser: string;
  onExchange: (item: SeedItem) => void;
}

const HomePage: React.FC<HomePageProps> = ({ currentUser, onExchange }) => {
  const [items, setItems] = useState<SeedItem[]>([]);
  const [varieties, setVarieties] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ todayNewItems: 0, todaySuccessfulExchanges: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [minQuantity, setMinQuantity] = useState(0);
  const [maxQuantity, setMaxQuantity] = useState(0);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchTime = useRef(0);

  const fetchData = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTime.current < 100) return;
    lastFetchTime.current = now;

    try {
      const filters = {
        search: search || undefined,
        variety: selectedVariety !== 'all' ? selectedVariety : undefined,
        location: selectedLocation !== 'all' ? selectedLocation : undefined,
        minQuantity: minQuantity > 0 ? minQuantity : undefined,
        maxQuantity: maxQuantity > 0 ? maxQuantity : undefined,
      };

      const [itemsData, varietiesData, locationsData, statsData] = await Promise.all([
        api.getItems(filters),
        api.getVarieties(),
        api.getLocations(),
        api.getStats(),
      ]);

      setItems(itemsData);
      setVarieties(varietiesData);
      setLocations(locationsData);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  }, [search, selectedVariety, selectedLocation, minQuantity, maxQuantity]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, 200);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      api.getStats().then(setStats);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const CARD_ESTIMATED_HEIGHT = 350;
  const BUFFER = 300;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [columns, setColumns] = useState(4);

  const getColumns = useCallback(() => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth > 1200) return 4;
    if (window.innerWidth > 900) return 3;
    if (window.innerWidth > 768) return 2;
    return 1;
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
      setColumns(getColumns());
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [getColumns]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const visibleStart = Math.max(0, Math.floor((scrollTop - BUFFER) / CARD_ESTIMATED_HEIGHT));
  const visibleEnd = Math.ceil((scrollTop + containerHeight + BUFFER) / CARD_ESTIMATED_HEIGHT);

  const visibleItems = useMemo(() => {
    const startIdx = Math.floor(visibleStart) * columns;
    const endIdx = Math.ceil(visibleEnd) * columns + columns * 2;
    return items.slice(startIdx, endIdx);
  }, [items, visibleStart, visibleEnd, columns]);

  const totalHeight = useMemo(() => {
    const rows = Math.ceil(items.length / columns);
    return rows * CARD_ESTIMATED_HEIGHT;
  }, [items.length, columns]);

  const getItemOffsetTop = (index: number) => {
    const row = Math.floor(index / columns);
    return row * CARD_ESTIMATED_HEIGHT;
  };

  const getItemOffsetLeft = (index: number) => {
    const col = index % columns;
    return `${col * (100 / columns)}%`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <>
      <StatsBanner stats={stats} />
      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        varieties={varieties}
        selectedVariety={selectedVariety}
        onVarietyChange={setSelectedVariety}
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        minQuantity={minQuantity}
        onMinQuantityChange={setMinQuantity}
        maxQuantity={maxQuantity}
        onMaxQuantityChange={setMaxQuantity}
      />

      <div
        ref={containerRef}
        className="grid-container"
        onScroll={handleScroll}
        style={{ height: 'calc(100vh - 420px)', overflowY: 'auto' }}
      >
        <div className="grid-wrapper" style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            {visibleItems.length === 0 ? (
              <div className="empty-state" style={{ position: 'absolute', width: '100%', top: '50px' }}>
                <div className="empty-icon">🌱</div>
                <p>暂无匹配的条目，试试调整搜索条件吧</p>
              </div>
            ) : (
              visibleItems.map((item) => {
                const originalIndex = items.indexOf(item);
                return (
                  <div
                    key={item.id}
                    style={{
                      position: 'absolute',
                      top: getItemOffsetTop(originalIndex),
                      left: getItemOffsetLeft(originalIndex),
                      width: `${100 / columns}%`,
                      padding: '0 10px',
                      animationDelay: `${(originalIndex % 20) * 0.05}s`,
                    }}
                  >
                    <SeedCard item={item} currentUser={currentUser} onExchange={onExchange} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
