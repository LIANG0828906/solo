import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { MoodType, MOOD_COLORS, MOOD_LABELS } from '../types';
import { useAppStore } from '../store';
import { initScene, getSceneAPI, SceneAPI } from '../scene';

const MOOD_EMOJIS: Record<MoodType, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  calm: '😌',
  anxious: '😰'
};

const MoodInputPanel: React.FC<{
  selectedMood: MoodType | null;
  onSelectMood: (mood: MoodType) => void;
  intensity: number;
  onIntensityChange: (value: number) => void;
  onGenerate: () => void;
}> = ({ selectedMood, onSelectMood, intensity, onIntensityChange, onGenerate }) => {
  const moods: MoodType[] = ['happy', 'sad', 'angry', 'calm', 'anxious'];

  return (
    <div style={{
      width: 320,
      background: 'rgba(26, 26, 46, 0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: 16,
      border: '1px solid #2A2A44',
      padding: 24,
      color: '#fff',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }}>
      <div style={{
        fontSize: 20,
        fontWeight: 600,
        background: 'linear-gradient(90deg, #4ECDC4, #FFD93D)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        心情记录
      </div>

      <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 4 }}>
        选择当前情绪
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8
      }}>
        {moods.map((mood) => (
          <button
            key={mood}
            onClick={() => onSelectMood(mood)}
            title={MOOD_LABELS[mood]}
            style={{
              aspectRatio: '1',
              borderRadius: 12,
              border: selectedMood === mood
                ? `2px solid ${MOOD_COLORS[mood]}`
                : '1px solid #2A2A44',
              background: selectedMood === mood
                ? `${MOOD_COLORS[mood]}33`
                : 'rgba(255, 255, 255, 0.03)',
              cursor: 'pointer',
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease-in-out',
              transform: selectedMood === mood ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: selectedMood === mood
                ? `0 6px 20px ${MOOD_COLORS[mood]}44`
                : '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (selectedMood !== mood) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = `${MOOD_COLORS[mood]}22`;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedMood !== mood) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }
            }}
          >
            {MOOD_EMOJIS[mood]}
          </button>
        ))}
      </div>

      {selectedMood && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          padding: '8px 12px',
          background: `${MOOD_COLORS[selectedMood]}1A`,
          borderRadius: 10,
          borderLeft: `3px solid ${MOOD_COLORS[selectedMood]}`
        }}>
          <span style={{ fontSize: 18 }}>{MOOD_EMOJIS[selectedMood]}</span>
          <span style={{ color: '#c9d1d9' }}>{MOOD_LABELS[selectedMood]}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          color: '#8b949e'
        }}>
          <span>情绪强度</span>
          <span style={{
            fontSize: 16,
            fontWeight: 600,
            color: selectedMood ? MOOD_COLORS[selectedMood] : '#4ECDC4'
          }}>
            {intensity}
          </span>
        </div>

        <div style={{ position: 'relative', height: 4 }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: '#2A2A44',
            borderRadius: 4
          }} />
          <div style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            width: `${((intensity - 1) / 9) * 100}%`,
            background: selectedMood
              ? `linear-gradient(90deg, ${MOOD_COLORS[selectedMood]}88, ${MOOD_COLORS[selectedMood]})`
              : 'linear-gradient(90deg, #4ECDC488, #4ECDC4)',
            borderRadius: 4,
            transition: 'width 0.3s ease-in-out, background 0.3s ease-in-out'
          }} />
          <input
            type="range"
            min={1}
            max={10}
            value={intensity}
            onChange={(e) => onIntensityChange(Number(e.target.value))}
            style={{
              position: 'absolute',
              top: -8, left: 0, right: 0,
              width: '100%',
              height: 20,
              opacity: 0,
              cursor: 'pointer',
              zIndex: 10
            }}
          />
          <div style={{
            position: 'absolute',
            top: -6,
            left: `calc(${((intensity - 1) / 9) * 100}% - 8px)`,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: selectedMood ? MOOD_COLORS[selectedMood] : '#4ECDC4',
            boxShadow: `0 0 12px ${selectedMood ? MOOD_COLORS[selectedMood] : '#4ECDC4'}88`,
            transition: 'left 0.3s ease-in-out, background 0.3s ease-in-out',
            pointerEvents: 'none'
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#484f58'
        }}>
          <span>微弱</span>
          <span>强烈</span>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={!selectedMood}
        style={{
          width: '100%',
          padding: '14px 20px',
          borderRadius: 10,
          border: 'none',
          background: selectedMood
            ? `linear-gradient(135deg, #4ECDC4, ${MOOD_COLORS[selectedMood]})`
            : 'linear-gradient(135deg, #2A2A44, #1A1A2E)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: selectedMood ? 'pointer' : 'not-allowed',
          opacity: selectedMood ? 1 : 0.5,
          transition: 'all 0.3s ease-in-out',
          transform: selectedMood ? 'translateY(0)' : 'translateY(0)',
          boxShadow: selectedMood
            ? `0 2px 16px #4ECDC444`
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
          letterSpacing: 1
        }}
        onMouseEnter={(e) => {
          if (selectedMood) {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 6px 24px #4ECDC466';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          if (selectedMood) {
            e.currentTarget.style.boxShadow = '0 2px 16px #4ECDC444';
          }
        }}
      >
        生成雕塑 ✨
      </button>

      <div style={{
        fontSize: 11,
        color: '#484f58',
        textAlign: 'center',
        lineHeight: 1.6
      }}>
        💡 提示：拖拽旋转场景 · 滚轮缩放 · 双击雕塑聚焦
      </div>
    </div>
  );
};

