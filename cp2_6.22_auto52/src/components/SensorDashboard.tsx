import React, { useRef, useEffect, useState, useMemo } from 'react';

const ROOMS = [
  { id: 'living', label: '客厅 Living' },
  { id: 'bedroom', label: '卧室 Bedroom' },
  { id: 'kitchen', label: '厨房 Kitchen' },
  { id: 'bathroom', label: '卫生间 Bathroom' },
];

const SENSOR_META: Record<string, { label: string; icon: string; unit: string }> = {
  temperature: { label: '温度', icon: '🌡️', unit: '°C' },
  humidity: { label: '湿度', icon: '💧', unit: '%' },
  light: { label: '光照', icon: '☀️', unit: 'lux' },
};

type SensorKey = 'temperature' | 'humidity' | 'light';
const DEFAULT_SENSOR_ORDER: SensorKey[] = ['temperature', 'humidity', 'light'];

function formatTime(ts: number): string {
  if (!ts) return '--:--:--';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function getSensorGradient(sensorKey: SensorKey, value: number): string {
  if (sensorKey === 'temperature') {
    if (value < 18) return 'linear-gradient(135deg, #1a237e, #0d47a1)';
    if (value <= 28) return 'linear-gradient(135deg, #1b5e20, #2e7d32)';
    return 'linear-gradient(135deg, #b71c1c, #c62828)';
  }
  if (sensorKey === 'humidity') {
    if (value < 40) return 'linear-gradient(135deg, #ff8f00, #ff6f00)';
    if (value <= 70) return 'linear-gradient(135deg, #0277bd, #01579b)';
    return 'linear-gradient(135deg, #1565c0, #0d47a1)';
  }
  if (value < 200) return 'linear-gradient(135deg, #3e2723, #4e342e)';
  if (value <= 700) return 'linear-gradient(135deg, #f57f17, #ff8f00)';
  return 'linear-gradient(135deg, #f9a825, #fdd835)';
}

function drawChart(
  canvas: HTMLCanvasElement,
  historyData: { temperature: number[]; humidity: number[]; light: number[] }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const pad = { top: 30, right: 20, bottom: 30, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, w, h);

  const temp = historyData.temperature.slice(-100);
  const hum = historyData.humidity.slice(-100);
  const light = historyData.light.slice(-100);
  const len = Math.max(temp.length, hum.length, light.length);
  if (len === 0) return;

  const lines = [
    { data: temp, color: '#ff6b6b', label: 'Temp °C', max: 50, min: 0 },
    { data: hum, color: '#4ecdc4', label: 'Humidity %', max: 100, min: 0 },
    { data: light, color: '#ffe66d', label: 'Light', max: 1000, min: 0 },
  ];

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
  }

  for (const line of lines) {
    if (line.data.length === 0) continue;
    ctx.beginPath();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (let i = 0; i < line.data.length; i++) {
      const x = pad.left + (i / (len - 1 || 1)) * chartW;
      const ratio = (line.data[i] - line.min) / (line.max - line.min || 1);
      const y = pad.top + chartH - ratio * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  let legendX = pad.left + 8;
  const legendY = 16;
  for (const line of lines) {
    ctx.fillStyle = line.color;
    ctx.fillRect(legendX, legendY - 6, 12, 12);
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '11px sans-serif';
    ctx.fillText(line.label, legendX + 16, legendY + 4);
    legendX += ctx.measureText(line.label).width + 36;
  }
}

interface SensorDashboardProps {
  sensorData: any;
  historyData: any;
  onSelectRoom: (roomId: string) => void;
  selectedRoom: string | null;
}

const SensorDashboard: React.FC<SensorDashboardProps> = ({
  sensorData,
  historyData,
  onSelectRoom,
  selectedRoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRoomData = selectedRoom ? sensorData?.[selectedRoom] : null;
  const selectedHistory = selectedRoom ? historyData?.[selectedRoom] : null;

  const [roomOrderMap, setRoomOrderMap] = useState<Record<string, SensorKey[]>>(() => {
    const init: Record<string, SensorKey[]> = {};
    for (const r of ROOMS) init[r.id] = [...DEFAULT_SENSOR_ORDER];
    return init;
  });

  const [dragState, setDragState] = useState<{ roomId: string; idx: number } | null>(null);

  useEffect(() => {
    if (canvasRef.current && selectedHistory) {
      drawChart(canvasRef.current, selectedHistory);
    }
  }, [selectedHistory]);

  const handleDragStart = (roomId: string, idx: number) => {
    setDragState({ roomId, idx });
  };

  const handleDragOver = (e: React.DragEvent, roomId: string, idx: number) => {
    e.preventDefault();
    if (!dragState) return;
    if (dragState.roomId !== roomId) return;
    if (dragState.idx === idx) return;
    setRoomOrderMap((prev) => {
      const list = [...prev[roomId]];
      const [moved] = list.splice(dragState.idx, 1);
      list.splice(idx, 0, moved);
      return { ...prev, [roomId]: list };
    });
    setDragState({ roomId, idx });
  };

  const handleDragEnd = () => setDragState(null);

  const timestampByRoom = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of ROOMS) {
      map[r.id] = sensorData?.[r.id]?._timestamp ?? 0;
    }
    return map;
  }, [sensorData]);

  return (
    <div className="dashboard-layout">
      <div className="left-column" style={styles.leftColumn}>
        {ROOMS.map((room) => {
          const data = sensorData?.[room.id];
          const ts = timestampByRoom[room.id];
          const order = roomOrderMap[room.id] || DEFAULT_SENSOR_ORDER;
          const isSelected = selectedRoom === room.id;
          return (
            <div
              key={room.id}
              style={{
                ...styles.roomGroup,
                outline: isSelected ? '2px solid #e8b83a' : 'none',
              }}
              onClick={() => onSelectRoom(room.id)}
            >
              <div style={styles.groupHeader}>
                <h3 style={styles.groupTitle}>
                  <span style={styles.groupIcon}>🏠</span>
                  {room.label}
                </h3>
                <span style={styles.groupTimeStamp}>
                  🕒 {formatTime(ts)}
                </span>
              </div>

              <div className="sensors-grid" style={styles.sensorsGrid}>
                {order.map((sKey, idx) => {
                  const meta = SENSOR_META[sKey];
                  const value = data?.[sKey];
                  const displayVal = typeof value === 'number' ? value : '--';
                  const gradient = typeof value === 'number'
                    ? getSensorGradient(sKey, value)
                    : 'linear-gradient(135deg, #16213e, #0f3460)';
                  return (
                    <div
                      key={sKey}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(room.id, idx);
                      }}
                      onDragOver={(e) => {
                        e.stopPropagation();
                        handleDragOver(e, room.id, idx);
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                        handleDragEnd();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        ...styles.sensorCard,
                        background: gradient,
                        cursor: 'grab',
                        opacity: dragState?.roomId === room.id && dragState?.idx === idx ? 0.5 : 1,
                      }}
                    >
                      <div style={styles.sensorCardHeader}>
                        <span style={styles.sensorIcon}>{meta.icon}</span>
                        <span style={styles.sensorLabel}>{meta.label}</span>
                      </div>
                      <div style={styles.sensorValue}>
                        {displayVal}
                        <span style={styles.sensorUnit}>{meta.unit}</span>
                      </div>
                      <div style={styles.sensorTime}>
                        更新于 {formatTime(ts)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="right-column" style={styles.rightColumn}>
        {selectedRoom && selectedRoomData ? (
          <>
            <div style={styles.detailCard}>
              <h3 style={styles.detailTitle}>
                {ROOMS.find((r) => r.id === selectedRoom)?.label} · 实时详情
              </h3>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span>🌡️</span>
                  <span>温度</span>
                  <strong>{selectedRoomData.temperature}°C</strong>
                </div>
                <div style={styles.detailItem}>
                  <span>💧</span>
                  <span>湿度</span>
                  <strong>{selectedRoomData.humidity}%</strong>
                </div>
                <div style={styles.detailItem}>
                  <span>☀️</span>
                  <span>光照</span>
                  <strong>{selectedRoomData.light}</strong>
                </div>
              </div>
              <p style={styles.detailTime}>
                最后更新：{formatTime(selectedRoomData._timestamp)}
              </p>
            </div>

            <div style={styles.chartCard}>
              <h4 style={styles.chartTitle}>历史趋势（近100个采样点）</h4>
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: 220, borderRadius: 8 }}
              />
            </div>
          </>
        ) : (
          <div style={styles.placeholder}>
            <span style={{ fontSize: 48, opacity: 0.3 }}>📊</span>
            <p style={{ color: '#a0a0b0', marginTop: 12 }}>
              选择一个房间查看详情
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  leftColumn: {
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 120px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  roomGroup: {
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderRadius: 12,
    padding: '1rem 1.1rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: 'outline-color 0.3s ease',
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e8b83a',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  groupIcon: {
    fontSize: 18,
  },
  groupTimeStamp: {
    fontSize: 12,
    color: '#a0a0b0',
    fontFamily: 'monospace',
  },
  sensorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  sensorCard: {
    borderRadius: 10,
    padding: '0.75rem 0.75rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    transition: 'transform 0.25s ease, opacity 0.2s ease',
  },
  sensorCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  sensorIcon: {
    fontSize: 16,
  },
  sensorLabel: {
    fontSize: 12,
    color: '#e0e0e0',
    opacity: 0.85,
  },
  sensorValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: 0.5,
  },
  sensorUnit: {
    fontSize: 12,
    fontWeight: 400,
    marginLeft: 4,
    opacity: 0.8,
  },
  sensorTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  rightColumn: {
    overflowY: 'auto',
  },
  detailCard: {
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderRadius: 12,
    padding: '1.25rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  detailTitle: {
    fontSize: 17,
    marginBottom: 12,
    color: '#e8b83a',
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 15,
    color: '#e0e0e0',
  },
  detailTime: {
    marginTop: 12,
    fontSize: 12,
    color: '#a0a0b0',
    fontFamily: 'monospace',
  },
  chartCard: {
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderRadius: 12,
    padding: '1.25rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.06)',
    marginTop: '1.25rem',
  },
  chartTitle: {
    fontSize: 15,
    marginBottom: 8,
    color: '#e0e0e0',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.06)',
  },
};

export default SensorDashboard;
