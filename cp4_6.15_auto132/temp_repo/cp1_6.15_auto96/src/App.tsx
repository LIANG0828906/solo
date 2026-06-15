import React, { useRef, useState, useCallback } from 'react';
import ColorPaletteModule from './ColorPaletteModule';
import CanvasModule, { CanvasModuleRef, LayerData, BrushType } from './CanvasModule';
import ToolbarModule from './ToolbarModule';
import InfoPanelModule from './InfoPanelModule';
import { saveAsPNGFromSnapshot, generateShareLink } from './ShareModule';
import { ColorItem } from './BrandLibrary';

const App: React.FC = () => {
  const canvasRef = useRef<CanvasModuleRef>(null);
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [brushType, setBrushType] = useState<BrushType>('circle');
  const [eraserActive, setEraserActive] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const handleColorSelect = useCallback((color: ColorItem, brandName: string) => {
    // This is called when color is clicked (optional feature)
  }, []);

  const handleLayersChange = useCallback((newLayers: LayerData[]) => {
    setLayers(newLayers);
  }, []);

  const handleBrushChange = useCallback((type: BrushType) => {
    setBrushType(type);
    canvasRef.current?.setBrushType(type);
    setEraserActive(false);
    canvasRef.current?.setEraserMode(false);
  }, []);

  const handleEraserToggle = useCallback((active: boolean) => {
    setEraserActive(active);
    canvasRef.current?.setEraserMode(active);
  }, []);

  const handleReset = useCallback(() => {
    canvasRef.current?.resetCanvas();
  }, []);

  const handleDeleteLayer = useCallback((id: string) => {
    canvasRef.current?.deleteLayer(id);
  }, []);

  const handleSavePNG = useCallback(async () => {
    await saveAsPNGFromSnapshot(() => canvasRef.current?.getCanvasSnapshot() || null);
  }, []);

  const handleShare = useCallback(async () => {
    const currentLayers = canvasRef.current?.getLayers() || [];
    await generateShareLink(currentLayers);
  }, []);

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes slideIn {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(212, 196, 168, 0.3);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(139, 115, 85, 0.5);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 115, 85, 0.7);
        }
      `}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>彩铅叠色模拟器</h1>
        <div style={styles.headerButtons}>
          <button onClick={handleSavePNG} style={styles.headerButton}>
            <span style={styles.buttonIcon}>💾</span>
            <span style={styles.buttonText}>保存PNG</span>
          </button>
          <button onClick={handleShare} style={styles.headerButton}>
            <span style={styles.buttonIcon}>🔗</span>
            <span style={styles.buttonText}>分享链接</span>
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.leftPanel}>
          <ColorPaletteModule onColorSelect={handleColorSelect} />
        </div>

        <div style={styles.centerArea}>
          <ToolbarModule
            onBrushChange={handleBrushChange}
            onEraserToggle={handleEraserToggle}
            onReset={handleReset}
            currentBrush={brushType}
            eraserActive={eraserActive}
          />
          <div ref={canvasContainerRef} style={styles.canvasWrapper}>
            <CanvasModule
              ref={canvasRef}
              onLayersChange={handleLayersChange}
            />
          </div>
          <InfoPanelModule
            layers={layers}
            onDeleteLayer={handleDeleteLayer}
          />
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.rightPanelHeader}>
            <span style={styles.rightPanelTitle}>品牌库</span>
          </div>
          <div style={styles.rightPanelContent}>
            <p style={styles.brandTip}>在左侧选择品牌和颜色</p>
            <p style={styles.brandTip}>拖拽到画布进行叠色</p>
            <div style={styles.brandFeatures}>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>🎨</span>
                <span style={styles.featureText}>3大品牌</span>
              </div>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>🌈</span>
                <span style={styles.featureText}>36种颜色</span>
              </div>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>✨</span>
                <span style={styles.featureText}>实时混色</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'linear-gradient(135deg, #F5F0E6 0%, #E8DFD0 100%)',
    fontFamily: "'Noto Sans SC', sans-serif",
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: 'rgba(255, 250, 240, 0.9)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #D4C4A8',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    zIndex: 10
  },
  title: {
    fontFamily: "'Ma Shan Zheng', cursive",
    fontSize: '24px',
    color: '#4A3F35',
    margin: 0,
    letterSpacing: '2px'
  },
  headerButtons: {
    display: 'flex',
    gap: '12px'
  },
  headerButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#D4C4A8',
    color: '#4A3F35',
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  buttonIcon: {
    fontSize: '14px'
  },
  buttonText: {
    fontSize: '12px'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  leftPanel: {
    width: '200px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const
  },
  centerArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '16px 20px',
    minWidth: 0
  },
  canvasWrapper: {
    flex: 1,
    position: 'relative' as const,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    border: '1px solid #D4C4A8',
    minHeight: 0
  },
  rightPanel: {
    width: '200px',
    flexShrink: 0,
    backgroundColor: 'rgba(232, 223, 208, 0.8)',
    backdropFilter: 'blur(10px)',
    borderLeft: '1px solid #D4C4A8',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '-2px 0 8px rgba(0,0,0,0.05)'
  },
  rightPanelHeader: {
    padding: '16px 16px 12px',
    borderBottom: '1px solid #D4C4A8'
  },
  rightPanelTitle: {
    fontFamily: "'Ma Shan Zheng', cursive",
    fontSize: '18px',
    color: '#4A3F35'
  },
  rightPanelContent: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  brandTip: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '12px',
    color: '#6B5D4D',
    margin: 0,
    lineHeight: 1.6
  },
  brandFeatures: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: 'rgba(255,250,240,0.7)',
    borderRadius: '8px'
  },
  featureIcon: {
    fontSize: '18px'
  },
  featureText: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '12px',
    color: '#4A3F35',
    fontWeight: 500
  }
};

export default App;
