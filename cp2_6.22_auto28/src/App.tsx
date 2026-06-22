import { useState, useEffect, useCallback } from 'react';
import TripBoard from './components/TripBoard';
import DayPlanView from './components/DayPlan';
import MapView from './components/MapView';
import { dataStore } from './dataStore';
import type { Trip, ViewType } from './types';
import './styles/app.css';

function App() {
  const [view, setView] = useState<ViewType>('board');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dataStore.getAllTrips();
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleSelectTrip = async (trip: Trip) => {
    try {
      const fullTrip = await dataStore.getTrip(trip.id);
      setSelectedTrip(fullTrip);
      setView('detail');
    } catch (error) {
      console.error('Failed to load trip details:', error);
    }
  };

  const handleBackToBoard = () => {
    setView('board');
    setSelectedTrip(null);
    loadTrips();
  };

  const handleViewMap = () => {
    if (selectedTrip) {
      setView('map');
    }
  };

  const handleViewDetail = () => {
    if (selectedTrip) {
      setView('detail');
    }
  };

  const handleTripUpdate = useCallback(async () => {
    if (selectedTrip) {
      const updated = await dataStore.getTrip(selectedTrip.id);
      setSelectedTrip(updated);
      loadTrips();
    }
  }, [selectedTrip, loadTrips]);

  const handleCreateTrip = async (tripData: Partial<Trip>) => {
    try {
      const newTrip = await dataStore.createTrip(tripData);
      setTrips(prev => [newTrip, ...prev]);
      setSelectedTrip(newTrip);
      setView('detail');
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await dataStore.deleteTrip(tripId);
      setTrips(prev => prev.filter(t => t.id !== tripId));
    } catch (error) {
      console.error('Failed to delete trip:', error);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          trip.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDateStart = !dateFilter.start || trip.endDate >= dateFilter.start;
    const matchesDateEnd = !dateFilter.end || trip.startDate <= dateFilter.end;
    
    return matchesSearch && matchesDateStart && matchesDateEnd;
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          {view !== 'board' && (
            <button className="back-btn" onClick={handleBackToBoard}>
              <span className="back-icon">←</span>
              返回看板
            </button>
          )}
          <h1 className="app-title">
            <span className="title-icon">✈️</span>
            旅行规划看板
          </h1>
        </div>
        
        {view === 'board' && (
          <div className="header-search">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="搜索目的地..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="date-filter">
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="date-input"
                placeholder="开始日期"
              />
              <span className="date-separator">至</span>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="date-input"
                placeholder="结束日期"
              />
            </div>
          </div>
        )}

        {view !== 'board' && selectedTrip && (
          <div className="header-actions">
            <button
              className={`tab-btn ${view === 'detail' ? 'active' : ''}`}
              onClick={handleViewDetail}
            >
              📋 行程
            </button>
            <button
              className={`tab-btn ${view === 'map' ? 'active' : ''}`}
              onClick={handleViewMap}
            >
              🗺️ 地图
            </button>
            <button className="export-btn" onClick={() => alert('PDF导出功能开发中...')}>
              📄 导出PDF
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {view === 'board' && (
          <TripBoard
            trips={filteredTrips}
            loading={loading}
            searchQuery={searchQuery}
            onSelectTrip={handleSelectTrip}
            onCreateTrip={handleCreateTrip}
            onDeleteTrip={handleDeleteTrip}
          />
        )}

        {view === 'detail' && selectedTrip && (
          <DayPlanView
            trip={selectedTrip}
            onUpdate={handleTripUpdate}
          />
        )}

        {view === 'map' && selectedTrip && (
          <MapView
            trip={selectedTrip}
            onUpdate={handleTripUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default App;
