import React, { useCallback, useState } from 'react';
import { Room, FilterRange, AnimationState } from './types';

interface ControlPanelProps {
  rooms: Room[];
  filterRange: FilterRange;
  animationState: AnimationState;
  filteredCount: number;
  totalCount: number;
  currentHour: number;
  onFilterChange: (range: FilterRange) => void;
  onAnimationStateChange: (state: AnimationState) => void;
  onHourChange: (hour: number) => void;
  onAddRoom: (room: Partial<Room>) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SliderTrack: React.FC<{
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  height?: number;
}> = ({ min, max, valueMin, valueMax, height = 4 }) => {
  const leftPct = ((valueMin - min) / (max - min)) * 100;
  const rightPct = ((valueMax - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', width: '100%', height, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
      <div
        style={{
          position: 'absolute',
          left: `${leftPct}%`,
          right: `${100 - rightPct}%`,
          top: 0,
          height: '100%',
          background: 'linear-gradient(90deg, #0066ff, #00cc88, #ffcc00, #ff3300)',
          borderRadius: 2,
        }}
      />
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  rooms,
  filterRange,
  animationState,
  filteredCount,
  totalCount,
  currentHour,
  onFilterChange,
  onAnimationStateChange,
  onHourChange,
  onAddRoom,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [newRoom, setNewRoom] = useState({
    name: '',
    x: 0, y: 0, z: 0,
    width: 4, depth: 4, height: 3,
    area: 16,
    floor: 1,
    temperature: 22,
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val <= filterRange.max) {
      onFilterChange({ min: val, max: filterRange.max });
    }
  }, [filterRange.max, onFilterChange]);

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val >= filterRange.min) {
      onFilterChange({ min: filterRange.min, max: val });
    }
  }, [filterRange.min, onFilterChange]);

  const handlePlayToggle = useCallback(() => {
    onAnimationStateChange({
      ...animationState,
      isPlaying: !animationState.isPlaying,
    });
  }, [animationState, onAnimationStateChange]);

  const handleSpeedChange = useCallback((speed: number) => {
    onAnimationStateChange({ ...animationState, speed });
  }, [animationState, onAnimationStateChange]);

  const handleHourSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onHourChange(Number(e.target.value));
  }, [onHourChange]);

  const handleSubmitRoom = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    onAddRoom(newRoom);
    setNewRoom({
      name: '', x: 0, y: 0, z: 0,
      width: 4, depth: 4, height: 3,
      area: 16, floor: 1, temperature: 22,
    });
    setShowAddForm(false);
  }, [newRoom, onAddRoom]);

  const hourStr = `${Math.floor(currentHour).toString().padStart(2, '0')}:00`;

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 280,
    height: '100%',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRight: '1px solid rgba(0, 212, 255, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isCollapsed ? 'translateX(-280px)' : 'translateX(0)',
    zIndex: 100,
    overflow: 'hidden',
  };

  const hamburgerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    left: isCollapsed ? 12 : 290,
    zIndex: 101,
    width: 36,
    height: 36,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#00d4ff',
    fontSize: 18,
    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: 'rgba(0, 212, 255, 0.7)',
    marginBottom: 10,
  };

  const btnStyle = (active: boolean = false): React.CSSProperties => ({
    background: active ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
    border: `1px solid ${active ? 'rgba(0, 212, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
    color: active ? '#00d4ff' : '#b0bcd0',
    padding: '6px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.2s ease',
  });

  return (
    <>
      <div style={hamburgerStyle} onClick={onToggleCollapse}>
        {isCollapsed ? '☰' : '✕'}
      </div>
      <div style={panelStyle}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#00d4ff', letterSpacing: 0.8 }}>
            热能分布
          </div>
          <div style={{ fontSize: 11, color: '#607090', marginTop: 4 }}>
            显示 {filteredCount} / {totalCount} 房间
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section>
            <div style={sectionTitle}>温度区间筛选</div>
            <SliderTrack min={0} max={50} valueMin={filterRange.min} valueMax={filterRange.max} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <input
                type="range"
                min={0}
                max={50}
                value={filterRange.min}
                onChange={handleMinChange}
                style={{ width: '45%' }}
              />
              <input
                type="range"
                min={0}
                max={50}
                value={filterRange.max}
                onChange={handleMaxChange}
                style={{ width: '45%' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#b0bcd0' }}>
              <span>{filterRange.min}°C</span>
              <span>{filterRange.max}°C</span>
            </div>
          </section>

          <section>
            <div style={sectionTitle}>时间轴 · {hourStr}</div>
            <input
              type="range"
              min={0}
              max={23.99}
              step={0.05}
              value={currentHour}
              onChange={handleHourSlider}
              style={{ width: '100%' }}
            />
            <div
              style={{
                width: '100%',
                height: 6,
                marginTop: 4,
                borderRadius: 3,
                background: 'linear-gradient(90deg, #0066ff, #00cc88, #ffcc00, #ff3300)',
                opacity: 0.5,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#506080', marginTop: 4 }}>
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <button style={btnStyle(animationState.isPlaying)} onClick={handlePlayToggle}>
                {animationState.isPlaying ? '⏸ 暂停' : '▶ 播放'}
              </button>
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  style={btnStyle(animationState.speed === s)}
                  onClick={() => handleSpeedChange(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </section>

          <section>
            <div style={sectionTitle}>房间列表</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
              {rooms.map((room) => {
                const temp = room.temperatures[Math.floor(currentHour)] ?? room.temperature;
                const inFilter = temp >= filterRange.min && temp <= filterRange.max;
                return (
                  <div
                    key={room.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 8px',
                      borderRadius: 6,
                      background: inFilter ? 'rgba(255,255,255,0.04)' : 'transparent',
                      opacity: inFilter ? 1 : 0.35,
                      transition: 'all 0.2s ease',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: inFilter ? '#e0e6f0' : '#607090' }}>{room.name}</span>
                    <span style={{ color: inFilter ? getTempColor(temp) : '#506080', fontWeight: 600 }}>
                      {temp.toFixed(1)}°C
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={sectionTitle}>添加房间</div>
              <button
                style={{ ...btnStyle(showAddForm), fontSize: 11, padding: '4px 10px' }}
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? '收起' : '+ 新增'}
              </button>
            </div>
            {showAddForm && (
              <form
                onSubmit={handleSubmitRoom}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  animation: 'fadeSlideIn 0.25s ease-out',
                }}
              >
                {[
                  { label: '名称', key: 'name' as const, type: 'text' },
                  { label: 'X', key: 'x' as const, type: 'number' },
                  { label: 'Y (楼层高度)', key: 'y' as const, type: 'number' },
                  { label: 'Z', key: 'z' as const, type: 'number' },
                  { label: '宽度', key: 'width' as const, type: 'number' },
                  { label: '深度', key: 'depth' as const, type: 'number' },
                  { label: '高度', key: 'height' as const, type: 'number' },
                  { label: '面积', key: 'area' as const, type: 'number' },
                  { label: '楼层', key: 'floor' as const, type: 'number' },
                  { label: '初始温度', key: 'temperature' as const, type: 'number' },
                ].map(({ label, key, type }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: 11, color: '#7090b0', width: 64, flexShrink: 0 }}>{label}</label>
                    <input
                      type={type}
                      value={newRoom[key]}
                      onChange={(e) => setNewRoom({ ...newRoom, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 4,
                        padding: '4px 8px',
                        color: '#e0e6f0',
                        fontSize: 12,
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  style={{
                    marginTop: 4,
                    background: 'rgba(0, 212, 255, 0.15)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    color: '#00d4ff',
                    padding: '8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  添加房间
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

function getTempColor(temp: number): string {
  const t = Math.max(0, Math.min(1, temp / 50));
  if (t < 0.25) return '#3388ff';
  if (t < 0.5) return '#00cc88';
  if (t < 0.75) return '#ffbb00';
  return '#ff4422';
}

export default ControlPanel;
