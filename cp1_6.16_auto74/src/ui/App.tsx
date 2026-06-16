import { useState, useEffect, useMemo, useRef } from 'react';
import { EventBus } from '@/data/EventBus';
import { DataManager } from '@/data/dataManager';
import { Artwork } from '@/data/types';
import FilterPanel from './FilterPanel';
import Gallery from './Gallery';
import DetailModal from './DetailModal';
import AddArtworkModal from './AddArtworkModal';

export default function App() {
  const eventBus = useMemo(() => new EventBus(), []);
  const dataManagerRef = useRef<DataManager | null>(null);

  if (!dataManagerRef.current) {
    dataManagerRef.current = new DataManager(eventBus);
  }

  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  useEffect(() => {
    eventBus.emit('filter', { colors: [], styles: [], keyword: '' });
  }, [eventBus]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        setFilterCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-layout">
      <div className={`filter-sidebar ${filterCollapsed ? 'collapsed' : ''}`}>
        <FilterPanel eventBus={eventBus} onAddClick={() => setShowAddModal(true)} />
        {filterCollapsed && (
          <button
            className="expand-filter-btn"
            onClick={() => setFilterCollapsed(false)}
          >
            展开筛选
          </button>
        )}
      </div>
      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <button
              className="mobile-filter-toggle"
              onClick={() => setFilterCollapsed(!filterCollapsed)}
            >
              筛选
            </button>
            <h1 className="app-title">插画作品集</h1>
          </div>
          <button className="add-btn mobile-add" onClick={() => setShowAddModal(true)}>
            + 添加
          </button>
        </header>
        <Gallery
          eventBus={eventBus}
          onArtworkClick={(artwork) => setSelectedArtwork(artwork)}
        />
      </main>

      {selectedArtwork && (
        <DetailModal
          artwork={selectedArtwork}
          eventBus={eventBus}
          onClose={() => setSelectedArtwork(null)}
        />
      )}

      {showAddModal && (
        <AddArtworkModal
          eventBus={eventBus}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
