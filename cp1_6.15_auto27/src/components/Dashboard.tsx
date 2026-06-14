import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StationCard } from './StationCard';
import { DetailPanel } from './DetailPanel';
import type { Station } from '../types';
import { getAllStations, refreshStationData } from '../utils/api';
import { useRefreshTimer } from '../hooks/useRefreshTimer';

interface DashboardProps {
  searchQuery: string;
}

export function Dashboard({ searchQuery }: DashboardProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAllStations()
      .then((data) => {
        setStations(data);
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
            setSelectedStation(updated);
          }
        }
      });
    }
  }, [stations, selectedStation]);

  const { progress } = useRefreshTimer(handleRefresh, !loading && stations.length > 0);

  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    const query = searchQuery.toLowerCase();
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.city.toLowerCase().includes(query)
    );
  }, [stations, searchQuery]);

  const handleCardClick = (station: Station) => {
    setSelectedStation(station);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
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

  const hasResults = filteredStations.length > 0;

  return (
    <div className="dashboard">
      <div className="station-grid">
        {hasResults ? (
          filteredStations.map((station, index) => (
            <StationCard
              key={station.id}
              station={station}
              index={index}
              progress={progress}
              isFiltered={false}
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

      <DetailPanel
        station={selectedStation}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
