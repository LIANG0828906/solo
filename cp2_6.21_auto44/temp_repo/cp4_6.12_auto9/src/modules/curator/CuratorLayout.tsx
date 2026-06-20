import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Artwork, PlacementWithArtwork } from '../../types';
import { useGalleryStore } from '../../store';
import { v4 as uuidv4 } from 'uuid';

const GRID_SIZE = 1.5;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const ROOM_HALF_WIDTH = 5;
const MIN_ROTATION = -5;
const MAX_ROTATION = 5;

const wallNames = ['正墙', '右墙', '后墙', '左墙'];

const CuratorLayout: React.FC = () => {
  const [approvedArtworks, setApprovedArtworks] = useState<Artwork[]>([]);
  const [placements, setPlacements] = useState<PlacementWithArtwork[]>([]);
  const [currentWall, setCurrentWall] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedPlacement = placements.find(p => p.id === selectedPlacementId);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPlacement) {
      setRotation(selectedPlacement.rotation || 0);
    }
  }, [selectedPlacement]);

  const fetchData = async () => {
    try {
      const [artworksRes, placementsRes] = await Promise.all([
        axios.get('/api/artworks?status=approved'),
        axios.get('/api/placements')
      ]);
      setApprovedArtworks(artworksRes.data);
      setPlacements(placementsRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const snapToGrid = (value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const worldToCanvas = (x: number, y: number) => {
    const scaleX = CANVAS_WIDTH / (ROOM_HALF_WIDTH * 2);
    const scaleY = CANVAS_HEIGHT / 4;
    return {
      x: (x + ROOM_HALF_WIDTH) * scaleX,
      y: CANVAS_HEIGHT - (y * scaleY) - 40
    };
  };

  const canvasToWorld = (x: number, y: number) => {
    const scaleX = CANVAS_WIDTH / (ROOM_HALF_WIDTH * 2);
    const scaleY = CANVAS_HEIGHT / 4;
    return {
      x: (x / scaleX) - ROOM_HALF_WIDTH,
      y: (CANVAS_HEIGHT - y - 40) / scaleY
    };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    setSelectedPlacementId(null);
  };

  const handleArtworkDragStart = (e: React.DragEvent, artwork: Artwork) => {
    e.dataTransfer.setData('artworkId', artwork.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = canvasToWorld(x, y);
    const snappedX = snapToGrid(worldPos.x);
    const snappedY = Math.max(0.5, Math.min(3.5, snapToGrid(worldPos.y)));
    setTooltip({ x, y: y - 30, text: `X: ${snappedX.toFixed(1)}, Y: ${snappedY.toFixed(1)}` });
  };

  const handleCanvasDragLeave = () => {
    setTooltip(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setTooltip(null);

    const artworkId = e.dataTransfer.getData('artworkId');
    if (!artworkId || !canvasRef.current) return;

    const artwork = approvedArtworks.find(a => a.id === artworkId);
    if (!artwork) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = canvasToWorld(x, y);

    const newPlacement: PlacementWithArtwork = {
      id: uuidv4(),
      artworkId: artwork.id,
      wallIndex: currentWall,
      posX: snapToGrid(worldPos.x),
      posY: Math.max(0.5, Math.min(3.5, snapToGrid(worldPos.y))),
      rotation: 0,
      title: artwork.title,
      artistName: artwork.artistName,
      year: artwork.year,
      price: artwork.price,
      width: artwork.width,
      height: artwork.height,
      imageUrl: artwork.imageUrl,
      hueShift: artwork.hueShift,
    };

    setPlacements([...placements, newPlacement]);
  };

  const handlePlacementMouseDown = (e: React.MouseEvent, placement: PlacementWithArtwork) => {
    e.stopPropagation();
    setDraggingId(placement.id);
    setSelectedPlacementId(placement.id);

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasPos = worldToCanvas(placement.posX, placement.posY);
    setDragOffset({
      x: e.clientX - rect.left - canvasPos.x,
      y: e.clientY - rect.top - canvasPos.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    const worldPos = canvasToWorld(x, y);
    const snappedX = snapToGrid(worldPos.x);
    const snappedY = Math.max(0.5, Math.min(3.5, snapToGrid(worldPos.y)));

    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 30, text: `X: ${snappedX.toFixed(1)}, Y: ${snappedY.toFixed(1)}` });

    setPlacements(prev => prev.map(p =>
      p.id === draggingId
        ? { ...p, posX: snappedX, posY: snappedY }
        : p
    ));
  }, [draggingId, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
    setTooltip(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setRotation(value);
    if (selectedPlacementId) {
      setPlacements(prev => prev.map(p =>
        p.id === selectedPlacementId ? { ...p, rotation: value } : p
      ));
    }
  };

  const handleDeletePlacement = () => {
    if (selectedPlacementId) {
      setPlacements(prev => prev.filter(p => p.id !== selectedPlacementId));
      setSelectedPlacementId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/placements/save', { placements });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('确定要重置当前墙的布局吗？')) {
      setPlacements(prev => prev.filter(p => p.wallIndex !== currentWall));
      setSelectedPlacementId(null);
    }
  };

  const currentWallPlacements = placements.filter(p => p.wallIndex === currentWall);
  const availableArtworks = approvedArtworks.filter(
    a => !placements.some(p => p.artworkId === a.id)
  );

  return (
    <div className="page-container" style={{ height: '100%', overflow: 'hidden' }}>
      {showSaved && (
        <div className="success-toast">
          <span className="success-icon">✓</span>
          <span>布局已保存</span>
        </div>
      )}

      <h1 className="page-title" style={{ marginBottom: '16px' }}>策展人布展</h1>

      <div className="curator-layout">
        <div className="curator-sidebar">
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
            可布置画作
          </h3>

          {availableArtworks.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '20px' }}>
              暂无可用画作
            </div>
          ) : (
            <div className="artwork-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {availableArtworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="artwork-card"
                  draggable
                  onDragStart={(e) => handleArtworkDragStart(e, artwork)}
                  style={{ cursor: 'grab' }}
                >
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="artwork-card-image"
                    style={{ height: '80px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.background = '#E0E0D0';
                    }}
                  />
                  <div className="artwork-card-info">
                    <div className="artwork-card-title" style={{ fontSize: '12px' }}>
                      {artwork.title}
                    </div>
                    <div className="artwork-card-artist" style={{ fontSize: '11px' }}>
                      {artwork.artistName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedPlacement && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E0E0D0' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
                调整: {selectedPlacement.title}
              </h4>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>
                  倾斜角度: {rotation.toFixed(1)}°
                </label>
                <input
                  type="range"
                  min={MIN_ROTATION}
                  max={MAX_ROTATION}
                  step={0.5}
                  value={rotation}
                  onChange={handleRotationChange}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999' }}>
                  <span>-5°</span>
                  <span>0°</span>
                  <span>+5°</span>
                </div>
              </div>

              <button
                className="btn btn-danger"
                style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                onClick={handleDeletePlacement}
              >
                移除此画作
              </button>
            </div>
          )}
        </div>

        <div className="curator-canvas">
          <div style={{ padding: '16px', borderBottom: '1px solid #E0E0D0' }}>
            <div className="wall-tabs">
              {wallNames.map((name, index) => (
                <button
                  key={index}
                  className={`wall-tab ${currentWall === index ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentWall(index);
                    setSelectedPlacementId(null);
                  }}
                >
                  {name} ({placements.filter(p => p.wallIndex === index).length}/4)
                </button>
              ))}
            </div>

            <div className="curator-tools">
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存布局'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleReset}
              >
                重置当前墙
              </button>
              <span style={{ fontSize: '12px', color: '#999', alignSelf: 'center' }}>
                拖拽画作到墙面 | 移动时自动吸附网格（间距1.5单位）
              </span>
            </div>
          </div>

          <div
            ref={canvasRef}
            style={{
              position: 'relative',
              width: '100%',
              height: 'calc(100% - 100px)',
              background: 'linear-gradient(180deg, #FAFAF0 0%, #F5F5E8 100%)',
              overflow: 'hidden',
              cursor: draggingId ? 'grabbing' : 'default'
            }}
            onClick={handleCanvasClick}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
          >
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              {Array.from({ length: 9 }).map((_, i) => {
                const x = (i / 8) * 100;
                return (
                  <line
                    key={`v${i}`}
                    x1={`${x}%`}
                    y1="10%"
                    x2={`${x}%`}
                    y2="90%"
                    stroke="#E0E0D0"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                );
              })}
              {Array.from({ length: 5 }).map((_, i) => {
                const y = 10 + (i / 4) * 80;
                return (
                  <line
                    key={`h${i}`}
                    x1="0%"
                    y1={`${y}%`}
                    x2="100%"
                    y2={`${y}%`}
                    stroke="#E0E0D0"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                );
              })}

              <line x1="0%" y1="90%" x2="100%" y2="90%" stroke="#5D4037" strokeWidth="3" />
              <line x1="0%" y1="10%" x2="100%" y2="10%" stroke="#5D4037" strokeWidth="1" />
            </svg>

            {currentWallPlacements.map((placement) => {
              const canvasPos = worldToCanvas(placement.posX, placement.posY);
              const displayWidth = Math.min(placement.width / 2, 120);
              const displayHeight = Math.min(placement.height / 2, 100);
              const isSelected = selectedPlacementId === placement.id;

              return (
                <div
                  key={placement.id}
                  onMouseDown={(e) => handlePlacementMouseDown(e, placement)}
                  style={{
                    position: 'absolute',
                    left: canvasPos.x - displayWidth / 2,
                    top: canvasPos.y - displayHeight / 2,
                    width: displayWidth,
                    height: displayHeight,
                    cursor: draggingId === placement.id ? 'grabbing' : 'grab',
                    transform: `rotate(${placement.rotation}deg)`,
                    transition: draggingId === placement.id ? 'none' : 'transform 0.2s ease-out',
                    zIndex: isSelected ? 10 : 1,
                    boxSizing: 'border-box',
                    border: isSelected ? '3px solid #C9A96E' : '8px solid #5D4037',
                    boxShadow: isSelected
                      ? '0 8px 24px rgba(201, 169, 110, 0.4)'
                      : '0 4px 12px rgba(0, 0, 0, 0.2)',
                    borderRadius: '2px'
                  }}
                >
                  <img
                    src={placement.imageUrl}
                    alt={placement.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: `hue-rotate(${placement.hueShift}deg)`,
                      pointerEvents: 'none'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.background = '#E0E0D0';
                    }}
                  />
                </div>
              );
            })}

            {tooltip && (
              <div
                style={{
                  position: 'absolute',
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 100
                }}
              >
                {tooltip.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuratorLayout;
