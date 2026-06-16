import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stall } from '../types';

interface MapViewProps {
  stalls: Stall[];
  onStallClick: (stallId: string) => void;
}

export default function MapView({ stalls, onStallClick }: MapViewProps) {
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [waitProgress, setWaitProgress] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const initialProgress: Record<string, number> = {};
    stalls.forEach(stall => {
      initialProgress[stall.id] = Math.random() * 60 + 20;
    });
    setWaitProgress(initialProgress);

    const interval = setInterval(() => {
      setWaitProgress(prev => {
        const next = { ...prev };
        stalls.forEach(stall => {
          const change = (Math.random() - 0.5) * 5;
          next[stall.id] = Math.max(10, Math.min(90, (prev[stall.id] || 50) + change));
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [stalls]);

  const handleStallClick = (stall: Stall) => {
    setSelectedStall(stall);
  };

  const handleViewMenu = () => {
    if (selectedStall) {
      onStallClick(selectedStall.id);
    }
  };

  const goToOrders = () => {
    navigate('/orders');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 className="brush-font" style={styles.title}>美食市集</h1>
        <div style={styles.orderButton} onClick={goToOrders}>
          <span style={styles.orderIcon}>🔔</span>
          <span style={styles.orderBadge}>3</span>
        </div>
      </div>

      <div style={styles.mapContainer}>
        <div style={styles.mapBackground}>
          <div style={styles.lanternContainer}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                ...styles.lantern,
                left: `${10 + i * 12}%`,
                top: `${5 + (i % 3) * 5}%`,
                animationDelay: `${i * 0.3}s`
              }} className="animate-float">
                🏮
              </div>
            ))}
          </div>

          {stalls.map((stall, index) => (
            <div
              key={stall.id}
              style={{
                ...styles.stallIcon,
                left: `${stall.position.x}%`,
                top: `${stall.position.y}%`,
                animationDelay: `${index * 0.1}s`
              }}
              className="stagger-item animate-float"
              onClick={() => handleStallClick(stall)}
            >
              <div style={{
                ...styles.stallBubble,
                borderColor: stall.cuisineColor,
                boxShadow: selectedStall?.id === stall.id ? `0 0 20px ${stall.cuisineColor}` : '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                <span style={styles.stallEmoji}>{stall.emoji}</span>
              </div>
              <div style={styles.stallShadow}></div>
              <span style={styles.stallNameBelow}>{stall.name}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedStall && (
        <div style={styles.modalOverlay} onClick={() => setSelectedStall(null)}>
          <div
            style={styles.infoCard}
            className="animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.cardHeader}>
              <span style={{ ...styles.cuisineBadge, backgroundColor: selectedStall.cuisineColor + '20', color: selectedStall.cuisineColor }}>
                {selectedStall.cuisine}
              </span>
              <button style={styles.closeButton} onClick={() => setSelectedStall(null)}>✕</button>
            </div>

            <h2 className="brush-font" style={styles.stallTitle}>{selectedStall.name}</h2>
            <p style={styles.stallDescription}>{selectedStall.description}</p>

            <div style={styles.waitTimeSection}>
              <div style={styles.waitTimeLabel}>预计等待时间</div>
              <div style={styles.waitTimeValue}>
                <span style={styles.waitTimeNumber}>{selectedStall.waitTime}</span>
                <span style={styles.waitTimeUnit}>分钟</span>
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${waitProgress[selectedStall.id] || 50}%`,
                    background: `linear-gradient(90deg, #E74C3C 0%, #F39C12 50%, #2ECC71 100%)`
                  }}
                ></div>
              </div>
            </div>

            <button style={styles.viewMenuButton} onClick={handleViewMenu}>
              查看菜单
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #FF6B35 0%, #E85D2C 30%, #D4541F 60%, #8B4513 100%)',
    position: 'relative',
    overflow: 'hidden'
  },
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'linear-gradient(180deg, rgba(232,93,44,0.9) 0%, transparent 100%)'
  },
  title: {
    fontSize: '32px',
    color: '#FFF8EE',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    margin: 0
  },
  orderButton: {
    position: 'relative',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  orderIcon: {
    fontSize: '24px'
  },
  orderBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#E74C3C',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mapContainer: {
    width: '100%',
    minHeight: '100vh',
    paddingTop: '80px',
    overflow: 'auto'
  },
  mapBackground: {
    position: 'relative',
    width: '100%',
    minHeight: 'calc(100vh - 80px)',
    padding: '20px'
  },
  lanternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none'
  },
  lantern: {
    position: 'absolute',
    fontSize: '28px',
    opacity: 0.6
  },
  stallIcon: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  stallBubble: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: 'rgba(255, 248, 238, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #F4A261',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  },
  stallEmoji: {
    fontSize: '36px'
  },
  stallShadow: {
    width: '50px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.3)',
    marginTop: '-4px',
    filter: 'blur(4px)'
  },
  stallNameBelow: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#FFF8EE',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
    fontFamily: "'Ma Shan Zheng', cursive"
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px'
  },
  infoCard: {
    width: '100%',
    maxWidth: '360px',
    background: 'rgba(255, 248, 238, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.3)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  cuisineBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.1)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#3D2B1F',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stallTitle: {
    fontSize: '32px',
    color: '#3D2B1F',
    marginBottom: '8px'
  },
  stallDescription: {
    fontSize: '14px',
    color: '#8B7355',
    marginBottom: '20px',
    lineHeight: 1.5
  },
  waitTimeSection: {
    background: 'rgba(244, 162, 97, 0.2)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px'
  },
  waitTimeLabel: {
    fontSize: '13px',
    color: '#8B7355',
    marginBottom: '8px'
  },
  waitTimeValue: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: '12px'
  },
  waitTimeNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#E85D2C'
  },
  waitTimeUnit: {
    fontSize: '16px',
    color: '#8B7355',
    marginLeft: '6px'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease'
  },
  viewMenuButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #E85D2C 0%, #F4A261 100%)',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(232, 93, 44, 0.3)'
  }
};
