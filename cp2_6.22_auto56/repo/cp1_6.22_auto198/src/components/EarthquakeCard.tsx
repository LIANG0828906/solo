import type { EarthquakeEvent } from '@/types';
import { formatTime, magnitudeToColorCss } from '@/utils/colorUtils';
import { MapPin, Clock, Activity } from 'lucide-react';

interface EarthquakeCardProps {
  earthquake: EarthquakeEvent | null;
  onClose: () => void;
}

export default function EarthquakeCard({ earthquake, onClose }: EarthquakeCardProps) {
  if (!earthquake) return null;
  const borderColor = magnitudeToColorCss(earthquake.magnitude);

  return (
    <div
      id="quake-card"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: 'translate(-9999px, -9999px)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          position: 'relative',
          transform: 'translate(-50%, -100%) translateY(-20px)',
          minWidth: 220,
          padding: 14,
          borderRadius: 12,
          background: 'rgba(26,26,46,0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1.5px solid ${borderColor}`,
          boxShadow: `0 0 20px ${borderColor}66, 0 8px 24px rgba(0,0,0,0.5)`,
          color: '#E0E0E0',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: 6,
            width: 22,
            height: 22,
            color: '#E0E0E0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          ×
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: borderColor,
              lineHeight: 1,
            }}
          >
            M{earthquake.magnitude.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(224,224,224,0.55)' }}>
            深度 {earthquake.depth} km
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color={borderColor} />
            <span style={{ fontWeight: 500 }}>{earthquake.nearestCity}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={13} color={borderColor} />
            <span style={{ color: 'rgba(224,224,224,0.75)' }}>{formatTime(earthquake.time)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={13} color={borderColor} />
            <span style={{ color: 'rgba(224,224,224,0.75)' }}>
              {earthquake.latitude.toFixed(2)}°, {earthquake.longitude.toFixed(2)}°
            </span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: -7,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 12,
            height: 12,
            background: 'rgba(26,26,46,0.7)',
            borderRight: `1.5px solid ${borderColor}`,
            borderBottom: `1.5px solid ${borderColor}`,
            backdropFilter: 'blur(16px)',
          }}
        />
      </div>
    </div>
  );
}
