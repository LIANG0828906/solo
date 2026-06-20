import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, RotateCcw } from 'lucide-react';
import { SceneRenderer } from './renderer/sceneRenderer';
import { ControlBar } from './components/ControlBar';
import { InfoPanel } from './components/InfoPanel';
import { useAlgorithmStore } from './stores/algorithmStore';
import type { AlgorithmType } from './utils/colorUtils';

const algorithms: { type: AlgorithmType; label: string; icon: string }[] = [
  { type: 'eightQueens', label: '八皇后回溯', icon: '♛' },
  { type: 'aStar', label: 'A*寻路', icon: '★' },
  { type: 'binaryTree', label: '二叉树遍历', icon: '⋔' },
];

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SceneRenderer | null>(null);
  const { algorithmType, currentStepIndex, snapshots, setAlgorithm, reset } = useAlgorithmStore();
  const [legendOpen, setLegendOpen] = useState(true);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const renderer = new SceneRenderer(containerRef.current);
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.initScene(algorithmType);
    }
  }, [algorithmType]);

  useEffect(() => {
    if (rendererRef.current && snapshots[currentStepIndex]) {
      rendererRef.current.updateSnapshot(snapshots[currentStepIndex]);
    }
  }, [currentStepIndex, snapshots]);

  const legendItems = getLegendItems(algorithmType);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0F0F23',
        overflow: 'hidden',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: legendOpen ? 200 : 80,
            background: '#1A1A2E',
            borderRight: '1px solid #2D2D44',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s ease',
            flexShrink: 0,
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 12px',
              borderBottom: '1px solid #2D2D44',
            }}
          >
            {legendOpen ? (
              <span
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                图例说明
              </span>
            ) : (
              <HelpCircle size={18} color="#6C63FF" style={{ marginLeft: 13 }} />
            )}
            <button
              onClick={() => setLegendOpen(!legendOpen)}
              style={iconBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3D3D5C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {legendOpen ? <ChevronLeft size={16} color="#888" /> : <ChevronRight size={16} color="#888" />}
            </button>
          </div>

          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {legendItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: legendOpen ? 1 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: item.shape === 'circle' ? '50%' : 3,
                    background: item.color,
                    boxShadow: item.glow ? `0 0 8px ${item.color}` : 'none',
                    flexShrink: 0,
                  }}
                />
                {legendOpen && (
                  <span style={{ color: '#BBBBBB', fontSize: 12 }}>{item.label}</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', padding: 12 }}>
            <button
              onClick={reset}
              style={{
                width: '100%',
                height: 36,
                background: '#2D2D44',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: legendOpen ? 12 : 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#6C63FF';
                e.currentTarget.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2D2D44';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <RotateCcw size={14} color="#FFFFFF" />
              {legendOpen && <span>重置</span>}
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: '16px 24px',
              justifyContent: 'center',
              borderBottom: '1px solid #2D2D44',
              background: 'rgba(15, 15, 35, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 15,
            }}
          >
            {algorithms.map((algo) => {
              const isSelected = algorithmType === algo.type;
              const isHovered = hoveredBtn === algo.type;
              return (
                <button
                  key={algo.type}
                  onClick={() => setAlgorithm(algo.type)}
                  onMouseEnter={() => setHoveredBtn(algo.type)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    width: 160,
                    height: 48,
                    borderRadius: 8,
                    background: isSelected ? '#6C63FF' : '#2D2D44',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    position: 'relative',
                    overflow: 'hidden',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                    filter: isHovered && !isSelected ? 'brightness(1.2)' : 'brightness(1)',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{algo.icon}</span>
                  <span>{algo.label}</span>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: 3,
                      background: isSelected ? '#FFFFFF' : 'transparent',
                      transform: isSelected ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div
            ref={containerRef}
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
            }}
          />

          <ControlBar />
          <InfoPanel />
        </div>
      </div>
    </div>
  );
}

function getLegendItems(
  type: AlgorithmType
): { color: string; label: string; shape: 'circle' | 'square'; glow?: boolean }[] {
  switch (type) {
    case 'eightQueens':
      return [
        { color: '#FFD700', label: '皇后', shape: 'circle', glow: true },
        { color: '#2D2D44', label: '棋盘格子(亮)', shape: 'square' },
        { color: '#1A1A2E', label: '棋盘格子(暗)', shape: 'square' },
        { color: '#6C63FF', label: '辅助网格', shape: 'square' },
      ];
    case 'aStar':
      return [
        { color: '#00FF88', label: '起点', shape: 'circle', glow: true },
        { color: '#FF4444', label: '终点', shape: 'circle', glow: true },
        { color: '#666666', label: '障碍物', shape: 'square' },
        { color: '#6C63FF', label: '已探索路径', shape: 'circle', glow: true },
      ];
    case 'binaryTree':
      return [
        { color: '#4ECDC4', label: '起始节点', shape: 'circle' },
        { color: '#FF6B6B', label: '末尾节点', shape: 'circle' },
        { color: '#FFFFFF', label: '当前访问节点', shape: 'circle', glow: true },
        { color: '#FFFFFF44', label: '节点连线', shape: 'square' },
      ];
  }
}

const iconBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s ease',
  padding: 0,
};

export default App;
