import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardModule from './components/DashboardModule';
import InspirationPanel from './components/InspirationPanel';
import InspirationDetail from './components/InspirationDetail';
import { Inspiration, FilterParams } from './types';
import { fetchStatusStats } from './api';

const App: React.FC = () => {
  const [filterParams, setFilterParams] = useState<FilterParams>({
    tag: '',
    status: '',
    search: '',
  });
  const [selectedInspiration, setSelectedInspiration] = useState<Inspiration | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [allInspirations, setAllInspirations] = useState<Inspiration[]>([]);

  useEffect(() => {
    const handleTagChange = (e: Event) => {
      const custom = e as CustomEvent;
      setFilterParams((prev) => ({ ...prev, tag: custom.detail || '' }));
    };
    const handleStatusChange = (e: Event) => {
      const custom = e as CustomEvent;
      setFilterParams((prev) => ({ ...prev, status: custom.detail || '' }));
    };
    const handleSearchChange = (e: Event) => {
      const custom = e as CustomEvent;
      setFilterParams((prev) => ({ ...prev, search: custom.detail || '' }));
    };
    document.addEventListener('tagChange', handleTagChange);
    document.addEventListener('statusChange', handleStatusChange);
    document.addEventListener('searchChange', handleSearchChange);
    return () => {
      document.removeEventListener('tagChange', handleTagChange);
      document.removeEventListener('statusChange', handleStatusChange);
      document.removeEventListener('searchChange', handleSearchChange);
    };
  }, []);

  const handleSelectInspiration = useCallback(
    (id: string) => {
      const found = allInspirations.find((i) => i.id === id);
      if (found) {
        setSelectedInspiration(found);
        setIsNew(false);
        setShowDetail(true);
      }
    },
    [allInspirations]
  );

  const handleDataLoaded = useCallback((data: Inspiration[]) => {
    setAllInspirations(data);
  }, []);

  const handleAddNew = () => {
    setSelectedInspiration(null);
    setIsNew(true);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedInspiration(null);
    setIsNew(false);
  };

  const refreshTotalCount = useCallback(async () => {
    try {
      const stats = await fetchStatusStats();
      const total = stats['进行中'] + stats['已实现'] + stats['已归档'];
      setTotalCount(total);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    refreshTotalCount();
    const handler = () => refreshTotalCount();
    document.addEventListener('inspirationChanged', handler);
    return () => document.removeEventListener('inspirationChanged', handler);
  }, [refreshTotalCount]);

  const handleSaved = () => {
    document.dispatchEvent(new Event('inspirationChanged'));
    setFilterParams((prev) => ({ ...prev }));
  };

  return (
    <>
      <Navbar totalCount={totalCount} />
      <div className="app-container">
        <DashboardModule />
        <InspirationPanel
          filterParams={filterParams}
          onSelectInspiration={handleSelectInspiration}
          onDataLoaded={handleDataLoaded}
        />
      </div>
      <button className="add-btn" onClick={handleAddNew} aria-label="新建灵感">
        +
      </button>
      {showDetail && (
        <InspirationDetail
          inspiration={selectedInspiration}
          isNew={isNew}
          onClose={handleCloseDetail}
          onSaved={handleSaved}
        />
      )}
    </>
  );
};

export default App;
