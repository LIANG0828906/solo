import { FaRedo } from 'react-icons/fa';
import type { PipelineType } from '../Data/undergroundData';
import { PIPELINE_NAMES, PIPELINE_COLORS } from '../Data/undergroundData';

export interface PipelineFilters {
  water: boolean;
  drain: boolean;
  gas: boolean;
  power: boolean;
  telecom: boolean;
}

interface ControlPanelProps {
  currentDepth: number;
  onDepthChange: (depth: number) => void;
  pipelineFilters: PipelineFilters;
  onFilterChange: (type: PipelineType, value: boolean) => void;
  onResetCamera: () => void;
}

const ControlPanel = ({
  currentDepth,
  onDepthChange,
  pipelineFilters,
  onFilterChange,
  onResetCamera,
}: ControlPanelProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 10,
        width: 280,
        padding: 20,
        backgroundColor: 'rgba(15, 12, 41, 0.75)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <h3
        style={{
          margin: 0,
          marginBottom: 16,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        控制面板
      </h3>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <label style={{ fontSize: 13, color: '#ccc' }}>勘探深度</label>
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {currentDepth.toFixed(1)} m
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={currentDepth}
          onChange={(e) => onDepthChange(Number(e.target.value))}
          style={{
            width: '100%',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#888',
            marginTop: 4,
          }}
        >
          <span>0m</span>
          <span>5m</span>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            fontSize: 13,
            color: '#ccc',
            display: 'block',
            marginBottom: 10,
          }}
        >
          管线过滤
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(Object.keys(PIPELINE_NAMES) as PipelineType[]).map((type) => (
            <label
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: 6,
                transition: 'background 0.15s',
                backgroundColor: pipelineFilters[type]
                  ? 'rgba(255,255,255,0.05)'
                  : 'transparent',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: `2px solid ${
                    pipelineFilters[type] ? PIPELINE_COLORS[type] : '#555'
                  }`,
                  backgroundColor: pipelineFilters[type]
                    ? PIPELINE_COLORS[type]
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {pipelineFilters[type] && (
                  <span
                    style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 'bold',
                      lineHeight: 1,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <input
                type="checkbox"
                checked={pipelineFilters[type]}
                onChange={(e) => onFilterChange(type, e.target.checked)}
                style={{ display: 'none' }}
              />
              <span
                style={{
                  color: pipelineFilters[type] ? '#ffffff' : '#666666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  textDecoration: pipelineFilters[type] ? 'none' : 'line-through',
                  transition: 'all 0.2s',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: pipelineFilters[type] ? PIPELINE_COLORS[type] : '#555',
                    transition: 'all 0.2s',
                  }}
                />
                {PIPELINE_NAMES[type]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={onResetCamera}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: 'rgba(90, 79, 207, 0.8)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(90, 79, 207, 1)';
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(90, 79, 207, 0.8)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <FaRedo size={14} />
        重置视角
      </button>
    </div>
  );
};

export default ControlPanel;
