import { CSSProperties } from 'react';
import { Cell, CompassState, PathMarker } from '../types';
import { positionKey } from '../maze/MazeGenerator';

interface CompassUIProps {
  maze: Cell[][];
  compassState: CompassState;
  markers: PathMarker[];
  canBacktrack: boolean;
  isBacktracking: boolean;
  onBacktrack: () => void;
  minimapSize?: number;
}

const MARKER_COLORS: Record<string, string> = {
  minecart: '#ff9800',
  chest: '#f44336',
  exit: '#4caf50',
};

const MARKER_NAMES: Record<string, string> = {
  minecart: '矿车',
  chest: '宝箱',
  exit: '出口',
};

const MARKER_ICONS: Record<string, string> = {
  minecart: '⚒',
  chest: '💎',
  exit: '🚪',
};

export function CompassUI({
  maze,
  compassState,
  markers,
  canBacktrack,
  isBacktracking,
  onBacktrack,
  minimapSize = 200,
}: CompassUIProps) {
  const { currentPosition, exploredCells, steps } = compassState;
  const cols = maze[0].length;
  const rows = maze.length;
  const cellW = minimapSize / cols;
  const cellH = minimapSize / rows;

  const panelStyle: CSSProperties = {
    background: 'rgba(42, 42, 58, 0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    borderRadius: '16px',
    padding: '20px',
    color: '#e8e6e3',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    border: '1px solid rgba(255, 165, 0, 0.15)',
    minWidth: '280px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  };

  const minimapStyle: CSSProperties = {
    position: 'relative',
    width: minimapSize,
    height: minimapSize,
    background: '#0a0a15',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid rgba(201, 169, 110, 0.5)',
    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)',
  };

  const buttonStyle: CSSProperties = {
    padding: '14px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: canBacktrack && !isBacktracking ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit',
    fontSize: '16px',
    fontWeight: 'bold',
    background:
      canBacktrack && !isBacktracking
        ? 'linear-gradient(135deg, #d4b07a 0%, #c9a96e 50%, #a88b4d 100%)'
        : 'linear-gradient(135deg, #555566 0%, #444455 100%)',
    color: canBacktrack && !isBacktracking ? '#2a1a0a' : '#777788',
    boxShadow:
      canBacktrack && !isBacktracking
        ? '0 4px 12px rgba(201, 169, 110, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        : 'none',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div style={panelStyle}>
      <div>
        <h3
          style={{
            margin: 0,
            marginBottom: '12px',
            color: '#c9a96e',
            fontSize: '18px',
            letterSpacing: '1px',
            borderBottom: '1px solid rgba(201, 169, 110, 0.3)',
            paddingBottom: '8px',
          }}
        >
          🧭 指南针地图
        </h3>
        <div style={minimapStyle}>
          {maze.map((row) =>
            row.map((cell) => {
              const key = positionKey(cell);
              const isExplored = exploredCells.has(key);

              return (
                <div
                  key={key}
                  style={{
                    position: 'absolute',
                    left: cell.x * cellW,
                    top: cell.y * cellH,
                    width: cellW,
                    height: cellH,
                    background: isExplored ? '#2a2a3a' : '#1a1a2e',
                    boxSizing: 'border-box',
                    borderTop:
                      isExplored && cell.walls.top
                        ? `${Math.max(1, cellH * 0.08)}px solid #4a3020`
                        : 'none',
                    borderRight:
                      isExplored && cell.walls.right
                        ? `${Math.max(1, cellW * 0.08)}px solid #4a3020`
                        : 'none',
                    borderBottom:
                      isExplored && cell.walls.bottom
                        ? `${Math.max(1, cellH * 0.08)}px solid #4a3020`
                        : 'none',
                    borderLeft:
                      isExplored && cell.walls.left
                        ? `${Math.max(1, cellW * 0.08)}px solid #4a3020`
                        : 'none',
                    opacity: isExplored ? 1 : 0.95,
                  }}
                />
              );
            })
          )}

          {markers.map((m, i) => {
            const markerKey = positionKey(m.position);
            if (!exploredCells.has(markerKey)) return null;
            return (
              <div
                key={`m-${i}`}
                style={{
                  position: 'absolute',
                  left: m.position.x * cellW + cellW / 2 - 2,
                  top: m.position.y * cellH + cellH / 2 - 2,
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: MARKER_COLORS[m.type],
                  boxShadow: `0 0 4px ${MARKER_COLORS[m.type]}`,
                  zIndex: 2,
                }}
              />
            );
          })}

          <div
            style={{
              position: 'absolute',
              left: currentPosition.x * cellW + cellW / 2 - minimapSize * 0.04,
              top: currentPosition.y * cellH + cellH / 2 - minimapSize * 0.04,
              width: minimapSize * 0.08,
              height: minimapSize * 0.08,
              borderRadius: '50%',
              background: '#ffd700',
              boxShadow: '0 0 8px #ffd700, 0 0 16px rgba(255, 215, 0, 0.5)',
              zIndex: 3,
              animation: 'goldPulse 1s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          padding: '12px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px',
        }}
      >
        <div style={{ fontSize: '13px', color: '#9a9ab0' }}>步数</div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#c9a96e',
            textAlign: 'right',
          }}
        >
          {steps}
        </div>
        <div style={{ fontSize: '13px', color: '#9a9ab0' }}>探索区域</div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#5c9eff',
            textAlign: 'right',
          }}
        >
          {Math.round((exploredCells.size / (rows * cols)) * 100)}%
        </div>
        <div style={{ fontSize: '13px', color: '#9a9ab0' }}>路径长度</div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#81c784',
            textAlign: 'right',
          }}
        >
          {compassState.pathStack.length}
        </div>
        <div style={{ fontSize: '13px', color: '#9a9ab0' }}>标记数</div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#ff9800',
            textAlign: 'right',
          }}
        >
          {markers.length}
        </div>
      </div>

      <button
        style={buttonStyle}
        onClick={onBacktrack}
        disabled={!canBacktrack || isBacktracking}
        onMouseEnter={(e) => {
          if (canBacktrack && !isBacktracking) {
            e.currentTarget.style.boxShadow =
              '0 0 20px rgba(201, 169, 110, 0.8), 0 4px 12px rgba(201, 169, 110, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            canBacktrack && !isBacktracking
              ? '0 4px 12px rgba(201, 169, 110, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              : 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {isBacktracking ? '⏳ 回溯中...' : '↩ 一键回溯到入口'}
      </button>

      <div>
        <h4
          style={{
            margin: 0,
            marginBottom: '10px',
            color: '#c9a96e',
            fontSize: '15px',
            letterSpacing: '0.5px',
          }}
        >
          📍 标记列表
        </h4>
        <div
          style={{
            maxHeight: '180px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {markers.length === 0 && (
            <div style={{ color: '#666680', fontSize: '13px', padding: '8px' }}>
              暂无标记（空格键添加）
            </div>
          )}
          {markers.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid transparent',
                cursor: 'default',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(201, 169, 110, 0.15)';
                e.currentTarget.style.borderColor = MARKER_COLORS[m.type];
                e.currentTarget.style.boxShadow = `0 0 12px ${MARKER_COLORS[m.type]}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: `${MARKER_COLORS[m.type]}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  border: `1px solid ${MARKER_COLORS[m.type]}`,
                }}
              >
                {MARKER_ICONS[m.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#e8e6e3', fontWeight: 600 }}>
                  {MARKER_NAMES[m.type]}
                </div>
                <div style={{ fontSize: '11px', color: '#8888a0' }}>
                  位置 ({m.position.x}, {m.position.y})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: '12px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#8888a0',
          lineHeight: '1.8',
        }}
      >
        <div style={{ marginBottom: '4px', color: '#c9a96e', fontWeight: 600 }}>
          ⌨ 操作指南
        </div>
        <div><b style={{color:'#aaaacc'}}>WASD</b> 移动 · <b style={{color:'#aaaacc'}}>空格</b> 添加标记</div>
        <div><b style={{color:'#aaaacc'}}>R</b> 路径回溯 · <b style={{color:'#aaaacc'}}>ESC</b> 取消</div>
      </div>
    </div>
  );
}
