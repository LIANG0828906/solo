import { useState, useEffect } from 'react';
import type { LoadingState, SelectedDataDetail, DataSourceType } from './types';
import { CAMERA_PRESETS } from './types';

const glassStyle: React.CSSProperties = {
  background: 'rgba(11, 13, 23, 0.65)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(42, 245, 255, 0.15)',
  boxShadow: '0 4px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
};

const glowButtonStyle: React.CSSProperties = {
  background: 'rgba(42, 245, 255, 0.1)',
  border: '1px solid rgba(42, 245, 255, 0.3)',
  color: '#2AF5FF',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '0.5px',
  transition: 'all 0.2s ease',
};

interface UIOverlayProps {
  loadingState: LoadingState;
  currentTimestamp: string;
  timeProgress: number;
  totalTimeSteps: number;
  currentTimeIndex: number;
  dataSourceType: DataSourceType;
  selectedDetail: SelectedDataDetail | null;
  onLoadMock: () => void;
  onUploadCSV: () => void;
  onTimeChange: (progress: number) => void;
  onCameraPreset: (index: number) => void;
  onCloseDetail: () => void;
}

export function UIOverlay({
  loadingState,
  currentTimestamp,
  timeProgress,
  totalTimeSteps,
  currentTimeIndex,
  dataSourceType,
  selectedDetail,
  onLoadMock,
  onUploadCSV,
  onTimeChange,
  onCameraPreset,
  onCloseDetail,
}: UIOverlayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  useEffect(() => {
    if (selectedDetail) {
      requestAnimationFrame(() => setPopupVisible(true));
    } else {
      setPopupVisible(false);
    }
  }, [selectedDetail]);

  useEffect(() => {
    if (!isPlaying || totalTimeSteps <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = currentTimeIndex + 1;
      if (nextIndex >= totalTimeSteps) {
        setIsPlaying(false);
      } else {
        onTimeChange(nextIndex / (totalTimeSteps - 1));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, currentTimeIndex, totalTimeSteps, onTimeChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(parseFloat(e.target.value));
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 10,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'auto',
        }}
      >
        <div style={{
          ...glassStyle,
          borderRadius: '12px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #2AF5FF 0%, #A855F7 100%)',
            boxShadow: '0 0 16px rgba(42, 245, 255, 0.5)',
          }} />
          <div>
            <div style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '1px',
              textShadow: '0 0 12px rgba(42, 245, 255, 0.5)',
            }}>
              DATA SCULPTURE
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 10,
              letterSpacing: '2px',
            }}>
              3D 数据雕塑
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          <div style={{
            ...glassStyle,
            borderRadius: '10px',
            padding: '6px',
            display: 'flex',
            gap: 4,
          }}>
            <button
              onClick={onLoadMock}
              style={{
                ...glowButtonStyle,
                background: dataSourceType === 'mock' ? 'rgba(42, 245, 255, 0.2)' : 'transparent',
                border: dataSourceType === 'mock' ? '1px solid rgba(42, 245, 255, 0.6)' : '1px solid transparent',
                padding: '6px 14px',
              }}
              onMouseEnter={(e) => {
                if (dataSourceType !== 'mock') {
                  e.currentTarget.style.background = 'rgba(42, 245, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (dataSourceType !== 'mock') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              模拟数据
            </button>
            <button
              onClick={onUploadCSV}
              style={{
                ...glowButtonStyle,
                background: dataSourceType === 'csv' ? 'rgba(42, 245, 255, 0.2)' : 'transparent',
                border: dataSourceType === 'csv' ? '1px solid rgba(42, 245, 255, 0.6)' : '1px solid transparent',
                padding: '6px 14px',
              }}
              onMouseEnter={(e) => {
                if (dataSourceType !== 'csv') {
                  e.currentTarget.style.background = 'rgba(42, 245, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (dataSourceType !== 'csv') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              上传 CSV
            </button>
          </div>

          <div style={{
            ...glassStyle,
            borderRadius: '10px',
            padding: '6px',
            display: 'flex',
            gap: 4,
          }}>
            {CAMERA_PRESETS.map((preset, idx) => (
              <button
                key={preset.name}
                onClick={() => onCameraPreset(idx)}
                style={{
                  ...glowButtonStyle,
                  padding: '6px 12px',
                  fontSize: '12px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(42, 245, 255, 0.2)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(42, 245, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(42, 245, 255, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {currentTimestamp && loadingState.status === 'loaded' && (
        <div style={{
          position: 'absolute',
          top: 100,
          right: 30,
          pointerEvents: 'none',
        }}>
          <div style={{
            color: '#2AF5FF',
            fontSize: 11,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: 4,
            textShadow: '0 0 8px rgba(42, 245, 255, 0.6)',
          }}>
            CURRENT TIME
          </div>
          <div style={{
            color: '#fff',
            fontSize: 28,
            fontWeight: 300,
            fontFamily: 'monospace',
            letterSpacing: '2px',
            textShadow: '0 0 20px rgba(42, 245, 255, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)',
            padding: '8px 16px',
            background: 'rgba(11, 13, 23, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(42, 245, 255, 0.1)',
          }}>
            {currentTimestamp}
          </div>
        </div>
      )}

      {loadingState.status === 'loaded' && totalTimeSteps > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(700px, 85vw)',
          pointerEvents: 'auto',
        }}>
          <div style={{
            ...glassStyle,
            borderRadius: '16px',
            padding: '16px 24px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 10,
            }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(42, 245, 255, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
                  border: '1px solid rgba(42, 245, 255, 0.4)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(42, 245, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isPlaying ? '❚❚' : '▶'}
              </button>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={timeProgress}
                  onChange={handleSliderChange}
                  style={{
                    width: '100%',
                    height: 6,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${timeProgress * 100}%`,
                    background: 'linear-gradient(90deg, #2AF5FF 0%, #A855F7 100%)',
                    boxShadow: '0 0 12px rgba(42, 245, 255, 0.6)',
                    transition: 'width 0.1s linear',
                  }} />
                </div>
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                fontFamily: 'monospace',
                minWidth: 70,
                textAlign: 'right',
              }}>
                {currentTimeIndex + 1} / {totalTimeSteps}
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              letterSpacing: '1px',
            }}>
              <span>时间轴</span>
              <span>拖动滑块探索数据演变</span>
            </div>
          </div>
        </div>
      )}

      {loadingState.status === 'loading' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
        }}>
          <div style={{
            ...glassStyle,
            borderRadius: '16px',
            padding: '32px 48px',
            minWidth: 320,
            textAlign: 'center',
          }}>
            <div style={{
              color: '#2AF5FF',
              fontSize: 14,
              letterSpacing: '2px',
              marginBottom: 20,
              textShadow: '0 0 12px rgba(42, 245, 255, 0.5)',
            }}>
              {loadingState.message || '加载中...'}
            </div>
            <div style={{
              width: '100%',
              height: 4,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div
                style={{
                  height: '100%',
                  width: `${loadingState.progress}%`,
                  background: 'linear-gradient(90deg, #2AF5FF 0%, #A855F7 100%)',
                  boxShadow: '0 0 16px rgba(42, 245, 255, 0.8)',
                  transition: 'width 0.15s ease-out',
                }}
              />
            </div>
            <div style={{
              marginTop: 12,
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontFamily: 'monospace',
            }}>
              {loadingState.progress}%
            </div>
          </div>
        </div>
      )}

      {loadingState.status === 'idle' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
        }}>
          <div style={{
            ...glassStyle,
            borderRadius: '20px',
            padding: '40px 60px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 48,
              marginBottom: 16,
            }}>
              📊
            </div>
            <div style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: 600,
              marginBottom: 8,
              letterSpacing: '1px',
            }}>
              3D 数据雕塑
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              marginBottom: 32,
              maxWidth: 300,
            }}>
              将抽象数据转化为可交互的三维艺术形态
            </div>
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
            }}>
              <button
                onClick={onLoadMock}
                style={{
                  ...glowButtonStyle,
                  padding: '12px 28px',
                  fontSize: 14,
                  background: 'linear-gradient(135deg, rgba(42, 245, 255, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
                  border: '1px solid rgba(42, 245, 255, 0.5)',
                }}
              >
                使用模拟数据
              </button>
              <button
                onClick={onUploadCSV}
                style={{
                  ...glowButtonStyle,
                  padding: '12px 28px',
                  fontSize: 14,
                }}
              >
                上传 CSV 文件
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDetail && (
        <div
          onClick={onCloseDetail}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'auto',
            background: popupVisible
              ? 'radial-gradient(circle at center, rgba(168, 85, 247, 0.08) 0%, transparent 70%)'
              : 'transparent',
            opacity: popupVisible ? 1 : 0,
            transition: 'all 0.3s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: popupVisible
                ? 'translate(-50%, -50%) scale(1)'
                : 'translate(-50%, -50%) scale(0.85)',
              opacity: popupVisible ? 1 : 0,
              filter: popupVisible ? 'blur(0px)' : 'blur(10px)',
              transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              ...glassStyle,
              borderRadius: '16px',
              padding: '28px 32px',
              minWidth: 320,
              background: 'rgba(11, 13, 23, 0.85)',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 20,
            }}>
              <div>
                <div style={{
                  color: '#2AF5FF',
                  fontSize: 11,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}>
                  数据详情
                </div>
                <div style={{
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}>
                  {selectedDetail.point.time}
                </div>
              </div>
              <button
                onClick={onCloseDetail}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}>
              <div style={{
                background: 'rgba(42, 245, 255, 0.08)',
                borderRadius: '10px',
                padding: '14px 16px',
                border: '1px solid rgba(42, 245, 255, 0.15)',
              }}>
                <div style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 10,
                  letterSpacing: '2px',
                  marginBottom: 6,
                }}>
                  数值
                </div>
                <div style={{
                  color: '#2AF5FF',
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  textShadow: '0 0 16px rgba(42, 245, 255, 0.5)',
                }}>
                  {selectedDetail.point.value}
                </div>
              </div>

              <div style={{
                background: 'rgba(168, 85, 247, 0.08)',
                borderRadius: '10px',
                padding: '14px 16px',
                border: '1px solid rgba(168, 85, 247, 0.15)',
              }}>
                <div style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 10,
                  letterSpacing: '2px',
                  marginBottom: 6,
                }}>
                  排名
                </div>
                <div style={{
                  color: '#A855F7',
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  textShadow: '0 0 16px rgba(168, 85, 247, 0.5)',
                }}>
                  #{selectedDetail.rank}
                </div>
              </div>

              <div style={{
                gridColumn: '1 / -1',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '10px',
                padding: '14px 16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 10,
                  letterSpacing: '2px',
                  marginBottom: 6,
                }}>
                  类别
                </div>
                <div style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2AF5FF, #A855F7)',
                    boxShadow: '0 0 10px rgba(42, 245, 255, 0.5)',
                  }} />
                  {selectedDetail.point.category}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
