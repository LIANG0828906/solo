import React, { useState, useEffect } from 'react';

export interface PipelineTypeOption {
  type: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface ControlPanelProps {
  pipelineTypes: PipelineTypeOption[];
  opacity: number;
  isTouring: boolean;
  onTypeToggle: (type: string, visible: boolean) => void;
  onOpacityChange: (opacity: number) => void;
  onTourToggle: () => void;
  selectedTourPipeline: string;
  onTourPipelineChange: (pipelineId: string) => void;
  tourPipelineOptions: { id: string; name: string }[];
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  pipelineTypes,
  opacity,
  isTouring,
  onTypeToggle,
  onOpacityChange,
  onTourToggle,
  selectedTourPipeline,
  onTourPipelineChange,
  tourPipelineOptions,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const panelContent = (
    <div
      style={{
        padding: 16,
        fontFamily: 'sans-serif',
        fontSize: 14,
        color: '#CCCCCC',
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#FFFFFF',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 18 }}>📋</span>
        管线控制
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 12,
            color: '#8888AA',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          管线类型
        </div>
        {pipelineTypes.map((pt) => (
          <div
            key={pt.type}
            onClick={() => onTypeToggle(pt.type, !pt.visible)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 4px',
              cursor: 'pointer',
              borderRadius: 6,
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: pt.visible ? `2px solid ${pt.color}` : '2px solid #555577',
                backgroundColor: pt.visible ? pt.color : 'transparent',
                marginRight: 10,
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {pt.visible && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  ✓
                </div>
              )}
            </div>
            <span
              style={{
                color: pt.visible ? '#CCCCCC' : '#666688',
                transition: 'color 0.15s ease',
              }}
            >
              {pt.name}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 12,
            color: '#8888AA',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          透明度
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            background: '#444466',
            outline: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
            fontSize: 11,
            color: '#666688',
          }}
        >
          <span>0.1</span>
          <span>{opacity.toFixed(1)}</span>
          <span>1.0</span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 12,
            color: '#8888AA',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          漫游管线
        </div>
        <select
          value={selectedTourPipeline}
          onChange={(e) => onTourPipelineChange(e.target.value)}
          disabled={isTouring}
          style={{
            width: '100%',
            padding: '8px 10px',
            backgroundColor: '#2A2A44',
            border: '1px solid #444466',
            borderRadius: 6,
            color: '#CCCCCC',
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {tourPipelineOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onTourToggle}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: isTouring ? '#C0392B' : '#4A90D9',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isTouring
            ? '0 2px 8px rgba(192, 57, 43, 0.3)'
            : '0 2px 8px rgba(74, 144, 217, 0.3)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = isTouring
            ? '0 4px 12px rgba(192, 57, 43, 0.4)'
            : '0 4px 12px rgba(74, 144, 217, 0.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = isTouring
            ? '0 2px 8px rgba(192, 57, 43, 0.3)'
            : '0 2px 8px rgba(74, 144, 217, 0.3)';
        }}
      >
        {isTouring ? '⏹ 停止漫游' : '▶ 开启漫游'}
      </button>

      {isTouring && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: '#8888AA',
            textAlign: 'center',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        >
          正在沿管线漫游中...
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1000,
            width: 44,
            height: 44,
            backgroundColor: '#0D0D1AE6',
            border: 'none',
            borderRadius: 8,
            color: '#CCCCCC',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          ☰
        </button>

        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            opacity: isMobileOpen ? 1 : 0,
            pointerEvents: isMobileOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s ease',
          }}
          onClick={() => setIsMobileOpen(false)}
        />

        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 260,
            height: '100%',
            backgroundColor: '#0D0D1AE6',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
            transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            overflowY: 'auto',
          }}
        >
          {panelContent}
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        width: 260,
        backgroundColor: '#0D0D1AE6',
        backdropFilter: 'blur(12px)',
        borderRadius: 8,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.15s ease',
      }}
    >
      {panelContent}
    </div>
  );
};

export default ControlPanel;