const DonutChart: React.FC<{
  moodCounts: Record<MoodType, number>;
  filterMood: MoodType | null;
  onFilter: (mood: MoodType | null) => void;
}> = ({ moodCounts, filterMood, onFilter }) => {
  const moods: MoodType[] = ['happy', 'sad', 'angry', 'calm', 'anxious'];
  const total = moods.reduce((sum, m) => sum + moodCounts[m], 0);
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 60;
  const innerR = 40;

  const arcs = useMemo(() => {
    if (total === 0) return [];

    let startAngle = -Math.PI / 2;
    return moods.map((mood) => {
      const count = moodCounts[mood];
      const sweep = (count / total) * Math.PI * 2;
      const endAngle = startAngle + sweep;

      const x1 = cx + outerR * Math.cos(startAngle);
      const y1 = cy + outerR * Math.sin(startAngle);
      const x2 = cx + outerR * Math.cos(endAngle);
      const y2 = cy + outerR * Math.sin(endAngle);
      const x3 = cx + innerR * Math.cos(endAngle);
      const y3 = cy + innerR * Math.sin(endAngle);
      const x4 = cx + innerR * Math.cos(startAngle);
      const y4 = cy + innerR * Math.sin(startAngle);

      const largeArc = sweep > Math.PI ? 1 : 0;
      const path = [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');

      const result = {
        mood,
        path,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        midAngle: startAngle + sweep / 2
      };

      startAngle = endAngle;
      return result;
    });
  }, [moodCounts, total]);

  return (
    <div style={{
      width: 200,
      background: 'rgba(13, 17, 23, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: 12,
      border: '1px solid #2A2A44',
      padding: 16,
      color: '#fff',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ color: '#c9d1d9' }}>情绪统计</span>
        <span style={{
          fontSize: 11,
          color: '#8b949e',
          fontWeight: 400
        }}>
          共 {total} 个
        </span>
      </div>

      {total === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: size,
          color: '#484f58',
          fontSize: 12
        }}>
          暂无记录
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
            {arcs.map((arc) => {
              const isActive = filterMood === null || filterMood === arc.mood;
              return (
                <path
                  key={arc.mood}
                  d={arc.path}
                  fill={MOOD_COLORS[arc.mood]}
                  opacity={isActive ? 1 : 0.25}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    stroke: filterMood === arc.mood ? '#fff' : 'transparent',
                    strokeWidth: filterMood === arc.mood ? 2 : 0
                  }}
                  onClick={() => onFilter(filterMood === arc.mood ? null : arc.mood)}
                />
              );
            })}
            <circle cx={cx} cy={cy} r={innerR - 1} fill="#0D1117" />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              background: filterMood
                ? MOOD_COLORS[filterMood]
                : 'linear-gradient(90deg, #4ECDC4, #FF6B6B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {filterMood ? moodCounts[filterMood] : total}
            </div>
            <div style={{
              fontSize: 9,
              color: '#8b949e',
              marginTop: 2
            }}>
              {filterMood ? MOOD_LABELS[filterMood] : '总数'}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {moods.map((mood) => (
          <div
            key={mood}
            onClick={() => onFilter(filterMood === mood ? null : mood)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              cursor: 'pointer',
              background: filterMood === mood ? `${MOOD_COLORS[mood]}22` : 'transparent',
              transition: 'all 0.2s ease-in-out',
              opacity: filterMood === null || filterMood === mood ? 1 : 0.4
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: MOOD_COLORS[mood],
                boxShadow: `0 0 8px ${MOOD_COLORS[mood]}66`
              }} />
              <span style={{ fontSize: 11, color: '#c9d1d9' }}>{MOOD_LABELS[mood]}</span>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: MOOD_COLORS[mood]
            }}>
              {moodCounts[mood]}
            </span>
          </div>
        ))}
      </div>

      {filterMood && (
        <button
          onClick={() => onFilter(null)}
          style={{
            marginTop: 10,
            width: '100%',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #2A2A44',
            background: 'rgba(255, 255, 255, 0.03)',
            color: '#8b949e',
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.color = '#8b949e';
          }}
        >
          清除筛选
        </button>
      )}
    </div>
  );
};

