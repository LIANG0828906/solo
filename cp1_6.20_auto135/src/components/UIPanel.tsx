import React, { useState, useEffect } from 'react';
import {
  Stratum,
  Fault,
  FaultType,
  GeologyTemplate,
  loadTemplates,
  STRATUM_COLOR_PALETTE
} from '@utils/geologyData';
import type { CameraMode, SectionCut } from '../App';

interface UIPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  strata: Stratum[];
  faults: Fault[];
  modelSize: { x: number; y: number; z: number };
  cameraMode: CameraMode;
  templateName: string;
  sectionCut: SectionCut | null;
  onUpdateStratum: (id: string, updates: Partial<Stratum>) => void;
  onAddStratum: () => void;
  onRemoveStratum: (id: string) => void;
  onUpdateFault: (id: string, updates: Partial<Fault>) => void;
  onAddFault: () => void;
  onRemoveFault: (id: string) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  onTemplateNameChange: (name: string) => void;
  onSaveTemplate: () => void;
  onLoadTemplate: (template: GeologyTemplate) => void;
  onModelSizeChange: (size: { x: number; y: number; z: number }) => void;
  onSectionCutChange: (cut: SectionCut | null) => void;
  onReset: () => void;
}

type TabType = 'strata' | 'faults' | 'section' | 'view' | 'template';

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <div style={{ marginBottom: 8 }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        color: '#ccc',
        marginBottom: 4
      }}
    >
      <span>{label}</span>
      <span style={{ color: '#5B9BD5', fontWeight: 'bold' }}>
        {value.toFixed(step < 1 ? 2 : 0)}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{
        width: '100%',
        height: 4,
        appearance: 'none',
        background: '#444',
        borderRadius: 2,
        outline: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    />
    <style>{`
      input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 14px;
        height: 14px;
        background: #5B9BD5;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 0 0 0 rgba(91,155,213,0.4);
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 0 4px rgba(91,155,213,0.2);
      }
      input[type="range"]:active::-webkit-slider-thumb {
        transform: scale(1.1);
      }
    `}</style>
  </div>
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: React.CSSProperties;
}> = ({ children, onClick, variant = 'secondary', disabled, style }) => {
  const bgColors = {
    primary: '#5B9BD5',
    secondary: '#3a3a4a',
    danger: '#c0392b'
  };
  const hoverColors = {
    primary: '#7AB0E0',
    secondary: '#4a4a5a',
    danger: '#e74c3c'
  };
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 12px',
        border: 'none',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        fontWeight: 500,
        color: '#ffffff',
        backgroundColor: disabled ? '#555' : hovered ? hoverColors[variant] : bgColors[variant],
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        boxShadow: hovered && !disabled ? '0 2px 8px rgba(91,155,213,0.3)' : 'none',
        ...style
      }}
    >
      {children}
    </button>
  );
};

