import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StationCard } from './StationCard';
import type { Station } from '../types';
import { getAllStations, refreshStationData } from '../utils/api';
import { useRefreshTimer } from '../hooks/useRefreshTimer';

interface DashboardProps {
  searchQuery: string;
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  onUpdateSelectedStation: (station: Station | null) => void;
}

export function Dashboard({ searchQuery, selectedStation, onSelectStation, onUpdateSelectedStation }: DashboardProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredIds, setFilteredIds] = useState<Set<string>>(new Set());
  const filterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    getAllStations()
      .then((data) => {
        setStations(data);
        setFilteredIds(new Set(data.map((s) => s.id)));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleRefresh = useCallback(() => {
    if (stations.length > 0) {
      refreshStationData(stations).then((refreshed) => {
        setStations(refreshed);
        
        if (selectedStation) {
          const updated = refreshed.find((s) => s.id === selectedStation.id);
          if (updated) {
            onUpdateSelectedStation(updated);
          }
        }
      });
    }
  }, [stations, selectedStation, onUpdateSelectedStation]);

  const { progress } = useRefreshTimer(handleRefresh, !loading && stations.length > 0);

  useEffect(() => {
    if (loading) return;
    
    const query = searchQuery.toLowerCase().trim();
    
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    if (!query) {
      setFilteredIds(new Set(stations.map((s) => s.id)));
      return;
    }
    
    const matchingIds = stations
      .filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.city.toLowerCase().includes(query)
      )
      .map((s) => s.id);
    
    setFilteredIds(new Set(matchingIds));
    
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [searchQuery, stations, loading]);

  const handleCardClick = (station: Station) => {
    onSelectStation(station);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-skeleton">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  const visibleStations = stations.filter((s) => filteredIds.has(s.id));
  const hasResults = visibleStations.length > 0;
  const displayedStations = stations;

  return (
    <div className="dashboard">
      <div className="station-grid">
        {hasResults ? (
          displayedStations.map((station, index) => (
            <StationCard
              key={station.id}
              station={station}
              index={index}
              progress={progress}
              isFiltered={!filteredIds.has(station.id)}
              onClick={() => handleCardClick(station)}
            />
          ))
        ) : (
          <div className="empty-state">
            <svg
              className="empty-illustration"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="100" cy="90" r="60" fill="url(#grad)" fillOpacity="0.2" />
              <path
                d="M70 90 L85 75 L100 90 L115 75 L130 90"
                stroke="var(--primary-color)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="100" cy="90" r="8" fill="var(--primary-color)" />
              <path
                d="M60 140 Q100 120 140 140"
                stroke="var(--text-muted)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="60" cy="140" r="5" fill="var(--text-muted)" />
              <circle cx="140" cy="140" r="5" fill="var(--text-muted)" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0A4B4B" />
                  <stop offset="100%" stopColor="#1CB5B5" />
                </linearGradient>
              </defs>
            </svg>
            <p className="empty-text">未找到匹配的监测站</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>
              请尝试其他关键词
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
