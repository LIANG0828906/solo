import React from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { drawShape } from '../utils/canvasRenderer';

const ExportButton: React.FC = () => {
  const { shapes, isExporting, setIsExporting } = useCanvasStore();

  const handleExport = () => {
    setIsExporting(true);

    setTimeout(() => {
      exportCanvas();
      setTimeout(() => {
        setIsExporting(false);
      }, 500);
    }, 1500);
  };

  const exportCanvas = () => {
    const allShapes = shapes;
    
    if (allShapes.length === 0) {
      downloadEmptyImage();
      return;
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const shape of allShapes) {
      const bounds = getShapeBounds(shape);
      minX = Math.min(minX, bounds.minX);
      minY = Math.min(minY, bounds.minY);
      maxX = Math.max(maxX, bounds.maxX);
      maxY = Math.max(maxY, bounds.maxY);
    }

    const padding = 50;
    const width = Math.ceil(maxX - minX + padding * 2);
    const height = Math.ceil(maxY - minY + padding * 2);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(padding - minX, padding - minY);

    for (const shape of allShapes) {
      if (shape.type === 'eraser') continue;
      drawShape(ctx, shape);
    }

    ctx.restore();

    const link = document.createElement('a');
    link.download = `drawripple-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadEmptyImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 600);
    
    const link = document.createElement('a');
    link.download = `drawripple-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const getShapeBounds = (shape: any): { minX: number; minY: number; maxX: number; maxY: number } => {
    switch (shape.type) {
      case 'brush':
      case 'eraser':
        const xs = shape.points.map((p: any) => p.x);
        const ys = shape.points.map((p: any) => p.y);
        return {
          minX: Math.min(...xs) - shape.lineWidth,
          minY: Math.min(...ys) - shape.lineWidth,
          maxX: Math.max(...xs) + shape.lineWidth,
          maxY: Math.max(...ys) + shape.lineWidth,
        };
      case 'rectangle':
        return {
          minX: shape.x,
          minY: shape.y,
          maxX: shape.x + shape.width,
          maxY: shape.y + shape.height,
        };
      case 'circle':
        return {
          minX: shape.x - shape.radius,
          minY: shape.y - shape.radius,
          maxX: shape.x + shape.radius,
          maxY: shape.y + shape.radius,
        };
      case 'line':
        return {
          minX: Math.min(shape.x1, shape.x2) - shape.lineWidth,
          minY: Math.min(shape.y1, shape.y2) - shape.lineWidth,
          maxX: Math.max(shape.x1, shape.x2) + shape.lineWidth,
          maxY: Math.max(shape.y1, shape.y2) + shape.lineWidth,
        };
      case 'note':
        return {
          minX: shape.x,
          minY: shape.y,
          maxX: shape.x + shape.width,
          maxY: shape.y + shape.height,
        };
      default:
        return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting}
        style={{
          position: 'absolute',
          top: 80,
          right: 300,
          zIndex: 50,
          padding: '10px 20px',
          backgroundColor: '#1976D2',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          cursor: isExporting ? 'not-allowed' : 'pointer',
          opacity: isExporting ? 0.7 : 1,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
        }}
        onMouseEnter={(e) => {
          if (!isExporting) {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(25, 118, 210, 0.3)';
        }}
        onMouseDown={(e) => {
          if (!isExporting) {
            e.currentTarget.style.transform = 'scale(0.95)';
          }
        }}
        onMouseUp={(e) => {
          if (!isExporting) {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
      >
        {isExporting ? '导出中...' : '导出 PNG'}
      </button>

      {isExporting && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: '32px 48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                border: '4px solid #E0E0E0',
                borderTopColor: '#1976D2',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ fontSize: 14, color: '#666' }}>正在导出图片...</p>
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default ExportButton;
