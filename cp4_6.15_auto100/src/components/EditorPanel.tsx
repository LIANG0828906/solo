import { useState, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { BulletPatternType } from '../utils/bulletPhysics';
import ExportModal from './ExportModal';

const patternTypeLabels: Record<BulletPatternType, string> = {
  fan: '扇形弹幕',
  spiral: '螺旋弹幕',
  spread: '散弹弹幕',
};

const presets = [
  { id: 'fan', name: '简单扇形', description: '基础扇形展开弹幕' },
  { id: 'spiral', name: '中等螺旋', description: '旋转发射的螺旋弹幕' },
  { id: 'spread', name: '密集散弹', description: '大范围随机散弹' },
];

const EditorPanel = () => {
  const [showExport, setShowExport] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const draggedWaveIndex = useRef<number | null>(null);

  const patterns = useEditorStore((state) => state.patterns);
  const waves = useEditorStore((state) => state.waves);
  const selectedPatternId = useEditorStore((state) => state.selectedPatternId);
  const selectedWaveId = useEditorStore((state) => state.selectedWaveId);
  const isPlaying = useEditorStore((state) => state.isPlaying);

  const addPattern = useEditorStore((state) => state.addPattern);
  const updatePattern = useEditorStore((state) => state.updatePattern);
  const deletePattern = useEditorStore((state) => state.deletePattern);
  const selectPattern = useEditorStore((state) => state.selectPattern);

  const addWave = useEditorStore((state) => state.addWave);
  const updateWave = useEditorStore((state) => state.updateWave);
  const deleteWave = useEditorStore((state) => state.deleteWave);
  const selectWave = useEditorStore((state) => state.selectWave);
  const reorderWaves = useEditorStore((state) => state.reorderWaves);

  const addPatternToWave = useEditorStore((state) => state.addPatternToWave);
  const removePatternFromWave = useEditorStore(
    (state) => state.removePatternFromWave
  );

  const setPlaying = useEditorStore((state) => state.setPlaying);
  const loadPreset = useEditorStore((state) => state.loadPreset);

  const selectedPattern = patterns.find((p) => p.id === selectedPatternId);
  const selectedWave = waves.find((w) => w.id === selectedWaveId);

  const handleDragStart = (index: number) => {
    draggedWaveIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedWaveIndex.current === null) return;
    if (draggedWaveIndex.current === index) return;
    reorderWaves(draggedWaveIndex.current, index);
    draggedWaveIndex.current = index;
  };

  const handleDragEnd = () => {
    draggedWaveIndex.current = null;
  };

  const panelContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#1e2a45 #121928',
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid #1e2a45',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#00d4ff',
            fontFamily: "'Oxanium', sans-serif",
            letterSpacing: 1,
          }}
        >
          弹幕编辑器
        </h1>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: 11,
            color: '#5a6a8a',
          }}
        >
          Bullet Hell Editor
        </p>
      </div>

      <div
        style={{
          padding: 12,
          borderBottom: '1px solid #1e2a45',
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          onClick={() => setPlaying(!isPlaying)}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: isPlaying ? '#ff6b35' : '#00d4ff',
            color: '#0a0e17',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: "'Oxanium', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            transition: 'all 0.3s ease-out',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button
          onClick={() => setShowExport(true)}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'transparent',
            color: '#00d4ff',
            border: '1px solid #00d4ff',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: "'Oxanium', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            transition: 'all 0.3s ease-out',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          导出 JSON
        </button>
      </div>

      <div
        style={{
          padding: 12,
          borderBottom: '1px solid #1e2a45',
        }}
      >
        <SectionTitle>预设模板</SectionTitle>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 8,
          }}
        >
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset.id)}
              style={{
                padding: '10px 12px',
                background: '#0f1624',
                border: '1px solid #1e2a45',
                borderRadius: 6,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00d4ff';
                e.currentTarget.style.background = '#121928';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1e2a45';
                e.currentTarget.style.background = '#0f1624';
              }}
            >
              <div
                style={{
                  color: '#e0e8f5',
                  fontWeight: 500,
                  fontSize: 13,
                  fontFamily: "'Oxanium', sans-serif",
                }}
              >
                {preset.name}
              </div>
              <div
                style={{
                  color: '#5a6a8a',
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: 12,
          borderBottom: '1px solid #1e2a45',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <SectionTitle>弹幕样式</SectionTitle>
          <button
            onClick={() => addPattern('fan')}
            style={{
              padding: '4px 10px',
              background: '#00d4ff',
              color: '#0a0e17',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Oxanium', sans-serif",
              transition: 'all 0.3s ease-out',
            }}
          >
            + 新增
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 8,
          }}
        >
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => selectPattern(pattern.id)}
              style={{
                padding: '6px 10px',
                background:
                  selectedPatternId === pattern.id
                    ? 'linear-gradient(135deg, #00d4ff, #0099cc)'
                    : '#0f1624',
                color: selectedPatternId === pattern.id ? '#0a0e17' : '#e0e8f5',
                border:
                  selectedPatternId === pattern.id
                    ? '1px solid #00d4ff'
                    : '1px solid #1e2a45',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: "'Oxanium', sans-serif",
                fontWeight: 500,
                transition: 'all 0.3s ease-out',
              }}
            >
              {patternTypeLabels[pattern.type]}
            </button>
          ))}
        </div>

        {selectedPattern && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: '#0f1624',
              borderRadius: 8,
              border: '1px solid #1e2a45',
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
              <select
                value={selectedPattern.type}
                onChange={(e) =>
                  updatePattern(selectedPattern.id, {
                    type: e.target.value as BulletPatternType,
                  })
                }
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: '#121928',
                  color: '#e0e8f5',
                  border: '1px solid #1e2a45',
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: "'Oxanium', sans-serif",
                  cursor: 'pointer',
                }}
              >
                <option value="fan">扇形弹幕</option>
                <option value="spiral">螺旋弹幕</option>
                <option value="spread">散弹弹幕</option>
              </select>
              <button
                onClick={() => deletePattern(selectedPattern.id)}
                style={{
                  marginLeft: 8,
                  padding: '6px 10px',
                  background: 'transparent',
                  color: '#ff6b35',
                  border: '1px solid #ff6b35',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: "'Oxanium', sans-serif",
                }}
              >
                删除
              </button>
            </div>

            <SliderControl
              label="发射角度范围"
              value={selectedPattern.angleRange}
              min={10}
              max={360}
              unit="°"
              onChange={(v) =>
                updatePattern(selectedPattern.id, { angleRange: v })
              }
            />
            <SliderControl
              label="子弹速度"
              value={selectedPattern.bulletSpeed}
              min={0.5}
              max={10}
              step={0.1}
              unit=""
              onChange={(v) =>
                updatePattern(selectedPattern.id, { bulletSpeed: v })
              }
            />
            <SliderControl
              label="子弹密度"
              value={selectedPattern.bulletDensity}
              min={1}
              max={50}
              step={1}
              unit="颗"
              onChange={(v) =>
                updatePattern(selectedPattern.id, { bulletDensity: v })
              }
            />

            <div style={{ marginTop: 12 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: '#5a6a8a',
                  marginBottom: 6,
                  fontFamily: "'Oxanium', sans-serif",
                }}
              >
                颜色渐变
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <input
                  type="color"
                  value={selectedPattern.colorStart}
                  onChange={(e) =>
                    updatePattern(selectedPattern.id, {
                      colorStart: e.target.value,
                    })
                  }
                  style={{
                    width: 32,
                    height: 24,
                    border: '1px solid #1e2a45',
                    borderRadius: 4,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    background: `linear-gradient(to right, ${selectedPattern.colorStart}, ${selectedPattern.colorEnd})`,
                    borderRadius: 2,
                  }}
                />
                <input
                  type="color"
                  value={selectedPattern.colorEnd}
                  onChange={(e) =>
                    updatePattern(selectedPattern.id, {
                      colorEnd: e.target.value,
                    })
                  }
                  style={{
                    width: 32,
                    height: 24,
                    border: '1px solid #1e2a45',
                    borderRadius: 4,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <input
                type="checkbox"
                id="gravity"
                checked={selectedPattern.gravityEnabled}
                onChange={(e) =>
                  updatePattern(selectedPattern.id, {
                    gravityEnabled: e.target.checked,
                  })
                }
                style={{
                  width: 16,
                  height: 16,
                  accentColor: '#00d4ff',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="gravity"
                style={{
                  fontSize: 12,
                  color: '#e0e8f5',
                  fontFamily: "'Oxanium', sans-serif",
                  cursor: 'pointer',
                }}
              >
                启用重力
              </label>
            </div>

            {selectedPattern.gravityEnabled && (
              <SliderControl
                label="重力强度"
                value={selectedPattern.gravityStrength}
                min={0.01}
                max={0.5}
                step={0.01}
                unit=""
                onChange={(v) =>
                  updatePattern(selectedPattern.id, {
                    gravityStrength: v,
                  })
                }
              />
            )}
          </div>
        )}
      </div>

      <div
        style={{
          padding: 12,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <SectionTitle>波次管理</SectionTitle>
          <button
            onClick={addWave}
            style={{
              padding: '4px 10px',
              background: '#00d4ff',
              color: '#0a0e17',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Oxanium', sans-serif",
              transition: 'all 0.3s ease-out',
            }}
          >
            + 新增
          </button>
        </div>

        <div
          style={{
            marginTop: 8,
            position: 'relative',
            height: 40,
            background: '#0f1624',
            borderRadius: 6,
            border: '1px solid #1e2a45',
            overflow: 'hidden',
          }}
        >
          {waves.map((wave) => {
            const totalTime = Math.max(
              ...waves.map((w) => w.triggerTime + w.duration),
              10
            );
            const left = (wave.triggerTime / totalTime) * 100;
            const width = (wave.duration / totalTime) * 100;

            return (
              <div
                key={wave.id}
                onClick={() => selectWave(wave.id)}
                style={{
                  position: 'absolute',
                  top: 6,
                  left: `${left}%`,
                  width: `${width}%`,
                  height: 28,
                  background: `linear-gradient(90deg, ${wave.color}33, ${wave.color}cc)`,
                  borderLeft: `2px solid ${wave.color}`,
                  borderRight: `2px solid ${wave.color}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  opacity: selectedWaveId === wave.id ? 1 : 0.7,
                  transition: 'all 0.3s ease-out',
                  minWidth: 20,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 9,
                    color: '#fff',
                    fontFamily: "'Oxanium', sans-serif",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '80%',
                  }}
                >
                  {wave.name}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 12,
          }}
        >
          {waves.map((wave, index) => (
            <div
              key={wave.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => selectWave(wave.id)}
              style={{
                padding: 12,
                background:
                  selectedWaveId === wave.id ? '#121928' : '#0f1624',
                border:
                  selectedWaveId === wave.id
                    ? `1px solid ${wave.color}`
                    : '1px solid #1e2a45',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.3s ease-out',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    cursor: 'grab',
                    padding: '2px 4px',
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 2,
                      background: '#3a4a6a',
                      borderRadius: 1,
                    }}
                  />
                  <div
                    style={{
                      width: 12,
                      height: 2,
                      background: '#3a4a6a',
                      borderRadius: 1,
                    }}
                  />
                  <div
                    style={{
                      width: 12,
                      height: 2,
                      background: '#3a4a6a',
                      borderRadius: 1,
                    }}
                  />
                </div>

                <div
                  style={{
                    width: 4,
                    height: 24,
                    background: wave.color,
                    borderRadius: 2,
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#e0e8f5',
                      fontFamily: "'Oxanium', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {wave.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#5a6a8a',
                      marginTop: 2,
                    }}
                  >
                    {wave.patterns.length} 种弹幕 · {wave.duration}s
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteWave(wave.id);
                  }}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    color: '#ff6b35',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedWave && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: '#0f1624',
              borderRadius: 8,
              border: '1px solid #1e2a45',
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: '#00d4ff',
                fontFamily: "'Oxanium', sans-serif",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              波次设置
            </div>

            <div
              style={{
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: '#5a6a8a',
                  marginBottom: 4,
                  fontFamily: "'Oxanium', sans-serif",
                }}
              >
                波次名称
              </label>
              <input
                type="text"
                value={selectedWave.name}
                onChange={(e) =>
                  updateWave(selectedWave.id, { name: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: '#121928',
                  color: '#e0e8f5',
                  border: '1px solid #1e2a45',
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: "'Oxanium', sans-serif",
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <SliderControl
              label="生成间隔"
              value={selectedWave.spawnInterval}
              min={0.2}
              max={5}
              step={0.1}
              unit="s"
              onChange={(v) =>
                updateWave(selectedWave.id, { spawnInterval: v })
              }
            />
            <SliderControl
              label="生成位置 X"
              value={selectedWave.spawnPositionX}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(v) =>
                updateWave(selectedWave.id, { spawnPositionX: v })
              }
            />
            <SliderControl
              label="触发时间"
              value={selectedWave.triggerTime}
              min={0}
              max={60}
              step={0.5}
              unit="s"
              onChange={(v) =>
                updateWave(selectedWave.id, { triggerTime: v })
              }
            />
            <SliderControl
              label="持续时间"
              value={selectedWave.duration}
              min={1}
              max={30}
              step={0.5}
              unit="s"
              onChange={(v) =>
                updateWave(selectedWave.id, { duration: v })
              }
            />

            <div
              style={{
                marginTop: 12,
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: '#5a6a8a',
                  marginBottom: 6,
                  fontFamily: "'Oxanium', sans-serif",
                }}
              >
                弹幕样式（最多 3 种）
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                {patterns.map((pattern) => {
                  const isInWave = selectedWave.patterns.includes(pattern.id);
                  return (
                    <button
                      key={pattern.id}
                      onClick={() => {
                        if (isInWave) {
                          removePatternFromWave(selectedWave.id, pattern.id);
                        } else if (selectedWave.patterns.length < 3) {
                          addPatternToWave(selectedWave.id, pattern.id);
                        }
                      }}
                      style={{
                        padding: '5px 10px',
                        background: isInWave
                          ? 'linear-gradient(135deg, #00d4ff, #0099cc)'
                          : '#0f1624',
                        color: isInWave ? '#0a0e17' : '#e0e8f5',
                        border: isInWave
                          ? '1px solid #00d4ff'
                          : '1px solid #1e2a45',
                        borderRadius: 4,
                        cursor:
                          isInWave || selectedWave.patterns.length < 3
                            ? 'pointer'
                            : 'not-allowed',
                        fontSize: 10,
                        fontFamily: "'Oxanium', sans-serif",
                        opacity:
                          !isInWave && selectedWave.patterns.length >= 3
                            ? 0.5
                            : 1,
                        transition: 'all 0.3s ease-out',
                      }}
                    >
                      {patternTypeLabels[pattern.type]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: '#5a6a8a',
                  marginBottom: 6,
                  fontFamily: "'Oxanium', sans-serif",
                }}
              >
                波次颜色
              </label>
              <input
                type="color"
                value={selectedWave.color}
                onChange={(e) =>
                  updateWave(selectedWave.id, { color: e.target.value })
                }
                style={{
                  width: '100%',
                  height: 28,
                  border: '1px solid #1e2a45',
                  borderRadius: 4,
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        style={{
          display: 'none',
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 100,
          padding: '10px 16px',
          background: '#121928',
          color: '#00d4ff',
          border: '1px solid #00d4ff',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: "'Oxanium', sans-serif",
          fontWeight: 600,
        }}
      >
        ☰ 编辑器
      </button>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 320,
          background: '#121928',
          borderRight: '1px solid #1e2a45',
          height: '100vh',
          transition: 'all 0.3s ease-out',
        }}
        className="editor-panel"
      >
        {panelContent}
      </div>

      {isMobileOpen && (
        <div
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 200,
          }}
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            style={{
              width: 320,
              height: '100%',
              background: '#121928',
              animation: 'slideIn 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {panelContent}
          </div>
        </div>
      )}

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 12,
      fontWeight: 600,
      color: '#8a9aba',
      fontFamily: "'Oxanium', sans-serif",
      letterSpacing: 1,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}

const SliderControl = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: SliderControlProps) => {
  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <label
          style={{
            fontSize: 11,
            color: '#5a6a8a',
            fontFamily: "'Oxanium', sans-serif",
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontSize: 11,
            color: '#00d4ff',
            fontFamily: "'Oxanium', monospace",
            fontWeight: 500,
          }}
        >
          {value.toFixed(step < 1 ? 1 : 0)}
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
          background: '#1e2a45',
          borderRadius: 2,
          outline: 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
          cursor: 'pointer',
        }}
        className="custom-slider"
      />
    </div>
  );
};

export default EditorPanel;
