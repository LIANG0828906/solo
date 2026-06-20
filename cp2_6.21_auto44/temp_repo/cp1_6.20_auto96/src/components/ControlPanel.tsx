import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { COLORS, HISTORY_FRAMES, FRAME_INTERVAL, ZONE_RANGES } from '../utils/constants';
import { getColorByMode } from '../utils/colorMapping';
import type { FilterZone, DisplayMode } from '../types';

export function ControlPanel() {
  const mode = useStore((state) => state.mode);
  const filter = useStore((state) => state.filter);
  const progress = useStore((state) => state.progress);
  const selectedId = useStore((state) => state.selectedId);
  const items = useStore((state) => state.items);
  const setMode = useStore((state) => state.setMode);
  const setFilter = useStore((state) => state.setFilter);
  const setProgress = useStore((state) => state.setProgress);
  const setSelectedId = useStore((state) => state.setSelectedId);
  const getCurrentFrameData = useStore((state) => state.getCurrentFrameData);

  const [isPlaying, setIsPlaying] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const playIntervalRef = useRef<number | null>(null);

  const selectedCabinet = items.find((item) => item.id === selectedId);
  const selectedFrameData = selectedCabinet
    ? getCurrentFrameData(selectedCabinet.id)
    : null;

  const currentTimestamp = selectedFrameData?.timestamp
    ? new Date(selectedFrameData.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  const frameIndex = Math.floor(progress * (HISTORY_FRAMES - 1));
  const timeOffset = frameIndex * FRAME_INTERVAL;

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1 / (HISTORY_FRAMES - 1) / 10;
          if (next >= 1) {
            setIsPlaying(false);
            return 1;
          }
          return next;
        });
      }, 100);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, setProgress]);

  const filterOptions: { value: FilterZone; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'A', label: `A区（机柜${ZONE_RANGES.A.start}-${ZONE_RANGES.A.end}）` },
    { value: 'B', label: `B区（机柜${ZONE_RANGES.B.start}-${ZONE_RANGES.B.end}）` },
    { value: 'C', label: `C区（机柜${ZONE_RANGES.C.start}-${ZONE_RANGES.C.end}）` },
  ];

  const handleModeChange = (newMode: DisplayMode) => {
    setMode(newMode);
  };

  const handleFilterChange = (value: FilterZone) => {
    setFilter(value);
    setDropdownOpen(false);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setProgress(value);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetProgress = () => {
    setProgress(0);
    setIsPlaying(false);
  };

  const formatValue = (value: number) => {
    return mode === 'power'
      ? `${Math.round(value)} W`
      : `${value.toFixed(1)} °C`;
  };

  return (
    <div
      className="control-panel"
      style={{
        width: 320,
        height: '100%',
        background: COLORS.panel,
        color: COLORS.text,
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          margin: 0,
          marginBottom: 16,
          color: COLORS.text,
          letterSpacing: 1,
        }}
      >
        数据中心监控
      </h1>

      <div
        style={{
          height: 1,
          background: 'rgba(255,255,255,0.1)',
          marginBottom: 16,
        }}
      />

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            fontSize: 13,
            color: COLORS.textSecondary,
            marginBottom: 10,
            display: 'block',
          }}
        >
          数据维度
        </label>
        <div
          style={{
            display: 'flex',
            background: COLORS.primary,
            borderRadius: 20,
            padding: 3,
            gap: 2,
          }}
        >
          {(['power', 'temperature'] as DisplayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 18,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s ease',
                background: mode === m ? COLORS.accent : 'transparent',
                color: mode === m ? '#fff' : COLORS.text,
              }}
            >
              {m === 'power' ? '功耗' : '温度'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            fontSize: 13,
            color: COLORS.textSecondary,
            marginBottom: 10,
            display: 'block',
          }}
        >
          机柜分组
        </label>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: COLORS.primary,
              color: COLORS.text,
              fontSize: 14,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              {filterOptions.find((o) => o.value === filter)?.label}
            </span>
            <span style={{ fontSize: 12 }}>{dropdownOpen ? '▲' : '▼'}</span>
          </button>
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                background: COLORS.primary,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 10,
                overflow: 'hidden',
              }}
            >
              {filterOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleFilterChange(option.value)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'background 0.15s',
                    background:
                      filter === option.value
                        ? 'rgba(233, 69, 96, 0.3)'
                        : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== option.value) {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== option.value) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: 'rgba(255,255,255,0.1)',
          marginBottom: 16,
        }}
      />

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <label
            style={{
              fontSize: 13,
              color: COLORS.textSecondary,
            }}
          >
            历史回放
          </label>
          <span
            style={{
              fontSize: 12,
              color: COLORS.text,
              fontFamily: 'monospace',
            }}
          >
            {currentTimestamp}
          </span>
        </div>

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 20,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 4,
              background: COLORS.primary,
              borderRadius: 2,
              transform: 'translateY(-50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: `${progress * 100}%`,
              height: 4,
              background: COLORS.accent,
              borderRadius: 2,
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          {Array.from({ length: HISTORY_FRAMES }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${(i / (HISTORY_FRAMES - 1)) * 100}%`,
                width: 3,
                height: 3,
                background: 'rgba(255,255,255,0.4)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          ))}
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={handleProgressChange}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `calc(${progress * 100}% - 8px)`,
              width: 16,
              height: 16,
              background: COLORS.accent,
              borderRadius: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              boxShadow: `0 2px 8px ${COLORS.accent}66`,
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <button
            onClick={resetProgress}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: COLORS.text,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            重置
          </button>
          <button
            onClick={togglePlay}
            style={{
              padding: '6px 24px',
              borderRadius: 6,
              border: 'none',
              background: COLORS.accent,
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isPlaying ? '暂停' : '播放'}
          </button>
        </div>

        <div
          style={{
            marginTop: 8,
            textAlign: 'center',
            fontSize: 11,
            color: COLORS.textSecondary,
          }}
        >
          第 {frameIndex + 1} 帧 / 共 {HISTORY_FRAMES} 帧
          {isPlaying && ' · 播放中'}
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: 'rgba(255,255,255,0.1)',
          marginBottom: 16,
        }}
      />

      {selectedCabinet && selectedFrameData ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                margin: 0,
                color: COLORS.text,
              }}
            >
              机柜详情
            </h3>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.textSecondary,
                cursor: 'pointer',
                fontSize: 16,
                padding: 2,
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: getColorByMode(
                  mode === 'power'
                    ? selectedFrameData.power
                    : selectedFrameData.temperature,
                  mode
                ),
                boxShadow: `0 2px 12px ${getColorByMode(
                  mode === 'power'
                    ? selectedFrameData.power
                    : selectedFrameData.temperature,
                  mode
                )}66`,
              }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                机柜 #{selectedCabinet.cabinetId}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                {selectedCabinet.zone} 区
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textSecondary,
                  marginBottom: 4,
                }}
              >
                功耗
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {Math.round(selectedFrameData.power)} W
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textSecondary,
                  marginBottom: 4,
                }}
              >
                温度
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {selectedFrameData.temperature.toFixed(1)} °C
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            color: COLORS.textSecondary,
            fontSize: 13,
            padding: '20px 0',
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>🖱️</div>
          双击机柜查看详细信息
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div
        style={{
          fontSize: 11,
          color: COLORS.textSecondary,
          textAlign: 'center',
          opacity: 0.6,
        }}
      >
        36 个机柜 · 实时监控
      </div>
    </div>
  );
}
