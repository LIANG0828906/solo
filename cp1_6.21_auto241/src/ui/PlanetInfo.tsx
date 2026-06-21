import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSolarStore } from '../store/useSolarStore';
import { fetchPlanetDetail } from '../api/planets';
import { COLORS } from '../utils/constants';
import type { PlanetDetail } from '../types/planet';

export default function PlanetInfo() {
  const selectedPlanetId = useSolarStore((state) => state.selectedPlanetId);
  const setSelectedPlanetId = useSolarStore((state) => state.setSelectedPlanetId);

  const [planet, setPlanet] = useState<PlanetDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedPlanetId) {
      setLoading(true);
      setError(null);
      setPlanet(null);
      setIsVisible(true);

      fetchPlanetDetail(selectedPlanetId)
        .then((data) => {
          setPlanet(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || '加载失败');
          setLoading(false);
        });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setPlanet(null);
        setError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedPlanetId]);

  const handleClose = () => {
    setSelectedPlanetId(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!selectedPlanetId && !isVisible && !planet) {
    return null;
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.infoBg,
          borderRadius: '16px',
          padding: '24px',
          minWidth: '360px',
          maxWidth: '440px',
          maxHeight: '80vh',
          overflowY: 'auto',
          color: COLORS.textPrimary,
          position: 'relative',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.3s ease-in-out',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: COLORS.textPrimary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease-in-out',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          aria-label="关闭"
        >
          <X size={16} />
        </button>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(59, 130, 246, 0.3)',
              borderTopColor: COLORS.accent,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }} />
            <p style={{ marginTop: '16px', color: COLORS.textSecondary }}>加载中...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#F87171' }}>{error}</p>
          </div>
        )}

        {planet && !loading && (
          <>
            <div style={{ marginBottom: '20px', paddingRight: '32px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: planet.color,
                    boxShadow: `0 0 20px ${planet.color}40`,
                  }}
                />
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                  }}>
                    {planet.nameCn}
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: COLORS.textSecondary,
                  }}>
                    {planet.name}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
            }}>
              <InfoItem label="赤道半径" value={`${planet.equatorialRadius.toLocaleString()} km`} />
              <InfoItem label="平均轨道速度" value={`${planet.averageOrbitSpeed} km/s`} />
              <InfoItem label="自转周期" value={`${Math.abs(planet.rotationPeriod).toLocaleString()} 地球日`} />
              <InfoItem label="公转周期" value={`${planet.orbitalPeriod.toLocaleString()} 地球日`} />
              <InfoItem label="已知卫星" value={`${planet.knownMoons} 颗`} />
              <InfoItem label="质量（地球=1）" value={planet.mass.toFixed(3)} />
              <InfoItem label="密度" value={`${planet.density} g/cm³`} />
              <InfoItem label="表面重力" value={`${planet.surfaceGravity} m/s²`} />
              <InfoItem label="平均温度" value={`${planet.averageTemperature}°C`} />
              <InfoItem label="大气成分" value={planet.atmosphere} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: COLORS.textPrimary,
              }}>
                发现信息
              </h3>
              <p style={{
                fontSize: '13px',
                color: COLORS.textSecondary,
                margin: 0,
                lineHeight: 1.5,
              }}>
                {planet.discovery}
              </p>
            </div>

            <div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: COLORS.textPrimary,
              }}>
                简介
              </h3>
              <p style={{
                fontSize: '13px',
                color: COLORS.textSecondary,
                margin: 0,
                lineHeight: 1.6,
              }}>
                {planet.detailedDescription}
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div style={{
      padding: '10px 12px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
    }}>
      <p style={{
        fontSize: '11px',
        color: COLORS.textSecondary,
        margin: 0,
        marginBottom: '4px',
      }}>
        {label}
      </p>
      <p style={{
        fontSize: '13px',
        color: COLORS.textPrimary,
        margin: 0,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {value}
      </p>
    </div>
  );
}
