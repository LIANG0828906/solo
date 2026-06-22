import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Wine, FlavorProfile } from './types';
import WineList from './wineList';
import WineDetail from './wineDetail';
import './styles.css';

export default function App() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/wines')
      .then(res => {
        setWines(res.data);
        if (res.data.length > 0 && !selectedId) {
          setSelectedId(res.data[0].id);
        }
      })
      .catch(err => console.error('Failed to load wines:', err))
      .finally(() => setLoading(false));
  }, []);

  const selectedWine = wines.find(w => w.id === selectedId) || null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSidebarOpen(false);
  }, []);

  const handleFlavorChange = useCallback((id: string, flavors: FlavorProfile) => {
    setWines(prev => prev.map(w =>
      w.id === id ? { ...w, flavors } : w
    ));
  }, []);

  const handleSimilarSelect = useCallback((id: string) => {
    setSelectedId(id);
    const el = document.querySelector('.detail-area');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#F5F0EB', color: '#8B5E3C',
        fontFamily: '"Noto Serif SC", serif', fontSize: 18
      }}>
        加载中...
      </div>
    );
  }

  return (
    <>
      <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span />
      </button>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="app-layout">
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h1>🍷 品鉴笔记</h1>
            <p>风味图谱 · 酒款管理</p>
          </div>
          <div className="wine-list">
            {wines.map(wine => (
              <div
                key={wine.id}
                className={`wine-item ${wine.id === selectedId ? 'active' : ''}`}
                onClick={() => handleSelect(wine.id)}
              >
                <div className="wine-item-name">{wine.name}</div>
                <div className="wine-item-meta">{wine.year} · {wine.region}</div>
              </div>
            ))}
          </div>
        </div>
        {selectedWine ? (
          <WineDetail
            wine={selectedWine}
            onFlavorChange={handleFlavorChange}
            onSimilarSelect={handleSimilarSelect}
          />
        ) : (
          <div className="detail-area">
            <div className="detail-placeholder">
              <p>选择一款酒开始品鉴</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