const UIPanel: React.FC<UIPanelProps> = ({
  isOpen,
  onToggle,
  strata,
  faults,
  modelSize,
  cameraMode,
  templateName,
  sectionCut,
  onUpdateStratum,
  onAddStratum,
  onRemoveStratum,
  onUpdateFault,
  onAddFault,
  onRemoveFault,
  onCameraModeChange,
  onTemplateNameChange,
  onSaveTemplate,
  onLoadTemplate,
  onModelSizeChange,
  onSectionCutChange,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('strata');
  const [savedTemplates, setSavedTemplates] = useState<GeologyTemplate[]>([]);
  const [expandedStratum, setExpandedStratum] = useState<string | null>(null);
  const [expandedFault, setExpandedFault] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsNarrow(window.innerWidth < 1600);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    loadTemplates().then((templates) => {
      setSavedTemplates(templates);
    });
  }, []);

  const panelWidth = isNarrow ? 280 : 340;

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'strata', label: '地层', icon: '📊' },
    { key: 'faults', label: '断层', icon: '⚡' },
    { key: 'section', label: '剖面', icon: '✂️' },
    { key: 'view', label: '视角', icon: '👁️' },
    { key: 'template', label: '模板', icon: '💾' }
  ];

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: 16,
          left: isOpen ? panelWidth + 16 : 16,
          zIndex: 200,
          width: 40,
          height: 40,
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          backgroundColor: 'rgba(30,30,40,0.85)',
          color: '#5B9BD5',
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease-in-out',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        {isOpen ? '◀' : '☰'}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: panelWidth,
            maxHeight: 'calc(100vh - 32px)',
            backgroundColor: 'rgba(30,30,40,0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#ffffff',
                margin: 0
              }}
            >
              🪨 地质可视化控制台
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              overflowX: 'auto'
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  minWidth: isNarrow ? 50 : 60,
                  padding: '10px 4px',
                  border: 'none',
                  backgroundColor: activeTab === tab.key ? 'rgba(91,155,213,0.2)' : 'transparent',
                  color: activeTab === tab.key ? '#5B9BD5' : '#aaa',
                  cursor: 'pointer',
                  fontSize: isNarrow ? 10 : 11,
                  transition: 'all 0.2s ease',
                  borderBottom: activeTab === tab.key ? '2px solid #5B9BD5' : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{ fontSize: 14, marginBottom: 2 }}>{tab.icon}</div>
                {tab.label}
              </button>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16
            }}
          >
            {activeTab === 'strata' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}
                >
                  <span style={{ color: '#ccc', fontSize: 12 }}>
                    地层列表 ({strata.length}/7)
                  </span>
                  <Button
                    onClick={onAddStratum}
                    variant="primary"
                    disabled={strata.length >= 7}
                  >
                    + 添加
                  </Button>
                </div>

                {strata.map((stratum, idx) => (
                  <div
                    key={stratum.id}
                    style={{
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${expandedStratum === stratum.id ? stratum.color : 'rgba(255,255,255,0.1)'}`,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div
                      onClick={() =>
                        setExpandedStratum(
                          expandedStratum === stratum.id ? null : stratum.id
                        )
                      }
                      style={{
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 3,
                            backgroundColor: stratum.color,
                            border: '1px solid rgba(255,255,255,0.3)'
                          }}
                        />
                        <div>
                          <div style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>
                            {idx + 1}. {stratum.name}
                          </div>
                          <div style={{ color: '#888', fontSize: 10 }}>
                            {stratum.lithologyCode} · {stratum.thickness}m
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {strata.length > 4 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveStratum(stratum.id);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#c0392b',
                              cursor: 'pointer',
                              fontSize: 14,
                              padding: 4
                            }}
                          >
                            ✕
                          </button>
                        )}
                        <span style={{ color: '#666', fontSize: 12 }}>
                          {expandedStratum === stratum.id ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>

                    {expandedStratum === stratum.id && (
                      <div
                        style={{
                          padding: '0 12px 12px 12px',
                          borderTop: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <div style={{ marginTop: 12 }}>
                          <div
                            style={{
                              color: '#ccc',
                              fontSize: 11,
                              marginBottom: 4
                            }}
                          >
                            名称
                          </div>
                          <input
                            type="text"
                            value={stratum.name}
                            onChange={(e) =>
                              onUpdateStratum(stratum.id, { name: e.target.value })
                            }
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              backgroundColor: 'rgba(0,0,0,0.4)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 4,
                              color: '#fff',
                              fontSize: 12,
                              outline: 'none',
                              transition: 'border-color 0.2s ease'
                            }}
                          />
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <div
                            style={{
                              color: '#ccc',
                              fontSize: 11,
                              marginBottom: 4
                            }}
                          >
                            岩性代号
                          </div>
                          <input
                            type="text"
                            value={stratum.lithologyCode}
                            onChange={(e) =>
                              onUpdateStratum(stratum.id, {
                                lithologyCode: e.target.value
                              })
                            }
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              backgroundColor: 'rgba(0,0,0,0.4)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 4,
                              color: '#fff',
                              fontSize: 12,
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <Slider
                            label="厚度"
                            value={stratum.thickness}
                            min={5}
                            max={100}
                            unit="m"
                            onChange={(v) =>
                              onUpdateStratum(stratum.id, { thickness: v })
                            }
                          />
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <Slider
                            label="纹理密度"
                            value={stratum.textureDensity}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={(v) =>
                              onUpdateStratum(stratum.id, { textureDensity: v })
                            }
                          />
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <div
                            style={{
                              color: '#ccc',
                              fontSize: 11,
                              marginBottom: 6
                            }}
                          >
                            颜色
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: 6,
                              flexWrap: 'wrap'
                            }}
                          >
                            {STRATUM_COLOR_PALETTE.map((color) => (
                              <button
                                key={color}
                                onClick={() =>
                                  onUpdateStratum(stratum.id, { color })
                                }
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 4,
                                  backgroundColor: color,
                                  border:
                                    stratum.color === color
                                      ? '2px solid #fff'
                                      : '2px solid transparent',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'faults' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                  }}
                >
                  <span style={{ color: '#ccc', fontSize: 12 }}>
                    断层列表 ({faults.length}/3)
                  </span>
                  <Button
                    onClick={onAddFault}
                    variant="primary"
                    disabled={faults.length >= 3}
                  >
                    + 添加
                  </Button>
                </div>

                {faults.map((fault, idx) => (
                  <div
                    key={fault.id}
                    style={{
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${expandedFault === fault.id ? '#5B9BD5' : 'rgba(255,255,255,0.1)'}`,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div
                      onClick={() =>
                        setExpandedFault(expandedFault === fault.id ? null : fault.id)
                      }
                      style={{
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            backgroundColor:
                              fault.type === 'normal'
                                ? 'rgba(52,152,219,0.3)'
                                : 'rgba(230,126,34,0.3)',
                            color:
                              fault.type === 'normal' ? '#3498db' : '#e67e22',
                            fontSize: 10,
                            fontWeight: 'bold'
                          }}
                        >
                          {fault.type === 'normal' ? '正断层' : '逆断层'}
                        </div>
                        <div style={{ color: '#fff', fontSize: 12 }}>
                          断层 {idx + 1}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {faults.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFault(fault.id);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#c0392b',
                              cursor: 'pointer',
                              fontSize: 14,
                              padding: 4
                            }}
                          >
                            ✕
                          </button>
                        )}
                        <span style={{ color: '#666', fontSize: 12 }}>
                          {expandedFault === fault.id ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>

                    {expandedFault === fault.id && (
                      <div
                        style={{
                          padding: '0 12px 12px 12px',
                          borderTop: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <div style={{ marginTop: 12 }}>
                          <div
                            style={{
                              color: '#ccc',
                              fontSize: 11,
                              marginBottom: 6
                            }}
                          >
                            类型
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {(['normal', 'reverse'] as FaultType[]).map((type) => (
                              <button
                                key={type}
                                onClick={() => onUpdateFault(fault.id, { type })}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  border: 'none',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  backgroundColor:
                                    fault.type === type
                                      ? type === 'normal'
                                        ? 'rgba(52,152,219,0.4)'
                                        : 'rgba(230,126,34,0.4)'
                                      : 'rgba(255,255,255,0.05)',
                                  color:
                                    fault.type === type ? '#fff' : '#888',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {type === 'normal' ? '正断层' : '逆断层'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <Slider
                            label="倾角"
                            value={fault.dip}
                            min={20}
                            max={85}
                            unit="°"
                            onChange={(v) => onUpdateFault(fault.id, { dip: v })}
                          />
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <Slider
                            label="走向"
                            value={fault.strike}
                            min={0}
                            max={360}
                            unit="°"
                            onChange={(v) => onUpdateFault(fault.id, { strike: v })}
                          />
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <Slider
                            label="断距"
                            value={fault.throw}
                            min={5}
                            max={50}
                            unit="m"
                            onChange={(v) => onUpdateFault(fault.id, { throw: v })}
                          />
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <Slider
                            label="位置"
                            value={fault.position}
                            min={0.1}
                            max={0.9}
                            step={0.05}
                            onChange={(v) =>
                              onUpdateFault(fault.id, { position: v })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'section' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#ccc', fontSize: 12, marginBottom: 8 }}>
                    剖面切割
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <button
                        key={axis}
                        onClick={() => {
                          const currentPos = sectionCut?.position ??
                            (axis === 'x' ? modelSize.x / 2 :
                             axis === 'y' ? modelSize.y / 2 : modelSize.z / 2);
                          onSectionCutChange({
                            axis,
                            position: currentPos,
                            enabled: !(sectionCut?.axis === axis && sectionCut.enabled)
                          });
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 'bold',
                          backgroundColor:
                            sectionCut?.axis === axis && sectionCut.enabled
                              ? 'rgba(91,155,213,0.4)'
                              : 'rgba(255,255,255,0.05)',
                          color:
                            sectionCut?.axis === axis && sectionCut.enabled
                              ? '#5B9BD5'
                              : '#888',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {axis.toUpperCase()}轴
                      </button>
                    ))}
                  </div>
                </div>

                {sectionCut && sectionCut.enabled && (
                  <>
                    <Slider
                      label={`${sectionCut.axis.toUpperCase()}轴位置`}
                      value={sectionCut.position}
                      min={
                        sectionCut.axis === 'x'
                          ? 10
                          : sectionCut.axis === 'y'
                          ? 10
                          : 10
                      }
                      max={
                        sectionCut.axis === 'x'
                          ? modelSize.x - 10
                          : sectionCut.axis === 'y'
                          ? modelSize.y - 10
                          : modelSize.z - 10
                      }
                      unit="m"
                      onChange={(v) =>
                        onSectionCutChange({ ...sectionCut, position: v })
                      }
                    />
                    <Button
                      onClick={() => onSectionCutChange(null)}
                      variant="danger"
                      style={{ width: '100%', marginTop: 12 }}
                    >
                      关闭剖面
                    </Button>
                  </>
                )}

                {(!sectionCut || !sectionCut.enabled) && (
                  <div
                    style={{
                      padding: 20,
                      textAlign: 'center',
                      color: '#666',
                      fontSize: 12
                    }}
                  >
                    选择坐标轴启用剖面切割
                  </div>
                )}
              </div>
            )}

            {activeTab === 'view' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#ccc', fontSize: 12, marginBottom: 8 }}>
                    视角模式
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => onCameraModeChange('auto')}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        backgroundColor:
                          cameraMode === 'auto'
                            ? 'rgba(91,155,213,0.4)'
                            : 'rgba(255,255,255,0.05)',
                        color: cameraMode === 'auto' ? '#5B9BD5' : '#888',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🔄 自动旋转
                    </button>
                    <button
                      onClick={() => onCameraModeChange('manual')}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        backgroundColor:
                          cameraMode === 'manual'
                            ? 'rgba(91,155,213,0.4)'
                            : 'rgba(255,255,255,0.05)',
                        color: cameraMode === 'manual' ? '#5B9BD5' : '#888',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🎮 手动漫游
                    </button>
                  </div>
                </div>

                {cameraMode === 'manual' && (
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderRadius: 6,
                      marginBottom: 16
                    }}
                  >
                    <div style={{ color: '#5B9BD5', fontSize: 11, fontWeight: 'bold', marginBottom: 8 }}>
                      操作说明
                    </div>
                    <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.8 }}>
                      <div>• W/A/S/D: 前后左右移动</div>
                      <div>• 鼠标拖拽: 环视四周</div>
                      <div>• 相机不会穿透模型</div>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 8, color: '#ccc', fontSize: 12 }}>
                  模型尺寸
                </div>
                <Slider
                  label="X (宽度)"
                  value={modelSize.x}
                  min={100}
                  max={400}
                  unit="m"
                  onChange={(v) => onModelSizeChange({ ...modelSize, x: v })}
                />
                <Slider
                  label="Y (长度)"
                  value={modelSize.y}
                  min={100}
                  max={400}
                  unit="m"
                  onChange={(v) => onModelSizeChange({ ...modelSize, y: v })}
                />
                <Slider
                  label="Z (高度)"
                  value={modelSize.z}
                  min={80}
                  max={300}
                  unit="m"
                  onChange={(v) => onModelSizeChange({ ...modelSize, z: v })}
                />

                <Button
                  onClick={onReset}
                  variant="secondary"
                  style={{ width: '100%', marginTop: 16 }}
                >
                  🔄 重置为默认
                </Button>
              </div>
            )}

            {activeTab === 'template' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#ccc', fontSize: 11, marginBottom: 4 }}>
                    模板名称
                  </div>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => onTemplateNameChange(e.target.value)}
                    placeholder="输入模板名称..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 4,
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                </div>

                <Button
                  onClick={onSaveTemplate}
                  variant="primary"
                  style={{ width: '100%', marginBottom: 16 }}
                >
                  💾 保存当前参数为模板
                </Button>

                <div style={{ color: '#ccc', fontSize: 12, marginBottom: 8 }}>
                  已保存模板 ({savedTemplates.length})
                </div>

                {savedTemplates.length === 0 ? (
                  <div
                    style={{
                      padding: 20,
                      textAlign: 'center',
                      color: '#666',
                      fontSize: 12
                    }}
                  >
                    暂无保存的模板
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {savedTemplates.map((template) => (
                      <div
                        key={template.id}
                        style={{
                          padding: 10,
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => onLoadTemplate(template)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(91,155,213,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)';
                        }}
                      >
                        <div
                          style={{
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 4
                          }}
                        >
                          {template.name}
                        </div>
                        <div style={{ color: '#666', fontSize: 10 }}>
                          {template.strata.length} 层 · {template.faults.length} 条断层
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UIPanel;
