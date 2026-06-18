import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useMarkersStore } from '../store/markersStore';
import type { Marker } from '../types';

export function ExportButton() {
  const { roomId, markers, playbackTime, playbackMarkers } = useMarkersStore();
  const [isExporting, setIsExporting] = useState(false);

  const generateThumbnail = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve('');
        return;
      }

      ctx.fillStyle = '#1A1A2E';
      ctx.fillRect(0, 0, 256, 256);

      const scale = 20;
      const offsetX = 128;
      const offsetY = 128;

      const prisms = [
        { x: 0, z: 0, w: 6, d: 4 },
        { x: 4, z: 0, w: 4, d: 6 },
        { x: 2, z: 2, w: 4, d: 4 },
      ];

      prisms.forEach((prism) => {
        const left = offsetX + (prism.x - 3 - prism.w / 2) * scale;
        const top = offsetY + (prism.z - 2 - prism.d / 2) * scale;
        const width = prism.w * scale;
        const height = prism.d * scale;

        ctx.fillStyle = 'rgba(74, 144, 217, 0.4)';
        ctx.fillRect(left, top, width, height);

        ctx.strokeStyle = '#4A90D9';
        ctx.lineWidth = 2;
        ctx.strokeRect(left, top, width, height);
      });

      const exportMarkers = playbackTime ? playbackMarkers : markers;
      exportMarkers.forEach((marker) => {
        const x = offsetX + marker.position.x * scale;
        const y = offsetY + marker.position.z * scale;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fill();
      });

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('俯视正投影视图', 128, 240);

      resolve(canvas.toDataURL('image/png'));
    });
  };

  const handleExport = async () => {
    if (!roomId) return;

    setIsExporting(true);

    try {
      const exportMarkers = playbackTime ? playbackMarkers : markers;
      const thumbnail = await generateThumbnail();

      const report = {
        roomId,
        exportTime: new Date().toISOString(),
        snapshotTime: playbackTime ? new Date(playbackTime).toISOString() : undefined,
        isPlayback: !!playbackTime,
        markers: exportMarkers.map((m: Marker) => ({
          id: m.id,
          position: m.position,
          text: m.text,
          author: m.author,
          createdAt: new Date(m.createdAt).toISOString(),
          updatedAt: new Date(m.updatedAt).toISOString(),
        })),
        thumbnail,
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const timeStr = playbackTime
        ? `_snapshot_${new Date(playbackTime).toTimeString().slice(0, 8).replace(/:/g, '')}`
        : '';
      a.download = `markers_room_${roomId}${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const isPlayback = !!playbackTime;

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || !roomId}
      title={isPlayback ? '导出历史快照报告' : '导出当前标记报告'}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        padding: '10px 20px',
        background: isPlayback
          ? 'linear-gradient(135deg, #9B59B6, #8E44AD)'
          : 'linear-gradient(135deg, #27AE60, #2ECC71)',
        border: 'none',
        borderRadius: '6px',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 500,
        cursor: isExporting || !roomId ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 50,
        boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)',
        transition: 'all 0.2s ease',
        opacity: isExporting || !roomId ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isExporting && roomId) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(39, 174, 96, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
      }}
    >
      {isExporting ? (
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <Download size={18} />
      )}
      {isPlayback ? '导出快照' : '导出报告'}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
