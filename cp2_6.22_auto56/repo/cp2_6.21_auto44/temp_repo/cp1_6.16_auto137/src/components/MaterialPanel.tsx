import { useState, useEffect, useRef } from 'react';
import { usePosterStore, MaterialType, Material } from '../store';

interface TabConfig {
  key: MaterialType;
  label: string;
}

const tabs: TabConfig[] = [
  { key: 'character', label: '角色' },
  { key: 'scene', label: '场景' },
  { key: 'prop', label: '道具' },
];

const templatePreviews = [
  { id: 1, name: '西部牛仔风', character: 'c1', scene: 's2', prop: 'p1' },
  { id: 2, name: '黑色侦探', character: 'c2', scene: 's1', prop: 'p2' },
  { id: 3, name: '科幻冒险', character: 'c3', scene: 's3', prop: 'p3' },
  { id: 4, name: '恐怖惊悚', character: 'c5', scene: 's4', prop: 'p6' },
];

function MaterialPanel() {
  const [activeTab, setActiveTab] = useState<MaterialType>('character');
  const { materials } = usePosterStore();
  const [isDragging, setIsDragging] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const filteredMaterials = materials.filter(m => m.type === activeTab);

  useEffect(() => {
    if (activeTab !== 'scene' || isDragging) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setCurrentTemplate(prev => (prev + 1) % templatePreviews.length);
        setFadeState('in');
      }, 500);
    }, 3500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTab, isDragging]);

  const handleDragStart = (e: React.DragEvent, material: Material) => {
    e.dataTransfer.setData('materialId', material.id);
    e.dataTransfer.effectAllowed = 'copy';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div style={styles.panel}>
      <div style={styles.goldLine} />
      <div style={styles.header}>
        <h2 style={styles.title}>素材库</h2>
        <p style={styles.subtitle}>拖拽素材到画布</p>
      </div>

      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'scene' && (
          <div style={styles.templateCarousel}>
            <p style={styles.carouselLabel}>✨ 灵感模板</p>
            <div
              style={{
                ...styles.templatePreview,
                opacity: fadeState === 'in' ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            >
              <div style={styles.templateName}>
                {templatePreviews[currentTemplate].name}
              </div>
              <div style={styles.templateHint}>
                第 {currentTemplate + 1} / {templatePreviews.length}
              </div>
            </div>
          </div>
        )}

        <div style={styles.materialGrid}>
          {filteredMaterials.map(material => (
            <div
              key={material.id}
              draggable
              onDragStart={(e) => handleDragStart(e, material)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredId(material.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                ...styles.materialItem,
                transform: hoveredId === material.id ? 'scale(1.1)' : 'scale(1)',
              }}
              title={material.name}
            >
              <div style={{
                ...styles.materialThumb,
                boxShadow: hoveredId === material.id
                  ? '0 8px 24px rgba(212, 175, 55, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}>
                <img
                  src={material.imageUrl}
                  alt={material.name}
                  style={styles.materialImage}
                  draggable={false}
                />
              </div>
              <span style={styles.materialName}>{material.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: '280px',
    minWidth: '280px',
    flexShrink: 0,
    height: '600px',
    backgroundColor: '#2C0E0E',
    borderRadius: '12px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  goldLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #D4AF37, #F4E5B2, #D4AF37)',
  },
  header: {
    padding: '24px 20px 16px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
  },
  title: {
    color: '#D4AF37',
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '4px',
    letterSpacing: '1px',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '12px',
  },
  tabs: {
    display: 'flex',
    padding: '12px 16px',
    gap: '8px',
    borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
  },
  tab: {
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: 'rgba(255, 255, 255, 0.7)',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: '#D4AF37',
    color: '#2C0E0E',
    fontWeight: 600,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  templateCarousel: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(212, 175, 55, 0.2)',
  },
  carouselLabel: {
    color: '#D4AF37',
    fontSize: '12px',
    marginBottom: '8px',
    textAlign: 'center',
  },
  templatePreview: {
    height: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
  },
  templateName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
  },
  templateHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '11px',
    marginTop: '4px',
  },
  materialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  materialItem: {
    cursor: 'grab',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    transition: 'transform 0.2s ease',
  },
  materialThumb: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  materialImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    pointerEvents: 'none',
  },
  materialName: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    maxWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

export default MaterialPanel;