const Tooltip: React.FC<{
  visible: boolean;
  x: number;
  y: number;
  label: string;
  date: string;
  color: string;
}> = ({ visible, x, y, label, date, color }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: x + 12,
        top: y + 12,
        zIndex: 1000,
        pointerEvents: 'none',
        padding: '10px 14px',
        background: 'rgba(13, 17, 23, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 10,
        border: `1px solid ${color}44`,
        boxShadow: `0 4px 20px ${color}33`,
        color: '#fff',
        whiteSpace: 'nowrap'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
      </div>
      <div style={{ fontSize: 11, color: '#8b949e' }}>{date}</div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    label: '',
    date: '',
    color: ''
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneAPIRef = useRef<SceneAPI | null>(null);

  const { sculptures, filterMood, focusedSculptureId } = useAppStore();
  const addSculpture = useAppStore((s) => s.addSculpture);
  const setFilterMood = useAppStore((s) => s.setFilterMood);

  const moodCounts = useMemo(() => {
    const counts: Record<MoodType, number> = {
      happy: 0, sad: 0, angry: 0, calm: 0, anxious: 0
    };
    sculptures.forEach((s) => {
      counts[s.mood]++;
    });
    return counts;
  }, [sculptures]);

  useEffect(() => {
    if (!containerRef.current) return;

    const api = initScene(containerRef.current);
    sceneAPIRef.current = api;

    const seedData: { mood: MoodType; intensity: number; daysAgo: number }[] = [
      { mood: 'happy', intensity: 8, daysAgo: 5 },
      { mood: 'calm', intensity: 6, daysAgo: 4 },
      { mood: 'anxious', intensity: 7, daysAgo: 3 },
      { mood: 'sad', intensity: 4, daysAgo: 2 },
      { mood: 'happy', intensity: 9, daysAgo: 1 }
    ];

    seedData.forEach((seed, idx) => {
      setTimeout(() => {
        const data = addSculpture(seed.mood, seed.intensity);
        if (idx < seedData.length - 1) {
          data.createdAt = new Date(Date.now() - seed.daysAgo * 24 * 60 * 60 * 1000);
        }
        const api = getSceneAPI();
        if (api) {
          const updated = useAppStore.getState().sculptures.find(s => s.id === data.id);
          if (updated) api.addSculpture(updated);
        }
      }, idx * 350);
    });

    return () => {
      api.dispose();
    };
  }, []);

  useEffect(() => {
    const api = sceneAPIRef.current;
    if (api) {
      api.updateShelf();
    }
  }, [sculptures]);

  useEffect(() => {
    const api = sceneAPIRef.current;
    if (api) {
      api.updateFilter(filterMood);
    }
  }, [filterMood]);

  const handleGenerate = useCallback(() => {
    if (!selectedMood) return;

    const data = addSculpture(selectedMood, intensity);
    const api = getSceneAPI();
    if (api) {
      const updated = useAppStore.getState().sculptures.find(s => s.id === data.id);
      if (updated) api.addSculpture(updated);
    }

    setSelectedMood(null);
    setIntensity(5);
  }, [selectedMood, intensity, addSculpture]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const api = sceneAPIRef.current;
      if (!api || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouse = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
      };

      const raycaster = new (require('three') as typeof import('three')).Raycaster();
      raycaster.setFromCamera(mouse, api.camera);

      const allMeshes: import('three').Object3D[] = [];
      const meshToId = new Map<import('three').Object3D, string>();
      api.sculptureMeshes.forEach((sm, id) => {
        allMeshes.push(sm.mainMesh);
        meshToId.set(sm.mainMesh, id);
      });

      const intersects = raycaster.intersectObjects(allMeshes);
      if (intersects.length > 0) {
        const id = meshToId.get(intersects[0].object);
        if (id) {
          const data = sculptures.find(s => s.id === id);
          if (data) {
            setTooltip({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              label: `${MOOD_LABELS[data.mood]} · 强度 ${data.intensity}`,
              date: data.createdAt.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
              color: MOOD_COLORS[data.mood]
            });
            return;
          }
        }
      }

      if (tooltip.visible) {
        setTooltip(t => ({ ...t, visible: false }));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sculptures, tooltip.visible]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#0D1117',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />

      <div style={{
        position: 'absolute',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          background: 'linear-gradient(90deg, #4ECDC4, #FFD93D, #FF6B6B)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: 2
        }}>
          Mood Sculpture 3D
        </div>
        <div style={{
          fontSize: 12,
          color: '#484f58',
          marginTop: 6,
          letterSpacing: 4
        }}>
          将心情凝固为永恒的雕塑
        </div>
      </div>

      <div style={{
        position: 'absolute',
        left: 24,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10
      }}>
        <MoodInputPanel
          selectedMood={selectedMood}
          onSelectMood={setSelectedMood}
          intensity={intensity}
          onIntensityChange={setIntensity}
          onGenerate={handleGenerate}
        />
      </div>

      <div style={{
        position: 'absolute',
        right: 24,
        top: 24,
        zIndex: 10
      }}>
        <DonutChart
          moodCounts={moodCounts}
          filterMood={filterMood}
          onFilter={setFilterMood}
        />
      </div>

      {focusedSculptureId && (
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          padding: '12px 24px',
          background: 'rgba(13, 17, 23, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 100,
          border: `1px solid ${MOOD_COLORS[sculptures.find(s => s.id === focusedSculptureId)?.mood || 'happy']}44`,
          color: '#8b949e',
          fontSize: 13,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'none'
        }}>
          ✨ 双击空白处返回全景
        </div>
      )}

      <Tooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        label={tooltip.label}
        date={tooltip.date}
        color={tooltip.color}
      />
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}

export default App;
