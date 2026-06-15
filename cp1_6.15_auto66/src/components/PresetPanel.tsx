import '../styles.css';
import React, { useState, useRef } from 'react';
import { X, Save, Trash2, Play, AlertTriangle } from 'lucide-react';
import type { Preset } from '../PresetManager';

export interface PresetPanelProps {
  isOpen: boolean;
  presets: Preset[];
  currentPresetId?: string;
  readOnly: boolean;
  onClose: () => void;
  onLoadPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  onSaveNewPreset?: (name: string) => void;
  storageFull?: boolean;
  onClearSpace?: () => void;
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

const generateWaveformBars = (count: number): number[] => {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    bars.push(0.3 + Math.random() * 0.7);
  }
  return bars;
};

export const PresetPanel: React.FC<PresetPanelProps> = ({
  isOpen,
  presets,
  currentPresetId,
  readOnly,
  onClose,
  onLoadPreset,
  onDeletePreset,
  onSaveNewPreset,
  storageFull = false,
  onClearSpace,
}) => {
  const [inputName, setInputName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [waveformCache] = useState<Map<string, number[]>>(new Map());

  const getWaveformBars = (id: string): number[] => {
    if (!waveformCache.has(id)) {
      waveformCache.set(id, generateWaveformBars(40));
    }
    return waveformCache.get(id)!;
  };

  const handleSave = () => {
    if (!inputName.trim() || !onSaveNewPreset) return;
    onSaveNewPreset(inputName.trim());
    setInputName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeletePreset(id);
  };

  const handleCardClick = (id: string) => {
    onLoadPreset(id);
  };

  const panelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const titleStyle: React.CSSProperties = {
    color: '#e0e0e0',
    fontSize: '16px',
    fontWeight: 600,
  };

  const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#a0a0b8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  };

  const warningBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'rgba(239, 68, 68, 0.15)',
    borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    fontSize: '13px',
  };

  const clearBtnStyle: React.CSSProperties = {
    marginLeft: 'auto',
    padding: '4px 10px',
    fontSize: '12px',
    background: 'rgba(239, 68, 68, 0.3)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '4px',
    color: '#fca5a5',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const saveAreaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s ease',
  };

  const saveBtnStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  };

  const emptyStateStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#a0a0b8',
    fontSize: '14px',
    gap: '8px',
  };

  const emptyStateTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#e0e0e0',
  };

  const cardStyle: React.CSSProperties = {
    background: '#0f172a',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'filter 0.2s ease, border-color 0.2s ease',
    border: '2px solid transparent',
  };

  const cardActiveStyle: React.CSSProperties = {
    ...cardStyle,
    borderColor: '#a855f7',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  };

  const presetNameStyle: React.CSSProperties = {
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    marginRight: '8px',
  };

  const deleteBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#a0a0b8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  };

  const waveformContainerStyle: React.CSSProperties = {
    height: '40px',
    marginBottom: '10px',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    padding: '4px 6px',
    overflow: 'hidden',
  };

  const waveformBarStyle = (height: number): React.CSSProperties => ({
    flex: 1,
    minWidth: '2px',
    maxWidth: '6px',
    height: `${height * 100}%`,
    background: 'linear-gradient(180deg, #60a5fa, #93c5fd)',
    borderRadius: '1px',
  });

  const cardFooterStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const dateStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '12px',
  };

  const loadBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    background: 'linear-gradient(90deg, rgba(15, 52, 96, 0.8), rgba(83, 52, 131, 0.8))',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'filter 0.2s ease',
  };

  return (
    <>
      {isOpen && <div className="preset-mask" onClick={onClose} />}
      <div className={`preset-panel ${isOpen ? 'open' : ''}`} style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>预设列表</span>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#e0e0e0';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a0a0b8';
              e.currentTarget.style.background = 'none';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {storageFull && (
          <div style={warningBarStyle}>
            <AlertTriangle size={16} />
            <span>存储空间不足，请删除一些预设</span>
            {onClearSpace && (
              <button
                style={clearBtnStyle}
                onClick={onClearSpace}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                清理
              </button>
            )}
          </div>
        )}

        {!readOnly && onSaveNewPreset && (
          <div style={saveAreaStyle}>
            <input
              ref={inputRef}
              type="text"
              style={inputStyle}
              placeholder="输入预设名称..."
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(96, 165, 250, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              }}
            />
            <button
              className="btn"
              style={saveBtnStyle}
              onClick={handleSave}
              disabled={!inputName.trim()}
            >
              <Save size={14} />
            </button>
          </div>
        )}

        {presets.length === 0 ? (
          <div style={emptyStateStyle}>
            <span style={emptyStateTitleStyle}>暂无预设</span>
            <span>保存你的第一个预设吧</span>
          </div>
        ) : (
          <div style={listStyle}>
            {presets.map((preset) => {
              const isActive = currentPresetId === preset.id;
              const bars = getWaveformBars(preset.id);
              return (
                <div
                  key={preset.id}
                  style={isActive ? cardActiveStyle : cardStyle}
                  onClick={() => handleCardClick(preset.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  <div style={cardHeaderStyle}>
                    <span style={presetNameStyle}>{preset.name}</span>
                    {!readOnly && (
                      <button
                        style={deleteBtnStyle}
                        onClick={(e) => handleDelete(e, preset.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#a0a0b8';
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div style={waveformContainerStyle}>
                    {bars.map((bar, index) => (
                      <div key={index} style={waveformBarStyle(bar)} />
                    ))}
                  </div>

                  <div style={cardFooterStyle}>
                    <span style={dateStyle}>{formatDate(preset.createdAt)}</span>
                    <button
                      style={loadBtnStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(preset.id);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'brightness(1)';
                      }}
                    >
                      <Play size={12} />
                      加载
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default PresetPanel;
