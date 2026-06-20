import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Room, Annotation } from '../types';
import AnnotationPanel from '../components/AnnotationPanel';
import VersionDiff from '../components/VersionDiff';

interface CanvasPageProps {
  initialRoom: Room;
  currentUser: User;
  onRoomUpdate: (room: Room) => void;
}

export default function CanvasPage({ initialRoom, currentUser, onRoomUpdate }: CanvasPageProps) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [diffVersion1Id, setDiffVersion1Id] = useState<string | null>(null);
  const [diffVersion2Id, setDiffVersion2Id] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [pendingAnnotationPoint, setPendingAnnotationPoint] = useState<{ x: number; y: number } | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'dragging' | 'uploading' | 'done'>('idle');
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const draggingAnnotationIdRef = useRef<string | null>(null);

  useEffect(() => {
    setCurrentVersionId(prev => {
      if (prev) return prev;
      if (initialRoom.versions.length > 0) return initialRoom.versions[initialRoom.versions.length - 1].id;
      return null;
    });
  }, [initialRoom.versions]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${room.id}`);
        if (res.ok) {
          const data = await res.json();
          setRoom(data);
          onRoomUpdate(data);
        }
      } catch {}
    }, 500);
    return () => clearInterval(interval);
  }, [room.id, onRoomUpdate]);

  useEffect(() => {
    if (room.versions.length > 0 && !currentVersionId) {
      setCurrentVersionId(room.versions[room.versions.length - 1].id);
    }
  }, [room.versions, currentVersionId]);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadState('uploading');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/rooms/${room.id}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room || data);
        onRoomUpdate(data.room || data);
        if (data.version) {
          setCurrentVersionId(data.version.id);
        } else if (data.versions && data.versions.length > 0) {
          setCurrentVersionId(data.versions[data.versions.length - 1].id);
        }
        setUploadedFilePreview(URL.createObjectURL(file));
        setUploadState('done');
        setTimeout(() => {
          setUploadState('idle');
          setUploadedFilePreview(null);
        }, 1500);
      } else {
        setUploadState('idle');
      }
    } catch {
      setUploadState('idle');
    }
  }, [room.id, onRoomUpdate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('idle');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('dragging');
  }, []);

  const handleDragLeave = useCallback(() => {
    setUploadState('idle');
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => {
      const newZoom = Math.min(5, Math.max(0.1, prev + delta));
      const scale = newZoom / prev;
      setPanOffset(po => ({
        x: mouseX - (mouseX - po.x) * scale,
        y: mouseY - (mouseY - po.y) * scale,
      }));
      return newZoom;
    });
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (isAddingAnnotation) return;
    if (draggingAnnotationIdRef.current) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  }, [panOffset.x, panOffset.y, isAddingAnnotation]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
    if (draggingAnnotationIdRef.current && dragOffsetRef.current) {
      const container = canvasContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const imgX = (e.clientX - rect.left - panOffset.x) / zoom;
      const imgY = (e.clientY - rect.top - panOffset.y) / zoom;
      setRoom(prev => ({
        ...prev,
        annotations: prev.annotations.map(a =>
          a.id === draggingAnnotationIdRef.current
            ? { ...a, bubbleX: imgX - dragOffsetRef.current!.x, bubbleY: imgY - dragOffsetRef.current!.y }
            : a
        ),
      }));
    }
  }, [isPanning, panStart, zoom]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingAnnotationIdRef.current) {
      const annId = draggingAnnotationIdRef.current;
      const ann = room.annotations.find(a => a.id === annId);
      if (ann) {
        fetch(`/api/rooms/${room.id}/annotations/${annId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bubbleX: ann.bubbleX, bubbleY: ann.bubbleY }),
        }).catch(() => {});
      }
      draggingAnnotationIdRef.current = null;
      dragOffsetRef.current = null;
    }
  }, [isPanning, room.annotations, room.id]);

  const handleDoubleClick = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isAddingAnnotation || !newAnnotationText.trim()) return;
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const imgX = (e.clientX - rect.left - panOffset.x) / zoom;
    const imgY = (e.clientY - rect.top - panOffset.y) / zoom;
    setPendingAnnotationPoint({ x: imgX, y: imgY });

    const annotation = {
      versionId: currentVersionId,
      x: imgX,
      y: imgY,
      bubbleX: imgX + 40,
      bubbleY: imgY - 30,
      text: newAnnotationText.trim(),
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      creatorColor: currentUser.color,
    };

    fetch(`/api/rooms/${room.id}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annotation),
    })
      .then(res => res.json())
      .then(data => {
        setRoom(prev => ({
          ...prev,
          annotations: [...prev.annotations, data],
        }));
        setNewAnnotationText('');
        setIsAddingAnnotation(false);
        setPendingAnnotationPoint(null);
      })
      .catch(() => {
        setIsAddingAnnotation(false);
        setPendingAnnotationPoint(null);
      });
  }, [isAddingAnnotation, newAnnotationText, panOffset, zoom, currentVersionId, currentUser, room.id]);

  const handleAddAnnotation = useCallback(() => {
    if (!newAnnotationText.trim()) return;
    setIsAddingAnnotation(true);
  }, [newAnnotationText]);

  const handleSelectAnnotation = useCallback((id: string) => {
    setSelectedAnnotationId(id);
    const ann = room.annotations.find(a => a.id === id);
    if (ann && !ann.readBy.includes(currentUser.id)) {
      fetch(`/api/rooms/${room.id}/annotations/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      }).then(() => {
        setRoom(prev => ({
          ...prev,
          annotations: prev.annotations.map(a =>
            a.id === id ? { ...a, readBy: [...a.readBy, currentUser.id] } : a
          ),
        }));
      }).catch(() => {});
    }
  }, [room.annotations, room.id, currentUser.id]);

  const handleDeleteAnnotation = useCallback(async (id: string) => {
    await fetch(`/api/rooms/${room.id}/annotations/${id}`, { method: 'DELETE' });
    setRoom(prev => ({
      ...prev,
      annotations: prev.annotations.filter(a => a.id !== id),
    }));
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  }, [room.id, selectedAnnotationId]);

  const handleMarkRead = useCallback((id: string) => {
    if (!room.annotations.find(a => a.id === id)?.readBy.includes(currentUser.id)) {
      fetch(`/api/rooms/${room.id}/annotations/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      }).then(() => {
        setRoom(prev => ({
          ...prev,
          annotations: prev.annotations.map(a =>
            a.id === id ? { ...a, readBy: [...a.readBy, currentUser.id] } : a
          ),
        }));
      }).catch(() => {});
    }
  }, [room.annotations, room.id, currentUser.id]);

  const handleBubbleMouseDown = useCallback((e: React.MouseEvent, annotation: Annotation) => {
    e.stopPropagation();
    e.preventDefault();
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const imgX = (e.clientX - rect.left - panOffset.x) / zoom;
    const imgY = (e.clientY - rect.top - panOffset.y) / zoom;
    dragOffsetRef.current = { x: imgX - annotation.bubbleX, y: imgY - annotation.bubbleY };
    draggingAnnotationIdRef.current = annotation.id;
  }, [panOffset, zoom]);

  const handleCompareVersions = useCallback(() => {
    if (room.versions.length < 2) return;
    if (!showDiff) {
      setDiffVersion1Id(room.versions[room.versions.length - 2].id);
      setDiffVersion2Id(room.versions[room.versions.length - 1].id);
      setShowDiff(true);
    } else {
      setShowDiff(false);
    }
  }, [showDiff, room.versions]);

  const handleExportReport = useCallback(async () => {
    const versionAnnotations = room.annotations.filter(a => a.versionId === currentVersionId);
    let diffImageUrl: string | undefined;
    if (showDiff && diffVersion1Id && diffVersion2Id) {
      const v1 = room.versions.find(v => v.id === diffVersion1Id);
      const v2 = room.versions.find(v => v.id === diffVersion2Id);
      if (v1 && v2) {
        diffImageUrl = `/api/diff?url1=${encodeURIComponent(v1.url)}&url2=${encodeURIComponent(v2.url)}`;
      }
    }
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: room.id,
        annotations: versionAnnotations,
        diffImageUrl,
      }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${room.name || 'report'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [room, currentVersionId, showDiff, diffVersion1Id, diffVersion2Id]);

  const handleDiffBack = useCallback(() => {
    setShowDiff(false);
  }, []);

  const filteredAnnotations = currentVersionId
    ? room.annotations.filter(a => a.versionId === currentVersionId)
    : [];

  const currentVersion = currentVersionId
    ? room.versions.find(v => v.id === currentVersionId)
    : null;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderUploadZone = () => (
    <div
      className={`upload-zone${uploadState === 'dragging' ? ' drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleFileUpload(file);
        };
        input.click();
      }}
    >
      {uploadState === 'uploading' ? (
        <>
          <div className="upload-zone-icon">⏳</div>
          <div className="upload-zone-text">Uploading...</div>
          <div className="upload-progress">
            <div className="upload-progress-bar" />
          </div>
        </>
      ) : uploadState === 'done' && uploadedFilePreview ? (
        <>
          <img src={uploadedFilePreview} className="upload-thumbnail" alt="preview" />
          <div className="upload-zone-text">Upload complete!</div>
          <div className="upload-progress">
            <div className="upload-progress-bar" style={{ width: '100%' }} />
          </div>
        </>
      ) : (
        <>
          <div className="upload-zone-icon">📁</div>
          <div className="upload-zone-text">Drop an image here or click to upload</div>
          <div className="upload-zone-hint">Supports PNG, JPG, SVG, WebP</div>
        </>
      )}
    </div>
  );

  const renderCanvas = () => {
    if (!currentVersion) return renderUploadZone();

    return (
      <div
        ref={canvasContainerRef}
        className={`canvas-container${isPanning ? ' panning' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onDoubleClick={handleDoubleClick}
        onClick={handleCanvasClick}
      >
        <div
          className="canvas-viewport"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          }}
        >
          <img
            src={currentVersion.url}
            alt={currentVersion.filename}
            className="canvas-image"
            draggable={false}
          />
          <div className="annotation-layer">
            <svg className="arrow-svg">
              {filteredAnnotations.map(ann => (
                <line
                  key={`arrow-${ann.id}`}
                  x1={ann.bubbleX}
                  y1={ann.bubbleY}
                  x2={ann.x}
                  y2={ann.y}
                  stroke={ann.creatorColor}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              ))}
            </svg>
            {filteredAnnotations.map(ann => (
              <div
                key={ann.id}
                className={`annotation-bubble${selectedAnnotationId === ann.id ? ' highlighted' : ''}`}
                style={{
                  left: `${ann.bubbleX}px`,
                  top: `${ann.bubbleY}px`,
                  borderColor: ann.creatorColor,
                }}
                onMouseDown={(e) => handleBubbleMouseDown(e, ann)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAnnotation(ann.id);
                }}
              >
                <div className="bubble-header">
                  <span className="bubble-creator-dot" style={{ background: ann.creatorColor }} />
                  <span className="bubble-creator-name">{ann.creatorName}</span>
                  <button
                    className="bubble-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAnnotation(ann.id);
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="bubble-text">{ann.text}</div>
                <div className="bubble-time">{formatTime(ann.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="canvas-toolbar">
          <button
            className="btn-icon"
            onClick={() => {
              const rect = canvasContainerRef.current?.getBoundingClientRect();
              const cx = rect ? rect.width / 2 : 0;
              const cy = rect ? rect.height / 2 : 0;
              setZoom(prev => {
                const newZoom = Math.min(5, prev + 0.1);
                const scale = newZoom / prev;
                setPanOffset(po => ({
                  x: cx - (cx - po.x) * scale,
                  y: cy - (cy - po.y) * scale,
                }));
                return newZoom;
              });
            }}
          >
            +
          </button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button
            className="btn-icon"
            onClick={() => {
              const rect = canvasContainerRef.current?.getBoundingClientRect();
              const cx = rect ? rect.width / 2 : 0;
              const cy = rect ? rect.height / 2 : 0;
              setZoom(prev => {
                const newZoom = Math.max(0.1, prev - 0.1);
                const scale = newZoom / prev;
                setPanOffset(po => ({
                  x: cx - (cx - po.x) * scale,
                  y: cy - (cy - po.y) * scale,
                }));
                return newZoom;
              });
            }}
          >
            −
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <span className="app-logo">IllustraSync</span>
        <div className="room-info">
          <span className="room-code">{room.id}</span>
        </div>
        <div className="collaborators-avatars">
          {room.collaborators.map(user => (
            <div
              key={user.id}
              className="collab-avatar"
              style={{ background: user.color }}
              title={user.name}
            >
              {user.initials}
            </div>
          ))}
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileUpload(file);
            };
            input.click();
          }}>
            Upload Version
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleCompareVersions}
            disabled={room.versions.length < 2}
          >
            {showDiff ? 'Exit Compare' : 'Compare Versions'}
          </button>
          <button className="btn btn-secondary" onClick={handleExportReport}>
            Export Report
          </button>
        </div>
      </header>

      <div className={`main-content${showDiff ? ' diff-mode' : ''}`}>
        <div className="canvas-area">
          {room.versions.length > 0 && (
            <div className="version-selector">
              {room.versions.map((v, idx) => (
                <button
                  key={v.id}
                  className={`version-tab${currentVersionId === v.id ? ' active' : ''}`}
                  onClick={() => setCurrentVersionId(v.id)}
                >
                  v{idx + 1}
                </button>
              ))}
            </div>
          )}

          {showDiff && diffVersion1Id && diffVersion2Id ? (
            <VersionDiff
              room={room}
              currentUser={currentUser}
              version1Id={diffVersion1Id}
              version2Id={diffVersion2Id}
              onBack={handleDiffBack}
            />
          ) : (
            renderCanvas()
          )}
        </div>

        <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <AnnotationPanel
            annotations={filteredAnnotations}
            currentUser={currentUser}
            selectedAnnotationId={selectedAnnotationId}
            onAddAnnotation={handleAddAnnotation}
            onSelectAnnotation={handleSelectAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            onMarkRead={handleMarkRead}
            newAnnotationText={newAnnotationText}
            onNewAnnotationTextChange={setNewAnnotationText}
            isAddingAnnotation={isAddingAnnotation}
          />
        </div>
      </div>

      <button
        className="mobile-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        💬
      </button>

      <div
        className={`mobile-drawer-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
}
