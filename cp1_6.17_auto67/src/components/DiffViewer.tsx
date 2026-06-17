import React, { useState, useCallback } from 'react';
import { useStore } from '@/stores/useStore';
import type { DiffRegion } from '@/types';

export const DiffViewer: React.FC = () => {
  const { diffResult, snapshotADataURL, snapshotBDataURL, zoomLevel, setZoomLevel } = useStore();
  const [hoveredRegion, setHoveredRegion] = useState<DiffRegion | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<'overlay' | 'side-by-side'>('overlay');

  const handleRegionHover = useCallback(
    (region: DiffRegion | null, e?: React.MouseEvent) => {
      setHoveredRegion(region);
      if (region && e) {
        setTooltipPos({ x: e.clientX, y: e.clientY });
      }
    },
    []
  );

  if (!diffResult && !snapshotADataURL && !snapshotBDataURL) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '15px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D9D9D9" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <div>Save two versions and click Compare</div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#BFBFBF' }}>
            Visual diff results will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '8px 16px',
        borderBottom: '1px solid #E8E8E8',
        backgroundColor: '#FFFFFF',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>Zoom</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.5"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            style={{
              width: '100px',
              accentColor: '#1890FF',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '12px', color: '#333', fontWeight: 500, minWidth: '28px' }}>
            {zoomLevel}x
          </span>
        </div>

        <div style={{ width: '1px', height: '16px', backgroundColor: '#E8E8E8' }} />

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setViewMode('overlay')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              border: viewMode === 'overlay' ? '1px solid #1890FF' : '1px solid #D9D9D9',
              borderRadius: '4px',
              backgroundColor: viewMode === 'overlay' ? '#E6F7FF' : '#FFFFFF',
              color: viewMode === 'overlay' ? '#1890FF' : '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
            }}
          >
            Overlay
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              border: viewMode === 'side-by-side' ? '1px solid #1890FF' : '1px solid #D9D9D9',
              borderRadius: '4px',
              backgroundColor: viewMode === 'side-by-side' ? '#E6F7FF' : '#FFFFFF',
              color: viewMode === 'side-by-side' ? '#1890FF' : '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
            }}
          >
            Side by Side
          </button>
        </div>

        {diffResult && (
          <div style={{
            marginLeft: 'auto',
            fontSize: '12px',
            color: diffResult.diffPercent > 5 ? '#FF4D4F' : diffResult.diffPercent > 0 ? '#FA8C16' : '#52C41A',
            fontWeight: 600,
          }}>
            Diff: {diffResult.diffPercent}% ({diffResult.totalDiffPixels.toLocaleString()} / {diffResult.totalPixels.toLocaleString()} px)
          </div>
        )}
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        backgroundColor: '#FAFAFA',
      }}>
        {viewMode === 'overlay' ? (
          <OverlayView
            diffResult={diffResult}
            snapshotADataURL={snapshotADataURL}
            snapshotBDataURL={snapshotBDataURL}
            zoomLevel={zoomLevel}
            onRegionHover={handleRegionHover}
          />
        ) : (
          <SideBySideView
            snapshotADataURL={snapshotADataURL}
            snapshotBDataURL={snapshotBDataURL}
            diffResult={diffResult}
            zoomLevel={zoomLevel}
          />
        )}
      </div>

      {hoveredRegion && (
        <div style={{
          position: 'fixed',
          left: tooltipPos.x + 12,
          top: tooltipPos.y + 12,
          backgroundColor: '#1A1A2E',
          color: '#FFFFFF',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          lineHeight: '1.5',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <div>Position: ({hoveredRegion.x}, {hoveredRegion.y})</div>
          <div>Size: {hoveredRegion.width}×{hoveredRegion.height}px</div>
          <div>Avg Color Diff: {hoveredRegion.avgColorDiff}</div>
        </div>
      )}
    </div>
  );
};

const OverlayView: React.FC<{
  diffResult: typeof useStore extends { getState: () => infer S } ? S extends { diffResult: infer D } ? D : never : never;
  snapshotADataURL: string | null;
  snapshotBDataURL: string | null;
  zoomLevel: number;
  onRegionHover: (region: DiffRegion | null, e?: React.MouseEvent) => void;
}> = ({ diffResult, snapshotADataURL, snapshotBDataURL, zoomLevel, onRegionHover }) => {
  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      transform: `scale(${zoomLevel})`,
      transformOrigin: 'top left',
    }}>
      {snapshotADataURL && (
        <img
          src={snapshotADataURL}
          alt="Version A"
          style={{
            display: 'block',
            border: '1px solid #D9D9D9',
            borderRadius: '4px',
          }}
        />
      )}
      {diffResult?.diffImageDataURL && (
        <img
          src={diffResult.diffImageDataURL}
          alt="Diff overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            border: '1px solid #D9D9D9',
            borderRadius: '4px',
          }}
        />
      )}
      {diffResult?.diffRegions.map((region, i) => (
        <div
          key={i}
          onMouseEnter={(e) => onRegionHover(region, e)}
          onMouseMove={(e) => onRegionHover(region, e)}
          onMouseLeave={() => onRegionHover(null)}
          style={{
            position: 'absolute',
            left: region.x,
            top: region.y,
            width: region.width,
            height: region.height,
            backgroundColor: 'rgba(255, 0, 0, 0.15)',
            border: '1px solid #FF0000',
            cursor: 'crosshair',
          }}
        />
      ))}
    </div>
  );
};

const SideBySideView: React.FC<{
  snapshotADataURL: string | null;
  snapshotBDataURL: string | null;
  diffResult: { diffPercent: number; totalDiffPixels: number; totalPixels: number } | null;
  zoomLevel: number;
}> = ({ snapshotADataURL, snapshotBDataURL, diffResult, zoomLevel }) => {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#1890FF',
          marginBottom: '8px',
        }}>
          Version A
        </div>
        {snapshotADataURL ? (
          <img
            src={snapshotADataURL}
            alt="Version A"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              border: '1px solid #D9D9D9',
              borderRadius: '4px',
            }}
          />
        ) : (
          <div style={{
            width: '200px',
            height: '120px',
            backgroundColor: '#F5F5F5',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#BFBFBF',
            fontSize: '12px',
          }}>
            No snapshot
          </div>
        )}
      </div>
      <div>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#FA8C16',
          marginBottom: '8px',
        }}>
          Version B
        </div>
        {snapshotBDataURL ? (
          <img
            src={snapshotBDataURL}
            alt="Version B"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              border: '1px solid #D9D9D9',
              borderRadius: '4px',
            }}
          />
        ) : (
          <div style={{
            width: '200px',
            height: '120px',
            backgroundColor: '#F5F5F5',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#BFBFBF',
            fontSize: '12px',
          }}>
            No snapshot
          </div>
        )}
      </div>
    </div>
  );
};
