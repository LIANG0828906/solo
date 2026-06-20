import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCollage } from '../context/CollageContext';
import { Layer, FILTER_PRESETS } from '../../shared/types';
import { wsManager } from '../utils/websocket';

interface TransformState {
  isDragging: boolean;
  isRotating: boolean;
  isCropping: boolean;
  startX: number;
  startY: number;
  layerStartX: number;
  layerStartY: number;
  startRotation: number;
  layerStartRotation: number;
  cropLayerId: string | null;
}

const CollageCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    layers,
    users,
    selectedLayerId,
    setSelectedLayerId,
    updateLayer,
    addLayer,
    deleteLayer,
  } = useCollage();
  const [transform, setTransform] = useState<TransformState>({
    isDragging: false,
    isRotating: false,
    isCropping: false,
    startX: 0,
    startY: 0,
    layerStartX: 0,
    layerStartY: 0,
    startRotation: 0,
    layerStartRotation: 0,
    cropLayerId: null,
  });
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const lastCursorSendRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const now = Date.now();
      if (now - lastCursorSendRef.current > 60) {
        wsManager.sendCursorPosition(x, y);
        lastCursorSendRef.current = now;
      }

      if (transform.isDragging && selectedLayerId) {
        const dx = e.clientX - transform.startX;
        const dy = e.clientY - transform.startY;
        updateLayer(selectedLayerId, {
          x: transform.layerStartX + dx,
          y: transform.layerStartY + dy,
        });
      }

      if (transform.isRotating && selectedLayerId && canvasRef.current) {
        const layer = layers.find((l) => l.id === selectedLayerId);
        if (layer) {
          const centerX = layer.x + (layer.width * layer.scale) / 2;
          const centerY = layer.y + (layer.height * layer.scale) / 2;
          const currentAngle =
            Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX) *
            (180 / Math.PI);
          const angleDelta = currentAngle - transform.startRotation;
          const newRotation = transform.layerStartRotation + angleDelta;
          const snappedRotation = Math.round(newRotation / 5) * 5;
          setRotationAngle(snappedRotation);
          updateLayer(selectedLayerId, {
            rotation: snappedRotation,
          });
        }
      }
    },
    [
      transform,
      selectedLayerId,
      updateLayer,
      layers,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      isDragging: false,
      isRotating: false,
    }));
    setRotationAngle(0);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleLayerMouseDown = (e: React.MouseEvent, layer: Layer) => {
    if (e.button === 2) {
      e.preventDefault();
      setSelectedLayerId(layer.id);
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = layer.x + (layer.width * layer.scale) / 2;
      const centerY = layer.y + (layer.height * layer.scale) / 2;
      const startAngle =
        Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX) *
        (180 / Math.PI);
      setTransform({
        isDragging: false,
        isRotating: true,
        isCropping: false,
        startX: e.clientX,
        startY: e.clientY,
        layerStartX: layer.x,
        layerStartY: layer.y,
        startRotation: startAngle,
        layerStartRotation: layer.rotation,
        cropLayerId: null,
      });
      return;
    }

    if (e.button === 0) {
      setSelectedLayerId(layer.id);
      setTransform({
        isDragging: true,
        isRotating: false,
        isCropping: false,
        startX: e.clientX,
        startY: e.clientY,
        layerStartX: layer.x,
        layerStartY: layer.y,
        startRotation: layer.rotation,
        cropLayerId: null,
      });
    }
  };

  const handleWheel = (e: React.WheelEvent, layer: Layer) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, layer.scale * delta));
    updateLayer(layer.id, { scale: newScale });
  };

  const handleDoubleClick = (layer: Layer) => {
    setTransform((prev) => ({
      ...prev,
      isCropping: true,
      cropLayerId: layer.id,
    }));
    setSelectedLayerId(layer.id);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedLayerId(null);
      setTransform((prev) => ({
        ...prev,
        isCropping: false,
        cropLayerId: null,
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 300;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          addLayer(event.target?.result as string, width, height);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const maxSize = 300;
              let width = img.width;
              let height = img.height;
              if (width > height && width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              } else if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
              addLayer(event.target?.result as string, width, height);
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getFilterStyle = (layer: Layer): string => {
    if (layer.filter === 'none') return 'none';
    const intensity = layer.filterIntensity / 100;
    const baseFilter = FILTER_PRESETS[layer.filter].css;
    
    if (layer.filter === 'blur') {
      return `blur(${3 * intensity}px)`;
    }
    if (layer.filter === 'pixelate') {
      return `contrast(${1 + 0.2 * intensity})`;
    }
    
    return baseFilter;
  };

  const renderCropGrid = (layer: Layer) => {
    if (!transform.isCropping || transform.cropLayerId !== layer.id) return null;
    
    const lines = [];
    for (let i = 1; i < 3; i++) {
      lines.push(
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            left: `${(i / 3) * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: 'rgba(255,255,255,0.7)',
            pointerEvents: 'none',
          }}
        />
      );
      lines.push(
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            top: `${(i / 3) * 100}%`,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.7)',
            pointerEvents: 'none',
          }}
        />
      );
    }
    return <>{lines}</>;
  };

  const otherUsers = users.filter(
    (u) => u.id !== 'current' 
  );

  return (
    <div
      ref={canvasRef}
      className="collage-canvas"
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        flex: 1,
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
        backgroundImage:
          'radial-gradient(circle, #2a2a4e 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        multiple
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {layers.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#6b7280',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
          <div style={{ fontSize: 16 }}>拖拽图片到此处或点击上传素材</div>
          <div style={{ fontSize: 13, marginTop: 8, opacity: 0.7 }}>
            支持 PNG / JPG / SVG 格式
          </div>
        </div>
      )}

      {layers.map((layer) => {
        if (!layer.visible) return null;
        const isSelected = selectedLayerId === layer.id;
        const isRotating = transform.isRotating && isSelected;

        return (
          <div
            key={layer.id}
            className="collage-layer"
            onMouseDown={(e) => handleLayerMouseDown(e, layer)}
            onWheel={(e) => handleWheel(e, layer)}
            onDoubleClick={() => handleDoubleClick(layer)}
            style={{
              position: 'absolute',
              left: layer.x,
              top: layer.y,
              width: layer.width * layer.scale,
              height: layer.height * layer.scale,
              transform: `rotate(${layer.rotation}deg)`,
              transformOrigin: 'center center',
              cursor: transform.isDragging && isSelected ? 'grabbing' : 'grab',
              zIndex: layer.zIndex + 1,
              animation: 'fadeInScale 0.4s ease-out',
              border: isSelected ? '2px solid #4ecdc4' : 'none',
              borderRadius: 2,
              boxShadow: isSelected
                ? '0 0 20px rgba(78, 205, 196, 0.4)'
                : '0 2px 8px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <img
              src={layer.src}
              alt=""
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: getFilterStyle(layer),
                transition: 'filter 0.3s ease-in-out',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />

            {renderCropGrid(layer)}

            {layer.filter !== 'none' && (
              <div
                style={{
                  position: 'absolute',
                  left: 6,
                  bottom: 6,
                  backgroundColor: 'rgba(200,200,200,0.85)',
                  color: '#333',
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 4,
                  pointerEvents: 'none',
                }}
              >
                {FILTER_PRESETS[layer.filter].name}
              </div>
            )}

            {isRotating && (
              <div
                style={{
                  position: 'absolute',
                  top: -30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {Math.round(layer.rotation)}°
              </div>
            )}
          </div>
        );
      })}

      {otherUsers.map((user) => (
        <div
          key={user.id}
          style={{
            position: 'absolute',
            left: user.cursorX,
            top: user.cursorY,
            pointerEvents: 'none',
            zIndex: 9999,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: user.color,
              opacity: 0.7,
              border: '2px solid rgba(255,255,255,0.8)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: -4,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              padding: '2px 6px',
              borderRadius: 3,
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}
          >
            {user.name}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default CollageCanvas;
