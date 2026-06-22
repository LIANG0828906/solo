import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Waypoint, Record } from './types';
import { MapView } from './map/MapView';
import { LogPanel } from './log/LogPanel';
import { ExportButton } from './export/ExportButton';
import './index.css';

const formatFullTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const generateRandomImageUrl = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FFD700',
  ];
  const color1 = colors[Math.floor(Math.random() * colors.length)];
  const color2 = colors[Math.floor(Math.random() * colors.length)];
  const width = 400;
  const height = 300;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📷 徒步照片', width / 2, height / 2);

  return canvas.toDataURL('image/png');
};

export const App: React.FC = () => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);
  const [highlightedWaypointId, setHighlightedWaypointId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newRecordDescription, setNewRecordDescription] = useState('');
  const [newRecordImage, setNewRecordImage] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleWaypointAdd = useCallback((waypoint: Waypoint) => {
    setWaypoints((prev) => [...prev, waypoint]);
  }, []);

  const handleWaypointMove = useCallback((id: string, x: number, y: number) => {
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, x, y } : wp))
    );
  }, []);

  const handleWaypointSelect = useCallback((id: string | null) => {
    setSelectedWaypointId(id);
    setNewRecordDescription('');
    setNewRecordImage(null);
  }, []);

  const handleRecordClick = useCallback((waypointId: string) => {
    setHighlightedWaypointId(waypointId);
    setTimeout(() => setHighlightedWaypointId(null), 2000);
  }, []);

  const handleAddRecord = () => {
    if (!selectedWaypointId) return;

    const waypoint = waypoints.find((wp) => wp.id === selectedWaypointId);
    if (!waypoint || waypoint.records.length >= 3) return;
    if (!newRecordDescription.trim()) return;

    const newRecord: Record = {
      id: uuidv4(),
      timestamp: Date.now(),
      description: newRecordDescription.trim(),
      imageUrl: newRecordImage || generateRandomImageUrl(),
    };

    setWaypoints((prev) =>
      prev.map((wp) =>
        wp.id === selectedWaypointId
          ? { ...wp, records: [...wp.records, newRecord] }
          : wp
      )
    );

    setNewRecordDescription('');
    setNewRecordImage(null);
  };

  const handleUploadPhoto = () => {
    setNewRecordImage(generateRandomImageUrl());
  };

  const handleCloseModal = () => {
    setSelectedWaypointId(null);
    setNewRecordDescription('');
    setNewRecordImage(null);
  };

  const selectedWaypoint = waypoints.find((wp) => wp.id === selectedWaypointId);
  const sortedWaypoints = [...waypoints].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="app-container">
      <nav className="navbar">
        <span>🧭 徒步旅行路线规划</span>
        {isMobile && (
          <button
            className="menu-btn"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          >
            ☰
          </button>
        )}
      </nav>

      <div className="main-content">
        <MapView
          waypoints={sortedWaypoints}
          selectedWaypointId={selectedWaypointId}
          highlightedWaypointId={highlightedWaypointId}
          onWaypointAdd={handleWaypointAdd}
          onWaypointMove={handleWaypointMove}
          onWaypointSelect={handleWaypointSelect}
        />

        {isMobile && (
          <div
            className={`mobile-drawer-overlay ${isMobileDrawerOpen ? 'open' : ''}`}
            onClick={() => setIsMobileDrawerOpen(false)}
          />
        )}

        <LogPanel
          waypoints={sortedWaypoints}
          highlightedWaypointId={highlightedWaypointId}
          isMobileOpen={isMobileDrawerOpen}
          onRecordClick={handleRecordClick}
        />
      </div>

      <ExportButton waypoints={sortedWaypoints} />

      {selectedWaypoint && (
        <div className="waypoint-modal-overlay" onClick={handleCloseModal}>
          <div className="waypoint-modal" onClick={(e) => e.stopPropagation()}>
            <div className="waypoint-modal-header">
              <h2 className="waypoint-modal-title">
                途经点记录 · 海拔 {selectedWaypoint.elevation}m
              </h2>
              <button className="waypoint-modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            {selectedWaypoint.records.length < 3 && (
              <div className="record-form">
                <div className="record-form-time">
                  {formatFullTime(Date.now())}
                </div>
                <textarea
                  placeholder="输入路标描述，如'河滩边的古树'"
                  value={newRecordDescription}
                  onChange={(e) => setNewRecordDescription(e.target.value)}
                />
                {newRecordImage && (
                  <img
                    src={newRecordImage}
                    alt="Preview"
                    style={{ width: '100%', marginTop: '12px', borderRadius: '6px' }}
                  />
                )}
                <div className="record-form-actions">
                  <button className="btn btn-upload" onClick={handleUploadPhoto}>
                    📷 上传照片
                  </button>
                  <button className="btn btn-primary" onClick={handleAddRecord}>
                    保存记录
                  </button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#8B7355' }}>
                  还可添加 {3 - selectedWaypoint.records.length} 条记录
                </div>
              </div>
            )}

            {selectedWaypoint.records.length >= 3 && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(139, 115, 85, 0.1)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#8B7355' }}>
                该途经点已达到最大记录数（3条）
              </div>
            )}

            {selectedWaypoint.records.length > 0 && (
              <div className="existing-records">
                <div className="existing-records-title">
                  已有记录 ({selectedWaypoint.records.length})
                </div>
                {selectedWaypoint.records.map((record) => (
                  <div key={record.id} className="existing-record-item">
                    <div className="existing-record-time">
                      {formatFullTime(record.timestamp)}
                    </div>
                    <p className="existing-record-desc">{record.description}</p>
                    <img src={record.imageUrl} alt="" className="existing-record-image" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
