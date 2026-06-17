import WaveBackground from './components/WaveBackground';
import BottleCard from './components/BottleCard';
import CreateModal from './components/CreateModal';
import ParticleEffect from './components/ParticleEffect';
import { useBottleStore } from './store/useBottleStore';

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#0F1B2D',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px'
  },
  title: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 600,
    letterSpacing: '2px',
    textShadow: '0 2px 20px rgba(78, 205, 196, 0.3)'
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: '14px',
    letterSpacing: '1px',
    marginTop: '-20px'
  },
  actionButtons: {
    display: 'flex',
    gap: '16px'
  },
  button: {
    padding: '12px 28px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#4ECDC4',
    color: '#0F1B2D',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease-out',
    letterSpacing: '0.5px'
  },
  connectionLine: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '2px',
    height: '40%',
    background: 'linear-gradient(to bottom, #4ECDC4, transparent)',
    animation: 'connectionFade 2s ease-out forwards',
    zIndex: 5
  },
  styleTag: {
    css: `
      @keyframes connectionFade {
        0% { opacity: 0; height: 0; }
        30% { opacity: 1; }
        100% { opacity: 0; height: 40%; }
      }
      @media (max-width: 768px) {
        .actionButtons { gap: 24px !important; }
      }
    `
  }
};

function App() {
  const {
    currentBottle,
    isCreateModalOpen,
    showParticleEffect,
    showConnectionLine,
    openCreateModal,
    fetchRandomBottle
  } = useBottleStore();

  return (
    <div style={styles.container}>
      <style>{styles.styleTag.css}</style>
      <WaveBackground />

      <div style={styles.content}>
        <h1 style={styles.title}>灵感漂流瓶</h1>
        <p style={styles.subtitle}>匿名分享，随机相遇，灵感接力</p>

        <BottleCard />

        {!currentBottle && (
          <div className="actionButtons" style={styles.actionButtons}>
            <button
              style={styles.button}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6EE7E7';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4ECDC4';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={openCreateModal}
            >
              扔出新漂流瓶
            </button>
            <button
              style={styles.button}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6EE7E7';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4ECDC4';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={fetchRandomBottle}
            >
              查看随机漂流瓶
            </button>
          </div>
        )}
      </div>

      {showParticleEffect && <ParticleEffect />}
      {showConnectionLine && <div style={styles.connectionLine} />}
      {isCreateModalOpen && <CreateModal />}
    </div>
  );
}

export default App;
