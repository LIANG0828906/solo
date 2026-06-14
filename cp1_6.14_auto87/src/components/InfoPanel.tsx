import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Star, Thermometer, Ruler, Sparkles, ChevronRight, Plus, Check } from 'lucide-react';
import { useStarStore } from '../store/useStarStore';
import { getNearbyBrightStars } from '../utils/stardata';
import { StarData } from '../types';

export default function InfoPanel() {
  const { 
    selectedStar, 
    setSelectedStar, 
    stars, 
    flyToStar, 
    isCreatingCluster, 
    clusterStarIds, 
    addStarToCluster, 
    removeStarFromCluster 
  } = useStarStore();
  
  const panelRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [starScreenPos, setStarScreenPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (selectedStar) {
      setIsVisible(false);
      const timer = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setIsVisible(false);
    }
  }, [selectedStar]);

  useEffect(() => {
    if (!selectedStar) return;

    const updatePosition = () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      
      const vector = new (window as any).THREE?.Vector3?.(selectedStar.x, selectedStar.y, selectedStar.z);
      if (vector) {
        const camera = (window as any).starCamera;
        if (camera) {
          vector.project(camera);
          const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
          const y = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;
          setStarScreenPos({ x, y });
        }
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 50);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
    };
  }, [selectedStar]);

  const nearbyStars = useMemo(() => {
    if (!selectedStar) return [];
    return getNearbyBrightStars(stars, selectedStar, 5);
  }, [selectedStar, stars]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setSelectedStar(null), 300);
  };

  const handleNearbyClick = (star: StarData) => {
    flyToStar(star);
  };

  const toggleStarInCluster = (starId: string) => {
    if (clusterStarIds.includes(starId)) {
      removeStarFromCluster(starId);
    } else {
      addStarToCluster(starId);
    }
  };

  if (!selectedStar) return null;

  const spectralClassNames: Record<string, string> = {
    O: '蓝超巨星',
    B: '蓝巨星',
    A: '白色主序星',
    F: '黄白主序星',
    G: '黄色主序星',
    K: '橙色巨星',
    M: '红超巨星',
  };

  return (
    <>
      <svg
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 998,
        }}
      >
        <line
          x1={starScreenPos.x}
          y1={starScreenPos.y}
          x2="75%"
          y2="45%"
          stroke={selectedStar.color}
          strokeWidth="1.5"
          strokeDasharray="6,4"
          style={{
            opacity: isVisible ? 0.7 : 0,
            transition: 'opacity 0.5s ease 0.2s',
            strokeDashoffset: isVisible ? 0 : 100,
          }}
        />
        <circle
          cx={starScreenPos.x}
          cy={starScreenPos.y}
          r="6"
          fill={selectedStar.color}
          style={{
            opacity: isVisible ? 0.9 : 0,
            transition: 'opacity 0.3s ease',
            filter: `drop-shadow(0 0 8px ${selectedStar.color})`,
          }}
        />
      </svg>

      <div
        ref={panelRef}
        className="glass-panel-dark"
        style={{
          position: 'fixed',
          top: '15%',
          right: 24,
          width: 340,
          maxHeight: '70vh',
          overflowY: 'auto',
          zIndex: 999,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) translateX(0)' : 'translateY(20px) translateX(10px)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: selectedStar.color,
                  boxShadow: `0 0 12px ${selectedStar.color}, 0 0 24px ${selectedStar.color}40`,
                  flexShrink: 0,
                }}
              />
              <h2 style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: 0 }}>
                {selectedStar.name}
              </h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0, paddingLeft: 24 }}>
              {selectedStar.nameCn}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              width: 28,
              height: 28,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{
          background: `linear-gradient(135deg, ${selectedStar.color}15 0%, transparent 60%)`,
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
          border: `1px solid ${selectedStar.color}30`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Sparkles size={14} style={{ color: selectedStar.color }} />
            <span style={{ color: selectedStar.color, fontSize: 12, fontWeight: 500 }}>
              {spectralClassNames[selectedStar.spectralClass] || selectedStar.spectralType}
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {selectedStar.constellationCn} · {selectedStar.constellation}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            padding: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Star size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>视星等</span>
            </div>
            <p style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {selectedStar.apparentMagnitude.toFixed(2)}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            padding: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ruler size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>距离</span>
            </div>
            <p style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {selectedStar.distance < 10 
                ? selectedStar.distance.toFixed(2) 
                : Math.round(selectedStar.distance)}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}> 光年</span>
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            padding: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Thermometer size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>表面温度</span>
            </div>
            <p style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {selectedStar.temperature.toLocaleString()}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}> K</span>
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            padding: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Sparkles size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>光谱类型</span>
            </div>
            <p style={{ color: selectedStar.color, fontSize: 18, fontWeight: 600, margin: 0 }}>
              {selectedStar.spectralType}
            </p>
          </div>
        </div>

        {isCreatingCluster && (
          <button
            onClick={() => toggleStarInCluster(selectedStar.id)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: clusterStarIds.includes(selectedStar.id) 
                ? 'rgba(0, 212, 255, 0.2)' 
                : 'rgba(0, 212, 255, 0.1)',
              color: '#00d4ff',
              border: `1px solid ${clusterStarIds.includes(selectedStar.id) ? '#00d4ff' : 'rgba(0, 212, 255, 0.3)'}`,
            }}
          >
            {clusterStarIds.includes(selectedStar.id) ? (
              <><Check size={16} /> 已加入星群</>
            ) : (
              <><Plus size={16} /> 加入星群</>
            )}
          </button>
        )}

        <div>
          <h3 style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
            fontWeight: 500,
            margin: '0 0 10px 0',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            附近亮星
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nearbyStars.map((star, index) => (
              <div
                key={star.id}
                onClick={() => handleNearbyClick(star)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'transparent',
                  opacity: 0,
                  animation: `fadeInUp 0.3s ease forwards ${index * 50 + 200}ms`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: star.color,
                    boxShadow: `0 0 6px ${star.color}`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'white', fontSize: 13, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {star.name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
                    {star.nameCn}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.3)' }}>
                  <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                    {star.apparentMagnitude.toFixed(1)}m
                  </span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
