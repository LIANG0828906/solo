import { useState, useEffect, useCallback } from 'react';
import { IoRefreshCircle, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { PlanetData } from '@/data/planets';

interface PlanetDetailProps {
  planet: PlanetData | null;
  isOpen: boolean;
  onClose: () => void;
  onResetView: () => void;
}

export function PlanetDetail({ planet, isOpen, onClose, onResetView }: PlanetDetailProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [dividerVisible, setDividerVisible] = useState(false);

  useEffect(() => {
    if (isOpen && planet) {
      setCurrentImage(0);
      const timer = setTimeout(() => setDividerVisible(true), 50);
      return () => {
        clearTimeout(timer);
        setDividerVisible(false);
      };
    }
  }, [isOpen, planet]);

  const nextImage = useCallback(() => {
    if (planet) {
      setCurrentImage((prev) => (prev + 1) % planet.images.length);
    }
  }, [planet]);

  const prevImage = useCallback(() => {
    if (planet) {
      setCurrentImage((prev) => (prev - 1 + planet.images.length) % planet.images.length);
    }
  }, [planet]);

  if (!planet) return null;

  return (
    <div
      style={{
        ...styles.container,
        transform: isOpen ? 'translateX(0)' : 'translateX(110%)',
      }}
    >
      <button style={styles.closeBtn} onClick={onClose}>
        ✕
      </button>

      <div style={styles.header}>
        <h1 style={{ ...styles.name, color: planet.nameColor }}>{planet.nameCN}</h1>
        <h2 style={styles.nameEn}>{planet.name}</h2>
        <div style={styles.gradientDividerWrap}>
          <div
            style={{
              ...styles.gradientDivider,
              background: dividerVisible
                ? `linear-gradient(90deg, ${planet.nameColor}, transparent)`
                : 'transparent',
              width: dividerVisible ? '100%' : '0%',
            }}
          />
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>质量</span>
          <span style={{ ...styles.statValue, color: planet.nameColor }}>
            {planet.mass} <span style={styles.statUnit}>M⊕</span>
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>半径</span>
          <span style={{ ...styles.statValue, color: planet.nameColor }}>
            {planet.radius} <span style={styles.statUnit}>R⊕</span>
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>自转周期</span>
          <span style={{ ...styles.statValue, color: planet.nameColor }}>
            {planet.rotationPeriod} <span style={styles.statUnit}>小时</span>
          </span>
        </div>
      </div>

      <div style={styles.divider} />

      <p style={styles.description}>{planet.description}</p>

      <div style={styles.divider} />

      <div style={styles.carousel}>
        <div style={styles.carouselImgWrap}>
          <img
            src={planet.images[currentImage]}
            alt={`${planet.nameCN} 图片 ${currentImage + 1}`}
            style={styles.carouselImg}
          />
          <div style={styles.carouselOverlay}>
            <span style={styles.carouselIndex}>
              {currentImage + 1} / {planet.images.length}
            </span>
          </div>
        </div>
        <div style={styles.carouselControls}>
          <button style={styles.carouselBtn} onClick={prevImage}>
            <IoChevronBack size={16} />
          </button>
          <div style={styles.indicators}>
            {planet.images.map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.indicator,
                  background: i === currentImage ? planet.nameColor : 'rgba(255,255,255,0.2)',
                  boxShadow: i === currentImage ? `0 0 6px ${planet.nameColor}60` : 'none',
                }}
                onClick={() => setCurrentImage(i)}
              />
            ))}
          </div>
          <button style={styles.carouselBtn} onClick={nextImage}>
            <IoChevronForward size={16} />
          </button>
        </div>
      </div>

      <div style={styles.spacer} />

      <button style={styles.resetBtn} onClick={onResetView}>
        <IoRefreshCircle size={20} />
        <span style={styles.resetBtnText}>重置视角</span>
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 320,
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    background: 'rgba(10, 14, 26, 0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '20px 18px',
    color: '#ffffff',
    fontFamily: "'Source Sans 3', sans-serif",
    position: 'relative' as const,
    zIndex: 10,
    transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  closeBtn: {
    position: 'absolute' as const,
    top: 12,
    right: 14,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.5)',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.2s ease',
  },
  header: {
    marginBottom: 16,
  },
  name: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 26,
    fontWeight: 800,
    margin: '0 0 2px 0',
    letterSpacing: 1,
  },
  nameEn: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 12,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.35)',
    margin: '0 0 10px 0',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  gradientDividerWrap: {
    height: 2,
    marginBottom: 4,
  },
  gradientDivider: {
    height: '100%',
    transition: 'all 0.4s ease',
  },
  stats: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  statValue: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 16,
    fontWeight: 700,
  },
  statUnit: {
    fontSize: 10,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.35)',
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    margin: '14px 0',
  },
  description: {
    fontSize: 13.5,
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.7)',
    margin: 0,
  },
  carousel: {
    marginTop: 4,
  },
  carouselImgWrap: {
    position: 'relative' as const,
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: '4/3',
    background: 'rgba(255,255,255,0.03)',
  },
  carouselImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  carouselOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '6px 10px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  carouselIndex: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  carouselControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  carouselBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: 'rgba(255,255,255,0.6)',
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  indicators: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  spacer: {
    flex: 1,
    minHeight: 16,
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 20px',
    background: 'rgba(79, 195, 247, 0.08)',
    border: '1px solid rgba(79, 195, 247, 0.25)',
    borderRadius: 10,
    color: '#4FC3F7',
    fontFamily: "'Source Sans 3', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
  },
};
