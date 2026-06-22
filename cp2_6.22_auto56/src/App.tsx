import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BezierEditor from './BezierEditor';
import TimelineEditor from './TimelineEditor';
import AnimationPreview from './AnimationPreview';
import {
  builtInPresets,
  loadCustomPresets,
  saveCustomPresets,
  type BezierPreset,
  type KeyframeData,
  type PresetConfig,
} from './presets';

const defaultKeyframes = (): KeyframeData[] => [
  { id: 'k1', time: 0, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
  { id: 'k2', time: 1, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
];

const BezierThumbnail: React.FC<{ cp1: [number, number]; cp2: [number, number]; width?: number; height?: number }> = ({
  cp1,
  cp2,
  width = 60,
  height = 40,
}) => {
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const p0 = [pad, pad + h] as const;
  const p1 = [pad + cp1[0] * w, pad + h - cp1[1] * h] as const;
  const p2 = [pad + cp2[0] * w, pad + h - cp2[1] * h] as const;
  const p3 = [pad + w, pad] as const;

  const d = `M ${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
  const lineD = `M ${p0[0]} ${p0[1]} L ${p3[0]} ${p3[1]}`;

  return (
    <svg width={width} height={height} style={{ flexShrink: 0 }}>
      <rect x={0} y={0} width={width} height={height} fill="#0d0d1f" rx={4} />
      <path d={lineD} stroke="#2a2a4a" strokeWidth={1} strokeDasharray="2 2" fill="none" />
      <path d={d} stroke="url(#grad)" strokeWidth={2} fill="none" strokeLinecap="round" />
      <defs>
        <linearGradient id="grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00ff88" />
          <stop offset="100%" stopColor="#00d4ff" />
        </linearGradient>
      </defs>
      <circle cx={p1[0]} cy={p1[1]} r={2} fill="#00ff88" />
      <circle cx={p2[0]} cy={p2[1]} r={2} fill="#00d4ff" />
    </svg>
  );
};

const App: React.FC = () => {
  const [compareMode, setCompareMode] = useState(false);
  const [cp1L, setCp1L] = useState<[number, number]>([0.25, 0.1]);
  const [cp2L, setCp2L] = useState<[number, number]>([0.25, 1.0]);
  const [keyframesL, setKeyframesL] = useState<KeyframeData[]>(defaultKeyframes);
  const [cp1R, setCp1R] = useState<[number, number]>([0.25, 0.1]);
  const [cp2R, setCp2R] = useState<[number, number]>([0.25, 1.0]);
  const [keyframesR, setKeyframesR] = useState<KeyframeData[]>(defaultKeyframes);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [duration, setDuration] = useState(2000);
  const [customPresets, setCustomPresets] = useState<PresetConfig[]>([]);
  const [activeSide, setActiveSide] = useState<'L' | 'R'>('L');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [renamingPresetId, setRenamingPresetId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    setCustomPresets(loadCustomPresets());
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewportWidth < 768;

  const applyPreset = useCallback(
    (preset: PresetConfig) => {
      const target = compareMode ? activeSide : 'L';
      const kfCopy = preset.keyframes.map((k) => ({ ...k }));
      if (target === 'L') {
        setCp1L([...preset.bezier.cp1]);
        setCp2L([...preset.bezier.cp2]);
        setKeyframesL(kfCopy);
      } else {
        setCp1R([...preset.bezier.cp1]);
        setCp2R([...preset.bezier.cp2]);
        setKeyframesR(kfCopy);
      }
    },
    [compareMode, activeSide]
  );

  const handleSavePreset = useCallback(() => {
    if (!newPresetName.trim()) return;
    const target = compareMode ? activeSide : 'L';
    const cp1 = target === 'L' ? cp1L : cp1R;
    const cp2 = target === 'L' ? cp2L : cp2R;
    const kf = target === 'L' ? keyframesL : keyframesR;

    const bezier: BezierPreset = {
      id: uuidv4(),
      name: newPresetName.trim(),
      cp1: [...cp1],
      cp2: [...cp2],
    };
    const newPreset: PresetConfig = {
      id: uuidv4(),
      name: newPresetName.trim(),
      bezier,
      keyframes: kf.map((k) => ({ ...k })),
      isCustom: true,
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setNewPresetName('');
    setSaveModalOpen(false);
  }, [newPresetName, compareMode, activeSide, cp1L, cp2L, keyframesL, cp1R, cp2R, keyframesR, customPresets]);

  const handleDeletePreset = useCallback(
    (id: string) => {
      const updated = customPresets.filter((p) => p.id !== id);
      setCustomPresets(updated);
      saveCustomPresets(updated);
    },
    [customPresets]
  );

  const handleStartRename = useCallback((preset: PresetConfig) => {
    setRenamingPresetId(preset.id);
    setRenamingName(preset.name);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (!renamingPresetId || !renamingName.trim()) {
      setRenamingPresetId(null);
      return;
    }
    const updated = customPresets.map((p) =>
      p.id === renamingPresetId
        ? { ...p, name: renamingName.trim(), bezier: { ...p.bezier, name: renamingName.trim() } }
        : p
    );
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setRenamingPresetId(null);
    setRenamingName('');
  }, [renamingPresetId, renamingName, customPresets]);

  const handlePlayToggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleProgressChange = useCallback((progress: number) => {
    setAnimationProgress(progress);
  }, []);

  const handleBezierChangeL = useCallback((newCp1: [number, number], newCp2: [number, number]) => {
    setCp1L(newCp1);
    setCp2L(newCp2);
  }, []);

  const handleBezierChangeR = useCallback((newCp1: [number, number], newCp2: [number, number]) => {
    setCp1R(newCp1);
    setCp2R(newCp2);
  }, []);

  const presetButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '8px 10px',
    background: '#0d0d1f',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    cursor: 'pointer',
    color: '#e0e0e0',
    fontSize: 12,
    textAlign: 'left' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    position: 'relative',
  };

  const allPresets = useMemo(() => [...builtInPresets, ...customPresets], [customPresets]);

  const renderPresetList = () => (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: 8,
        padding: 14,
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
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
        <span
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: '#00d4ff',
            letterSpacing: 0.5,
          }}
        >
          预设库
        </span>
        <button
          onClick={() => setSaveModalOpen(true)}
          style={{
            padding: '4px 10px',
            background: 'transparent',
            border: '1px solid #00ff88',
            color: '#00ff88',
            borderRadius: 4,
            fontSize: 11,
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 8px rgba(0,255,136,0.4)';
            e.currentTarget.style.background = 'rgba(0,255,136,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          + 保存为预设
        </button>
      </div>

      {compareMode && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 12,
            padding: 4,
            background: '#0d0d1f',
            borderRadius: 6,
          }}
        >
          {(['L', 'R'] as const).map((side) => (
            <button
              key={side}
              onClick={() => setActiveSide(side)}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: 'none',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                background: activeSide === side ? '#00d4ff' : 'transparent',
                color: activeSide === side ? '#1a1a2e' : '#8888aa',
                transition: 'all 0.2s',
              }}
            >
              应用到 {side === 'L' ? 'A' : 'B'}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
        <div
          style={{
            fontSize: 10,
            color: '#8888aa',
            padding: '4px 2px',
            textTransform: 'uppercase' as const,
            letterSpacing: 1,
          }}
        >
          内置预设
        </div>
        {builtInPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            style={presetButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00d4ff';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0,212,255,0.25)';
              e.currentTarget.style.background = '#12122a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a2a4a';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#0d0d1f';
            }}
          >
            <BezierThumbnail cp1={preset.bezier.cp1} cp2={preset.bezier.cp2} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 12 }}>{preset.name}</div>
              <div
                style={{
                  fontSize: 9,
                  color: '#666688',
                  fontFamily: 'monospace',
                  marginTop: 2,
                }}
              >
                {preset.keyframes.length} keyframes
              </div>
            </div>
          </button>
        ))}

        {customPresets.length > 0 && (
          <>
            <div
              style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent, #2a2a4a, transparent)',
                margin: '8px 0 4px',
              }}
            />
            <div
              style={{
                fontSize: 10,
                color: '#8888aa',
                padding: '4px 2px',
                textTransform: 'uppercase' as const,
                letterSpacing: 1,
              }}
            >
              自定义预设
            </div>
            {customPresets.map((preset) => (
              <div
                key={preset.id}
                onMouseEnter={() => setHoveredPresetId(preset.id)}
                onMouseLeave={() => setHoveredPresetId(null)}
                style={{ position: 'relative' }}
              >
                {renamingPresetId === preset.id ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      padding: '8px 10px',
                      background: '#0d0d1f',
                      border: '1px solid #00ff88',
                      borderRadius: 6,
                      boxShadow: '0 0 8px rgba(0,255,136,0.2)',
                    }}
                  >
                    <input
                      type="text"
                      value={renamingName}
                      onChange={(e) => setRenamingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename();
                        if (e.key === 'Escape') setRenamingPresetId(null);
                      }}
                      autoFocus
                      style={{
                        flex: 1,
                        background: '#1a1a2e',
                        border: '1px solid #2a2a4a',
                        borderRadius: 4,
                        color: '#e0e0e0',
                        padding: '4px 8px',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleConfirmRename}
                      style={{
                        padding: '4px 8px',
                        background: '#00ff88',
                        border: 'none',
                        borderRadius: 4,
                        color: '#1a1a2e',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setRenamingPresetId(null)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px solid #444466',
                        borderRadius: 4,
                        color: '#8888aa',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => applyPreset(preset)}
                    style={presetButtonStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00ff88';
                      e.currentTarget.style.boxShadow = '0 0 8px rgba(0,255,136,0.25)';
                      e.currentTarget.style.background = '#12122a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a4a';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.background = '#0d0d1f';
                    }}
                  >
                    <BezierThumbnail cp1={preset.bezier.cp1} cp2={preset.bezier.cp2} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{preset.name}</div>
                      <div
                        style={{
                          fontSize: 9,
                          color: '#666688',
                          fontFamily: 'monospace',
                          marginTop: 2,
                        }}
                      >
                        {preset.keyframes.length} keyframes
                      </div>
                    </div>
                    {hoveredPresetId === preset.id && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          gap: 4,
                          zIndex: 5,
                        }}
                      >
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(preset);
                          }}
                          style={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#1a1a2e',
                            border: '1px solid #444466',
                            borderRadius: 4,
                            color: '#00d4ff',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#00d4ff';
                            e.currentTarget.style.boxShadow = '0 0 6px rgba(0,212,255,0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#444466';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          ✎
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                          style={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#1a1a2e',
                            border: '1px solid #444466',
                            borderRadius: 4,
                            color: '#ff4466',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#ff4466';
                            e.currentTarget.style.boxShadow = '0 0 6px rgba(255,68,102,0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#444466';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          ✕
                        </span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {saveModalOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            zIndex: 50,
          }}
          onClick={() => setSaveModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a2e',
              border: '1px solid #2a2a4a',
              borderRadius: 8,
              padding: 18,
              width: '85%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#00ff88',
                marginBottom: 12,
              }}
            >
              保存为预设
            </div>
            <input
              type="text"
              placeholder="输入预设名称"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePreset();
                if (e.key === 'Escape') setSaveModalOpen(false);
              }}
              autoFocus
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#0d0d1f',
                border: '1px solid #2a2a4a',
                borderRadius: 6,
                color: '#e0e0e0',
                padding: '8px 12px',
                fontSize: 13,
                outline: 'none',
                marginBottom: 12,
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00ff88';
                e.currentTarget.style.boxShadow = '0 0 8px rgba(0,255,136,0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#2a2a4a';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSavePreset}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#00ff88',
                  border: 'none',
                  borderRadius: 6,
                  color: '#1a1a2e',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(0,255,136,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setSaveModalOpen(false);
                  setNewPresetName('');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid #444466',
                  borderRadius: 6,
                  color: '#8888aa',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#666688';
                  e.currentTarget.style.color = '#e0e0e0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#444466';
                  e.currentTarget.style.color = '#8888aa';
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSinglePanel = () => (
    <div
      style={{
        display: isMobile ? 'flex' : undefined,
        flexDirection: isMobile ? 'column' : undefined,
        gap: 16,
        flex: 1,
        minHeight: 0,
      }}
    >
      <div
        style={{
          width: isMobile ? '100%' : 420,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxSizing: 'border-box',
        }}
      >
        {renderPresetList()}
        <BezierEditor
          cp1={cp1L}
          cp2={cp2L}
          onChange={handleBezierChangeL}
          isPlaying={isPlaying}
          animationProgress={animationProgress}
        />
        <TimelineEditor
          keyframes={keyframesL}
          onChange={setKeyframesL}
          isPlaying={isPlaying}
          animationProgress={animationProgress}
          duration={duration}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, minHeight: isMobile ? 500 : 0 }}>
        <AnimationPreview
          cp1={cp1L}
          cp2={cp2L}
          keyframes={keyframesL}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
          duration={duration}
          onProgressChange={handleProgressChange}
        />
      </div>
    </div>
  );

  const renderComparePanel = (side: 'L' | 'R') => {
    const label = side === 'L' ? 'A' : 'B';
    const cp1 = side === 'L' ? cp1L : cp1R;
    const cp2 = side === 'L' ? cp2L : cp2R;
    const kf = side === 'L' ? keyframesL : keyframesR;
    const onBezierChange = side === 'L' ? handleBezierChangeL : handleBezierChangeR;
    const onKeyframeChange = side === 'L' ? setKeyframesL : setKeyframesR;
    const badgeColor = side === 'L' ? '#00ff88' : '#00d4ff';

    return (
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 12,
          padding: 12,
          background: 'rgba(255,255,255,0.015)',
          borderRadius: 10,
          border: `1px solid ${badgeColor}33`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: 16,
            padding: '2px 10px',
            background: badgeColor,
            color: '#1a1a2e',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 700,
            boxShadow: `0 0 8px ${badgeColor}66`,
            zIndex: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: isMobile ? '100%' : 340,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: 8,
          }}
        >
          <BezierEditor
            cp1={cp1}
            cp2={cp2}
            onChange={onBezierChange}
            isPlaying={isPlaying}
            animationProgress={animationProgress}
          />
          <TimelineEditor
            keyframes={kf}
            onChange={onKeyframeChange}
            isPlaying={isPlaying}
            animationProgress={animationProgress}
            duration={duration}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0, minHeight: 480, marginTop: 8 }}>
          <AnimationPreview
            cp1={cp1}
            cp2={cp2}
            keyframes={kf}
            isPlaying={isPlaying}
            onPlayToggle={handlePlayToggle}
            duration={duration}
            onProgressChange={side === 'L' ? handleProgressChange : () => {}}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d0d1f',
        color: '#e0e0e0',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: isMobile ? '12px 14px' : '16px 24px',
          background: 'linear-gradient(180deg, rgba(0,255,136,0.04), transparent)',
          borderBottom: '1px solid #2a2a4a',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: isMobile ? 16 : 20,
            fontWeight: 700,
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ color: '#00ff88', textShadow: '0 0 12px rgba(0,255,136,0.4)' }}>贝塞尔曲线</span>
          <span style={{ color: '#8888aa' }}>&</span>
          <span style={{ color: '#00d4ff', textShadow: '0 0 12px rgba(0,212,255,0.4)' }}>关键帧动画编辑器</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <button
            onClick={() => {
              setCompareMode((prev) => !prev);
              setIsPlaying(false);
              setAnimationProgress(0);
            }}
            style={{
              padding: '7px 14px',
              background: compareMode ? '#00d4ff' : 'transparent',
              border: `1px solid ${compareMode ? '#00d4ff' : '#2a2a4a'}`,
              borderRadius: 6,
              color: compareMode ? '#1a1a2e' : '#e0e0e0',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!compareMode) {
                e.currentTarget.style.borderColor = '#00d4ff';
                e.currentTarget.style.boxShadow = '0 0 8px rgba(0,212,255,0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!compareMode) {
                e.currentTarget.style.borderColor = '#2a2a4a';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {compareMode ? '✓ 分屏对比' : '分屏对比'}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: '#1a1a2e',
              border: '1px solid #2a2a4a',
              borderRadius: 6,
              transition: 'border-color 0.2s',
            }}
          >
            <span style={{ fontSize: 11, color: '#8888aa' }}>时长</span>
            <input
              type="number"
              min={100}
              max={5000}
              step={100}
              value={duration}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 100;
                setDuration(Math.max(100, Math.min(5000, val)));
              }}
              style={{
                width: 70,
                background: '#0d0d1f',
                border: '1px solid #2a2a4a',
                borderRadius: 4,
                color: '#e0e0e0',
                padding: '4px 6px',
                fontSize: 12,
                outline: 'none',
                fontFamily: 'monospace',
                textAlign: 'right' as const,
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#444466';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2a4a';
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00d4ff';
                e.currentTarget.style.boxShadow = '0 0 6px rgba(0,212,255,0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#2a2a4a';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <span style={{ fontSize: 11, color: '#8888aa' }}>ms</span>
          </div>

          <button
            onClick={handlePlayToggle}
            style={{
              padding: '7px 16px',
              background: isPlaying ? '#ff4466' : '#00ff88',
              border: 'none',
              borderRadius: 6,
              color: '#1a1a2e',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, transform 0.1s',
              letterSpacing: 0.5,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = isPlaying
                ? '0 0 12px rgba(255,68,102,0.5)'
                : '0 0 12px rgba(0,255,136,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.96)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>

          <button
            onClick={() => setSaveModalOpen(true)}
            style={{
              padding: '7px 14px',
              background: 'transparent',
              border: '1px solid #00ff88',
              borderRadius: 6,
              color: '#00ff88',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0,255,136,0.3)';
              e.currentTarget.style.background = 'rgba(0,255,136,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            保存为预设
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: isMobile ? 12 : 16,
          display: 'flex',
          flexDirection: isMobile || !compareMode ? 'column' : 'row',
          gap: isMobile || !compareMode ? 0 : 14,
          minHeight: 0,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {compareMode ? (
          <>
            {renderComparePanel('L')}
            {renderComparePanel('R')}
          </>
        ) : (
          renderSinglePanel()
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; height: 100%; background: #0d0d1f; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0d0d1f; }
        ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a3a5a; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0.5; }
      `}</style>
    </div>
  );
};

export default App;
